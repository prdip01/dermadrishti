# Deployment Guide — DermAI Skin Cancer Detection

## Option 1: Localhost (Development)

### Prerequisites
- Python 3.9+
- pip
- Modern browser (Chrome, Firefox, Safari)

### Steps

```bash
# 1. Clone / download the project
cd "Skin cancer"

# 2. Install backend dependencies
cd backend
pip install -r requirements.txt

# 3. Start the Flask server
python app.py
# → Runs at http://localhost:5000

# 4. Open the frontend (in a new terminal or directly in browser)
cd ../frontend
python -m http.server 8080
# → Open http://localhost:8080
```

---

## Option 2: Deploy Backend on Render (Free Tier)

### 1. Prepare your project

Create a `Procfile` in the `backend/` directory:
```
web: python app.py
```

Update `app.py` to use `PORT` environment variable (already done):
```python
port = int(os.environ.get("PORT", 5000))
app.run(host="0.0.0.0", port=port)
```

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — DermAI"
git remote add origin https://github.com/YOUR_USERNAME/dermai.git
git push -u origin main
```

### 3. Deploy on Render

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `python app.py`
6. Add environment variable: `FLASK_DEBUG=false`
7. Deploy → copy the Render URL (e.g., `https://dermai.onrender.com`)

### 4. Update the frontend API URL

In `frontend/app.js`, change:
```js
const API_BASE = "https://dermai.onrender.com";  // ← your Render URL
```

### 5. Deploy frontend on GitHub Pages

Host `frontend/` folder on GitHub Pages (static site).

### ⚠️ Render Note
Free tier spins down after 15 minutes of inactivity. First request may be slow (~30s).

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
