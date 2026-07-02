/**
 * Climate grid generator & simulation engine
 * Simulates ISRO/IMD fused 0.25° datasets for demo purposes
 */

const REGIONS = {
  'western-ghats': {
    name: 'Western Ghats',
    center: [76.2, 12.5],
    zoom: 6.2,
    bounds: [[73.5, 8.0], [78.5, 16.5]],
  },
  'indo-gangetic': {
    name: 'Indo-Gangetic Plain',
    center: [82.5, 26.5],
    zoom: 5.5,
    bounds: [[77.0, 22.0], [88.0, 31.0]],
  },
  'deccan': {
    name: 'Deccan Plateau',
    center: [78.0, 17.5],
    zoom: 5.8,
    bounds: [[73.0, 12.0], [83.0, 22.0]],
  },
  'northeast': {
    name: 'Northeast India',
    center: [93.5, 26.0],
    zoom: 6.0,
    bounds: [[89.0, 22.0], [97.5, 29.5]],
  },
  'kerala': {
    name: 'Coastal Kerala',
    center: [76.3, 10.2],
    zoom: 7.0,
    bounds: [[74.8, 8.0], [77.5, 12.5]],
  },
};

const LAYERS = {
  rainfall: {
    id: 'rainfall',
    label: 'IMD Rainfall',
    source: 'IMD Pune',
    color: '#3b82f6',
    palette: 'rain',
    key: 'rainfall',
    unit: 'mm/day',
    title: 'IMD Rainfall (QPE)',
  },
  lst: {
    id: 'lst',
    label: 'INSAT LST',
    source: 'MOSDAC',
    color: '#ef4444',
    palette: 'temp',
    key: 'lst',
    unit: '°C',
    title: 'INSAT Land Surface Temp',
  },
  sst: {
    id: 'sst',
    label: 'Ocean SST',
    source: 'INSAT-3R',
    color: '#06b6d4',
    palette: 'sst',
    key: 'sst',
    unit: '°C',
    title: 'Ocean Sea Surface Temp',
  },
};

const PALETTES = {
  rain: {
    grad: 'linear-gradient(to right, #0f172a, #1e4078, #2563eb, #06b6d4, #00d4aa)',
    fn: (t) => {
      if (t < 0.2) return '#0f172a';
      if (t < 0.4) return '#1e4078';
      if (t < 0.6) return '#2563eb';
      if (t < 0.8) return '#06b6d4';
      return '#00d4aa';
    },
  },
  temp: {
    grad: 'linear-gradient(to right, #3b82f6, #22c55e, #f59e0b, #ef4444)',
    fn: (t) => {
      if (t < 0.25) return '#3b82f6';
      if (t < 0.5) return '#22c55e';
      if (t < 0.75) return '#f59e0b';
      return '#ef4444';
    },
  },
  sst: {
    grad: 'linear-gradient(to right, #1e3a8a, #06b6d4, #f87171)',
    fn: (t) => {
      if (t < 0.33) return '#1e3a8a';
      if (t < 0.66) return '#06b6d4';
      return '#f87171';
    },
  },
};

const ALERTS = [
  { id: '1', severity: 'critical', title: 'Extreme Heat Warning', zone: 'Zone 4B — Satara District' },
  { id: '2', severity: 'moderate', title: 'Monsoon Delay Risk', zone: 'Konkan Coast — Moderate' },
  { id: '3', severity: 'warning', title: 'Flash Flood Precursor', zone: 'Zone 2A — Kodagu Highlands' },
  { id: '4', severity: 'info', title: 'QPE Surrogate Update', zone: 'INSAT-3R assimilation complete' },
];

const PIPELINE = [
  { name: 'MOSDAC INSAT-3R', format: 'HDF5', status: 'ok', meta: 'Updated 06:00 IST' },
  { name: 'IMD Gridded Rainfall', format: '.bin', status: 'ok', meta: '0.25° grid' },
  { name: 'Bhuvan Admin Layers', format: 'WMS', status: 'sync', meta: 'Syncing…' },
  { name: 'PINN Assimilation', format: 'EnKF', status: 'ok', meta: 'Drift: 0.02%' },
];

const BASE_DATE = new Date('2026-06-20T00:00:00');

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateGrid(bounds, seed, resolution = 0.25) {
  const rand = seededRandom(seed);
  const points = [];
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;

  for (let lat = minLat; lat <= maxLat; lat += resolution) {
    for (let lng = minLng; lng <= maxLng; lng += resolution) {
      const coastal = Math.exp(-Math.pow((lng - 75.5) / 2, 2)) * 0.4;
      const elevation = Math.sin(lng * 0.3) * Math.cos(lat * 0.25) * 0.3;
      const monsoon = Math.max(0, Math.sin((lat - 8) * 0.4) * 0.6 + rand() * 0.4);

      points.push({
        lng,
        lat,
        rainfall: Math.min(120, (monsoon + coastal + rand() * 0.3) * 80 + elevation * 20),
        lst: 28 + elevation * 8 + rand() * 6 + (lat < 12 ? 4 : 0),
        sst: 27.5 + Math.sin(lng * 0.15) * 1.5 + rand() * 0.8,
        windU: (rand() - 0.5) * 8 + Math.sin(lat * 0.2) * 3,
        windV: (rand() - 0.5) * 6 + Math.cos(lng * 0.15) * 2,
      });
    }
  }
  return points;
}

function applySimulation(points, sim, dayOffset) {
  const rainFactor = 1 + sim.rainfallMod / 100;
  const timeFactor = 1 + dayOffset * 0.03;

  return points.map((p) => ({
    ...p,
    rainfall: Math.max(0, p.rainfall * rainFactor * timeFactor + dayOffset * 1.2),
    lst: p.lst + sim.tempOffset + dayOffset * 0.15,
    sst: p.sst + sim.sstAnomaly,
  }));
}

function colorForValue(value, min, max, palette) {
  const t = max === min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  return PALETTES[palette].fn(t);
}

function pointsToGeoJSON(points, layerKey, palette) {
  const values = points.map((p) => p[layerKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      properties: {
        ...p,
        color: colorForValue(p[layerKey], min, max, palette),
        displayValue: p[layerKey],
      },
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    })),
    meta: { min, max },
  };
}

function windToGeoJSON(points) {
  return {
    type: 'FeatureCollection',
    features: points
      .filter((_, i) => i % 3 === 0)
      .map((p) => {
        const scale = 0.08;
        return {
          type: 'Feature',
          properties: { speed: Math.sqrt(p.windU ** 2 + p.windV ** 2) },
          geometry: {
            type: 'LineString',
            coordinates: [
              [p.lng, p.lat],
              [p.lng + p.windU * scale, p.lat + p.windV * scale],
            ],
          },
        };
      }),
  };
}

function buildImpactText(sim, avgRain, maxTemp) {
  const parts = [];

  if (sim.rainfallMod !== 0) {
    const mod = avgRain * (1 + sim.rainfallMod / 100);
    parts.push(
      sim.rainfallMod < 0
        ? `Agricultural basins may see ${Math.abs(sim.rainfallMod)}% rainfall deficit (${mod.toFixed(0)} mm avg), elevating drought stress in rabi-dependent zones.`
        : `Enhanced precipitation (+${sim.rainfallMod}%) projects ${mod.toFixed(0)} mm mean QPE — flash flood risk increases in Western Ghats escarpments.`,
    );
  }

  if (sim.tempOffset !== 0) {
    const projected = maxTemp + sim.tempOffset;
    parts.push(
      sim.tempOffset > 0
        ? `ΔT +${sim.tempOffset.toFixed(1)}°C drives peak LST to ~${projected.toFixed(1)}°C — heatwave thresholds likely breached in Zone 4B municipal grids.`
        : 'Cooling offset reduces thermal stress; crop water demand drops across coffee and cardamom belts.',
    );
  }

  if (sim.sstAnomaly !== 0) {
    parts.push(
      sim.sstAnomaly > 0
        ? `Positive SST anomaly (+${sim.sstAnomaly.toFixed(1)}°C) may delay monsoon onset over Konkan by 3–5 days per surrogate ensemble.`
        : 'Negative SST shift supports earlier onshore flow — moderate monsoon advance signal detected.',
    );
  }

  if (parts.length === 0) {
    return 'Baseline assimilation active. Adjust sandbox parameters to run instant downscaled what-if scenarios across dependent basins and municipal water systems.';
  }

  return parts.join(' ');
}

function formatDate(date) {
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getIndiaOutlineGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'India boundary (simplified)' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [68.1, 23.6], [70.0, 22.0], [72.8, 20.5], [73.0, 15.0], [76.0, 8.0],
            [77.5, 8.2], [80.0, 13.0], [80.5, 16.0], [88.0, 22.0], [89.0, 25.0],
            [92.0, 27.0], [97.0, 28.0], [97.5, 27.5], [94.0, 26.0], [92.0, 24.0],
            [88.0, 26.5], [84.0, 27.0], [77.0, 31.0], [74.0, 32.5], [71.0, 32.0],
            [68.1, 23.6],
          ]],
        },
      },
    ],
  };
}

window.ClimateData = {
  REGIONS,
  LAYERS,
  PALETTES,
  ALERTS,
  PIPELINE,
  BASE_DATE,
  generateGrid,
  applySimulation,
  pointsToGeoJSON,
  windToGeoJSON,
  buildImpactText,
  formatDate,
  getIndiaOutlineGeoJSON,
};
