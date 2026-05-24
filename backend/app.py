"""
app.py
======
Flask backend for Skin Cancer Detection & Classification.

Endpoints:
  POST /predict   — Upload image, receive prediction + Grad-CAM
  GET  /history   — Retrieve last 10 predictions
  GET  /health    — Health check
"""

import os
import base64
import logging
import uuid
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import utilities
from utils.preprocess import preprocess_image, preprocess_image_for_gradcam
from utils.model_utils import predict, load_model
from utils.gradcam import generate_gradcam
from utils.class_info import get_class_info, CLASS_LABELS

# ─── App Setup ───────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, 
            static_folder=os.path.join(BASE_DIR, "..", "frontend"), 
            static_url_path="/")
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow cross-origin requests for local development

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# In-memory prediction history (last 10 entries)
prediction_history = []
MAX_HISTORY = 10

# ─── Warm-up: load model at startup ──────────────────────────────────────────
logger.info("🚀 Warming up Deep Learning model …")
try:
    m = load_model()
    if m:
        logger.info("✨ Model is ready for real-time predictions.")
    else:
        logger.warning("⚠️ Model not found or failed to load. Falling back to DEMO MODE.")
except Exception as e:
    logger.error(f"❌ Critical error during model warm-up: {e}")


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the frontend index.html."""
    return app.send_static_file("index.html")


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    model = load_model()
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "demo_mode": model is None,
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
    })


@app.route("/predict", methods=["POST"])
def predict_endpoint():
    """
    POST /predict
    Accepts: multipart/form-data with field 'image'
    Returns: JSON prediction with class, confidence, Grad-CAM, probabilities
    """
    # ── 1. Validate request ───────────────────────────────────────────────
    if "image" not in request.files:
        return jsonify({"error": "No image field found in request."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename — please upload a valid image."}), 400

    # Read image bytes
    image_bytes = file.read()
    if len(image_bytes) == 0:
        return jsonify({"error": "Uploaded file is empty."}), 400

    # ── 2. Preprocess ─────────────────────────────────────────────────────
    try:
        img_array, pil_image = preprocess_image_for_gradcam(image_bytes)
    except Exception as e:
        logger.error(f"Preprocessing error: {e}")
        return jsonify({"error": f"Could not process image: {str(e)}"}), 422

    # ── 3. Run inference ──────────────────────────────────────────────────
    try:
        result = predict(img_array)
    except Exception as e:
        logger.error(f"Inference error: {e}")
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

    # ── 4. Grad-CAM ───────────────────────────────────────────────────────
    try:
        model = load_model()
        if model is not None:
            gradcam_image = generate_gradcam(
                model=model,
                img_array=img_array,
                class_idx=result["predicted_index"],
                pil_image=pil_image,
            )
        else:
            # Skip Grad-CAM in demo mode for macOS stability
            gradcam_image = None
    except Exception as e:
        logger.warning(f"Grad-CAM generation failed: {e}")
        gradcam_image = None

    # ── 5. Fetch disease info ─────────────────────────────────────────────
    label = result["predicted_label"]
    info = get_class_info(label)

    # ── 6. Build response ─────────────────────────────────────────────────
    prediction_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    response = {
        "id": prediction_id,
        "timestamp": timestamp,
        # Core prediction
        "predicted_label": label,
        "predicted_class": info.get("name", label),
        "full_name": info.get("full_name", label),
        "confidence": round(result["confidence"] * 100, 2),  # percentage
        # Cancer / Non-Cancer binary
        "is_cancer": info.get("is_cancer", False),
        "binary_result": "Cancer" if info.get("is_cancer", False) else "Non-Cancer",
        # Disease details
        "description": info.get("description", ""),
        "precautions": info.get("precautions", []),
        "color": info.get("color", "#3498db"),
        # All 7 class probabilities (as percentages)
        "probabilities": {
            k: round(v * 100, 2)
            for k, v in result["probabilities"].items()
        },
        # Grad-CAM heatmap (base64 PNG)
        "gradcam_image": gradcam_image,
        # Demo mode flag
        "demo_mode": result.get("demo_mode", False),
    }

    # ── 7. Store in history ───────────────────────────────────────────────
    history_entry = {
        "id": prediction_id,
        "timestamp": timestamp,
        "predicted_class": response["predicted_class"],
        "confidence": response["confidence"],
        "is_cancer": response["is_cancer"],
        "binary_result": response["binary_result"],
        "color": response["color"],
    }
    prediction_history.insert(0, history_entry)
    if len(prediction_history) > MAX_HISTORY:
        prediction_history.pop()

    logger.info(
        f"[{prediction_id}] Predicted: {response['predicted_class']} "
        f"({response['confidence']}%) | Cancer: {response['is_cancer']}"
    )
    return jsonify(response), 200


@app.route("/history", methods=["GET"])
def get_history():
    """GET /history — Returns last 10 predictions."""
    return jsonify({"history": prediction_history}), 200


@app.route("/classes", methods=["GET"])
def get_classes():
    """GET /classes — Returns all class info."""
    from utils.class_info import CLASS_INFO
    return jsonify({"classes": list(CLASS_INFO.values())}), 200


# ─── Entry point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Use port 5001 as default because 5000 is often blocked by AirPlay on macOS
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    logger.info(f"Starting Skin Cancer Detection API on port {port} …")
    
    try:
        app.run(host="0.0.0.0", port=port, debug=debug)
    except OSError as e:
        if "Address already in use" in str(e):
            logger.error(f"Port {port} is already in use! Try running: PORT=5002 python app.py")
        else:
            logger.error(f"Server failed to start: {e}")
