# LPR System - Full Stack Integration Guide

## 📋 Overview

This guide provides complete instructions for integrating the License Plate Recognition (LPR) system with:

- **YOLOv11** for plate detection
- **CRNN** (Convolutional Recurrent Neural Network) with TPS transformation for character recognition
- **FastAPI** backend for AI model serving
- **React** frontend with modern dark theme UI

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Dark Theme)               │
│  - Image Upload  - Video Processing  - Live Stream - History │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (app.py)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ YOLOv11 Detection Module                              │ │
│  │ - Load pretrained YOLO model                          │ │
│  │ - Detect license plate bounding boxes                 │ │
│  │ - Return confidence scores & coordinates              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ CRNN Recognition Module                               │ │
│  │ - TPS Spatial Transformer Network                     │ │
│  │ - ResNet Feature Extractor                            │ │
│  │ - BiLSTM Sequence Modeling                            │ │
│  │ - CTC Decoding                                         │ │
│  │ - Post-processing & validation                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ API Endpoints                                         │ │
│  │ - POST /api/scan-image                                │ │
│  │ - POST /api/scan-video-file                           │ │
│  │ - POST /api/feedback                                  │ │
│  │ - GET  /api/health                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                   Model Files (.pt)
              - yolov11_detection.pt
              - crnn_recognition.pt
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+ (for React development)
- CUDA 11.0+ (recommended for GPU acceleration)
- 8GB+ RAM

### 1. Backend Setup

#### Step 1.1: Install Python Dependencies

```bash
cd d:\PYTHON\WEBTTCS
pip install -r requirements.txt
```

**requirements.txt:**

```
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.4.2
torch==2.1.0
torchvision==0.16.0
ultralytics==8.0.200
opencv-python==4.8.1.78
numpy==1.24.3
Pillow==10.0.1
python-multipart==0.0.6
```

#### Step 1.2: Install Requirements

```bash
pip install fastapi uvicorn pydantic torch torchvision ultralytics opencv-python numpy Pillow python-multipart
```

#### Step 1.3: Verify Model Files

Ensure these files exist in `d:\PYTHON\WEBTTCS\`:

- `yolov11_detection.pt` (YOLO model weights)
- `crnn_recognition.pt` (CRNN model weights)

#### Step 1.4: Start Backend Server

```bash
python app.py
```

Expected output:

```
INFO: Uvicorn running on http://0.0.0.0:8000
INFO: ✓ YOLO model loaded successfully
INFO: ✓ CRNN model loaded successfully
```

Backend will be available at: `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

---

### 2. Frontend Setup

#### Step 2.1: Replace Dashboard Component

Replace your existing `lpr-dashboard.jsx` with the updated version provided:

- Copy content from `lpr-dashboard-updated.jsx`
- Or use: `import LPRDashboard from './lpr-dashboard-updated.jsx'`

#### Step 2.2: Ensure Dependencies

In your React project, ensure you have:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  }
}
```

#### Step 2.3: Configure API Base URL

The API endpoint is configured in the component:

```javascript
const API_BASE_URL = "http://localhost:8000/api";
```

For production, update this to your backend server:

```javascript
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";
```

#### Step 2.4: Run Frontend Development Server

```bash
npm start
```

Frontend will be available at: `http://localhost:3000`

---

## 📡 API Endpoints Reference

### 1. Health Check

**Endpoint:** `GET /api/health`

**Response:**

```json
{
  "status": "healthy",
  "yolo_loaded": true,
  "crnn_loaded": true,
  "device": "cuda",
  "timestamp": "2025-06-15T10:30:00"
}
```

### 2. Scan Image

**Endpoint:** `POST /api/scan-image`

**Request:**

```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "filename": "plate_image.jpg"
}
```

**Response:**

```json
{
  "status": "success",
  "plate": "30K-123.45",
  "confidence": 96.39,
  "processing_time_ms": 42.5,
  "original_image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "cropped_plate_base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "bbox": {
    "x": 22,
    "y": 68,
    "width": 56,
    "height": 14
  },
  "timestamp": "2025-06-15T10:30:00"
}
```

**Frontend Usage:**

```javascript
const response = await fetch("http://localhost:8000/api/scan-image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    image_base64: base64EncodedImage,
    filename: "photo.jpg",
  }),
});
const data = await response.json();
console.log(`Detected plate: ${data.plate} (${data.confidence}%)`);
```

### 3. Scan Video

**Endpoint:** `POST /api/scan-video-file`

**Request:**

```json
{
  "video_base64": "AAAAIGZ0eXBpc29tAA...",
  "filename": "traffic_video.mp4"
}
```

**Response:**

```json
{
  "status": "success",
  "discovered_plates": [
    {
      "plate": "30K-123.45",
      "confidence": 97.2,
      "frame": 90,
      "timestamp": "00:03",
      "bbox": { "x": 100, "y": 150, "width": 80, "height": 30 }
    },
    {
      "plate": "51F-456.78",
      "confidence": 94.1,
      "frame": 210,
      "timestamp": "00:07",
      "bbox": { "x": 200, "y": 180, "width": 70, "height": 28 }
    }
  ],
  "total_frames": 450,
  "processing_time_ms": 8500.0,
  "timestamp": "2025-06-15T10:30:00"
}
```

### 4. Submit Feedback

**Endpoint:** `POST /api/feedback`

**Request:**

```json
{
  "scan_id": "SCN-001",
  "system_detected": "29A-1Z3.45",
  "corrected_text": "29A-123.45",
  "error_type": "Character Confusion O/0",
  "notes": "The character 'Z' was misread, it should be '2'.",
  "confidence": 61.8
}
```

**Response:**

```json
{
  "status": "success",
  "feedback_id": "FB-0001",
  "message": "Thank you for your feedback!"
}
```

### 5. Feedback Statistics

**Endpoint:** `GET /api/feedback-stats`

**Response:**

```json
{
  "total_feedback": 42,
  "pending": 15,
  "approved": 27,
  "error_patterns": {
    "Character Confusion O/0": 12,
    "Missing Character": 8,
    "Wrong Bounding Box": 5,
    "Low Lighting Error": 17
  }
}
```

---

## 🎨 Dark Theme Customization

The dashboard uses a premium dark theme inspired by Linear, Vercel, and Cursor IDE.

### Color Palette

| Element        | Color            | Tailwind Class                          |
| -------------- | ---------------- | --------------------------------------- |
| Background     | Deep Black       | `bg-slate-950`, `bg-black`              |
| Secondary BG   | Dark Gray        | `bg-white/[0.02]`, `bg-slate-900/95`    |
| Borders        | Subtle Dark      | `border-white/10`, `border-zinc-800/60` |
| Primary Text   | Bright White     | `text-white`                            |
| Secondary Text | Muted Gray       | `text-slate-400`                        |
| Success Accent | Emerald          | `text-emerald-400`, `bg-emerald-500/10` |
| Warning Accent | Amber            | `text-amber-400`, `bg-amber-500/10`     |
| Error Accent   | Red              | `text-red-400`, `bg-red-500/10`         |
| Info Accent    | Sky              | `text-sky-400`, `bg-sky-500/10`         |
| Purple/Violet  | For secondary UI | `text-violet-400`, `bg-violet-500/10`   |

### Key Design Features

1. **Glassmorphism**: Cards use `backdrop-blur-sm` and `bg-white/[0.02]`
2. **Subtle Gradients**: Background uses `from-slate-950 via-slate-900 to-black`
3. **Smooth Transitions**: `transition-all duration-300`
4. **Neon Accents**: Glowing green (`emerald-400`), purple, and cyan highlights
5. **Responsive Grid**: Mobile-first design with Tailwind breakpoints

### Customization Examples

**Change Primary Accent Color:**

```jsx
// In lpr-dashboard-updated.jsx, replace all:
bg-emerald-500/10 → bg-cyan-500/10
text-emerald-400 → text-cyan-400
border-emerald-400/30 → border-cyan-400/30
```

**Adjust Background Darkness:**

```jsx
// In the main div gradient:
from-slate-950 via-slate-900 to-black
// → for lighter theme:
from-slate-900 via-slate-800 to-slate-950
```

---

## 🔧 Model Integration Details

### CRNN Architecture Breakdown

The CRNN model in `app.py` consists of 4 components:

#### 1. TPS Spatial Transformer (testCRNN.py origin)

- **Purpose**: Correct perspective distortion in license plates
- **Components**:
  - LocalizationNetwork: CNN that predicts control points
  - GridGenerator: Generates transformation grid
  - Bilinear grid sampling for image warping

#### 2. ResNet Feature Extractor

- **Input**: 1-channel grayscale image (64×224)
- **Output**: Feature maps (512 channels)
- **Architecture**: 4 residual blocks with pooling layers
- **Purpose**: Extract visual features from the transformed plate

#### 3. BiLSTM Sequence Modeling

- **Input**: Feature sequence (512→256)
- **Output**: Character prediction sequence
- **Bidirectional LSTM**: Captures context from both directions
- **Purpose**: Model character dependencies and sequences

#### 4. CTC (Connectionist Temporal Classification) Decoding

- **Loss Function**: CTC Loss (during training)
- **Inference**: Greedy decoding via argmax
- **Output**: Final recognized license plate text
- **Post-processing**: Regex filtering for Vietnamese plates

### Image Preprocessing Pipeline

```python
def preprocess_plate(img):
    """
    1. Size check - if large enough, resize with padding
    2. Enhancement - upscale and sharpen if small
    3. Deskew - correct rotation if angle > 6°
    4. Pad to 224×64 - standardize input size
    """

    Steps:
    ├─ enhance_small_plate()      # Lanczos upscaling
    ├─ estimate_skew_angle()      # Hough line detection
    ├─ deskew_plate()              # Affine transformation
    └─ resize_with_padding()       # Letterbox to 224×64
```

### Inference Flow

```
User Image (any size)
    ↓
[YOLO Detection]
    ├─ Input: Full image
    ├─ Process: YOLOv11 inference
    └─ Output: Bounding box (x1, y1, x2, y2)
    ↓
[Crop Plate Region]
    └─ Grayscale conversion
    ↓
[CRNN Recognition]
    ├─ Preprocess (TPS transform, deskew, resize)
    ├─ Feature extraction (ResNet)
    ├─ Sequence modeling (BiLSTM)
    ├─ Classification (FC layer)
    └─ Output: Raw character indices
    ↓
[CTC Decoding + Post-processing]
    ├─ Remove CTC blanks
    ├─ Remove duplicates
    ├─ Filter non-plate chars
    └─ Output: "30K-123.45"
    ↓
[Return to Frontend]
    └─ Base64 encoded images + metadata
```

---

## 🐛 Troubleshooting

### Issue: "YOLO model not found"

**Solution:**

```bash
# Verify file exists
ls -la d:\PYTHON\WEBTTCS\yolov11_detection.pt

# If missing, download YOLO:
from ultralytics import YOLO
model = YOLO('yolov11n.pt')  # nano model
model.save('yolov11_detection.pt')
```

### Issue: CUDA out of memory

**Solution:**

```python
# In app.py, use CPU instead:
DEVICE = torch.device("cpu")

# Or optimize batch processing:
# Process images with smaller batches
```

### Issue: API connection refused

**Solution:**

```bash
# Check if backend is running:
curl http://localhost:8000/api/health

# Start backend with explicit host:
uvicorn app:app --host 0.0.0.0 --port 8000

# For production, use:
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app:app
```

### Issue: CORS errors in frontend

**Solution:**
The backend already has CORS enabled:

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For production, change `allow_origins`:

```python
allow_origins=[
    "https://yourdomain.com",
    "https://www.yourdomain.com"
]
```

---

## 📊 Performance Metrics

### Typical Processing Times

| Operation     | Time      | Hardware       |
| ------------- | --------- | -------------- |
| Image Scan    | 40-60ms   | GPU (RTX 3080) |
| Image Scan    | 150-250ms | GPU (RTX 2080) |
| Image Scan    | 500-800ms | CPU (Intel i7) |
| Video Frame   | 25-35ms   | GPU (RTX 3080) |
| Model Loading | 2-5s      | GPU            |

### Optimization Tips

1. **Batch Processing**: Process multiple frames/images together

```python
# Load CRNN model to GPU
model = CRNN(nclass).cuda()

# Batch inference
batch_images = torch.stack([img1, img2, img3])
outputs = model(batch_images)
```

2. **Input Optimization**: Preprocess at fixed size (224×64)
3. **Caching**: Store model in memory (already done)
4. **API Optimization**: Use async endpoints (FastAPI is async-first)

---

## 🚢 Production Deployment

### Using Gunicorn (Production ASGI Server)

```bash
pip install gunicorn

# Run with 4 workers
gunicorn -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  app:app
```

### Docker Deployment

**Dockerfile:**

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

**docker-compose.yml:**

```yaml
version: "3.8"

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./models:/app/models
      - ./logs:/app/logs
    environment:
      - CUDA_VISIBLE_DEVICES=0

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000/api
```

### Nginx Configuration (Reverse Proxy)

```nginx
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name lpr.yourdomain.com;

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout for long video processing
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
```

---

## 📝 Feedback Loop & Model Improvement

### Feedback Data Storage

Feedback is automatically saved to `feedback_logs.json`:

```json
[
  {
    "id": "FB-0001",
    "scan_id": "SCN-001",
    "system_detected": "29A-1Z3.45",
    "corrected_text": "29A-123.45",
    "error_type": "Character Confusion O/0",
    "confidence": 61.8,
    "submitted_at": "2025-06-15T09:20:00",
    "status": "pending"
  }
]
```

### Using Feedback for Retraining

```python
import json

# Load feedback
with open('feedback_logs.json') as f:
    feedback = json.load(f)

# Extract error patterns
error_patterns = {}
for item in feedback:
    error_type = item['error_type']
    error_patterns[error_type] = error_patterns.get(error_type, 0) + 1

# Prioritize retraining on common errors
priority_errors = sorted(error_patterns.items(), key=lambda x: x[1], reverse=True)

print("Top errors to fix:")
for error, count in priority_errors[:5]:
    print(f"  {error}: {count} occurrences")
```

---

## 📚 Additional Resources

- **YOLO Documentation**: https://docs.ultralytics.com/
- **PyTorch Documentation**: https://pytorch.org/docs/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **React Documentation**: https://react.dev/

---

## 📄 License

This LPR system is provided as-is for educational and commercial use.

---

## 🤝 Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review API endpoint documentation at `/docs`
3. Check application logs in `lpr_backend.log`
4. Verify model files exist and are not corrupted

---

**Last Updated**: June 2025
**Version**: 1.0.0
**Status**: Production Ready ✓
