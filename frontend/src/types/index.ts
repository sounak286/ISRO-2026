// ─── Geographic Primitives ─────────────────────────────────────────────

/** Longitude, Latitude pair (GeoJSON convention: [lng, lat]) */
export type MapCoordinates = [longitude: number, latitude: number]

/** Bounding box: southwest corner, northeast corner */
export type MapBounds = [southwest: MapCoordinates, northeast: MapCoordinates]

/** Ordered array of coordinates forming a path */
export type MapPath = MapCoordinates[]

// ─── Regions ───────────────────────────────────────────────────────────

export interface Region {
  /** Unique identifier (e.g., "western-ghats", "kerala", "kannur") */
  id: string
  /** Display name (e.g., "Western Ghats", "Kerala", "Kannur District") */
  name: string
  /** Region type for hierarchy */
  type: "macro-region" | "state" | "district"
  /** Parent region ID (null for top-level) */
  parentId: string | null
  /** Map center when this region is selected */
  center: MapCoordinates
  /** Default zoom level for this region */
  zoom: number
  /** Bounding box for map fitBounds */
  bounds: MapBounds
  /** Whether mock data exists for this region (Phase 0) */
  hasData: boolean
}

export interface RegionList {
  regions: Region[]
  defaultRegionId: string // "western-ghats" for Phase 0
}

// ─── Climate Data Layers ─────────────────────────────────────────────────

/** The three data layers specified in the PRD */
export type LayerId = "insat-lst" | "imd-rainfall" | "ocean-sst"

/** Extended parameter set used in the current implementation */
export type ParameterId = "temp" | "precip" | "humidity" | "wind" | "solar"

export interface LayerDefinition {
  id: LayerId
  /** Display label */
  name: string
  /** Short description */
  description: string
  /** Physical unit */
  unit: string
  /** Color scale endpoints [min, max] */
  colorScale: {
    min: { value: number; color: string }
    max: { value: number; color: string }
    /** Intermediate stops for gradient */
    stops: Array<{ value: number; color: string }>
  }
  /** Valid value range */
  range: { min: number; max: number }
  /** Source attribution */
  source: "INSAT-3D" | "IMD" | "ERA5" | "Simulated"
  /** Icon identifier (Lucide icon name) */
  icon: string
}

export interface LayerState {
  /** INSAT Land Surface Temperature — checked/unchecked */
  "insat-lst": boolean
  /** IMD Rainfall — checked/unchecked */
  "imd-rainfall": boolean
  /** Ocean Sea Surface Temperature — checked/unchecked */
  "ocean-sst": boolean
}

/** Default layer state per FLOW.md §2.2 */
export const DEFAULT_LAYER_STATE: LayerState = {
  "insat-lst": false,
  "imd-rainfall": true, // Only rainfall is ON by default
  "ocean-sst": false,
}

// ─── Heatmap / Grid Data ───────────────────────────────────────────────

export interface GridPoint {
  /** Unique point identifier (e.g., "grid-0001") */
  id: string
  /** Station/node name (e.g., "STN-KER-0042") */
  name: string
  /** State/UT name the point falls within */
  state: string
  /** Geographic position */
  coordinates: MapCoordinates
  /** Climate value at this point */
  value: number
  /** Normalized weight for heatmap rendering (0–100) */
  weight: number
}

export interface GridData {
  /** GeoJSON FeatureCollection of grid points */
  type: "FeatureCollection"
  features: GridFeature[]
}

export interface GridFeature {
  type: "Feature"
  geometry: {
    type: "Point"
    coordinates: [number, number]
  }
  properties: GridPoint
}

export interface GridStats {
  /** Total number of grid nodes */
  pointCount: number
  /** Minimum value in the grid */
  min: number
  /** Maximum value in the grid */
  max: number
  /** Mean value across all grid nodes */
  avg: number
  /** Standard deviation */
  stdDev?: number
  /** Top 3 states by highest average value */
  topHighest: StateAverage[]
  /** Top 3 states by lowest average value */
  topLowest: StateAverage[]
}

export interface StateAverage {
  state: string
  value: number
}

// ─── GeoJSON State Boundaries ──────────────────────────────────────────

export interface StateFeature {
  type: "Feature"
  geometry: {
    type: "Polygon" | "MultiPolygon"
    coordinates: number[][][] | number[][][][]
  }
  properties: {
    /** State name (e.g., "Kerala", "Rajasthan") */
    ST_NM: string
    /** Optional: state/UT code */
    ST_CD?: number
    /** Optional: census code */
    CENSUS_CD?: string
  }
}

export interface StateFeatureCollection {
  type: "FeatureCollection"
  features: StateFeature[]
}

// ─── What-If Simulation ────────────────────────────────────────────────

export interface SimulationParams {
  /** Rainfall modification percentage (-50 to +50) */
  rainfallMod: number
  /** Temperature offset in °C (-2 to +5) */
  tempOffset: number
}

export interface SimulationState {
  /** Current slider values (may differ from last-run values) */
  pending: SimulationParams
  /** Values from the last "Run Simulation" click (null if never run) */
  applied: SimulationParams | null
  /** Whether the map is currently showing what-if results */
  isActive: boolean
  /** Whether a simulation is currently computing */
  isRunning: boolean
}

/** Default simulation state per FLOW.md §2.3 */
export const DEFAULT_SIMULATION_STATE: SimulationState = {
  pending: { rainfallMod: 0, tempOffset: 0 },
  applied: null,
  isActive: false,
  isRunning: false,
}

/** Simulation result returned by the API (Phase 1) */
export interface SimulationResult {
  /** Unique job identifier */
  jobId: string
  /** Job status */
  status: "pending" | "running" | "completed" | "failed"
  /** Input parameters */
  params: SimulationParams
  /** Region the simulation was run for */
  regionId: string
  /** Base date the simulation started from */
  baseDate: string // ISO 8601
  /** Modified grid data (only present when status === "completed") */
  gridData?: GridData
  /** Modified stats */
  gridStats?: GridStats
  /** Computation time in milliseconds */
  computeTimeMs?: number
  /** Error message (only present when status === "failed") */
  error?: string
}

// ─── Time Navigation ───────────────────────────────────────────────────

export interface TimeState {
  /** Currently selected date */
  currentDate: string // ISO 8601 date string "YYYY-MM-DD"
  /** Available date range in the dataset */
  availableRange: DateRange
  /** Index of "now" — divides observed from forecasted */
  nowIndex: number
  /** Whether auto-playback is active */
  isPlaying: boolean
  /** Playback speed in milliseconds per step */
  playbackIntervalMs: number
}

export interface DateRange {
  /** First available date (oldest observation) */
  start: string // ISO 8601
  /** Last available date (furthest forecast) */
  end: string // ISO 8601
  /** Array of all available dates in order */
  dates: string[]
}

/** Date entry metadata */
export interface DateEntry {
  date: string // ISO 8601 "YYYY-MM-DD"
  /** Whether this date represents observed or forecasted data */
  type: "observed" | "forecasted"
  /** Whether grid data exists for this date */
  hasData: boolean
}

/** Default time state per FLOW.md §2.5 */
export const DEFAULT_TIME_STATE: TimeState = {
  currentDate: "", // Set to "now" date on initialization
  availableRange: {
    start: "",
    end: "",
    dates: [],
  },
  nowIndex: 0,
  isPlaying: false,
  playbackIntervalMs: 1000, // 1 second per day
}

// ─── Alerts ────────────────────────────────────────────────────────────

export type AlertSeverity = "info" | "warning" | "critical"

export interface Alert {
  /** Unique alert identifier */
  id: string
  /** Short alert title (e.g., "Extreme Heat Warning: Zone 4B") */
  title: string
  /** Detailed description */
  description: string
  /** Alert severity level */
  severity: AlertSeverity
  /** Affected region ID */
  regionId: string
  /** Affected zone/area name (display string) */
  affectedZone: string
  /** Date range the alert applies to */
  dateRange: {
    start: string // ISO 8601
    end: string // ISO 8601
  }
  /** Associated climate parameter */
  parameter: ParameterId | LayerId
  /** Threshold value that triggered the alert */
  thresholdValue?: number
  /** Observed/forecasted value that exceeded the threshold */
  observedValue?: number
  /** Geographic center of the alert zone (for "View on map" action) */
  coordinates?: MapCoordinates
  /** Timestamp when the alert was issued */
  issuedAt: string // ISO 8601
  /** Whether the alert is currently active */
  isActive: boolean
}

/** Alert chip as rendered in the alerts bar */
export interface AlertChip {
  id: string
  title: string
  severity: AlertSeverity
  /** Truncated description for inline display */
  shortDescription: string
}

// ─── UI / Loading / Error States ───────────────────────────────────────

export interface UIState {
  /** Whether the app is in a global loading state */
  isLoading: boolean
  /** Loading message to display */
  loadingMessage: string | null
  /** Global error state */
  error: AppError | null
  /** Whether the sidebar drawer is open (tablet breakpoint) */
  isSidebarOpen: boolean
  /** Currently open alert detail (null = none open) */
  activeAlertDetail: string | null
}

export interface AppError {
  /** Machine-readable error code */
  code: ErrorCode
  /** Human-readable error message */
  message: string
  /** Whether a retry action is available */
  retryable: boolean
}

export type ErrorCode =
  | "DATA_LOAD_FAILED"
  | "REGION_NOT_FOUND"
  | "SIMULATION_FAILED"
  | "NETWORK_ERROR"
  | "GEOJSON_PARSE_ERROR"
  | "DATE_NOT_AVAILABLE"

/** Composite root state shape (for Zustand store in Phase 1) */
export interface AppState {
  // Domain state
  region: Region
  layers: LayerState
  simulation: SimulationState
  time: TimeState
  alerts: Alert[]
  gridData: GridData | null
  gridStats: GridStats | null

  // UI state
  ui: UIState

  // Selected inspection target
  selectedNode: GridPoint | null

  // Actions
  setRegion: (regionId: string) => void
  toggleLayer: (layerId: LayerId) => void
  setSimulationParam: (key: keyof SimulationParams, value: number) => void
  runSimulation: () => Promise<void>
  resetSimulation: () => void
  setCurrentDate: (date: string) => void
  togglePlayback: () => void
  stepForward: () => void
  stepBackward: () => void
  skipToStart: () => void
  skipToEnd: () => void
  selectNode: (node: GridPoint | null) => void
  dismissAlert: (alertId: string) => void
}

// ─── Telemetry Stream (Phase 0 Mock) ───────────────────────────────────

export interface TelemetryLogEntry {
  /** Timestamp string (e.g., "11:42:15 AM") */
  timestamp: string
  /** Log message type */
  type: "telemetry" | "system" | "alert" | "error"
  /** Full formatted log message */
  message: string
  /** Whether this is the most recent entry (for highlight styling) */
  isLatest: boolean
}

/** Telemetry stream configuration */
export interface TelemetryConfig {
  /** Interval between log entries in milliseconds */
  intervalMs: number // default: 1800
  /** Maximum number of log entries to retain */
  maxEntries: number // default: 19
  /** PRNG seed for deterministic output */
  seed: number
}
