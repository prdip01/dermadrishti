"""
train.py
========
Model Training Script — Skin Cancer Classification
====================================================
Uses EfficientNetB0 with transfer learning on the HAM10000 dataset.

Dataset:
  Download from: https://www.kaggle.com/datasets/kmader/skin-lesion-analysis-toward-melanoma-detection
  Expected structure:
    data/
      HAM10000_metadata.csv
      HAM10000_images_part_1/   (JPEG images)
      HAM10000_images_part_2/   (JPEG images)

Usage:
  python train.py --data_dir ./data --epochs 30 --batch_size 32

Output:
  models/skin_cancer_model.h5
  reports/confusion_matrix.png
  reports/classification_report.txt
"""

import os
import argparse
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import warnings
warnings.filterwarnings("ignore")

import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.layers import (
    GlobalAveragePooling2D, Dense, Dropout, BatchNormalization
)
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import (
    ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, CSVLogger
)
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# ─── Constants ───────────────────────────────────────────────────────────────
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 30
LEARNING_RATE = 1e-4
NUM_CLASSES = 7
RANDOM_SEED = 42

# HAM10000 label mapping
LABEL_MAP = {
    "akiec": 0,  # Actinic Keratoses
    "bcc": 1,    # Basal Cell Carcinoma
    "bkl": 2,    # Benign Keratosis-like
    "df": 3,     # Dermatofibroma
    "mel": 4,    # Melanoma
    "nv": 5,     # Melanocytic Nevi
    "vasc": 6,   # Vascular Lesions
}
CLASS_NAMES = list(LABEL_MAP.keys())


def load_metadata(data_dir: str) -> pd.DataFrame:
    """Load HAM10000 metadata CSV and attach correct image paths."""
    csv_path = os.path.join(data_dir, "HAM10000_metadata.csv")
    df = pd.read_csv(csv_path)

    # Find all images across both parts
    image_dirs = [
        os.path.join(data_dir, "HAM10000_images_part_1"),
        os.path.join(data_dir, "HAM10000_images_part_2"),
    ]

    # Build image_id → full path mapping
    image_map = {}
    for img_dir in image_dirs:
        if os.path.exists(img_dir):
            for fname in os.listdir(img_dir):
                if fname.endswith(".jpg"):
                    img_id = fname.replace(".jpg", "")
                    image_map[img_id] = os.path.join(img_dir, fname)

    df["image_path"] = df["image_id"].map(image_map)
    df = df.dropna(subset=["image_path"])  # Remove rows without images
    df["label_idx"] = df["dx"].map(LABEL_MAP)

    print(f"Loaded {len(df)} images with labels.")
    print(f"\nClass distribution:\n{df['dx'].value_counts()}")
    return df


def build_model(num_classes: int = NUM_CLASSES) -> Model:
    """
    Build EfficientNetB0 transfer learning model.

    Architecture:
      EfficientNetB0 (frozen base) → GlobalAveragePooling2D
      → BatchNorm → Dense(256, relu) → Dropout(0.5)
      → Dense(num_classes, softmax)
    """
    # Load pre-trained EfficientNetB0 without top classifier
    base_model = EfficientNetB0(
        weights="imagenet",
        include_top=False,
        input_shape=(224, 224, 3)
    )

    # Phase 1: Freeze base, train only new head
    base_model.trainable = False

    # Build custom head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = BatchNormalization()(x)
    x = Dense(256, activation="relu")(x)
    x = Dropout(0.5)(x)
    outputs = Dense(num_classes, activation="softmax")(x)

    model = Model(inputs=base_model.input, outputs=outputs)

    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    print(f"\nModel summary:")
    print(f"  Total parameters: {model.count_params():,}")
    print(f"  Trainable (head): {sum(np.prod(v.shape) for v in model.trainable_variables):,}")

    return model, base_model


def get_data_generators(df_train: pd.DataFrame, df_val: pd.DataFrame):
    """
    Create augmented training and validation data generators.
    Training augmentation: flip, rotation, zoom, brightness.
    """
    # Training augmentation
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255.0,
        horizontal_flip=True,
        vertical_flip=True,
        rotation_range=20,
        zoom_range=0.2,
        width_shift_range=0.1,
        height_shift_range=0.1,
        brightness_range=[0.8, 1.2],
        fill_mode="nearest",
    )

    # Validation: only rescale
    val_datagen = ImageDataGenerator(rescale=1.0 / 255.0)

    train_gen = train_datagen.flow_from_dataframe(
        dataframe=df_train,
        x_col="image_path",
        y_col="label_idx",
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="raw",
        shuffle=True,
        seed=RANDOM_SEED,
    )

    val_gen = val_datagen.flow_from_dataframe(
        dataframe=df_val,
        x_col="image_path",
        y_col="label_idx",
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="raw",
        shuffle=False,
    )

    return train_gen, val_gen


def compute_weights(df_train: pd.DataFrame) -> dict:
    """Compute class weights to handle HAM10000 class imbalance."""
    labels = df_train["label_idx"].values
    classes = np.unique(labels)
    weights = compute_class_weight("balanced", classes=classes, y=labels)
    class_weight_dict = dict(zip(classes.tolist(), weights.tolist()))
    print(f"\nClass weights: {class_weight_dict}")
    return class_weight_dict


def train(data_dir: str, epochs: int = EPOCHS, batch_size: int = BATCH_SIZE):
    """Main training routine."""
    os.makedirs("models", exist_ok=True)
    os.makedirs("reports", exist_ok=True)

    # ── 1. Load data ─────────────────────────────────────────────────────
    df = load_metadata(data_dir)
    df_train, df_val = train_test_split(
        df, test_size=0.2, stratify=df["label_idx"], random_state=RANDOM_SEED
    )
    print(f"\nTrain: {len(df_train)} | Val: {len(df_val)}")

    # ── 2. Data generators ────────────────────────────────────────────────
    train_gen, val_gen = get_data_generators(df_train, df_val)

    # ── 3. Class weights ──────────────────────────────────────────────────
    class_weights = compute_weights(df_train)

    # ── 4. Build model ────────────────────────────────────────────────────
    model, base_model = build_model(NUM_CLASSES)

    # ── 5. Callbacks ──────────────────────────────────────────────────────
    callbacks = [
        ModelCheckpoint(
            "models/skin_cancer_model.h5",
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
        EarlyStopping(monitor="val_accuracy", patience=7, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-7, verbose=1),
        CSVLogger("reports/training_log.csv"),
    ]

    # ── 6. Phase 1: Train head only ───────────────────────────────────────
    print("\n── Phase 1: Training head layer ──")
    history1 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=min(10, epochs),
        class_weight=class_weights,
        callbacks=callbacks,
    )

    # ── 7. Phase 2: Fine-tune top layers of EfficientNetB0 ───────────────
    print("\n── Phase 2: Fine-tuning top EfficientNetB0 layers ──")
    # Unfreeze last 20 layers of base model
    base_model.trainable = True
    for layer in base_model.layers[:-20]:
        layer.trainable = False

    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE / 10),  # lower LR for fine-tuning
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    history2 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=epochs,
        initial_epoch=min(10, epochs),
        class_weight=class_weights,
        callbacks=callbacks,
    )

    # ── 8. Evaluate ───────────────────────────────────────────────────────
    print("\n── Evaluating on validation set ──")
    model.load_weights("models/skin_cancer_model.h5")
    val_gen.reset()

    y_true = df_val["label_idx"].values
    y_pred_probs = model.predict(val_gen, verbose=1)
    y_pred = np.argmax(y_pred_probs, axis=1)

    # Classification report
    report = classification_report(y_true, y_pred, target_names=CLASS_NAMES)
    print("\nClassification Report:\n", report)
    with open("reports/classification_report.txt", "w") as f:
        f.write(report)

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES
    )
    plt.ylabel("Actual")
    plt.xlabel("Predicted")
    plt.title("Skin Cancer Classification — Confusion Matrix")
    plt.tight_layout()
    plt.savefig("reports/confusion_matrix.png", dpi=150)
    plt.close()
    print("\nSaved: reports/confusion_matrix.png")
    print("Saved: reports/classification_report.txt")
    print("Saved: models/skin_cancer_model.h5")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Skin Cancer Detection Model")
    parser.add_argument("--data_dir", type=str, default="./data",
                        help="Path to HAM10000 dataset directory")
    parser.add_argument("--epochs", type=int, default=30,
                        help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=32,
                        help="Batch size for training")
    args = parser.parse_args()

    print(f"TensorFlow version: {tf.__version__}")
    gpus = tf.config.list_physical_devices("GPU")
    print(f"Available GPUs: {gpus if gpus else 'None (using CPU)'}")

    train(args.data_dir, args.epochs, args.batch_size)
