# HYDROTRACE Terrain Pipeline QA

**Product:** HYDROTRACE — Dam-Break Inundation & Decision Intelligence Platform  
**PS:** 26161 · The Paradox Guild  
**Date:** 2026-09-07  
**Phase:** Real DEM / Terrain Pipeline (no SPH / Delft3D / GEE)

---

## Architecture

```
Upload GeoTIFF (optional, per dam)
        ↓
TerrainService (backend authority)
   ├─ REAL DEM (Rasterio decode → normalize → store)
   └─ DEMONSTRATION TERRAIN (procedural / Bhakra fixture)
        ↓
Normalized TerrainGrid (analysis + viz resolutions)
        ↓
FloodSimulationService (consumes grid only)
        ↓
Flood result → 2D / 3D / impact / export
```

Frontend procedural `demoTerrain.ts` is **FALLBACK** when the API is offline. It is not the authoritative simulation terrain when the backend is reachable.

---

## APIs

| Endpoint | Purpose |
|----------|---------|
| `GET /api/terrain/capability` | Rasterio availability, limits, formats |
| `GET /api/dams/{id}/terrain` | Terrain package (`purpose=analysis\|viz\|meta`) |
| `GET /api/dams/{id}/terrain/status` | REAL / DEMONSTRATION status |
| `POST /api/dams/{id}/terrain/upload` | Decode GeoTIFF → bind to **that dam only** |
| `DELETE /api/dams/{id}/terrain` | Clear uploaded DEM → fall back to demonstration |
| `POST /api/dams/{id}/simulation/run` | Uses TerrainService elevations |

Response always declares `terrain_type`: `REAL` | `DEMONSTRATION` | `UNAVAILABLE`.

---

## Supported formats

- GeoTIFF: `.tif`, `.tiff`
- Not supported as terrain: SHP, ASC (this phase), GEE assets

Limits:

- Max upload: 80 MB  
- Max analysis dim: 256  
- Max viz dim: 96  

---

## Terrain source states

| State | Meaning |
|-------|---------|
| DEMONSTRATION | Procedural / Bhakra fixture — **not** SRTM/Cartosat/GEE |
| REAL | Uploaded GeoTIFF decoded for the selected dam |
| UNAVAILABLE | Reserved; system falls back to demonstration with clear messaging |

---

## Tested dams (demonstration path)

All 11 returned `terrain_type=DEMONSTRATION` and completed simulation:

| Dam | Cells (demo) |
|-----|--------------|
| bhakra | 727 |
| kaddam | 562 |
| panshet | 563 |
| khadakwasla | 564 |
| chikkhole | 558 |
| machhu-ii | 556 |
| pratappur | 556 |
| jamunia | 556 |
| nandgavan | 556 |
| jaswant-sagar | 556 |
| gararda | 558 |

---

## REAL DEM path (tested)

A **synthetic** GeoTIFF (`backend/_qa_synth_dem.tif`) was generated for pipeline QA only. It is **not** a real-world DEM and must not be presented as SRTM/Cartosat/etc.

Commands:

```powershell
# capability
Invoke-RestMethod http://127.0.0.1:8000/api/terrain/capability

# upload (bound to bhakra only)
curl.exe -F "file=@backend/_qa_synth_dem.tif" http://127.0.0.1:8000/api/dams/bhakra/terrain/upload

# status
Invoke-RestMethod http://127.0.0.1:8000/api/dams/bhakra/terrain/status
# → terrain_type REAL

# isolation
Invoke-RestMethod http://127.0.0.1:8000/api/dams/machhu-ii/terrain/status
# → terrain_type DEMONSTRATION

# simulate with REAL terrain
# POST /api/dams/bhakra/simulation/run → terrainType REAL, floodedCellCount 1010

# clear
curl.exe -X DELETE http://127.0.0.1:8000/api/dams/bhakra/terrain
```

Results:

| Check | Result |
|-------|--------|
| Rasterio available | Pass |
| Synthetic GeoTIFF ingest | Pass |
| Bhakra → REAL | Pass |
| Machhu II remains DEMONSTRATION | Pass (no cross-dam leak) |
| Simulation uses REAL grid | Pass (`terrainType=REAL`) |
| Clear DEM → demonstration | Pass |

---

## Fallback behavior

- No upload → DEMONSTRATION for all dams  
- Rasterio missing → upload returns 503 with explicit message; demo path continues  
- Invalid GeoTIFF / no CRS / all-NoData → 400 with readable error; previous terrain kept  
- Frontend offline → TypeScript procedural FALLBACK (labelled)

---

## Frontend / build

```powershell
cd frontend
npx tsc --noEmit
npm run build
```

Both passed (2026-09-07).

---

## Known limitations

1. No curated real-world DEM ships in the repository.  
2. Uploaded DEM is remapped into the HYDROTRACE scene grid (relative relief), not a full geodetic flood model.  
3. Flood engine remains the **Terrain-Aware Demonstration Flood Model** even on REAL DEM.  
4. DEM storage is in-memory (lost on backend restart).  
5. ASC/IMG not supported yet.  
6. SPH / Delft3D / GEE / SHP not in this phase.

---

## Remaining work

- Persist uploaded DEMs to disk with dam-scoped paths  
- Optional official DEM fixtures when licensed data is available  
- True geographic flood routing on DEM CRS (beyond scene remapping)  
- SPH / Delft3D adapters (later)
