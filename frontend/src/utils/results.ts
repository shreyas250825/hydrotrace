import type { SimulationState } from '@/types/simulation'

export function hasExportableResults(simulation: SimulationState): boolean {
  return simulation.status === 'COMPLETED'
}
