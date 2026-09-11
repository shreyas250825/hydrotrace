export type AppView =
  | 'overview'
  | 'scenario'
  | 'geospatial'
  | 'command'
  | 'simulation'
  | 'comparison'
  | 'impact'
  | 'intelligence'
  | 'methodology'

export type SimulationStatus =
  | 'IDLE'
  | 'READY'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'ERROR'

export type EventType = 'CONTROLLED_RELEASE' | 'DAM_BREAK'

export type CameraView =
  | 'default'
  | 'dam'
  | 'reservoir'
  | 'breach'
  | 'downstream'
  | 'aerial'

export type CameraMode = 'orbit' | 'explore' | 'drone' | 'cinematic'

export type BreachPhase = 'idle' | 'warning' | 'breach' | 'release' | 'flood'

export type DataSourceKind = 'dem' | 'hydro' | 'satellite' | 'geojson' | 'gee'

export type ComparisonSlot = 'A' | 'B'

export type MapBasemap = 'osm' | 'satellite'

export interface GeoLocation {
  lat: number
  lng: number
  label: string
}

export interface DamParameters {
  heightMeters: number
  reservoirVolumeMcm: number
  currentWaterLevelPercent: number
}

export interface BreachParameters {
  widthMeters: number
  depthMeters: number
  formationTimeMinutes: number
  /** Explicit hydraulic head for Q = Cd A √(2gH). Null/undefined → derive from height × water level. */
  hydraulicHeadMeters?: number | null
  /** Demonstration discharge coefficient (default 0.60). Not site-calibrated. */
  dischargeCoefficient?: number
}

export interface SimulationSettings {
  durationHours: number
  gridResolutionMeters: number
}

/**
 * Metadata only. Binary rasters and large files live in geospatialService,
 * never in Zustand.
 */
export interface DataSourceMeta {
  id: string
  kind: DataSourceKind
  name: string
  format: string
  sizeBytes: number
  registeredAt: string
}

export interface Scenario {
  damId?: string
  location: GeoLocation | null
  eventType: EventType
  damParameters: DamParameters
  breachParameters: BreachParameters
  simulationSettings: SimulationSettings
  dataSources: DataSourceMeta[]
  savedAt: string | null
}

export interface SimulationResults {
  maxFloodExtentKm2: number | null
  maxWaterDepthM: number | null
  peakFlowVelocityMs: number | null
  estimatedArrivalTimeMin: number | null
  floodedCellCount: number | null
  modelName: string | null
}

export interface SimulationState {
  status: SimulationStatus
  progress: number
  stepLabel: string | null
  results: SimulationResults
  errorMessage: string | null
}

export interface ImpactItem {
  id: string
  name: string
  category: string
  depthM?: number
  arrivalMin?: number
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'
  lat?: number
  lng?: number
}

export interface ImpactAnalysisState {
  buildings: ImpactItem[]
  roads: ImpactItem[]
  infrastructure: ImpactItem[]
  settlements: ImpactItem[]
}

export interface FloodPolygon {
  latLngs: [number, number][]
  lngLats: [number, number][]
}

export interface FloodCellGeo {
  col: number
  row: number
  x: number
  z: number
  lat: number
  lng: number
  depthM: number
  depthScene: number
  arrival: number
  arrivalMin: number
}

export interface ComparisonMetrics {
  inundatedAreaKm2: number
  floodedCellCount: number
  infrastructureCount: number
  maxWaterDepthM: number
  estimatedArrivalMin?: number
}

export interface IntelligenceReportData {
  generatedAt: string
  modelNote: string
  executiveSummary: string
  floodOverview: string
  infrastructureExposure: string
  priorityZones: { level: 'HIGH' | 'MEDIUM' | 'LOW'; name: string; detail: string }[]
  recommendedActions: string[]
  enhancedNarrative: string | null
}

export interface DemoTourState {
  active: boolean
  step: number
}

export interface GeospatialLayers {
  terrain: boolean
  satellite: boolean
  dam: boolean
  reservoir: boolean
  infrastructure: boolean
  roads: boolean
  settlements: boolean
  floodExtent: boolean
  floodDepth: boolean
  floodArrival: boolean
  hillshade: boolean
  slope: boolean
}

export type FloodProductMode = 'extent' | 'depth' | 'arrival'

export interface SceneLayers {
  terrain: boolean
  water: boolean
  dam: boolean
  floodPreview: boolean
  buildings: boolean
  roads: boolean
  infrastructure: boolean
  vegetation: boolean
  riskZones: boolean
  flowAnalysis: boolean
}

export type ValidationErrors = Record<string, string>
