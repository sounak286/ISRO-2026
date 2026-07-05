# App Flow Document
## AI-Powered Digital Twin of India's Climate — Frontend (Phase 0 Dummy)

**Author:** UX Strategy (as requested)
**Companion docs:** PRD_AI_Digital_Twin_Frontend.md, TRD_AI_Digital_Twin.md
**Version:** v1.0
**Audience:** AI coding agent / developer building the Phase 0 dummy frontend
**Scope:** This app is a **single-screen dashboard application**. There is no multi-page navigation in v1 — all interaction happens within one persistent layout. This document specifies every region of that layout as if it were a "screen," plus all transient states (loading, error, empty) layered on top.

---

## 0. Global Conventions

These rules apply across the whole app unless a section overrides them.

- **Data source:** All data is mocked. Use a local fixture file (e.g. `mockData.js` / `mockData.json`) containing: region list, district boundaries (simplified), grid values per layer per date, alert list. No network calls.
- **Persistence:** None. Refreshing the page resets all state to defaults (region = Western Ghats, all layers except LST off... see Section 2.2 for exact defaults). This is intentional for Phase 0 — do not add localStorage.
- **Loading simulation:** Since there's no real network call, simulate a brief artificial delay (300–600ms) when switching regions or running a simulation, so the loading state is visible and the app doesn't feel like a static image. Use a `setTimeout` or equivalent, not a real async fetch.
- **Error simulation:** Because there's no real backend, true errors can't occur from network failure. Build error states anyway (see Section 6) so they exist as designed UI states — they can be triggered by malformed/missing mock data (e.g. a region with no fixture entry) so the states are demonstrable, not dead code.
- **Color semantics (must be consistent everywhere):**
  - Temperature scale: blue (cold) → white/yellow (mid) → red (hot)
  - Rainfall scale: light blue (low) → dark blue (high)
  - Alert severity: gray/blue = info, amber/orange = warning, red = critical
- **Accessibility baseline:** All interactive elements (buttons, sliders, toggles, dropdown) must be keyboard-reachable and have visible focus states. Not a deep WCAG audit (per TRD, out of scope), but no keyboard traps or unlabeled controls.

---

## 1. App Shell

### 1.1 Initial Load

**Trigger:** User opens the app URL.

**Sequence:**
1. App shell renders immediately (header bar, empty sidebar containers, empty map container) — this prevents a blank white screen.
2. A brief loading state (see 1.2) shows inside the map panel and sidebar while mock data is "fetched" (simulated delay, ~400ms).
3. Once mock data resolves, the app renders in its **default state**:
   - Region: **Western Ghats** (pre-selected)
   - Layers active: **IMD Rainfall ON**, INSAT LST OFF, Ocean SST OFF (matches mock UI reference — Rainfall is the only checked layer by default)
   - Simulation sandbox: Rainfall Mod = 0%, Temp Offset = +1.5°C is NOT correct — default should be neutral. **Default: Rainfall Mod = 0%, Temp Offset = 0°C.**
   - Time control: positioned at "Now" (the most recent observed date in the mock dataset), playback paused
   - Anomaly alerts bar: shows whatever mock alerts are flagged as currently active

### 1.2 Global Loading State

**When shown:** Initial load; region switch; "Run Simulation" action.

**Behavior:**
- Map panel: replace map content with a centered spinner + text "Loading climate data..."
- Sidebar controls: disable all inputs (dropdown, checkboxes, sliders, buttons) — visually indicate disabled (reduced opacity ~50%, cursor: not-allowed)
- Time controls: disabled during load
- Do NOT show a full-page blocking overlay — only the affected regions (map + sidebar) show loading; the header stays interactive so the user isn't fully locked out (they can still see the region dropdown even if they can't act on it yet mid-load... actually: disable the dropdown too during its own load to prevent double-submission)

**Duration:** 300–600ms simulated. No skeleton screens required for v1 — a spinner + label is sufficient.

---

## 2. Screen: Main Dashboard

This is the only screen. It's composed of six regions, detailed individually below, followed by cross-region interactions.

### 2.1 Region: Header Bar

**Layout:** Fixed top bar, full width.

**Elements:**
| Element | Type | Behavior |
|---|---|---|
| App logo/icon | Static image/icon | No action (decorative) |
| Title: "AI DIGITAL TWIN OF INDIA'S CLIMATE" | Static text | No action |
| Region selector | Dropdown | See 2.1.1 |
| User/profile icon (decorative only, per mock UI) | Static icon | **No action in v1** — do not wire to auth (per TRD, Phase 0 has no auth). Clicking it does nothing, or optionally shows a disabled tooltip "Not available in this demo." |

#### 2.1.1 Region Selector — Detailed Behavior

- **Default value:** "Western Ghats"
- **Options (Phase 0 mock list):** Western Ghats, Kerala (full state), and optionally 2–3 named districts within Kerala if district-level mock data exists (e.g., Kannur, Kozhikode, Wayanad) — only include options that have corresponding mock data entries. Do not show a region in the dropdown unless a fixture exists for it (this prevents the empty-state bug of "selected a region with no data").
- **On change:**
  1. Dropdown closes, selected value updates immediately in the UI (optimistic).
  2. Trigger Global Loading State (Section 1.2) scoped to map + layer/sandbox panels.
  3. After simulated delay, map re-renders with the new region's mock grid data, using currently active layer(s).
  4. Time control range updates if the new region has a different available date range (unlikely in mock data, but code defensively).
  5. Anomaly alerts bar updates to show alerts scoped to the new region (may result in Empty State, see 2.6.3).
- **Error case:** If a region is somehow selected with no matching fixture (shouldn't happen given the option-filtering rule above, but guard against it): show inline error in the map panel — see Section 6.1.

---

### 2.2 Region: Layer Controls (Sidebar, top section)

**Layout:** Left sidebar, upper block, titled "LAYER CONTROLS."

**Elements:** Three checkboxes, each with an icon and label:
1. INSAT LST (Land Surface Temperature)
2. IMD Rainfall
3. Ocean SST (Sea Surface Temperature)

**Default state:** IMD Rainfall = checked; INSAT LST = unchecked; Ocean SST = unchecked.

**Behavior:**
- **Multi-select allowed:** More than one layer can be active simultaneously. When multiple are active, render them as stacked/blended overlays on the map (or, if blending is too complex for v1, render the most-recently-toggled-on layer on top — document this as the v1 simplification rather than leaving it ambiguous).
- **Toggling a checkbox ON:**
  1. Checkbox fills/checks immediately (optimistic UI, no loading state needed for layer toggles — this should feel instant since it's just a client-side render swap of already-loaded mock data).
  2. Map panel adds that layer's heatmap overlay and legend entry.
- **Toggling a checkbox OFF:**
  1. Checkbox unchecks immediately.
  2. Map panel removes that layer's overlay and legend entry.
- **All layers off (edge case):** If a user unchecks all three, the map panel shows an **Empty State** (Section 6.2) — a message like "No layers selected. Toggle a layer to view climate data." instead of a blank map.
- **Legend:** Each active layer shows a corresponding gradient legend in the map panel (bottom-left, per mock UI), labeled with the variable name and unit (e.g., "Temperature (°C)", "Rainfall (mm)").

---

### 2.3 Region: Simulation Sandbox (Sidebar, lower section)

**Layout:** Left sidebar, below Layer Controls, titled "SIMULATION SANDBOX."

**Elements:**
1. **Rainfall Mod slider** — range -50% to +50%, default 0%, step 5%
2. **Temp Offset slider** — range -2°C to +5°C, default 0°C, step 0.5°C
3. **Run Simulation button** (primary action button)
4. **Reset to Baseline button** (secondary/text action)

**Behavior:**

- **Slider drag:**
  - Value label updates live as the user drags (e.g., "Rainfall Mod: +20%").
  - Dragging a slider does **NOT** immediately update the map — the map only updates when "Run Simulation" is clicked. This matches the mock UI's explicit "Run Simulation" button and avoids implying real-time inference.
  - If both sliders are at their default (0%, 0°C), the "Run Simulation" button should be visually disabled (nothing to simulate) — re-enable as soon as either slider moves off default.

- **"Run Simulation" click:**
  1. Trigger Global Loading State scoped to the map panel only (sidebar sliders stay interactive so the user can immediately adjust further — but disable the Run button itself during the simulated delay to prevent double-submission).
  2. After simulated delay (400–600ms — slightly longer than a plain layer toggle, to sell the idea of "computing" a scenario), map re-renders showing the modified grid: apply the rainfall % and temp offset as a simple mathematical transform to the currently active layer's base values (e.g., `newValue = baseValue * (1 + rainfallMod/100)` for rainfall; `newValue = baseValue + tempOffset` for temperature).
  3. A visual indicator appears confirming simulation mode is active — e.g., a small badge near the map title: "Showing: What-If Scenario" with a way to tell it apart from baseline (per mock UI's "Baseline vs. What-if Scenario" framing). Suggested: badge + subtle border color change on the map panel, or a small comparison toggle if time allows ("Baseline | What-If").
  4. If applicable, the legend updates to reflect the new value range.

- **"Reset to Baseline" click:**
  1. Both sliders animate/snap back to default (0%, 0°C).
  2. Map immediately reverts to baseline data (no loading state needed — this can be instant since it's just discarding the simulation overlay and showing already-loaded baseline data).
  3. "Showing: What-If Scenario" badge disappears.
  4. "Run Simulation" button returns to disabled state (since sliders are back at default).

- **Edge case — extreme values:** At slider extremes (-50% rainfall or +5°C), ensure the mock transform doesn't produce visually broken output (e.g., negative rainfall values). Clamp transformed values at zero minimum for rainfall.

---

### 2.4 Region: Map Visualization Panel

**Layout:** Main center panel, largest area of the screen.

**Elements:**
- Map/grid rendering (Leaflet/MapLibre or stylized SVG/Canvas grid — implementation detail per TRD; either is acceptable)
- Zoom controls (+/-), pan (drag)
- Legend (bottom-left overlay, per mock UI)
- Compass/orientation indicator (decorative, matches mock UI's "N" compass icon) — optional, no functional requirement
- Tooltip on hover/click over a grid cell (see below)

**Behavior:**

- **Hover/click on a grid cell (if using a real map or an interactive grid):**
  - Show a small tooltip/popup with: cell's approximate location name (if available in mock data) or coordinates, and the value(s) for all currently active layers at that point (e.g., "Rainfall: 120mm, LST: 31°C").
  - If no data exists for that exact point (sparse mock grid), show "No data at this location" in the tooltip rather than a blank/broken popup.

- **Zoom/pan:** Standard map interaction if a real map library is used. If using a stylized static grid (no real map), zoom/pan controls can be omitted or made non-functional with a disabled/tooltip state — **do not leave them visually present but silently broken**; either implement them or don't render them.

- **Loading:** See Section 1.2 (global loading state covers this panel).

- **Empty state:** See Section 6.2 (no layers selected).

- **Error state:** See Section 6.1 (data fetch/render failure).

---

### 2.5 Region: Time Controls

**Layout:** Horizontal bar below the map panel, per mock UI.

**Elements:**
1. Skip-to-start button (⏮)
2. Play/Pause toggle button (▶ / ⏸)
3. Skip-to-end button (⏭)
4. Scrubber/slider (draggable timeline)
5. Current date/time readout (e.g., "Now: 2026-06-20")
6. Step-back / step-forward buttons (◀◀ / ▶▶ per mock UI's outer arrows) — these step by one day; distinguish from skip-to-start/end which jump to timeline extremes

**Behavior:**

- **Default position:** Scrubber starts at "Now" (last observed date in mock dataset), where "Now" divides observed (past) dates from forecasted (future) dates. Visually distinguish the two ranges on the scrubber track (e.g., solid line for observed, dashed for forecasted).

- **Dragging the scrubber:**
  - Date readout updates live during drag.
  - Map updates to show that date's mock grid values **after drag release** (not on every pixel of movement, to avoid excessive re-renders) — debounce so the map updates ~150ms after the user stops dragging.
  - No loading spinner needed for scrubbing (treat as instant, since all mock data for the date range is already loaded client-side).

- **Play button click:**
  1. Button icon switches to Pause.
  2. Scrubber begins advancing automatically, one step (day) at a time, at a fixed interval (e.g., 1 second per day).
  3. Map updates at each step.
  4. When playback reaches the end of the available date range, it **auto-stops** (button reverts to Play icon) — do not loop by default.

- **Pause button click:** Playback halts immediately at the current position; button reverts to Play icon.

- **Skip-to-start / Skip-to-end:** Jump scrubber immediately to the first/last available date; pauses playback if it was running; map updates immediately (no loading state).

- **Step-back / step-forward:** Move scrubber by exactly one day in that direction; if already at an extreme, the button becomes disabled (visually greyed) rather than wrapping around.

- **Interaction with What-If Sandbox:** If a what-if simulation is currently active (per 2.3) and the user changes the time position, the simulation transform should re-apply to the new date's baseline values (i.e., what-if stays "on" across time navigation until the user clicks Reset to Baseline). Document this so the coding agent doesn't reset simulation state on every time-scrub.

---

### 2.6 Region: Anomaly Alerts Bar

**Layout:** Fixed bottom bar, full width, per mock UI.

**Elements:**
- One or more alert "chips"/entries, each with: severity icon, alert title, short description
- If more alerts exist than fit on screen, this becomes a horizontally scrolling ticker (per mock UI's "///" ticker styling) or a "+N more" affordance — pick one and implement consistently; recommended: horizontal auto-scroll ticker for ≥3 alerts, static row for 1–2.

**Behavior:**

- **On region/date change:** Alert list filters to whatever mock alerts are tagged as relevant to the currently selected region and currently selected date. (Mock data should tag each alert with a region and a date/date-range so this filtering is real, not decorative.)

- **Click on an alert chip:** Opens a small detail popover/modal with: full alert description, severity, affected zone, and (optionally) a "View on map" action that pans/zooms the map panel to the relevant area if using a real map library. If using a stylized grid, "View on map" can simply highlight the corresponding zone on the grid.

- **Severity styling:**
  - Info (gray/blue): non-critical advisories
  - Warning (amber/orange): e.g., "Monsoon Delay Risk: Moderate"
  - Critical (red): e.g., "Extreme Heat Warning: Zone 4B"

#### 2.6.3 Empty State — No Active Alerts

- If the filtered alert list for the current region/date is empty, do not show a blank bar. Show a single neutral entry: a gray/muted icon + text "No active alerts for this region and date." This keeps the bar's height/layout consistent rather than having it disappear and reflow the page.

---

## 3. Navigation Paths

Because this is a single-screen app, there is no multi-page routing in v1. All "navigation" is state change within the dashboard:

```
[App Load] 
   → [Default Dashboard State: Western Ghats, Rainfall layer, Now, no simulation]
        ├─→ [Change Region] → [Loading] → [Dashboard State for new region]
        ├─→ [Toggle Layer(s)] → [Dashboard State with updated overlays] (or Empty State if all off)
        ├─→ [Adjust Sandbox Sliders + Run Simulation] → [Loading] → [Dashboard State: What-If active]
        │        └─→ [Reset to Baseline] → [Dashboard State: baseline restored]
        ├─→ [Scrub/Play Time Controls] → [Dashboard State for selected date]
        └─→ [Click Alert Chip] → [Alert Detail Popover] → [Close] → [back to Dashboard State]
```

**Modals/popovers** (alert detail, grid-cell tooltip) are overlays on top of the single dashboard state — closing them (via close button, click-outside, or Escape key) returns to the exact prior state without resetting any other control.

**No deep-linking required for v1** (per PRD's MVP scope) — the app does not need to support URL params like `?region=kerala&date=2026-06-20`. This can be called out as a Phase 1 nice-to-have but is not required now.

---

## 4. Button Inventory (Quick Reference for the Coding Agent)

| Button/Control | Location | Primary Action | Disabled When |
|---|---|---|---|
| Region dropdown | Header | Switch region | During loading |
| Layer checkboxes (×3) | Sidebar | Toggle map overlay | During loading |
| Rainfall Mod slider | Sidebar | Set pending simulation value | During loading |
| Temp Offset slider | Sidebar | Set pending simulation value | During loading |
| Run Simulation | Sidebar | Apply sandbox values to map | Both sliders at default; during loading |
| Reset to Baseline | Sidebar | Clear simulation, revert map | No active simulation |
| Zoom +/- | Map panel | Zoom map | N/A (always available if real map used) |
| Skip-to-start | Time controls | Jump to first date | Already at first date |
| Step-back | Time controls | Move back 1 day | Already at first date |
| Play/Pause | Time controls | Start/stop auto-advance | During loading |
| Step-forward | Time controls | Move forward 1 day | Already at last date |
| Skip-to-end | Time controls | Jump to last date | Already at last date |
| Alert chip | Alerts bar | Open detail popover | N/A |

---

## 5. Success States

- **Region switch success:** New region's map, layers, and alerts render fully within the loading window; no flash of unstyled/empty content.
- **Layer toggle success:** Overlay + legend appear/disappear in sync, no lag between checkbox state and map state.
- **Simulation success:** Map visibly changes (color shift) to reflect the applied rainfall/temp modifiers, badge confirms "What-If Scenario" mode, values are internally consistent (e.g., a +50% rainfall mod visibly deepens the blue tones, not lightens them).
- **Time navigation success:** Map and alerts bar both update in lockstep with the selected date — no state where the map shows one date's data while alerts show another's.
- **Alert interaction success:** Clicking a chip reliably opens its detail view; closing it reliably returns to the unmodified dashboard state.

---

## 6. Error States

### 6.1 Data Load/Render Error

**Trigger condition (Phase 0):** A selected region has no matching fixture, or a fixture is malformed (defensive coding scenario — should not occur in normal use given the dropdown is pre-filtered, but must be handled).

**Behavior:**
- Map panel shows a centered error card: icon (⚠) + "Unable to load climate data for this region." + a "Retry" button.
- "Retry" re-attempts the simulated data load (same mechanism as initial load).
- Sidebar controls remain interactive (user can switch to a different, working region) rather than being locked by the error.
- Alerts bar shows its Empty State (6.2.3-style) rather than erroring separately, since alerts are secondary to the map failing.

### 6.2 Empty States

**6.2.1 — No layers selected:** See Section 2.2. Map panel shows centered message + icon: "No layers selected — toggle a layer on the left to view climate data."

**6.2.2 — No mock data for selected date (edge case, e.g., a gap in the fixture):** Map shows: "No data available for [date]. Try a different date." with the time controls still active so the user can move off that date.

**6.2.3 — No active alerts:** See Section 2.6.3.

**6.2.4 — Region with no districts (if district drill-down is implemented):** If a region option has no sub-district breakdown in mock data, simply don't show a district-level toggle/breadcrumb for it — don't show an empty dropdown.

---

## 7. Notes for the Coding Agent

- Treat Section 2 as the source of truth for component boundaries: Header, Layer Controls, Simulation Sandbox, Map Panel, Time Controls, Alerts Bar are six distinct components with the interaction contracts defined above.
- All "loading" and "error" behavior should be implemented as real UI states (not TODOs) even though the underlying data is mocked — per PRD Section 6 ("Interaction completeness: nothing is a dead button").
- Where this document says "instant, no loading state," do not add an artificial delay — reserve simulated delays for the three cases explicitly called out (initial load, region switch, run simulation) so the app doesn't feel artificially slow.
- Do not implement anything listed as out-of-scope in the PRD (Section 8 of that document) even if it would be a natural extension of a flow described here — e.g., do not add a login gate before the dashboard loads, do not wire the alert chips to a real notification service.

---

*End of document.*