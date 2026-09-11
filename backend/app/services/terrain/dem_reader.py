"""GeoTIFF / DEM reading via Rasterio (optional dependency)."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np

_RASTERIO_ERROR: str | None = None
try:
    import rasterio
    from rasterio.enums import Resampling
    from rasterio.warp import transform_bounds

    RASTERIO_AVAILABLE = True
except Exception as exc:  # pragma: no cover - environment dependent
    rasterio = None  # type: ignore
    Resampling = None  # type: ignore
    transform_bounds = None  # type: ignore
    RASTERIO_AVAILABLE = False
    _RASTERIO_ERROR = str(exc)


@dataclass
class DemInspectResult:
    crs: str | None
    bounds: tuple[float, float, float, float]  # west, south, east, north in CRS
    bounds_wgs84: tuple[float, float, float, float] | None
    width: int
    height: int
    nodata: float | None
    dtype: str
    transform: Any
    resolution_xy: tuple[float, float]
    count: int


def rasterio_status() -> dict[str, Any]:
    return {
        "available": RASTERIO_AVAILABLE,
        "error": None if RASTERIO_AVAILABLE else (
            _RASTERIO_ERROR
            or "Rasterio/GDAL is not installed. Real DEM ingestion is unavailable; Demonstration Terrain remains active."
        ),
    }


def inspect_dem(path: str | Path) -> DemInspectResult:
    if not RASTERIO_AVAILABLE:
        raise RuntimeError(
            "Rasterio/GDAL unavailable. Cannot inspect DEM. "
            "HYDROTRACE will continue using Demonstration Terrain."
        )
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"DEM file not found: {path}")

    with rasterio.open(path) as ds:
        if ds.count < 1:
            raise ValueError("DEM raster has no bands.")
        if ds.width < 2 or ds.height < 2:
            raise ValueError("DEM raster is too small (need at least 2×2).")
        crs = str(ds.crs) if ds.crs else None
        west, south, east, north = ds.bounds
        bounds_wgs84 = None
        if ds.crs is not None:
            try:
                if ds.crs.to_epsg() == 4326:
                    bounds_wgs84 = (west, south, east, north)
                else:
                    bounds_wgs84 = transform_bounds(ds.crs, "EPSG:4326", west, south, east, north)
            except Exception:
                bounds_wgs84 = None
        res = ds.res
        return DemInspectResult(
            crs=crs,
            bounds=(west, south, east, north),
            bounds_wgs84=bounds_wgs84,
            width=ds.width,
            height=ds.height,
            nodata=ds.nodata,
            dtype=str(ds.dtypes[0]),
            transform=ds.transform,
            resolution_xy=(float(res[0]), float(abs(res[1]))),
            count=ds.count,
        )


def read_dem_array(
    path: str | Path,
    *,
    max_dim: int = 512,
) -> tuple[np.ndarray, DemInspectResult, float | None]:
    """Read band 1, optionally downsampling so max(width,height) <= max_dim."""
    if not RASTERIO_AVAILABLE:
        raise RuntimeError(
            "Rasterio/GDAL unavailable. Cannot load DEM. "
            "HYDROTRACE will continue using Demonstration Terrain."
        )
    path = Path(path)
    info = inspect_dem(path)
    with rasterio.open(path) as ds:
        out_h = info.height
        out_w = info.width
        scale = 1.0
        longest = max(out_w, out_h)
        if longest > max_dim:
            scale = max_dim / longest
            out_w = max(2, int(round(info.width * scale)))
            out_h = max(2, int(round(info.height * scale)))
        data = ds.read(
            1,
            out_shape=(out_h, out_w),
            resampling=Resampling.bilinear,
        ).astype(np.float64)
        nodata = ds.nodata
        # Update resolution estimate after downsample
        info = DemInspectResult(
            crs=info.crs,
            bounds=info.bounds,
            bounds_wgs84=info.bounds_wgs84,
            width=out_w,
            height=out_h,
            nodata=nodata,
            dtype=str(data.dtype),
            transform=ds.transform,
            resolution_xy=(
                info.resolution_xy[0] / scale if scale else info.resolution_xy[0],
                info.resolution_xy[1] / scale if scale else info.resolution_xy[1],
            ),
            count=info.count,
        )
        return data, info, float(nodata) if nodata is not None else None
