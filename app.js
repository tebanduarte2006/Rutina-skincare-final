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

var _dayStates = {};

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
  Object.keys(saved).forEach(function(sid) {
    _dayStates[sid] = saved[sid];
    document.querySelectorAll('.day-btn[data-selector="' + sid + '"]').forEach(function(btn, i) {
      if (_dayStates[sid][i]) btn.classList.add('selected');
      else btn.classList.remove('selected');
    });
  });
}

function savePhase(trackerId, index) {
  var phases = JSON.parse(localStorage.getItem('routine-phases') || '{}');
  phases[trackerId] = index;
  localStorage.setItem('routine-phases', JSON.stringify(phases));
}

// ─── Toggle paso ───────────────────────────────────────────────────────────────

function toggleStep(stepEl, group) {
  var was = stepEl.classList.contains('checked');
  stepEl.classList.toggle('checked');
  stepEl.setAttribute('aria-checked', String(!was));
  updateProg(group);
  saveSteps();
  if (navigator.vibrate) navigator.vibrate(20);
}

// ─── Progreso ──────────────────────────────────────────────────────────────────

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
  document.querySelectorAll('.tab-panel[data-module="' + moduleId + '"]').forEach(function(p) {
    p.classList.remove('active');
  });
  document.querySelectorAll('.main-tab[data-module="' + moduleId + '"]').forEach(function(t) {
    t.classList.remove('active');
  });
  var panel = document.getElementById('panel-' + moduleId + '-' + tabId);
  var tab   = document.getElementById('tab-' + moduleId + '-' + tabId);
  if (panel) panel.classList.add('active');
  if (tab)   tab.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchSub(groupId, scenarioId) {
  document.querySelectorAll('[id^="subpanel-' + groupId + '-"]').forEach(function(p) {
    p.classList.remove('active');
  });
  document.querySelectorAll('[id^="subtab-' + groupId + '-"]').forEach(function(t) {
    t.classList.remove('active');
  });
  var panel = document.getElementById('subpanel-' + groupId + '-' + scenarioId);
  var tab   = document.getElementById('subtab-' + groupId + '-' + scenarioId);
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
  if (desc) desc.innerHTML = '<strong>' + phases[index].title + '</strong><br><br>' + phases[index].description;
  savePhase(trackerId, index);
}

// ─── Renderers ────────────────────────────────────────────────────────────────

function renderChecklist(sec) {
  var wrap = el('div', { class: 'steps' });
  sec.steps.forEach(function(step, i) {
    var children = [
      el('div', { class: 'step-name' }, [step.name])
    ];
    if (step.detail) children.push(el('div', { class: 'step-detail' }, [step.detail]));
    if (step.product) children.push(el('span', { class: 'product-tag' }, [step.product]));

    var row = el('div', {
      class: 'step',
      'data-id': step.id,
      'data-group': sec.id,
      'aria-checked': 'false',
      role: 'checkbox'
    }, [
      el('div', { class: 'step-num' }, [String(i + 1).padStart(2, '0')]),
      el('div', { class: 'step-body' }, children),
      el('div', { class: 'check-box' })
    ]);
    row.addEventListener('click', function() { toggleStep(row, sec.id); });
    wrap.appendChild(row);
  });

  var container = document.createDocumentFragment();
  if (sec.label) container.appendChild(el('div', { class: 'section-label' }, [sec.label]));
  container.appendChild(el('div', { class: 'progress-row' }, [
    el('span', { class: 'prog-label', id: 'prog-' + sec.id + '-txt' }, ['0 / ' + sec.steps.length]),
    el('div',  { class: 'prog-wrap' }, [el('div', { class: 'prog-bar', id: 'prog-' + sec.id + '-bar' })]),
    el('span', { class: 'prog-pct',   id: 'prog-' + sec.id + '-pct' }, ['0%'])
  ]));
  var resetBtn = el('button', { class: 'reset-btn' }, ['Reiniciar']);
  resetBtn.addEventListener('click', function() { resetGroup(sec.id); });
  container.appendChild(el('div', { class: 'reset-row' }, [resetBtn]));
  container.appendChild(wrap);
  return container;
}

function renderScenarioPicker(sec) {
  // Usar un ID de grupo basado en el id del picker o en el primer scenario
  var groupId = sec.id || 'n';

  var container = document.createDocumentFragment();
  if (sec.label) container.appendChild(el('div', { class: 'section-label' }, [sec.label]));

  // Sub-tabs bar
  var subTabsEl = el('div', { class: 'sub-tabs' });
  container.appendChild(subTabsEl);

  // Construir cada scenario: tab + panel
  sec.scenarios.forEach(function(scenario, i) {
    var isFirst = i === 0;

    // Tab button
    var tabBtn = el('button', {
      class: 'sub-tab' + (isFirst ? ' active' : ''),
      id: 'subtab-' + groupId + '-' + scenario.id
    }, [scenario.label]);
    (function(sid) {
      tabBtn.addEventListener('click', function() { switchSub(groupId, sid); });
    })(scenario.id);
    subTabsEl.appendChild(tabBtn);

    // Panel — construido directamente como elemento (no fragment) para poder asignar id
    var panel = el('div', {
      class: 'sub-panel' + (isFirst ? ' active' : ''),
      id: 'subpanel-' + groupId + '-' + scenario.id
    });

    // Renderizar secciones hijas y agregarlas al panel directamente
    scenario.sections.forEach(function(childSec) {
      var rendered = renderSection(childSec);
      if (!rendered) return;
      // renderSection puede devolver Fragment o Element
      panel.appendChild(rendered);
    });

    container.appendChild(panel);
  });

  return container;
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
    var bodyChildren = [el('div', { class: 'step-name' }, [item.name])];
    if (item.detail) bodyChildren.push(el('div', { class: 'step-detail' }, [item.detail]));
    wrap.appendChild(el('div', { class: 'step-static' }, [
      el('div', { class: 'step-num' }, [item.id]),
      el('div', { class: 'step-body' }, bodyChildren)
    ]));
  });
  var container = document.createDocumentFragment();
  if (sec.label) container.appendChild(el('div', { class: 'section-label' }, [sec.label]));
  container.appendChild(wrap);
  return container;
}

function renderMetricGrid(sec) {
  var grid = el('div', { class: 'razor-grid' });
  sec.items.forEach(function(item) {
    var variantClass = item.variant === 'warn' ? ' warn-card' : item.variant === 'ok' ? ' ok-card' : '';
    var valClass = 'rc-val' + (item.variant === 'default' ? ' rc-val-default' : '');
    grid.appendChild(el('div', { class: 'razor-card' + variantClass }, [
      el('div', { class: 'rc-label' }, [item.label]),
      el('div', { class: valClass },   [item.value]),
      el('div', { class: 'rc-sub' },   [item.sublabel])
    ]));
  });
  var container = document.createDocumentFragment();
  if (sec.label) container.appendChild(el('div', { class: 'section-label' }, [sec.label]));
  container.appendChild(grid);
  return container;
}

function renderDaySelector(sec) {
  var sid = sec.id || ('ds_' + Math.random().toString(36).slice(2));
  if (!_dayStates[sid]) {
    _dayStates[sid] = sec.days.map(function(_, i) {
      return (sec.default_selected || []).indexOf(i) >= 0;
    });
  }
  var wrap = el('div', { class: 'day-selector' });
  sec.days.forEach(function(day, i) {
    var btn = el('button', {
      class: 'day-btn' + (_dayStates[sid][i] ? ' selected' : ''),
      'data-selector': sid
    }, [day]);
    (function(idx) {
      btn.addEventListener('click', function() { toggleDay(btn, sid, idx); });
    })(i);
    wrap.appendChild(btn);
  });
  var container = document.createDocumentFragment();
  if (sec.label) container.appendChild(el('div', { class: 'section-label' }, [sec.label]));
  if (sec.sublabel) container.appendChild(el('p', { style: 'font-size:13px;color:var(--text-muted);margin-bottom:10px;' }, [sec.sublabel]));
  container.appendChild(wrap);
  return container;
}

function renderPhaseTracker(sec) {
  var tid = sec.id || ('tr_' + Math.random().toString(36).slice(2));
  var saved = JSON.parse(localStorage.getItem('routine-phases') || '{}');
  var def   = saved[tid] !== undefined ? saved[tid] : (sec.default || 0);

  var phasesGrid = el('div', { class: 'tracker-phases' });
  sec.phases.forEach(function(phase, i) {
    var card = el('div', {
      class: 'tracker-phase' + (i === def ? ' current' : ''),
      'data-tracker': tid
    }, [
      el('span', { class: 'phase-num' }, [phase.label]),
      document.createTextNode(phase.sublabel)
    ]);
    (function(idx) {
      card.addEventListener('click', function() { selectPhase(tid, idx, sec.phases); });
    })(i);
    phasesGrid.appendChild(card);
  });

  var desc = el('div', { class: 'phase-desc', id: 'phase-desc-' + tid });
  desc.innerHTML = '<strong>' + sec.phases[def].title + '</strong><br><br>' + sec.phases[def].description;

  return el('div', { class: 'tracker' }, [
    el('div', { class: 'tracker-title' }, [sec.title]),
    el('div', { class: 'tracker-sub'   }, [sec.subtitle]),
    phasesGrid,
    desc
  ]);
}

function renderPermitTable(sec) {
  var rows = sec.rows.map(function(row) {
    var cells = [el('td', row.highlight ? { style: 'color:var(--' + (row.highlight === 'danger' ? 'red' : row.highlight) + ');font-style:italic;' } : null, [row.product])];
    row.values.forEach(function(val) {
      var cls = val === 'ok' ? 'ok-cell' : val === 'no' ? 'no-cell' : 'half-cell';
      var sym = val === 'ok' ? '✓' : val === 'no' ? '✗' : '± puntual';
      cells.push(el('td', { class: cls }, [sym]));
    });
    return el('tr', null, cells);
  });

  var table = el('table', { class: 'permit-table' }, [
    el('thead', null, [el('tr', null, sec.columns.map(function(c) { return el('th', null, [c]); }))]),
    el('tbody', null, rows)
  ]);

  var container = document.createDocumentFragment();
  if (sec.label) container.appendChild(el('div', { class: 'section-label' }, [sec.label]));
  container.appendChild(el('div', { style: 'overflow-x:auto;border-radius:var(--radius);' }, [table]));
  return container;
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

// ─── Render principal ──────────────────────────────────────────────────────────

function renderApp(data) {
  var titleEl = document.getElementById('app-title');
  var subEl   = document.getElementById('app-subtitle');
  if (titleEl) titleEl.textContent = data.app.title;
  if (subEl)   subEl.textContent   = data.app.subtitle;

  var mainTabsEl = document.getElementById('main-tabs');
  var contentEl  = document.getElementById('app-content');
  if (!mainTabsEl || !contentEl) return;

  // Encontrar el primer tab con phase_tracker para el pill
  var firstTracker = null;

  data.modules.forEach(function(module, mIdx) {
    module.tabs.forEach(function(tab, tIdx) {
      var isFirst = mIdx === 0 && tIdx === 0;
      var tabId   = module.id + '-' + tab.id;

      // Tab button
      var tabBtn = el('button', {
        class: 'main-tab' + (isFirst ? ' active' : ''),
        id: 'tab-' + tabId,
        'data-module': module.id
      }, [tab.icon + ' ' + tab.label]);
      (function(mid, tid) {
        tabBtn.addEventListener('click', function() { switchTab(mid, tid); });
      })(module.id, tab.id);
      mainTabsEl.appendChild(tabBtn);

      // Panel
      var panel = el('div', {
        class: 'tab-panel' + (isFirst ? ' active' : ''),
        id: 'panel-' + tabId,
        'data-module': module.id
      });
      tab.sections.forEach(function(sec) {
        var rendered = renderSection(sec);
        if (rendered) panel.appendChild(rendered);
        // Detectar phase_tracker
        if (!firstTracker && sec.type === 'phase_tracker') {
          firstTracker = { moduleId: module.id, tabId: tab.id };
        }
      });
      contentEl.appendChild(panel);
    });
  });

  // Phase pill
  var pillEl = document.getElementById('phase-pill');
  if (pillEl && firstTracker) {
    pillEl.addEventListener('click', function() {
      switchTab(firstTracker.moduleId, firstTracker.tabId);
    });
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
    }).catch(function(err) { console.warn('SW error:', err); });
  });
}

function showUpdateBanner(worker) {
  var banner = el('div', { style: 'position:fixed;bottom:20px;left:16px;right:16px;background:#1c1c1e;color:white;padding:14px 16px;border-radius:14px;z-index:9999;display:flex;align-items:center;justify-content:space-between;gap:12px;font-family:-apple-system,sans-serif;font-size:14px;border:1px solid rgba(0,255,166,0.3);box-shadow:0 0 20px rgba(0,255,166,0.15);' });
  banner.appendChild(el('span', null, ['Nueva version disponible']));
  var btn = el('button', { style: 'background:#00ffa6;color:#000;border:none;border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer;font-size:13px;' }, ['Actualizar']);
  btn.addEventListener('click', function() { worker.postMessage('SKIP_WAITING'); window.location.reload(); });
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
    var c = document.getElementById('app-content');
    if (c) c.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);">Error cargando rutinas. Verifica tu conexion.</div>';
  });
