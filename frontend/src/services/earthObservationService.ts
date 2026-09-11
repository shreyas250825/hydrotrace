/**
 * Earth Observation provider abstraction.
 * Does NOT fabricate GEE imagery. Status is CONNECTED only after real auth + request success.
 */
export type EarthObservationStatus =
  | 'CONNECTED'
  | 'NOT_CONFIGURED'
  | 'NOT_AUTHENTICATED'
  | 'FALLBACK'

export interface EarthObservationCapability {
  status: EarthObservationStatus
  label: string
  provider: 'Google Earth Engine' | 'None'
  datasets: { id: string; name: string; requiresAuth: boolean }[]
  message: string
}

export interface EarthObservationLayerResult {
  ok: false
  status: EarthObservationStatus
  reason: string
}

const DATASETS = [
  { id: 'COPERNICUS/S2_SR_HARMONIZED', name: 'Sentinel-2 SR (planned)', requiresAuth: true },
  { id: 'LANDSAT/LC08/C02/T1_L2', name: 'Landsat 8 L2 (planned)', requiresAuth: true },
  { id: 'JRC/GSW1_4/GlobalSurfaceWater', name: 'JRC Global Surface Water (planned)', requiresAuth: true },
  { id: 'ESA/WorldCover/v200', name: 'ESA WorldCover (planned)', requiresAuth: true },
] as const

function configuredFromEnv(): boolean {
  const key = import.meta.env.VITE_GEE_PROJECT_ID
  const token = import.meta.env.VITE_GEE_ACCESS_TOKEN
  return Boolean(key || token)
}

export const earthObservationService = {
  capability(): EarthObservationCapability {
    if (!configuredFromEnv()) {
      return {
        status: 'NOT_CONFIGURED',
        label: 'Optional Earth Observation Provider',
        provider: 'Google Earth Engine',
        datasets: [...DATASETS],
        message:
          'Google Earth Engine integration available when configured. Primary demo basemaps remain OpenStreetMap / Esri.',
      }
    }
    return {
      status: 'NOT_AUTHENTICATED',
      label: 'Optional Earth Observation Provider',
      provider: 'Google Earth Engine',
      datasets: [...DATASETS],
      message:
        'Environment hints are present. Live Earth Engine session is optional and not required for this demo.',
    }
  },

  status(): EarthObservationStatus {
    return this.capability().status
  },

  isConnected(): boolean {
    return this.status() === 'CONNECTED'
  },

  getAvailableDatasets() {
    return this.capability().datasets
  },

  getSatelliteImage(_opts?: { damId?: string }): EarthObservationLayerResult {
    const cap = this.capability()
    return {
      ok: false,
      status: cap.status,
      reason: 'Satellite image request requires an authenticated Earth Engine session.',
    }
  },

  getWaterMask(_opts?: { damId?: string }): EarthObservationLayerResult {
    const cap = this.capability()
    return {
      ok: false,
      status: cap.status,
      reason: 'Water mask requires an authenticated Earth Engine session.',
    }
  },

  getLandCover(_opts?: { damId?: string }): EarthObservationLayerResult {
    const cap = this.capability()
    return {
      ok: false,
      status: cap.status,
      reason: 'Land cover requires an authenticated Earth Engine session.',
    }
  },

  getTerrainMetadata(_opts?: { damId?: string }): EarthObservationLayerResult {
    const cap = this.capability()
    return {
      ok: false,
      status: cap.status,
      reason:
        'GEE terrain metadata is optional. Use TerrainService (uploaded GeoTIFF or Demonstration Terrain).',
    }
  },
}

/** @deprecated Prefer earthObservationService — kept for existing call sites. */
export const geeService = {
  isAuthenticated: () => earthObservationService.isConnected(),
  isConfigured: () => earthObservationService.status() !== 'NOT_CONFIGURED',
  viewerMode: () =>
    earthObservationService.isConnected()
      ? ('gee-live' as const)
      : ('leaflet-fallback' as const),
  connect: (): never => {
    throw new Error(
      'Google Earth Engine is optional. Credentials are not connected in this demo.',
    )
  },
  loadLayer: (_assetId: string): never => {
    throw new Error('geeService.loadLayer requires a connected Earth Engine session.')
  },
  capability: () => earthObservationService.capability(),
}
