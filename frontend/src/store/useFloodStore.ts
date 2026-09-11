import {
  DEFAULT_GEOSPATIAL_LAYERS,
  DEFAULT_SCENE_LAYERS,
} from '@/config/defaults'
import { setActiveDam } from '@/catalog/activeDam'
import { BHAKRA_BOOTSTRAP } from '@/catalog/bootstrap'
import type { DamListItem, DamRecord, DataSourceStatus } from '@/catalog/types'
import { buildDeterministicReport } from '@/demo/buildReport'
import { rememberPrimaryFlood } from '@/demo/demoFloodModel'
import {
  controlledScenarioFromDam,
  DEMO_TOUR_STEPS,
  PROCESSING_STEPS,
  scenarioFromDam,
} from '@/demo/demoScenarios'
import { mapImpact } from '@/demo/mapImpact'
import { sceneToLngLat } from '@/demo/demoCoords'
import { damApi } from '@/services/damApi'
import { intelligenceService } from '@/services/intelligenceService'
import { simulationApi } from '@/services/simulationApi'
import { terrainService } from '@/services/terrainService'
import { vizRuntime } from '@/scene/vizRuntime'
import type {
  AppView,
  BreachParameters,
  BreachPhase,
  CameraMode,
  CameraView,
  ComparisonMetrics,
  ComparisonSlot,
  DamParameters,
  DataSourceMeta,
  DemoTourState,
  EventType,
  FloodCellGeo,
  FloodPolygon,
  FloodProductMode,
  GeoLocation,
  GeospatialLayers,
  ImpactAnalysisState,
  IntelligenceReportData,
  Scenario,
  SceneLayers,
  SimulationSettings,
  SimulationState,
  ValidationErrors,
} from '@/types/simulation'
import { cloneScenario } from '@/utils/scenario'
import { validateScenario } from '@/utils/validation'
import { create } from 'zustand'

const emptyResults = {
  maxFloodExtentKm2: null,
  maxWaterDepthM: null,
  peakFlowVelocityMs: null,
  estimatedArrivalTimeMin: null,
  floodedCellCount: null,
  modelName: null,
}

function dataSourcesFor(
  dam: DamRecord,
  terrainType: 'REAL' | 'DEMONSTRATION' | 'UNAVAILABLE' = 'DEMONSTRATION',
  terrainLabel?: string,
): DataSourceStatus {
  return {
    damMetadata: dam.incidentSource ?? 'Catalog / public records',
    terrain: terrainLabel ?? dam.terrainSource,
    terrainType,
    basemap: 'OpenStreetMap / Esri',
    satellite: 'Not connected',
    hydrodynamicModel: 'CURRENT DEMONSTRATION ENGINE — Terrain-Aware Demonstration Flood Model',
    infrastructure: 'DEMONSTRATION',
    gisExport: 'GeoJSON ✓ · KML ✓ · SHP COMING SOON',
  }
}

const initialDam = BHAKRA_BOOTSTRAP
setActiveDam(initialDam)
const initialScenario = cloneScenario(scenarioFromDam(initialDam, 'DAM_BREAK'))

const initialSimulation: SimulationState = {
  status: 'IDLE',
  progress: 0,
  stepLabel: null,
  results: { ...emptyResults },
  errorMessage: null,
}

const initialImpact: ImpactAnalysisState = {
  buildings: [],
  roads: [],
  infrastructure: [],
  settlements: [],
}

async function metricsFromScenario(scenario: Scenario): Promise<ComparisonMetrics> {
  const result = await simulationApi.run(scenario, {
    remember: false,
    damId: scenario.damId,
  })
  return {
    inundatedAreaKm2: result.inundatedAreaKm2,
    floodedCellCount: result.floodedCellCount,
    infrastructureCount: result.assets.length,
    maxWaterDepthM: result.maxWaterDepthM,
    estimatedArrivalMin: result.estimatedArrivalMin,
  }
}

function cellsToGeo(result: Awaited<ReturnType<typeof simulationApi.run>>): FloodCellGeo[] {
  const maxArrival = Math.max(1, result.maxArrivalSteps)
  const minutesPerStep =
    result.estimatedArrivalMin > 0 ? result.estimatedArrivalMin / maxArrival : 0
  return result.cells.map((cell) => {
    const g = sceneToLngLat(cell.x, cell.z)
    return {
      col: cell.col,
      row: cell.row,
      x: cell.x,
      z: cell.z,
      lat: g.lat,
      lng: g.lng,
      depthM: cell.depthM,
      depthScene: cell.depthScene,
      arrival: cell.arrival,
      arrivalMin: cell.arrival * minutesPerStep,
    }
  })
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function clearSimState() {
  vizRuntime.eventType = 'DAM_BREAK'
  vizRuntime.progress = 0
  vizRuntime.playing = false
  vizRuntime.breached = false
  return {
    simulation: { ...initialSimulation },
    impactAnalysis: { ...initialImpact },
    floodPolygon: null as FloodPolygon | null,
    floodCells: [] as FloodCellGeo[],
    timelineProgress: 0,
    comparisonResults: { A: null, B: null } as {
      A: ComparisonMetrics | null
      B: ComparisonMetrics | null
    },
    lastSimulationId: null as string | null,
    breachPhase: 'idle' as BreachPhase,
    intelligenceReport: null as IntelligenceReportData | null,
  }
}

interface FloodStore {
  currentView: AppView
  setCurrentView: (view: AppView) => void
  mapFitRequestId: number
  requestMapReset: () => void

  selectedDamId: string
  selectedDam: DamRecord
  damCatalog: DamListItem[]
  damLoading: boolean
  damError: string | null
  terrainSource: string
  terrainType: 'REAL' | 'DEMONSTRATION' | 'UNAVAILABLE'
  dataSourceStatus: DataSourceStatus
  loadDamCatalog: () => Promise<void>
  selectDam: (damId: string) => Promise<void>
  refreshTerrainStatus: () => Promise<void>
  uploadDemForSelectedDam: (file: File) => Promise<void>
  clearUploadedDem: () => Promise<void>
  resetScenarioDefaults: () => void

  scenario: Scenario
  updateLocation: (location: GeoLocation) => void
  updateEventType: (eventType: EventType) => void
  updateDamParameters: (partial: Partial<DamParameters>) => void
  updateBreachParameters: (partial: Partial<BreachParameters>) => void
  updateSimulationSettings: (partial: Partial<SimulationSettings>) => void
  registerDataSource: (meta: DataSourceMeta) => void
  removeDataSource: (id: string) => void
  loadDemoScenario: () => void

  comparison: { A: Scenario; B: Scenario }
  comparisonResults: { A: ComparisonMetrics | null; B: ComparisonMetrics | null }
  updateComparison: (slot: ComparisonSlot, partial: Partial<Scenario>) => void
  updateComparisonDam: (
    slot: ComparisonSlot,
    partial: Partial<DamParameters>,
  ) => void
  updateComparisonBreach: (
    slot: ComparisonSlot,
    partial: Partial<BreachParameters>,
  ) => void
  syncComparisonFromPrimary: () => void
  runComparison: () => void

  sceneLayers: SceneLayers
  toggleSceneLayer: (key: keyof SceneLayers) => void
  previewEventType: EventType
  setPreviewEventType: (eventType: EventType) => void
  cameraView: CameraView
  cameraNonce: number
  setCameraView: (view: CameraView) => void
  cameraMode: CameraMode
  setCameraMode: (mode: CameraMode) => void
  immersiveMode: boolean
  setImmersiveMode: (value: boolean) => void
  /** App-level chrome hide when any visualization workspace is fullscreen */
  workspaceFullscreen: boolean
  setWorkspaceFullscreen: (value: boolean) => void
  /** Global top-bar fullscreen request for visualization pages */
  fullscreenRequestId: number
  requestViewFullscreen: () => void
  cinematicActive: boolean
  startCinematic: () => void
  skipCinematic: () => void
  selectedAssetId: string | null
  setSelectedAssetId: (id: string | null) => void
  lastSimulationId: string | null
  breachPhase: BreachPhase
  initiateDamBreak: () => void

  geospatialLayers: GeospatialLayers
  toggleGeospatialLayer: (key: keyof GeospatialLayers) => void

  validationErrors: ValidationErrors
  clearValidationErrors: () => void
  runSimulationPrep: () => boolean
  runDemonstration: (options?: { stayOnView?: AppView }) => Promise<boolean>

  simulation: SimulationState
  impactAnalysis: ImpactAnalysisState
  floodPolygon: FloodPolygon | null
  floodCells: FloodCellGeo[]
  timelineProgress: number
  setTimelineProgress: (value: number) => void
  floodProductMode: FloodProductMode
  setFloodProductMode: (mode: FloodProductMode) => void
  terrainExaggeration: number
  setTerrainExaggeration: (value: number) => void
  intelligenceReport: IntelligenceReportData | null
  enhanceReport: () => Promise<void>
  enhancing: boolean

  demoTour: DemoTourState
  startDemoTour: () => void
  nextDemoStep: () => void
  prevDemoStep: () => void
  exitDemoTour: () => void
}

export const useFloodStore = create<FloodStore>((set, get) => ({
  currentView: 'overview',
  setCurrentView: (view) => set({ currentView: view }),
  mapFitRequestId: 1,
  requestMapReset: () =>
    set((state) => ({ mapFitRequestId: state.mapFitRequestId + 1 })),

  selectedDamId: initialDam.id,
  selectedDam: initialDam,
  damCatalog: [
    {
      id: initialDam.id,
      name: initialDam.name,
      officialName: initialDam.officialName,
      category: initialDam.category,
      state: initialDam.state,
      district: initialDam.district,
      river: initialDam.river,
      latitude: initialDam.latitude,
      longitude: initialDam.longitude,
      historicalIncidentYear: initialDam.historicalIncidentYear,
      incidentType: initialDam.incidentType,
      demoStatus: initialDam.demoStatus,
      terrainSource: initialDam.terrainSource,
      dataAvailability: initialDam.dataAvailability,
    },
  ],
  damLoading: false,
  damError: null,
  terrainSource: initialDam.terrainSource,
  terrainType: 'DEMONSTRATION',
  dataSourceStatus: dataSourcesFor(initialDam),

  loadDamCatalog: async () => {
    set({ damLoading: true, damError: null })
    try {
      const res = await damApi.list()
      set({ damCatalog: res.dams, damLoading: false })
      const current = get().selectedDamId
      if (!res.dams.some((d) => d.id === current)) {
        await get().selectDam('bhakra')
      } else {
        await get().refreshTerrainStatus()
        if (current === 'bhakra') {
          try {
            const full = await damApi.get(current)
            setActiveDam(full)
            set({ selectedDam: full })
          } catch {
            /* keep bootstrap */
          }
        }
      }
    } catch (error) {
      set({
        damLoading: false,
        damError:
          error instanceof Error
            ? error.message
            : 'Dam catalog unavailable — using offline Bhakra bootstrap.',
      })
    }
  },

  refreshTerrainStatus: async () => {
    const damId = get().selectedDamId
    try {
      const status = await terrainService.loadStatus(damId)
      void terrainService.loadVizGrid(damId).catch(() => undefined)
      set((state) => ({
        terrainSource: status.source_name,
        terrainType: status.terrain_type,
        dataSourceStatus: dataSourcesFor(
          state.selectedDam,
          status.terrain_type,
          status.source_name,
        ),
        damError: status.terrain_type === 'REAL' ? null : status.message,
      }))
    } catch {
      set((state) => ({
        terrainType: 'DEMONSTRATION',
        terrainSource: state.selectedDam.terrainSource,
        dataSourceStatus: dataSourcesFor(state.selectedDam),
        damError:
          'Real DEM unavailable for this case study. HYDROTRACE is using Demonstration Terrain.',
      }))
    }
  },

  uploadDemForSelectedDam: async (file: File) => {
    const damId = get().selectedDamId
    set({ damLoading: true, damError: null })
    try {
      await damApi.uploadDem(damId, file)
      terrainService.clear(damId)
      await get().refreshTerrainStatus()
      const { invalidateTerrainMeshCache } = await import('@/scene/heightField')
      invalidateTerrainMeshCache()
      set((state) => ({
        damLoading: false,
        mapFitRequestId: state.mapFitRequestId + 1,
        cameraNonce: state.cameraNonce + 1,
        ...clearSimState(),
      }))
    } catch (error) {
      set({
        damLoading: false,
        damError:
          error instanceof Error
            ? error.message
            : 'DEM upload failed. Demonstration Terrain remains active.',
      })
      throw error
    }
  },

  clearUploadedDem: async () => {
    const damId = get().selectedDamId
    await damApi.clearTerrain(damId)
    terrainService.clear(damId)
    await get().refreshTerrainStatus()
    set((state) => ({
      mapFitRequestId: state.mapFitRequestId + 1,
      cameraNonce: state.cameraNonce + 1,
      ...clearSimState(),
    }))
  },

  selectDam: async (damId: string) => {
    if (get().selectedDamId === damId && get().selectedDam.id === damId) {
      set((state) => ({ mapFitRequestId: state.mapFitRequestId + 1 }))
      return
    }
    set({ damLoading: true, damError: null })
    try {
      let dam: DamRecord
      try {
        dam = await damApi.get(damId)
      } catch {
        if (damId === 'bhakra') dam = BHAKRA_BOOTSTRAP
        else throw new Error(`Dam '${damId}' unavailable`)
      }
      setActiveDam(dam)
      terrainService.clear(get().selectedDamId)
      const primary = cloneScenario(scenarioFromDam(dam))
      const controlled = cloneScenario(controlledScenarioFromDam(dam))
      const featured = cloneScenario(scenarioFromDam(dam, 'DAM_BREAK'))
      set({
        selectedDamId: dam.id,
        selectedDam: dam,
        terrainSource: dam.terrainSource,
        terrainType: 'DEMONSTRATION',
        dataSourceStatus: dataSourcesFor(dam),
        scenario: primary,
        comparison: { A: controlled, B: featured },
        validationErrors: {},
        previewEventType: primary.eventType,
        damLoading: false,
        mapFitRequestId: get().mapFitRequestId + 1,
        cameraNonce: get().cameraNonce + 1,
        ...clearSimState(),
      })
      await get().refreshTerrainStatus()
    } catch (error) {
      set({
        damLoading: false,
        damError:
          error instanceof Error
            ? error.message
            : 'Failed to load dam — keeping previous selection.',
      })
    }
  },

  resetScenarioDefaults: () => {
    const dam = get().selectedDam
    const primary = cloneScenario(scenarioFromDam(dam))
    set({
      scenario: primary,
      comparison: {
        A: cloneScenario(controlledScenarioFromDam(dam)),
        B: cloneScenario(scenarioFromDam(dam, 'DAM_BREAK')),
      },
      previewEventType: primary.eventType,
      validationErrors: {},
      ...clearSimState(),
    })
  },

  scenario: initialScenario,

  updateLocation: (location) =>
    set((state) => {
      const validationErrors = { ...state.validationErrors }
      delete validationErrors.location
      return {
        scenario: { ...state.scenario, location },
        validationErrors,
      }
    }),

  updateEventType: (eventType) =>
    set((state) => ({
      scenario: { ...state.scenario, eventType },
      previewEventType: eventType,
    })),

  updateDamParameters: (partial) =>
    set((state) => ({
      scenario: {
        ...state.scenario,
        damParameters: { ...state.scenario.damParameters, ...partial },
      },
    })),

  updateBreachParameters: (partial) =>
    set((state) => ({
      scenario: {
        ...state.scenario,
        breachParameters: { ...state.scenario.breachParameters, ...partial },
      },
    })),

  updateSimulationSettings: (partial) =>
    set((state) => ({
      scenario: {
        ...state.scenario,
        simulationSettings: {
          ...state.scenario.simulationSettings,
          ...partial,
        },
      },
    })),

  registerDataSource: (meta) =>
    set((state) => ({
      scenario: {
        ...state.scenario,
        dataSources: [
          ...state.scenario.dataSources.filter(
            (item) => !(item.kind === meta.kind && item.name === meta.name),
          ),
          meta,
        ],
      },
    })),

  removeDataSource: (id) =>
    set((state) => ({
      scenario: {
        ...state.scenario,
        dataSources: state.scenario.dataSources.filter((item) => item.id !== id),
      },
    })),

  loadDemoScenario: () =>
    set((state) => {
      const dam = state.selectedDam
      const primary = cloneScenario(scenarioFromDam(dam, 'DAM_BREAK'))
      vizRuntime.eventType = 'DAM_BREAK'
      vizRuntime.progress = 0
      vizRuntime.playing = false
      vizRuntime.breached = false
      return {
        scenario: primary,
        comparison: {
          A: cloneScenario(controlledScenarioFromDam(dam)),
          B: cloneScenario(scenarioFromDam(dam, 'DAM_BREAK')),
        },
        comparisonResults: { A: null, B: null },
        validationErrors: {},
        simulation: { ...initialSimulation },
        impactAnalysis: { ...initialImpact },
        floodPolygon: null,
        intelligenceReport: null,
        currentView: 'scenario',
        mapFitRequestId: state.mapFitRequestId + 1,
        lastSimulationId: null,
        previewEventType: 'DAM_BREAK',
        breachPhase: 'idle',
      }
    }),

  comparison: {
    A: cloneScenario(controlledScenarioFromDam(initialDam)),
    B: cloneScenario(scenarioFromDam(initialDam, 'DAM_BREAK')),
  },
  comparisonResults: { A: null, B: null },

  updateComparison: (slot, partial) =>
    set((state) => ({
      comparison: {
        ...state.comparison,
        [slot]: { ...state.comparison[slot], ...partial },
      },
    })),

  updateComparisonDam: (slot, partial) =>
    set((state) => ({
      comparison: {
        ...state.comparison,
        [slot]: {
          ...state.comparison[slot],
          damParameters: {
            ...state.comparison[slot].damParameters,
            ...partial,
          },
        },
      },
    })),

  updateComparisonBreach: (slot, partial) =>
    set((state) => ({
      comparison: {
        ...state.comparison,
        [slot]: {
          ...state.comparison[slot],
          breachParameters: {
            ...state.comparison[slot].breachParameters,
            ...partial,
          },
        },
      },
    })),

  syncComparisonFromPrimary: () =>
    set((state) => ({
      comparison: {
        A: cloneScenario(state.scenario, 'CONTROLLED_RELEASE'),
        B: cloneScenario(state.scenario, 'DAM_BREAK'),
      },
    })),

  runComparison: async () => {
    const { comparison, scenario, selectedDamId } = get()
    const a = {
      ...comparison.A,
      damId: selectedDamId,
      location: comparison.A.location ?? scenario.location,
    }
    const b = {
      ...comparison.B,
      damId: selectedDamId,
      location: comparison.B.location ?? scenario.location,
    }
    const [A, B] = await Promise.all([metricsFromScenario(a), metricsFromScenario(b)])
    set({ comparisonResults: { A, B } })
  },

  sceneLayers: { ...DEFAULT_SCENE_LAYERS },
  toggleSceneLayer: (key) =>
    set((state) => ({
      sceneLayers: { ...state.sceneLayers, [key]: !state.sceneLayers[key] },
    })),
  previewEventType: 'DAM_BREAK',
  setPreviewEventType: (eventType) => set({ previewEventType: eventType }),
  cameraView: 'default',
  cameraNonce: 0,
  setCameraView: (view) =>
    set((state) => ({
      cameraView: view,
      cameraNonce: state.cameraNonce + 1,
      cameraMode: 'orbit',
      cinematicActive: false,
    })),
  cameraMode: 'orbit' as CameraMode,
  setCameraMode: (mode) => {
    vizRuntime.cameraMode = mode
    set((state) => ({
      cameraMode: mode,
      cinematicActive: mode === 'cinematic',
      cameraNonce: state.cameraNonce + 1,
    }))
  },
  immersiveMode: false,
  setImmersiveMode: (value) => set({ immersiveMode: value }),
  workspaceFullscreen: false,
  setWorkspaceFullscreen: (value) => set({ workspaceFullscreen: value }),
  fullscreenRequestId: 0,
  requestViewFullscreen: () =>
    set((state) => ({ fullscreenRequestId: state.fullscreenRequestId + 1 })),
  cinematicActive: false,
  startCinematic: () => {
    vizRuntime.cameraMode = 'cinematic'
    vizRuntime.cinematicT = 0
    set((state) => ({
      cameraMode: 'cinematic',
      cinematicActive: true,
      cameraView: 'aerial',
      cameraNonce: state.cameraNonce + 1,
    }))
  },
  skipCinematic: () => {
    vizRuntime.cameraMode = 'orbit'
    set((state) => ({
      cameraMode: 'orbit',
      cinematicActive: false,
      cameraView: 'downstream',
      cameraNonce: state.cameraNonce + 1,
    }))
  },
  selectedAssetId: null,
  setSelectedAssetId: (id) => set({ selectedAssetId: id }),
  lastSimulationId: null,
  breachPhase: 'idle',

  initiateDamBreak: () => {
    vizRuntime.eventType = 'DAM_BREAK'
    vizRuntime.progress = 0
    vizRuntime.playing = false
    vizRuntime.breached = false
    vizRuntime.cameraMode = 'orbit'
    set((state) => ({
      previewEventType: 'DAM_BREAK',
      scenario: { ...state.scenario, eventType: 'DAM_BREAK' },
      breachPhase: 'warning',
      currentView: 'command',
      cameraView: 'dam',
      cameraMode: 'orbit',
      cinematicActive: false,
      cameraNonce: state.cameraNonce + 1,
    }))
    window.setTimeout(() => {
      vizRuntime.breached = true
      set((state) => ({
        breachPhase: 'breach',
        cameraView: 'breach',
        cameraNonce: state.cameraNonce + 1,
      }))
    }, 1400)
    window.setTimeout(() => {
      vizRuntime.playing = true
      vizRuntime.cameraMode = 'cinematic'
      vizRuntime.cinematicT = 0
      set((state) => ({
        breachPhase: 'release',
        cameraMode: 'cinematic',
        cinematicActive: true,
        cameraNonce: state.cameraNonce + 1,
      }))
    }, 2400)
    window.setTimeout(() => {
      set({ breachPhase: 'flood' })
      const { simulation } = get()
      if (simulation.status !== 'COMPLETED' && simulation.status !== 'PROCESSING') {
        void get().runDemonstration({ stayOnView: 'command' })
      }
    }, 3200)
  },

  geospatialLayers: { ...DEFAULT_GEOSPATIAL_LAYERS },
  toggleGeospatialLayer: (key) =>
    set((state) => ({
      geospatialLayers: {
        ...state.geospatialLayers,
        [key]: !state.geospatialLayers[key],
      },
    })),

  validationErrors: {},
  clearValidationErrors: () => set({ validationErrors: {} }),

  runSimulationPrep: () => {
    const errors = validateScenario(get().scenario)
    if (Object.keys(errors).length > 0) {
      set({ validationErrors: errors })
      return false
    }
    void get().runDemonstration()
    return true
  },

  runDemonstration: async (options) => {
    const errors = validateScenario(get().scenario)
    if (Object.keys(errors).length > 0) {
      set({ validationErrors: errors, currentView: 'scenario' })
      return false
    }

    set((state) => ({
      validationErrors: {},
      scenario: {
        ...state.scenario,
        damId: state.selectedDamId,
        savedAt: new Date().toISOString(),
      },
      simulation: {
        status: 'PROCESSING',
        progress: 4,
        stepLabel: PROCESSING_STEPS[0].label,
        results: { ...emptyResults },
        errorMessage: null,
      },
      impactAnalysis: { ...initialImpact },
      floodPolygon: null,
      floodCells: [],
      timelineProgress: 0,
      intelligenceReport: null,
      comparisonResults: { A: null, B: null },
      previewEventType: state.scenario.eventType,
      currentView: options?.stayOnView ?? 'simulation',
    }))

    try {
      for (let i = 0; i < PROCESSING_STEPS.length; i += 1) {
        await sleep(160)
        set({
          simulation: {
            ...get().simulation,
            progress: Math.round(((i + 1) / PROCESSING_STEPS.length) * 88),
            stepLabel: PROCESSING_STEPS[i].label,
          },
        })
      }

      const scenario = { ...get().scenario, damId: get().selectedDamId }
      const result = await simulationApi.run(scenario, {
        remember: true,
        damId: get().selectedDamId,
      })
      rememberPrimaryFlood(result)
      const report = result.report ?? buildDeterministicReport(scenario, result)
      const maxArrival = Math.max(1, result.maxArrivalSteps)
      const minutesPerStep =
        result.estimatedArrivalMin > 0 ? result.estimatedArrivalMin / maxArrival : 0
      const comparison = get().comparison
      const aScenario = {
        ...comparison.A,
        damId: get().selectedDamId,
        location: comparison.A.location ?? scenario.location,
      }
      const bScenario = {
        ...comparison.B,
        damId: get().selectedDamId,
        location: comparison.B.location ?? scenario.location,
      }
      const [metricsA, metricsB] = await Promise.all([
        metricsFromScenario(aScenario),
        metricsFromScenario(bScenario),
      ])

      set({
        lastSimulationId: result.simulationId ?? null,
        simulation: {
          status: 'COMPLETED',
          progress: 100,
          stepLabel: 'Completed',
          errorMessage: null,
          results: {
            maxFloodExtentKm2: result.inundatedAreaKm2,
            maxWaterDepthM: result.maxWaterDepthM,
            // Not a solved velocity field — kept null in UI; raw scale not presented as velocity
            peakFlowVelocityMs: null,
            estimatedArrivalTimeMin: result.estimatedArrivalMin,
            floodedCellCount: result.floodedCellCount,
            modelName: result.modelName,
          },
        },
        impactAnalysis: mapImpact(result, minutesPerStep),
        floodPolygon: result.polygon,
        floodCells: cellsToGeo(result),
        timelineProgress: 1,
        intelligenceReport: report,
        comparisonResults: {
          A: metricsA,
          B: metricsB,
        },
      })

      vizRuntime.progress = 1
      if (scenario.eventType === 'DAM_BREAK') {
        vizRuntime.breached = true
      }
      vizRuntime.playing = false
      vizRuntime.eventType = scenario.eventType
      return true
    } catch (error) {
      set({
        simulation: {
          status: 'ERROR',
          progress: 0,
          stepLabel: null,
          results: { ...emptyResults },
          errorMessage:
            error instanceof Error ? error.message : 'Demonstration model failed.',
        },
      })
      return false
    }
  },

  simulation: initialSimulation,
  impactAnalysis: initialImpact,
  floodPolygon: null,
  floodCells: [],
  timelineProgress: 0,
  setTimelineProgress: (value) => {
    const v = Math.max(0, Math.min(1, value))
    vizRuntime.progress = v
    vizRuntime.playing = false
    set({ timelineProgress: v })
  },
  floodProductMode: 'depth' as FloodProductMode,
  setFloodProductMode: (mode) => set({ floodProductMode: mode }),
  terrainExaggeration: 1,
  setTerrainExaggeration: (value) =>
    set({ terrainExaggeration: Math.max(0.5, Math.min(3, value)) }),
  intelligenceReport: null,
  enhancing: false,

  enhanceReport: async () => {
    const report = get().intelligenceReport
    if (!report || !intelligenceService.isReady()) return
    set({ enhancing: true })
    try {
      const text = await intelligenceService.enhance(report)
      set({
        intelligenceReport: { ...report, enhancedNarrative: text },
        enhancing: false,
      })
    } catch {
      set({ enhancing: false })
    }
  },

  demoTour: { active: false, step: 0 },

  startDemoTour: () => {
    const dam = get().selectedDam
    const primary = cloneScenario(scenarioFromDam(dam, 'DAM_BREAK'))
    vizRuntime.eventType = 'DAM_BREAK'
    vizRuntime.progress = 0.12
    vizRuntime.playing = true
    vizRuntime.breached = false
    set((state) => ({
      scenario: primary,
      comparison: {
        A: cloneScenario(controlledScenarioFromDam(dam)),
        B: cloneScenario(scenarioFromDam(dam, 'DAM_BREAK')),
      },
      demoTour: { active: true, step: 0 },
      currentView: DEMO_TOUR_STEPS[0].view,
      previewEventType: 'DAM_BREAK',
      breachPhase: 'idle',
      mapFitRequestId: state.mapFitRequestId + 1,
    }))
  },

  nextDemoStep: () => {
    const { demoTour } = get()
    const next = Math.min(DEMO_TOUR_STEPS.length - 1, demoTour.step + 1)
    const step = DEMO_TOUR_STEPS[next]
    set({ demoTour: { active: true, step: next }, currentView: step.view })
    // Step 2 = simulation — run model if idle
    if (next === 2 && get().simulation.status !== 'COMPLETED' && get().simulation.status !== 'PROCESSING') {
      void get().runDemonstration({ stayOnView: 'simulation' })
    }
    // Step 5 = 3D — cinematic breach
    if (next === 5) {
      get().initiateDamBreak()
    }
    if (step.view === 'comparison' && !get().comparisonResults.A) {
      void get().runComparison()
    }
  },

  prevDemoStep: () => {
    const { demoTour } = get()
    const prev = Math.max(0, demoTour.step - 1)
    set({
      demoTour: { active: true, step: prev },
      currentView: DEMO_TOUR_STEPS[prev].view,
    })
  },

  exitDemoTour: () => set({ demoTour: { active: false, step: 0 } }),
}))
