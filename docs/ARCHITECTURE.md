# HYDROTRACE architecture

## Product

HYDROTRACE — Dam-Break Inundation & Decision Intelligence Platform  
SIH PS 26161 · The Paradox Guild

## Multi-dam data flow

```
DamCatalog (selectedDamId)
        ↓
Dam configuration + scenario defaults
        ↓
TerrainService
   ├─ REAL DEM (uploaded GeoTIFF, Rasterio)
   └─ DEMONSTRATION (procedural / Bhakra fixture)
        ↓
Normalized TerrainGrid (analysis + viz)
        ↓
FloodSimulationService (Terrain-Aware Demonstration Flood Model)
        ↓
Impact · 2D GIS · 3D scene · Comparison · Export
```

## Honesty constraints

- Engine label: Terrain-Aware Demonstration Flood Model
- Not SPH, not Delft3D, not a calibrated professional solver
- Historical case studies are documented incidents — not “unsafe dam” rankings
- Demonstration Terrain is never labelled as SRTM / Cartosat / GEE unless that file was actually uploaded
- Frontend procedural terrain is FALLBACK only when the API is offline
