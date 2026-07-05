"use client"

import { useEffect, useMemo } from "react"
import { useMap } from "./hooks"
import { mapgl } from "./map-library"
import type mapboxgl from "maplibre-gl"
import type { LayerState, SimulationState } from "@/types"

export interface StateFeature {
  type: "Feature"
  geometry: {
    type: "Polygon" | "MultiPolygon"
    coordinates: number[][][] | number[][][][]
  }
  properties: {
    ST_NM?: string
  }
}

export interface StateFeatureCollection {
  type: "FeatureCollection"
  features: StateFeature[]
}

export interface HeatmapFeature {
  type: "Feature"
  geometry: {
    type: "Point"
    coordinates: [number, number]
  }
  properties: {
    id: string
    name: string
    state: string
    isOcean: boolean
    value_lst?: number | null
    weight_lst?: number
    value_rain?: number | null
    weight_rain?: number
    value_sst?: number | null
    weight_sst?: number
  }
}

export interface HeatmapFeatureCollection {
  type: "FeatureCollection"
  features: HeatmapFeature[]
}

export interface GridStats {
  pointCount: number
  min: number
  max: number
  avg: number
  topHighest: { state: string; value: number }[]
  topLowest: { state: string; value: number }[]
}

export interface MultiGridStats {
  "insat-lst"?: GridStats
  "imd-rainfall"?: GridStats
  "ocean-sst"?: GridStats
}

interface MapHeatmapProps {
  visible: boolean
  geoJSONData: StateFeatureCollection | null
  resolution: number // grid step in degrees (e.g. 0.12, 0.25, 0.50, 1.00)
  layers: LayerState
  palette: "default" | "warm" | "cool" | "emerald"
  opacity: number
  radius: number
  onNodeSelect?: (nodeProperties: HeatmapFeature["properties"] | null) => void
  onGridStats?: (stats: MultiGridStats) => void
  currentDate: string
  simulation?: SimulationState
}

// Simple seedable pseudo-random number generator for deterministic micro-noise
class SeededRandom {
  private state: number

  constructor(seed: number) {
    this.state = seed
  }

  next(): number {
    const x = Math.sin(this.state++) * 10000
    return x - Math.floor(x)
  }
}

// Ray-casting algorithm to verify if point is inside a polygon ring
function isPointInPolygon(
  point: [number, number],
  polygonCoords: number[][][]
): boolean {
  if (!polygonCoords || polygonCoords.length === 0) return false
  const outerRing = polygonCoords[0]
  let inside = false
  const x = point[0]
  const y = point[1]
  for (let i = 0, j = outerRing.length - 1; i < outerRing.length; j = i++) {
    const xi = outerRing[i][0]
    const yi = outerRing[i][1]
    const xj = outerRing[j][0]
    const yj = outerRing[j][1]
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// Checks if point is inside Polygon or MultiPolygon geometry
function isPointInGeometry(
  point: [number, number],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geometry: any
): boolean {
  if (!geometry) return false
  if (geometry.type === "Polygon") {
    return isPointInPolygon(point, geometry.coordinates as number[][][])
  } else if (geometry.type === "MultiPolygon") {
    for (const polygonCoords of geometry.coordinates as number[][][][]) {
      if (isPointInPolygon(point, polygonCoords)) {
        return true
      }
    }
  }
  return false
}

// Helper: smooth radial influence field — returns value in [0, strength]
// that falls off from a center point. 'radius' is in degrees.
function influence(
  lng: number,
  lat: number,
  centerLng: number,
  centerLat: number,
  radius: number,
  strength: number
): number {
  const d = Math.sqrt(
    Math.pow(lng - centerLng, 2) + Math.pow(lat - centerLat, 2)
  )
  if (d >= radius) return 0
  // Smooth cosine falloff
  return strength * (0.5 + 0.5 * Math.cos((d / radius) * Math.PI))
}

// ──────────────────────────────────────────────────────────────────────────────
// REALISTIC INDIAN CLIMATE MODELS
// ──────────────────────────────────────────────────────────────────────────────

function getRealisticTemperature(lng: number, lat: number): number {
  // Base: latitude gradient (8°N ≈ 37°C → 36°N ≈ 8°C)
  let temp = 37.5 - (lat - 8.0) * 1.05

  // Ladakh extreme cold (Leh area: 77.6, 34.2)
  temp -= influence(lng, lat, 77.6, 34.2, 2.5, 18)
  // Siachen / Karakoram (76.9, 35.5)
  temp -= influence(lng, lat, 76.9, 35.5, 2.0, 22)
  // Kashmir Valley — warmer pocket within cold surrounds (74.8, 34.1)
  temp += influence(lng, lat, 74.8, 34.1, 1.0, 5)
  // Spiti Valley extreme cold (78.0, 32.5)
  temp -= influence(lng, lat, 78.0, 32.5, 1.5, 14)
  // Manali / Kullu (77.2, 32.3)
  temp -= influence(lng, lat, 77.2, 32.3, 1.0, 8)
  // Shimla moderate hill (77.2, 31.1)
  temp -= influence(lng, lat, 77.2, 31.1, 0.8, 6)
  // Nainital / Kumaon hills (79.5, 29.4)
  temp -= influence(lng, lat, 79.5, 29.4, 1.0, 7)

  if (lat > 30) {
    temp -= Math.min((lat - 30) * 1.4, 12)
  }

  // Sikkim / Darjeeling (88.3, 27.0)
  temp -= influence(lng, lat, 88.3, 27.0, 1.2, 9)

  // Thar Desert core — Jaisalmer (70.9, 26.9)
  temp += influence(lng, lat, 70.9, 26.9, 2.5, 10)
  // Barmer extreme (71.4, 25.8)
  temp += influence(lng, lat, 71.4, 25.8, 1.5, 8)
  // Sri Ganganagar (73.9, 29.9) — hottest recorded temps
  temp += influence(lng, lat, 73.9, 29.9, 1.5, 9)
  // Kutch salt desert (69.8, 23.4)
  temp += influence(lng, lat, 69.8, 23.4, 2.0, 7)

  // Aravalli ridge cooling — Mt. Abu (72.7, 24.6)
  temp -= influence(lng, lat, 72.7, 24.6, 0.8, 5)

  // Delhi NCR urban heat (77.1, 28.6)
  temp += influence(lng, lat, 77.1, 28.6, 1.0, 4)
  // Vidarbha extreme heat — Nagpur (79.1, 21.1)
  temp += influence(lng, lat, 79.1, 21.1, 2.0, 6)
  // Chandrapur extreme (79.3, 20.0)
  temp += influence(lng, lat, 79.3, 20.0, 1.5, 5)

  // Ranchi plateau — cooler (85.3, 23.4)
  temp -= influence(lng, lat, 85.3, 23.4, 1.5, 4)

  // Sahyadris / Western Ghats cooling
  temp -= influence(lng, lat, 73.7, 17.9, 1.0, 5)
  temp -= influence(lng, lat, 76.7, 11.4, 0.8, 8) // Ooty

  // Rayalaseema rain shadow heat — Anantapur (77.6, 14.7)
  temp += influence(lng, lat, 77.6, 14.7, 1.5, 5)
  // Bengaluru elevated plateau (77.6, 13.0)
  temp -= influence(lng, lat, 77.6, 13.0, 1.0, 3)

  // Northeast hill stations — Shillong (91.9, 25.6)
  temp -= influence(lng, lat, 91.9, 25.6, 1.0, 7)
  temp -= influence(lng, lat, 91.9, 27.6, 1.2, 12) // Tawang

  // Spatial noise textures
  const noise =
    Math.sin(lng * 3.7 + lat * 5.3) * 1.2 +
    Math.sin(lng * 8.1 - lat * 6.7) * 0.7 +
    Math.sin(lng * 14.9 + lat * 11.3) * 0.4

  temp += noise
  return Math.max(-8.0, Math.min(48.0, temp))
}

function getRealisticPrecipitation(lng: number, lat: number): number {
  // Western Ghats orographic rainfall peak (very high)
  const ghats =
    influence(lng, lat, 73.8, 15.0, 3.5, 3000) +
    influence(lng, lat, 75.0, 11.5, 2.5, 3400)

  // Northeast heavy monsoon zone (Cherrapunji/Mawsynram core)
  const ne =
    influence(lng, lat, 91.8, 25.3, 3.0, 4200) +
    influence(lng, lat, 94.0, 26.0, 2.5, 2200)

  // Coastal belts moderation (Malabar, Coromandel, Odisha/Sundarbans)
  const coast =
    influence(lng, lat, 72.9, 19.1, 1.5, 800) + // Mumbai
    influence(lng, lat, 80.3, 13.1, 1.5, 1200) + // Chennai
    influence(lng, lat, 85.8, 20.3, 2.0, 1500) // Odisha

  // Base rainfall (decays from South to North, and East to West)
  const base = 1200 + (90.0 - lng) * 20 - (lat - 8.0) * 25

  // Desert dry factors (exponential multipliers decay rainfall)
  const tharFactor = 1 - influence(lng, lat, 70.9, 26.9, 3.0, 0.92)
  const kutchFactor = 1 - influence(lng, lat, 69.8, 23.4, 1.8, 0.85)
  const ladakhFactor = 1 - influence(lng, lat, 77.6, 34.2, 2.5, 0.96)

  let val =
    (base + ghats + ne + coast) * tharFactor * kutchFactor * ladakhFactor

  // Micro-spatial variation
  const noise =
    Math.sin(lng * 5.1 + lat * 4.3) * 80 + Math.cos(lng * 9.7 - lat * 8.1) * 45
  val += noise

  return Math.max(15.0, Math.min(4800.0, val))
}

function getRealisticSST(lng: number, lat: number): number {
  // SST generally decreases with higher latitude.
  // Equator is warm (~31°C), 24N is cooler (~26°C)
  const base = 31.0 - (lat - 6.0) * 0.22
  // Add some longitudinal gradient and micro-noise
  const noise = Math.sin(lng * 0.5) * 0.8 + Math.cos(lat * 0.8) * 0.5
  // Clamp between 18 and 34
  return Math.max(18.0, Math.min(34.0, base + noise))
}

// ──────────────────────────────────────────────────────────────────────────────
// COLOR PALETTES FOR HEATMAP DENSITY
// ──────────────────────────────────────────────────────────────────────────────

const palettes = {
  default: [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    "rgba(0, 0, 0, 0)",
    0.01,
    "rgba(50, 20, 120, 0.3)",
    0.1,
    "rgba(30, 60, 190, 0.45)",
    0.25,
    "rgba(30, 120, 230, 0.55)",
    0.4,
    "rgba(40, 190, 220, 0.6)",
    0.55,
    "rgba(60, 210, 140, 0.65)",
    0.7,
    "rgba(140, 225, 60, 0.7)",
    0.8,
    "rgba(220, 220, 40, 0.75)",
    0.9,
    "rgba(250, 120, 25, 0.84)",
    0.95,
    "rgba(240, 60, 20, 0.88)",
    1.0,
    "rgba(140, 0, 0, 0.95)",
  ],
  warm: [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    "rgba(0, 0, 0, 0)",
    0.01,
    "rgba(254, 240, 138, 0.2)",
    0.2,
    "rgba(253, 186, 116, 0.45)",
    0.4,
    "rgba(251, 146, 60, 0.6)",
    0.6,
    "rgba(249, 115, 22, 0.75)",
    0.8,
    "rgba(220, 38, 38, 0.85)",
    1.0,
    "rgba(127, 29, 29, 0.95)",
  ],
  cool: [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    "rgba(0, 0, 0, 0)",
    0.01,
    "rgba(224, 242, 254, 0.2)",
    0.2,
    "rgba(186, 230, 253, 0.45)",
    0.4,
    "rgba(125, 211, 252, 0.6)",
    0.6,
    "rgba(56, 189, 248, 0.75)",
    0.8,
    "rgba(2, 132, 199, 0.85)",
    1.0,
    "rgba(30, 58, 138, 0.95)",
  ],
  emerald: [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    "rgba(0, 0, 0, 0)",
    0.01,
    "rgba(240, 253, 244, 0.2)",
    0.2,
    "rgba(187, 247, 208, 0.45)",
    0.4,
    "rgba(134, 239, 172, 0.6)",
    0.6,
    "rgba(34, 197, 94, 0.75)",
    0.8,
    "rgba(21, 128, 61, 0.85)",
    1.0,
    "rgba(6, 78, 59, 0.95)",
  ],
}

// Precise coastline polygon rings for neighbor landmass clipping
const SRI_LANKA_RING: [number, number][] = [
  [80.0, 9.8],
  [79.7, 9.3],
  [79.7, 8.5],
  [79.8, 7.0],
  [80.0, 6.2],
  [80.6, 5.9],
  [81.2, 6.2],
  [81.8, 6.8],
  [81.9, 7.7],
  [81.8, 8.6],
  [81.2, 9.3],
  [80.5, 9.7],
  [80.0, 9.8],
]

const BANGLADESH_RING: [number, number][] = [
  [88.0, 26.5],
  [89.5, 26.6],
  [91.0, 26.0],
  [92.7, 25.8],
  [92.3, 20.8],
  [91.8, 22.0],
  [91.4, 22.7],
  [90.4, 22.0],
  [89.0, 21.6],
  [88.8, 24.0],
  [88.0, 24.5],
  [88.0, 26.5],
]

const MYANMAR_WEST_RING: [number, number][] = [
  [92.3, 20.8],
  [92.3, 24.0],
  [98.0, 24.0],
  [98.0, 15.8],
  [94.8, 15.8],
  [94.3, 16.2],
  [93.5, 18.5],
  [93.0, 19.5],
  [92.5, 20.2],
  [92.3, 20.8],
]

function isPointInSimplePolygon(
  point: [number, number],
  ring: [number, number][]
): boolean {
  let inside = false
  const x = point[0]
  const y = point[1]
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export const MapHeatmap = ({
  visible,
  geoJSONData,
  resolution,
  layers,
  palette,
  opacity,
  radius,
  onNodeSelect,
  onGridStats,
  currentDate,
  simulation,
}: MapHeatmapProps) => {
  const { map, isLoaded } = useMap()

  // Dense grid of telemetry nodes across all of India
  const heatmapGeoJSON = useMemo<HeatmapFeatureCollection | null>(() => {
    if (!geoJSONData || !geoJSONData.features) return null

    const features: HeatmapFeature[] = []

    // Hash/sum character codes of the currentDate to create a unique seed offset
    let seed = 42
    if (currentDate) {
      for (let i = 0; i < currentDate.length; i++) {
        seed += currentDate.charCodeAt(i)
      }
    }
    const rng = new SeededRandom(seed)

    // Configurable grid step size (e.g. 0.25)
    const GRID_STEP = resolution
    const LNG_MIN = 68.0
    const LNG_MAX = 98.0
    const LAT_MIN = 6.0
    const LAT_MAX = 36.5

    // Pre-build state bounding boxes to optimize polygon queries
    const stateGeometries = geoJSONData.features
      .filter((f) => f.geometry && f.properties?.ST_NM)
      .map((f) => {
        let minLng = Infinity
        let maxLng = -Infinity
        let minLat = Infinity
        let maxLat = -Infinity

        const processCoords = (coords: number[][]) => {
          for (const pt of coords) {
            const lng = pt[0]
            const lat = pt[1]
            if (lng < minLng) minLng = lng
            if (lng > maxLng) maxLng = lng
            if (lat < minLat) minLat = lat
            if (lat > maxLat) maxLat = lat
          }
        }

        const geom = f.geometry
        if (geom.type === "Polygon") {
          for (const ring of geom.coordinates as number[][][]) {
            processCoords(ring)
          }
        } else if (geom.type === "MultiPolygon") {
          for (const poly of geom.coordinates as number[][][][]) {
            for (const ring of poly) {
              processCoords(ring)
            }
          }
        }

        return {
          name: f.properties.ST_NM!,
          geometry: geom,
          bbox: { minLng, maxLng, minLat, maxLat },
        }
      })

    let idx = 0

    for (let lat = LAT_MIN; lat <= LAT_MAX; lat += GRID_STEP) {
      for (let lng = LNG_MIN; lng <= LNG_MAX; lng += GRID_STEP) {
        const point: [number, number] = [lng, lat]

        // Find state using optimized Bounding-Box + Polygon boundary checks
        let stateName: string | null = null
        for (const sg of stateGeometries) {
          if (
            lng >= sg.bbox.minLng &&
            lng <= sg.bbox.maxLng &&
            lat >= sg.bbox.minLat &&
            lat <= sg.bbox.maxLat
          ) {
            if (isPointInGeometry(point, sg.geometry)) {
              stateName = sg.name
              break
            }
          }
        }

        // Check if point is inside ocean grid boundary
        const isExcludedLand =
          isPointInSimplePolygon(point, SRI_LANKA_RING) || // Sri Lanka
          isPointInSimplePolygon(point, BANGLADESH_RING) || // Bangladesh
          isPointInSimplePolygon(point, MYANMAR_WEST_RING) || // Myanmar (Rakhine / west coast)
          (lng <= 68.1 && lat >= 23.5) // Pakistan coast / land

        const isOcean =
          !stateName &&
          !isExcludedLand &&
          lat <= 24.0 &&
          lng >= 65.0 &&
          lng <= 95.0
        if (isOcean) {
          stateName = lng < 77.5 ? "Arabian Sea" : "Bay of Bengal"
        }

        // Skip points that are neither land states of India nor valid ocean coordinates
        if (!stateName) continue

        // Jitter breaks grid alignment lines (scaled by resolution)
        const jitterLng = lng + (rng.next() - 0.5) * (GRID_STEP * 0.3)
        const jitterLat = lat + (rng.next() - 0.5) * (GRID_STEP * 0.3)

        // Select values and weights for each parameter
        let val_lst = 0
        let weight_lst = 0
        let val_rain = 0
        let weight_rain = 0
        let val_sst = 0
        let weight_sst = 0

        // Deterministic offsets/multipliers derived from the date seed
        const tempOffset = (rng.next() - 0.5) * 6 // -3°C to +3°C
        const rainMultiplier = 0.6 + rng.next() * 0.8 // 60% to 140%
        const sstOffset = (rng.next() - 0.5) * 3 // -1.5°C to +1.5°C

        if (isOcean) {
          val_sst = getRealisticSST(jitterLng, jitterLat) + sstOffset
          const norm_sst = Math.max(0, Math.min(1, (val_sst - 18) / 16))
          weight_sst = Math.pow(norm_sst, 1.8) * 100
        } else {
          val_lst = getRealisticTemperature(jitterLng, jitterLat) + tempOffset
          val_rain =
            getRealisticPrecipitation(jitterLng, jitterLat) * rainMultiplier

          if (simulation?.isActive && simulation?.applied) {
            val_lst = val_lst + simulation.applied.tempOffset
            val_rain = Math.max(
              0,
              val_rain * (1 + simulation.applied.rainfallMod / 100)
            )
          }

          const norm_lst = Math.max(0, Math.min(1, (val_lst + 8) / 56))
          weight_lst = Math.pow(norm_lst, 1.8) * 100

          const norm_rain = Math.max(0, Math.min(1, val_rain / 4800))
          weight_rain = Math.pow(norm_rain, 1.8) * 100
        }

        idx++
        const stateCode = stateName
          .replace(" ", "")
          .substring(0, 3)
          .toUpperCase()
        features.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [jitterLng, jitterLat],
          },
          properties: {
            id: `grid-${idx}`,
            name: `STN-${stateCode}-${String(idx).padStart(4, "0")}`,
            state: stateName,
            isOcean,
            value_lst: isOcean ? null : Math.round(val_lst * 10) / 10,
            weight_lst: isOcean ? 0 : Math.round(weight_lst * 10) / 10,
            value_rain: isOcean ? null : Math.round(val_rain * 10) / 10,
            weight_rain: isOcean ? 0 : Math.round(weight_rain * 10) / 10,
            value_sst: isOcean ? Math.round(val_sst * 10) / 10 : null,
            weight_sst: isOcean ? Math.round(weight_sst * 10) / 10 : 0,
          },
        })
      }
    }

    return {
      type: "FeatureCollection" as const,
      features,
    }
  }, [geoJSONData, resolution, currentDate, simulation])

  // Dynamic statistics calculations bubbled up
  useEffect(() => {
    if (!heatmapGeoJSON || !onGridStats) return
    const features = heatmapGeoJSON.features
    if (features.length === 0) return

    const stats: MultiGridStats = {}

    const calculateStatsFor = (
      valKey: "value_lst" | "value_rain" | "value_sst",
      layerKey: keyof MultiGridStats
    ) => {
      let min = Infinity
      let max = -Infinity
      let sum = 0
      let count = 0
      const stateVals: Record<string, { sum: number; count: number }> = {}

      for (const f of features) {
        const val = f.properties[valKey]
        if (val === undefined || val === null) continue
        const state = f.properties.state
        if (val < min) min = val
        if (val > max) max = val
        sum += val
        count++

        if (!stateVals[state]) {
          stateVals[state] = { sum: 0, count: 0 }
        }
        stateVals[state].sum += val
        stateVals[state].count += 1
      }

      if (count === 0) return

      const avg = sum / count
      const stateAverages = Object.entries(stateVals).map(([name, data]) => ({
        state: name,
        value: Math.round((data.sum / data.count) * 10) / 10,
      }))

      const topHighest = [...stateAverages]
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
      const topLowest = [...stateAverages]
        .sort((a, b) => a.value - b.value)
        .slice(0, 3)

      stats[layerKey] = {
        pointCount: count,
        min: Math.round(min * 10) / 10,
        max: Math.round(max * 10) / 10,
        avg: Math.round(avg * 10) / 10,
        topHighest,
        topLowest,
      }
    }

    if (layers["insat-lst"]) calculateStatsFor("value_lst", "insat-lst")
    if (layers["imd-rainfall"]) calculateStatsFor("value_rain", "imd-rainfall")
    if (layers["ocean-sst"]) calculateStatsFor("value_sst", "ocean-sst")

    onGridStats(stats)
  }, [heatmapGeoJSON, layers, onGridStats])

  useEffect(() => {
    if (!map || !isLoaded || !heatmapGeoJSON) return

    // Returns circle-color interpolation scheme for telemetry stations past zoom 10
    const getCircleColorExpression = () => {
      // Color by rainfall if rainfall is active, else sst if sst active, else lst
      const expr: any[] = ["interpolate", ["linear"]]
      if (layers["imd-rainfall"]) {
        expr.push(["get", "value_rain"])
        expr.push(
          0,
          "#fef08a",
          200,
          "#d9f99d",
          500,
          "#86efac",
          1000,
          "#34d399",
          2000,
          "#06b6d4",
          3000,
          "#2563eb",
          4800,
          "#1e3a8a"
        )
      } else if (layers["insat-lst"]) {
        expr.push(["get", "value_lst"])
        expr.push(
          -8,
          "#1e3cb4",
          0,
          "#2864dc",
          10,
          "#3cb4dc",
          18,
          "#50c8a0",
          25,
          "#8cdc50",
          30,
          "#dcdc32",
          35,
          "#fab41e",
          40,
          "#fa641e",
          44,
          "#dc2814",
          48,
          "#a00a0a"
        )
      } else {
        expr.push(["get", "value_sst"])
        expr.push(
          18,
          "#1e3cb4",
          21,
          "#2864dc",
          24,
          "#3cb4dc",
          27,
          "#50c8a0",
          30,
          "#fab41e",
          32,
          "#dc2814",
          34,
          "#a00a0a"
        )
      }
      return expr
    }

    const setupLayers = () => {
      // 1. GeoJSON Source
      if (!map.getSource("india-heatmap-source")) {
        map.addSource("india-heatmap-source", {
          type: "geojson",
          data: heatmapGeoJSON,
        })
      } else {
        const source = map.getSource(
          "india-heatmap-source"
        ) as mapboxgl.GeoJSONSource
        if (source) {
          source.setData(heatmapGeoJSON)
        }
      }

      // 2. Heatmap layers configuration
      const setupHeatmapLayer = (
        layerId: string,
        weightKey: string,
        paletteKey: keyof typeof palettes,
        isActive: boolean
      ) => {
        if (!map.getLayer(layerId)) {
          map.addLayer({
            id: layerId,
            type: "heatmap",
            source: "india-heatmap-source",
            maxzoom: 14,
            paint: {
              "heatmap-weight": [
                "interpolate",
                ["linear"],
                ["get", weightKey],
                0,
                0,
                100,
                1,
              ],
              "heatmap-intensity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2,
                0.12,
                4,
                0.2,
                6,
                0.32,
                8,
                0.48,
                10,
                0.6,
              ],
              "heatmap-color": palettes[paletteKey] as any,
              "heatmap-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2,
                Math.max(4, radius * 0.35),
                4,
                Math.max(6, radius * 0.6),
                5,
                radius,
                6,
                radius * 1.4,
                7,
                radius * 1.9,
                8,
                radius * 2.5,
                10,
                radius * 3.5,
              ],
              "heatmap-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2,
                opacity,
                9,
                opacity * 0.95,
                11,
                opacity * 0.6,
                13,
                opacity * 0.2,
                14,
                0,
              ],
            },
          })
        } else {
          map.setPaintProperty(
            layerId,
            "heatmap-color",
            palettes[paletteKey] as any
          )
          map.setPaintProperty(layerId, "heatmap-opacity", [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            opacity,
            9,
            opacity * 0.95,
            11,
            opacity * 0.6,
            13,
            opacity * 0.2,
            14,
            0,
          ])
          map.setPaintProperty(layerId, "heatmap-radius", [
            "interpolate",
            ["linear"],
            ["zoom"],
            2,
            Math.max(4, radius * 0.35),
            4,
            Math.max(6, radius * 0.6),
            5,
            radius,
            6,
            radius * 1.4,
            7,
            radius * 1.9,
            8,
            radius * 2.5,
            10,
            radius * 3.5,
          ])
        }

        // Sync layer visibility dynamically
        const visibility = visible && isActive ? "visible" : "none"
        map.setLayoutProperty(layerId, "visibility", visibility)
      }

      setupHeatmapLayer(
        "india-heatmap-lst-layer",
        "weight_lst",
        "warm",
        layers["insat-lst"]
      )
      setupHeatmapLayer(
        "india-heatmap-rain-layer",
        "weight_rain",
        "cool",
        layers["imd-rainfall"]
      )
      setupHeatmapLayer(
        "india-heatmap-sst-layer",
        "weight_sst",
        "default",
        layers["ocean-sst"]
      )

      // 3. Station Circle layer (rendered at zoom >= 10)
      if (!map.getLayer("india-heatmap-stations-layer")) {
        map.addLayer({
          id: "india-heatmap-stations-layer",
          type: "circle",
          source: "india-heatmap-source",
          minzoom: 10,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10,
              2,
              12,
              4,
              14,
              7,
            ],
            "circle-color": getCircleColorExpression() as any,
            "circle-stroke-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              6,
              0,
              8,
              0.5,
              11,
              1.5,
            ],
            "circle-stroke-color": "rgba(255,255,255,0.7)",
            "circle-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10,
              0,
              11,
              0.3,
              13,
              0.85,
            ],
            "circle-stroke-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10,
              0,
              11,
              0.2,
              13,
              0.7,
            ],
          },
        })
      } else {
        map.setPaintProperty(
          "india-heatmap-stations-layer",
          "circle-color",
          getCircleColorExpression() as any
        )
      }

      // Sync circle layer visibility dynamically
      const isAnyActive =
        layers["insat-lst"] || layers["imd-rainfall"] || layers["ocean-sst"]
      const circleVisibility = visible && isAnyActive ? "visible" : "none"
      map.setLayoutProperty(
        "india-heatmap-stations-layer",
        "visibility",
        circleVisibility
      )
    }

    setupLayers()

    const handleStyleLoad = () => {
      setupLayers()
    }
    map.on("style.load", handleStyleLoad)

    return () => {
      map.off("style.load", handleStyleLoad)
    }
  }, [map, isLoaded, heatmapGeoJSON, visible, palette, opacity, radius, layers])

  // Sync click & hover handlers
  useEffect(() => {
    if (!map || !isLoaded) return

    // Returns display unit representation for parameter readings
    const getUnitString = (val: number, param: string) => {
      if (param === "insat-lst" || param === "ocean-sst")
        return `${val.toFixed(1)}°C`
      if (param === "imd-rainfall") return `${val.toFixed(0)} mm`
      return val.toString()
    }

    // Popup on hover
    const popup = new mapgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "custom-map-popup",
    })

    const handleMouseEnter = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapGeoJSONFeature[] }
    ) => {
      if (!map || !e.features || e.features.length === 0 || !visible) return
      map.getCanvas().style.cursor = "pointer"
      const feature = e.features[0]
      const geometry = feature.geometry as {
        type: "Point"
        coordinates: number[]
      }
      const coordinates = geometry.coordinates.slice() as [number, number]
      const properties = feature.properties

      if (!properties) return

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
      }

      let popupRows = ""
      if (
        layers["insat-lst"] &&
        properties.value_lst !== null &&
        properties.value_lst !== undefined
      ) {
        popupRows += `
          <div class="flex items-center justify-between gap-4 mt-1">
            <span class="text-[9px] text-text-secondary uppercase">INSAT LST:</span>
            <span class="text-[9px] font-bold text-accent-signal-blue">${getUnitString(Number(properties.value_lst), "insat-lst")}</span>
          </div>`
      }
      if (
        layers["imd-rainfall"] &&
        properties.value_rain !== null &&
        properties.value_rain !== undefined
      ) {
        popupRows += `
          <div class="flex items-center justify-between gap-4 mt-1">
            <span class="text-[9px] text-text-secondary uppercase">IMD Rainfall:</span>
            <span class="text-[9px] font-bold text-accent-signal-blue">${getUnitString(Number(properties.value_rain), "imd-rainfall")}</span>
          </div>`
      }
      if (
        layers["ocean-sst"] &&
        properties.value_sst !== null &&
        properties.value_sst !== undefined
      ) {
        popupRows += `
          <div class="flex items-center justify-between gap-4 mt-1">
            <span class="text-[9px] text-text-secondary uppercase">Ocean SST:</span>
            <span class="text-[9px] font-bold text-accent-signal-blue">${getUnitString(Number(properties.value_sst), "ocean-sst")}</span>
          </div>`
      }

      const popupContent = `
        <div class="flex flex-col gap-1 p-2 text-xs min-w-[150px] bg-bg-panel-raised border border-border-hairline rounded-[6px] shadow-lg font-sans text-text-primary">
          <span class="font-bold text-accent-signal-blue text-[8px] uppercase tracking-[0.5px] font-mono">
            Grid Node (${resolution.toFixed(2)}°)
          </span>
          <div class="font-bold text-text-primary leading-tight text-[11px]">${properties.name}</div>
          <div class="text-text-secondary text-[9px] font-mono uppercase">${properties.state}</div>
          <div class="flex flex-col border-t border-border-hairline pt-1 mt-1 font-mono">
            ${popupRows || '<span class="text-[9px] text-text-secondary">No active overlays</span>'}
          </div>
        </div>
      `

      popup.setLngLat(coordinates).setHTML(popupContent).addTo(map)
    }

    const handleMouseLeave = () => {
      if (!map) return
      map.getCanvas().style.cursor = ""
      popup.remove()
    }

    // Handles picking node by clicking on a station dot directly
    const handleStationClick = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapGeoJSONFeature[] }
    ) => {
      if (!visible || !e.features || e.features.length === 0 || !onNodeSelect)
        return
      e.originalEvent.stopPropagation()
      onNodeSelect(e.features[0].properties as HeatmapFeature["properties"])
    }

    // Click anywhere on map to select closest active grid node
    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (!visible || !heatmapGeoJSON || !onNodeSelect) return

      const clickLng = e.lngLat.lng
      const clickLat = e.lngLat.lat

      let closestFeature: HeatmapFeature["properties"] | null = null
      let minDistance = Infinity

      for (const f of heatmapGeoJSON.features) {
        const [fLng, fLat] = f.geometry.coordinates
        const dist = Math.pow(clickLng - fLng, 2) + Math.pow(clickLat - fLat, 2)
        if (dist < minDistance) {
          minDistance = dist
          closestFeature = f.properties
        }
      }

      // Allow select if click is within grid distance spacing
      const maxDistDegree = resolution * 1.5
      if (minDistance < Math.pow(maxDistDegree, 2)) {
        onNodeSelect(closestFeature)
      } else {
        onNodeSelect(null)
      }
    }

    map.on("mouseenter", "india-heatmap-stations-layer", handleMouseEnter)
    map.on("mouseleave", "india-heatmap-stations-layer", handleMouseLeave)
    map.on("click", "india-heatmap-stations-layer", handleStationClick)
    map.on("click", handleMapClick)

    return () => {
      map.off("mouseenter", "india-heatmap-stations-layer", handleMouseEnter)
      map.off("mouseleave", "india-heatmap-stations-layer", handleMouseLeave)
      map.off("click", "india-heatmap-stations-layer", handleStationClick)
      map.off("click", handleMapClick)
      popup.remove()
    }
  }, [map, isLoaded, heatmapGeoJSON, visible, layers, resolution, onNodeSelect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!map) return
      try {
        if (map.getLayer("india-heatmap-lst-layer"))
          map.removeLayer("india-heatmap-lst-layer")
        if (map.getLayer("india-heatmap-rain-layer"))
          map.removeLayer("india-heatmap-rain-layer")
        if (map.getLayer("india-heatmap-sst-layer"))
          map.removeLayer("india-heatmap-sst-layer")
        if (map.getLayer("india-heatmap-stations-layer"))
          map.removeLayer("india-heatmap-stations-layer")
        if (map.getSource("india-heatmap-source"))
          map.removeSource("india-heatmap-source")
      } catch (e) {
        console.warn("Cleanup error for heatmap layers:", e)
      }
    }
  }, [map])

  return null
}
