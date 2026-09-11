"""TerrainService — single authority for REAL DEM vs Demonstration Terrain."""

from __future__ import annotations

import tempfile
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from app.dams.catalog import TERRAIN_DEPTH, TERRAIN_WIDTH, require_dam
from app.dams import providers as demo_providers
from app.services.terrain import store
from app.services.terrain.dem_reader import (
    RASTERIO_AVAILABLE,
    inspect_dem,
    rasterio_status,
    read_dem_array,
)
from app.services.terrain.models import (
    DamTerrainPackage,
    TerrainBounds,
    TerrainGrid,
    TerrainMetadata,
)
from app.services.terrain.terrain_processor import (
    MAX_ANALYSIS_DIM,
    MAX_UPLOAD_BYTES,
    MAX_VIZ_DIM,
    build_real_package,
)


def _demo_package(dam_id: str) -> DamTerrainPackage:
    dam = require_dam(dam_id)
    raw = demo_providers.terrain_grid(dam_id)
    cols = int(raw["cols"])
    rows = int(raw["rows"])
    heights = [float(h) for h in raw["heights"]]
    source_type = "bhakra_fixture" if dam["terrainProvider"] == "bhakra_fixture" else "procedural"
    meta = TerrainMetadata(
        dam_id=dam_id,
        source_type=source_type,  # type: ignore[arg-type]
        source_name=dam["terrainSource"],
        terrain_type="DEMONSTRATION",
        status="demonstration",
        resolution_meters=None,
        crs="HYDROTRACE-scene",
        bounds=TerrainBounds(
            west=dam["longitude"] - 0.08,
            south=dam["latitude"] - 0.08,
            east=dam["longitude"] + 0.08,
            north=dam["latitude"] + 0.08,
        ),
        width=cols,
        height=rows,
        min_elevation=min(heights) if heights else None,
        max_elevation=max(heights) if heights else None,
        nodata_value=None,
        generated_at=datetime.now(timezone.utc).isoformat(),
        analysis_width=cols,
        analysis_height=rows,
        viz_width=min(cols, MAX_VIZ_DIM),
        viz_height=min(rows, MAX_VIZ_DIM),
        message=(
            "Real DEM unavailable for this case study. "
            "HYDROTRACE is using Demonstration Terrain."
        ),
    )
    analysis = TerrainGrid(
        width=cols,
        height=rows,
        elevations=heights,
        bounds=meta.bounds,
        crs=meta.crs,
        resolution_meters=None,
        nodata_value=None,
        unit="scene",
        scene_width=TERRAIN_WIDTH,
        scene_depth=TERRAIN_DEPTH,
    )
    # Lightweight viz downsample of demo grid
    viz_w = min(cols, MAX_VIZ_DIM)
    viz_h = min(rows, MAX_VIZ_DIM)
    viz_elev = []
    for r in range(viz_h):
        src_r = int(round(r / max(1, viz_h - 1) * (rows - 1)))
        for c in range(viz_w):
            src_c = int(round(c / max(1, viz_w - 1) * (cols - 1)))
            viz_elev.append(heights[src_r * cols + src_c])
    viz = TerrainGrid(
        width=viz_w,
        height=viz_h,
        elevations=viz_elev,
        bounds=meta.bounds,
        crs=meta.crs,
        resolution_meters=None,
        nodata_value=None,
        unit="scene",
        scene_width=TERRAIN_WIDTH,
        scene_depth=TERRAIN_DEPTH,
    )
    return DamTerrainPackage(metadata=meta, analysis_grid=analysis, viz_grid=viz)


class TerrainService:
    """Resolve terrain for a dam: uploaded REAL DEM or demonstration fallback."""

    def rasterio_available(self) -> bool:
        return RASTERIO_AVAILABLE

    def capability(self) -> dict:
        status = rasterio_status()
        return {
            "demIngestion": status["available"],
            "supportedFormats": [".tif", ".tiff"],
            "maxUploadBytes": MAX_UPLOAD_BYTES,
            "maxAnalysisDim": MAX_ANALYSIS_DIM,
            "maxVizDim": MAX_VIZ_DIM,
            "rasterio": status,
            "note": (
                "Backend is the authoritative terrain source for simulation. "
                "Frontend procedural terrain is FALLBACK only when the API is offline."
            ),
        }

    def get_package(self, dam_id: str) -> DamTerrainPackage:
        require_dam(dam_id)
        real = store.get_package(dam_id)
        if real is not None and real.metadata.terrain_type == "REAL":
            return real
        return _demo_package(dam_id)

    def get_status(self, dam_id: str) -> dict:
        pkg = self.get_package(dam_id)
        return {
            "dam_id": dam_id,
            "terrain_type": pkg.metadata.terrain_type,
            "source_type": pkg.metadata.source_type,
            "status": pkg.metadata.status,
            "source_name": pkg.metadata.source_name,
            "message": pkg.metadata.message,
            "metadata": pkg.metadata.to_dict(),
            "has_real_dem": pkg.metadata.terrain_type == "REAL",
        }

    def get_api_payload(
        self,
        dam_id: str,
        *,
        purpose: str = "analysis",
        include_grid: bool = True,
    ) -> dict:
        pkg = self.get_package(dam_id)
        return pkg.to_api_dict(include_grid=include_grid, purpose=purpose)

    def analysis_elevations(self, dam_id: str) -> tuple[np.ndarray, int, int, TerrainMetadata]:
        """Return (elev[row-major], cols, rows, metadata) for the flood model."""
        pkg = self.get_package(dam_id)
        grid = pkg.analysis_grid
        elev = np.asarray(grid.elevations, dtype=np.float32)
        return elev, grid.width, grid.height, pkg.metadata

    def sample_height(self, dam_id: str, x: float, z: float) -> float:
        """Bilinear sample of the active analysis grid in scene coordinates."""
        elev, cols, rows, _ = self.analysis_elevations(dam_id)
        # Map scene x,z into grid indices
        col_f = (x / TERRAIN_WIDTH + 0.5) * (cols - 1)
        row_f = (z / TERRAIN_DEPTH + 0.5) * (rows - 1)
        col_f = float(np.clip(col_f, 0, cols - 1))
        row_f = float(np.clip(row_f, 0, rows - 1))
        c0 = int(np.floor(col_f))
        r0 = int(np.floor(row_f))
        c1 = min(c0 + 1, cols - 1)
        r1 = min(r0 + 1, rows - 1)
        tc = col_f - c0
        tr = row_f - r0
        v00 = float(elev[r0 * cols + c0])
        v10 = float(elev[r0 * cols + c1])
        v01 = float(elev[r1 * cols + c0])
        v11 = float(elev[r1 * cols + c1])
        return (
            v00 * (1 - tc) * (1 - tr)
            + v10 * tc * (1 - tr)
            + v01 * (1 - tc) * tr
            + v11 * tc * tr
        )

    def inspect_upload(self, path: str | Path) -> dict:
        info = inspect_dem(path)
        return {
            "crs": info.crs,
            "bounds": {
                "west": info.bounds[0],
                "south": info.bounds[1],
                "east": info.bounds[2],
                "north": info.bounds[3],
            },
            "bounds_wgs84": (
                {
                    "west": info.bounds_wgs84[0],
                    "south": info.bounds_wgs84[1],
                    "east": info.bounds_wgs84[2],
                    "north": info.bounds_wgs84[3],
                }
                if info.bounds_wgs84
                else None
            ),
            "width": info.width,
            "height": info.height,
            "nodata": info.nodata,
            "resolution_xy": {
                "x": info.resolution_xy[0],
                "y": info.resolution_xy[1],
            },
        }

    def ingest_geotiff_bytes(
        self,
        dam_id: str,
        content: bytes,
        filename: str,
    ) -> DamTerrainPackage:
        require_dam(dam_id)
        if not RASTERIO_AVAILABLE:
            raise RuntimeError(
                "Rasterio/GDAL unavailable. Cannot decode GeoTIFF. "
                "Real DEM unavailable — HYDROTRACE is using Demonstration Terrain."
            )
        if len(content) > MAX_UPLOAD_BYTES:
            raise ValueError(
                f"DEM upload exceeds {MAX_UPLOAD_BYTES // (1024 * 1024)} MB limit."
            )
        suffix = Path(filename).suffix.lower()
        if suffix not in {".tif", ".tiff"}:
            raise ValueError("Only GeoTIFF (.tif / .tiff) is supported for DEM upload.")

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(content)
            tmp_path = Path(tmp.name)
        try:
            data, info, nodata = read_dem_array(tmp_path, max_dim=MAX_ANALYSIS_DIM * 2)
            if info.crs is None:
                raise ValueError(
                    "DEM has no CRS. Provide a georeferenced GeoTIFF, "
                    "or continue with Demonstration Terrain."
                )
            package = build_real_package(
                dam_id,
                data,
                info,
                nodata,
                source_name=f"Uploaded GeoTIFF ({filename})",
                original_filename=filename,
            )
            store.set_package(dam_id, package)
            return package
        finally:
            try:
                tmp_path.unlink(missing_ok=True)
            except OSError:
                pass

    def clear_real(self, dam_id: str) -> bool:
        require_dam(dam_id)
        return store.clear_package(dam_id)


terrain_service = TerrainService()
