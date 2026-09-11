import {
  type ExposedAsset,
  type ExposedRoad,
  type FloodModelResult,
} from '@/demo/demoFloodModel'
import { mapImpact } from '@/demo/mapImpact'
import { apiGet } from '@/services/api'
import type { ImpactAnalysisState } from '@/types/simulation'

export const impactApi = {
  get: (simulationId: string) =>
    apiGet<{ assets: ExposedAsset[]; roads: ExposedRoad[] }>(
      `/api/impact/${simulationId}`,
    ),
  toState: (result: FloodModelResult): ImpactAnalysisState =>
    mapImpact(
      result,
      result.estimatedArrivalMin > 0
        ? result.estimatedArrivalMin / Math.max(1, result.maxArrivalSteps)
        : 0,
    ),
}
