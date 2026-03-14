/* app.js - versión final 10/10 */

/* --- Storage keys --- */
const STORAGE_KEY = "rutina-progress-v1";
const DATE_KEY = "rutina-date-v1";

/* --- Utility: safe id for a step --- */
function stepId(step) {
  // Prefer data-id if provided; else fallback to group-num
  if (!step) return null;
  if (step.dataset.id) return step.dataset.id;
  const g = step.dataset.group || "x";
  const numEl = step.querySelector(".step-num");
  const n = numEl ? numEl.textContent.trim() : Math.random().toString(36).slice(2,7);
  return `${g}-${n}`;
}

/* --- Persistencia --- */
function saveProgress() {
  const completed = [...document.querySelectorAll(".step")]
    .filter(s => s.classList.contains("completed"))
    .map(s => stepId(s));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const completed = JSON.parse(raw);
    document.querySelectorAll(".step").forEach(step => {
      if (completed.includes(stepId(step))) step.classList.add("completed");
    });
  } catch (e) {
    console.warn("loadProgress error", e);
  }
}

/* --- Daily reset --- */
function checkDailyReset() {
  const today = new Date().toDateString();
  const saved = localStorage.getItem(DATE_KEY);
  if (saved !== today) {
    // New day -> clear progress
    localStorage.setItem(DATE_KEY, today);
    localStorage.removeItem(STORAGE_KEY);
    document.querySelectorAll(".step").forEach(s => s.classList.remove("completed"));
    // update all groups
    ["m","s1","s2","s3"].forEach(g => updateProgress(g));
  }
}

/* --- Update progress UI --- */
function updateProgress(group) {
  if (!group) return;
  const steps = [...document.querySelectorAll(`.step[data-group="${group}"]`)];
  const done = steps.filter(s => s.classList.contains("completed")).length;
  const total = Math.max(1, steps.length);
  const pct = Math.round((done / total) * 100);
  const txt = document.getElementById(`prog-${group}-txt`);
  const bar = document.getElementById(`prog-${group}-bar`);
  const pctEl = document.getElementById(`prog-${group}-pct`);
  if (txt) txt.textContent = `${done} / ${total}`;
  if (bar) bar.style.width = `${pct}%`;
  if (pctEl) pctEl.textContent = `${pct}%`;
}

/* --- Reset specific group --- */
function resetGroup(group) {
  document.querySelectorAll(`.step[data-group="${group}"]`).forEach(s => s.classList.remove("completed"));
  updateProgress(group);
  saveProgress();
}

/* --- Toggle day (for day buttons) --- */
function toggleDay(el) { el.classList.toggle("selected"); }

/* --- UI: switch main tabs --- */
function switchTabName(target) {
  document.querySelectorAll(".main-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.target === target);
    t.setAttribute("aria-selected", t.dataset.target === target ? "true" : "false");
  });
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === `panel-${target}`));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* --- UI: switch sub-tabs --- */
function switchSub(parent, sub) {
  document.querySelectorAll(`#panel-${parent} .sub-tab`).forEach(t => t.classList.toggle("active", t.dataset.target === sub));
  document.querySelectorAll(`#panel-${parent} .sub-panel`).forEach(p => p.classList.toggle("active", p.id === `subpanel-${parent}-${sub}`));
}

/* --- Phase selection --- */
const PHASE_TEXTS = [
  "Semanas 1-2 — Recuperación de barrera. Solo limpieza + hidratante.",
  "Semanas 3-4 — Benzac AC puntual sobre lesiones individuales.",
  "Semanas 5-8 — Benzac puede aplicarse en zonas problemáticas.",
  "Semana 8+ — Evaluación dermatológica recomendada."
];
function selectPhase(index) {
  const phases = document.querySelectorAll(".tracker-phase");
  phases.forEach((p, i) => p.classList.toggle("current", i === index));
  const desc = document.getElementById("phase-desc");
  if (desc) desc.innerHTML = PHASE_TEXTS[index] || "";
}

/* --- Global click handler (event delegation) --- */
document.addEventListener("click", (e) => {
  const step = e.target.closest(".step");
  if (step && document.body.contains(step)) {
    // Toggle step
    step.classList.toggle("completed");
    // Short vibration if available & mobile (avoid on desktops)
    if (navigator.vibrate) {
      try { navigator.vibrate(20); } catch (err) { /* ignore */ }
    }
    const group = step.dataset.group;
    updateProgress(group);
    saveProgress();
    return;
  }

  // Reset buttons
  const resetBtn = e.target.closest("[data-reset]");
  if (resetBtn) {
    const g = resetBtn.dataset.reset;
    resetGroup(g);
    return;
  }

  // Main tabs
  const mainTab = e.target.closest(".main-tab");
  if (mainTab && mainTab.dataset.target) {
    switchTabName(mainTab.dataset.target);
    return;
  }

  // Sub tabs
  const subTab = e.target.closest(".sub-tab");
  if (subTab && subTab.dataset.parent && subTab.dataset.target) {
    switchSub(subTab.dataset.parent, subTab.dataset.target);
    return;
  }

  // Day buttons
  const dayBtn = e.target.closest(".day-btn");
  if (dayBtn) { toggleDay(dayBtn); return; }
});

/* --- Initialization on DOMContentLoaded --- */
document.addEventListener("DOMContentLoaded", () => {
  checkDailyReset();
  loadProgress();
  // update progress per existing groups
  ["m","s1","s2","s3"].forEach(g => updateProgress(g));
});

/* --- Service Worker registration + update prompt handling --- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("./sw.js");
      // When an update is found
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // show update prompt to user
            showUpdatePrompt(newWorker);
          }
        });
      });
    } catch (err) {
      console.warn("SW register failed", err);
    }
  });
}

/* --- Update prompt UI --- */
function showUpdatePrompt(worker) {
  // If exists, don't add again
  if (document.getElementById("update-banner")) return;

  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.setAttribute("role", "status");
  banner.style.position = "fixed";
  banner.style.left = "12px";
  banner.style.right = "12px";
  banner.style.bottom = "18px";
  banner.style.zIndex = 99999;
  banner.style.background = "#142535";
  banner.style.color = "white";
  banner.style.padding = "14px";
  banner.style.borderRadius = "10px";
  banner.style.boxShadow = "0 8px 30px rgba(0,0,0,0.45)";
  banner.style.display = "flex";
  banner.style.alignItems = "center";
  banner.style.justifyContent = "space-between";
  banner.style.gap = "10px";
  banner.innerHTML = `<div style="font-weight:700">Nueva versión disponible</div>
    <div style="display:flex;gap:8px">
      <button id="update-refresh" style="background:${'#3f8ed0'};border:none;color:white;padding:8px 10px;border-radius:8px;cursor:pointer;font-weight:700">Actualizar</button>
      <button id="update-dismiss" style="background:transparent;border:1px solid rgba(255,255,255,0.06);color:white;padding:8px 10px;border-radius:8px;cursor:pointer">Cerrar</button>
    </div>`;

  document.body.appendChild(banner);

  document.getElementById("update-refresh").addEventListener("click", () => {
    worker.postMessage("SKIP_WAITING");
    // Wait briefly for SW to take control, then reload
    setTimeout(() => location.reload(true), 600);
  });

  document.getElementById("update-dismiss").addEventListener("click", () => {
    banner.remove();
  });
}
