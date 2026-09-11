import { rememberPrimaryFlood, type FloodModelResult } from '@/demo/demoFloodModel'
import { simulationService } from '@/services/simulationService'
import { apiGet, apiGetText, apiPost } from '@/services/api'
import type {
  IntelligenceReportData,
  Scenario,
} from '@/types/simulation'

interface BackendCell {
  col: number
  row: number
  x: number
  z: number
  depthScene: number
  depthM: number
  arrival: number
}

interface BackendResult {
  simulation_id: string
  status: string
  eventType: Scenario['eventType']
  metrics: {
    inundatedAreaKm2: number
    floodedCellCount: number
    totalCells: number
    maxWaterDepthM: number
    estimatedArrivalMin: number
    peakFlowScaleMs: number
    modelName: string
    modelNote: string
  }
  flood_cells: BackendCell[]
  flood_extent: { latLngs: [number, number][]; lngLats: [number, number][] } | null
  animation_frames: { t: number; cellCount: number; maxDepthM: number }[]
  infrastructure_impact: {
    assets: FloodModelResult['assets']
    roads: FloodModelResult['roads']
  }
  report: Omit<IntelligenceReportData, 'enhancedNarrative'>
  maxArrivalSteps?: number
}

function mapResult(raw: BackendResult): FloodModelResult {
  return {
    eventType: raw.eventType,
    modelName: raw.metrics.modelName,
    floodedCellCount: raw.metrics.floodedCellCount,
    totalCells: raw.metrics.totalCells,
    inundatedAreaKm2: raw.metrics.inundatedAreaKm2,
    maxWaterDepthM: raw.metrics.maxWaterDepthM,
    estimatedArrivalMin: raw.metrics.estimatedArrivalMin,
    maxArrivalSteps: raw.maxArrivalSteps ?? 1,
    peakFlowScaleMs: raw.metrics.peakFlowScaleMs,
    cells: raw.flood_cells,
    polygon: raw.flood_extent,
    assets: raw.infrastructure_impact.assets,
    roads: raw.infrastructure_impact.roads,
    simulationId: raw.simulation_id,
    animationFrames: raw.animation_frames,
    report: { ...raw.report, enhancedNarrative: null },
  }
}

export const simulationApi = {
  run: async (
    scenario: Scenario,
    options?: { remember?: boolean; damId?: string },
  ): Promise<FloodModelResult> => {
    const damId = options?.damId ?? scenario.damId ?? 'bhakra'
    try {
      const raw = await apiPost<BackendResult>(`/api/dams/${damId}/simulation/run`, {
        damId,
        eventType: scenario.eventType,
        damParameters: scenario.damParameters,
        breachParameters: scenario.breachParameters,
        simulationSettings: scenario.simulationSettings,
        location: scenario.location,
      })
      const result = mapResult(raw)
      if (options?.remember !== false) rememberPrimaryFlood(result)
      return result
    } catch {
      try {
        const raw = await apiPost<BackendResult>('/api/simulation/run', {
          damId,
          eventType: scenario.eventType,
          damParameters: scenario.damParameters,
          breachParameters: scenario.breachParameters,
          simulationSettings: scenario.simulationSettings,
          location: scenario.location,
        })
        const result = mapResult(raw)
        if (options?.remember !== false) rememberPrimaryFlood(result)
        return result
      } catch {
        const fallback = simulationService.run(scenario)
        if (options?.remember !== false) rememberPrimaryFlood(fallback)
        return fallback
      }
    }
  },
  get: (id: string) => apiGet(`/api/simulation/${id}`),
  results: async (id: string) => mapResult(await apiGet<BackendResult>(`/api/simulation/${id}/results`)),
  geojson: (id: string) => apiGet(`/api/simulation/${id}/geojson`),
  kml: (id: string) => apiGetText(`/api/export/${id}/kml`),
  report: (id: string) => apiGet<IntelligenceReportData>(`/api/report/${id}`),
}
