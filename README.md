# DermAI — Skin Cancer Detection & Classification

> ⚕️ **Disclaimer:** This tool is for research and educational purposes only. It is not a substitute for professional medical diagnosis.

A full-stack deep learning web application that classifies skin lesions into 7 disease categories using the HAM10000 dataset, EfficientNetB0 transfer learning, Flask backend, and a modern HTML/CSS/JS frontend with Grad-CAM explainability.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/prdip01/dermadrishti)

---

## 🗂 Project Structure

```
Skin cancer/
├── backend/
│   ├── app.py              # Flask API server
│   ├── train.py            # Model training script
│   ├── requirements.txt
│   └── utils/
│       ├── class_info.py   # Disease info & precautions
│       ├── preprocess.py   # Image preprocessing
│       ├── model_utils.py  # Model load & inference
│       └── gradcam.py      # Grad-CAM heatmap
├── frontend/
│   ├── index.html          # Main UI
│   ├── style.css           # Design system
│   └── app.js              # Upload, chart, results
├── models/
│   └── skin_cancer_model.h5   ← place trained model here
├── docs/
│   ├── training_guide.md
│   └── deployment_guide.md
└── README.md
```

---

## ⚡ Quick Start (Demo Mode — No Training Required)

The app runs in **Demo Mode** with simulated predictions if no trained `.h5` model is present.

### 1. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Flask backend

```bash
python app.py
```

Backend runs at: `http://localhost:5000`

### 3. Open the frontend

Open `frontend/index.html` directly in your browser.

> **Note:** If you see CORS errors, serve the frontend with:
> ```bash
> cd frontend && python -m http.server 8080
> ```
> Then open `http://localhost:8080`

---

## 🧠 Model Training (Full Accuracy)

See [`docs/training_guide.md`](docs/training_guide.md) for full instructions.

**Quick summary:**

```bash
# 1. Download HAM10000 from Kaggle:
#    https://www.kaggle.com/datasets/kmader/skin-lesion-analysis-toward-melanoma-detection
#    Place files in: backend/data/

# 2. Train the model (requires GPU for best speed)
cd backend
python train.py --data_dir ./data --epochs 30

# 3. Model saved to: models/skin_cancer_model.h5
```

---

## 🔌 API Reference

| Method | Endpoint    | Description                          |
|--------|-------------|--------------------------------------|
| POST   | `/predict`  | Upload image → JSON prediction       |
| GET    | `/history`  | Last 10 session predictions          |
| GET    | `/classes`  | All 7 disease class info             |
| GET    | `/health`   | Server + model status                |

### POST `/predict` — Example Response

```json
{
  "predicted_class": "Melanoma",
  "confidence": 92.3,
  "is_cancer": true,
  "binary_result": "Cancer",
  "full_name": "Melanoma (Malignant Melanocytic Lesion)",
  "description": "...",
  "precautions": ["Consult a dermatologist immediately.", "..."],
  "probabilities": {
    "mel": 92.3, "nv": 4.1, "bcc": 2.0,
    "akiec": 0.8, "bkl": 0.5, "df": 0.2, "vasc": 0.1
  },
  "gradcam_image": "data:image/png;base64,..."
}
```

---

## 🏷 HAM10000 Disease Classes

| Label   | Disease                    | Status       |
|---------|---------------------------|--------------|
| `mel`   | Melanoma                   | 🔴 Cancer     |
| `bcc`   | Basal Cell Carcinoma        | 🔴 Cancer     |
| `akiec` | Actinic Keratoses           | 🔴 Pre-Cancer |
| `nv`    | Melanocytic Nevi            | 🟢 Benign     |
| `bkl`   | Benign Keratosis-like       | 🟢 Benign     |
| `df`    | Dermatofibroma              | 🟢 Benign     |
| `vasc`  | Vascular Lesions            | 🟢 Benign     |

---

## ✨ Features

- 🔬 EfficientNetB0 transfer learning (ImageNet → HAM10000)
- 🎯 2-phase training: head-only → fine-tuning top layers
- ⚖️ Class imbalance handled via `compute_class_weight`
- 📊 Probability distribution bar chart (all 7 classes)
- 🌡️ Grad-CAM heatmap overlay (affected region visualization)
- 💊 Per-class precautions and suggestions
- 🕐 Prediction history (localStorage, last 10)
- 📋 Clipboard paste support (Ctrl+V image)
- 📱 Fully responsive design

---

## ⚙️ Performance Goals

After training on HAM10000 with 2-phase fine-tuning:
- **Target accuracy:** 85–90% on validation set
- Confusion matrix: `backend/reports/confusion_matrix.png`
- Classification report: `backend/reports/classification_report.txt`

---

## 🚀 Deployment

See [`docs/deployment_guide.md`](docs/deployment_guide.md) for:
- Localhost setup
- Render deployment
- HuggingFace Spaces deployment

---

## 📚 Dataset

**HAM10000** (Human Against Machine with 10,000 training images)  
Published by: Tschandl et al., 2018  
Source: https://www.kaggle.com/datasets/kmader/skin-lesion-analysis-toward-melanoma-detection

---

## ⚠️ Limitations

1. **Not a medical device** — results must be verified by a dermatologist
2. **Image quality sensitive** — best results with proper dermoscopy images
3. **Class imbalance** — Melanocytic Nevi dominates HAM10000 (~67%)
4. **No real-time camera** — static image upload only
5. **Accuracy varies** — depends on GPU, epochs, and augmentation
