# Technical Requirements Document
## AI-Powered Digital Twin of India's Climate

**Author:** Engineering  
**Team:** SHIV-SAKTI  
**Context:** Bharatiya Antariksh Hackathon 2026, Problem Statement 5  
**Version:** v1.0  
**Status:** Draft  
**Companion docs:** [PRD.md](./PRD.md), [FLOW.md](./FLOW.md), [UI.md](./UI.md), [DESIGN.md](./DESIGN.md), [SCHEMA.md](./SCHEMA.md)

---

## 1. System Overview

The India Climate Twin is a geospatial climate intelligence platform that fuses IMD ground observations, ISRO INSAT-3D/3DR satellite imagery, and ERA5 reanalysis data with AI models (ConvLSTM / Vision Transformer) to produce high-resolution (~0.25° spatial, ~6-hour temporal), near-real-time climate forecasts and what-if scenario simulations across India.

The system is split into two architectural phases:

- **Phase 0 (Current — Hackathon Prototype):** A frontend-only demo with mocked data. No backend, no real ML inference, no live data pipelines. All data is client-side generated or loaded from local fixture files.
- **Phase 1+ (Post-Hackathon):** Full-stack platform with backend API, ML inference pipeline, data ingestion from IMD/ISRO/ERA5, real-time assimilation, and multi-region support.

This TRD covers **both phases**: the precise existing technical implementation for Phase 0, and the planned architecture for Phase 1+.

---

## 2. Phase 0 — Current Frontend Stack

### 2.1 Runtime & Build

| Concern | Technology | Version |
|---|---|---|
| Language | TypeScript | ~6.x |
| UI Framework | React | 19.x |
| Build Tool | Vite | 8.x |
| Package Manager | pnpm | (workspace-enabled) |
| Target | ES2023 + DOM |
| Module System | ESM (`"type": "module"`) |

**Build scripts:**
- `pnpm dev` — Vite dev server (HMR)
- `pnpm build` — `tsc -b && vite build` (production bundle)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — ESLint
- `pnpm format` — Prettier

**TypeScript config highlights:**
- `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`
- Path alias: `@/*` → `./src/*`

### 2.2 Styling & Design System

| Concern | Technology | Notes |
|---|---|---|
| CSS Framework | Tailwind CSS v4 | Via `@tailwindcss/vite` plugin |
| Component Library | shadcn/ui | `radix-nova` style preset, Radix UI primitives |
| Icon Library | Lucide React | |
| Typography | Inter Variable | `@fontsource-variable/inter` |
| Animations | tw-animate-css | |
| Theming | Custom ThemeProvider | Dark/light/system, `localStorage` persistence, keyboard shortcut `D` |

**Design token architecture:**  
Custom CSS custom properties defined in `src/index.css` under `:root` (light) and `.dark` (dark) selectors, mapped to Tailwind's `@theme inline` block. Tokens follow the naming from [DESIGN.md](./DESIGN.md) — `--canvas`, `--ink`, `--primary`, `--hairline`, etc. — with Tailwind aliases (`--color-canvas: var(--canvas)`).

**shadcn/ui configuration** (`components.json`):
- Style: `radix-nova`
- RSC: `false` (client-side only)
- TSX: `true`
- Base color: `neutral`
- CSS variables: `true`
- Component path: `@/components/ui`

### 2.3 Mapping & Geospatial

| Concern | Technology | Notes |
|---|---|---|
| Map Engine | MapLibre GL JS | v5.24.x (free, open-source) |
| Map Components | Terrae | Declarative React wrapper over MapLibre/Mapbox GL |
| Map Styles | CARTO basemaps | `positron-gl-style` (light), `dark-matter-gl-style` (dark) |
| GeoJSON | India states boundary | `public/india_states.geojson` (~1 MB, 3,114 state polygons) |

**Map component hierarchy:**
```
<Map center={[78.96, 20.59]} zoom={4.6}>
  <MapControls position="bottom-right">
    <MapZoom />
    <MapOrientation />
    <MapGeolocate />
    <MapFullscreen />
  </MapControls>
  <MapHeatmap ... />   ← Custom component (not from Terrae)
</Map>
```

The `MapHeatmap` component is a **custom implementation** (not from the Terrae library) that:
1. Generates a dense grid of synthetic climate data points across India at configurable resolution (0.12°–1.0°)
2. Uses ray-casting (point-in-polygon) to filter grid points to within state boundaries
3. Renders as a MapLibre GL `heatmap` layer with configurable color palettes
4. Transitions to individual `circle` markers at zoom level ≥ 10
5. Supports five climate parameters: Temperature, Precipitation, Humidity, Wind Speed, Solar Radiation
6. Includes realistic spatial models for each parameter using radial influence fields

### 2.4 Application Architecture (Phase 0)

**Single-page application (SPA)** — no routing, no multi-page navigation. The entire app is one persistent dashboard layout rendered in `src/App.tsx`.

**State management:** React `useState` hooks only — no external state library. State is local and ephemeral (no persistence across refreshes, per FLOW.md specification).

**Component tree:**
```
main.tsx
└── ThemeProvider
    └── App
        ├── Header (inline)
        │   ├── Logo + title
        │   ├── GeoJSON connection status
        │   └── Theme toggle
        ├── Map Panel (main content)
        │   ├── Map (Terrae)
        │   │   ├── MapControls
        │   │   └── MapHeatmap (custom)
        │   ├── Loading overlay
        │   └── Legend overlay
        ├── Bottom Panel
        │   ├── Telemetry Log Stream (simulated)
        │   └── Regional Climate Advisories
        └── Sidebar (right, 420px)
            ├── Mesh Overlay Controls
            │   ├── Parameter selector (5 options)
            │   ├── Resolution selector (4 options)
            │   ├── Palette selector
            │   ├── Opacity slider
            │   └── Smoothing radius slider
            ├── Grid Spatial Statistics
            └── Interactive Mesh Inspector
```

### 2.5 Data Generation (Phase 0 — Mocked)

All climate data is generated client-side using deterministic mathematical models in `src/components/ui/map/heatmap.tsx`. There are no API calls or fixture JSON files for climate values.

**Data generation pipeline:**
1. India's bounding box is divided into a regular grid (default 0.25° step)
2. Each grid point is tested against state GeoJSON polygons via ray-casting
3. Points inside India are assigned climate values using spatial influence models
4. A seeded PRNG adds micro-noise for visual texture
5. Values are normalized and weighted for heatmap density rendering

**Simulated telemetry stream:**
- `setInterval` at 1800ms generates fake telemetry log entries
- Uses `SeededRandom` with `Date.now()` seed for variety
- Log entries reference random Indian states and mock station IDs

**Static alert generation:**
- `useMemo` computes 2 alerts per parameter from hardcoded definitions
- Alerts have severity levels: `danger`, `warning`, `info`
- No temporal filtering — alerts are parameter-dependent, not date-dependent

### 2.6 Dependencies (Complete)

**Production:**
| Package | Purpose |
|---|---|
| `react`, `react-dom` | UI framework |
| `maplibre-gl` | Map rendering engine |
| `mapbox-gl` | Type definitions / map library detection |
| `tailwindcss`, `@tailwindcss/vite` | Styling |
| `tw-animate-css` | Animation utilities |
| `radix-ui` | Headless UI primitives |
| `shadcn` | Component registry CLI |
| `class-variance-authority` | Variant-based component styling |
| `clsx`, `tailwind-merge` | Class name utilities |
| `lucide-react` | Icon library |
| `next-themes` | Theme infrastructure (indirect, via ThemeProvider) |
| `@fontsource-variable/inter` | Typography |

**Dev:**
| Package | Purpose |
|---|---|
| `vite`, `@vitejs/plugin-react` | Build tooling |
| `typescript` | Type checking |
| `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` | Linting |
| `prettier`, `prettier-plugin-tailwindcss` | Formatting |
| `@types/react`, `@types/react-dom`, `@types/mapbox-gl`, `@types/node` | Type definitions |

---

## 3. Phase 0 — What Exists vs. What's Missing

### 3.1 Implemented ✅

| Feature | Status | Notes |
|---|---|---|
| MapLibre GL map with India focus | ✅ | Center: [78.96, 20.59], zoom: 4.6 |
| State boundary GeoJSON | ✅ | All Indian states, served from `/public` |
| Heatmap rendering (5 parameters) | ✅ | Temperature, Precipitation, Humidity, Wind, Solar |
| Configurable grid resolution | ✅ | 0.12°, 0.25°, 0.50°, 1.00° |
| 4 color palettes | ✅ | Default spectrum, Warm, Cool, Emerald |
| Opacity & radius sliders | ✅ | Real-time map layer updates |
| Click-to-inspect mesh nodes | ✅ | Closest-node selection with inspector panel |
| Hover tooltips on stations (zoom ≥ 10) | ✅ | Station ID, state, parameter value |
| Grid statistics (min/max/avg, top regions) | ✅ | Auto-computed from generated data |
| Simulated telemetry log stream | ✅ | 1800ms interval, parameter-aware |
| Climate advisory alerts | ✅ | 2 per parameter, severity-coded |
| Dark/light theme toggle | ✅ | `D` keyboard shortcut, localStorage |
| Map controls (zoom, orientation, geolocate, fullscreen) | ✅ | Terrae components |

### 3.2 Missing from PRD/FLOW Scope ⚠️

| Feature | PRD Section | Status | Priority |
|---|---|---|---|
| Region selector dropdown | §4.1 | ❌ Not implemented | High |
| Layer toggles (LST, Rainfall, SST as checkboxes) | §4.2 | ⚠️ Partial — has parameter selector but not the PRD's 3-checkbox model | High |
| Time controls (scrubber, play/pause, step) | §4.5 | ❌ Not implemented | High |
| Simulation sandbox (rainfall mod %, temp offset °C sliders + Run/Reset) | §4.4 | ❌ Not implemented | High |
| Anomaly alerts bar (bottom, full-width, with ticker) | §4.6 | ⚠️ Partial — alerts exist in bottom panel but not as the FLOW-specified full-width bar | Medium |
| Loading simulation (300–600ms delays) | FLOW §1.2 | ❌ Not implemented | Medium |
| Empty states (no layers selected, no alerts) | FLOW §6.2 | ❌ Not implemented | Low |
| Error states (missing fixture) | FLOW §6.1 | ❌ Not implemented | Low |
| Live-scan radar pulse animation | UI §0 | ❌ Not implemented | Medium |
| Sidebar drawer collapse (tablet breakpoint) | UI §7 | ❌ Not implemented | Low |

---

## 4. Phase 1+ — Full-Stack Architecture

### 4.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                             │
│  React SPA + MapLibre GL + Terrae                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐  │
│  │ Dashboard UI │  │ Map Renderer │  │ WebSocket Client           │  │
│  │ (React)      │  │ (MapLibre)   │  │ (Real-time data updates)   │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────┬───────────────┘  │
│         │                │                        │                  │
└─────────┼────────────────┼────────────────────────┼──────────────────┘
          │  REST API       │  Tile / GeoJSON         │  WebSocket
          ▼                ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / EDGE                              │
│  (Vercel Edge Functions or AWS API Gateway + CloudFront)             │
└─────────────────────────────────────────────────────────────────────┘
          │                │                        │
          ▼                ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                                │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Forecast API     │  │ Simulation API   │  │ Alert Service    │   │
│  │ (REST + WS)      │  │ (REST)           │  │ (Push + REST)    │   │
│  │                  │  │                  │  │                  │   │
│  │ GET /forecast    │  │ POST /simulate   │  │ GET /alerts      │   │
│  │ GET /observed    │  │                  │  │ WS /alerts/live  │   │
│  │ WS /stream       │  │                  │  │                  │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │
│           │                     │                      │            │
│  ┌────────▼─────────────────────▼──────────────────────▼─────────┐  │
│  │                    ML INFERENCE ENGINE                          │  │
│  │  ConvLSTM / Vision Transformer (PyTorch)                       │  │
│  │  - Forecast: <60s inference on GPU                             │  │
│  │  - What-If: parameter perturbation + re-inference              │  │
│  │  - Anomaly detection: threshold + statistical deviation        │  │
│  └────────┬───────────────────────────────────────────────────────┘  │
│           │                                                         │
│  ┌────────▼───────────────────────────────────────────────────────┐  │
│  │                    DATA LAYER                                   │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐    │  │
│  │  │ PostGIS  │  │ Redis Cache  │  │ Object Storage (S3)    │    │  │
│  │  │ (geo +   │  │ (hot cache,  │  │ (raw satellite imgs,   │    │  │
│  │  │ time-    │  │ session,     │  │ model checkpoints,     │    │  │
│  │  │ series)  │  │ rate limit)  │  │ GeoTIFF, NetCDF)       │    │  │
│  │  └──────────┘  └──────────────┘  └────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │               DATA INGESTION PIPELINE                           │  │
│  │  ┌─────────┐  ┌───────────┐  ┌──────────────┐                  │  │
│  │  │ IMD     │  │ ISRO      │  │ ERA5         │                  │  │
│  │  │ (Ground │  │ MOSDAC    │  │ (Copernicus  │                  │  │
│  │  │ Obs)    │  │ (INSAT    │  │ CDS API)     │                  │  │
│  │  │         │  │ 3D/3DR)   │  │              │                  │  │
│  │  └────┬────┘  └─────┬─────┘  └──────┬───────┘                  │  │
│  │       └──────────────┴───────────────┘                          │  │
│  │               ↓ ETL (Python / Airflow / Prefect)                │  │
│  │       Normalize → Grid → Quality Check → Store                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Backend Technology Stack (Planned)

| Layer | Technology | Rationale |
|---|---|---|
| **API Server** | FastAPI (Python) | Async-first, native Pydantic validation, easy ML integration |
| **ML Runtime** | PyTorch + ONNX Runtime | ConvLSTM/ViT training in PyTorch, ONNX for optimized inference |
| **Task Queue** | Celery + Redis | Async simulation jobs, inference batching |
| **Database** | PostgreSQL + PostGIS + TimescaleDB | Spatial queries (PostGIS), time-series optimization (TimescaleDB) |
| **Cache** | Redis | Hot cache for latest forecasts, rate limiting, session state |
| **Object Storage** | S3-compatible (MinIO local / AWS S3 prod) | Satellite imagery, model weights, NetCDF/GeoTIFF blobs |
| **Message Broker** | Redis Pub/Sub or NATS | WebSocket fanout for real-time data push |
| **ETL / Orchestration** | Apache Airflow or Prefect | Scheduled data ingestion from IMD, MOSDAC, ERA5 |
| **Containerization** | Docker + Docker Compose (dev), Kubernetes (prod) | Reproducible deployments |
| **CI/CD** | GitHub Actions | Lint, test, build, deploy pipelines |

### 4.3 API Design (Phase 1)

#### 4.3.1 REST Endpoints

```
Base URL: /api/v1

# Regions
GET    /regions                           → RegionList
GET    /regions/:id                       → RegionDetail (with boundary GeoJSON)
GET    /regions/:id/districts             → DistrictList

# Forecast & Observed Data
GET    /data/observed                     → GridData (query: region, layer, date, resolution)
GET    /data/forecast                     → GridData (query: region, layer, dateRange, resolution)
GET    /data/timeseries                   → TimeSeriesData (query: region, layer, point, dateRange)

# Layers
GET    /layers                            → LayerMetadata[]

# Simulation
POST   /simulate                          → SimulationResult (body: region, baseDate, rainfallMod, tempOffset)
GET    /simulate/:jobId                   → SimulationStatus / Result (polling for async jobs)

# Alerts
GET    /alerts                            → AlertList (query: region, dateRange, severity)
GET    /alerts/:id                        → AlertDetail

# System
GET    /health                            → HealthStatus
GET    /meta/parameters                   → ParameterMetadata[]
GET    /meta/date-range                   → AvailableDateRange
```

#### 4.3.2 WebSocket Channels

```
WS /ws/data-stream           → Real-time grid data updates (new observations arriving)
WS /ws/alerts                → Live alert push (new anomaly detected)
WS /ws/simulation/:jobId     → Simulation progress updates
```

#### 4.3.3 Response Format Convention

All REST responses follow a standard envelope:

```json
{
  "status": "ok" | "error",
  "data": { ... },
  "meta": {
    "timestamp": "ISO 8601",
    "region": "region_id",
    "resolution": 0.25,
    "unit": "°C"
  },
  "error": {
    "code": "REGION_NOT_FOUND",
    "message": "Human-readable description"
  }
}
```

### 4.4 Data Ingestion Pipeline

| Source | Data Type | Format | Update Frequency | Access Method |
|---|---|---|---|---|
| **IMD** | Ground station observations (temp, rainfall, humidity, wind) | CSV / API | 3-hourly (synoptic) | IMD Data Portal / bulk download |
| **ISRO MOSDAC** | INSAT-3D/3DR satellite imagery (LST, OLR, cloud mask, water vapor) | HDF5 / GeoTIFF | 30-min (thermal IR) | MOSDAC API / FTP |
| **ECMWF ERA5** | Reanalysis (temp, precip, pressure, wind at pressure levels) | NetCDF / GRIB2 | Hourly (reanalysis), ~5-day lag | Copernicus CDS API |
| **District boundaries** | Administrative boundaries | GeoJSON / Shapefile | Static (updated annually) | Survey of India / Census |

**ETL pipeline stages:**
1. **Fetch** — Scheduled pull from source APIs (cron / Airflow DAG)
2. **Decode** — Parse HDF5/NetCDF/GRIB2 into in-memory arrays (xarray, rasterio)
3. **Regrid** — Interpolate to standard 0.25° grid using bilinear/conservative remapping
4. **QC** — Range checks, missing-value imputation, spatial consistency checks
5. **Store** — Write to PostGIS (gridded values) + S3 (raw files) + Redis (latest snapshot)
6. **Index** — Update TimescaleDB hypertables with new time steps

### 4.5 ML Inference Pipeline

**Model architecture (planned):**
- **ConvLSTM** for spatiotemporal forecasting — captures spatial autocorrelation + temporal memory
- **Vision Transformer (ViT)** variant for satellite imagery feature extraction
- **Ensemble** of ConvLSTM + statistical downscaling for probabilistic forecasts

**Inference flow:**
```
Input: Last N timesteps of gridded observations (0.25° × 0.25°, multi-variable)
  ↓ Preprocessing (normalize, stack, tensor conversion)
  ↓ Model forward pass (GPU, <60s target)
  ↓ Postprocessing (denormalize, uncertainty quantification)
  ↓ Output: Next M timesteps of forecasted grid values + confidence intervals
```

**What-If simulation flow:**
```
Input: Base forecast grid + user perturbation (rainfallMod%, tempOffset°C)
  ↓ Apply perturbation to input tensor
  ↓ Re-run model forward pass (or lightweight fine-tuning head)
  ↓ Output: Modified forecast grid reflecting the scenario
```

**Anomaly detection:**
- Statistical thresholds (z-score > 2σ from climatological mean)
- ML-based anomaly classification (trained on historical extreme events)
- Rule-based alert generation with severity assignment

---

## 5. Frontend Architecture (Phase 1 Evolution)

### 5.1 Component Refactoring

Phase 0's monolithic `App.tsx` (719 lines) will be decomposed into the six distinct regions specified in [FLOW.md](./FLOW.md):

```
src/
├── components/
│   ├── dashboard/
│   │   ├── Header.tsx              ← Region selector, branding, status
│   │   ├── LayerControls.tsx       ← 3-checkbox layer toggles (LST, Rainfall, SST)
│   │   ├── SimulationSandbox.tsx   ← Rainfall mod + temp offset sliders, Run/Reset
│   │   ├── MapPanel.tsx            ← Map + overlays + legend + loading/error/empty states
│   │   ├── TimeControls.tsx        ← Scrubber, play/pause, step, date readout
│   │   └── AnomalyAlertsBar.tsx   ← Bottom alert ticker with severity chips
│   ├── ui/
│   │   ├── map/                    ← Terrae + custom heatmap components (existing)
│   │   ├── button.tsx              ← shadcn button (existing)
│   │   ├── slider.tsx              ← shadcn slider (add)
│   │   ├── checkbox.tsx            ← shadcn checkbox (add)
│   │   ├── select.tsx              ← shadcn select (add)
│   │   └── badge.tsx               ← shadcn badge (add)
│   └── theme-provider.tsx          ← Existing
├── data/
│   ├── mockData.ts                 ← Centralized mock data fixtures
│   ├── regions.ts                  ← Region list + district definitions
│   ├── alerts.ts                   ← Alert fixtures tagged by region + date
│   └── gridValues.ts              ← Pre-computed grid arrays per layer per date
├── hooks/
│   ├── useRegion.ts                ← Region selection state
│   ├── useLayers.ts                ← Layer toggle state
│   ├── useSimulation.ts            ← Sandbox slider state + simulation execution
│   ├── useTimeControls.ts          ← Playback, scrubbing, current date state
│   └── useAlerts.ts                ← Alert filtering by region + date
├── lib/
│   ├── utils.ts                    ← Existing (clsx/cn utility)
│   └── api.ts                      ← Phase 1: API client (fetch wrapper)
├── types/
│   └── index.ts                    ← Shared TypeScript interfaces
└── App.tsx                          ← Layout shell composing the 6 regions
```

### 5.2 State Management (Phase 1)

For Phase 1, migrate from raw `useState` to a lightweight state solution:

| Option | Recommendation |
|---|---|
| **Zustand** | ✅ Recommended — minimal boilerplate, TypeScript-first, works with React 19 |
| React Context + useReducer | Acceptable for small scope |
| Redux Toolkit | Overkill for this application's complexity |

**State shape (see [SCHEMA.md](./SCHEMA.md) for full type definitions):**
```typescript
interface AppState {
  region: Region
  layers: LayerState          // { lst: boolean, rainfall: boolean, sst: boolean }
  simulation: SimulationState // { rainfallMod: number, tempOffset: number, isActive: boolean }
  time: TimeState             // { currentDate: Date, isPlaying: boolean, playbackSpeed: number }
  alerts: Alert[]
  gridData: GridData | null
  ui: UIState                 // { isLoading: boolean, error: string | null }
}
```

### 5.3 Data Fetching (Phase 1)

| Concern | Approach |
|---|---|
| REST queries | TanStack Query (React Query) for caching, deduplication, background refetch |
| Real-time updates | Native WebSocket with reconnection logic |
| Optimistic UI | Immediate UI state updates with rollback on error |
| Offline resilience | Service Worker cache for static assets; no offline data requirement in Phase 1 |

---

## 6. Infrastructure & Deployment

### 6.1 Phase 0 (Current)

- **Hosting:** Static SPA — deploy `dist/` to any static host (Vercel, Netlify, GitHub Pages, Firebase Hosting)
- **No backend services required**
- **No environment variables required** (MapLibre is token-free)

### 6.2 Phase 1 (Planned)

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel (Edge) | Vite SPA, edge-cached, preview deployments per PR |
| API Server | AWS ECS (Fargate) or GCP Cloud Run | Auto-scaling FastAPI containers |
| ML Inference | AWS SageMaker or GCP Vertex AI | GPU instances for model serving |
| Database | AWS RDS (PostgreSQL + PostGIS + TimescaleDB) | Multi-AZ for availability |
| Cache | AWS ElastiCache (Redis) | Cluster mode |
| Object Storage | AWS S3 | Satellite imagery, model artifacts |
| CDN | CloudFront | GeoJSON tiles, static assets |
| Monitoring | Grafana + Prometheus | API latency, inference time, error rates |
| Logging | CloudWatch / Loki | Centralized log aggregation |

---

## 7. Performance Targets

| Metric | Phase 0 Target | Phase 1 Target |
|---|---|---|
| Initial page load (LCP) | < 2s | < 3s |
| Map interaction (pan/zoom) | 60 FPS | 60 FPS |
| Heatmap render (0.25° grid) | < 500ms | < 1s (real data) |
| Simulated loading delay | 300–600ms | N/A (real latency) |
| API response (forecast) | N/A | < 2s (p95) |
| ML inference | N/A | < 60s |
| WebSocket latency | N/A | < 500ms |
| Grid point count (0.25°) | ~3,000 nodes | ~3,000 nodes |
| Grid point count (0.12°) | ~12,000 nodes | ~12,000 nodes |

---

## 8. Security Considerations

### 8.1 Phase 0
- No authentication — intentional for hackathon demo
- No sensitive data — all data is synthetic
- No API keys exposed (MapLibre is token-free)

### 8.2 Phase 1
| Concern | Approach |
|---|---|
| Authentication | Firebase Auth or Auth0 (JWT-based) |
| Authorization | Role-based (Admin, Researcher, Viewer) — enforced at API gateway |
| API Security | Rate limiting (Redis), CORS whitelist, input validation (Pydantic) |
| Data Privacy | No PII collected; all climate data is public domain |
| Infrastructure | VPC isolation, encrypted at rest (S3, RDS), TLS everywhere |
| Secrets Management | AWS Secrets Manager / GCP Secret Manager |

---

## 9. Testing Strategy

### 9.1 Phase 0
| Type | Tool | Coverage |
|---|---|---|
| Type checking | TypeScript (`tsc --noEmit`) | Full source |
| Linting | ESLint + React plugins | Full source |
| Formatting | Prettier + Tailwind plugin | Full source |
| Manual testing | Developer-run browser testing | All user flows |

### 9.2 Phase 1 (Planned)
| Type | Tool | Coverage |
|---|---|---|
| Unit tests | Vitest | Utility functions, hooks, data transforms |
| Component tests | Vitest + Testing Library | All dashboard components |
| Integration tests | Playwright | Critical user flows (region switch, simulation, time scrub) |
| API tests | pytest + httpx | All REST endpoints |
| Load tests | k6 or Locust | API under concurrent load |
| Visual regression | Playwright screenshots | Key dashboard states |

---

## 10. Coding Guidelines

### 10.1 TypeScript
- Strict mode enabled — no `any` except where unavoidable (MapLibre GL internals)
- Prefer `interface` for object shapes, `type` for unions/intersections
- Export types from `src/types/index.ts` for cross-component sharing
- Use `as const` for literal tuples (coordinates, enum-like arrays)

### 10.2 React
- Functional components only — no class components
- Hooks for all stateful logic — extract to `src/hooks/` when reused
- Memoize expensive computations with `useMemo`; avoid premature `useCallback`
- Props interfaces named `{ComponentName}Props`
- No `defaultProps` — use parameter defaults

### 10.3 Styling
- Tailwind utility classes for all styling — no inline `style` objects except for dynamic values
- Design tokens from `index.css` — never hardcode hex colors in components
- Custom CSS only in `index.css` `@layer base` block
- Follow [DESIGN.md](./DESIGN.md) token names in all UI code

### 10.4 Map Components
- Always refer to [TERRAE.md](./TERRAE.md) for map component APIs
- Use MapLibre GL exclusively (no Mapbox access token dependency)
- Custom map layers (heatmap, choropleth) should follow the `MapHeatmap` pattern: `useMap()` hook → `useEffect` for layer management → cleanup on unmount
- GeoJSON sources must be typed with proper `FeatureCollection` interfaces

### 10.5 File Organization
- One component per file, named with PascalCase
- Co-locate component-specific types in the component file unless shared
- Hooks in `src/hooks/`, utilities in `src/lib/`, types in `src/types/`
- Mock data in `src/data/` — centralized, not scattered across components

---

## 11. Open Technical Questions

1. **District-level GeoJSON:** Should district boundaries within Kerala/Western Ghats use real Survey of India data or simplified shapes? Real data adds fidelity but increases bundle size.

2. **Map tile caching:** For Phase 1 with real data, should we pre-render raster tiles (MapTiler / TileServer GL) for forecast grids, or serve vector data and render client-side?

3. **WebSocket vs SSE:** For real-time data push, WebSocket gives bidirectional capability but adds complexity. Server-Sent Events (SSE) may suffice if client→server messages aren't needed.

4. **Offline model inference:** Should the ML model be available for client-side inference via ONNX.js/WebGPU for demo scenarios without backend connectivity?

5. **Multi-region data partitioning:** When scaling beyond the pilot region, should grid data be partitioned by region in the database, or stored as a single national grid with spatial queries?

---

*End of document.*
