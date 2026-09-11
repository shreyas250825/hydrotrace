"""Terrain derivative products (slope / hillshade) from REAL DEM grids only."""

from __future__ import annotations

import math

import numpy as np

from app.services.terrain import store


def _hillshade(elev: np.ndarray, azimuth_deg: float = 315.0, altitude_deg: float = 45.0) -> np.ndarray:
    dy, dx = np.gradient(elev.astype(np.float64))
    slope = np.pi / 2.0 - np.arctan(np.hypot(dx, dy))
    aspect = np.arctan2(-dx, dy)
    az = math.radians(azimuth_deg)
    alt = math.radians(altitude_deg)
    shaded = np.sin(alt) * np.sin(slope) + np.cos(alt) * np.cos(slope) * np.cos(az - aspect)
    return np.clip(shaded, 0, 1)


def derivatives_for(dam_id: str) -> dict:
    pkg = store.get_package(dam_id)
    if pkg is None or pkg.metadata.terrain_type != "REAL":
        return {
            "dam_id": dam_id,
            "available": False,
            "message": (
                "Slope / hillshade require a REAL DEM for this dam. "
                "Demonstration Terrain does not produce real terrain derivatives."
            ),
            "products": [],
        }

    grid = pkg.viz_grid or pkg.analysis_grid
    h, w = grid.height, grid.width
    elev = np.asarray(grid.elevations, dtype=np.float64).reshape(h, w)
    dy, dx = np.gradient(elev)
    slope = np.degrees(np.arctan(np.hypot(dx, dy)))
    aspect = (np.degrees(np.arctan2(-dx, dy)) + 360.0) % 360.0
    shade = _hillshade(elev)

    def pack(arr: np.ndarray) -> list[float]:
        return arr.astype(float).reshape(-1).tolist()

    return {
        "dam_id": dam_id,
        "available": True,
        "terrain_type": "REAL",
        "source": pkg.metadata.source_name,
        "width": w,
        "height": h,
        "message": "Derivatives computed from uploaded GeoTIFF for this dam only.",
        "products": ["elevation", "slope", "aspect", "hillshade"],
        "stats": {
            "elevation_min": float(np.min(elev)),
            "elevation_max": float(np.max(elev)),
            "slope_min_deg": float(np.min(slope)),
            "slope_max_deg": float(np.max(slope)),
        },
        # Downsampled viz arrays — not claimed as survey products
        "slope": pack(slope),
        "aspect": pack(aspect),
        "hillshade": pack(shade),
        "elevation": pack(elev),
    }
