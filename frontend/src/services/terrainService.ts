/**
 * Frontend terrain module.
 *
 * FALLBACK ONLY — authoritative simulation terrain lives on the backend
 * TerrainService. This module caches visualization grids and preserves the
 * offline procedural path when the API is unreachable.
 */
import type { TerrainApiResponse, TerrainStatusResponse } from '@/catalog/terrainTypes'
import { getActiveDamId } from '@/catalog/activeDam'
import { damApi } from '@/services/damApi'

export interface GeoBounds {
  south: number
  west: number
  north: number
  east: number
}

export interface ElevationGrid {
  cols: number
  rows: number
  cellSizeMeters: number
  values: Float32Array | null
  terrainType: 'REAL' | 'DEMONSTRATION' | 'UNAVAILABLE' | 'FALLBACK'
  sourceName: string
  sceneWidth: number
  sceneDepth: number
}

const vizCache = new Map<string, ElevationGrid>()
const statusCache = new Map<string, TerrainStatusResponse>()

function fromApi(payload: TerrainApiResponse): ElevationGrid {
  const heights = payload.heights ?? payload.grid?.elevations ?? []
  return {
    cols: payload.cols,
    rows: payload.rows,
    cellSizeMeters: payload.metadata?.resolution_meters ?? 0,
    values: new Float32Array(heights),
    terrainType: payload.terrain_type,
    sourceName: payload.terrainSource,
    sceneWidth: payload.width ?? payload.grid?.scene_width ?? 120,
    sceneDepth: payload.depth ?? payload.grid?.scene_depth ?? 160,
  }
}

export const terrainService = {
  /** Offline procedural path — not authoritative when API is up. */
  isFallbackOnly: () => true,
  isReady: (damId = getActiveDamId()) => vizCache.has(damId),

  getCachedViz: (damId = getActiveDamId()) => vizCache.get(damId) ?? null,
  getCachedStatus: (damId = getActiveDamId()) => statusCache.get(damId) ?? null,

  async loadStatus(damId: string): Promise<TerrainStatusResponse> {
    const status = await damApi.terrainStatus(damId)
    statusCache.set(damId, status)
    return status
  },

  async loadVizGrid(damId: string): Promise<ElevationGrid> {
    const payload = await damApi.terrain(damId, { purpose: 'viz', includeGrid: true })
    const grid = fromApi(payload)
    vizCache.set(damId, grid)
    statusCache.set(damId, {
      dam_id: damId,
      terrain_type: payload.terrain_type,
      source_type: payload.source_type,
      status: payload.status,
      source_name: payload.terrainSource,
      message: payload.metadata?.message ?? null,
      metadata: payload.metadata,
      has_real_dem: payload.terrain_type === 'REAL',
    })
    return grid
  },

  clear(damId: string) {
    vizCache.delete(damId)
    statusCache.delete(damId)
  },

  /** @deprecated Offline stub — DEM decode is backend-only. */
  loadElevationGrid: (_bounds: GeoBounds, _resolutionMeters: number): ElevationGrid => {
    throw new Error(
      'Frontend DEM decode is not implemented. Upload GeoTIFF via the backend TerrainService.',
    )
  },
}
