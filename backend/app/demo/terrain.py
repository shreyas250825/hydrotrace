import math

from app.demo.config import DAM_SCENE, TERRAIN_DEPTH, TERRAIN_WIDTH


def terrain_height(x: float, z: float) -> float:
    ax = abs(x)
    downstream = z - DAM_SCENE["z"]
    valley_wall = max(0.0, ax - 10)
    mountains = (
        (valley_wall / 48) ** 1.28 * 26
        + math.sin(x * 0.08 + z * 0.03) * 2.1 * min(1.0, ax / 32)
        + math.sin(x * 0.21) * 0.8
    )
    far_ridge = (1 / (1 + math.exp(-(ax - 42) * 0.2))) * 11
    basin = 0.0
    if z < DAM_SCENE["z"] - 3:
        t = min(1.0, (DAM_SCENE["z"] - 3 - z) / 48)
        basin = -(1 - min(1.0, ax / 26)) * 8.2 * t
    channel_w = 3.2 + max(0.0, downstream) * 0.07
    in_channel = math.exp(-(x * x) / (2 * channel_w * channel_w))
    channel = (
        -2.6 * in_channel * min(1.0, (downstream + 2) / 9) if downstream > -2 else 0.0
    )
    downhill = -downstream * 0.042 if downstream > 0 else 0.0
    noise = math.sin(x * 0.41) * math.cos(z * 0.27) * 0.32 + math.sin(x * 0.95 + z * 0.48) * 0.11
    return 6.4 + mountains + far_ridge + basin + channel + downhill + noise


def channel_half_width(z: float) -> float:
    downstream = z - DAM_SCENE["z"]
    return 3.2 + max(0.0, downstream) * 0.07


def terrain_grid(cols: int, rows: int) -> dict:
    n = cols * rows
    heights = [0.0] * n
    xs = [0.0] * n
    zs = [0.0] * n
    for row in range(rows):
        z = (row / (rows - 1) - 0.5) * TERRAIN_DEPTH
        for col in range(cols):
            x = (col / (cols - 1) - 0.5) * TERRAIN_WIDTH
            i = row * cols + col
            xs[i] = x
            zs[i] = z
            heights[i] = terrain_height(x, z)
    return {
        "width": TERRAIN_WIDTH,
        "depth": TERRAIN_DEPTH,
        "cols": cols,
        "rows": rows,
        "heights": heights,
        "xs": xs,
        "zs": zs,
    }
