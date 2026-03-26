# Model Training Guide — HAM10000 + EfficientNetB0

## 1. Download the HAM10000 Dataset

Go to Kaggle and download the dataset:
- URL: https://www.kaggle.com/datasets/kmader/skin-lesion-analysis-toward-melanoma-detection

You'll need a Kaggle account. Install the Kaggle CLI for convenience:

```bash
pip install kaggle
# Place your kaggle.json API key in ~/.kaggle/
kaggle datasets download -d kmader/skin-lesion-analysis-toward-melanoma-detection
```

## 2. Extract Dataset

```bash
cd backend
mkdir data
unzip skin-lesion-analysis-toward-melanoma-detection.zip -d data/
```

Expected structure:
```
backend/data/
├── HAM10000_metadata.csv
├── HAM10000_images_part_1/   (5,000 JPEG images)
└── HAM10000_images_part_2/   (5,015 JPEG images)
```

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

**Recommended:** Use a GPU for faster training. TensorFlow auto-detects CUDA.  
Check GPU availability:
```bash
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
```

## 4. Run Training

```bash
cd backend
python train.py --data_dir ./data --epochs 30 --batch_size 32
```

**Options:**
| Argument      | Default | Description                      |
|---------------|---------|----------------------------------|
| `--data_dir`  | ./data  | Path to HAM10000 dataset folder  |
| `--epochs`    | 30      | Total training epochs            |
| `--batch_size`| 32      | Batch size (reduce to 16 for CPU)|

## 5. Training Pipeline Details

### Data Split
- 80% training / 20% validation (stratified by class)

### Augmentation (Training Only)
- Horizontal & vertical flip
- Rotation ±20°
- Zoom ±20%
- Width/height shift ±10%
- Brightness adjustment [0.8, 1.2]

### Class Imbalance Handling
The HAM10000 dataset is heavily imbalanced (Melanocytic Nevi = 67%).  
We use `sklearn.utils.class_weight.compute_class_weight('balanced', ...)` to upweight minority classes.

### Model Architecture
```
EfficientNetB0 (ImageNet weights, frozen)
  ↓
GlobalAveragePooling2D
  ↓
BatchNormalization
  ↓
Dense(256, relu) + Dropout(0.5)
  ↓
Dense(7, softmax) → 7 disease classes
```

### 2-Phase Training
1. **Phase 1** (epochs 1–10): Freeze base, train custom head only (LR = 1e-4)
2. **Phase 2** (epochs 11–30): Unfreeze last 20 EfficientNetB0 layers, fine-tune (LR = 1e-5)

### Callbacks
- `ModelCheckpoint` → saves best val_accuracy model
- `EarlyStopping` → patience=7 on val_accuracy
- `ReduceLROnPlateau` → halves LR when val_loss plateaus
- `CSVLogger` → logs to `reports/training_log.csv`

## 6. Expected Outputs

After training completes:
```
models/skin_cancer_model.h5          ← Trained model
reports/confusion_matrix.png         ← Confusion matrix heatmap
reports/classification_report.txt    ← Per-class precision/recall/F1
reports/training_log.csv             ← Epoch-by-epoch metrics
```

## 7. Expected Performance

| Metric    | Target |
|-----------|--------|
| Val Accuracy | 85–90% |
| Melanoma Recall | >80% |
| BCC Recall | >85% |

## 8. After Training — Run the App

```bash
python app.py        # Model auto-loads from models/skin_cancer_model.h5
```
