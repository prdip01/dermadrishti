# Deployment Guide — DermAI Skin Cancer Detection

## Option 1: Localhost (Development)

### Prerequisites
- Python 3.9+
- pip
- Modern browser (Chrome, Firefox, Safari)

### Steps

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Start the unified server
python app.py
# → Both Frontend and Backend now run at http://localhost:5001
```

---

## Option 2: Unified Deployment on Render (RECOMMENDED)

This is the simplest way to deploy. We serve both the Frontend and Backend from a single Render Web Service.

### 1. Push to GitHub
Ensure all your changes are committed and pushed to your GitHub repository.

```bash
git add .
git commit -m "Prepare for unified Render deployment"
git push origin main
```

### 2. Deploy on Render
1.  Go to [render.com](https://render.com) and log in.
2.  Click **New +** → **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name:** `dermai-skin-cancer` (or any name you like)
    *   **Region:** Choose the one closest to you.
    *   **Branch:** `main`
    *   **Root Directory:** (Leave this empty)
    *   **Runtime:** `Python 3`
    *   **Build Command:** `pip install -r backend/requirements.txt`
    *   **Start Command:** `gunicorn --chdir backend app:app`
5.  **Environment Variables:**
    *   Click **Advanced** → **Add Environment Variable**.
    *   Key: `PYTHON_VERSION`, Value: `3.10.0` (or your preferred version)
    *   Key: `FLASK_DEBUG`, Value: `false`
6.  Click **Create Web Service**.

### 3. Update Frontend API (Automatic)
Because the frontend is now served by the backend on the same domain, it will automatically use the correct API URL if you use relative paths in `app.js`.

**Check `frontend/app.js`:**
Ensure your `API_BASE` is set to an empty string or the current origin:
```javascript
const API_BASE = ""; // Empty string for same-domain requests
```

### ⚠️ Free Tier Note
Render's free tier spins down after 15 minutes of inactivity. The first request after a spin-down may take ~30 seconds to wake up the server.

---

## Option 3: HuggingFace Spaces (Gradio or Static)

### Backend as Gradio App

1. Create an account at [huggingface.co](https://huggingface.co)
2. Create a new Space → **SDK: Gradio**
3. Upload `backend/` files
4. Create `app_gradio.py`:

```python
import gradio as gr
from utils.preprocess import preprocess_image_for_gradcam
from utils.model_utils import predict
from utils.class_info import get_class_info

def classify(image):
    import io
    from PIL import Image
    buf = io.BytesIO(); image.save(buf, format="JPEG")
    img_array, pil_img = preprocess_image_for_gradcam(buf.getvalue())
    result = predict(img_array)
    info = get_class_info(result["predicted_label"])
    return {
        "Class": info["name"],
        "Confidence": f"{result['confidence']:.1%}",
        "Cancer": "Yes" if info["is_cancer"] else "No",
    }

demo = gr.Interface(
    fn=classify,
    inputs=gr.Image(type="pil"),
    outputs=gr.JSON(),
    title="DermAI — Skin Cancer Detection",
)
demo.launch()
```

5. Add `requirements.txt` to the Space root
6. Push → your app is live at `https://huggingface.co/spaces/YOUR_USERNAME/dermai`

---

## Model File Hosting

Since `.h5` files can be large (80–200 MB), host them on HuggingFace Hub:

```bash
pip install huggingface_hub
huggingface-cli upload YOUR_USERNAME/dermai-model models/skin_cancer_model.h5
```

Then download in `model_utils.py`:
```python
from huggingface_hub import hf_hub_download
model_path = hf_hub_download(repo_id="YOUR_USERNAME/dermai-model", filename="skin_cancer_model.h5")
```
