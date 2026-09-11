import {
  DEFAULT_BREACH_PARAMETERS,
  DEFAULT_DAM_PARAMETERS,
  DEFAULT_EVENT_TYPE,
  DEFAULT_SIMULATION_SETTINGS,
} from '@/config/defaults'
import type { EventType, Scenario } from '@/types/simulation'

export function createScenario(eventType: EventType = DEFAULT_EVENT_TYPE): Scenario {
  return {
    location: null,
    eventType,
    damParameters: { ...DEFAULT_DAM_PARAMETERS },
    breachParameters: { ...DEFAULT_BREACH_PARAMETERS },
    simulationSettings: { ...DEFAULT_SIMULATION_SETTINGS },
    dataSources: [],
    savedAt: null,
  }
}

export function cloneScenario(scenario: Scenario, eventType?: EventType): Scenario {
  return {
    location: scenario.location ? { ...scenario.location } : null,
    eventType: eventType ?? scenario.eventType,
    damParameters: { ...scenario.damParameters },
    breachParameters: { ...scenario.breachParameters },
    simulationSettings: { ...scenario.simulationSettings },
    dataSources: scenario.dataSources.map((item) => ({ ...item })),
    savedAt: scenario.savedAt,
  }
}

export function eventTypeLabel(eventType: EventType): string {
  return eventType === 'CONTROLLED_RELEASE'
    ? 'Controlled water release'
    : 'Catastrophic dam break'
}
