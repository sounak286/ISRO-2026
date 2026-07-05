# UI/UX Design Brief
## AI-Powered Digital Twin of India's Climate — Frontend (Phase 0 Dummy)

**Author:** UI/UX Design (as requested)
**Companion docs:** PRD_AI_Digital_Twin_Frontend.md, TRD_AI_Digital_Twin.md, AppFlow_AI_Digital_Twin.md
**Version:** v1.0
**Audience:** AI app builder / frontend developer

---

## 0. Design Thesis

This is a **mission-control instrument, not a marketing dashboard.** The subject is a live satellite-and-sensor-fed model of a national territory's climate — the closest real-world analogue is a satellite ops room or a seismic/weather-monitoring console: dark, data-dense, quietly serious, built for someone who needs to read a signal fast, not be sold something. The existing pitch-deck mock UI already establishes a dark canvas with an ISRO-orange accent — this brief formalizes that direction rather than replacing it, and pushes it further so it reads as a deliberately designed instrument rather than "a dark-mode admin template."

**Signature element:** A **live-scan pulse** — the map's currently active data layer periodically emits a faint radial sweep (like a radar/satellite pass), timed to a slow 6–8 second cycle. It's the one animated flourish in an otherwise still, disciplined interface, and it directly encodes the product's core idea: this isn't a static map, it's a twin being continuously refreshed by real satellite passes. Nothing else in the UI should move on its own.

---

## 1. Design Style

- **Category:** Dark-mode scientific/operational console — closer to flight-deck telemetry or a seismograph reading room than a SaaS dashboard.
- **Mood words:** Precise, calm, high-signal, quietly national (ISRO heritage without being flag-wavy), trustworthy under pressure (this UI needs to work when someone is reading a flood warning, not just browsing).
- **What to avoid:** Glassmorphism, heavy drop shadows, playful rounded illustration, marketing-site gradients, generic "AI product" purple/violet gradients. Avoid anything that looks decorative rather than instrumented.

---

## 2. Color Palette

Named tokens — use exactly these, do not substitute nearby "similar" shades:

| Token | Hex | Usage |
|---|---|---|
| `--bg-void` | `#0A0D12` | App background — deep space-black, not pure #000 |
| `--bg-panel` | `#12161D` | Sidebar, header, alert bar surface |
| `--bg-panel-raised` | `#181D26` | Cards, popovers, dropdown menus |
| `--border-hairline` | `#262C36` | Dividers, panel borders — always 1px, never heavier |
| `--text-primary` | `#EAEDF2` | Headlines, primary labels |
| `--text-secondary` | `#8A93A3` | Captions, helper text, disabled labels |
| `--accent-ember` | `#FF6A2B` | ISRO-derived primary accent — primary buttons, active states, selected region, brand mark |
| `--accent-signal-blue` | `#3AA0FF` | Interactive/informational accent — links, focus rings, info-severity alerts, "observed data" markers |
| `--data-cold` | `#2447B8` | Rainfall/temperature scale — cold end |
| `--data-mid` | `#F2C245` | Scale midpoint (used sparingly, mainly as a gradient stop) |
| `--data-hot` | `#E23B3B` | Temperature scale — hot end / critical alerts |
| `--severity-warning` | `#F2A93B` | Warning-level alerts |
| `--severity-critical` | `#E23B3B` | Critical-level alerts (shared with data-hot — intentional, reinforces "hot = danger") |
| `--severity-info` | `#3AA0FF` | Info-level alerts (shared with signal-blue) |

**Palette logic:** One warm accent (ember, ISRO's own orange) for anything the product itself is doing or highlighting; one cool accent (signal blue) for anything the *user* is interacting with or that represents verified/observed data. The hot/cold data-scale colors are never used for chrome (buttons, nav) — they exist only inside the map and legends, so the eye instantly knows "this red is a temperature reading" not "this red is a UI element."

**Contrast rule:** Text on `--bg-void`/`--bg-panel` must meet at least 4.5:1 contrast. `--text-secondary` on `--bg-panel` should be checked against this — if it falls short, lighten it, don't relax the rule.

---

## 3. Typography

Three-role system — do not default to a single system-UI stack:

| Role | Typeface | Reasoning |
|---|---|---|
| **Display** (app title, section headers) | **Space Grotesk** (or equivalent geometric grotesk with a technical feel) | Has enough personality to feel "designed" without being decorative; reads as instrumentation, not corporate branding |
| **Body/UI** (labels, controls, descriptions) | **IBM Plex Sans** | Neutral, highly legible at small sizes, has a quiet technical pedigree (designed for IBM's own instrumentation/dashboards) — fits the mission-control register |
| **Data/Mono** (coordinates, timestamps, numeric readouts, alert codes) | **IBM Plex Mono** (or JetBrains Mono) | Monospacing for anything numeric signals "this is a live reading," and tabular alignment matters for values like "+20%," "31.4°C" |

**Type scale (rem, base 16px):**

| Token | Size | Weight | Usage |
|---|---|---|---|
| `--text-display` | 1.75rem | 600 | App title in header |
| `--text-h2` | 1.125rem | 600 | Panel titles ("LAYER CONTROLS," "SIMULATION SANDBOX") |
| `--text-body` | 0.9375rem | 400 | Standard labels, alert descriptions |
| `--text-caption` | 0.8125rem | 400 | Helper text, legend labels |
| `--text-data` | 0.875rem | 500 (mono) | Numeric readouts, dates, coordinates |

**Casing rule:** Panel titles use small-caps or uppercase with `letter-spacing: 0.05em` (per the mock UI's "LAYER CONTROLS" styling) — this is one of the few deliberately "technical readout" typographic gestures in the system, so keep it consistent everywhere a panel is titled, and nowhere else (don't uppercase body copy or buttons).

---

## 4. Layout Direction

**Grid:** 12-column layout at desktop widths, with the app shell split into three structural zones:

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (full width, 64px height)                            │
├───────────────┬─────────────────────────────────────────────┤
│               │                                               │
│   SIDEBAR      │              MAP PANEL                        │
│   (280px       │              (fluid, fills remaining width)  │
│   fixed)       │                                               │
│               │                                               │
│               ├─────────────────────────────────────────────┤
│               │         TIME CONTROLS (full width of map)     │
├───────────────┴─────────────────────────────────────────────┤
│  ANOMALY ALERTS BAR (full width, 48–56px height)              │
└─────────────────────────────────────────────────────────────┘
```

- **Sidebar:** Fixed 280px width on desktop. Two stacked panels inside (Layer Controls, Simulation Sandbox) separated by a hairline divider, not a gap — this reinforces "one instrument panel," not "two separate cards."
- **Map panel:** No padding between it and its container edges — the map should feel like it fills the "screen" of the instrument, with controls (zoom, legend, compass) floating on top as overlays with their own small raised-panel backgrounds, not the map being inset inside a card.
- **Whitespace discipline:** This is a data-dense interface; whitespace should be used to *group* related controls (8px within a control cluster, 24px between clusters), not to create airy marketing-site breathing room. Err tighter than a typical SaaS product.

---

## 5. Component Style

- **Corner radius:** Small and consistent — `4px` for buttons/inputs, `6px` for panels/cards. No pill-shaped buttons, no large rounded corners. This is instrumentation, not a consumer app.
- **Buttons:**
  - Primary ("Run Simulation"): filled `--accent-ember`, white text, 4px radius, no shadow. Hover: darken by ~10%. Disabled: `--bg-panel-raised` fill, `--text-secondary` text, no border.
  - Secondary ("Reset to Baseline"): transparent fill, `--border-hairline` border, `--text-primary` text. Hover: border becomes `--accent-signal-blue`.
  - Icon buttons (play/pause, zoom, skip): 32×32px hit target minimum, transparent until hover (`--bg-panel-raised` on hover), `--text-secondary` icon color at rest, `--text-primary` on hover/active.
- **Checkboxes (layer toggles):** Custom-styled, not browser-default — square with 4px radius, `--border-hairline` border at rest, `--accent-signal-blue` fill with a checkmark when active (signal blue, not ember, because this is a user-controlled data toggle, not a primary action).
- **Sliders:** Track in `--bg-panel-raised`, filled portion in `--accent-signal-blue`, thumb as a small square-ish handle (matches the instrument aesthetic better than a circular "consumer app" thumb) with a visible focus ring in `--accent-signal-blue` at 2px offset.
- **Dropdown (region selector):** `--bg-panel-raised` background, hairline border, chevron icon in `--text-secondary`. Open state: menu items highlight with `--bg-panel` background + `--accent-ember` left-border (2px) on hover, not a full-fill highlight — keeps it quiet.
- **Cards/popovers (alert detail, tooltips):** `--bg-panel-raised`, 6px radius, 1px `--border-hairline`, no drop shadow — instead use a very subtle 1px inset highlight at the top edge (`rgba(255,255,255,0.04)`) to suggest raised depth without a soft shadow, which would feel too "consumer app."
- **Legend (map overlay):** Small raised panel, gradient bar with numeric min/max labels in `--text-data` (mono), variable name in `--text-caption`.

---

## 6. Dashboard Structure (maps to App Flow doc)

Confirms the six functional regions from the App Flow document map onto this visual system as follows:

1. **Header** → `--bg-panel`, houses display-type title + region dropdown, bottom border `--border-hairline`.
2. **Layer Controls** → top block of sidebar, checkboxes as specified above.
3. **Simulation Sandbox** → bottom block of sidebar, sliders + primary/secondary buttons, separated from Layer Controls by a hairline (not a gap/card boundary).
4. **Map Panel** → full-bleed within its grid area; floating overlay controls (legend, zoom, compass) each in small `--bg-panel-raised` chips with 6px radius; this is where the signature live-scan pulse animation lives.
5. **Time Controls** → thin bar directly under the map, `--bg-panel` background, mono-font date readout, scrubber track uses the same visual language as sandbox sliders (signal blue fill) but with a two-tone track (solid = observed, dashed = forecasted, per App Flow doc's spec).
6. **Anomaly Alerts Bar** → `--bg-panel` background, severity-colored left border (4px) per chip rather than full-color chip backgrounds — keeps the bar calm at rest and lets color mean something specific (severity) rather than being decorative.

---

## 7. Mobile Responsiveness

This is fundamentally a data-console layout, which is genuinely hard to compress — the brief should be honest about that rather than pretending a sidebar-plus-map layout "just reflows."

- **Breakpoint strategy:**
  - **Desktop (≥1024px):** Full three-zone layout as specified in Section 4.
  - **Tablet (768–1023px):** Sidebar collapses into a slide-over drawer triggered by a toolbar icon in the header; map panel takes full width; time controls and alerts bar remain full-width and persistent.
  - **Mobile (<768px):** Single-column stack in this priority order: Header (compact, region dropdown becomes a full-width tap target) → Map Panel (fixed aspect ratio, e.g. 4:3, not full viewport height) → Time Controls (full width, same component, touch-friendly larger scrubber thumb) → Layer Controls + Simulation Sandbox collapse into an expandable bottom sheet or accordion (tap a "Controls" tab to reveal) → Alerts Bar pinned to the very bottom, always visible even when the controls sheet is open.
- **Touch targets:** Minimum 44×44px for all interactive controls on mobile (larger than the 32px desktop icon-button spec — scale up, don't reuse desktop hit-areas).
- **Given Phase 0 scope (per PRD, mobile-first optimization is explicitly out of scope for v1):** implement the desktop layout as the primary target, and apply only the **tablet collapse behavior** (sidebar → drawer) as a baseline responsive safeguard so the demo doesn't visibly break on a laptop-to-projector resize. Full mobile-optimized touch layout can be treated as a fast-follow, not a v1 blocker — but the drawer/collapse mechanism should exist so it isn't a rebuild later.

---

## 8. User Experience Principles

1. **Read before act:** Every control's current state must be legible at a glance (checked/unchecked, slider position, active date) without requiring a hover or click — this is a monitoring tool first, an input tool second.
2. **One motion, not many:** Per the design thesis, only the live-scan pulse animates ambiently. Every other transition (loading, panel open/close) should be fast (150–250ms) and purposeful, never bouncy or playful — this reinforces "instrument," not "app."
3. **Color means one thing at a time:** Ember = primary product action. Signal blue = user-controlled/interactive/observed. Hot/cold scale = data values only. Severity colors = alerts only. Never reuse a color across these categories, even under color-picker pressure to "make it pop" — consistency of meaning matters more than variety.
4. **Silence is a valid state:** Per the App Flow doc's empty states, a quiet, muted message ("No active alerts for this region and date") is a *good* outcome and should look calm, not broken — don't red-flag or warn-style an empty state that isn't actually a problem.
5. **Failure speaks plainly:** Error states (Section 6.1 of App Flow doc) use direct, non-apologetic language and a clear retry path — matching the "instrument, not consumer app" register (an aircraft warning light doesn't say "oops!").
6. **Simulation is clearly provisional:** Anything shown under an active what-if scenario must be visually distinguishable from real forecast/observed data at all times (the "Showing: What-If Scenario" badge from the App Flow doc) — this is a trust-critical distinction for a tool that may inform disaster response, so it should never be subtle.

---

## 9. Visual References

Use these as directional anchors, not literal templates:

- **Satellite/mission control consoles** — NASA JPL "Eyes on the Solar System," ISRO's own MOSDAC/Bhuvan interfaces, generic satellite ops-room screens — for the dark, dense, telemetry feel.
- **Seismograph/weather-radar consoles** — NOAA radar interfaces, USGS earthquake monitors — for how they encode severity/urgency through restrained color use rather than loud UI chrome.
- **Flight-deck/instrument panel design language** — for the discipline of "every color and every animation means something specific," and the general absence of decorative flourish.
- **The existing pitch-deck mock UI (page 6 of the deck)** — the closest direct reference; this brief is a refinement/formalization of that exact layout (header + layer toggles + sandbox sliders + map + time scrubber + alert ticker), not a redesign away from it.

**Explicitly not a reference:** Generic analytics SaaS dashboards (Stripe/Linear-style light dashboards), consumer weather apps (too playful/rounded), or AI-product marketing sites (gradient-heavy, gradient-text headlines) — none of these match the "operational instrument" register this product needs.

---

## 10. Notes for the AI App Builder

- Treat Section 2 (Color Palette) and Section 3 (Typography) as literal design tokens — implement them as CSS custom properties / a Tailwind theme extension exactly as named, not as loose inspiration.
- The live-scan pulse (Section 0/6) is the one animation budget item in this system — implement it once, on the map panel's active layer, and resist adding further motion elsewhere even if it seems like it would "add polish." Restraint is the point.
- Where this brief and the App Flow document overlap (component behavior), the App Flow document is the source of truth for *behavior*; this document is the source of truth for *appearance*. They should never conflict, but if a gap is found, flag it rather than guessing.
- Mobile: build the tablet-drawer collapse now (Section 7); treat full mobile touch optimization as explicitly deferred, consistent with the PRD's Phase 0 scope.

---

*End of document.*