# DermaDrishti: Skin Cancer Detection & Classification Using Deep Learning

**Project Title:** DermaDrishti: An AI-Powered System for Automated Skin Lesion Diagnosis  
**Author:** Pradeep Kumar  
**Objective:** Final Year Project Submission  

---

## 📄 Abstract

Skin cancer is one of the most common and life-threatening types of cancer worldwide. Early detection is critical for successful treatment and patient survival. **DermaDrishti** is a full-stack automated diagnostic system designed to classify skin lesions into seven distinct categories using the HAM10000 dataset. The system leverages state-of-the-art Deep Learning through **EfficientNetB0** transfer learning, fine-tuned for high accuracy on medical images. To provide transparency, the system integrates **Grad-CAM** (Gradient-weighted Class Activation Mapping) to visualize regions of interest. The final application consists of a robust **Flask** backend and a modern, responsive **Web UI**, providing a seamless experience for potential clinical screening or educational research.

---

## 1. Introduction

### 1.1 Problem Statement
The manual diagnosis of skin cancer by dermatologists is time-consuming and prone to human error, especially in regions with limited access to specialists. Traditional methods lack a quick and accessible way for patients to perform preliminary self-screenings.

### 1.2 Motivation
Deep learning has shown remarkable success in medical image analysis. By automating the classification process, we can provide a fast, objective, and accurate tool that assists medical professionals and empowers patients with early-stage information.

### 1.3 Objectives
-   To develop a deep learning model for skin lesion classification.
-   To implement transfer learning using the EfficientNetB0 architecture.
-   To handle dataset class imbalance using weighted loss functions.
-   To provide "Explainable AI" through Grad-CAM heatmaps.
-   To build a user-friendly web interface for image upload and result visualization.

### 1.4 Scope
The system focuses on classifying seven specific types of skin lesions found in the HAM10000 dataset, ranging from benign moles to malignant melanomas.

---

## 2. Literature Review & Dataset

### 2.1 The HAM10000 Dataset
The **HAM10000** ("Human Against Machine with 10,000 training images") dataset contains 10,015 dermatoscopic images of pigmented skin lesions.
It categorized images into 7 classes:
1.  **Melanoma (mel)** - 🔴 Cancer
2.  **Basal Cell Carcinoma (bcc)** - 🔴 Cancer
3.  **Actinic Keratosis (akiec)** - 🔴 Pre-Cancer
4.  **Melanocytic Nevi (nv)** - 🟢 Benign
5.  **Benign Keratosis-like (bkl)** - 🟢 Benign
6.  **Dermatofibroma (df)** - 🟢 Benign
7.  **Vascular Lesions (vasc)** - 🟢 Benign

### 2.2 Deep Learning Architectures
While CNNs (Convolutional Neural Networks) are standard, modern architectures like **EfficientNet** optimize both accuracy and efficiency by scaling depth, width, and resolution simultaneously.

---

## 3. System Analysis & Requirements

### 3.1 Hardware Requirements
-   **Processor:** Intel Core i5/i7 or Apple M1/M2 series.
-   **Memory:** Minimum 8GB RAM (16GB recommended for training).
-   **Storage:** 5GB+ for dataset and models.
-   **GPU (Optional but Recommended):** NVIDIA GPU with CUDA support or Apple Metal for faster model training.

### 3.2 Software Requirements
-   **Operating System:** Windows 10/11, macOS, or Linux.
-   **Environment:** Python 3.9+.
-   **Libraries:** TensorFlow/Keras, Flask, OpenCV, NumPy, Pandas, Scikit-learn.
-   **Frontend:** HTML5, CSS3, JavaScript (ES6+).

---

## 4. Methodology

### 4.1 Data Preprocessing
-   **Resizing:** Images are resized to **224x224 pixels** (EfficientNet input size).
-   **Normalization:** Pixel values normalized to [0, 1] or specified by EfficientNet preprocessing.
-   **Augmentation:** To prevent overfitting, we apply horizontal/vertical flips, rotations (±20°), and zooms (±20%).

### 4.2 Class Imbalance Handling
The dataset is highly imbalanced (Nevi makes up ~67%). We calculate class weights to penalize errors in minority classes (e.g., Melanoma) more heavily, ensuring the model focuses on detecting lethal types.

### 4.3 Model Architecture: EfficientNetB0
-   **Initial Phase:** We freeze the pre-trained ImageNet weights and train only the custom classification head.
-   **Fine-Tuning:** We unfreeze the top layers of EfficientNetB0 and train with a very low learning rate (1e-5) to adapt the specific features to skin lesion textures.

### 4.4 Explainability: Grad-CAM
**Grad-CAM** uses the gradients of any target concept (like 'Melanoma') flowing into the final convolutional layer to produce a localization map highlighting the important regions in the image for prediction.

---

## 5. System Architecture & Implementation

### 5.1 Project Directory Structure
```text
Skin cancer/
├── backend/          # Flask API, ML Utilities, Training scripts
├── frontend/         # Web UI (index.html, style.css, app.js)
├── models/           # Pre-trained and fine-tuned .h5 models
└── docs/             # Documentation and reports
```

### 5.2 Backend Implementation (Flask)
The backend provides REST APIs:
-   `POST /predict`: Receives an image, performs inference, generates Grad-CAM, and returns a JSON response with the diagnosis and treatment precautions.
-   `GET /classes`: Provides descriptions of all skin diseases.

### 5.3 Frontend Implementation (Web)
-   **Modern UI:** Glassmorphism design with responsive grid layouts.
-   **Interactive Elements:** Real-time probability charts (Chart.js), history tracking, and zoomable Grad-CAM heatmaps.
-   **Clipboard Support:** Allows users to paste images directly for analysis.

---

## 6. Results & Conclusion

### 6.1 Expected Performance
Based on the current implementation, the model aims for:
-   **Accuracy:** 85% - 92% on validation data.
-   **Recall for Melanoma:** High sensitivity is prioritized to avoid missing deadly cases.

### 6.2 Conclusion
DermaDrishti successfully demonstrates how Deep Learning can be leveraged to provide accessible skin cancer screening. The integration of Explainable AI (Grad-CAM) adds a layer of trust by showing *why* the model made a specific prediction.

### 6.3 Future Scope
1.  **Mobile App Integration:** Developing native iOS/Android apps for easier access.
2.  **Dataset Expansion:** Including more diverse skin tones to reduce bias.
3.  **Real-Time Video Analysis:** Implementing skin lesion tracking through a live camera feed.

---

## 7. References
1.  Tschandl, P., Rosendahl, C., & Kittler, H. (2018). *The HAM10000 dataset*. Scientific Data.
2.  Tan, M., & Le, Q. V. (2019). *EfficientNet: Rethinking Model Scaling for CNNs*.
3.  Selvaraju, R. R., et al. (2017). *Grad-CAM: Visual Explanations from Deep Networks*.

---
> ⚕️ **Disclaimer:** This tool is for research and educational purposes only. It is not a substitute for professional medical diagnosis.
