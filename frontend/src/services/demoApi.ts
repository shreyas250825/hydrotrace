import { DEMO_DAM } from '@/demo/demoDamConfig'
import { apiGet } from '@/services/api'

export interface DemoDamPayload {
  id: string
  name: string
  reservoir: string
  river: string
  region: string
  nearestTown: string
  location: { lat: number; lng: number; label: string }
  modelName: string
  modelNote: string
}

export const demoApi = {
  getDam: () => apiGet<DemoDamPayload>('/api/demo/dam'),
  getTerrain: () =>
    apiGet<{
      width: number
      depth: number
      cols: number
      rows: number
      heights: number[]
    }>('/api/demo/terrain'),
  getInfrastructure: () =>
    apiGet<{
      sites: { id: string; name: string; category: string; x: number; z: number }[]
      roads: { id: string; name: string; points: { x: number; z: number }[] }[]
    }>('/api/demo/infrastructure'),
  featured: () => DEMO_DAM,
}
