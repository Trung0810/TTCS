import os
import cv2
import torch
import torch.nn as nn
import torch.nn.functional as F
import argparse
import numpy as np
import math
import re

# ==========================================
# 1. HẰNG SỐ
# ==========================================
IMG_W = 224
IMG_H = 64
ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZĐ"

# ==========================================
# 2. MODULE: TRANSFORMATION (TPS)
# ==========================================
class LocalizationNetwork(nn.Module):
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

        # Init
        self.localization_fc2.weight.data.fill_(0)
        ctrl_pts_x = np.linspace(-1.0, 1.0, int(F_num / 2))
        ctrl_pts_y_top = np.linspace(0.0, -1.0, num=int(F_num / 2))
        ctrl_pts_y_bottom = np.linspace(1.0, 0.0, num=int(F_num / 2))
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
        if torch.__version__ >= '1.3.0':
            batch_I_r = F.grid_sample(batch_I, build_P_prime_reshape, padding_mode='border', align_corners=True)
        else:
            batch_I_r = F.grid_sample(batch_I, build_P_prime_reshape, padding_mode='border')
        return batch_I_r

# ==========================================
# 3. MODULE: FEATURE EXTRACTION (ResNet)
# ==========================================
class BasicBlock(nn.Module):
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
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)
        out = self.conv2(out)
        out = self.bn2(out)
        if self.downsample is not None:
            residual = self.downsample(x)
        out += residual
        out = self.relu(out)
        return out

class ResNet(nn.Module):
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
    def __init__(self, input_channel, output_channel=512):
        super(ResNet_FeatureExtractor, self).__init__()
        self.ConvNet = ResNet(input_channel, output_channel, BasicBlock, [1, 2, 5, 3])
    def forward(self, input):
        return self.ConvNet(input)

# ==========================================
# 4. MODULE: SEQUENCE MODELING (BiLSTM)
# ==========================================
class BidirectionalLSTM(nn.Module):
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

# ==========================================
# 5. TIỀN XỬ LÝ ẢNH & GIẢI MÃ (Từ file log/train)
# ==========================================
def resize_with_padding(img, target_w=IMG_W, target_h=IMG_H):
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
    if img is None or img.size == 0: return 0.0
    blur = cv2.GaussianBlur(img, (3, 3), 0)
    edges = cv2.Canny(blur, 60, 180)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 45, minLineLength=max(20, int(min(img.shape[:2]) * 0.35)), maxLineGap=10)
    if lines is None: return 0.0
    angles, weights = [], []
    for line in lines[:, 0, :]:
        x1, y1, x2, y2 = line
        dx, dy = float(x2 - x1), float(y2 - y1)
        length = float(np.hypot(dx, dy))
        if length < 8: continue
        angle = float(np.degrees(np.arctan2(dy, dx)))
        angle = angle + 180 if angle < -90 else (angle - 180 if angle > 90 else angle)
        if abs(angle) > 40: continue
        angles.append(angle)
        weights.append(length)
    return 0.0 if not angles else float(np.average(np.array(angles), weights=np.array(weights)))

def deskew_plate(img, max_abs_angle=25.0):
    if img is None or img.size == 0: return np.zeros((IMG_H, IMG_W), dtype=np.uint8)
    angle = estimate_skew_angle(img)
    if abs(angle) < 0.5 or abs(angle) > max_abs_angle: return img
    h, w = img.shape[:2]
    m = cv2.getRotationMatrix2D((w / 2.0, h / 2.0), angle, 1.0)
    return cv2.warpAffine(img, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=255)

def enhance_small_plate(img):
    if img is None or img.size == 0: return np.zeros((IMG_H, IMG_W), dtype=np.uint8)
    h, w = img.shape[:2]
    min_side, area = min(h, w), h * w
    if min_side >= 56 and area >= 5000: return img
    target_min_side = 80.0 if min_side < 32 else 64.0
    scale = float(np.clip(target_min_side / max(1.0, float(min_side)), 1.0, 4.0))
    up = cv2.resize(img, (max(1, int(round(w * scale))), max(1, int(round(h * scale)))), interpolation=cv2.INTER_LANCZOS4) if scale > 1.01 else img
    up = cv2.bilateralFilter(up, d=5, sigmaColor=20, sigmaSpace=20)
    blur = cv2.GaussianBlur(up, (0, 0), 0.8)
    return cv2.addWeighted(up, 1.12, blur, -0.12, 0)

def preprocess_tiny_plate(img):
    if img is None or img.size == 0: return np.zeros((IMG_H, IMG_W), dtype=np.uint8)
    h, w = img.shape[:2]
    if min(h, w) >= 40 and h * w >= 2500: return resize_with_padding(img, IMG_W, IMG_H)
    img = enhance_small_plate(img)
    if abs(estimate_skew_angle(img)) >= 6.0: img = deskew_plate(img)
    return resize_with_padding(img, IMG_W, IMG_H)

def preprocess_plate(img):
    if img is None or img.size == 0: return np.zeros((IMG_H, IMG_W), dtype=np.uint8)
    return preprocess_tiny_plate(img)

def vnm_plate_post_process(text):
    return re.sub(r"[^0-9A-ZĐ]", "", text.upper())

class LabelConverter:
    def __init__(self, alphabet):
        self.alphabet = alphabet
        self.char_to_dict = {c: i + 1 for i, c in enumerate(alphabet)}
        self.dict_to_char = {i + 1: c for i, c in enumerate(alphabet)}
        self.dict_to_char[0] = "-"

    def decode(self, res):
        if torch.is_tensor(res): res = res.tolist()
        out = []
        for i in range(len(res)):
            if res[i] != 0 and (i == 0 or res[i] != res[i - 1]):
                out.append(self.dict_to_char[res[i]])
        return "".join(out)

# ==========================================
# 6. MẠNG CRNN HOÀN CHỈNH
# ==========================================
class CRNN(nn.Module):
    def __init__(self, nclass):
        super().__init__()
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

# ==========================================
# 7. LOGIC CHẠY TEST
# ==========================================
def test(model_path, image_path):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Sử dụng thiết bị: {device}")

    converter = LabelConverter(ALPHABET)
    model = CRNN(len(ALPHABET) + 1).to(device)
    
    if not os.path.exists(model_path):
        print(f"LỖI: Không tìm thấy file model {model_path}!")
        return
        
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    print(f"Đã tải mô hình từ: {model_path}")

    if os.path.isfile(image_path):
        paths = [image_path]
    else:
        paths = [os.path.join(image_path, f) for f in os.listdir(image_path) 
                 if f.lower().endswith(('.png', '.jpg', '.jpeg'))]

    print(f"Đang xử lý {len(paths)} ảnh...\n" + "-"*40)

    with torch.no_grad():
        for p in paths:
            img = cv2.imread(p, cv2.IMREAD_GRAYSCALE)
            if img is None:
                print(f"Lỗi đọc ảnh: {p}")
                continue
            
            processed_img = preprocess_plate(img)
            img_tensor = processed_img.astype(np.float32) / 255.0
            img_tensor = torch.from_numpy(img_tensor).unsqueeze(0).unsqueeze(0)
            img_tensor = img_tensor.to(device)
            
            preds = model(img_tensor)
            pred_ids = preds.argmax(2)
            raw_text = converter.decode(pred_ids[0])
            final_text = vnm_plate_post_process(raw_text)
            
            print(f"Ảnh: {os.path.basename(p):<20} | Kết quả: {final_text}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", type=str, default=r"C:\Users\PC\visual_code\.cph\.vscode\content\train_tps\best_tps.pt", help="Đường dẫn file .pt")
    parser.add_argument("--input", type=str, default=r"C:\Users\PC\visual_code\.cph\.vscode\content\images", required=True, help="Đường dẫn ảnh hoặc thư mục")
    args = parser.parse_args()
    
    test(args.weights, args.input)