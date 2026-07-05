import type { Region } from "@/types"

export const MOCK_REGIONS: Region[] = [
  // 1. South/West: Western Ghats
  {
    id: "western-ghats",
    name: "Western Ghats",
    type: "macro-region",
    parentId: null,
    center: [75.5, 13.0],
    zoom: 6.5,
    bounds: [
      [72.5, 8.0],
      [78.5, 21.0],
    ],
    hasData: true,
  },
  {
    id: "kerala",
    name: "Kerala",
    type: "state",
    parentId: "western-ghats",
    center: [76.3, 10.5],
    zoom: 7.5,
    bounds: [
      [74.8, 8.2],
      [77.5, 12.8],
    ],
    hasData: true,
  },

  // 2. North: Himalayan Belt
  {
    id: "himalayan-belt",
    name: "Himalayan Belt",
    type: "macro-region",
    parentId: null,
    center: [77.6, 32.5],
    zoom: 6.0,
    bounds: [
      [73.0, 29.0],
      [82.0, 36.0],
    ],
    hasData: true,
  },
  {
    id: "ladakh",
    name: "Ladakh (UT)",
    type: "state",
    parentId: "himalayan-belt",
    center: [77.6, 34.2],
    zoom: 7.0,
    bounds: [
      [75.0, 32.0],
      [80.5, 36.5],
    ],
    hasData: true,
  },

  // 3. Central/Deccan: Deccan Plateau
  {
    id: "deccan-plateau",
    name: "Deccan Plateau",
    type: "macro-region",
    parentId: null,
    center: [78.0, 19.0],
    zoom: 6.0,
    bounds: [
      [73.0, 13.0],
      [83.0, 25.0],
    ],
    hasData: true,
  },
  {
    id: "maharashtra",
    name: "Maharashtra",
    type: "state",
    parentId: "deccan-plateau",
    center: [76.0, 19.5],
    zoom: 7.0,
    bounds: [
      [72.5, 15.5],
      [80.9, 22.0],
    ],
    hasData: true,
  },

  // 4. East: Gangetic Plains
  {
    id: "gangetic-plains",
    name: "Gangetic Plains",
    type: "macro-region",
    parentId: null,
    center: [83.0, 25.5],
    zoom: 6.0,
    bounds: [
      [77.0, 22.0],
      [89.5, 29.0],
    ],
    hasData: true,
  },
  {
    id: "west-bengal",
    name: "West Bengal",
    type: "state",
    parentId: "gangetic-plains",
    center: [87.5, 23.8],
    zoom: 7.0,
    bounds: [
      [85.5, 21.5],
      [89.8, 27.5],
    ],
    hasData: true,
  },

  // 5. Northwest: Thar Desert (Simulated Error)
  {
    id: "thar-desert-error",
    name: "Thar Desert (Simulated Error)",
    type: "macro-region",
    parentId: null,
    center: [71.5, 26.5],
    zoom: 6.5,
    bounds: [
      [68.0, 24.0],
      [75.0, 29.0],
    ],
    hasData: false,
  },
]

export const DEFAULT_REGION_ID = "western-ghats"
