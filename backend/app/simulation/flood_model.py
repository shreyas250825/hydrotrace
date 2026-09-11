from __future__ import annotations

import math
from collections import deque

import numpy as np

from app.dams.catalog import SCENE, TERRAIN_DEPTH, TERRAIN_WIDTH, require_dam
from app.dams.providers import channel_half_width, infrastructure_for
from app.services.terrain import terrain_service


def scene_to_lnglat(dam: dict, x: float, z: float) -> dict[str, float]:
    deg = math.pi / 180
    bearing = dam["downstreamBearingDeg"] * deg
    across_bearing = bearing + math.pi / 2
    downstream = (z - SCENE["z"]) * dam["metersPerSceneUnit"]
    across = x * dam["metersPerSceneUnit"]
    d_north = math.cos(bearing) * downstream + math.cos(across_bearing) * across
    d_east = math.sin(bearing) * downstream + math.sin(across_bearing) * across
    lat0 = dam["latitude"]
    lat = lat0 + d_north / 111320
    lng = dam["longitude"] + d_east / (111320 * math.cos(lat0 * math.pi / 180))
    return {"lat": lat, "lng": lng}


def run_flood_model(payload: dict, dam_id: str = "bhakra") -> dict:
    dam = require_dam(dam_id)
    infra = infrastructure_for(dam_id)
    event_type = payload["eventType"]
    water_level = payload["damParameters"]["currentWaterLevelPercent"]
    breach_width = payload["breachParameters"]["widthMeters"]
    breach_depth = payload["breachParameters"]["depthMeters"]
    volume = payload["damParameters"]["reservoirVolumeMcm"]
    duration = payload["simulationSettings"]["durationHours"]

    # Authoritative terrain from TerrainService (REAL DEM or Demonstration)
    elev_flat, cols, rows, terrain_meta = terrain_service.analysis_elevations(dam_id)
    n = cols * rows
    if elev_flat.size != n:
        raise ValueError("Terrain grid size mismatch.")
    elev = elev_flat.reshape(n)
    xs = np.zeros(n, dtype=np.float32)
    zs = np.zeros(n, dtype=np.float32)

    for row in range(rows):
        z = (row / (rows - 1) - 0.5) * TERRAIN_DEPTH
        for col in range(cols):
            x = (col / (cols - 1) - 0.5) * TERRAIN_WIDTH
            i = row * cols + col
            xs[i] = x
            zs[i] = z

    is_break = event_type == "DAM_BREAK"
    level = water_level / 100.0
    width_f = min(1.8, breach_width / 80)
    depth_f = min(1.8, breach_depth / 40)
    volume_f = min(1.6, volume / 5000)
    release = (
        0.28 * level * width_f * depth_f * volume_f
        if is_break
        else 0.08 * level * min(1.2, width_f) * volume_f
    )
    max_cells = int(n * (0.08 + release * 0.22 if is_break else 0.028 + release * 0.07))
    head = SCENE["reservoirY"] * (0.72 + level * 0.28)
    spread = 3.4 if is_break else 1.25

    water = np.full(n, -1.0, dtype=np.float32)
    arrival = np.full(n, -1, dtype=np.int16)
    queue: deque[int] = deque()

    def seed(i: int, surface: float) -> None:
        if surface <= elev[i] + 0.05:
            return
        water[i] = surface
        arrival[i] = 0
        queue.append(i)

    for i in range(n):
        x = float(xs[i])
        z = float(zs[i])
        if abs(z - SCENE["z"]) >= 3.5:
            continue
        if is_break:
            if abs(x) < 2.4 and SCENE["z"] - 1.2 < z < SCENE["z"] + 4:
                seed(i, max(head, float(elev[i]) + 2.4))
        elif SCENE["z"] - 0.4 < z < SCENE["z"] + 7 and (
            (8 < x < 12.2) or abs(x) < 2.6
        ):
            seed(i, float(elev[i]) + 1.35 + head * 0.12)

    neigh = (-1, 1, -cols, cols, -cols - 1, -cols + 1, cols - 1, cols + 1)
    flooded = len(queue)
    max_arrival = 0

    while queue and flooded < max_cells:
        i = queue.popleft()
        col = i % cols
        row = i // cols
        surface = float(water[i])
        step = int(arrival[i])
        for d in neigh:
            j = i + d
            if j < 0 or j >= n:
                continue
            nc = j % cols
            nr = j // cols
            if abs(nc - col) > 1 or abs(nr - row) > 1:
                continue
            if zs[j] < SCENE["z"] - 4:
                continue
            half = channel_half_width(dam_id, float(zs[j])) * spread
            spillway = (
                not is_break
                and 5.5 < xs[j] < 13
                and zs[j] < SCENE["z"] + 22
            )
            if abs(xs[j]) > half + (6 if is_break else 2.2) and not spillway:
                continue
            drop = 0.07 + (0.04 if elev[j] < elev[i] else 0.12)
            next_surface = surface - drop
            if next_surface <= elev[j] + 0.08:
                continue
            if water[j] >= next_surface:
                continue
            was_dry = water[j] < 0
            water[j] = next_surface
            arrival[j] = step + 1
            max_arrival = max(max_arrival, step + 1)
            if was_dry:
                flooded += 1
                queue.append(j)

    cells = []
    max_depth_scene = 0.0
    depth_scale = dam["depthMetersPerSceneUnit"]
    for i in range(n):
        if water[i] < 0:
            continue
        depth_scene = max(0.0, float(water[i] - elev[i]))
        max_depth_scene = max(max_depth_scene, depth_scene)
        cells.append(
            {
                "col": i % cols,
                "row": i // cols,
                "x": float(xs[i]),
                "z": float(zs[i]),
                "depthScene": depth_scene,
                "depthM": depth_scene * depth_scale,
                "arrival": int(arrival[i]),
            }
        )

    cell_area = (
        (TERRAIN_WIDTH / cols)
        * (TERRAIN_DEPTH / rows)
        * dam["metersPerSceneUnit"] ** 2
    )
    inundated_km2 = (len(cells) * cell_area) / 1_000_000
    minutes_per_step = (
        (duration * 60) / max(8, max_arrival) if max_arrival > 0 else 0
    )
    max_depth_m = max_depth_scene * depth_scale
    peak_flow = math.sqrt(max(0.1, 9.81 * max_depth_m)) * (0.55 if is_break else 0.22)

    polygon = _envelope_polygon(dam, cells)
    assets = []
    for site in infra["sites"]:
        sample = _sample(site["x"], site["z"], cols, rows, water, elev, arrival, depth_scale)
        if not sample:
            continue
        priority = (
            "HIGH"
            if sample["depthM"] >= 4 or sample["arrival"] <= max_arrival * 0.28
            else "MEDIUM"
            if sample["depthM"] >= 1.6
            else "LOW"
        )
        geo = scene_to_lnglat(dam, site["x"], site["z"])
        assets.append(
            {
                **site,
                "lat": geo["lat"],
                "lng": geo["lng"],
                "depthM": sample["depthM"],
                "arrival": sample["arrival"],
                "priority": priority,
            }
        )

    roads = []
    for road in infra["roads"]:
        hit = 0
        for p in road["points"]:
            if _sample(p["x"], p["z"], cols, rows, water, elev, arrival, depth_scale):
                hit += 1
        share = hit / len(road["points"])
        if share <= 0:
            continue
        roads.append(
            {
                "id": road["id"],
                "name": road["name"],
                "exposedShare": share,
                "priority": "HIGH" if share >= 0.66 else "MEDIUM" if share >= 0.33 else "LOW",
            }
        )

    frames = []
    steps = 16
    for f in range(steps):
        cutoff = 0 if max_arrival == 0 else (f / (steps - 1)) * max_arrival
        subset = [c for c in cells if c["arrival"] <= cutoff]
        frames.append(
            {
                "t": f / (steps - 1),
                "cellCount": len(subset),
                "maxDepthM": max((c["depthM"] for c in subset), default=0.0),
            }
        )

    return {
        "damId": dam_id,
        "damName": dam["name"],
        "eventType": event_type,
        "terrainSource": terrain_meta.source_name,
        "terrainType": terrain_meta.terrain_type,
        "terrainMetadata": terrain_meta.to_dict(),
        "infrastructureDataset": infra["datasetLabel"],
        "metrics": {
            "inundatedAreaKm2": inundated_km2,
            "floodedCellCount": len(cells),
            "totalCells": n,
            "maxWaterDepthM": max_depth_m,
            "estimatedArrivalMin": max_arrival * minutes_per_step,
            "peakFlowScaleMs": peak_flow,
            "modelName": dam["modelName"],
            "modelNote": dam["modelNote"],
        },
        "flood_cells": cells,
        "flood_extent": polygon,
        "animation_frames": frames,
        "infrastructure_impact": {
            "assets": assets,
            "roads": roads,
            "datasetLabel": infra["datasetLabel"],
            "note": infra["note"],
        },
        "maxArrivalSteps": max_arrival,
    }


def _sample(x, z, cols, rows, water, elev, arrival, depth_scale):
    col = round((x / TERRAIN_WIDTH + 0.5) * (cols - 1))
    row = round((z / TERRAIN_DEPTH + 0.5) * (rows - 1))
    if col < 0 or row < 0 or col >= cols or row >= rows:
        return None
    i = row * cols + col
    if water[i] < 0:
        return None
    return {
        "depthM": max(0.0, float(water[i] - elev[i])) * depth_scale,
        "arrival": int(arrival[i]),
    }


def _envelope_polygon(dam: dict, cells: list[dict]) -> dict | None:
    if len(cells) < 3:
        return None
    by_row: dict[int, dict] = {}
    for cell in cells:
        cur = by_row.get(cell["row"])
        if not cur:
            by_row[cell["row"]] = {"minX": cell["x"], "maxX": cell["x"], "z": cell["z"]}
        else:
            cur["minX"] = min(cur["minX"], cell["x"])
            cur["maxX"] = max(cur["maxX"], cell["x"])
    rows = sorted(by_row.values(), key=lambda r: r["z"])
    left = [{"x": r["minX"], "z": r["z"]} for r in rows]
    right = [{"x": r["maxX"], "z": r["z"]} for r in reversed(rows)]
    ring = left + right + [left[0]]
    lng_lats = []
    lat_lngs = []
    for p in ring:
        g = scene_to_lnglat(dam, p["x"], p["z"])
        lng_lats.append([g["lng"], g["lat"]])
        lat_lngs.append([g["lat"], g["lng"]])

    try:
        from shapely.geometry import Polygon

        poly = Polygon(lng_lats)
        if poly.is_valid and not poly.is_empty:
            simplified = poly.simplify(0.00008, preserve_topology=True)
            if simplified.geom_type == "Polygon" and not simplified.is_empty:
                coords = list(simplified.exterior.coords)
                lng_lats = [[c[0], c[1]] for c in coords]
                lat_lngs = [[c[1], c[0]] for c in coords]
    except Exception:
        pass

    return {"latLngs": lat_lngs, "lngLats": lng_lats}
