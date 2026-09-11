DEMO_DAM = {
    "id": "bhakra",
    "name": "Bhakra Dam",
    "reservoir": "Gobind Sagar",
    "river": "Sutlej",
    "region": "Himachal Pradesh / Punjab border",
    "nearestTown": "Nangal",
    "location": {
        "lat": 31.4104,
        "lng": 76.4332,
        "label": "Bhakra Dam, Gobind Sagar",
    },
    "downstreamBearingDeg": 210,
    "damHeightMeters": 226,
    "reservoirVolumeMcm": 9340,
    "metersPerSceneUnit": 72,
    "depthMetersPerSceneUnit": 3.2,
    "grid": {"cols": 72, "rows": 96},
    "modelName": "Terrain-Aware Demonstration Flood Model",
    "modelNote": (
        "A simplified deterministic fill that prefers downhill neighbours on a bundled "
        "elevation grid. It is not a calibrated hydrodynamic solver."
    ),
}

DAM_SCENE = {"x": 0.0, "z": -8.0, "crestY": 13.1, "reservoirY": 8.2}
TERRAIN_WIDTH = 120.0
TERRAIN_DEPTH = 160.0
