/**
 * API client — connects HTML dashboard to FastAPI + PyTorch backend
 */
const API_BASE = window.CLIMATE_API || 'http://localhost:8000';

const ApiClient = {
  async health() {
    const r = await fetch(`${API_BASE}/api/health`);
    return r.ok;
  },

  async getGrid(region, dayOffset = 0, forecast = false) {
    const params = new URLSearchParams({ region, day_offset: dayOffset, forecast });
    const r = await fetch(`${API_BASE}/api/grid?${params}`);
    if (!r.ok) throw new Error('Grid fetch failed');
    return r.json();
  },

  async getForecastSeries(region, horizon = 7) {
    const params = new URLSearchParams({ region, horizon });
    const r = await fetch(`${API_BASE}/api/forecast/series?${params}`);
    if (!r.ok) throw new Error('Forecast fetch failed');
    return r.json();
  },

  async getMetrics() {
    const r = await fetch(`${API_BASE}/api/model/metrics`);
    if (!r.ok) throw new Error('Metrics unavailable');
    return r.json();
  },

  async getPipeline() {
    const r = await fetch(`${API_BASE}/api/pipeline`);
    if (!r.ok) throw new Error('Pipeline unavailable');
    return r.json();
  },

  async getDatasets() {
    const r = await fetch(`${API_BASE}/api/datasets`);
    if (!r.ok) throw new Error('Datasets unavailable');
    return r.json();
  },

  async retrain() {
    const r = await fetch(`${API_BASE}/api/train`, { method: 'POST' });
    if (!r.ok) throw new Error('Training failed');
    return r.json();
  },
};

window.ApiClient = ApiClient;
