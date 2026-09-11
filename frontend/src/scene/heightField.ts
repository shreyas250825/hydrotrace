import { getActiveDamId } from '@/catalog/activeDam'
import { terrainHeight, TERRAIN_DEPTH, TERRAIN_WIDTH } from '@/demo/demoTerrain'
import { terrainService } from '@/services/terrainService'

export { TERRAIN_DEPTH, TERRAIN_WIDTH, terrainHeight }

function colorForHeight(h: number, x: number, z: number): [number, number, number] {
  const ax = Math.abs(x)
  const inChannel = ax < 6.5 && z > -10
  const wet = ax < 11 && z > -6
  const n =
    Math.sin(x * 0.37) * Math.cos(z * 0.29) * 0.022 +
    Math.sin(x * 1.1 + z * 0.6) * 0.012
  // Subtle contour banding for engineered technical-illustration look
  const band = Math.abs(Math.sin(h * 0.85)) * 0.035
  const shade = 0.97 + n * 1.4 - band

  let r: number
  let g: number
  let b: number
  if (inChannel) {
    r = 0.42 + n
    g = 0.52
    b = 0.34
  } else if (h < 2.2 || wet) {
    r = 0.48 + n
    g = 0.56
    b = 0.38
  } else if (h < 6.4) {
    r = 0.5 + n
    g = 0.58
    b = 0.4
  } else if (h < 10.5) {
    r = 0.56 + n
    g = 0.54
    b = 0.42
  } else if (h < 16) {
    r = 0.62 + n
    g = 0.58
    b = 0.48
  } else if (h < 22) {
    r = 0.66
    g = 0.64
    b = 0.58
  } else {
    r = 0.7
    g = 0.72
    b = 0.74
  }
  return [
    Math.min(1, Math.max(0, r * shade)),
    Math.min(1, Math.max(0, g * shade)),
    Math.min(1, Math.max(0, b * shade)),
  ]
}

function sampleCachedHeight(x: number, z: number): number {
  const grid = terrainService.getCachedViz(getActiveDamId())
  if (!grid?.values || grid.values.length === 0) {
    return terrainHeight(x, z) // FALLBACK procedural
  }
  const w = grid.sceneWidth || TERRAIN_WIDTH
  const d = grid.sceneDepth || TERRAIN_DEPTH
  const colF = (x / w + 0.5) * (grid.cols - 1)
  const rowF = (z / d + 0.5) * (grid.rows - 1)
  const c0 = Math.max(0, Math.min(grid.cols - 1, Math.floor(colF)))
  const r0 = Math.max(0, Math.min(grid.rows - 1, Math.floor(rowF)))
  const c1 = Math.min(grid.cols - 1, c0 + 1)
  const r1 = Math.min(grid.rows - 1, r0 + 1)
  const tc = colF - c0
  const tr = rowF - r0
  const v = grid.values
  const v00 = v[r0 * grid.cols + c0]
  const v10 = v[r0 * grid.cols + c1]
  const v01 = v[r1 * grid.cols + c0]
  const v11 = v[r1 * grid.cols + c1]
  return (
    v00 * (1 - tc) * (1 - tr) +
    v10 * tc * (1 - tr) +
    v01 * (1 - tc) * tr +
    v11 * tc * tr
  )
}

interface CachedTerrain {
  key: string
  positions: Float32Array
  colors: Float32Array
  indices: Uint32Array
  count: number
}

let cache: CachedTerrain | null = null

export function invalidateTerrainMeshCache() {
  cache = null
}

export function getDemoTerrainBuffers(segX: number, segZ: number): CachedTerrain {
  const viz = terrainService.getCachedViz(getActiveDamId())
  const key = `${getActiveDamId()}:${viz?.terrainType ?? 'FALLBACK'}:${viz?.values?.length ?? 0}:${segX}x${segZ}`
  if (cache?.key === key) return cache

  const vertsX = segX + 1
  const vertsZ = segZ + 1
  const positions = new Float32Array(vertsX * vertsZ * 3)
  const colors = new Float32Array(vertsX * vertsZ * 3)
  const indices = new Uint32Array(segX * segZ * 6)

  let i = 0
  let c = 0
  for (let iz = 0; iz < vertsZ; iz += 1) {
    const z = (iz / segZ - 0.5) * TERRAIN_DEPTH
    for (let ix = 0; ix < vertsX; ix += 1) {
      const x = (ix / segX - 0.5) * TERRAIN_WIDTH
      const y = sampleCachedHeight(x, z)
      positions[i] = x
      positions[i + 1] = y
      positions[i + 2] = z
      i += 3
      const [r, g, b] = colorForHeight(y, x, z)
      colors[c] = r
      colors[c + 1] = g
      colors[c + 2] = b
      c += 3
    }
  }

  let t = 0
  for (let iz = 0; iz < segZ; iz += 1) {
    for (let ix = 0; ix < segX; ix += 1) {
      const a = iz * vertsX + ix
      const b = a + 1
      const d = a + vertsX
      const e = d + 1
      indices[t] = a
      indices[t + 1] = d
      indices[t + 2] = b
      indices[t + 3] = b
      indices[t + 4] = d
      indices[t + 5] = e
      t += 6
    }
  }

  cache = { key, positions, colors, indices, count: vertsX * vertsZ }
  return cache
}
