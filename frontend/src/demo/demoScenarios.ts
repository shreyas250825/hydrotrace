import { BHAKRA_BOOTSTRAP } from '@/catalog/bootstrap'
import type { Scenario } from '@/types/simulation'

export function scenarioFromDam(
  dam = BHAKRA_BOOTSTRAP,
  eventType?: Scenario['eventType'],
): Scenario {
  const defaults = dam.scenarioDefaults
  return {
    damId: dam.id,
    location: {
      lat: dam.latitude,
      lng: dam.longitude,
      label:
        dam.reservoirName != null
          ? `${dam.name}, ${dam.reservoirName}`
          : `${dam.name}, ${dam.state}`,
    },
    eventType: eventType ?? defaults.eventType,
    damParameters: { ...defaults.damParameters },
    breachParameters: { ...defaults.breachParameters },
    simulationSettings: { ...defaults.simulationSettings },
    dataSources: [],
    savedAt: null,
  }
}

export function controlledScenarioFromDam(dam = BHAKRA_BOOTSTRAP): Scenario {
  const base = scenarioFromDam(dam, 'CONTROLLED_RELEASE')
  const w = base.breachParameters.widthMeters
  const d = base.breachParameters.depthMeters
  return {
    ...base,
    damParameters: {
      ...base.damParameters,
      currentWaterLevelPercent: Math.min(
        70,
        Math.max(40, base.damParameters.currentWaterLevelPercent - 20),
      ),
    },
    breachParameters: {
      widthMeters: Math.max(10, Math.round(w * 0.15)),
      depthMeters: Math.max(4, Math.round(d * 0.15)),
      formationTimeMinutes: Math.max(60, base.breachParameters.formationTimeMinutes * 2),
    },
  }
}

export const FEATURED_SCENARIO: Scenario = scenarioFromDam(BHAKRA_BOOTSTRAP, 'DAM_BREAK')

export const CONTROLLED_SCENARIO: Scenario = controlledScenarioFromDam(BHAKRA_BOOTSTRAP)

export const PROCESSING_STEPS = [
  { id: 'terrain', label: 'Loading terrain grid' },
  { id: 'flow', label: 'Analysing elevation and flow paths' },
  { id: 'breach', label: 'Applying breach parameters' },
  { id: 'propagate', label: 'Propagating water' },
  { id: 'inundation', label: 'Generating inundation zone' },
  { id: 'impact', label: 'Analysing infrastructure exposure' },
] as const

export const DEMO_TOUR_STEPS = [
  {
    view: 'overview' as const,
    title: '01 Platform overview',
    body: 'You are inside HYDROTRACE. Confirm Bhakra (or switch dams). Use Quick Actions to open Scenario, Geospatial, or 3D.',
  },
  {
    view: 'scenario' as const,
    title: '02 Scenario & hydraulic Q',
    body: 'Set breach parameters. Watch Estimated Initial Breach Discharge update from Q = Cd A √(2gH). Open Advanced for hydraulic head and Cd.',
  },
  {
    view: 'simulation' as const,
    title: '03 Run simulation',
    body: 'Run the terrain-aware flood model. Review inundated area, depth, arrival, and flooded cells.',
  },
  {
    view: 'geospatial' as const,
    title: '04 Geospatial fullscreen',
    body: 'Open Fullscreen (or press F). Toggle Layers, then Play the flood timeline for propagation.',
  },
  {
    view: 'impact' as const,
    title: '05 Impact analysis',
    body: 'Inspect settlements, roads, and critical infrastructure intersecting the inundation mask.',
  },
  {
    view: 'command' as const,
    title: '06 3D digital twin',
    body: 'Enter Fullscreen 3D. Initiate dam break, use Layers/Camera, and scrub flood propagation.',
  },
  {
    view: 'comparison' as const,
    title: '07 Scenario comparison',
    body: 'Compare controlled release vs dam break. Drag the A|B divider or open Fullscreen comparison.',
  },
  {
    view: 'methodology' as const,
    title: '08 Methodology & export',
    body: 'Show hydraulic derivation and continuity foundation, then export from Simulation or Impact.',
  },
] as const
