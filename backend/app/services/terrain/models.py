"""Normalized terrain models for HYDROTRACE DEM pipeline."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal

TerrainType = Literal["REAL", "DEMONSTRATION", "UNAVAILABLE"]
TerrainStatus = Literal["available", "demonstration", "unavailable", "error", "processing"]
SourceType = Literal["dem", "procedural", "bhakra_fixture", "uploaded_geotiff", "none"]


@dataclass
class TerrainBounds:
    west: float
    south: float
    east: float
    north: float

    def to_dict(self) -> dict[str, float]:
        return asdict(self)


@dataclass
class TerrainMetadata:
    dam_id: str
    source_type: SourceType
    source_name: str
    terrain_type: TerrainType
    status: TerrainStatus
    resolution_meters: float | None = None
    crs: str | None = None
    bounds: TerrainBounds | None = None
    width: int | None = None
    height: int | None = None
    min_elevation: float | None = None
    max_elevation: float | None = None
    nodata_value: float | None = None
    generated_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    analysis_width: int | None = None
    analysis_height: int | None = None
    viz_width: int | None = None
    viz_height: int | None = None
    message: str | None = None
    original_filename: str | None = None

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        if self.bounds is not None:
            d["bounds"] = self.bounds.to_dict()
        return d


@dataclass
class TerrainGrid:
    """Normalized elevation grid. Elevations are metres (or scene units for demo)."""

    width: int
    height: int
    elevations: list[float]
    bounds: TerrainBounds | None
    crs: str | None
    resolution_meters: float | None
    nodata_value: float | None
    unit: Literal["meters", "scene"] = "meters"
    # Scene-space framing used by the flood model / 3D twin
    scene_width: float | None = None
    scene_depth: float | None = None

    def to_dict(self, include_elevations: bool = True) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "width": self.width,
            "height": self.height,
            "bounds": self.bounds.to_dict() if self.bounds else None,
            "crs": self.crs,
            "resolution_meters": self.resolution_meters,
            "nodata_value": self.nodata_value,
            "unit": self.unit,
            "scene_width": self.scene_width,
            "scene_depth": self.scene_depth,
        }
        if include_elevations:
            payload["elevations"] = self.elevations
        return payload


@dataclass
class DamTerrainPackage:
    """Authoritative terrain package for one dam."""

    metadata: TerrainMetadata
    analysis_grid: TerrainGrid
    viz_grid: TerrainGrid | None = None

    def to_api_dict(self, include_grid: bool = True, purpose: str = "analysis") -> dict[str, Any]:
        grid = self.viz_grid if purpose == "viz" and self.viz_grid else self.analysis_grid
        return {
            "dam_id": self.metadata.dam_id,
            "damId": self.metadata.dam_id,
            "terrain_type": self.metadata.terrain_type,
            "source_type": self.metadata.source_type,
            "status": self.metadata.status,
            "metadata": self.metadata.to_dict(),
            "grid": grid.to_dict(include_elevations=include_grid) if include_grid else None,
            # Backward-compatible fields for existing frontend consumers
            "cols": grid.width,
            "rows": grid.height,
            "heights": grid.elevations if include_grid else None,
            "width": grid.scene_width,
            "depth": grid.scene_depth,
            "terrainSource": self.metadata.source_name,
            "terrainProvider": self.metadata.source_type,
            "label": (
                "Real DEM"
                if self.metadata.terrain_type == "REAL"
                else "Demonstration Terrain"
                if self.metadata.terrain_type == "DEMONSTRATION"
                else "Terrain unavailable"
            ),
        }
