# DermaDrishti User Manual

## 1. Introduction
This manual provides instructions for installing, configuring, and using the **DermaDrishti** skin cancer detection system.

## 2. Installation & Setup

### 2.1 Prerequisites
-   **Python 3.9 or higher**
-   **Web Browser** (Chrome, Firefox, or Safari)
-   **Internet Connection** (for initial setup and dataset download)

### 2.2 Local Installation
1.  **Extract the project folder.**
2.  **Open a terminal/command prompt** in the project directory.
3.  **Install dependencies**:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```

## 3. Running the Application

### 3.1 Start the Server
In the project root directory, run the following command:
```bash
./run.sh
```
*Note: If on Windows, run `python backend/app.py` instead.*

### 3.2 Access the Dashboard
Once the server is running, open your browser and navigate to:
`http://localhost:5001`

## 4. How to Use the System

### 4.1 Uploading an Image
1.  Click the **"Upload Image"** area or drag and drop a skin lesion image.
2.  Alternatively, you can **Paste (Ctrl+V)** an image directly from your clipboard.

### 4.2 Analyzing the Results
1.  Click **"Analyze"**.
2.  The system will display:
    -   **Predicted Diagnosis**: The most likely class (e.g., Melanoma, Nevi).
    -   **Confidence Score**: The model's certainty percentage.
    -   **Probability Distribution**: A bar chart showing all 7 possible categories.
    -   **Grad-CAM Heatmap**: An image overlay showing exactly where the AI "looked" to make its decision.

### 4.3 Precautions & Info
Below the results, you will find specific **Precautions** and a **Description** of the detected condition. 

## 5. Troubleshooting
-   **Model Not Found**: Ensure `models/skin_cancer_model.h5` exists. If not, the app will run in "Demo Mode" with simulated results.
-   **CORS Error**: If the frontend cannot reach the backend, ensure you are accessing the app via the unified server URL provided in the terminal.
-   **Low Accuracy**: Ensure the input image is a clear, well-lit dermatoscopic image.

---
> ⚕️ **Medical Disclaimer:** This tool is for educational purposes and should not be used as a final clinical diagnosis. Always consult a professional dermatologist.
