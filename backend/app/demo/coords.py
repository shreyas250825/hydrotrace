import math

from app.demo.config import DAM_SCENE, DEMO_DAM

DEG = math.pi / 180


def scene_to_lnglat(x: float, z: float) -> dict[str, float]:
    bearing = DEMO_DAM["downstreamBearingDeg"] * DEG
    across_bearing = bearing + math.pi / 2
    downstream = (z - DAM_SCENE["z"]) * DEMO_DAM["metersPerSceneUnit"]
    across = x * DEMO_DAM["metersPerSceneUnit"]
    d_north = math.cos(bearing) * downstream + math.cos(across_bearing) * across
    d_east = math.sin(bearing) * downstream + math.sin(across_bearing) * across
    lat0 = DEMO_DAM["location"]["lat"]
    lat = lat0 + d_north / 111320
    lng = DEMO_DAM["location"]["lng"] + d_east / (111320 * math.cos(lat0 * math.pi / 180))
    return {"lat": lat, "lng": lng}
