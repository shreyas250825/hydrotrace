import type { ImpactAnalysisState, SimulationResults } from '@/types/simulation'

export interface ImpactRunInput {
  results: SimulationResults
}

/**
 * Geospatial impact overlay (buildings, roads, critical sites, settlements).
 * Prompt 1: contract only.
 */
export const impactAnalysisService = {
  isReady: () => false,
  analyse: (_input: ImpactRunInput): ImpactAnalysisState => {
    throw new Error('impactAnalysisService.analyse is not implemented in Prompt 1.')
  },
}
