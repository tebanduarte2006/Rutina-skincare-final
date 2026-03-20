// ─── Daily Reset ─────────────────────────────────────────────────────────────
function dailyReset() {
  const today = new Date().toDateString();
  const last  = localStorage.getItem("routine-date");
  if (last !== today) {
    localStorage.removeItem("routine-state");
    localStorage.setItem("routine-date", today);
  }
}

// ─── Save / Load ─────────────────────────────────────────────────────────────
function saveProgress() {
  const state = [];
  document.querySelectorAll(".step").forEach((step, i) => {
    state[i] = step.classList.contains("checked");
  });
  localStorage.setItem("routine-state", JSON.stringify(state));
}

function loadProgress() {
  const state = JSON.parse(localStorage.getItem("routine-state") || "[]");
  document.querySelectorAll(".step").forEach((step, i) => {
    if (state[i]) {
      step.classList.add("checked");
      step.setAttribute("aria-checked", "true");
    }
  });
}

// ─── Toggle step ─────────────────────────────────────────────────────────────
function toggleStep(step) {
  const group = step.dataset.group;
  const was   = step.classList.contains("checked");

  step.classList.toggle("checked");
  step.setAttribute("aria-checked", String(!was));

  if (group && typeof updateProg === "function") updateProg(group);
  saveProgress();

  if (navigator.vibrate) navigator.vibrate(20);
}

document.addEventListener("click", function (e) {
  const step = e.target.closest(".step");
  if (!step) return;
  toggleStep(step);
});

// ─── Service Worker ───────────────────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("./sw.js");

      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;

        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateBanner(worker);
          }
        });
      });
    } catch (err) {
      console.warn("Service worker registration failed:", err);
    }
  });
}

function showUpdateBanner(worker) {
  const banner = document.createElement("div");
  banner.style.cssText = [
    "position:fixed", "bottom:20px", "left:20px", "right:20px",
    "background:#173554", "color:white", "padding:14px 16px",
    "border-radius:10px", "z-index:9999", "display:flex",
    "align-items:center", "justify-content:space-between", "gap:12px",
    "font-family:system-ui,sans-serif", "font-size:14px"
  ].join(";");

  banner.innerHTML = `
    <span>Nueva versión disponible</span>
    <button id="updateBtn" style="
      background:white;color:#173554;border:none;
      border-radius:6px;padding:6px 14px;
      font-weight:600;cursor:pointer;font-size:13px;">
      Actualizar
    </button>`;

  document.body.appendChild(banner);

  document.getElementById("updateBtn").addEventListener("click", () => {
    worker.postMessage("SKIP_WAITING");
    window.location.reload();
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────
dailyReset();
loadProgress();
