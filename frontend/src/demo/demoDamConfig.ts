import { getActiveDam } from '@/catalog/activeDam'
import { BHAKRA_BOOTSTRAP } from '@/catalog/bootstrap'
import type { GeoLocation } from '@/types/simulation'

export const DAM_SCENE = {
  x: 0,
  z: -8,
  crestY: 13.1,
  reservoirY: 8.2,
} as const

export function getDamConfig() {
  const d = getActiveDam() ?? BHAKRA_BOOTSTRAP
  const label =
    d.reservoirName != null
      ? `${d.name}, ${d.reservoirName}`
      : `${d.name}, ${d.state}`
  return {
    id: d.id,
    name: d.name,
    reservoir: d.reservoirName ?? d.name,
    river: d.river ?? 'Data not available',
    region: d.district ? `${d.state} / ${d.district}` : d.state,
    nearestTown: d.nearestTown ?? d.downstreamRegion ?? d.state,
    location: {
      lat: d.latitude,
      lng: d.longitude,
      label,
    } satisfies GeoLocation,
    downstreamBearingDeg: d.downstreamBearingDeg,
    damHeightMeters: d.heightMetersVerified ?? d.scenarioDefaults.damParameters.heightMeters,
    reservoirVolumeMcm: d.scenarioDefaults.damParameters.reservoirVolumeMcm,
    metersPerSceneUnit: d.metersPerSceneUnit,
    depthMetersPerSceneUnit: d.depthMetersPerSceneUnit,
    grid: d.grid,
    modelName: d.modelName,
    modelNote: d.modelNote,
    terrainSource: d.terrainSource,
    category: d.category,
    historicalIncidentYear: d.historicalIncidentYear,
    incidentType: d.incidentType,
    state: d.state,
  }
}

/** Live config bound to the active dam (for legacy call sites). */
export const DEMO_DAM = new Proxy({} as ReturnType<typeof getDamConfig>, {
  get(_target, prop) {
    const cfg = getDamConfig()
    return cfg[prop as keyof typeof cfg]
  },
})
