"""Terrain and infrastructure providers keyed by dam_id."""

from __future__ import annotations

import math

from app.dams.catalog import SCENE, TERRAIN_DEPTH, TERRAIN_WIDTH, require_dam


def _seed(dam_id: str) -> float:
    return sum(ord(c) for c in dam_id) % 97 / 97.0


def terrain_height(dam_id: str, x: float, z: float) -> float:
    """Procedural demonstration elevation. Same conceptual world as flood fill."""
    dam = require_dam(dam_id)
    s = _seed(dam_id)
    ax = abs(x)
    downstream = z - SCENE["z"]
    valley_wall = max(0.0, ax - 10)
    mountains = (
        (valley_wall / 48) ** 1.28 * (24 + s * 6)
        + math.sin(x * 0.08 + z * 0.03 + s * 4) * 2.1 * min(1.0, ax / 32)
        + math.sin(x * 0.21 + s) * 0.8
    )
    far_ridge = (1 / (1 + math.exp(-(ax - 42) * 0.2))) * (10 + s * 3)
    basin = 0.0
    if z < SCENE["z"] - 3:
        t = min(1.0, (SCENE["z"] - 3 - z) / 48)
        basin = -(1 - min(1.0, ax / 26)) * (7.5 + s * 1.5) * t
    channel_w = 3.0 + s * 0.6 + max(0.0, downstream) * 0.07
    in_channel = math.exp(-(x * x) / (2 * channel_w * channel_w))
    channel = (
        -2.4 * in_channel * min(1.0, (downstream + 2) / 9) if downstream > -2 else 0.0
    )
    downhill = -downstream * (0.038 + s * 0.01) if downstream > 0 else 0.0
    noise = (
        math.sin(x * 0.41 + s * 3) * math.cos(z * 0.27) * 0.32
        + math.sin(x * 0.95 + z * 0.48 + s) * 0.11
    )
    # Preserve Bhakra flagship response closely when dam_id is bhakra.
    if dam["terrainProvider"] == "bhakra_fixture":
        from app.demo.terrain import terrain_height as bhakra_height

        return bhakra_height(x, z)
    return 6.2 + mountains + far_ridge + basin + channel + downhill + noise


def channel_half_width(dam_id: str, z: float) -> float:
    if dam_id == "bhakra":
        from app.demo.terrain import channel_half_width as bhakra_hw

        return bhakra_hw(z)
    s = _seed(dam_id)
    downstream = z - SCENE["z"]
    return 3.0 + s * 0.6 + max(0.0, downstream) * 0.07


def terrain_grid(dam_id: str, cols: int | None = None, rows: int | None = None) -> dict:
    dam = require_dam(dam_id)
    cols = cols or dam["grid"]["cols"]
    rows = rows or dam["grid"]["rows"]
    n = cols * rows
    heights = [0.0] * n
    for row in range(rows):
        z = (row / (rows - 1) - 0.5) * TERRAIN_DEPTH
        for col in range(cols):
            x = (col / (cols - 1) - 0.5) * TERRAIN_WIDTH
            heights[row * cols + col] = terrain_height(dam_id, x, z)
    return {
        "damId": dam_id,
        "width": TERRAIN_WIDTH,
        "depth": TERRAIN_DEPTH,
        "cols": cols,
        "rows": rows,
        "heights": heights,
        "terrainSource": dam["terrainSource"],
        "terrainProvider": dam["terrainProvider"],
        "label": "Demonstration Terrain",
    }


def infrastructure_for(dam_id: str) -> dict:
    dam = require_dam(dam_id)
    if dam_id == "bhakra":
        from app.demo.infrastructure import ROADS, SITES

        return {
            "damId": dam_id,
            "datasetLabel": "Demonstration Infrastructure Dataset",
            "note": (
                "Fixture sites and roads for the Bhakra flagship demonstration. "
                "Not live government infrastructure data."
            ),
            "sites": SITES,
            "roads": ROADS,
        }

    region = dam.get("downstreamRegion") or dam["name"]
    town = dam.get("nearestTown") or dam["name"]
    sites = [
        {"id": f"{dam_id}-core", "name": f"{town} settlement cluster", "category": "settlement", "x": -8.0, "z": 36},
        {"id": f"{dam_id}-west", "name": f"{town} west cluster", "category": "settlement", "x": -12.0, "z": 44},
        {"id": f"{dam_id}-hospital", "name": f"{town} clinic", "category": "hospital", "x": -7.0, "z": 34},
        {"id": f"{dam_id}-school", "name": f"{town} school", "category": "school", "x": -10.0, "z": 40},
        {"id": f"{dam_id}-power", "name": f"{region} substation", "category": "power", "x": 4.5, "z": 22},
        {"id": f"{dam_id}-bridge", "name": f"{region} road bridge", "category": "bridge", "x": 0.2, "z": 14},
        {"id": f"{dam_id}-emergency", "name": f"{town} emergency post", "category": "emergency", "x": -5.5, "z": 38},
        {"id": f"{dam_id}-market", "name": f"{town} market buildings", "category": "building", "x": -9.0, "z": 39},
        {"id": f"{dam_id}-farm", "name": f"{region} farmstead", "category": "building", "x": 11.0, "z": 48},
    ]
    roads = [
        {
            "id": f"{dam_id}-valley",
            "name": f"{region} valley access road",
            "points": [
                {"x": -2.8, "z": -4},
                {"x": -3.5, "z": 12},
                {"x": -5.0, "z": 28},
                {"x": -7.5, "z": 44},
                {"x": -9.5, "z": 58},
            ],
        },
        {
            "id": f"{dam_id}-cross",
            "name": f"{town} cross road",
            "points": [
                {"x": -14, "z": 38},
                {"x": -6, "z": 37},
                {"x": 2, "z": 36},
                {"x": 8, "z": 35},
            ],
        },
    ]
    return {
        "damId": dam_id,
        "datasetLabel": "Demonstration Infrastructure Dataset",
        "note": (
            "Synthetic downstream fixtures for HYDROTRACE case-study visualisation. "
            "Not live government infrastructure data."
        ),
        "sites": sites,
        "roads": roads,
    }
