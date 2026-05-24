/**
 * app.js — DermaDrishti Skin Cancer Detection Frontend Engine
 * ========================================================
 * Controls: Light/Dark theme switching, horizontal clip compare slider,
 * radial SVG confidence gauges, count-up numeric displays, dynamic themed Chart.js,
 * session timeline logs accordion, health pings, drag-and-drop, and copy-paste feeds.
 */

"use strict";

/* ── Configuration & Auto-Discovery ──────────────────────────── */
let API_BASE = "";

/* ── Target Categories Metadatas ────────────────────────────── */
const CLASS_DISPLAY = {
  akiec: { name: "Actinic Keratoses", color: "#e74c3c" },
  bcc:   { name: "Basal Cell Carcinoma", color: "#e67e22" },
  bkl:   { name: "Benign Keratosis", color: "#3498db" },
  df:    { name: "Dermatofibroma", color: "#9b59b6" },
  mel:   { name: "Melanoma", color: "#c0392b" },
  nv:    { name: "Melanocytic Nevi", color: "#27ae60" },
  vasc:  { name: "Vascular Lesions", color: "#1abc9c" },
};

/* ── Document Element References ────────────────────────────── */
// Header / Badges
const themeToggleBtn    = document.getElementById("theme-toggle");
const themeIcon         = document.getElementById("theme-icon");
const statusDot         = document.querySelector(".badge-dot");
const statusText        = document.getElementById("status-text");

// Upload Panel
const dropZone          = document.getElementById("drop-zone");
const fileInput         = document.getElementById("file-input");
const dropContent       = document.getElementById("drop-zone-content");
const previewState      = document.getElementById("preview-state");
const previewImg        = document.getElementById("preview-img");
const previewFilename   = document.getElementById("preview-filename");
const previewSize       = document.getElementById("preview-size");
const removeBtn         = document.getElementById("remove-image");
const analyzeBtn        = document.getElementById("analyze-btn");

// Results Dashboard
const resultsSection    = document.getElementById("results-section");
const demoBanner        = document.getElementById("demo-banner");
const resultBadge       = document.getElementById("result-badge");
const badgeIcon         = document.getElementById("badge-icon");
const badgeLabel        = document.getElementById("badge-label");
const resultIdEl        = document.getElementById("result-id");
const resultClassName   = document.getElementById("result-class-name");
const resultFullName    = document.getElementById("result-full-name");
const resultDescription = document.getElementById("result-description");

// SVG radial Confidence Gauge
const radialFillCircle  = document.getElementById("radial-fill-circle");
const confidenceValue   = document.getElementById("confidence-value");

// Grad-CAM Horizontal Clip Slider
const compareSlider     = document.getElementById("compare-slider");
const compareOrigImg    = document.getElementById("compare-orig-img");
const compareCamImg     = document.getElementById("compare-cam-img");

// Precautions & Logs
const precautionsList   = document.getElementById("precautions-list");
const precautionsTitle  = document.getElementById("precautions-title");
const historyList       = document.getElementById("history-list");
const clearHistoryBtn   = document.getElementById("clear-history-btn");

/* ── Application Session States ─────────────────────────────── */
let selectedFile = null;
let probabilityChart = null;
let currentPredictionData = null; // Store current prediction result
let predictionHistory = JSON.parse(localStorage.getItem("derma_history_new") || "[]");

/* ═══════════════════════════════════════════════════════════════
   SECTION 1 — Light/Dark Theme Controller & Discovery
   ═══════════════════════════════════════════════════════════════ */
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  const theme = savedTheme || (systemPrefersDark ? "dark" : "light");
  setTheme(theme);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  
  // Replace inner path of theme icon SVG
  if (theme === "dark") {
    // Moon Path
    themeIcon.innerHTML = `<path d="M12.3 22h-.1c-5.5 0-10-4.5-10-10 0-4.8 3.5-8.9 8.2-9.7.5-.1 1 .2 1.2.7.2.5 0 1.1-.4 1.4-3.7 2.5-4 7.8-1 10.7 2.2 2 5.2 2.2 7.7.4.4-.3.9-.3 1.3-.1.4.3.6.8.5 1.3-1.1 4.7-5.2 8.3-9.9 8.3z"/>`;
  } else {
    // Sun Path
    themeIcon.innerHTML = `<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.01c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>`;
  }

  // Live updates for Chart.js color palette if a prediction is active
  if (probabilityChart && currentPredictionData) {
    renderProbabilityChart(currentPredictionData.probabilities, currentPredictionData.predicted_label);
  }
}

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  setTheme(currentTheme === "dark" ? "light" : "dark");
});

initTheme();

/* ── Server Health & Dynamic Port Discovery ──────────────────── */
async function checkHealth() {
  if (window.location.protocol === "file:") {
    // Dynamic multi-port scanner if opened directly as local file
    const candidatePorts = [5001, 5002, 5003, 5004, 5005];
    for (const port of candidatePorts) {
      const url = `http://localhost:${port}`;
      try {
        const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1000) });
        if (res.ok) {
          const data = await res.json();
          API_BASE = url;
          statusText.textContent = data.demo_mode ? "Demo Mode" : "Model Online";
          statusDot.className = "badge-dot online";
          console.log(`✨ DermaDrishti active backend auto-detected on: ${url}`);
          return;
        }
      } catch (e) {
        // Search next candidate
      }
    }
    API_BASE = "http://localhost:5001";
    statusText.textContent = "Backend Offline";
    statusDot.className = "badge-dot offline";
  } else {
    // Relative routes if served properly by backend web server
    API_BASE = "";
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        statusText.textContent = data.demo_mode ? "Demo Mode" : "Model Online";
        statusDot.className = "badge-dot online";
      } else {
        throw new Error();
      }
    } catch {
      statusText.textContent = "Backend Offline";
      statusDot.className = "badge-dot offline";
    }
  }
}

checkHealth();
setInterval(checkHealth, 30_000);

/* ═══════════════════════════════════════════════════════════════
   SECTION 2 — Drag & Drop + Clipboard Upload Feeds
   ═══════════════════════════════════════════════════════════════ */
dropZone.addEventListener("click", (e) => {
  if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
    fileInput.click();
  }
});

dropZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    fileInput.click();
  }
});

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

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) handleFileSelected(file);
});

removeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  resetUpload();
});

function handleFileSelected(file) {
  if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
    alert("Invalid File Type: Please select a JPG or PNG skin scan.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert("File too large: Max allowed payload resolution is 10 MB.");
    return;
  }

  selectedFile = file;

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
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

document.addEventListener("paste", (e) => {
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

/* ═══════════════════════════════════════════════════════════════
   SECTION 3 — Draggable Horizontal Image Compare Slider
   ═══════════════════════════════════════════════════════════════ */
let isSliderDragging = false;

function initCompareSlider() {
  function setSliderPosition(x) {
    const rect = compareSlider.getBoundingClientRect();
    let pos = (x - rect.left) / rect.width;
    if (pos < 0) pos = 0;
    if (pos > 1) pos = 1;
    const percentage = pos * 100;
    compareSlider.style.setProperty("--slider-pos", `${percentage}%`);
  }

  compareSlider.addEventListener("mousedown", (e) => {
    isSliderDragging = true;
    setSliderPosition(e.clientX);
  });

  window.addEventListener("mousemove", (e) => {
    if (!isSliderDragging) return;
    setSliderPosition(e.clientX);
  });

  window.addEventListener("mouseup", () => {
    isSliderDragging = false;
  });

  compareSlider.addEventListener("touchstart", (e) => {
    isSliderDragging = true;
    if (e.touches?.[0]) setSliderPosition(e.touches[0].clientX);
  });

  window.addEventListener("touchmove", (e) => {
    if (!isSliderDragging) return;
    if (e.touches?.[0]) setSliderPosition(e.touches[0].clientX);
  });

  window.addEventListener("touchend", () => {
    isSliderDragging = false;
  });
}

initCompareSlider();

/* ═══════════════════════════════════════════════════════════════
   SECTION 4 — Model Inference Action Trigger
   ═══════════════════════════════════════════════════════════════ */
analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

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
      const err = await res.json().catch(() => ({ error: "Inference calculation failure." }));
      throw new Error(err.error || `HTTP Code ${res.status}`);
    }

    const data = await res.json();
    currentPredictionData = data;
    displayResults(data);

    resultsSection.classList.remove("hidden");
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });

  } catch (err) {
    alert(`Inference failed: ${err.message}\n\nMake sure the local Flask backend is active:\n  cd backend && python app.py`);
    console.error(err);
  } finally {
    analyzeBtn.classList.remove("loading");
    analyzeBtn.disabled = false;
  }
});

/* ═══════════════════════════════════════════════════════════════
   SECTION 5 — Results Dashboard Renderer
   ═══════════════════════════════════════════════════════════════ */
function displayResults(data) {
  if (data.demo_mode) {
    demoBanner.classList.remove("hidden");
  } else {
    demoBanner.classList.add("hidden");
  }

  resultBadge.className = "result-badge " + (data.is_cancer ? "cancer" : "safe");
  badgeIcon.textContent = data.is_cancer ? "⚠️" : "✅";
  badgeLabel.textContent = data.binary_result;

  resultIdEl.textContent = `ID: ${data.id} · ${data.timestamp}`;

  resultClassName.textContent = data.predicted_class;
  resultClassName.style.color = data.color;
  resultFullName.textContent = data.full_name;
  resultDescription.textContent = data.description;

  animateRadialGauge(data.confidence, data.is_cancer);

  compareOrigImg.src = previewImg.src;
  if (data.gradcam_image) {
    compareCamImg.src = data.gradcam_image;
    compareCamImg.style.display = "block";
  } else {
    compareCamImg.src = previewImg.src;
  }
  compareSlider.style.setProperty("--slider-pos", "50%");

  renderProbabilityChart(data.probabilities, data.predicted_label);
  renderPrecautions(data.precautions, data.is_cancer);
  registerHistoryLog(data);
}

function animateRadialGauge(targetVal, isCancer) {
  const circumference = 377;
  const offset = circumference - (circumference * (targetVal / 100));
  
  radialFillCircle.className.baseVal = "radial-fill " + (isCancer ? "cancer" : "safe");
  
  radialFillCircle.style.strokeDashoffset = circumference;
  setTimeout(() => {
    radialFillCircle.style.strokeDashoffset = offset;
  }, 100);

  let currentVal = 0;
  const duration = 1000;
  const totalSteps = 60;
  const stepTime = duration / totalSteps;
  const increment = targetVal / totalSteps;

  const interval = setInterval(() => {
    currentVal += increment;
    if (currentVal >= targetVal) {
      confidenceValue.textContent = `${targetVal.toFixed(2)}%`;
      clearInterval(interval);
    } else {
      confidenceValue.textContent = `${currentVal.toFixed(1)}%`;
    }
  }, stepTime);
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 6 — Custom Dynamic Themed Chart.js Renderer
   ═══════════════════════════════════════════════════════════════ */
function renderProbabilityChart(probabilities, predictedLabel) {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  
  const gridColor  = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)";
  const labelColor = isDark ? "#94a3b8" : "#64748b";

  const labels = Object.keys(probabilities).map((k) => CLASS_DISPLAY[k]?.name || k);
  const values = Object.values(probabilities);
  
  const bgColors = Object.keys(probabilities).map((k) => {
    const base = CLASS_DISPLAY[k]?.color || "#3b82f6";
    return k === predictedLabel ? base : base + "50";
  });
  
  const borderColors = Object.keys(probabilities).map((k) => {
    return CLASS_DISPLAY[k]?.color || "#3b82f6";
  });

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
        label: "Match Probability (%)",
        data: values,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? "#1e293b" : "#ffffff",
          titleColor: isDark ? "#f8fafc" : "#0f172a",
          bodyColor: isDark ? "#cbd5e1" : "#475569",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => ` Probability: ${ctx.raw.toFixed(2)}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "'Inter', sans-serif", size: 11, weight: "600" },
            color: labelColor,
            maxRotation: 20,
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: gridColor },
          ticks: {
            font: { family: "'Inter', sans-serif", size: 11, weight: "600" },
            color: labelColor,
            callback: (v) => `${v}%`,
          },
        },
      },
      animation: {
        duration: 900,
        easing: "easeOutQuart",
      },
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 7 — Clinical Precautions Stagger Loader
   ═══════════════════════════════════════════════════════════════ */
function renderPrecautions(precautions, isCancer) {
  precautionsTitle.className = "card-title precautions-title " + (isCancer ? "cancer" : "safe");
  precautionsList.innerHTML = "";

  const dataList = (precautions && precautions.length > 0)
    ? precautions
    : ["No critical precaution indexes recorded. Follow up with clinical dermatologists."];

  dataList.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = "precaution-item-card " + (isCancer ? "cancer" : "safe");
    card.style.animation = `fadeSlideIn 0.3s ease both ${idx * 0.12}s`;

    const icon = document.createElement("span");
    icon.className = "precaution-bullet";
    icon.textContent = isCancer ? "⚠️" : "🛡️";

    const text = document.createElement("span");
    text.className = "precaution-text";
    text.textContent = p;

    card.appendChild(icon);
    card.appendChild(text);
    precautionsList.appendChild(card);
  });
}

/* ═══════════════════════════════════════════════════════════════
   SECTION 8 — Expandable History Logs Timeline Registry
   ═══════════════════════════════════════════════════════════════ */
function registerHistoryLog(data) {
  const historyEntry = {
    id: data.id,
    timestamp: data.timestamp,
    predicted_class: data.predicted_class,
    confidence: data.confidence,
    is_cancer: data.is_cancer,
    binary_result: data.binary_result,
    color: data.color,
    full_name: data.full_name,
    description: data.description,
    precautions: data.precautions,
  };

  predictionHistory.unshift(historyEntry);
  if (predictionHistory.length > 10) {
    predictionHistory.pop();
  }

  localStorage.setItem("derma_history_new", JSON.stringify(predictionHistory));
  renderHistoryTimeline();
}

function renderHistoryTimeline() {
  historyList.innerHTML = "";

  if (predictionHistory.length === 0) {
    historyList.innerHTML = `
      <div class="history-empty">
        <div class="empty-icon">📋</div>
        <p>No scans evaluated yet. Upload an image to initialize session log.</p>
      </div>`;
    return;
  }

  predictionHistory.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "history-item-wrap";
    
    const pListItems = (item.precautions && item.precautions.length > 0)
      ? item.precautions.map(p => `<li>${p}</li>`).join("")
      : "<li>Follow up with clinical experts.</li>";

    wrapper.innerHTML = `
      <div class="history-item-header">
        <div class="history-left-side">
          <div class="history-dot" style="color: ${item.color}; background-color: ${item.color}"></div>
          <span class="history-class">${item.predicted_class}</span>
        </div>
        <div class="history-mid-side">
          <span class="history-confidence-pill">${item.confidence}% Match</span>
          <span class="history-status-pill ${item.is_cancer ? 'cancer' : 'safe'}">${item.binary_result}</span>
        </div>
        <div class="history-right-side">
          <span class="history-time">${item.timestamp}</span>
          <span class="history-toggle-icon">▼</span>
        </div>
      </div>
      <div class="history-item-body">
        <div class="history-body-layout">
          <div class="history-body-details">
            <h4 style="font-family: var(--font-display); font-weight: 800; font-size: 1.15rem; color: ${item.color}">
              ${item.full_name || item.predicted_class}
            </h4>
            <p class="history-body-desc">${item.description || 'No clinical definition cached.'}</p>
          </div>
          <div class="history-body-precautions">
            <h5>Suggested Actions</h5>
            <ul>${pListItems}</ul>
          </div>
        </div>
      </div>
    `;

    const header = wrapper.querySelector(".history-item-header");
    header.addEventListener("click", () => {
      const allItems = historyList.querySelectorAll(".history-item-wrap");
      allItems.forEach(i => {
        if (i !== wrapper) i.classList.remove("expanded");
      });
      wrapper.classList.toggle("expanded");
    });

    historyList.appendChild(wrapper);
  });
}

clearHistoryBtn.addEventListener("click", () => {
  if (predictionHistory.length === 0) return;
  if (confirm("Execute action: Clear all session logs from local storage?")) {
    predictionHistory = [];
    localStorage.removeItem("derma_history_new");
    
    historyList.style.opacity = 0;
    setTimeout(() => {
      renderHistoryTimeline();
      historyList.style.opacity = 1;
    }, 300);
  }
});

renderHistoryTimeline();
