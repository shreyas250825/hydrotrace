import { DEMO_DAM } from '@/demo/demoDamConfig'
import type { FloodModelResult } from '@/demo/demoFloodModel'
import type {
  IntelligenceReportData,
  Scenario,
} from '@/types/simulation'
import { eventTypeLabel } from '@/utils/scenario'

export function buildDeterministicReport(
  scenario: Scenario,
  result: FloodModelResult,
): IntelligenceReportData {
  const event = eventTypeLabel(scenario.eventType)
  const high = result.assets.filter((a) => a.priority === 'HIGH')
  const medium = result.assets.filter((a) => a.priority === 'MEDIUM')
  const names = result.assets.map((a) => a.name)
  const roads = result.roads.map((r) => r.name)

  const executiveSummary = `${DEMO_DAM.name} (${DEMO_DAM.reservoir}) was evaluated for a ${event.toLowerCase()} using the ${DEMO_DAM.modelName}. The demonstration fill inundated ${result.inundatedAreaKm2.toFixed(2)} km² across ${result.floodedCellCount} terrain cells, with a peak demonstration water level of ${result.maxWaterDepthM.toFixed(1)} m. ${result.assets.length} mapped sites and ${result.roads.length} road segments intersect the inundation mask.`

  const floodOverview = `Water is sourced at the dam axis and propagated downhill on the bundled elevation grid, preferring the Sutlej valley toward ${DEMO_DAM.nearestTown}. Arrival across the flooded set spans about ${Math.max(1, Math.round(result.estimatedArrivalMin))} minutes of demonstration time. ${DEMO_DAM.modelNote}`

  const infrastructureExposure =
    names.length === 0
      ? 'No demonstration sites intersect the inundation mask for this release.'
      : `Exposed sites: ${names.join('; ')}.${roads.length ? ` Road exposure: ${roads.join('; ')}.` : ''}`

  const priorityZones = [
    ...high.map((a) => ({
      level: 'HIGH' as const,
      name: a.name,
      detail: `Demonstration depth ${a.depthM.toFixed(1)} m. Early arrival on the fill sequence.`,
    })),
    ...medium.map((a) => ({
      level: 'MEDIUM' as const,
      name: a.name,
      detail: `Demonstration depth ${a.depthM.toFixed(1)} m inside the inundation mask.`,
    })),
  ]

  const recommendedActions = [
    high.length
      ? `Treat ${high.map((a) => a.name).join(', ')} as first-wave warning points along the ${DEMO_DAM.river} corridor.`
      : `Monitor the immediate downstream channel toward ${DEMO_DAM.nearestTown}.`,
    scenario.eventType === 'DAM_BREAK'
      ? 'Hold gated discharge narratives; this demonstration is an uncontrolled breach with a wide valley fill.'
      : 'This demonstration is a gated/spillway release with a channel-constrained fill — keep the river road as the primary watch line.',
    'Do not treat these depths or arrival times as a calibrated hydrodynamic forecast.',
    'Use the geospatial flood polygon and KML export for briefing overlays only.',
  ]

  return {
    generatedAt: new Date().toISOString(),
    modelNote: DEMO_DAM.modelNote,
    executiveSummary,
    floodOverview,
    infrastructureExposure,
    priorityZones,
    recommendedActions,
    enhancedNarrative: null,
  }
}
