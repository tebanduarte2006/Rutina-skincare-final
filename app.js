// ─── Daily Reset ─────────────────────────────────────────────────────────────
function dailyReset() {
  var today = new Date().toDateString();
  var last  = localStorage.getItem("routine-date");
  if (last !== today) {
    localStorage.removeItem("routine-state");
    localStorage.setItem("routine-date", today);
  }
}

// ─── Save / Load ─────────────────────────────────────────────────────────────
function saveProgress() {
  var state = [];
  document.querySelectorAll(".step").forEach(function(step, i) {
    state[i] = step.classList.contains("checked");
  });
  localStorage.setItem("routine-state", JSON.stringify(state));
}

function loadProgress() {
  var state = JSON.parse(localStorage.getItem("routine-state") || "[]");
  document.querySelectorAll(".step").forEach(function(step, i) {
    if (state[i]) {
      step.classList.add("checked");
      step.setAttribute("aria-checked", "true");
    }
  });
  // Recalculate all progress bars after loading
  var groups = {};
  document.querySelectorAll(".step[data-group]").forEach(function(step) {
    var g = step.dataset.group;
    if (!groups[g]) groups[g] = 0;
    groups[g]++;
  });
  Object.keys(groups).forEach(function(g) {
    updateProg(g);
  });
}

// ─── Toggle step ─────────────────────────────────────────────────────────────
// Called via onclick="toggleStep(this, 'group')" from HTML
function toggleStep(el, group) {
  var was = el.classList.contains("checked");
  el.classList.toggle("checked");
  el.setAttribute("aria-checked", String(!was));

  // Update count for this group
  if (!window._counts) window._counts = {};
  if (window._counts[group] === undefined) {
    // Count current checked steps in group on first call
    window._counts[group] = document.querySelectorAll(
      ".step[data-group='" + group + "'].checked"
    ).length;
  } else {
    window._counts[group] += was ? -1 : 1;
  }

  updateProg(group);
  saveProgress();
  if (navigator.vibrate) navigator.vibrate(20);
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function updateProg(g) {
  // Count dynamically — no hardcoded totals
  var allSteps     = document.querySelectorAll(".step[data-group='" + g + "']");
  var checkedSteps = document.querySelectorAll(".step[data-group='" + g + "'].checked");
  var total = allSteps.length;
  var done  = checkedSteps.length;
  if (total === 0) return;
  var pct = Math.round(done / total * 100);

  var txt   = document.getElementById("prog-" + g + "-txt");
  var bar   = document.getElementById("prog-" + g + "-bar");
  var pctEl = document.getElementById("prog-" + g + "-pct");
  if (txt)   txt.textContent   = done + " / " + total;
  if (bar)   bar.style.width   = pct + "%";
  if (pctEl) pctEl.textContent = pct + "%";
}

function resetGroup(g) {
  document.querySelectorAll(".step[data-group='" + g + "']").forEach(function(s) {
    s.classList.remove("checked");
    s.setAttribute("aria-checked", "false");
  });
  if (window._counts) window._counts[g] = 0;
  updateProg(g);
  saveProgress();
}

// ─── UI: Tabs principales ─────────────────────────────────────────────────────
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

// ─── UI: Sub-tabs de noche ────────────────────────────────────────────────────
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

// ─── UI: Selector de dias ─────────────────────────────────────────────────────
function toggleDay(el) {
  el.classList.toggle("selected");
}

// ─── UI: Tracker de fases Zudenina ───────────────────────────────────────────
var phases = [
  {
    t: "Semanas 1-2 — Recuperación de barrera",
    b: "Solo Eucerin + Hydraskin cada noche. Sin activos agresivos. El adapaleno tiene efecto residual — agregar otro activo inmediatamente puede irritar. Si hay brotes urgentes: Benzac AC con hisopo puntual sobre la lesión individual solamente."
  },
  {
    t: "Semanas 3-4 — Reintroducción puntual de Benzac AC",
    b: "Benzac AC solo sobre lesiones individuales con hisopo. No extender a toda la cara. Observa tolerancia 1 semana antes de continuar. Si hay irritación o descamación: retrocede una semana."
  },
  {
    t: "Semanas 5-8 — Benzac AC en zonas afectadas",
    b: "Extiende Benzac AC a las zonas habitualmente afectadas (frente, nariz, mentón). Máximo 3 noches por semana. Las noches de afeitado: solo hidratante, sin excepción."
  },
  {
    t: "Semana 8+ — Consulta dermatológica obligatoria",
    b: "Evaluación profesional para determinar si hay resistencia a clindamicina y cuál es el protocolo definitivo. Este protocolo cumplió su función."
  }
];

function selectPhase(i) {
  document.querySelectorAll(".tracker-phase").forEach(function(p, idx) {
    p.classList.toggle("current", idx === i);
  });
  var d = document.getElementById("phase-desc");
  if (d) d.innerHTML = "<strong>" + phases[i].t + "</strong><br><br>" + phases[i].b;
}

// ─── Service Worker ───────────────────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function() {
    navigator.serviceWorker.register("./sw.js").then(function(reg) {
      reg.addEventListener("updatefound", function() {
        var worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", function() {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateBanner(worker);
          }
        });
      });
    }).catch(function(err) {
      console.warn("Service worker registration failed:", err);
    });
  });
}

function showUpdateBanner(worker) {
  var banner = document.createElement("div");
  banner.style.cssText = [
    "position:fixed", "bottom:20px", "left:16px", "right:16px",
    "background:#1c1c1e", "color:white", "padding:14px 16px",
    "border-radius:14px", "z-index:9999", "display:flex",
    "align-items:center", "justify-content:space-between", "gap:12px",
    "font-family:-apple-system,sans-serif", "font-size:14px",
    "box-shadow:0 4px 24px rgba(0,0,0,0.3)"
  ].join(";");

  banner.innerHTML = "<span>Nueva versión disponible</span>" +
    "<button id='updateBtn' style='background:#0a84ff;color:white;border:none;" +
    "border-radius:8px;padding:7px 14px;font-weight:600;cursor:pointer;font-size:13px;'>" +
    "Actualizar</button>";

  document.body.appendChild(banner);
  document.getElementById("updateBtn").addEventListener("click", function() {
    worker.postMessage("SKIP_WAITING");
    window.location.reload();
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────
dailyReset();
loadProgress();
