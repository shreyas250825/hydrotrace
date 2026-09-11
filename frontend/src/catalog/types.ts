export type DamCategory = 'demo_reference' | 'historical_case_study'

export interface DamScenarioDefaults {
  eventType: 'CONTROLLED_RELEASE' | 'DAM_BREAK'
  damParameters: {
    heightMeters: number
    reservoirVolumeMcm: number
    currentWaterLevelPercent: number
  }
  breachParameters: {
    widthMeters: number
    depthMeters: number
    formationTimeMinutes: number
    hydraulicHeadMeters?: number | null
    dischargeCoefficient?: number
  }
  simulationSettings: {
    durationHours: number
    gridResolutionMeters: number
  }
  defaultsLabel: string
  defaultsNote: string
}

export interface DamRecord {
  id: string
  name: string
  officialName: string | null
  category: DamCategory
  state: string
  district: string | null
  river: string | null
  basin: string | null
  latitude: number
  longitude: number
  completionYear: number | null
  damType: string | null
  heightMetersVerified: number | null
  reservoirName: string | null
  historicalIncidentYear: number | null
  incidentType: string | null
  incidentDescription: string | null
  incidentSource: string | null
  officialSourceUrl: string | null
  terrainSource: string
  terrainProvider: string
  dataAvailability: string
  demoStatus: string
  downstreamRegion: string | null
  nearestTown: string | null
  downstreamBearingDeg: number
  metersPerSceneUnit: number
  depthMetersPerSceneUnit: number
  grid: { cols: number; rows: number }
  coordinateNote: string | null
  modelName: string
  modelNote: string
  scenarioDefaults: DamScenarioDefaults
}

export interface DamListItem {
  id: string
  name: string
  officialName: string | null
  category: DamCategory
  state: string
  district: string | null
  river: string | null
  latitude: number
  longitude: number
  historicalIncidentYear: number | null
  incidentType: string | null
  demoStatus: string
  terrainSource: string
  dataAvailability: string
}

export interface DataSourceStatus {
  damMetadata: string
  terrain: string
  terrainType: 'REAL' | 'DEMONSTRATION' | 'UNAVAILABLE'
  basemap: string
  satellite: string
  hydrodynamicModel: string
  infrastructure: string
  gisExport: string
}
