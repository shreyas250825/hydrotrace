import { apiGet, apiPost, API_URL, ApiError } from '@/services/api'
import type { DamListItem, DamRecord } from '@/catalog/types'
import type { TerrainApiResponse, TerrainStatusResponse } from '@/catalog/terrainTypes'
import type { Scenario } from '@/types/simulation'
import type { FloodModelResult } from '@/demo/demoFloodModel'

export const damApi = {
  list: () =>
    apiGet<{
      product: string
      disclaimer: string
      terrainCapability?: Record<string, unknown>
      dams: DamListItem[]
    }>('/api/dams'),
  get: (damId: string) => apiGet<DamRecord>(`/api/dams/${damId}`),
  terrain: (
    damId: string,
    options?: { purpose?: 'analysis' | 'viz' | 'meta'; includeGrid?: boolean },
  ) => {
    const purpose = options?.purpose ?? 'analysis'
    const include = options?.includeGrid === false ? 'false' : 'true'
    return apiGet<TerrainApiResponse>(
      `/api/dams/${damId}/terrain?purpose=${purpose}&include_grid=${include}`,
    )
  },
  terrainStatus: (damId: string) =>
    apiGet<TerrainStatusResponse>(`/api/dams/${damId}/terrain/status`),
  uploadDem: async (damId: string, file: File) => {
    const body = new FormData()
    body.append('file', file)
    const response = await fetch(`${API_URL}/api/dams/${damId}/terrain/upload`, {
      method: 'POST',
      body,
    })
    if (!response.ok) {
      let detail = `Upload failed (${response.status})`
      try {
        const json = (await response.json()) as { detail?: string }
        if (json.detail) detail = json.detail
      } catch {
        /* ignore */
      }
      throw new ApiError(detail, response.status)
    }
    return (await response.json()) as {
      ok: boolean
      dam_id: string
      terrain_type: string
      status: string
      message: string
      metadata: Record<string, unknown>
    }
  },
  clearTerrain: (damId: string) =>
    fetch(`${API_URL}/api/dams/${damId}/terrain`, { method: 'DELETE' }).then(async (r) => {
      if (!r.ok) throw new ApiError(`Clear terrain failed (${r.status})`, r.status)
      return r.json() as Promise<{ ok: boolean; message: string }>
    }),
  infrastructure: (damId: string) =>
    apiGet<{
      damId: string
      datasetLabel: string
      note: string
      sites: { id: string; name: string; category: string; x: number; z: number }[]
      roads: { id: string; name: string; points: { x: number; z: number }[] }[]
    }>(`/api/dams/${damId}/infrastructure`),
  runSimulation: (damId: string, scenario: Scenario) =>
    apiPost<FloodModelResult & Record<string, unknown>>(
      `/api/dams/${damId}/simulation/run`,
      {
        damId,
        eventType: scenario.eventType,
        damParameters: scenario.damParameters,
        breachParameters: scenario.breachParameters,
        simulationSettings: scenario.simulationSettings,
        location: scenario.location,
      },
    ),
}
