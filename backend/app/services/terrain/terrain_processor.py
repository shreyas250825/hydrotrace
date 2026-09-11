"""Normalize DEM arrays into TerrainGrid structures."""

from __future__ import annotations

from datetime import datetime, timezone

import numpy as np

from app.dams.catalog import TERRAIN_DEPTH, TERRAIN_WIDTH
from app.services.terrain.dem_reader import DemInspectResult
from app.services.terrain.models import (
    DamTerrainPackage,
    TerrainBounds,
    TerrainGrid,
    TerrainMetadata,
)

# Soft limits — explicit, not silent
MAX_UPLOAD_BYTES = 80 * 1024 * 1024  # 80 MB
MAX_ANALYSIS_DIM = 256
MAX_VIZ_DIM = 96
MIN_VALID_FRACTION = 0.02


def _mask_nodata(data: np.ndarray, nodata: float | None) -> np.ndarray:
    arr = data.astype(np.float64, copy=True)
    if nodata is not None and not np.isnan(nodata):
        arr = np.where(arr == nodata, np.nan, arr)
    # Common sentinel values
    for sentinel in (-9999.0, -32768.0, 3.402823466e38):
        arr = np.where(np.isclose(arr, sentinel, rtol=0, atol=1.0), np.nan, arr)
    return arr


def _downsample(arr: np.ndarray, max_dim: int) -> np.ndarray:
    h, w = arr.shape
    longest = max(h, w)
    if longest <= max_dim:
        return arr
    scale = max_dim / longest
    out_h = max(2, int(round(h * scale)))
    out_w = max(2, int(round(w * scale)))
    # Simple block average that ignores NaNs
    ys = np.linspace(0, h, out_h + 1).astype(int)
    xs = np.linspace(0, w, out_w + 1).astype(int)
    out = np.full((out_h, out_w), np.nan, dtype=np.float64)
    for r in range(out_h):
        for c in range(out_w):
            block = arr[ys[r] : ys[r + 1], xs[c] : xs[c + 1]]
            if np.any(np.isfinite(block)):
                out[r, c] = float(np.nanmean(block))
    return out


def elevations_to_scene_relative(arr: np.ndarray) -> np.ndarray:
    """Map absolute metres to scene-like relative heights for the flood twin."""
    valid = arr[np.isfinite(arr)]
    if valid.size == 0:
        raise ValueError("DEM contains only NoData values after cleaning.")
    vmin = float(np.min(valid))
    vmax = float(np.max(valid))
    span = max(1.0, vmax - vmin)
    # Preserve relative relief; clamp vertical exaggeration for the demo scene
    relative = (arr - vmin) / span * 28.0 + 2.0
    # Fill nodata with local mean of valid cells
    fill = float(np.nanmean(valid) - vmin) / span * 28.0 + 2.0
    return np.where(np.isfinite(arr), relative, fill)


def build_real_package(
    dam_id: str,
    data: np.ndarray,
    info: DemInspectResult,
    nodata: float | None,
    *,
    source_name: str,
    original_filename: str,
) -> DamTerrainPackage:
    cleaned = _mask_nodata(data, nodata)
    valid_frac = float(np.mean(np.isfinite(cleaned)))
    if valid_frac < MIN_VALID_FRACTION:
        raise ValueError(
            f"DEM is mostly NoData ({valid_frac:.1%} valid). "
            "Upload a raster covering the dam area, or continue with Demonstration Terrain."
        )

    analysis = _downsample(cleaned, MAX_ANALYSIS_DIM)
    viz = _downsample(cleaned, MAX_VIZ_DIM)
    analysis_scene = elevations_to_scene_relative(analysis)
    viz_scene = elevations_to_scene_relative(viz)

    valid = cleaned[np.isfinite(cleaned)]
    west, south, east, north = info.bounds_wgs84 or info.bounds
    bounds = TerrainBounds(west=west, south=south, east=east, north=north)
    res_m = None
    if info.bounds_wgs84:
        # Approximate metres from lon/lat span
        lat_mid = (south + north) / 2
        m_per_deg_lat = 111320.0
        m_per_deg_lng = 111320.0 * max(0.2, abs(np.cos(np.radians(lat_mid))))
        res_m = float(
            np.mean(
                [
                    abs(east - west) / max(1, analysis.shape[1]) * m_per_deg_lng,
                    abs(north - south) / max(1, analysis.shape[0]) * m_per_deg_lat,
                ]
            )
        )
    else:
        res_m = float(np.mean(info.resolution_xy))

    meta = TerrainMetadata(
        dam_id=dam_id,
        source_type="uploaded_geotiff",
        source_name=source_name,
        terrain_type="REAL",
        status="available",
        resolution_meters=res_m,
        crs=info.crs or "unknown",
        bounds=bounds,
        width=int(cleaned.shape[1]),
        height=int(cleaned.shape[0]),
        min_elevation=float(np.min(valid)),
        max_elevation=float(np.max(valid)),
        nodata_value=nodata,
        generated_at=datetime.now(timezone.utc).isoformat(),
        analysis_width=int(analysis_scene.shape[1]),
        analysis_height=int(analysis_scene.shape[0]),
        viz_width=int(viz_scene.shape[1]),
        viz_height=int(viz_scene.shape[0]),
        message="Real DEM loaded and normalized for this dam. Flood engine still uses the Terrain-Aware Demonstration Flood Model.",
        original_filename=original_filename,
    )

    analysis_grid = TerrainGrid(
        width=int(analysis_scene.shape[1]),
        height=int(analysis_scene.shape[0]),
        elevations=analysis_scene.astype(float).reshape(-1).tolist(),
        bounds=bounds,
        crs=info.crs,
        resolution_meters=res_m,
        nodata_value=nodata,
        unit="scene",
        scene_width=TERRAIN_WIDTH,
        scene_depth=TERRAIN_DEPTH,
    )
    viz_grid = TerrainGrid(
        width=int(viz_scene.shape[1]),
        height=int(viz_scene.shape[0]),
        elevations=viz_scene.astype(float).reshape(-1).tolist(),
        bounds=bounds,
        crs=info.crs,
        resolution_meters=res_m,
        nodata_value=nodata,
        unit="scene",
        scene_width=TERRAIN_WIDTH,
        scene_depth=TERRAIN_DEPTH,
    )
    return DamTerrainPackage(metadata=meta, analysis_grid=analysis_grid, viz_grid=viz_grid)
