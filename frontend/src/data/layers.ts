import type { LayerDefinition } from "@/types"

export const LAYER_DEFINITIONS: LayerDefinition[] = [
  {
    id: "insat-lst",
    name: "INSAT LST",
    description:
      "Land Surface Temperature from INSAT-3D/3DR thermal infrared band",
    unit: "°C",
    colorScale: {
      min: { value: -5, color: "#1e3cb4" },
      max: { value: 48, color: "#a00a0a" },
      stops: [
        { value: 5, color: "#2864dc" },
        { value: 15, color: "#3cb4dc" },
        { value: 22, color: "#50c8a0" },
        { value: 28, color: "#8cdc50" },
        { value: 33, color: "#dcdc32" },
        { value: 37, color: "#fab41e" },
        { value: 40, color: "#fa641e" },
        { value: 44, color: "#dc2814" },
      ],
    },
    range: { min: -8, max: 48 },
    source: "INSAT-3D",
    icon: "Thermometer",
  },
  {
    id: "imd-rainfall",
    name: "IMD Rainfall",
    description:
      "Gridded rainfall analysis from India Meteorological Department ground stations",
    unit: "mm",
    colorScale: {
      min: { value: 0, color: "#fef08a" },
      max: { value: 4500, color: "#1e3a8a" },
      stops: [
        { value: 200, color: "#d9f99d" },
        { value: 500, color: "#86efac" },
        { value: 1000, color: "#34d399" },
        { value: 2000, color: "#06b6d4" },
        { value: 3000, color: "#2563eb" },
      ],
    },
    range: { min: 0, max: 4800 },
    source: "IMD",
    icon: "CloudRain",
  },
  {
    id: "ocean-sst",
    name: "Ocean SST",
    description: "Sea Surface Temperature from ERA5 reanalysis / INSAT-3D",
    unit: "°C",
    colorScale: {
      min: { value: 20, color: "#2447B8" },
      max: { value: 32, color: "#E23B3B" },
      stops: [
        { value: 23, color: "#3cb4dc" },
        { value: 26, color: "#F2C245" },
        { value: 29, color: "#fa641e" },
      ],
    },
    range: { min: 18, max: 34 },
    source: "ERA5",
    icon: "Waves",
  },
]
