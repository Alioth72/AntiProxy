# Face Recognition API Service - SCRFD Version

## 🎯 Overview

This is the **production-grade face recognition service** using **InsightFace with SCRFD detector**. This code was extracted from the deployed Docker container and is the actual running version.

---

## 🔧 Technology Stack

### Core Components
- **Face Detection**: SCRFD-10G (Sample and Computation Redistribution Face Detector)
  - Part of InsightFace's `buffalo_l` model pack
  - State-of-the-art accuracy and speed
  - 640x640 detection size
  - 5-point facial landmarks

- **Face Recognition**: InsightFace ArcFace
  - 512-dimensional embeddings
  - High accuracy face matching
  - Cosine similarity based matching

- **Framework**: Flask REST API
- **Image Processing**: OpenCV (headless)
- **Model Inference**: ONNX Runtime (CPU)

---

## 📁 Project Structure

```
face-api-source-recovered/
├── app.py                          # Main Flask API server (627 lines)
├── config.py                       # Configuration (SCRFD-optimized)
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Production Docker build
│
├── face_detection.py               # SCRFD detector wrapper (103 lines)
├── face_recognition.py             # InsightFace embeddings (46 lines)
├── face_alignment.py               # Face preprocessing (572 lines)
│
├── create_reference_database.py    # Build reference DB from images
├── face_recognition_client.py      # API client examples
├── test_face_recognition.py        # Test suite
├── test_requests.py                # Simple API tests
├── utils.py                        # Helper functions
│
├── reference_database.json         # 40 people face embeddings (639KB)
├── reference_database_20250912_*/  # Reference images & embeddings backup
│
├── images/                         # Sample test images
├── models/                         # Model cache
├── uploads/                        # Temporary uploads
└── logs/                          # Application logs
```

---

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python app.py

# Server starts on http://0.0.0.0:8080
```

**Note**: On first run, InsightFace will automatically download the `buffalo_l` model pack (~280MB).

### Docker Deployment

```bash
# Build the image
docker build -t face-api-scrfd:latest .

# Run the container
docker run -d \
  --name face-api \
  -p 8080:8080 \
  -e FLASK_DEBUG=false \
  face-api-scrfd:latest

# Check health
curl http://localhost:8080/health
```

---

## 📡 API Endpoints

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-12T16:38:56.475183",
  "message": "Face Recognition API is running"
}
```

### 2. Recognize Faces
```http
POST /recognize_faces
Content-Type: application/json

{
  "image_data": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "processed_image_base64": "base64_annotated_image",
  "results_json": [
    {
      "boundingBox": {
        "left": 100.0,
        "top": 150.0,
        "width": 200.0,
        "height": 250.0
      },
      "name": "Shubhank",
      "similarityScore": 0.92
    }
  ]
}
```

### 3. Rebuild Database
```http
POST /rebuild_database
```

Rebuilds the face recognition reference database from images in the `images/` folder.

---

## ⚙️ Configuration

Environment variables (see `config.py`):

| Variable | Default | Description |
|----------|---------|-------------|
| `FLASK_DEBUG` | false | Enable debug mode |
| `HOST` | 0.0.0.0 | Server host |
| `PORT` | 8080 | Server port |
| `UPLOAD_FOLDER` | uploads | Temporary upload directory |
| `MAX_CONTENT_LENGTH` | 16MB | Max upload size |
| `FACE_EMBEDDING_SIZE` | 512 | InsightFace embedding dimensions |
| `SIMILARITY_THRESHOLD` | 1.0 | Face matching threshold |

---

## 🔍 SCRFD vs MTCNN

**Why SCRFD?**

| Feature | MTCNN | SCRFD-10G |
|---------|-------|-----------|
| **Accuracy** | Good | Excellent |
| **Speed** | Moderate | Fast |
| **Model Size** | ~2MB | ~16MB |
| **Landmarks** | 5 points | 5 points |
| **Integration** | Standalone | Part of InsightFace |
| **Maintenance** | Older | Active |

**This codebase uses SCRFD** - the legacy MTCNN references have been removed.

---

## 📊 Reference Database

Current database contains:
- **40 registered students**
- **512-dimensional embeddings** per person
- Multiple reference images per person
- Stored in `reference_database.json` (639KB)

### Student List
Aarushi, Aaryaman, Abhinav, Akansh, Aman, Amlan, Aneesh, Anugya, Armaan, Arpit, Aryanb, Avyaan, Devansh, Dheeraj, Himani, Ishansh, Kartik, Kushagra, Kushal, Mayank, Naman, Nikunj, Odwitiyo, Pihu, Pranay, Prisha, Riddhi, Ridhwan, Rudransh, Saksham_Jain, Sarthak, Shanjan, Shivaay, Shreshth, Shubhank, Sukriti, Taher, Ujjwal, Vishrut, Vivaan

### Rebuild Database

```bash
# Place images in the images/ folder (one per person, named: Firstname.jpg)
python create_reference_database.py

# Or use the API
curl -X POST http://localhost:8080/rebuild_database
```

---

## 🧪 Testing

```bash
# Quick test
python test_requests.py

# Full test suite
python test_face_recognition.py

# Using the client library
python face_recognition_client.py --image path/to/image.jpg
```

---

## 📦 Dependencies

```
flask
werkzeug
opencv-python-headless
numpy
insightface
onnxruntime
```

**Total image size**: ~1.5GB (includes all models and dependencies)

---

## 🔄 Migration from MTCNN

This codebase has been **cleaned of all MTCNN references**. Changes made:

✅ Removed `face_detect_mtcnn.py` (unused legacy file)  
✅ Updated `app.py` to remove MTCNN config params  
✅ Updated `config.py` to reflect SCRFD (no config needed)  
✅ Updated embedding size from 192 → 512 dimensions  
✅ All code now uses SCRFD detector from InsightFace  

---

## 🎯 Performance

### CPU Performance
- **Detection**: ~200ms per image
- **Recognition**: ~50ms per face
- **Total**: ~1-2 seconds for typical class photo (20-40 faces)

### Memory Usage
- **Base**: ~500MB
- **With models loaded**: ~2GB
- **Peak during processing**: ~2.5GB

---

## 🐳 Docker Details

The Dockerfile includes:
- Python 3.10 slim base
- System dependencies (libgl1, libglib2.0-0, build-essential)
- Health check every 30s
- Optimized for Cloud Run / Kubernetes deployment

**Exposed Port**: 8080  
**Working Directory**: /app  
**Entrypoint**: `python app.py`

---

## 🚨 Troubleshooting

### Model Download Issues
If `buffalo_l` model download fails on first run:
```bash
# Manually download to ~/.insightface/models/
wget https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
unzip buffalo_l.zip -d ~/.insightface/models/
```

### Memory Errors
Ensure at least 3GB RAM available. For production, 4GB recommended.

### Slow Performance
SCRFD is optimized for CPU. For faster inference:
- Use GPU with CUDA: Change `ctx_id=0` to `ctx_id=0` with GPU drivers
- Reduce detection size: Change `det_size=(640, 640)` to `(320, 320)`

---

## 📝 API Integration

Example Python client:

```python
import requests
import base64

# Read image
with open('photo.jpg', 'rb') as f:
    img_data = base64.b64encode(f.read()).decode()

# Call API
response = requests.post(
    'http://localhost:8080/recognize_faces',
    json={'image_data': img_data}
)

results = response.json()
print(f"Found {len(results['results_json'])} faces")
for face in results['results_json']:
    print(f"- {face['name']}: {face['similarityScore']:.2f}")
```

---

## 🔐 Production Deployment

Deployed at: `https://face-api-service-21744346848.asia-south1.run.app`  
Platform: Google Cloud Run  
Region: asia-south1  
Last Updated: September 12, 2025

---

## 📄 License & Credits

- **InsightFace**: https://github.com/deepinsight/insightface
- **SCRFD Paper**: https://arxiv.org/abs/2105.04714
- **ArcFace Paper**: https://arxiv.org/abs/1801.07698

---

## 🔮 Future Enhancements

- [ ] GPU support (CUDA) for 10x faster inference
- [ ] Batch processing API endpoint
- [ ] Video stream processing
- [ ] Face liveness detection
- [ ] API authentication & rate limiting
- [ ] Monitoring & metrics (Prometheus)
- [ ] Automatic database updates via webhook

---

**Version**: SCRFD Production (Extracted from Docker)  
**Last Updated**: January 12, 2026  
**Original Build**: September 11-12, 2025
