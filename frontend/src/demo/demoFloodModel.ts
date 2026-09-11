import { DAM_SCENE, getDamConfig } from '@/demo/demoDamConfig'
import { sceneToLngLat } from '@/demo/demoCoords'
import {
  getDemoRoads,
  getDemoSites,
  type InfraCategory,
} from '@/demo/demoInfrastructure'
import { channelHalfWidth, terrainHeight, TERRAIN_DEPTH, TERRAIN_WIDTH } from '@/demo/demoTerrain'
import type { EventType, IntelligenceReportData } from '@/types/simulation'

export interface FloodCell {
  col: number
  row: number
  x: number
  z: number
  depthScene: number
  depthM: number
  arrival: number
}

export interface ExposedAsset {
  id: string
  name: string
  category: InfraCategory
  lat: number
  lng: number
  depthM: number
  arrival: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface ExposedRoad {
  id: string
  name: string
  exposedShare: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface FloodPolygonRing {
  /** Leaflet [lat, lng][] */
  latLngs: [number, number][]
  /** GeoJSON [lng, lat][] */
  lngLats: [number, number][]
}

export interface FloodAnimationFrame {
  t: number
  cellCount: number
  maxDepthM: number
}

export interface FloodModelResult {
  eventType: EventType
  modelName: string
  floodedCellCount: number
  totalCells: number
  inundatedAreaKm2: number
  maxWaterDepthM: number
  estimatedArrivalMin: number
  maxArrivalSteps: number
  peakFlowScaleMs: number
  cells: FloodCell[]
  polygon: FloodPolygonRing | null
  assets: ExposedAsset[]
  roads: ExposedRoad[]
  simulationId?: string
  animationFrames?: FloodAnimationFrame[]
  report?: IntelligenceReportData
}

interface RunInput {
  eventType: EventType
  waterLevelPercent: number
  breachWidthMeters: number
  breachDepthMeters: number
  reservoirVolumeMcm: number
  durationHours: number
}

const cache = new Map<string, FloodModelResult>()
let lastPrimary: FloodModelResult | null = null
let generation = 0

export function rememberPrimaryFlood(result: FloodModelResult) {
  lastPrimary = result
  generation += 1
}

export function floodGeneration(): number {
  return generation
}

export function getPrimaryFlood(): FloodModelResult | null {
  return lastPrimary
}

function cacheKey(input: RunInput): string {
  return [
    input.eventType,
    input.waterLevelPercent.toFixed(1),
    input.breachWidthMeters.toFixed(1),
    input.breachDepthMeters.toFixed(1),
    input.reservoirVolumeMcm.toFixed(0),
    input.durationHours.toFixed(1),
  ].join('|')
}

export function getCachedFlood(eventType?: EventType): FloodModelResult | null {
  if (eventType) {
    let found: FloodModelResult | null = null
    for (const value of cache.values()) {
      if (value.eventType === eventType) found = value
    }
    return found
  }
  return lastPrimary ?? [...cache.values()].at(-1) ?? null
}

export function runDemoFloodModel(input: RunInput): FloodModelResult {
  const key = cacheKey(input)
  const hit = cache.get(key)
  if (hit) return hit

  const cols = getDamConfig().grid.cols
  const rows = getDamConfig().grid.rows
  const n = cols * rows
  const elev = new Float32Array(n)
  const xs = new Float32Array(n)
  const zs = new Float32Array(n)

  for (let row = 0; row < rows; row += 1) {
    const z = (row / (rows - 1) - 0.5) * TERRAIN_DEPTH
    for (let col = 0; col < cols; col += 1) {
      const x = (col / (cols - 1) - 0.5) * TERRAIN_WIDTH
      const i = row * cols + col
      xs[i] = x
      zs[i] = z
      elev[i] = terrainHeight(x, z)
    }
  }

  const isBreak = input.eventType === 'DAM_BREAK'
  const level = input.waterLevelPercent / 100
  const widthF = Math.min(1.8, input.breachWidthMeters / 80)
  const depthF = Math.min(1.8, input.breachDepthMeters / 40)
  const volumeF = Math.min(1.6, input.reservoirVolumeMcm / 5000)
  const release = isBreak
    ? 0.28 * level * widthF * depthF * volumeF
    : 0.08 * level * Math.min(1.2, widthF) * volumeF
  const maxCells = Math.floor(
    n * (isBreak ? 0.08 + release * 0.22 : 0.028 + release * 0.07),
  )
  const head = DAM_SCENE.reservoirY * (0.72 + level * 0.28)
  const spread = isBreak ? 3.4 : 1.25

  const water = new Float32Array(n)
  const arrival = new Int16Array(n)
  water.fill(-1)
  arrival.fill(-1)

  const queue: number[] = []
  for (let i = 0; i < n; i += 1) {
    const x = xs[i]
    const z = zs[i]
    const nearDam = Math.abs(z - DAM_SCENE.z) < 3.5
    if (!nearDam) continue
    if (isBreak) {
      if (Math.abs(x) < 2.4 && z > DAM_SCENE.z - 1.2 && z < DAM_SCENE.z + 4) {
        seed(i, Math.max(head, elev[i] + 2.4))
      }
    } else if (
      z > DAM_SCENE.z - 0.4 &&
      z < DAM_SCENE.z + 7 &&
      ((x > 8 && x < 12.2) || Math.abs(x) < 2.6)
    ) {
      seed(i, elev[i] + 1.35 + head * 0.12)
    }
  }

  function seed(i: number, surface: number) {
    if (surface <= elev[i] + 0.05) return
    water[i] = surface
    arrival[i] = 0
    queue.push(i)
  }

  const neigh = [
    -1, 1, -cols, cols, -cols - 1, -cols + 1, cols - 1, cols + 1,
  ]
  let flooded = queue.length
  let cursor = 0
  let maxArrival = 0

  while (cursor < queue.length && flooded < maxCells) {
    const i = queue[cursor]
    cursor += 1
    const col = i % cols
    const row = Math.floor(i / cols)
    const surface = water[i]
    const step = arrival[i]

    for (const d of neigh) {
      const j = i + d
      if (j < 0 || j >= n) continue
      const nc = j % cols
      const nr = Math.floor(j / cols)
      if (Math.abs(nc - col) > 1 || Math.abs(nr - row) > 1) continue
      if (zs[j] < DAM_SCENE.z - 4) continue

      const half = channelHalfWidth(zs[j]) * spread
      const spillwayLane = !isBreak && xs[j] > 5.5 && xs[j] < 13 && zs[j] < DAM_SCENE.z + 22
      if (Math.abs(xs[j]) > half + (isBreak ? 6 : 2.2) && !spillwayLane) continue

      const drop = 0.07 + (elev[j] < elev[i] ? 0.04 : 0.12)
      const nextSurface = surface - drop
      if (nextSurface <= elev[j] + 0.08) continue
      if (water[j] >= nextSurface) continue

      const wasDry = water[j] < 0
      water[j] = nextSurface
      arrival[j] = step + 1
      maxArrival = Math.max(maxArrival, step + 1)
      if (wasDry) {
        flooded += 1
        queue.push(j)
      }
    }
  }

  const cells: FloodCell[] = []
  let maxDepthScene = 0
  for (let i = 0; i < n; i += 1) {
    if (water[i] < 0) continue
    const depthScene = Math.max(0, water[i] - elev[i])
    maxDepthScene = Math.max(maxDepthScene, depthScene)
    cells.push({
      col: i % cols,
      row: Math.floor(i / cols),
      x: xs[i],
      z: zs[i],
      depthScene,
      depthM: depthScene * getDamConfig().depthMetersPerSceneUnit,
      arrival: arrival[i],
    })
  }

  const cellAreaM2 =
    (TERRAIN_WIDTH / cols) *
    (TERRAIN_DEPTH / rows) *
    getDamConfig().metersPerSceneUnit *
    getDamConfig().metersPerSceneUnit
  const inundatedAreaKm2 = (cells.length * cellAreaM2) / 1_000_000
  const minutesPerStep =
    maxArrival > 0 ? (input.durationHours * 60) / Math.max(8, maxArrival) : 0
  const maxWaterDepthM = maxDepthScene * getDamConfig().depthMetersPerSceneUnit
  const peakFlowScaleMs = Math.sqrt(Math.max(0.1, 9.81 * maxWaterDepthM)) * (isBreak ? 0.55 : 0.22)

  const mask = new Uint8Array(n)
  for (const cell of cells) mask[cell.row * cols + cell.col] = 1
  const polygon =
    outlinePolygon(mask, cols, rows, xs, zs) ?? envelopePolygon(cells)

  const assets = getDemoSites().map((site) => {
    const sample = sampleAt(site.x, site.z, cols, rows, xs, zs, water, elev, arrival)
    if (!sample) return null
    const priority: ExposedAsset['priority'] =
      sample.depthM >= 4 || sample.arrival <= maxArrival * 0.28
        ? 'HIGH'
        : sample.depthM >= 1.6
          ? 'MEDIUM'
          : 'LOW'
    const geo = sceneToLngLat(site.x, site.z)
    return {
      id: site.id,
      name: site.name,
      category: site.category,
      lat: geo.lat,
      lng: geo.lng,
      depthM: sample.depthM,
      arrival: sample.arrival,
      priority,
    } satisfies ExposedAsset
  }).filter((item) => item !== null)

  const roads = getDemoRoads().map((road) => {
    let hit = 0
    for (const p of road.points) {
      if (sampleAt(p.x, p.z, cols, rows, xs, zs, water, elev, arrival)) hit += 1
    }
    const exposedShare = hit / road.points.length
    if (exposedShare <= 0) return null
    const priority: ExposedRoad['priority'] =
      exposedShare >= 0.66 ? 'HIGH' : exposedShare >= 0.33 ? 'MEDIUM' : 'LOW'
    return { id: road.id, name: road.name, exposedShare, priority }
  }).filter((item) => item !== null)

  const result: FloodModelResult = {
    eventType: input.eventType,
    modelName: getDamConfig().modelName,
    floodedCellCount: cells.length,
    totalCells: n,
    inundatedAreaKm2,
    maxWaterDepthM,
    estimatedArrivalMin: maxArrival * minutesPerStep,
    maxArrivalSteps: maxArrival,
    peakFlowScaleMs,
    cells,
    polygon,
    assets,
    roads,
  }
  cache.set(key, result)
  return result
}

function sampleAt(
  x: number,
  z: number,
  cols: number,
  rows: number,
  _xs: Float32Array,
  _zs: Float32Array,
  water: Float32Array,
  elev: Float32Array,
  arrival: Int16Array,
): { depthM: number; arrival: number } | null {
  const col = Math.round((x / TERRAIN_WIDTH + 0.5) * (cols - 1))
  const row = Math.round((z / TERRAIN_DEPTH + 0.5) * (rows - 1))
  if (col < 0 || row < 0 || col >= cols || row >= rows) return null
  const i = row * cols + col
  if (water[i] < 0) return null
  return {
    depthM: Math.max(0, water[i] - elev[i]) * getDamConfig().depthMetersPerSceneUnit,
    arrival: arrival[i],
  }
}

function envelopePolygon(cells: FloodCell[]): FloodPolygonRing | null {
  if (cells.length < 3) return null
  const byRow = new Map<number, { minX: number; maxX: number; z: number }>()
  for (const cell of cells) {
    const cur = byRow.get(cell.row)
    if (!cur) byRow.set(cell.row, { minX: cell.x, maxX: cell.x, z: cell.z })
    else {
      cur.minX = Math.min(cur.minX, cell.x)
      cur.maxX = Math.max(cur.maxX, cell.x)
    }
  }
  const rows = [...byRow.values()].sort((a, b) => a.z - b.z)
  const left = rows.map((r) => ({ x: r.minX, z: r.z }))
  const right = rows.map((r) => ({ x: r.maxX, z: r.z })).reverse()
  const ring = [...left, ...right, left[0]]
  const lngLats: [number, number][] = ring.map((p) => {
    const g = sceneToLngLat(p.x, p.z)
    return [g.lng, g.lat]
  })
  const latLngs: [number, number][] = ring.map((p) => {
    const g = sceneToLngLat(p.x, p.z)
    return [g.lat, g.lng]
  })
  return { latLngs, lngLats }
}

function outlinePolygon(
  mask: Uint8Array,
  cols: number,
  rows: number,
  xs: Float32Array,
  zs: Float32Array,
): FloodPolygonRing | null {
  const edgeMap = new Map<string, string>()
  const key = (x: number, z: number) => `${x.toFixed(3)},${z.toFixed(3)}`

  const addEdge = (ax: number, az: number, bx: number, bz: number) => {
    const a = key(ax, az)
    const b = key(bx, bz)
    if (edgeMap.get(b) === a) {
      edgeMap.delete(b)
      return
    }
    edgeMap.set(a, b)
  }

  const dx = TERRAIN_WIDTH / (cols - 1)
  const dz = TERRAIN_DEPTH / (rows - 1)

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (!mask[row * cols + col]) continue
      const x = xs[row * cols + col]
      const z = zs[row * cols + col]
      const hx = dx * 0.5
      const hz = dz * 0.5
      if (col === 0 || !mask[row * cols + col - 1])
        addEdge(x - hx, z - hz, x - hx, z + hz)
      if (col === cols - 1 || !mask[row * cols + col + 1])
        addEdge(x + hx, z + hz, x + hx, z - hz)
      if (row === 0 || !mask[(row - 1) * cols + col])
        addEdge(x + hx, z - hz, x - hx, z - hz)
      if (row === rows - 1 || !mask[(row + 1) * cols + col])
        addEdge(x - hx, z + hz, x + hx, z + hz)
    }
  }

  if (edgeMap.size < 3) return null
  let start = edgeMap.keys().next().value
  if (!start) return null
  const ring: { x: number; z: number }[] = []
  const seen = new Set<string>()
  let cur: string | undefined = start
  while (cur && !seen.has(cur)) {
    seen.add(cur)
    const [sx, sz] = cur.split(',').map(Number)
    ring.push({ x: sx, z: sz })
    cur = edgeMap.get(cur)
  }
  if (ring.length < 4) return null
  ring.push(ring[0])
  const lngLats: [number, number][] = ring.map((p) => {
    const g = sceneToLngLat(p.x, p.z)
    return [g.lng, g.lat]
  })
  const latLngs: [number, number][] = ring.map((p) => {
    const g = sceneToLngLat(p.x, p.z)
    return [g.lat, g.lng]
  })
  return { latLngs, lngLats }
}
