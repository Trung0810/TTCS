# LPR System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

- Python 3.8+ installed
- Node.js 16+ installed (for React frontend)
- The following files in your project directory:
  - `yolov11_detection.pt` (YOLO model)
  - `crnn_recognition.pt` (CRNN model)

---

## ⚡ Quick Start (Windows)

### Option 1: Interactive Setup Script (Recommended)

```bash
# Run the setup script
setup.bat

# Then select from the menu:
# [1] Install dependencies
# [2] Start backend
# [3] Start frontend
```

### Option 2: Manual Steps

#### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

#### Step 2: Start Backend (Terminal 1)

```bash
python app.py
```

Expected output:

```
INFO: Uvicorn running on http://0.0.0.0:8000
INFO: Application startup complete
INFO: ✓ YOLO model loaded successfully
INFO: ✓ CRNN model loaded successfully
```

#### Step 3: Start Frontend (Terminal 2)

```bash
npm start
```

Expected output:

```
webpack compiled with warnings
Compiled successfully!
Local:   http://localhost:3000
```

#### Step 4: Open Dashboard

Visit: **http://localhost:3000**

---

## 🎯 Testing the System

### Test 1: Check Backend Health

```bash
curl http://localhost:8000/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "yolo_loaded": true,
  "crnn_loaded": true,
  "device": "cuda",
  "timestamp": "2025-06-15T10:30:00"
}
```

### Test 2: Scan an Image

Use the dashboard:

1. Go to **Media Scan** → **Image Scan**
2. Upload or drag-drop a vehicle image
3. Wait for processing
4. View the detected license plate

### Test 3: Browse API Documentation

Visit: **http://localhost:8000/docs**

This shows interactive API documentation where you can test endpoints directly.

---

## 📁 Project Structure

```
d:\PYTHON\WEBTTCS\
├── app.py                          # FastAPI backend (MAIN)
├── lpr-dashboard-updated.jsx       # React frontend (UPDATED)
├── testCRNN.py.py                  # Original CRNN code
├── crnn_recognition.pt             # CRNN model weights
├── yolov11_detection.pt            # YOLO model weights
├── requirements.txt                # Python dependencies
├── setup.bat                       # Windows setup script
├── INTEGRATION_GUIDE.md            # Full documentation
├── QUICK_START.md                  # This file
└── feedback_logs.json              # Auto-generated feedback data
```

---

## 🎨 Dark Theme Features

The updated dashboard includes:

✨ **Premium Dark Theme**

- Deep black backgrounds (`bg-black`, `bg-slate-950`)
- Subtle white borders (`border-white/10`)
- Glassmorphism effects (`backdrop-blur-md`)
- Neon glowing accents (emerald, purple, cyan)
- Smooth animations and transitions

🎯 **Key Pages**

1. **Media Scan**: Upload images or videos
2. **Live Stream**: Real-time CCTV monitoring
3. **Scan History**: Complete detection log
4. **Feedback**: Report detection errors

---

## ⚙️ Configuration

### Change Backend Port

Edit `app.py`:

```python
if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,  # ← Change here
        log_level="info"
    )
```

Then restart backend.

### Change API URL in Frontend

Edit `lpr-dashboard-updated.jsx`:

```javascript
const API_BASE_URL = "http://your-server:8000/api";
```

### Use GPU vs CPU

The system automatically detects GPU. To force CPU:

Edit `app.py`:

```python
# Change this line:
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# To this:
DEVICE = torch.device("cpu")
```

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found" error

```bash
# Solution: Install missing packages
pip install -r requirements.txt
```

### Issue: API connection refused

```bash
# Solution: Check if backend is running
curl http://localhost:8000/api/health

# If not running, start it:
python app.py
```

### Issue: CUDA out of memory

```bash
# Solution: Use CPU instead (slower but works)
# Edit app.py, change DEVICE to torch.device("cpu")
```

### Issue: Model files not found

```bash
# Ensure these files exist in your project directory:
ls yolov11_detection.pt
ls crnn_recognition.pt

# If missing, place them in d:\PYTHON\WEBTTCS\
```

---

## 📊 API Endpoints Summary

| Method | Endpoint               | Purpose                        |
| ------ | ---------------------- | ------------------------------ |
| GET    | `/api/health`          | Check if backend is running    |
| POST   | `/api/scan-image`      | Scan a single image for plates |
| POST   | `/api/scan-video-file` | Process video file             |
| POST   | `/api/feedback`        | Submit user corrections        |
| GET    | `/api/feedback-stats`  | Get feedback statistics        |

---

## 🎯 Next Steps

1. ✅ Run setup.bat or follow manual steps
2. ✅ Check backend health
3. ✅ Upload your first image
4. ✅ Review the full [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
5. ✅ Deploy to production (see guide)

---

## 📞 Need Help?

1. Check [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for detailed documentation
2. Visit API docs: http://localhost:8000/docs
3. Check application logs: `lpr_backend.log`

---

**Version**: 1.0.0
**Status**: Production Ready ✓
