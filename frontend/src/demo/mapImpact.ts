import type { FloodModelResult } from '@/demo/demoFloodModel'
import type { ImpactAnalysisState } from '@/types/simulation'

const CRITICAL = new Set(['hospital', 'school', 'power', 'emergency', 'bridge'])

export function mapImpact(
  result: FloodModelResult,
  minutesPerStep: number,
): ImpactAnalysisState {
  const mapAsset = (a: FloodModelResult['assets'][number]) => ({
    id: a.id,
    name: a.name,
    category: a.category,
    depthM: a.depthM,
    arrivalMin: a.arrival * minutesPerStep,
    priority: a.priority,
    lat: a.lat,
    lng: a.lng,
  })

  return {
    buildings: result.assets.filter((a) => a.category === 'building').map(mapAsset),
    settlements: result.assets.filter((a) => a.category === 'settlement').map(mapAsset),
    infrastructure: result.assets.filter((a) => CRITICAL.has(a.category)).map(mapAsset),
    roads: result.roads.map((r) => ({
      id: r.id,
      name: r.name,
      category: 'road',
      priority: r.priority,
    })),
  }
}
