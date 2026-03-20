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
// --- UI: Tabs principales ---
function switchTab(n) {
  document.querySelectorAll(".tab-panel").forEach(function(p) {
    p.classList.remove("active");
  });
  document.querySelectorAll(".main-tab").forEach(function(t) {
    t.classList.remove("active");
  });
  document.getElementById("panel-" + n).classList.add("active");
  document.getElementById("tab-" + n).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- UI: Sub-tabs de noche ---
function switchSub(g, s) {
  document.querySelectorAll("[id^='subpanel-" + g + "-']").forEach(function(p) {
    p.classList.remove("active");
  });
  document.querySelectorAll("[id^='subtab-" + g + "-']").forEach(function(t) {
    t.classList.remove("active");
  });
  document.getElementById("subpanel-" + g + "-" + s).classList.add("active");
  document.getElementById("subtab-" + g + "-" + s).classList.add("active");
}

// --- UI: Barra de progreso ---
const totals = { m: 4, s1: 3, s2: 4, s3: 6 };
const counts  = { m: 0, s1: 0, s2: 0, s3: 0 };

function updateProg(g) {
  var done = Math.max(0, Math.min(counts[g], totals[g]));
  var pct  = Math.round(done / totals[g] * 100);
  var txt  = document.getElementById("prog-" + g + "-txt");
  var bar  = document.getElementById("prog-" + g + "-bar");
  var pctEl = document.getElementById("prog-" + g + "-pct");
  if (txt)   txt.textContent  = done + " / " + totals[g];
  if (bar)   bar.style.width  = pct + "%";
  if (pctEl) pctEl.textContent = pct + "%";
}

function resetGroup(g) {
  document.querySelectorAll("[data-group='" + g + "']").forEach(function(s) {
    s.classList.remove("checked");
    s.setAttribute("aria-checked", "false");
  });
  counts[g] = 0;
  updateProg(g);
}

// --- UI: Selector de dias ---
function toggleDay(el) {
  el.classList.toggle("selected");
}

// --- UI: Tracker de fases Zudenina ---
var phases = [
  {
    t: "Semanas 1-2 - Recuperacion de barrera",
    b: "Solo Eucerin + Hydraskin cada noche. Sin activos agresivos. El adapaleno tiene efecto residual: agregar otro activo inmediatamente puede irritar. Si hay brotes urgentes: Benzac AC con hisopo puntual sobre la lesion individual solamente."
  },
  {
    t: "Semanas 3-4 - Reintroduccion puntual de Benzac AC",
    b: "Benzac AC solo sobre lesiones individuales con hisopo. No extender a toda la cara. Observa tolerancia 1 semana antes de continuar. Si hay irritacion o descamacion: retrocede una semana."
  },
  {
    t: "Semanas 5-8 - Benzac AC en zonas afectadas",
    b: "Extiende Benzac AC a las zonas habitualmente afectadas (frente, nariz, menton). Maximo 3 noches por semana. Las noches de afeitado: solo hidratante, sin excepcion."
  },
  {
    t: "Semana 8+ - Consulta dermatologica obligatoria",
    b: "Evaluacion profesional para determinar si hay resistencia a clindamicina y cual es el protocolo definitivo. Este protocolo cumplio su funcion."
  }
];

function selectPhase(i) {
  document.querySelectorAll(".tracker-phase").forEach(function(p, idx) {
    p.classList.toggle("current", idx === i);
  });
  var d = document.getElementById("phase-desc");
  if (d) d.innerHTML = "<strong>" + phases[i].t + "</strong><br><br>" + phases[i].b;
}
