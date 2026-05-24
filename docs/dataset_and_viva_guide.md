•/run.sh# DermaDrishti: Workflow, Dataset & Viva Guide

This document provides a comprehensive overview of how the DermaDrishti system operates, detailed information about our training dataset, the real-world utility of this project, and a curated list of important Viva (oral examination) questions commonly asked regarding this dataset and architecture.

---

## 1. How We Work (System Workflow)

The DermaDrishti system is designed as an end-to-end full-stack application that seamlessly bridges modern web interfaces with advanced deep learning models. 

### The Architecture
1. **Frontend (User Interface):** A responsive, glassmorphism-inspired Web UI built with HTML/CSS/JS (or React). It allows users to upload or paste dermatoscopic images of skin lesions, view real-time confidence charts, and see visual explanations.
2. **Backend (API Server):** A robust Python server (using Flask or FastAPI) that exposes RESTful endpoints. It receives the uploaded image, preprocesses it, and coordinates the inference pipeline.
3. **Deep Learning Model:** An **EfficientNetB0** model, fine-tuned via transfer learning to classify skin images into 7 distinct categories.
4. **Explainable AI (XAI):** A **Grad-CAM** (Gradient-weighted Class Activation Mapping) module that takes the model's internal gradients to generate a heatmap over the original image, highlighting the exact visual areas that led to the prediction.

### The Step-by-Step Process
1. **Image Upload:** The user uploads an image of a skin lesion.
2. **Preprocessing:** The backend resizes the image to 224x224 pixels and normalizes pixel values to match the input format expected by EfficientNetB0.
3. **Inference:** The preprocessed image is passed through the neural network, which outputs a probability distribution across the 7 possible classes.
4. **Grad-CAM Generation:** The backend calculates the gradients of the predicted class with respect to the final convolutional layer to generate a heatmap.
5. **Response:** The backend sends the diagnosis, confidence scores, precautions, and the encoded Grad-CAM heatmap back to the frontend for the user to view.

---

## 2. Our Dataset: HAM10000

The foundational data used to train DermaDrishti is the **HAM10000** ("Human Against Machine with 10,000 training images") dataset.

### Overview
- **Source:** Collected by the Medical University of Vienna and the skin cancer practice of Cliff Rosendahl.
- **Content:** Contains 10,015 dermatoscopic images of pigmented skin lesions representing the most important diagnostic categories in the realm of pigmented lesions.
- **Validation:** More than 50% of lesions are confirmed through histopathology (biopsy), while others are confirmed via expert consensus or in-vivo confocal microscopy.

### The 7 Classes of Lesions
The dataset categorizes lesions into 7 types, varying from highly dangerous to benign:
1. **Melanoma (`mel`)** - 🔴 Highly malignant skin cancer.
2. **Basal Cell Carcinoma (`bcc`)** - 🔴 Common skin cancer.
3. **Actinic Keratosis / Bowen's Disease (`akiec`)** - 🔴 Pre-cancerous lesion.
4. **Melanocytic Nevi (`nv`)** - 🟢 Benign mole (Majority of the dataset: ~67%).
5. **Benign Keratosis-like Lesions (`bkl`)** - 🟢 Benign lesions including seborrheic keratosis.
6. **Dermatofibroma (`df`)** - 🟢 Benign skin growth.
7. **Vascular Lesions (`vasc`)** - 🟢 Benign lesions like angiomas.

### The Challenge: Class Imbalance
A defining characteristic of HAM10000 is its heavy class imbalance. Over 6,700 images are simple benign Nevi (`nv`), while critical classes like Melanoma (`mel`) and Vascular lesions (`vasc`) have far fewer samples. We handle this in our pipeline using **Class Weights** and **Data Augmentation**.

---

## 3. How It Is Useful

DermaDrishti provides immense value in both medical and personal contexts:

- **Early Detection:** Skin cancer, particularly melanoma, is highly treatable if caught early. This tool provides instant preliminary screening to encourage users to seek professional help sooner.
- **Assisting Dermatologists:** Serves as a "second opinion" tool for clinicians, helping to double-check diagnoses and reduce human error, especially in high-volume clinics.
- **Accessibility:** Brings expert-level preliminary diagnostic capabilities to remote or underserved areas where access to specialized dermatologists is limited.
- **Trust through Transparency:** By utilizing Grad-CAM heatmaps, the system doesn't just act as a "black box." It visually explains *why* it made a prediction, allowing doctors to verify the AI's reasoning.
- **Educational Tool:** Useful for medical students learning dermatoscopy by showing them exactly which features (like irregular borders or color variations) indicate malignancy.

---

## 4. Important Viva Questions & Answers

If you are presenting this project, expect examiners to probe your understanding of the dataset, your architectural choices, and how you handled challenges. Here are the most critical Viva questions:

### Q1. What dataset did you use and what does HAM10000 stand for?
**Answer:** We used the HAM10000 dataset, which stands for "Human Against Machine with 10,000 training images." It is a large collection of multi-source dermatoscopic images of common pigmented skin lesions.

### Q2. Why did you choose EfficientNetB0 over traditional architectures like ResNet or VGG16?
**Answer:** Traditional architectures scale up by just adding more layers (depth) or wider layers (width), which is computationally expensive. EfficientNet uses a compound scaling method that uniformly scales width, depth, and resolution. This makes EfficientNetB0 much faster, smaller in file size, and more accurate, which is ideal for real-time web applications.

### Q3. The HAM10000 dataset is highly imbalanced (mostly benign moles). How did you prevent your model from just guessing "Nevi" every time?
**Answer:** We tackled class imbalance primarily through **Class Weighting** during training. We assigned higher weights to minority classes (like Melanoma) and lower weights to the majority class (Nevi). This penalizes the model more heavily for misclassifying a dangerous minority class. We also used **Data Augmentation** (rotations, flips, zooming) to synthetically expand the variety of the minority classes.

### Q4. What is Grad-CAM and why is it necessary for this project?
**Answer:** Grad-CAM stands for Gradient-weighted Class Activation Mapping. In medical AI, a "black box" model that just spits out a diagnosis is hard for doctors to trust. Grad-CAM visualizes the areas of the image that strongly influenced the model's decision (as a heatmap). It is necessary for **Explainable AI (XAI)**, providing transparency and helping clinicians verify if the model is looking at the actual lesion or just background noise.

### Q5. What are the 7 classes you are predicting? Which ones are dangerous?
**Answer:** The 7 classes are Melanoma (mel), Basal Cell Carcinoma (bcc), Actinic Keratosis (akiec), Melanocytic Nevi (nv), Benign Keratosis (bkl), Dermatofibroma (df), and Vascular lesions (vasc). The dangerous (malignant/pre-cancerous) ones are Melanoma, Basal Cell Carcinoma, and Actinic Keratosis.

### Q6. What metrics did you use to evaluate your model? Is Accuracy enough?
**Answer:** While we track overall **Accuracy**, it is *not* enough due to the imbalanced dataset (a model predicting "Nevi" every time would still get ~67% accuracy). Therefore, we closely monitored **Precision**, **Recall (Sensitivity)**, and the **F1-Score**. High *Recall* for malignant classes like Melanoma is the most critical metric, because false negatives (telling a patient they are fine when they actually have cancer) are fatal.

### Q7. How are the images preprocessed before they are fed into the model?
**Answer:** Images are first resized to 224x224 pixels to match the input layer of EfficientNetB0. They are then converted to arrays, and the pixel values are normalized (usually between 0 and 1, or standardized using EfficientNet's specific preprocessing function) to help the neural network converge faster during inference.

### Q8. What happens if I upload an image of a dog or a random object instead of skin?
**Answer:** Because the model was trained strictly on 7 classes of skin lesions, it is forced to classify the dog into one of those 7 categories based on whatever textures or colors loosely match. *(Future scope: To fix this, an Out-of-Distribution (OOD) detector or a preliminary binary classifier (Skin vs. Non-Skin) should be added before the main model).*
