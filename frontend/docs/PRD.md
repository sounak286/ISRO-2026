# Product Requirements Document
## AI-Powered Digital Twin of India's Climate — Frontend (Dummy/Prototype)

**Author:** Product (as requested)
**Team:** SHIV-SAKTI
**Context:** Bharatiya Antariksh Hackathon 2026, Problem Statement 5
**Version:** v1.0 — Prototype/Demo Frontend
**Status:** Draft

---

## 1. Overview

The AI-Powered Digital Twin of India's Climate is a platform that fuses IMD ground observations, ISRO INSAT satellite imagery, and reanalysis data (ERA5) with AI models to produce high-resolution, near-real-time climate forecasts and scenario simulations — replacing numerical weather models that take 6–12 hours with AI inference that runs in under 60 seconds.

This PRD covers **only the frontend** for the hackathon prototype: a geospatial dashboard that lets users view forecasted climate variables (rainfall, temperature) over a pilot region (Kerala + Western Ghats), scrub through time, run "what-if" scenarios, and see anomaly alerts. For this phase, the frontend is a **dummy/mocked UI** — it does not need a live backend, model, or real data pipeline. It exists to demonstrate the product experience and validate the interaction design ahead of/alongside backend development.

---

## 2. Problem Statement

Existing weather and climate systems available to Indian stakeholders (farmers, disaster management authorities, state governments, researchers, urban planners) suffer from:

- **Slow forecast generation** — numerical models (WRF/GCM) take hours of supercomputing per run.
- **No district-level granularity** for India specifically — global models (e.g. ECMWF IFS, GraphCast) are trained at coarse resolution (12–25 km) and not localized to Indian conditions.
- **Fragmented, siloed data** — IMD and INSAT datasets aren't integrated into a single interface.
- **Static, one-shot outputs** — no continuous updating as new observations arrive, and no way for a non-technical user to explore "what happens if rainfall drops 20%" without re-running a full simulation.
- **No unified, accessible visualization layer** — existing tools are built for researchers, not for the range of stakeholders (farmers, district officials, planners) who need to act on this information quickly.

The frontend's job is to make AI-driven climate intelligence **legible and actionable** to a non-specialist decision-maker in seconds, not hours.

---

## 3. Target Users

| User | Needs | Frontend Implication |
|---|---|---|
| **Farmers / agricultural planners** | Simple, localized rainfall & temperature outlook for crop planning | Clear region-level view, plain-language alerts, minimal jargon |
| **Disaster management authorities** | Fast, high-confidence flood/heatwave warnings | Prominent anomaly alert system, time-critical UI, alert severity levels |
| **State government / resource planners** | Regional trends to guide resource allocation | Time controls to compare past vs. forecasted states, exportable views |
| **Researchers / climate scientists** | Access to underlying variables (LST, SST, rainfall layers) and ability to test scenarios | Layer toggles, what-if sandbox with fine-grained controls |
| **Urban planners** | Infrastructure risk exposure over time | Map-based visualization, zone-level anomaly flags |

For the hackathon demo, the **primary persona** is a generalist judge/evaluator standing in for "a decision-maker" — so the UI needs to be self-explanatory within seconds, prioritizing clarity and visual polish over deep configurability.

---

## 4. Core Features (Frontend Scope)

Based on the mock UI and solution architecture, the frontend consists of:

1. **Header / Region Selector**
   - Product title/branding
   - Dropdown to select pilot region (e.g., Western Ghats, Kerala districts)

2. **Layer Controls (sidebar)**
   - Toggle visibility of data layers: INSAT LST, IMD Rainfall, Ocean SST
   - Visual legend per layer (color scale)

3. **Map Visualization Panel**
   - Heatmap/grid rendering of selected climate variable(s) over the region
   - Zoom/pan controls
   - Legend showing value-to-color mapping (temperature, rainfall)

4. **Simulation Sandbox ("What-If" controls)**
   - Sliders: Rainfall modifier (-50% to +50%), Temperature offset (-2°C to +5°C)
   - "Run Simulation" action that updates the map visualization (mocked)
   - Reset-to-baseline control

5. **Time Controls**
   - Scrubber/timeline with play, pause, step-forward, step-back
   - Current date/time readout
   - Distinguish "observed" vs "forecasted" time ranges

6. **Anomaly Alerts Bar**
   - Ticker or banner listing active alerts (e.g., "Extreme Heat Warning: Zone 4B", "Monsoon Delay Risk: Moderate")
   - Severity indication (color-coded: info/warning/critical)

7. **Responsive Shell**
   - Layout that holds together on typical demo devices (laptop screen, projector)

---

## 5. User Stories

**Region & Layers**
- As a user, I want to select a pilot region so that I can focus the dashboard on the area I care about.
- As a user, I want to toggle individual data layers (LST, rainfall, SST) so that I can isolate the variable I'm analyzing.

**Map & Visualization**
- As a user, I want to see a color-coded heatmap of rainfall/temperature so that I can quickly interpret spatial patterns without reading raw numbers.
- As a user, I want a legend visible at all times so that I can interpret what the colors mean.

**What-If Simulation**
- As a researcher, I want to adjust rainfall and temperature sliders so that I can see a hypothetical scenario's impact on the map.
- As a user, I want to reset the simulation to baseline so that I can compare "what-if" against the actual forecast.

**Time Navigation**
- As a disaster management official, I want to scrub through a timeline so that I can see how conditions are expected to evolve day by day.
- As a user, I want to play/pause an animated time-lapse so that I can watch the forecast unfold without manually dragging the slider.

**Alerts**
- As a disaster authority, I want to see anomaly alerts prominently so that I don't miss a critical warning.
- As a user, I want alerts categorized by severity so that I can prioritize my attention.

**General**
- As a judge/evaluator, I want the interface to look and feel like a real operational product so that I understand the vision even without a live backend.

---

## 6. MVP Scope (Prototype / Dummy Frontend)

**In scope for v1 (hackathon dummy frontend):**
- Static/mocked data (hardcoded or locally generated fake grid values) — no live API or model inference
- Single pilot region (Kerala + Western Ghats) with a fixed set of selectable sub-regions/districts
- Layer toggles (LST, Rainfall, SST) that switch which mocked overlay is shown
- Heatmap/grid visualization (real map library or stylized custom rendering — implementation detail, not a requirement)
- Time slider with a fixed range of mock dates (e.g., past 5 days + next 3-day forecast), including play/pause
- What-if sliders that visibly alter the mocked overlay (e.g., simple color/value shift, not a real simulation)
- Anomaly alert bar with 2–3 hardcoded sample alerts, styled by severity
- Basic responsive layout matching the mock UI reference

**Explicitly out of scope for v1** (see Section 8 for detail):
- Real backend/API integration
- Authentication/RBAC
- Multi-region support beyond the pilot
- Data export/reporting
- Mobile-first optimization

---

## 7. Success Metrics

Since this is a hackathon prototype (not a production launch), success is measured differently than a typical product:

| Metric | Target |
|---|---|
| **Visual fidelity to mock UI** | Dashboard is recognizable as the same product shown in the pitch deck |
| **Time-to-understanding** | A first-time viewer (judge) understands what the product does within ~15 seconds of seeing the dashboard |
| **Interaction completeness** | All 6 core features (region select, layers, map, sandbox, time controls, alerts) are clickable/functional in a mocked sense — nothing is a dead button |
| **Demo stability** | Zero crashes/errors during a live walkthrough |
| **Perceived realism** | Evaluators comment that it "looks like a real product," not a static mockup |
| **Build velocity** | Frontend prototype completed within the hackathon's remaining time budget |

Post-hackathon (if the project continues), success metrics would shift toward: real data integration accuracy, forecast latency (<60s target from the deck), and stakeholder usability testing — but these are out of scope for this PRD.

---

## 8. Features to Avoid in Version 1

To keep the prototype achievable and focused, explicitly **do not build**:

1. **Real AI/ML inference or backend connectivity** — all data should be mocked/hardcoded; do not attempt to wire up ConvLSTM, PyTorch, or any real model in the frontend layer.
2. **Live satellite/IMD data ingestion** — no real API calls to MOSDAC, IMD Pune, or Bhuvan.
3. **User accounts, login, or role-based access control** — the deck mentions "Auth & RBAC" as an architecture layer, but it's irrelevant to a demo frontend.
4. **National-scale coverage** — stick to the single pilot region; don't try to generalize the map to all of India.
5. **Real-time data assimilation / continuous updates** — the "digital twin updates every 3 hours" concept can be described, not functionally implemented.
6. **SMS/API/push notification delivery for alerts** — alerts should render in-app only, not integrate with any notification service.
7. **Data export, reporting, or PDF generation features.**
8. **Offline support or PWA capabilities.**
9. **Multi-language/localization support.**
10. **Deep customization of the what-if sandbox** (e.g., arbitrary variable combinations) — keep to the 2 sliders shown in the mock UI (rainfall %, temperature offset).
11. **Complex accessibility/compliance work** (WCAG audits, screen reader optimization) — good practice is welcome, but not a hard requirement for a hackathon demo.

---

## 9. Open Questions

- Should the "GitHub Repo," "Live Demo," and "Video Demo" links referenced in the mock UI slide be wired to placeholders or omitted in the dummy frontend?
- Should district-level boundaries within the Western Ghats be real GeoJSON or simplified/fake shapes?
- What is the actual time budget remaining to build this, and does that change what's realistic within "MVP scope" above?

---

*End of document.*