# Services

Plug-in point for the deterministic geospatial pipeline.

Large rasters, DEM blobs and file bytes stay in service-level registries.
Zustand stores metadata and scenario parameters only.

| Module | Responsibility | Status |
| --- | --- | --- |
| `terrainService` | DEM ingest, elevation grid cache | Interface + cache boundary |
| `geospatialService` | File registry (DEM, hydro, satellite, GeoJSON) | Metadata registration |
| `geeService` | Google Earth Engine session / layers | Architecture; Leaflet fallback |
| `simulationService` | Terrain-aware flood propagation | Interface only |
| `impactAnalysisService` | Overlay flood extent on infrastructure | Interface only |
| `intelligenceService` | Deterministic report assembly | Interface only |
| `exportService` | Shapefile / KML export | Disabled until COMPLETED |

Optional AI/OpenRouter, if added later, must consume *outputs* of these
services. It must never replace them.
