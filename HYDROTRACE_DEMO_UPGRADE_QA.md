# HYDROTRACE Demo-Critical Upgrade QA

**Date:** 2026-09-11  
**Purpose:** SIH demo readiness — GEE architecture, methodology honesty, flood products, 3D polish

---

## 1. GEE status

| Item | Result |
|------|--------|
| `EarthObservationService` | Implemented |
| Connected without credentials | **No** — reports `NOT_CONFIGURED` / Integration Ready / Not Authenticated |
| Fake satellite imagery | **Not fabricated** |
| UI label | Google Earth Engine · NOT AUTHENTICATED |

---

## 2. Real data sources

| Layer | Provenance |
|-------|------------|
| DEM | REAL if GeoTIFF uploaded; else DEMONSTRATION |
| Basemap | OpenStreetMap / Esri (real tiles) |
| Infrastructure | DEMONSTRATION fixtures |
| Flood products | MODELLED from Terrain-Aware Demonstration Flood Model |
| Satellite / EO | NOT AUTHENTICATED |

---

## 3. Equations

Shown under **REFERENCE** (not claimed as solved):

- Continuity: `∂h/∂t + ∇·(h u) = 0`
- Momentum: shallow-water form
- Breach hydraulics: `Q = A v`, `Q = C_d A √(2gH)` under **Hydraulic Reference**

Implemented algorithm documented as terrain-aware downhill fill steps.

---

## 4. Current model capabilities

| Product | Available |
|---------|-----------|
| Inundation extent | Yes (MODELLED) |
| Depth (m) | Yes (MODELLED) |
| Arrival time (min) | Yes (MODELLED) |
| Velocity field | **No** — UI states not available |
| Calibrated SWE | **No** |

---

## 5–7. Visualizations / 3D / impact

- Depth & arrival map products + legends with units
- Timeline scrubber using simulation arrival span
- 3D terrain exaggeration + arrival-synced flood cells
- Impact: depth, arrival, priority; Population: Data unavailable
- Comparison: inundation, depth, arrival, cells, features
- Methodology page + Data provenance panel
- Guided demo tour (8 steps)

---

## 8. Key files

**Added:** `earthObservationService.ts`, `methodology.ts`, `MethodologyPanel`, `EarthObservationCard`, `Methodology` page, `FloodProductLayers`, `FloodTimeline`, `derivatives.py`

**Updated:** store, GeospatialViewer, CommandCenter, Impact, Simulation, Comparison, Sidebar, App, DataTransparency, demo tour, dams API

---

## 9. Build / API

```
npx tsc --noEmit   # Pass
npm run build      # Pass
```

Backend (when running):

```
GET /api/health
GET /api/dams
GET /api/terrain/capability
GET /api/dams/{id}/terrain/derivatives   # REAL DEM only
```

---

## 10. Limitations

- GEE not authenticated — no live EO layers
- No curated real DEM in repo by default
- Velocity not solved
- Hillshade/slope UI toggles require REAL DEM; derivatives API computes when REAL upload exists
- Engine remains demonstration (not Delft3D/SPH)

**Honesty rule preserved:** REAL / MODELLED / DEMONSTRATION / REFERENCE are labelled in UI.
