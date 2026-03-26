/**
 * app.js — DermaDrishti Skin Cancer Detection Frontend
 * ================================================
 * Handles: drag-and-drop upload, API calls, Chart.js probability
 * bar chart, Grad-CAM display, prediction history, status ping.
 */

"use strict";

/* ── Config ─────────────────────────────────────────────────── */
const API_BASE = "http://localhost:5001";

/* ── Class display names & colors for Chart ─────────────────── */
const CLASS_DISPLAY = {
  akiec: { name: "Actinic Keratoses", color: "#e74c3c" },
  bcc:   { name: "Basal Cell Carcinoma", color: "#e67e22" },
  bkl:   { name: "Benign Keratosis", color: "#3498db" },
  df:    { name: "Dermatofibroma", color: "#9b59b6" },
  mel:   { name: "Melanoma", color: "#c0392b" },
  nv:    { name: "Melanocytic Nevi", color: "#27ae60" },
  vasc:  { name: "Vascular Lesions", color: "#1abc9c" },
};

/* ── DOM References ─────────────────────────────────────────── */
const dropZone          = document.getElementById("drop-zone");
const fileInput         = document.getElementById("file-input");
const dropContent       = document.getElementById("drop-zone-content");
const previewState      = document.getElementById("preview-state");
const previewImg        = document.getElementById("preview-img");
const previewFilename   = document.getElementById("preview-filename");
const previewSize       = document.getElementById("preview-size");
const removeBtn         = document.getElementById("remove-image");
const analyzeBtn        = document.getElementById("analyze-btn");
const resultsSection    = document.getElementById("results-section");
const demoBanner        = document.getElementById("demo-banner");
const resultCard        = document.getElementById("result-card");
const resultBadge       = document.getElementById("result-badge");
const badgeIcon         = document.getElementById("badge-icon");
const badgeLabel        = document.getElementById("badge-label");
const resultIdEl        = document.getElementById("result-id");
const resultClassName   = document.getElementById("result-class-name");
const resultFullName    = document.getElementById("result-full-name");
const confidenceValue   = document.getElementById("confidence-value");
const confidenceBar     = document.getElementById("confidence-bar");
const resultDescription = document.getElementById("result-description");
const gradcamImg        = document.getElementById("gradcam-img");
const precautionsList   = document.getElementById("precautions-list");
const precautionsTitle  = document.getElementById("precautions-title");
const historyList       = document.getElementById("history-list");
const statusText        = document.getElementById("status-text");
const statusDot         = document.querySelector(".badge-dot");

/* ── State ──────────────────────────────────────────────────── */
let selectedFile = null;
let probabilityChart = null;
let predictionHistory = JSON.parse(localStorage.getItem("derma_history") || "[]");

/* ═══════════════════════════════════════════════════════════════
   SECTION 1 — Health Check / Status
═══════════════════════════════════════════════════════════════ */
async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      statusText.textContent = data.demo_mode ? "Demo Mode" : "Model Online";
      statusDot.className = "badge-dot online";
    } else {
      throw new Error("Not OK");
    }
  } catch {
    statusText.textContent = "Backend Offline";
    statusDot.className = "badge-dot offline";
  }
}

checkHealth();
setInterval(checkHealth, 30_000); // re-check every 30s

/* ═══════════════════════════════════════════════════════════════
   SECTION 2 — Drag & Drop + File Selection
═══════════════════════════════════════════════════════════════ */

// Click on drop zone to trigger file picker
dropZone.addEventListener("click", (e) => {
  if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
    fileInput.click();
  }
});
dropZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") fileInput.click();
});

// Drag events
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files?.[0];
  if (file) handleFileSelected(file);
});

// File input change
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) handleFileSelected(file);
});

// Remove image
removeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  resetUpload();
});

function handleFileSelected(file) {
  // Validate type
  if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
    alert("Please upload a JPG or PNG image file.");
    return;
  }
  // Validate size (10 MB max)
  if (file.size > 10 * 1024 * 1024) {
    alert("File is too large. Please use an image under 10 MB.");
    return;
  }

  selectedFile = file;

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    previewFilename.textContent = file.name;
    previewSize.textContent = formatFileSize(file.size);
    dropContent.classList.add("hidden");
    previewState.classList.remove("hidden");
    analyzeBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

function resetUpload() {
  selectedFile = null;
  fileInput.value = "";
  previewImg.src = "";
  dropContent.classList.remove("hidden");
  previewState.classList.add("hidden");
  analyzeBtn.disabled = true;
  analyzeBtn.classList.remove("loading");
  analyzeBtn.querySelector(".btn-text").textContent = "Analyze Image";
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 3 — API Call / Prediction
═══════════════════════════════════════════════════════════════ */

analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  // Set loading state
  analyzeBtn.classList.add("loading");
  analyzeBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("image", selectedFile);

    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Server error." }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    displayResults(data);

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (err) {
    alert(`Prediction failed: ${err.message}\n\nMake sure the backend is running:\n  cd backend && python app.py`);
    console.error(err);
  } finally {
    analyzeBtn.classList.remove("loading");
    analyzeBtn.disabled = false;
  }
});

/* ═══════════════════════════════════════════════════════════════
   SECTION 4 — Display Results
═══════════════════════════════════════════════════════════════ */

function displayResults(data) {
  // Show results section
  resultsSection.classList.remove("hidden");

  // Demo mode banner
  if (data.demo_mode) {
    demoBanner.classList.remove("hidden");
  } else {
    demoBanner.classList.add("hidden");
  }

  // ── Result Badge (Cancer / Non-Cancer) ───────────
  resultBadge.className = "result-badge " + (data.is_cancer ? "cancer" : "safe");
  badgeIcon.textContent = data.is_cancer ? "⚠️" : "✅";
  badgeLabel.textContent = data.binary_result;

  resultIdEl.textContent = `ID: ${data.id} · ${data.timestamp}`;

  // ── Class Name & Description ─────────────────────
  resultClassName.textContent = data.predicted_class;
  resultClassName.style.color = data.color;
  resultFullName.textContent = data.full_name;
  resultDescription.textContent = data.description;

  // ── Confidence Bar ───────────────────────────────
  confidenceValue.textContent = `${data.confidence}%`;
  confidenceBar.style.width = "0%";
  setTimeout(() => {
    confidenceBar.style.width = `${data.confidence}%`;
    // Color the bar based on cancer status
    confidenceBar.style.background = data.is_cancer
      ? "linear-gradient(90deg, #ef4444, #dc2626)"
      : "linear-gradient(90deg, #22c55e, #16a34a)";
  }, 100);

  // ── Grad-CAM Image ───────────────────────────────
  if (data.gradcam_image) {
    gradcamImg.src = data.gradcam_image;
    gradcamImg.style.display = "block";
  }

  // ── Probability Bar Chart ────────────────────────
  renderProbabilityChart(data.probabilities, data.predicted_label);

  // ── Precautions ──────────────────────────────────
  renderPrecautions(data.precautions, data.is_cancer);

  // ── Save to History ──────────────────────────────
  const historyEntry = {
    id: data.id,
    timestamp: data.timestamp,
    predicted_class: data.predicted_class,
    confidence: data.confidence,
    is_cancer: data.is_cancer,
    binary_result: data.binary_result,
    color: data.color,
  };
  predictionHistory.unshift(historyEntry);
  if (predictionHistory.length > 10) predictionHistory.pop();
  localStorage.setItem("derma_history", JSON.stringify(predictionHistory));
  renderHistory();
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 5 — Probability Chart (Chart.js)
═══════════════════════════════════════════════════════════════ */

function renderProbabilityChart(probabilities, predictedLabel) {
  const labels = Object.keys(probabilities).map(
    (k) => CLASS_DISPLAY[k]?.name || k
  );
  const values = Object.values(probabilities);
  const backgroundColors = Object.keys(probabilities).map((k) => {
    const base = CLASS_DISPLAY[k]?.color || "#3b82f6";
    return k === predictedLabel ? base : base + "80"; // 50% opacity for others
  });
  const borderColors = Object.keys(probabilities).map(
    (k) => CLASS_DISPLAY[k]?.color || "#3b82f6"
  );

  // Destroy previous chart if exists
  if (probabilityChart) {
    probabilityChart.destroy();
    probabilityChart = null;
  }

  const ctx = document.getElementById("probability-chart").getContext("2d");
  probabilityChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Probability (%)",
        data: values,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.raw.toFixed(2)}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'Inter', sans-serif", size: 11 },
            color: "#6b7280",
            maxRotation: 25,
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: "#f3f4f6" },
          ticks: {
            font: { family: "'Inter', sans-serif", size: 11 },
            color: "#6b7280",
            callback: (v) => `${v}%`,
          },
        },
      },
      animation: {
        duration: 700,
        easing: "easeOutQuart",
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 6 — Precautions Rendering
═══════════════════════════════════════════════════════════════ */

function renderPrecautions(precautions, isCancer) {
  precautionsTitle.className = "card-title precautions-title " + (isCancer ? "cancer" : "safe");
  precautionsList.innerHTML = "";

  if (!precautions || precautions.length === 0) {
    precautionsList.innerHTML = '<li>Consult a dermatologist for further evaluation.</li>';
    return;
  }

  precautions.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p;
    precautionsList.appendChild(li);
  });
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 7 — Prediction History
═══════════════════════════════════════════════════════════════ */

function renderHistory() {
  historyList.innerHTML = "";

  if (predictionHistory.length === 0) {
    historyList.innerHTML = `
      <div class="history-empty">
        <div class="empty-icon">📋</div>
        <p>No predictions yet. Upload an image to get started.</p>
      </div>`;
    return;
  }

  predictionHistory.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div class="history-dot" style="background:${item.color}"></div>
      <div class="history-class">${item.predicted_class}</div>
      <div class="history-confidence">${item.confidence}%</div>
      <div class="history-badge ${item.is_cancer ? 'cancer' : 'safe'}">${item.binary_result}</div>
      <div class="history-time">${item.timestamp}</div>
    `;
    historyList.appendChild(div);
  });
}

// Initial render from localStorage
renderHistory();

/* ═══════════════════════════════════════════════════════════════
   SECTION 8 — Keyboard Accessibility
═══════════════════════════════════════════════════════════════ */

document.addEventListener("paste", (e) => {
  // Allow pasting images directly from clipboard
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) handleFileSelected(file);
      break;
    }
  }
});
