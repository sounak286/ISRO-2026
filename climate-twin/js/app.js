/**
 * AI Digital Twin — India's Climate
 * Leaflet-powered geodashboard with heatmap visualization
 */

(function () {
  const {
    REGIONS,
    LAYERS,
    PALETTES,
    ALERTS,
    PIPELINE,
    BASE_DATE,
    generateGrid,
    applySimulation,
    buildImpactText,
    formatDate,
    getIndiaOutlineGeoJSON,
  } = window.ClimateData;

  const state = {
    region: 'western-ghats',
    primaryLayer: 'rainfall',
    layers: { rainfall: true, lst: false, sst: false, wind: true, admin: false },
    sim: { rainfallMod: 0, tempOffset: 0, sstAnomaly: 0 },
    dayOffset: 0,
    basePoints: [],
    view: 'dashboard',
    apiOnline: false,
    renderMode: 'heatmap',
  };

  const $ = (id) => document.getElementById(id);

  // ── Region / pipeline ──
  function initRegionSelect() {
    const sel = $('regionSelect');
    Object.entries(REGIONS).forEach(([id, r]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = r.name;
      sel.appendChild(opt);
    });
    sel.value = state.region;
    sel.addEventListener('change', async () => {
      state.region = sel.value;
      state.dayOffset = 0;
      resetSimulation(false);
      await loadRegionData();
      MapEngine.flyToRegion(REGIONS[state.region]);
      render();
    });
  }

  async function initPipeline() {
    const list = $('pipelineList');
    list.innerHTML = '';
    let items = PIPELINE;
    if (window.ApiClient) {
      try {
        items = await ApiClient.getPipeline();
        state.apiOnline = true;
        $('dataSourceBadge')?.classList.remove('hidden');
      } catch {
        state.apiOnline = false;
      }
    }
    items.forEach((p) => {
      const el = document.createElement('div');
      el.className = 'pipeline-item';
      el.innerHTML = `
        <span class="pipeline-item__dot pipeline-item__dot--${p.status}"></span>
        <span>${p.name}</span>
        <span class="pipeline-item__meta">${p.format} · ${p.meta}</span>
      `;
      list.appendChild(el);
    });
  }

  function initLayers() {
    const list = $('layerList');
    const primary = $('primaryLayer');

    Object.values(LAYERS).forEach((l) => {
      const opt = document.createElement('option');
      opt.value = l.id;
      opt.textContent = l.label;
      primary.appendChild(opt);

      const row = document.createElement('label');
      row.className = `layer-item${state.layers[l.id] ? ' active' : ''}`;
      row.dataset.layer = l.id;
      row.innerHTML = `
        <span class="layer-item__check">${state.layers[l.id] ? '✓' : ''}</span>
        <span class="layer-item__swatch" style="background:${l.color}"></span>
        <span class="layer-item__label">${l.label}</span>
        <span class="layer-item__src">${l.source}</span>
      `;
      row.addEventListener('click', (e) => {
        e.preventDefault();
        if (l.id === state.primaryLayer && state.layers[l.id]) return;
        state.layers[l.id] = !state.layers[l.id];
        if (state.layers[l.id]) state.primaryLayer = l.id;
        syncLayerUI();
        render();
      });
      list.appendChild(row);
    });

    [['wind', 'Wind Vectors', 'Fusion', '#a78bfa'], ['admin', 'Admin Boundaries', 'Bhuvan', '#64748b']].forEach(
      ([key, label, src, color]) => {
        const row = document.createElement('label');
        row.className = `layer-item${state.layers[key] ? ' active' : ''}`;
        row.dataset.layer = key;
        row.innerHTML = `
          <span class="layer-item__check">${state.layers[key] ? '✓' : ''}</span>
          <span class="layer-item__swatch" style="background:${color}"></span>
          <span class="layer-item__label">${label}</span>
          <span class="layer-item__src">${src}</span>
        `;
        row.addEventListener('click', (e) => {
          e.preventDefault();
          state.layers[key] = !state.layers[key];
          syncLayerUI();
          render();
        });
        list.appendChild(row);
      },
    );

    primary.value = state.primaryLayer;
    primary.addEventListener('change', () => {
      state.primaryLayer = primary.value;
      state.layers[state.primaryLayer] = true;
      syncLayerUI();
      render();
    });
  }

  function syncLayerUI() {
    document.querySelectorAll('.layer-item').forEach((row) => {
      const key = row.dataset.layer;
      const on = state.layers[key];
      row.classList.toggle('active', on);
      row.querySelector('.layer-item__check').textContent = on ? '✓' : '';
    });
    $('primaryLayer').value = state.primaryLayer;
  }

  function initAlerts() {
    const bar = $('alertsBar');
    ALERTS.forEach((a) => {
      const chip = document.createElement('div');
      chip.className = `alert-chip alert-chip--${a.severity}`;
      chip.innerHTML = `<span class="alert-chip__dot"></span><strong>${a.title}</strong><em>${a.zone}</em>`;
      chip.addEventListener('click', () => { switchView('dashboard'); });
      bar.appendChild(chip);
    });
  }

  function initSliders() {
    ['rainMod', 'tempOff', 'sstAnom'].forEach((id) => {
      $(id).addEventListener('input', () => render());
    });
    $('resetSim').addEventListener('click', () => resetSimulation(true));
    $('exportScenario').addEventListener('click', exportScenario);

    const modeSel = $('mapRenderMode');
    if (modeSel) {
      modeSel.addEventListener('change', () => {
        state.renderMode = modeSel.value;
        MapEngine.setRenderMode(state.renderMode);
        render();
      });
    }
  }

  function initTimeControls() {
    $('tBack1').addEventListener('click', () => stepTime(-1));
    $('tFwd1').addEventListener('click', () => stepTime(1));
    $('tBack7').addEventListener('click', () => stepTime(-7));
    $('tFwd7').addEventListener('click', () => stepTime(7));
  }

  function initNavTabs() {
    document.querySelectorAll('.nav-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchView(tab.dataset.view));
    });
  }

  function switchView(view) {
    state.view = view;
    document.querySelectorAll('.nav-tab').forEach((t) => {
      const active = t.dataset.view === view;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active);
    });
    $('dashboardView').classList.toggle('hidden', view !== 'dashboard');
    $('processView').classList.toggle('hidden', view !== 'process');
    $('architectureView').classList.toggle('hidden', view !== 'architecture');
    if (view === 'dashboard') setTimeout(() => MapEngine.invalidateSize(), 150);
  }

  function stepTime(delta) {
    state.dayOffset = Math.max(-3, Math.min(10, state.dayOffset + delta));
    loadRegionData().then(render);
  }

  function resetSimulation(resetSliders) {
    state.sim = { rainfallMod: 0, tempOffset: 0, sstAnomaly: 0 };
    if (resetSliders) {
      $('rainMod').value = 0;
      $('tempOff').value = 0;
      $('sstAnom').value = 0;
    }
    syncSliderValues();
    render();
  }

  function syncSliderValues() {
    state.sim.rainfallMod = Number($('rainMod').value);
    state.sim.tempOffset = Number($('tempOff').value);
    state.sim.sstAnomaly = Number($('sstAnom').value);
    $('rainVal').textContent = `${state.sim.rainfallMod > 0 ? '+' : ''}${state.sim.rainfallMod}%`;
    $('tempVal').textContent = `${state.sim.tempOffset > 0 ? '+' : ''}${state.sim.tempOffset.toFixed(1)}°C`;
    $('sstVal').textContent = `${state.sim.sstAnomaly > 0 ? '+' : ''}${state.sim.sstAnomaly.toFixed(1)}°C`;
    $('rainVal').classList.toggle('warn', Math.abs(state.sim.rainfallMod) > 30);
    $('tempVal').classList.toggle('warn', state.sim.tempOffset > 2);
  }

  function getSimulatedPoints() {
    return applySimulation(state.basePoints, state.sim, state.dayOffset);
  }

  async function loadRegionData() {
    if (state.apiOnline && window.ApiClient) {
      try {
        const data = await ApiClient.getGrid(state.region, state.dayOffset, state.dayOffset > 0);
        state.basePoints = data.points.map((p) => ({
          lng: p.lng,
          lat: p.lat,
          rainfall: p.rainfall,
          lst: p.lst,
          sst: p.sst,
          windU: p.windU || 2,
          windV: p.windV || 1,
        }));
        return;
      } catch { /* fallback */ }
    }
    const reg = REGIONS[state.region];
    state.basePoints = generateGrid(reg.bounds, state.region.charCodeAt(0) * 137);
  }

  function updateMapLayers() {
    const pts = getSimulatedPoints();
    const activeKey = state.layers[state.primaryLayer] ? state.primaryLayer : 'rainfall';
    const layerDef = LAYERS[activeKey];
    const meta = MapEngine.updateClimateLayer(
      pts,
      layerDef.key,
      layerDef.palette,
      state.layers[state.primaryLayer],
      state.renderMode,
    );
    MapEngine.updateWind(pts, state.layers.wind);
    MapEngine.updateAdmin(getIndiaOutlineGeoJSON(), state.layers.admin);
    updateLegend(meta, layerDef);
  }

  function updateLegend(meta, layerDef) {
    $('legendTitle').textContent = layerDef.title;
    $('legendBar').style.background = PALETTES[layerDef.palette].grad;
    $('legMin').textContent = meta.min.toFixed(1);
    $('legMax').textContent = meta.max.toFixed(1);
    $('legendUnit').textContent = `${layerDef.unit} · 0.25° · Leaflet heatmap`;
    $('legend').style.display = state.layers[state.primaryLayer] ? 'block' : 'none';
  }

  function renderStats() {
    const pts = getSimulatedPoints();
    if (!pts.length) return;
    const avgRain = pts.reduce((s, p) => s + p.rainfall, 0) / pts.length;
    const maxLst = Math.max(...pts.map((p) => p.lst));
    $('statRain').textContent = avgRain.toFixed(1);
    $('statLst').textContent = maxLst.toFixed(1);
    $('statPts').textContent = pts.length;
    const d = new Date(BASE_DATE);
    d.setDate(d.getDate() + state.dayOffset);
    $('timeDate').textContent = formatDate(d);
    const offLabel = state.dayOffset === 0 ? 'Now' : state.dayOffset > 0 ? `+${state.dayOffset}d forecast` : `${state.dayOffset}d history`;
    $('timeOff').textContent = `${offLabel} · 7–14 day horizon`;
    $('impactText').textContent = buildImpactText(state.sim, avgRain, maxLst);
    const pct = 85 + Math.random() * 5;
    $('assimFill').style.width = `${pct.toFixed(0)}%`;
    $('assimPct').textContent = `${pct.toFixed(0)}%`;
  }

  function render() {
    syncSliderValues();
    updateMapLayers();
    renderStats();
  }

  function exportScenario() {
    const payload = {
      exported: new Date().toISOString(),
      region: REGIONS[state.region].name,
      date: formatDate(new Date(BASE_DATE.getTime() + state.dayOffset * 86400000)),
      simulation: { ...state.sim },
      layers: { ...state.layers, primary: state.primaryLayer },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `climate-scenario-${state.region}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function boot() {
    initRegionSelect();
    await initPipeline();
    initLayers();
    initAlerts();
    initSliders();
    initTimeControls();
    initNavTabs();
    await loadRegionData();
    MapEngine.init('map', REGIONS[state.region]);
    render();

    setInterval(() => {
      if (state.view === 'dashboard') {
        const pct = 84 + Math.random() * 8;
        $('assimFill').style.width = `${pct.toFixed(0)}%`;
        $('assimPct').textContent = `${pct.toFixed(0)}%`;
      }
    }, 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
