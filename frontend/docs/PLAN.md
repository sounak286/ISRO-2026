# Implementation Plan
## AI-Powered Digital Twin of India's Climate — Frontend Demo

**Author:** Engineering  
**Team:** SHIV-SAKTI  
**Context:** Bharatiya Antariksh Hackathon 2026, Problem Statement 5  
**Version:** v1.0  
**Status:** Active  
**Companion docs:** [PRD.md](./PRD.md), [TRD.md](./TRD.md), [FLOW.md](./FLOW.md), [UI.md](./UI.md), [DESIGN.md](./DESIGN.md), [SCHEMA.md](./SCHEMA.md)

---

## 0. Current State Assessment

### What Exists ✅

The project has a working single-page React dashboard with:
- MapLibre GL map centered on India ([78.96, 20.59], zoom 4.6)
- Custom `MapHeatmap` component generating synthetic climate data across India
- 5 climate parameters (temp, precip, humidity, wind, solar) with heatmap rendering
- 4 configurable grid resolutions (0.12°–1.0°) and 4 color palettes
- Map controls (zoom, orientation, geolocate, fullscreen) via Terrae
- Click-to-inspect mesh nodes with popup inspector panel
- Grid spatial statistics (min/max/avg, top regions)
- Simulated telemetry log stream (1800ms interval)
- Climate advisory alerts (2 per parameter, severity-coded)
- Dark/light theme toggle (`D` shortcut, localStorage)
- GeoJSON state boundaries for all India (`india_states.geojson`)

### What's Missing ⚠️

From the PRD/FLOW specification, six core features remain unbuilt:
1. **Region Selector** — dropdown in header to switch pilot region
2. **Layer Controls** — 3-checkbox model (LST, Rainfall, SST) per PRD §4.2
3. **Time Controls** — scrubber, play/pause, step, date readout per FLOW §2.5
4. **Simulation Sandbox** — rainfall mod + temp offset sliders, Run/Reset per FLOW §2.3
5. **Anomaly Alerts Bar** — bottom ticker with severity chips, click-to-detail per FLOW §2.6
6. **Loading / Empty / Error states** — per FLOW §1.2, §6.1, §6.2

Additionally, the current implementation has structural issues:
- Monolithic `App.tsx` (719 lines) containing all state, layout, and inline components
- No centralized mock data — values are scattered/generated inline in heatmap component
- Current sidebar is a right-aligned "Mesh Overlay Controls" panel not matching the PRD's left sidebar design
- No separation of concerns (hooks, types, data fixtures are not factored out)

### Architecture Debt to Address

| Issue | Impact | Resolution Phase |
|---|---|---|
| `App.tsx` is 719 lines, doing everything | Hard to maintain, extend | Phase 1 |
| No `src/data/` directory for fixtures | Can't share mock data across components | Phase 1 |
| No `src/hooks/` directory | Stateful logic locked inside App | Phase 1 |
| No `src/types/` directory | Types defined inline, not reusable | Phase 1 |
| Dark-mode UI theme ≠ UI.md spec | Current uses DESIGN.md tokens, UI.md specifies different dark palette | Phase 2 |

---

## Phase 1 — Foundation & Decomposition

**Goal:** Extract the monolith into clean components, centralize mock data, and establish the data layer that all subsequent phases depend on.

**Estimated effort:** 1 working session

### 1.1 Create Project Structure

Create the directory scaffolding specified in TRD §5.1:

```
src/
├── data/                    ← NEW: Centralized mock data
│   ├── regions.ts           ← Region list (Western Ghats, Kerala, districts)
│   ├── layers.ts            ← Layer definitions (LST, Rainfall, SST)
│   ├── alerts.ts            ← Alert fixtures tagged by region + date
│   ├── dates.ts             ← Date range fixture (5 observed + 3 forecasted)
│   └── index.ts             ← Re-exports
├── hooks/                   ← NEW: Extracted stateful logic
│   ├── useRegion.ts         ← Region selection state + transitions
│   ├── useLayers.ts         ← Layer toggle state (3-checkbox model)
│   ├── useSimulation.ts     ← Sandbox slider state + run/reset
│   ├── useTimeControls.ts   ← Playback, scrubbing, current date
│   └── useAlerts.ts         ← Alert filtering by region + date
├── types/                   ← NEW: Shared TypeScript interfaces
│   └── index.ts             ← All interfaces from SCHEMA.md §2
├── components/
│   ├── dashboard/           ← NEW: Dashboard-specific components
│   │   ├── Header.tsx
│   │   ├── LayerControls.tsx
│   │   ├── SimulationSandbox.tsx
│   │   ├── MapPanel.tsx
│   │   ├── TimeControls.tsx
│   │   └── AlertsBar.tsx
│   ├── ui/                  ← EXISTING: shadcn + Terrae components
│   │   ├── map/             ← EXISTING
│   │   ├── button.tsx       ← EXISTING
│   │   ├── slider.tsx       ← ADD (shadcn)
│   │   ├── checkbox.tsx     ← ADD (shadcn)
│   │   ├── select.tsx       ← ADD (shadcn)
│   │   └── badge.tsx        ← ADD (shadcn)
│   └── theme-provider.tsx   ← EXISTING
├── lib/
│   └── utils.ts             ← EXISTING
└── App.tsx                  ← REFACTOR: Layout shell only
```

### 1.2 Create `src/types/index.ts`

Port all TypeScript interfaces from [SCHEMA.md](./SCHEMA.md) §2 into the shared types module:
- `Region`, `RegionList`
- `LayerId`, `LayerDefinition`, `LayerState`
- `GridPoint`, `GridData`, `GridFeature`, `GridStats`
- `SimulationParams`, `SimulationState`
- `TimeState`, `DateRange`, `DateEntry`
- `Alert`, `AlertSeverity`, `AlertChip`
- `UIState`, `AppError`, `ErrorCode`
- All enum types and constants

### 1.3 Create `src/data/` Mock Fixtures

Port the fixture definitions from [SCHEMA.md](./SCHEMA.md) §3 into the data layer:

- **`regions.ts`** — 5 regions (Western Ghats, Kerala, Kannur, Kozhikode, Wayanad) with center/zoom/bounds
- **`layers.ts`** — 3 layer definitions (INSAT LST, IMD Rainfall, Ocean SST) with color scales, ranges, units
- **`alerts.ts`** — 4+ alert fixtures tagged by `regionId` and `dateRange` for real filtering
- **`dates.ts`** — 8-day date range (5 observed + 3 forecasted), `NOW_DATE`, date entries with `type` and `hasData`

### 1.4 Extract Custom Hooks

Extract stateful logic from `App.tsx` into dedicated hooks:

- **`useRegion()`** — `{ region, setRegion, regions }` — manages selected region, exposes region list
- **`useLayers()`** — `{ layers, toggleLayer }` — manages 3-checkbox state, default: Rainfall ON
- **`useSimulation()`** — `{ simulation, setParam, run, reset }` — manages slider values, run/reset, isActive
- **`useTimeControls(dateRange)`** — `{ time, setDate, play, pause, stepForward, stepBackward, skipToStart, skipToEnd }` — manages playback
- **`useAlerts(regionId, currentDate)`** — `{ alerts, activeAlerts, dismissAlert }` — filters alerts by region + date

### 1.5 Add Required shadcn Components

Install missing UI primitives:

```bash
npx shadcn@latest add slider checkbox select badge
```

### 1.6 Refactor `App.tsx`

Transform the current 719-line monolith into a clean layout shell:
- Move all inline state logic into hooks
- Move all inline UI sections into `src/components/dashboard/` components
- `App.tsx` becomes ~80–100 lines: hook calls + layout grid + component composition
- Preserve the existing `MapHeatmap` integration — don't rewrite it, just wire it to the new hooks

**Deliverable:** The app looks and works exactly as it does today, but the code is decomposed and ready for feature work.

---

## Phase 2 — Layout Overhaul & UI.md Alignment

**Goal:** Restructure the dashboard layout to match the PRD's 6-region layout and the UI.md's dark instrument-console aesthetic.

**Estimated effort:** 1 working session

### 2.1 Dashboard Layout Grid

Implement the 6-region layout from FLOW.md §2:

```
┌────────────────────────────────────────────────────────────────┐
│                      HEADER BAR (§2.1)                          │
│  [Logo] [Title] [Region Selector ▼]             [Theme Toggle]  │
├──────────────┬─────────────────────────────────────────────────┤
│  SIDEBAR     │          MAP PANEL (§2.4)                        │
│  (§2.2+§2.3) │                                                  │
│              │  ┌────────────────────────────────────────────┐  │
│  Layer       │  │                                            │  │
│  Controls    │  │       MapLibre GL + Heatmap                │  │
│              │  │                                            │  │
│  ───────     │  │                                            │  │
│              │  │                    [Legend]                 │  │
│  Simulation  │  │                                            │  │
│  Sandbox     │  └────────────────────────────────────────────┘  │
│              ├─────────────────────────────────────────────────┤
│              │         TIME CONTROLS (§2.5)                     │
│              │  [⏮] [◀◀] [▶/⏸] [▶▶] [⏭]  ═══●════  Jun 19   │
├──────────────┴─────────────────────────────────────────────────┤
│                   ANOMALY ALERTS BAR (§2.6)                     │
│  [🔴 Extreme Heat: Zone 4B] [🟡 Monsoon Delay] [ℹ SST Anomaly] │
└────────────────────────────────────────────────────────────────┘
```

**Key changes from current layout:**
- Sidebar moves from **right** to **left** per PRD §4.2
- Sidebar splits into two sections: Layer Controls (top) + Simulation Sandbox (bottom)
- Bottom panel replaces current telemetry log + advisories with Time Controls + Alerts Bar
- Header gets the Region Selector dropdown
- Right-side "Mesh Overlay Controls" panel is removed — its functionality migrates into the new sidebar

### 2.2 CSS Architecture Update

Update `src/index.css` to include UI.md's dark console palette:
- Add `--bg-void`, `--bg-panel`, `--bg-panel-raised`, `--border-hairline`, `--accent-ember`, `--accent-signal-blue` tokens
- Add `--data-cold`, `--data-mid`, `--data-hot` scale tokens
- Add severity tokens (`--severity-info`, `--severity-warning`, `--severity-critical`)
- Map these to appropriate Tailwind `@theme inline` aliases

### 2.3 Typography Update

Add Space Grotesk (display), JetBrains Mono (data) alongside existing Inter (body):

```bash
pnpm add @fontsource-variable/space-grotesk @fontsource/jetbrains-mono
```

Apply the 3-role typography system from UI.md §3:
- Display → Space Grotesk (headers, section titles)
- Body → Inter Variable (body text, labels, descriptions)
- Data → JetBrains Mono (values, coordinates, dates, sliders)

### 2.4 Component Shell Implementation

Build the 6 dashboard components as visual shells (layout + styling, minimal logic):

| Component | Content | Interactive? |
|---|---|---|
| `Header.tsx` | Logo, title, region dropdown (wired), theme toggle | ✅ Region dropdown works |
| `LayerControls.tsx` | 3 checkboxes with icons/labels | ✅ Toggles work (show/hide layers) |
| `SimulationSandbox.tsx` | 2 sliders + Run/Reset buttons (visual only) | ⚠️ Sliders move but don't affect map yet |
| `MapPanel.tsx` | Map + heatmap + legend (migrated from current) | ✅ Existing functionality preserved |
| `TimeControls.tsx` | Transport buttons + scrubber + date readout (visual only) | ⚠️ Scrubber renders but doesn't affect data yet |
| `AlertsBar.tsx` | Alert chips from fixtures (visual only) | ⚠️ Chips render but no click-to-detail yet |

**Deliverable:** The dashboard visually matches the PRD wireframe with the dark instrument-console theme. Region selector and layer toggles are fully functional. Other controls are visually present but not yet wired to data.

---

## Phase 3 — Layer System & Data Binding

**Goal:** Replace the current 5-parameter heatmap system with the PRD's 3-layer model (LST, Rainfall, SST) and wire the layer controls to actually toggle map overlays.

**Estimated effort:** 1 working session

### 3.1 Heatmap Adaptation

Modify `MapHeatmap` to accept a `LayerId` instead of the current `ParameterId`:

| Current Parameter | Maps To | Value Range | Color Scale |
|---|---|---|---|
| `"temp"` | `"insat-lst"` (LST) | -8°C to 48°C | Blue → Red |
| `"precip"` | `"imd-rainfall"` (Rainfall) | 0mm to 4800mm | Yellow → Blue |
| *(new)* | `"ocean-sst"` (SST) | 18°C to 34°C | Blue → Red (ocean zones) |

- The existing spatial influence model for temperature becomes the LST layer
- The existing rainfall model becomes the IMD Rainfall layer
- Add an ocean-focused SST model that generates values only for coastal/oceanic grid points

### 3.2 Multi-Layer Rendering

Implement the multi-layer overlay behavior from FLOW §2.2:
- Each active layer gets its own MapLibre source + heatmap layer
- Layers are composited via opacity blending (top layer at reduced opacity)
- Per FLOW §2.2: if blending is too complex, render the most-recently-toggled-on layer on top

### 3.3 Layer Toggle Wiring

Connect `useLayers()` hook to `MapHeatmap`:
- Each checkbox toggles visibility of its corresponding heatmap layer
- Legend dynamically shows entries for active layers only
- When all layers are OFF → show empty state: "No layers selected. Toggle a layer to view climate data."

### 3.4 Region Switching

Wire `useRegion()` to the map:
- On region change → simulate loading delay (300–600ms) → `map.flyTo()` to region center/zoom/bounds
- Heatmap re-renders for the new region's bounding box
- Alerts bar updates to show alerts scoped to the new region

**Deliverable:** Layer toggles fully control what appears on the map. Region selector smoothly transitions the map view. Empty state renders when all layers are off.

---

## Phase 4 — Time Controls

**Goal:** Build the full time navigation system from FLOW §2.5 — scrubber, play/pause, step, date readout, observed vs. forecasted visual distinction.

**Estimated effort:** 1 working session

### 4.1 Time Scrubber Component

Build the `TimeControls` component with full interactivity:
- **Scrubber track:** Horizontal slider spanning the mock date range (8 days)
- **Visual split:** Solid line for observed dates (past), dashed/dimmed for forecasted dates (future)
- **"Now" indicator:** Vertical tick mark at the observed/forecasted boundary
- **Date readout:** Current date displayed in JetBrains Mono (data font)
- **Transport buttons:** ⏮ Skip-to-start, ◀◀ Step-back, ▶/⏸ Play/Pause, ▶▶ Step-forward, ⏭ Skip-to-end

### 4.2 Time → Data Binding

Wire the time state to the heatmap data generator:
- Each date in the mock range generates slightly different grid values (use date as PRNG seed offset)
- Scrubbing the timeline re-renders the heatmap with the date's values
- Debounce scrubber drag at 150ms per FLOW §2.5

### 4.3 Playback Engine

Implement the auto-advance playback logic:
- Play → advance scrubber by 1 day every 1000ms
- Map + alerts update at each step
- Auto-stop at the last date (no looping per FLOW §2.5)
- Pause → halt immediately at current position

### 4.4 Button Disable Logic

Per FLOW §4 button inventory:
- Skip-to-start / Step-back → disabled when at first date
- Skip-to-end / Step-forward → disabled when at last date
- Play/Pause → disabled during loading states

**Deliverable:** Full time navigation works — scrubbing, stepping, auto-playing through the date range with the heatmap updating in sync.

---

## Phase 5 — Simulation Sandbox

**Goal:** Build the "What-If" simulation system from FLOW §2.3 — rainfall/temp sliders that modify the map when "Run Simulation" is clicked.

**Estimated effort:** 1 working session

### 5.1 Slider Wiring

Connect the Simulation Sandbox sliders to `useSimulation()`:
- **Rainfall Mod:** -50% to +50%, step 5%, default 0%
- **Temp Offset:** -2°C to +5°C, step 0.5°C, default 0°C
- Live value labels update during drag (JetBrains Mono font)
- Dragging does NOT update the map — only "Run Simulation" does

### 5.2 Run Simulation Flow

1. User adjusts sliders → "Run Simulation" button enables (disabled when both at default per FLOW §2.3)
2. Click "Run Simulation" → loading state on map panel (400–600ms delay), sidebar sliders stay interactive, Run button disables
3. After delay → apply transforms to current grid data:
   - Rainfall: `newValue = baseValue * (1 + rainfallMod / 100)`, clamped at 0 minimum
   - Temperature: `newValue = baseValue + tempOffset`
4. Map re-renders with modified values
5. "What-If Scenario" badge appears on map panel

### 5.3 Reset to Baseline

1. Both sliders snap to default (0%, 0°C)
2. Map immediately reverts to baseline data (no loading delay — instant, per FLOW §2.3)
3. "What-If Scenario" badge disappears
4. "Run Simulation" button returns to disabled

### 5.4 Simulation × Time Interaction

Per FLOW §2.5: if a simulation is active and the user scrubs time, the simulation transform re-applies to the new date's baseline values. Simulation stays "on" until the user clicks "Reset to Baseline."

**Deliverable:** Full what-if simulation loop works — adjust sliders, run, see modified map, reset to baseline. Simulation persists across time navigation.

---

## Phase 6 — Anomaly Alerts Bar

**Goal:** Build the full alerts system from FLOW §2.6 — bottom ticker bar with severity-coded chips, click-to-detail popovers, and dynamic filtering by region + date.

**Estimated effort:** 1 working session

### 6.1 Alert Chips

Render the `AlertsBar` component as a fixed bottom bar:
- Each alert renders as a chip with: severity icon (colored), title text
- Severity colors per UI.md §2: info = `--severity-info` (#3AA0FF), warning = `--severity-warning` (#F2A93B), critical = `--severity-critical` (#E23B3B)
- For 1–2 alerts: static row
- For ≥3 alerts: horizontal auto-scroll ticker (per FLOW §2.6)

### 6.2 Dynamic Filtering

Wire `useAlerts(regionId, currentDate)`:
- Filter mock alerts by `regionId` match AND `currentDate` within alert's `dateRange`
- On region change → alerts re-filter
- On time scrub → alerts re-filter
- If no alerts match → show empty state: "No active alerts for this region and date."

### 6.3 Click-to-Detail Popover

On chip click → open a popover/modal with:
- Full alert description
- Severity badge
- Affected zone name
- "View on map" button → `map.flyTo()` to alert's coordinates with zoom-in

Close via: close button, click-outside, or Escape key. Closing returns to the exact prior dashboard state.

**Deliverable:** Full alerts system with live filtering, severity styling, ticker behavior, and click-to-detail with "View on map" action.

---

## Phase 7 — States, Polish & Demo Readiness

**Goal:** Implement all transient states (loading, error, empty), add the signature radar-sweep animation, polish interactions, and ensure the app is demo-stable.

**Estimated effort:** 1–2 working sessions

### 7.1 Loading States (FLOW §1.2)

Implement the 3 loading scenarios:
1. **Initial load** — App shell renders immediately, map panel shows spinner + "Loading climate data..." (300–600ms simulated delay)
2. **Region switch** — Map panel spinner, sidebar controls disabled (opacity 50%, cursor not-allowed), dropdown disabled
3. **Run Simulation** — Map panel spinner only, sidebar sliders stay interactive, Run button disabled

### 7.2 Error States (FLOW §6.1)

Implement the error display:
- Map panel shows centered error card: ⚠ icon + "Unable to load climate data for this region." + "Retry" button
- Sidebar controls remain interactive (user can switch to a different region)
- Alerts bar shows empty state during map error
- Guard against missing/malformed fixtures (defensive coding for live demo)

### 7.3 Empty States (FLOW §6.2)

Implement all empty states:
- **No layers selected:** Map panel → "No layers selected — toggle a layer on the left to view climate data."
- **No data for date:** Map panel → "No data available for [date]. Try a different date."
- **No active alerts:** Alerts bar → gray icon + "No active alerts for this region and date."

### 7.4 Radar Sweep Animation (UI.md §0)

Implement the signature "live-scan pulse" — the map's active data layer emits a faint radial sweep:
- 6–8 second cycle
- Subtle, barely visible — indicates "live twin, continuously refreshed"
- CSS/Canvas animation overlaid on the map panel
- Should be the **only** auto-animating element in the interface

### 7.5 Keyboard & Focus Polish

Ensure per FLOW §0 (accessibility baseline):
- All interactive elements keyboard-reachable
- Visible focus states (using `--accent-signal-blue` focus ring)
- No keyboard traps
- Escape closes all modals/popovers

### 7.6 Demo Stability Audit

Final pass to ensure zero crashes during a live walkthrough:
- Test all 6 core interactions (region switch, layer toggle, time scrub, playback, simulation, alert click)
- Test edge cases: all layers off, extreme slider values, rapid interactions
- Test both light and dark themes
- Verify no console errors or warnings
- Verify no layout overflow/collapse at common demo resolutions (1920×1080, 1440×900)

**Deliverable:** The app is fully demo-ready — all PRD features functional, all states handled, visually polished, zero crashes.

---

## Phase Summary

| Phase | Focus | Key Deliverable | Depends On |
|---|---|---|---|
| **1** | Foundation & Decomposition | Clean architecture, mock data, extracted hooks | — |
| **2** | Layout & UI.md Alignment | 6-region dashboard layout, dark console theme | Phase 1 |
| **3** | Layer System & Data Binding | 3-layer toggles controlling map overlays | Phase 2 |
| **4** | Time Controls | Full time navigation with playback | Phase 3 |
| **5** | Simulation Sandbox | What-if sliders modifying map data | Phase 3 |
| **6** | Anomaly Alerts Bar | Severity ticker with click-to-detail | Phase 3 |
| **7** | States, Polish & Demo Readiness | Loading/error/empty states, radar sweep, stability | Phases 4+5+6 |

> **Phases 4, 5, and 6 are independent of each other** and can be worked on in parallel or in any order. They all depend on Phase 3 (layer system) being complete. Phase 7 is the final integration pass that depends on everything else being in place.

---

## Critical Path

The minimum viable demo path (if time is extremely limited):

```
Phase 1 → Phase 2 → Phase 3 → Phase 7 (minimal)
```

This gives: decomposed code + correct layout + working layer toggles + region selector + loading states. The time controls, simulation sandbox, and alerts bar are the most impactful additions but can be shipped incrementally.

The **full demo path** (recommended):

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
```

---

## File Impact Matrix

| File | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | Phase 7 |
|---|---|---|---|---|---|---|---|
| `App.tsx` | ✏️ Refactor | ✏️ Layout | ✏️ Wire | — | — | — | — |
| `src/types/index.ts` | ✨ New | — | ✏️ | ✏️ | — | — | — |
| `src/data/*.ts` | ✨ New | — | ✏️ | ✏️ | — | ✏️ | — |
| `src/hooks/*.ts` | ✨ New | — | ✏️ | ✏️ | ✏️ | ✏️ | — |
| `src/index.css` | — | ✏️ Major | — | ✏️ | — | ✏️ | ✏️ |
| `Header.tsx` | — | ✨ New | ✏️ Wire | — | — | — | ✏️ |
| `LayerControls.tsx` | — | ✨ New | ✏️ Wire | — | — | — | ✏️ |
| `SimulationSandbox.tsx` | — | ✨ New | — | — | ✏️ Wire | — | ✏️ |
| `MapPanel.tsx` | — | ✨ New | ✏️ Wire | ✏️ | ✏️ | — | ✏️ |
| `TimeControls.tsx` | — | ✨ New | — | ✏️ Wire | — | — | ✏️ |
| `AlertsBar.tsx` | — | ✨ New | — | — | — | ✏️ Wire | ✏️ |
| `heatmap.tsx` | — | — | ✏️ Adapt | ✏️ | ✏️ | — | — |

Legend: ✨ = Created, ✏️ = Modified, — = Untouched

---

*End of document.*
