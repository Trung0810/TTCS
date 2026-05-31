"""
================================================================================
                    LPR SYSTEM - PRODUCTION BACKEND (FastAPI)
    License Plate Recognition with YOLO Detection + CRNN Recognition
================================================================================
Author: AI Full-Stack Engineer
Date: June 2025
Features:
  - Real-time image & video processing
  - YOLO v11 license plate detection
  - CRNN character recognition with TPS transformation
  - Feedback mechanism for model improvement
  - RESTful API with comprehensive error handling
  - Supports multiple plates per image
================================================================================
"""

import os
import sys
import json
import time
import cv2
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import math
import re
import base64
import logging
from io import BytesIO
from typing import Optional, List, Dict, Any
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import uvicorn

# ==================================================================================
# LOGGING CONFIGURATION
# ==================================================================================
# Ensure console uses UTF-8 on Windows to avoid encoding errors when logging
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

# Configure logging explicitly so we can set file encoding and use the
# UTF-8-reconfigured stdout stream for console output.
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
file_handler = logging.FileHandler('lpr_backend.log', encoding='utf-8')
stream_handler = logging.StreamHandler(stream=sys.stdout)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)
logger.addHandler(file_handler)
logger.addHandler(stream_handler)

# ==================================================================================
# CONSTANTS
# ==================================================================================
IMG_W, IMG_H = 224, 64
ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZĐ"
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_DIR = Path(__file__).parent
FEEDBACK_LOG_PATH = MODEL_DIR / "feedback_logs.json"

logger.info(f"Using device: {DEVICE}")

# ==================================================================================
# CRNN COMPONENTS (from testCRNN.py)
# ==================================================================================

class LocalizationNetwork(nn.Module):
    """TPS transformation localization network"""
    def __init__(self, F_num, I_channel_num):
        super(LocalizationNetwork, self).__init__()
        self.F_num = F_num
        self.conv = nn.Sequential(
            nn.Conv2d(I_channel_num, 64, kernel_size=3, stride=1, padding=1, bias=False), nn.BatchNorm2d(64), nn.ReLU(True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1, bias=False), nn.BatchNorm2d(128), nn.ReLU(True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(128, 256, kernel_size=3, stride=1, padding=1, bias=False), nn.BatchNorm2d(256), nn.ReLU(True),
            nn.MaxPool2d(2, 2),
            nn.Conv2d(256, 512, kernel_size=3, stride=1, padding=1, bias=False), nn.BatchNorm2d(512), nn.ReLU(True),
            nn.AdaptiveAvgPool2d(1)
        )
        self.localization_fc1 = nn.Sequential(nn.Linear(512, 256), nn.ReLU(True))
        self.localization_fc2 = nn.Linear(256, self.F_num * 2)
        self._init_weights()

    def _init_weights(self):
        self.localization_fc2.weight.data.fill_(0)
        ctrl_pts_x = np.linspace(-1.0, 1.0, int(self.F_num / 2))
        ctrl_pts_y_top = np.linspace(0.0, -1.0, num=int(self.F_num / 2))
        ctrl_pts_y_bottom = np.linspace(1.0, 0.0, num=int(self.F_num / 2))
        ctrl_pts_top = np.stack([ctrl_pts_x, ctrl_pts_y_top], axis=1)
        ctrl_pts_bottom = np.stack([ctrl_pts_x, ctrl_pts_y_bottom], axis=1)
        initial_bias = np.concatenate([ctrl_pts_top, ctrl_pts_bottom], axis=0)
        self.localization_fc2.bias.data = torch.from_numpy(initial_bias).float().view(-1)

    def forward(self, batch_I):
        batch_size = batch_I.size(0)
        features = self.conv(batch_I).view(batch_size, -1)
        batch_C_prime = self.localization_fc2(self.localization_fc1(features)).view(batch_size, self.F_num, 2)
        return batch_C_prime


class GridGenerator(nn.Module):
    """TPS grid generation"""
    def __init__(self, F_num, I_r_size):
        super(GridGenerator, self).__init__()
        self.eps = 1e-6
        self.I_r_height, self.I_r_width = I_r_size
        self.F_num = F_num
        self.C = self._build_C(self.F_num)
        self.P = self._build_P(self.I_r_width, self.I_r_height)
        self.register_buffer("inv_delta_C", torch.tensor(self._build_inv_delta_C(self.F_num, self.C)).float())
        self.register_buffer("P_hat", torch.tensor(self._build_P_hat(self.F_num, self.C, self.P)).float())

    def _build_C(self, F_num):
        ctrl_pts_x = np.linspace(-1.0, 1.0, int(F_num / 2))
        ctrl_pts_y_top = -1 * np.ones(int(F_num / 2))
        ctrl_pts_y_bottom = np.ones(int(F_num / 2))
        ctrl_pts_top = np.stack([ctrl_pts_x, ctrl_pts_y_top], axis=1)
        ctrl_pts_bottom = np.stack([ctrl_pts_x, ctrl_pts_y_bottom], axis=1)
        return np.concatenate([ctrl_pts_top, ctrl_pts_bottom], axis=0)

    def _build_inv_delta_C(self, F_num, C):
        hat_C = np.zeros((F_num, F_num), dtype=float)
        for i in range(0, F_num):
            for j in range(i, F_num):
                r = np.linalg.norm(C[i] - C[j])
                hat_C[i, j] = r
                hat_C[j, i] = r
        np.fill_diagonal(hat_C, 1)
        hat_C = (hat_C ** 2) * np.log(hat_C)
        delta_C = np.concatenate([
            np.concatenate([np.ones((F_num, 1)), C, hat_C], axis=1),
            np.concatenate([np.zeros((2, 3)), np.transpose(C)], axis=1),
            np.concatenate([np.zeros((1, 3)), np.ones((1, F_num))], axis=1)
        ], axis=0)
        return np.linalg.inv(delta_C)

    def _build_P(self, I_r_width, I_r_height):
        I_r_grid_x = (np.arange(-I_r_width, I_r_width, 2) + 1.0) / I_r_width
        I_r_grid_y = (np.arange(-I_r_height, I_r_height, 2) + 1.0) / I_r_height
        P = np.stack(np.meshgrid(I_r_grid_x, I_r_grid_y), axis=2)
        return P.reshape([-1, 2])

    def _build_P_hat(self, F_num, C, P):
        n = P.shape[0]
        P_tile = np.tile(np.expand_dims(P, axis=1), (1, F_num, 1))
        C_tile = np.expand_dims(C, axis=0)
        P_diff = P_tile - C_tile
        rbf_norm = np.linalg.norm(P_diff, ord=2, axis=2, keepdims=False)
        rbf = np.multiply(np.square(rbf_norm), np.log(rbf_norm + self.eps))
        return np.concatenate([np.ones((n, 1)), P, rbf], axis=1)

    def build_P_prime(self, batch_C_prime):
        batch_size = batch_C_prime.size(0)
        batch_inv_delta_C = self.inv_delta_C.repeat(batch_size, 1, 1)
        batch_theta = torch.bmm(batch_inv_delta_C, torch.cat([batch_C_prime, torch.zeros(batch_size, 3, 2).float().to(batch_C_prime.device)], dim=1))
        batch_P_hat = self.P_hat.repeat(batch_size, 1, 1)
        return torch.bmm(batch_P_hat, batch_theta)


class TPS_SpatialTransformerNetwork(nn.Module):
    """TPS spatial transformer"""
    def __init__(self, F, I_size, I_r_size, I_channel_num=1):
        super(TPS_SpatialTransformerNetwork, self).__init__()
        self.F = F
        self.I_size = I_size
        self.I_r_size = I_r_size
        self.I_channel_num = I_channel_num
        self.LocalizationNetwork = LocalizationNetwork(self.F, self.I_channel_num)
        self.GridGenerator = GridGenerator(self.F, self.I_r_size)

    def forward(self, batch_I):
        batch_C_prime = self.LocalizationNetwork(batch_I)
        build_P_prime = self.GridGenerator.build_P_prime(batch_C_prime)
        build_P_prime_reshape = build_P_prime.reshape([build_P_prime.size(0), self.I_r_size[0], self.I_r_size[1], 2])
        batch_I_r = F.grid_sample(batch_I, build_P_prime_reshape, padding_mode='border', align_corners=True)
        return batch_I_r


class BasicBlock(nn.Module):
    """ResNet BasicBlock"""
    expansion = 1
    def __init__(self, inplanes, planes, stride=1, downsample=None):
        super(BasicBlock, self).__init__()
        self.conv1 = nn.Conv2d(inplanes, planes, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(planes)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = nn.Conv2d(planes, planes, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(planes)
        self.downsample = downsample
        self.stride = stride

    def forward(self, x):
        residual = x
        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        if self.downsample is not None:
            residual = self.downsample(x)
        out += residual
        return self.relu(out)


class ResNet(nn.Module):
    """ResNet feature extractor"""
    def __init__(self, input_channel, output_channel, block, layers):
        super(ResNet, self).__init__()
        self.output_channel_block = [int(output_channel / 4), int(output_channel / 2), output_channel, output_channel]
        self.inplanes = int(output_channel / 8)
        self.conv0_1 = nn.Conv2d(input_channel, int(output_channel / 16), kernel_size=3, stride=1, padding=1, bias=False)
        self.bn0_1 = nn.BatchNorm2d(int(output_channel / 16))
        self.conv0_2 = nn.Conv2d(int(output_channel / 16), self.inplanes, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn0_2 = nn.BatchNorm2d(self.inplanes)
        self.relu = nn.ReLU(inplace=True)

        self.maxpool1 = nn.MaxPool2d(kernel_size=2, stride=2, padding=0)
        self.layer1 = self._make_layer(block, self.output_channel_block[0], layers[0])
        self.conv1 = nn.Conv2d(self.output_channel_block[0], self.output_channel_block[0], kernel_size=3, stride=1, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(self.output_channel_block[0])

        self.maxpool2 = nn.MaxPool2d(kernel_size=2, stride=2, padding=0)
        self.layer2 = self._make_layer(block, self.output_channel_block[1], layers[1], stride=1)
        self.conv2 = nn.Conv2d(self.output_channel_block[1], self.output_channel_block[1], kernel_size=3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(self.output_channel_block[1])

        self.maxpool3 = nn.MaxPool2d(kernel_size=2, stride=(2, 1), padding=(0, 1))
        self.layer3 = self._make_layer(block, self.output_channel_block[2], layers[2], stride=1)
        self.conv3 = nn.Conv2d(self.output_channel_block[2], self.output_channel_block[2], kernel_size=3, stride=1, padding=1, bias=False)
        self.bn3 = nn.BatchNorm2d(self.output_channel_block[2])

        self.layer4 = self._make_layer(block, self.output_channel_block[3], layers[3], stride=1)
        self.conv4_1 = nn.Conv2d(self.output_channel_block[3], self.output_channel_block[3], kernel_size=2, stride=(2, 1), padding=(0, 1), bias=False)
        self.bn4_1 = nn.BatchNorm2d(self.output_channel_block[3])
        self.conv4_2 = nn.Conv2d(self.output_channel_block[3], self.output_channel_block[3], kernel_size=2, stride=1, padding=0, bias=False)
        self.bn4_2 = nn.BatchNorm2d(self.output_channel_block[3])

    def _make_layer(self, block, planes, blocks, stride=1):
        downsample = None
        if stride != 1 or self.inplanes != planes * block.expansion:
            downsample = nn.Sequential(
                nn.Conv2d(self.inplanes, planes * block.expansion, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(planes * block.expansion),
            )
        layers = []
        layers.append(block(self.inplanes, planes, stride, downsample))
        self.inplanes = planes * block.expansion
        for _ in range(1, blocks):
            layers.append(block(self.inplanes, planes))
        return nn.Sequential(*layers)

    def forward(self, x):
        x = self.relu(self.bn0_2(self.conv0_2(self.relu(self.bn0_1(self.conv0_1(x))))))
        x = self.relu(self.bn1(self.conv1(self.layer1(self.maxpool1(x)))))
        x = self.relu(self.bn2(self.conv2(self.layer2(self.maxpool2(x)))))
        x = self.relu(self.bn3(self.conv3(self.layer3(self.maxpool3(x)))))
        x = self.relu(self.bn4_2(self.conv4_2(self.relu(self.bn4_1(self.conv4_1(self.layer4(x)))))))
        return x


class ResNet_FeatureExtractor(nn.Module):
    """ResNet feature extraction wrapper"""
    def __init__(self, input_channel, output_channel=512):
        super(ResNet_FeatureExtractor, self).__init__()
        self.ConvNet = ResNet(input_channel, output_channel, BasicBlock, [1, 2, 5, 3])

    def forward(self, input):
        return self.ConvNet(input)


class BidirectionalLSTM(nn.Module):
    """BiLSTM sequence modeling"""
    def __init__(self, input_size, hidden_size, output_size):
        super(BidirectionalLSTM, self).__init__()
        self.rnn = nn.LSTM(input_size, hidden_size, bidirectional=True, batch_first=True)
        self.linear = nn.Linear(hidden_size * 2, output_size)

    def forward(self, input):
        self.rnn.flatten_parameters()
        recurrent, _ = self.rnn(input)
        t_rec = recurrent.contiguous().view(-1, recurrent.size(2))
        output = self.linear(t_rec)
        output = output.view(recurrent.size(0), recurrent.size(1), -1)
        return output


class CRNN(nn.Module):
    """Complete CRNN architecture"""
    def __init__(self, nclass):
        super(CRNN, self).__init__()
        self.transformation = TPS_SpatialTransformerNetwork(
            F=20, I_size=(IMG_H, IMG_W), I_r_size=(IMG_H, IMG_W), I_channel_num=1
        )
        self.feature_extraction = ResNet_FeatureExtractor(input_channel=1, output_channel=512)
        self.adaptive_pool = nn.AdaptiveAvgPool2d((None, 1))
        self.sequence_modeling = nn.Sequential(
            BidirectionalLSTM(512, 256, 256),
            BidirectionalLSTM(256, 256, 256)
        )
        self.dropout_fc = nn.Dropout(0.3)
        self.fc = nn.Linear(256, nclass)

    def forward(self, x):
        x = self.transformation(x)
        x = self.feature_extraction(x)
        x = self.adaptive_pool(x.permute(0, 3, 1, 2)).squeeze(3)
        x = self.sequence_modeling(x)
        x = self.dropout_fc(x)
        return self.fc(x)


class LabelConverter:
    """Convert between text and CTC indices"""
    def __init__(self, alphabet):
        self.alphabet = alphabet
        self.char_to_dict = {c: i + 1 for i, c in enumerate(alphabet)}
        self.dict_to_char = {i + 1: c for i, c in enumerate(alphabet)}
        self.dict_to_char[0] = "-"

    def decode(self, res):
        if torch.is_tensor(res):
            res = res.tolist()
        out = []
        for i in range(len(res)):
            if res[i] != 0 and (i == 0 or res[i] != res[i - 1]):
                out.append(self.dict_to_char[res[i]])
        return "".join(out)

    def encode(self, text):
        return [self.char_to_dict.get(c, 0) for c in text]


# ==================================================================================
# IMAGE PREPROCESSING
# ==================================================================================

def resize_with_padding(img, target_w=IMG_W, target_h=IMG_H):
    """Resize image with padding to target dimensions"""
    if img is None or img.size == 0:
        return np.zeros((target_h, target_w), dtype=np.uint8)
    h, w = img.shape[:2]
    if h <= 0 or w <= 0:
        return np.zeros((target_h, target_w), dtype=np.uint8)
    scale = min(target_w / w, target_h / h)
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    canvas = np.full((target_h, target_w), 255, dtype=np.uint8)
    x0, y0 = (target_w - new_w) // 2, (target_h - new_h) // 2
    canvas[y0:y0 + new_h, x0:x0 + new_w] = resized
    return canvas


def estimate_skew_angle(img):
    """Estimate skew angle using Hough lines"""
    if img is None or img.size == 0:
        return 0.0
    blur = cv2.GaussianBlur(img, (3, 3), 0)
    edges = cv2.Canny(blur, 60, 180)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 45,
                            minLineLength=max(20, int(min(img.shape[:2]) * 0.35)),
                            maxLineGap=10)
    if lines is None:
        return 0.0
    angles, weights = [], []
    for line in lines[:, 0, :]:
        x1, y1, x2, y2 = line
        dx, dy = float(x2 - x1), float(y2 - y1)
        length = float(np.hypot(dx, dy))
        if length < 8:
            continue
        angle = float(np.degrees(np.arctan2(dy, dx)))
        angle = angle + 180 if angle < -90 else (angle - 180 if angle > 90 else angle)
        if abs(angle) > 40:
            continue
        angles.append(angle)
        weights.append(length)
    return 0.0 if not angles else float(np.average(np.array(angles), weights=np.array(weights)))


def deskew_plate(img, max_abs_angle=25.0):
    """Deskew plate image"""
    if img is None or img.size == 0:
        return np.zeros((IMG_H, IMG_W), dtype=np.uint8)
    angle = estimate_skew_angle(img)
    if abs(angle) < 0.5 or abs(angle) > max_abs_angle:
        return img
    h, w = img.shape[:2]
    m = cv2.getRotationMatrix2D((w / 2.0, h / 2.0), angle, 1.0)
    return cv2.warpAffine(img, m, (w, h), flags=cv2.INTER_CUBIC,
                         borderMode=cv2.BORDER_CONSTANT, borderValue=255)


def enhance_small_plate(img):
    """Enhance small plate images"""
    if img is None or img.size == 0:
        return np.zeros((IMG_H, IMG_W), dtype=np.uint8)
    h, w = img.shape[:2]
    min_side, area = min(h, w), h * w
    if min_side >= 56 and area >= 5000:
        return img
    target_min_side = 80.0 if min_side < 32 else 64.0
    scale = float(np.clip(target_min_side / max(1.0, float(min_side)), 1.0, 4.0))
    up = cv2.resize(img, (max(1, int(round(w * scale))), max(1, int(round(h * scale)))),
                    interpolation=cv2.INTER_LANCZOS4) if scale > 1.01 else img
    up = cv2.bilateralFilter(up, d=5, sigmaColor=20, sigmaSpace=20)
    blur = cv2.GaussianBlur(up, (0, 0), 0.8)
    return cv2.addWeighted(up, 1.12, blur, -0.12, 0)


def preprocess_plate(img):
    """Full plate preprocessing pipeline"""
    if img is None or img.size == 0:
        return np.zeros((IMG_H, IMG_W), dtype=np.uint8)
    h, w = img.shape[:2]
    if min(h, w) >= 40 and h * w >= 2500:
        return resize_with_padding(img, IMG_W, IMG_H)
    img = enhance_small_plate(img)
    if abs(estimate_skew_angle(img)) >= 6.0:
        img = deskew_plate(img)
    return resize_with_padding(img, IMG_W, IMG_H)


def vnm_plate_post_process(text):
    """Post-process recognized text"""
    return re.sub(r"[^0-9A-ZĐ]", "", text.upper())


# ==================================================================================
# MODEL INITIALIZATION
# ==================================================================================

class ModelManager:
    """Centralized model management with multi-plate detection"""
    def __init__(self):
        self.yolo_model = None
        self.crnn_model = None
        self.converter = None
        self.initialize_models()

    def initialize_models(self):
        """Load YOLO and CRNN models"""
        try:
            # Load YOLO model
            from ultralytics import YOLO
            yolo_path = MODEL_DIR / "yolov11_detection.pt"
            if yolo_path.exists():
                try:
                    self.yolo_model = YOLO(str(yolo_path))
                    logger.info("✓ YOLO model loaded successfully")
                except AttributeError as ae:
                    logger.exception("YOLO model load failed (possible ultralytics version mismatch): %s", ae)
                    logger.error(
                        "The YOLO weights appear to be incompatible with the installed ultralytics package.\n"
                        "Possible fixes:\n"
                        "  1) Install a compatible ultralytics version, e.g.: pip install ultralytics==8.3.0\n"
                        "  2) Re-download the model weights that match your ultralytics version.\n"
                        "  3) If you built the weights yourself, re-export them using your current ultralytics release."
                    )
                    self.yolo_model = None
                except Exception as e:
                    logger.exception("Unexpected error loading YOLO model: %s", e)
                    self.yolo_model = None
            else:
                logger.warning(f"YOLO model not found at {yolo_path}")

            # Load CRNN model
            crnn_path = MODEL_DIR / "crnn_recognition.pt"
            self.converter = LabelConverter(ALPHABET)
            self.crnn_model = CRNN(len(ALPHABET) + 1).to(DEVICE)

            if crnn_path.exists():
                self.crnn_model.load_state_dict(torch.load(str(crnn_path), map_location=DEVICE))
                logger.info("✓ CRNN model loaded successfully")
            else:
                logger.warning(f"⚠ CRNN model not found at {crnn_path}")

            self.crnn_model.eval()
        except Exception as e:
            logger.exception("Error initializing models: %s", e)
            raise

    def detect_plate(self, image_cv2, conf=0.5, iou=0.5, augment=True):
        """
        Detect license plates using YOLO.
        
        Args:
            image_cv2: Input image (BGR numpy array)
            conf: Confidence threshold
            iou: IoU threshold for NMS
            augment: Test-time augmentation
        
        Returns:
            List of detections, each as dict with keys: 'bbox' (x1,y1,x2,y2), 'confidence'
            Returns empty list if no plates detected or YOLO not available.
        """
        if self.yolo_model is None:
            return []
        try:
            results = self.yolo_model(image_cv2, conf=conf, iou=iou, augment=augment)
            if len(results) > 0 and len(results[0].boxes) > 0:
                boxes = results[0].boxes
                detections = []
                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    conf = float(box.conf[0])
                    detections.append({"bbox": (x1, y1, x2, y2), "confidence": conf})
                # Sort by confidence descending
                detections.sort(key=lambda x: x["confidence"], reverse=True)
                return detections
            return []
        except Exception as e:
            logger.error(f"YOLO detection error: {e}")
            return []

    def recognize_plate(self, plate_img):
        """Recognize characters using CRNN on a single cropped plate."""
        if self.crnn_model is None:
            return None, 0.0
        try:
            preprocessed = preprocess_plate(plate_img)
            img_tensor = preprocessed.astype(np.float32) / 255.0
            img_tensor = torch.from_numpy(img_tensor).unsqueeze(0).unsqueeze(0).to(DEVICE)
            with torch.no_grad():
                preds = self.crnn_model(img_tensor)
                pred_ids = preds.argmax(2)
                raw_text = self.converter.decode(pred_ids[0])
                final_text = vnm_plate_post_process(raw_text)
                probs = torch.softmax(preds, dim=2)
                max_probs = probs.max(dim=2)[0]
                confidence = float(max_probs.mean().cpu().numpy()) * 100
                return final_text, confidence
        except Exception as e:
            logger.error(f"CRNN recognition error: {e}")
            return None, 0.0


# ==================================================================================
# PYDANTIC MODELS
# ==================================================================================

class ScanImageRequest(BaseModel):
    image_base64: str
    filename: str = "unknown"

class ScanImageResponse(BaseModel):
    status: str
    plate: str
    confidence: float
    processing_time_ms: float
    original_image_base64: str
    cropped_plate_base64: str
    bbox: Dict[str, int]
    timestamp: str
    # Optional: add field for multiple plates if needed, but keep backward compatibility
    additional_plates: Optional[List[Dict[str, Any]]] = None

class ScanVideoRequest(BaseModel):
    video_base64: str
    filename: str = "unknown"

class ScanVideoResponse(BaseModel):
    status: str
    discovered_plates: List[Dict[str, Any]]
    total_frames: int
    processing_time_ms: float
    timestamp: str

class FeedbackRequest(BaseModel):
    scan_id: str
    system_detected: str
    corrected_text: str
    error_type: str
    notes: str = ""
    confidence: float

class HealthResponse(BaseModel):
    status: str
    yolo_loaded: bool
    crnn_loaded: bool
    device: str
    timestamp: str


# ==================================================================================
# FASTAPI APPLICATION
# ==================================================================================

app = FastAPI(
    title="LPR Backend API",
    description="License Plate Recognition System - AI Powered Backend",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
models = ModelManager()


# ==================================================================================
# API ENDPOINTS
# ==================================================================================

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """System health check"""
    return HealthResponse(
        status="healthy",
        yolo_loaded=models.yolo_model is not None,
        crnn_loaded=models.crnn_model is not None,
        device=str(DEVICE),
        timestamp=datetime.now().isoformat()
    )


@app.post("/api/scan-image", response_model=ScanImageResponse)
async def scan_image(request: ScanImageRequest):
    """
    Scan single image for license plates.
    Returns the highest confidence plate (primary) and optionally additional plates.
    """
    start_time = time.time()

    try:
        # Decode image
        img_data = base64.b64decode(request.image_base64)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image data")

        # Detect plates (returns list)
        detections = models.detect_plate(img)
        if not detections:  # empty list or None
            return ScanImageResponse(
                status="no_plate_detected",
                plate="",
                confidence=0.0,
                processing_time_ms=round((time.time() - start_time) * 1000, 2),
                original_image_base64=request.image_base64,
                cropped_plate_base64="",
                bbox={},
                timestamp=datetime.now().isoformat(),
                additional_plates=[]
            )

        # Process all detected plates
        plates_info = []
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            cropped = img[y1:y2, x1:x2]
            gray_plate = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
            text, conf = models.recognize_plate(gray_plate)
            plates_info.append({
                "plate": text if text else "",
                "confidence": conf,
                "bbox": {"x": x1, "y": y1, "width": x2 - x1, "height": y2 - y1}
            })

        # Primary plate: highest confidence
        primary = plates_info[0]
        # Additional plates (excluding primary if exists)
        additional = plates_info[1:] if len(plates_info) > 1 else []

        # Encode cropped plate of primary detection
        x1, y1, x2, y2 = detections[0]["bbox"]
        cropped_plate = img[y1:y2, x1:x2]
        _, plate_buffer = cv2.imencode('.jpg', cropped_plate)
        cropped_plate_base64 = base64.b64encode(plate_buffer).decode()

        # Draw bounding box on original image (draw all detected plates)
        annotated_img = img.copy()
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        # Put primary plate text above its bounding box
        px1, py1, px2, py2 = detections[0]["bbox"]
        cv2.putText(annotated_img, f"{primary['plate']} {primary['confidence']:.1f}%",
                   (px1, py1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        _, img_buffer = cv2.imencode('.jpg', annotated_img)
        annotated_img_base64 = base64.b64encode(img_buffer).decode()

        processing_time = round((time.time() - start_time) * 1000, 2)

        return ScanImageResponse(
            status="success",
            plate=primary['plate'] if primary['plate'] else "",
            confidence=primary['confidence'],
            processing_time_ms=processing_time,
            original_image_base64=annotated_img_base64,
            cropped_plate_base64=cropped_plate_base64,
            bbox=primary['bbox'],
            timestamp=datetime.now().isoformat(),
            additional_plates=additional
        )

    except Exception as e:
        logger.error(f"Image scan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scan-video-file", response_model=ScanVideoResponse)
async def scan_video_file(request: ScanVideoRequest, background_tasks: BackgroundTasks):
    """
    Process video file for license plates.
    Detects multiple plates per frame and records unique plates across video.
    """
    start_time = time.time()

    try:
        # Decode video
        video_data = base64.b64decode(request.video_base64)
        video_path = MODEL_DIR / f"temp_{int(time.time())}.mp4"
        with open(video_path, "wb") as f:
            f.write(video_data)

        # Process video
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Invalid video file")

        discovered_plates = []
        frame_count = 0
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

        # For tracking unique plates (simple text matching)
        seen_plates = set()

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            # Process every 5th frame for efficiency
            if frame_count % 5 == 0:
                detections = models.detect_plate(frame)
                for det in detections:
                    x1, y1, x2, y2 = det["bbox"]
                    cropped_plate = frame[y1:y2, x1:x2]
                    gray_plate = cv2.cvtColor(cropped_plate, cv2.COLOR_BGR2GRAY)
                    plate_text, confidence = models.recognize_plate(gray_plate)

                    if plate_text and plate_text not in seen_plates:
                        seen_plates.add(plate_text)
                        timestamp_sec = frame_count / fps
                        discovered_plates.append({
                            "plate": plate_text,
                            "confidence": round(confidence, 2),
                            "frame": frame_count,
                            "timestamp": f"{int(timestamp_sec // 60):02d}:{int(timestamp_sec % 60):02d}",
                            "bbox": {"x": x1, "y": y1, "width": x2 - x1, "height": y2 - y1}
                        })

        cap.release()
        background_tasks.add_task(os.unlink, str(video_path))

        processing_time = round((time.time() - start_time) * 1000, 2)

        return ScanVideoResponse(
            status="success",
            discovered_plates=discovered_plates,
            total_frames=frame_count,
            processing_time_ms=processing_time,
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        logger.error(f"Video scan error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/feedback")
async def submit_feedback(request: FeedbackRequest):
    """
    Submit feedback for model improvement
    - Logs user corrections
    - Stores error patterns for training
    """
    try:
        # Load existing feedback
        if FEEDBACK_LOG_PATH.exists():
            with open(FEEDBACK_LOG_PATH, "r", encoding="utf-8") as f:
                feedback_list = json.load(f)
        else:
            feedback_list = []

        # Add new feedback
        feedback_entry = {
            "id": f"FB-{len(feedback_list) + 1:04d}",
            "scan_id": request.scan_id,
            "system_detected": request.system_detected,
            "corrected_text": request.corrected_text,
            "error_type": request.error_type,
            "notes": request.notes,
            "confidence": request.confidence,
            "submitted_at": datetime.now().isoformat(),
            "status": "pending"
        }

        feedback_list.append(feedback_entry)

        # Save feedback
        with open(FEEDBACK_LOG_PATH, "w", encoding="utf-8") as f:
            json.dump(feedback_list, f, indent=2, ensure_ascii=False)

        logger.info(f"Feedback recorded: {feedback_entry['id']}")

        return {
            "status": "success",
            "feedback_id": feedback_entry["id"],
            "message": "Thank you for your feedback!"
        }

    except Exception as e:
        logger.error(f"Feedback submission error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/feedback-stats")
async def get_feedback_stats():
    """Get feedback statistics"""
    try:
        if not FEEDBACK_LOG_PATH.exists():
            return {"total_feedback": 0, "pending": 0, "approved": 0, "error_patterns": {}}

        with open(FEEDBACK_LOG_PATH, "r", encoding="utf-8") as f:
            feedback_list = json.load(f)

        error_counts = {}
        for fb in feedback_list:
            error_type = fb.get("error_type", "Unknown")
            error_counts[error_type] = error_counts.get(error_type, 0) + 1

        pending = sum(1 for fb in feedback_list if fb.get("status") == "pending")
        approved = sum(1 for fb in feedback_list if fb.get("status") == "approved")

        return {
            "total_feedback": len(feedback_list),
            "pending": pending,
            "approved": approved,
            "error_patterns": error_counts
        }

    except Exception as e:
        logger.error(f"Error getting feedback stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================================================================================
# STARTUP & SHUTDOWN
# ==================================================================================

@app.on_event("startup")
async def startup_event():
    logger.info("=" * 80)
    logger.info("LPR Backend API Starting Up...")
    logger.info("=" * 80)
    logger.info(f"Device: {DEVICE}")
    logger.info(f"YOLO Model: {'✓ Loaded' if models.yolo_model else '✗ Not Found'}")
    logger.info(f"CRNN Model: {'✓ Loaded' if models.crnn_model else '✗ Not Found'}")
    logger.info("Multi-plate detection: ENABLED")
    logger.info("=" * 80)


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("LPR Backend API Shutting Down...")


# ==================================================================================
# RUN
# ==================================================================================

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )