import { buildDeterministicReport } from '@/demo/buildReport'
import type { FloodModelResult } from '@/demo/demoFloodModel'
import type { IntelligenceReportData, Scenario } from '@/types/simulation'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export function hasOpenRouterKey(): boolean {
  return Boolean(import.meta.env.VITE_OPENROUTER_API_KEY)
}

export const intelligenceService = {
  isReady: () => true,
  generate: (scenario: Scenario, result: FloodModelResult): IntelligenceReportData =>
    buildDeterministicReport(scenario, result),
  enhance: async (
    report: IntelligenceReportData,
  ): Promise<string> => {
    const key = import.meta.env.VITE_OPENROUTER_API_KEY
    if (!key) {
      throw new Error('No OpenRouter key configured.')
    }
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Rewrite the following dam-break briefing for emergency operators. Do not invent flood extents, depths, or infrastructure counts. Use only the supplied figures.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              executiveSummary: report.executiveSummary,
              floodOverview: report.floodOverview,
              infrastructureExposure: report.infrastructureExposure,
              priorityZones: report.priorityZones,
              recommendedActions: report.recommendedActions,
            }),
          },
        ],
      }),
    })
    if (!response.ok) {
      throw new Error('OpenRouter request failed.')
    }
    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const text = json.choices?.[0]?.message?.content
    if (!text) throw new Error('Empty model response.')
    return text
  },
}
