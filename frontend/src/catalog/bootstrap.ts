import type { DamRecord } from '@/catalog/types'

/** Offline bootstrap catalog (Bhakra). Full catalog loads from GET /api/dams. */
export const BHAKRA_BOOTSTRAP: DamRecord = {
  id: 'bhakra',
  name: 'Bhakra Dam',
  officialName: 'Bhakra Dam',
  category: 'demo_reference',
  state: 'Himachal Pradesh',
  district: 'Bilaspur / border with Punjab',
  river: 'Sutlej',
  basin: 'Indus',
  latitude: 31.4104,
  longitude: 76.4332,
  completionYear: 1963,
  damType: 'Concrete gravity',
  heightMetersVerified: 226,
  reservoirName: 'Gobind Sagar',
  historicalIncidentYear: null,
  incidentType: null,
  incidentDescription: null,
  incidentSource: null,
  officialSourceUrl: null,
  terrainSource: 'Demonstration Terrain (Bhakra flagship fixture)',
  terrainProvider: 'bhakra_fixture',
  dataAvailability: 'demo_complete',
  demoStatus: 'flagship_demo',
  downstreamRegion: 'Sutlej valley toward Nangal',
  nearestTown: 'Nangal',
  downstreamBearingDeg: 210,
  metersPerSceneUnit: 72,
  depthMetersPerSceneUnit: 3.2,
  grid: { cols: 72, rows: 96 },
  coordinateNote:
    'Existing HYDROTRACE flagship demonstration coordinates (public geographic framing).',
  modelName: 'Terrain-Aware Demonstration Flood Model',
  modelNote:
    'A simplified deterministic fill that prefers downhill neighbours on a bundled elevation grid. It is not a calibrated hydrodynamic solver.',
  scenarioDefaults: {
    eventType: 'DAM_BREAK',
    damParameters: {
      heightMeters: 226,
      reservoirVolumeMcm: 9340,
      currentWaterLevelPercent: 82,
    },
    breachParameters: {
      widthMeters: 120,
      depthMeters: 55,
      formationTimeMinutes: 25,
      hydraulicHeadMeters: null,
      dischargeCoefficient: 0.6,
    },
    simulationSettings: {
      durationHours: 8,
      gridResolutionMeters: 80,
    },
    defaultsLabel: 'Demonstration Scenario Defaults (Bhakra flagship)',
    defaultsNote:
      'Flagship demonstration parameters for terrain-aware flood propagation on the Bhakra case study.',
  },
}

export const CASE_STUDY_DISCLAIMER =
  'Initial HYDROTRACE case-study set based on historically documented dam-failure records. Inclusion does not imply current structural unsafety.'

export function displayField(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Data not available'
  return String(value)
}
