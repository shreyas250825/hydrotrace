import type {
  BreachParameters,
  DamParameters,
  EventType,
  GeoLocation,
  GeospatialLayers,
  SceneLayers,
  SimulationSettings,
} from '@/types/simulation'

/**
 * Default map framing and demo values live here so the product is not
 * hardcoded to a single dam. Swap these to target any reservoir region.
 */
export const MAP_CONFIG = {
  defaultCenter: { lat: 31.4104, lng: 76.4332 },
  defaultZoom: 11,
  minZoom: 5,
  maxZoom: 16,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
} as const

export const SATELLITE_MAP_CONFIG = {
  tileUrl:
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Tiles © Esri — Earthstar Geographics',
} as const

export const DEMO_LOCATION: GeoLocation = {
  lat: 31.4104,
  lng: 76.4332,
  label: 'Bhakra Dam region, Himachal Pradesh',
}

export const DEFAULT_EVENT_TYPE: EventType = 'DAM_BREAK'

export const DEFAULT_DAM_PARAMETERS: DamParameters = {
  heightMeters: 140,
  reservoirVolumeMcm: 2500,
  currentWaterLevelPercent: 80,
}

export const DEFAULT_BREACH_PARAMETERS: BreachParameters = {
  widthMeters: 80,
  depthMeters: 40,
  formationTimeMinutes: 30,
  hydraulicHeadMeters: null,
  dischargeCoefficient: 0.6,
}

export const DEFAULT_SIMULATION_SETTINGS: SimulationSettings = {
  durationHours: 6,
  gridResolutionMeters: 50,
}

export const DEMO_DAM_PARAMETERS: DamParameters = {
  heightMeters: 226,
  reservoirVolumeMcm: 9340,
  currentWaterLevelPercent: 82,
}

export const DEMO_BREACH_PARAMETERS: BreachParameters = {
  widthMeters: 120,
  depthMeters: 55,
  formationTimeMinutes: 25,
  hydraulicHeadMeters: null,
  dischargeCoefficient: 0.6,
}

export const DEMO_SIMULATION_SETTINGS: SimulationSettings = {
  durationHours: 8,
  gridResolutionMeters: 30,
}

export const GRID_RESOLUTION_OPTIONS = [10, 30, 50, 90, 250] as const

export const PARAM_BOUNDS = {
  heightMeters: { min: 5, max: 400 },
  reservoirVolumeMcm: { min: 0.1, max: 50000 },
  currentWaterLevelPercent: { min: 1, max: 100 },
  widthMeters: { min: 5, max: 2000 },
  depthMeters: { min: 1, max: 400 },
  formationTimeMinutes: { min: 1, max: 1440 },
  hydraulicHeadMeters: { min: 0.5, max: 400 },
  dischargeCoefficient: { min: 0.1, max: 1.2 },
  durationHours: { min: 1, max: 72 },
} as const

export const DEFAULT_SCENE_LAYERS: SceneLayers = {
  terrain: true,
  water: true,
  dam: true,
  floodPreview: true,
  buildings: true,
  roads: true,
  infrastructure: true,
  vegetation: true,
  riskZones: true,
  flowAnalysis: false,
}

export const DEFAULT_GEOSPATIAL_LAYERS: GeospatialLayers = {
  terrain: true,
  satellite: false,
  dam: true,
  reservoir: true,
  infrastructure: true,
  roads: true,
  settlements: true,
  floodExtent: true,
  floodDepth: false,
  floodArrival: false,
  hillshade: false,
  slope: false,
}
