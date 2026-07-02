/**
 * Leaflet map engine — high-quality tiles, heatmap, wind vectors, admin boundaries
 */
const MapEngine = (function () {
  const HEAT_GRADIENTS = {
    rain: {
      0.0: '#0f172a',
      0.2: '#1e4078',
      0.45: '#2563eb',
      0.65: '#06b6d4',
      0.85: '#00d4aa',
      1.0: '#6ee7b7',
    },
    temp: {
      0.0: '#3b82f6',
      0.3: '#22c55e',
      0.55: '#eab308',
      0.75: '#f59e0b',
      1.0: '#ef4444',
    },
    sst: {
      0.0: '#1e3a8a',
      0.35: '#0891b2',
      0.6: '#06b6d4',
      0.8: '#f97316',
      1.0: '#f87171',
    },
  };

  let map = null;
  let heatLayer = null;
  let windLayer = null;
  let adminLayer = null;
  let gridMarkers = null;
  let baseLayers = {};
  let currentMode = 'heatmap'; // 'heatmap' | 'grid'

  function createBaseLayers() {
    return {
      'Satellite (Esri)': L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri', maxZoom: 19 },
      ),
      'Terrain (OpenTopoMap)': L.tileLayer(
        'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        { attribution: 'OpenTopoMap', maxZoom: 17 },
      ),
      'Dark (Carto)': L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20 },
      ),
      'Light (Carto Voyager)': L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20 },
      ),
    };
  }

  function init(containerId, region) {
    baseLayers = createBaseLayers();

    map = L.map(containerId, {
      center: [region.center[1], region.center[0]],
      zoom: region.zoom,
      zoomControl: false,
      preferCanvas: true,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
    });

    baseLayers['Satellite (Esri)'].addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.layers(baseLayers, null, { position: 'bottomright', collapsed: true }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    windLayer = L.layerGroup().addTo(map);
    adminLayer = L.layerGroup();
    gridMarkers = L.layerGroup();

    return map;
  }

  function normalize(values) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { min, max, norm: (v) => (max === min ? 0.5 : (v - min) / (max - min)) };
  }

  function pointsToHeat(points, key, palette) {
    const vals = points.map((p) => p[key]);
    const { min, max, norm } = normalize(vals);
    const data = points.map((p) => [p.lat, p.lng, norm(p[key])]);
    return { data, min, max, palette };
  }

  function updateHeatmap(points, layerKey, palette, visible) {
    if (heatLayer) {
      map.removeLayer(heatLayer);
      heatLayer = null;
    }
    if (!visible || !points.length) return { min: 0, max: 0 };

    const { data, min, max } = pointsToHeat(points, layerKey, palette);
    const zoom = map.getZoom();

    heatLayer = L.heatLayer(data, {
      radius: Math.max(18, 28 - zoom),
      blur: Math.max(12, 22 - zoom * 0.8),
      maxZoom: 17,
      minOpacity: 0.35,
      max: 1.0,
      gradient: HEAT_GRADIENTS[palette] || HEAT_GRADIENTS.rain,
    }).addTo(map);

    return { min, max };
  }

  function updateGridCircles(points, layerKey, palette, visible) {
    gridMarkers.clearLayers();
    if (!visible || !points.length) return { min: 0, max: 0 };

    const vals = points.map((p) => p[layerKey]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const grad = HEAT_GRADIENTS[palette] || HEAT_GRADIENTS.rain;
    const stops = Object.entries(grad).sort((a, b) => a[0] - b[0]);

    function colorAt(t) {
      for (let i = stops.length - 1; i >= 0; i--) {
        if (t >= parseFloat(stops[i][0])) return stops[i][1];
      }
      return stops[0][1];
    }

    points.forEach((p) => {
      const t = max === min ? 0.5 : (p[layerKey] - min) / (max - min);
      L.circleMarker([p.lat, p.lng], {
        radius: 7,
        fillColor: colorAt(t),
        color: 'rgba(255,255,255,0.15)',
        weight: 0.5,
        fillOpacity: 0.82,
        className: 'climate-grid-cell',
      })
        .bindTooltip(
          `<strong>${p.lat.toFixed(2)}°N, ${p.lng.toFixed(2)}°E</strong><br>
           Rain: ${p.rainfall.toFixed(1)} mm<br>LST: ${p.lst.toFixed(1)} °C<br>SST: ${p.sst.toFixed(1)} °C`,
          { sticky: true, className: 'leaflet-climate-tip' },
        )
        .addTo(gridMarkers);
    });

    if (!map.hasLayer(gridMarkers)) gridMarkers.addTo(map);
    return { min, max };
  }

  function updateClimateLayer(points, layerKey, palette, visible, mode) {
    currentMode = mode || currentMode;
    if (heatLayer && map.hasLayer(heatLayer)) map.removeLayer(heatLayer);
    if (map.hasLayer(gridMarkers)) map.removeLayer(gridMarkers);

    if (currentMode === 'grid') {
      return updateGridCircles(points, layerKey, palette, visible);
    }
    return updateHeatmap(points, layerKey, palette, visible);
  }

  function updateWind(points, visible) {
    windLayer.clearLayers();
    if (!visible) return;

    points.filter((_, i) => i % 3 === 0).forEach((p) => {
      const scale = 0.12;
      const end = [p.lat + p.windV * scale, p.lng + p.windU * scale];
      L.polyline([[p.lat, p.lng], end], {
        color: '#c4b5fd',
        weight: 2,
        opacity: 0.85,
        lineCap: 'round',
      }).addTo(windLayer);

      L.circleMarker(end, {
        radius: 2,
        fillColor: '#a78bfa',
        color: 'transparent',
        fillOpacity: 1,
      }).addTo(windLayer);
    });
  }

  function updateAdmin(geojson, visible) {
    adminLayer.clearLayers();
    if (!visible) {
      if (map.hasLayer(adminLayer)) map.removeLayer(adminLayer);
      return;
    }
    L.geoJSON(geojson, {
      style: {
        color: '#94a3b8',
        weight: 1.5,
        opacity: 0.55,
        dashArray: '6 4',
        fill: false,
      },
    }).addTo(adminLayer);
    adminLayer.addTo(map);
  }

  function flyToRegion(region) {
    if (!map) return;
    map.flyTo([region.center[1], region.center[0]], region.zoom, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }

  function invalidateSize() {
    if (map) map.invalidateSize({ animate: true });
  }

  function setRenderMode(mode) {
    currentMode = mode;
  }

  function getMap() {
    return map;
  }

  return {
    init,
    updateClimateLayer,
    updateWind,
    updateAdmin,
    flyToRegion,
    invalidateSize,
    setRenderMode,
    getMap,
    HEAT_GRADIENTS,
  };
})();

window.MapEngine = MapEngine;
