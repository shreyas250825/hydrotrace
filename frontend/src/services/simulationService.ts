import { runDemoFloodModel, type FloodModelResult } from '@/demo/demoFloodModel'
import type { Scenario } from '@/types/simulation'

export const simulationService = {
  isReady: () => true,
  run: (scenario: Scenario): FloodModelResult =>
    runDemoFloodModel({
      eventType: scenario.eventType,
      waterLevelPercent: scenario.damParameters.currentWaterLevelPercent,
      breachWidthMeters: scenario.breachParameters.widthMeters,
      breachDepthMeters: scenario.breachParameters.depthMeters,
      reservoirVolumeMcm: scenario.damParameters.reservoirVolumeMcm,
      durationHours: scenario.simulationSettings.durationHours,
    }),
}
