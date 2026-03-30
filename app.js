// ─── Utilidades ───────────────────────────────────────────────────────────────

function el(tag, attrs, children) {
  var e = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function(k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
  }
  if (children) {
    children.forEach(function(c) {
      if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
  }
  return e;
}

// ─── Estado global ─────────────────────────────────────────────────────────────

var _appData   = null;  // rutina.json completo
var _dayStates = {};    // { day_selector_id: [bool, bool, ...] }

// ─── Persistencia ──────────────────────────────────────────────────────────────

function dailyReset() {
  var today = new Date().toDateString();
  var last  = localStorage.getItem('routine-date');
  if (last !== today) {
    localStorage.removeItem('routine-steps');
    localStorage.setItem('routine-date', today);
  }
}

function saveSteps() {
  var state = {};
  document.querySelectorAll('.step[data-id]').forEach(function(s) {
    state[s.dataset.id] = s.classList.contains('checked');
  });
  localStorage.setItem('routine-steps', JSON.stringify(state));
}

function loadSteps() {
  var raw   = localStorage.getItem('routine-steps');
  var state = raw ? JSON.parse(raw) : {};
  document.querySelectorAll('.step[data-id]').forEach(function(s) {
    if (state[s.dataset.id]) {
      s.classList.add('checked');
      s.setAttribute('aria-checked', 'true');
    }
  });
  // Recalcular barras de progreso
  var groups = {};
  document.querySelectorAll('.step[data-group]').forEach(function(s) {
    groups[s.dataset.group] = true;
  });
  Object.keys(groups).forEach(updateProg);
}

function saveDays() {
  localStorage.setItem('routine-days', JSON.stringify(_dayStates));
}

function loadDays() {
  var raw = localStorage.getItem('routine-days');
  if (!raw) return;
  var saved = JSON.parse(raw);
  Object.keys(saved).forEach(function(selectorId) {
    _dayStates[selectorId] = saved[selectorId];
    var btns = document.querySelectorAll('.day-btn[data-selector="' + selectorId + '"]');
    btns.forEach(function(btn, i) {
      if (_dayStates[selectorId][i]) btn.classList.add('selected');
      else btn.classList.remove('selected');
    });
  });
}

function savePhase(trackerId, index) {
  var phases = JSON.parse(localStorage.getItem('routine-phases') || '{}');
  phases[trackerId] = index;
  localStorage.setItem('routine-phases', JSON.stringify(phases));
}

function loadPhases() {
  var saved = JSON.parse(localStorage.getItem('routine-phases') || '{}');
  return saved;
}

// ─── Toggle paso ───────────────────────────────────────────────────────────────

function toggleStep(el, group) {
  var was = el.classList.contains('checked');
  el.classList.toggle('checked');
  el.setAttribute('aria-checked', String(!was));
  updateProg(group);
  saveSteps();
  if (navigator.vibrate) navigator.vibrate(20);
}

// ─── Barra de progreso ─────────────────────────────────────────────────────────

function updateProg(g) {
  var all     = document.querySelectorAll('.step[data-group="' + g + '"]');
  var checked = document.querySelectorAll('.step[data-group="' + g + '"].checked');
  var total   = all.length;
  var done    = checked.length;
  if (total === 0) return;
  var pct   = Math.round(done / total * 100);
  var txt   = document.getElementById('prog-' + g + '-txt');
  var bar   = document.getElementById('prog-' + g + '-bar');
  var pctEl = document.getElementById('prog-' + g + '-pct');
  if (txt)   txt.textContent   = done + ' / ' + total;
  if (bar)   bar.style.width   = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
}

function resetGroup(g) {
  document.querySelectorAll('.step[data-group="' + g + '"]').forEach(function(s) {
    s.classList.remove('checked');
    s.setAttribute('aria-checked', 'false');
  });
  updateProg(g);
  saveSteps();
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

function switchTab(moduleId, tabId) {
  var prefix = moduleId + '-';
  document.querySelectorAll('.tab-panel[data-module="' + moduleId + '"]').forEach(function(p) {
    p.classList.remove('active');
  });
  document.querySelectorAll('.main-tab[data-module="' + moduleId + '"]').forEach(function(t) {
    t.classList.remove('active');
  });
  var panel = document.getElementById('panel-' + prefix + tabId);
  var tab   = document.getElementById('tab-' + prefix + tabId);
  if (panel) panel.classList.add('active');
  if (tab)   tab.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchSub(group, scenarioId) {
  document.querySelectorAll('[id^="subpanel-' + group + '-"]').forEach(function(p) {
    p.classList.remove('active');
  });
  document.querySelectorAll('[id^="subtab-' + group + '-"]').forEach(function(t) {
    t.classList.remove('active');
  });
  var panel = document.getElementById('subpanel-' + group + '-' + scenarioId);
  var tab   = document.getElementById('subtab-' + group + '-' + scenarioId);
  if (panel) panel.classList.add('active');
  if (tab)   tab.classList.add('active');
}

// ─── Day selector ──────────────────────────────────────────────────────────────

function toggleDay(btn, selectorId, index) {
  btn.classList.toggle('selected');
  if (!_dayStates[selectorId]) _dayStates[selectorId] = [];
  _dayStates[selectorId][index] = btn.classList.contains('selected');
  saveDays();
}

// ─── Phase tracker ─────────────────────────────────────────────────────────────

function selectPhase(trackerId, index, phases) {
  document.querySelectorAll('.tracker-phase[data-tracker="' + trackerId + '"]').forEach(function(p, i) {
    p.classList.toggle('current', i === index);
  });
  var desc = document.getElementById('phase-desc-' + trackerId);
  if (desc) {
    desc.innerHTML = '<strong>' + phases[index].title + '</strong><br><br>' + phases[index].description;
  }
  savePhase(trackerId, index);
}

// ─── Renderers de secciones ───────────────────────────────────────────────────

function renderChecklist(sec) {
  var wrap  = el('div', { class: 'steps' });
  sec.steps.forEach(function(step) {
    var body = el('div', { class: 'step-body' }, [
      el('div', { class: 'step-name' }, [step.name]),
      step.detail ? el('div', { class: 'step-detail' }, [step.detail]) : null,
      step.product ? el('span', { class: 'product-tag' }, [step.product]) : null
    ]);
    var num  = el('div', { class: 'step-num' }, [sec.id ? '' : '']);
    var box  = el('div', { class: 'check-box' });
    var row  = el('div', {
      class: 'step',
      'data-id': step.id,
      'data-group': sec.id,
      'aria-checked': 'false',
      role: 'checkbox'
    }, [num, body, box]);
    row.addEventListener('click', function() { toggleStep(row, sec.id); });
    wrap.appendChild(row);
  });
  // Numerar
  var nums = wrap.querySelectorAll('.step-num');
  nums.forEach(function(n, i) { n.textContent = String(i + 1).padStart(2, '0'); });

  var frag = document.createDocumentFragment();
  if (sec.label) {
    frag.appendChild(el('div', { class: 'section-label' }, [sec.label]));
  }
  frag.appendChild(el('div', { class: 'progress-row' }, [
    el('span', { class: 'prog-label', id: 'prog-' + sec.id + '-txt' }, ['0 / ' + sec.steps.length]),
    el('div', { class: 'prog-wrap' }, [el('div', { class: 'prog-bar', id: 'prog-' + sec.id + '-bar' })]),
    el('span', { class: 'prog-pct', id: 'prog-' + sec.id + '-pct' }, ['0%'])
  ]));
  frag.appendChild(el('div', { class: 'reset-row' }, [
    (function() {
      var btn = el('button', { class: 'reset-btn' }, ['Reiniciar']);
      btn.addEventListener('click', function() { resetGroup(sec.id); });
      return btn;
    })()
  ]));
  frag.appendChild(wrap);
  return frag;
}

function renderScenarioPicker(sec) {
  var group    = sec.scenarios[0].id.split('_')[0] || 'n';
  var subTabs  = el('div', { class: 'sub-tabs' });
  var panels   = document.createDocumentFragment();

  sec.scenarios.forEach(function(scenario, i) {
    var tabBtn = el('button', {
      class: 'sub-tab' + (i === 0 ? ' active' : ''),
      id: 'subtab-' + group + '-' + scenario.id
    }, [scenario.label]);
    tabBtn.addEventListener('click', function() { switchSub(group, scenario.id); });
    subTabs.appendChild(tabBtn);

    var panel = el('div', {
      class: 'sub-panel' + (i === 0 ? ' active' : ''),
      id: 'subpanel-' + group + '-' + scenario.id
    });
    scenario.sections.forEach(function(childSec) {
      var rendered = renderSection(childSec);
      if (rendered) {
        if (rendered.nodeType === 11) panel.appendChild(rendered);
        else panel.appendChild(rendered);
      }
    });
    panels.appendChild(panel);
  });

  var frag = document.createDocumentFragment();
  if (sec.label) frag.appendChild(el('div', { class: 'section-label' }, [sec.label]));
  frag.appendChild(subTabs);
  var panelsWrap = document.createDocumentFragment();
  // Move children from panels fragment to a real element then back
  var panelsEl = el('div');
  // panels is a DocumentFragment — just append it
  frag.appendChild(subTabs);
  // Append each panel directly
  sec.scenarios.forEach(function(scenario, i) {
    // already built above, re-query
  });
  // Rebuild cleanly
  return (function() {
    var f = document.createDocumentFragment();
    if (sec.label) f.appendChild(el('div', { class: 'section-label' }, [sec.label]));
    f.appendChild(subTabs);
    sec.scenarios.forEach(function(scenario, i) {
      var panel = document.getElementById('subpanel-' + group + '-' + scenario.id);
      if (panel) f.appendChild(panel);
    });
    return f;
  })();
}

function renderAlert(sec) {
  var div = el('div', { class: 'alert alert-' + sec.variant });
  if (sec.label) div.appendChild(el('span', { class: 'alert-label' }, [sec.label]));
  div.appendChild(document.createTextNode(sec.text));
  return div;
}

function renderRules(sec) {
  var wrap = el('div', { class: 'steps-static' });
  sec.items.forEach(function(item) {
    var body = el('div', { class: 'step-body' }, [
      el('div', { class: 'step-name' }, [item.name]),
      item.detail ? el('div', { class: 'step-detail' }, [item.detail]) : null
    ]);
    wrap.appendChild(el('div', { class: 'step-static' }, [
      el('div', { class: 'step-num' }, [item.id]),
      body
    ]));
  });
  var frag = document.createDocumentFragment();
  if (sec.label) frag.appendChild(el('div', { class: 'section-label' }, [sec.label]));
  frag.appendChild(wrap);
  return frag;
}

function renderMetricGrid(sec) {
  var grid = el('div', { class: 'razor-grid' });
  sec.items.forEach(function(item) {
    var card = el('div', { class: 'razor-card' + (item.variant === 'warn' ? ' warn-card' : item.variant === 'ok' ? ' ok-card' : '') }, [
      el('div', { class: 'rc-label' }, [item.label]),
      el('div', { class: 'rc-val' + (item.variant === 'default' ? ' rc-val-default' : '') }, [item.value]),
      el('div', { class: 'rc-sub' }, [item.sublabel])
    ]);
    grid.appendChild(card);
  });
  var frag = document.createDocumentFragment();
  if (sec.label) frag.appendChild(el('div', { class: 'section-label' }, [sec.label]));
  frag.appendChild(grid);
  return frag;
}

function renderDaySelector(sec) {
  var selectorId = sec.id || ('daysel_' + Math.random().toString(36).slice(2));
  if (!_dayStates[selectorId]) {
    _dayStates[selectorId] = sec.days.map(function(_, i) {
      return (sec.default_selected || []).indexOf(i) >= 0;
    });
  }
  var wrap = el('div', { class: 'day-selector' });
  sec.days.forEach(function(day, i) {
    var isSelected = _dayStates[selectorId][i];
    var btn = el('button', {
      class: 'day-btn' + (isSelected ? ' selected' : ''),
      'data-selector': selectorId
    }, [day]);
    btn.addEventListener('click', function() { toggleDay(btn, selectorId, i); });
    wrap.appendChild(btn);
  });
  var frag = document.createDocumentFragment();
  if (sec.label) frag.appendChild(el('div', { class: 'section-label' }, [sec.label]));
  if (sec.sublabel) frag.appendChild(el('p', { style: 'font-size:13px;color:var(--text-muted);margin-bottom:10px;' }, [sec.sublabel]));
  frag.appendChild(wrap);
  return frag;
}

function renderPhaseTracker(sec) {
  var trackerId = sec.id || ('tracker_' + Math.random().toString(36).slice(2));
  var savedPhases = loadPhases();
  var defaultPhase = savedPhases[trackerId] !== undefined ? savedPhases[trackerId] : (sec.default || 0);

  var phasesGrid = el('div', { class: 'tracker-phases' });
  sec.phases.forEach(function(phase, i) {
    var card = el('div', {
      class: 'tracker-phase' + (i === defaultPhase ? ' current' : ''),
      'data-tracker': trackerId
    }, [
      el('span', { class: 'phase-num' }, [phase.label]),
      document.createTextNode(phase.sublabel)
    ]);
    card.addEventListener('click', function() { selectPhase(trackerId, i, sec.phases); });
    phasesGrid.appendChild(card);
  });

  var desc = el('div', { class: 'phase-desc', id: 'phase-desc-' + trackerId }, []);
  desc.innerHTML = '<strong>' + sec.phases[defaultPhase].title + '</strong><br><br>' + sec.phases[defaultPhase].description;

  var tracker = el('div', { class: 'tracker' }, [
    el('div', { class: 'tracker-title' }, [sec.title]),
    el('div', { class: 'tracker-sub' }, [sec.subtitle]),
    phasesGrid,
    desc
  ]);
  return tracker;
}

function renderPermitTable(sec) {
  var thead = el('thead', null, [
    el('tr', null, sec.columns.map(function(col) {
      return el('th', null, [col]);
    }))
  ]);
  var tbody = el('tbody');
  sec.rows.forEach(function(row) {
    var tr = el('tr');
    var tdProduct = el('td', row.highlight ? { style: 'color:var(--' + (row.highlight === 'danger' ? 'red' : row.highlight) + ');font-style:italic;' } : null, [row.product]);
    tr.appendChild(tdProduct);
    row.values.forEach(function(val) {
      var cls = val === 'ok' ? 'ok-cell' : val === 'no' ? 'no-cell' : 'half-cell';
      var sym = val === 'ok' ? '✓' : val === 'no' ? '✗' : '± puntual';
      tr.appendChild(el('td', { class: cls }, [sym]));
    });
    tbody.appendChild(tr);
  });
  var table = el('table', { class: 'permit-table' }, [thead, tbody]);
  var frag = document.createDocumentFragment();
  if (sec.label) frag.appendChild(el('div', { class: 'section-label' }, [sec.label]));
  frag.appendChild(el('div', { style: 'overflow-x:auto;border-radius:var(--radius);' }, [table]));
  return frag;
}

function renderDivider() {
  return el('div', { class: 'divider' });
}

function renderSection(sec) {
  switch (sec.type) {
    case 'checklist':       return renderChecklist(sec);
    case 'scenario_picker': return renderScenarioPicker(sec);
    case 'alert':           return renderAlert(sec);
    case 'rules':           return renderRules(sec);
    case 'metric_grid':     return renderMetricGrid(sec);
    case 'day_selector':    return renderDaySelector(sec);
    case 'phase_tracker':   return renderPhaseTracker(sec);
    case 'permit_table':    return renderPermitTable(sec);
    case 'divider':         return renderDivider();
    default:                return null;
  }
}

// ─── Renderizado principal ─────────────────────────────────────────────────────

function renderApp(data) {
  _appData = data;

  // Header
  var titleEl = document.getElementById('app-title');
  var subEl   = document.getElementById('app-subtitle');
  if (titleEl) titleEl.textContent = data.app.title;
  if (subEl)   subEl.textContent   = data.app.subtitle;

  var mainTabsEl  = document.getElementById('main-tabs');
  var contentEl   = document.getElementById('app-content');
  if (!mainTabsEl || !contentEl) return;

  // Si hay mas de un modulo, crear selector de modulos
  // Por ahora renderizamos el primer modulo directamente (escalable a futuro)
  data.modules.forEach(function(module, mIdx) {
    module.tabs.forEach(function(tab, tIdx) {
      var tabId  = module.id + '-' + tab.id;
      var isFirst = mIdx === 0 && tIdx === 0;

      // Tab button
      var tabBtn = el('button', {
        class: 'main-tab' + (isFirst ? ' active' : ''),
        id: 'tab-' + tabId,
        'data-module': module.id
      }, [tab.icon + ' ' + tab.label]);
      tabBtn.addEventListener('click', function() { switchTab(module.id, tab.id); });
      mainTabsEl.appendChild(tabBtn);

      // Tab panel
      var panel = el('div', {
        class: 'tab-panel' + (isFirst ? ' active' : ''),
        id: 'panel-' + tabId,
        'data-module': module.id
      });
      tab.sections.forEach(function(sec) {
        var rendered = renderSection(sec);
        if (rendered) panel.appendChild(rendered);
      });
      contentEl.appendChild(panel);
    });
  });

  // Fase pill — apunta al primer tab con phase_tracker
  var pillEl = document.getElementById('phase-pill');
  if (pillEl) {
    var firstTracker = null;
    outer: for (var m = 0; m < data.modules.length; m++) {
      for (var t = 0; t < data.modules[m].tabs.length; t++) {
        var tab = data.modules[m].tabs[t];
        for (var s = 0; s < tab.sections.length; s++) {
          if (tab.sections[s].type === 'phase_tracker') {
            firstTracker = { moduleId: data.modules[m].id, tabId: tab.id };
            break outer;
          }
        }
      }
    }
    if (firstTracker) {
      pillEl.addEventListener('click', function() {
        switchTab(firstTracker.moduleId, firstTracker.tabId);
      });
    }
  }
}

// ─── Service Worker ───────────────────────────────────────────────────────────

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js').then(function(reg) {
      reg.addEventListener('updatefound', function() {
        var worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', function() {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(worker);
          }
        });
      });
    }).catch(function(err) {
      console.warn('SW registration failed:', err);
    });
  });
}

function showUpdateBanner(worker) {
  var banner = el('div', {
    style: [
      'position:fixed', 'bottom:20px', 'left:16px', 'right:16px',
      'background:#1c1c1e', 'color:white', 'padding:14px 16px',
      'border-radius:14px', 'z-index:9999', 'display:flex',
      'align-items:center', 'justify-content:space-between', 'gap:12px',
      'font-family:-apple-system,sans-serif', 'font-size:14px',
      'border:1px solid rgba(0,255,166,0.3)',
      'box-shadow:0 0 20px rgba(0,255,166,0.15)'
    ].join(';')
  }, [
    el('span', null, ['Nueva versión disponible'])
  ]);
  var btn = el('button', {
    style: 'background:#00ffa6;color:#000;border:none;border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer;font-size:13px;'
  }, ['Actualizar']);
  btn.addEventListener('click', function() {
    worker.postMessage('SKIP_WAITING');
    window.location.reload();
  });
  banner.appendChild(btn);
  document.body.appendChild(banner);
}

// ─── Init ──────────────────────────────────────────────────────────────────────

dailyReset();

fetch('./rutina.json')
  .then(function(r) { return r.json(); })
  .then(function(data) {
    renderApp(data);
    loadSteps();
    loadDays();
  })
  .catch(function(err) {
    console.error('Error cargando rutina.json:', err);
    document.getElementById('app-content').innerHTML =
      '<div style="padding:40px;text-align:center;color:var(--text-muted);">Error cargando rutinas. Verifica tu conexion.</div>';
  });
