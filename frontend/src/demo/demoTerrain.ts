import { getActiveDamId } from '@/catalog/activeDam'
import { DAM_SCENE } from '@/demo/demoDamConfig'

export const TERRAIN_WIDTH = 120
export const TERRAIN_DEPTH = 160

function seed() {
  const id = getActiveDamId()
  return [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 97 / 97
}

/**
 * Shared elevation field for the 3D mesh AND the local flood fallback.
 * Scene units. +Z is downstream of the dam.
 * For non-Bhakra dams this is clearly Demonstration Terrain (seeded procedural).
 */
export function terrainHeight(x: number, z: number): number {
  const damId = getActiveDamId()
  const s = damId === 'bhakra' ? 0 : seed()
  const ax = Math.abs(x)
  const downstream = z - DAM_SCENE.z

  const valleyWall = Math.max(0, ax - 10)
  const mountains =
    Math.pow(valleyWall / 48, 1.28) * (26 + s * 4) +
    Math.sin(x * 0.08 + z * 0.03 + s * 3) * 2.1 * Math.min(1, ax / 32) +
    Math.sin(x * 0.21 + s) * 0.8

  const farRidge = (1 / (1 + Math.exp(-(ax - 42) * 0.2))) * (11 + s * 2)

  let basin = 0
  if (z < DAM_SCENE.z - 3) {
    const t = Math.min(1, (DAM_SCENE.z - 3 - z) / 48)
    basin = -(1 - Math.min(1, ax / 26)) * (8.2 - s) * t
  }

  const channelW = 3.2 + s * 0.5 + Math.max(0, downstream) * 0.07
  const inChannel = Math.exp(-(x * x) / (2 * channelW * channelW))
  const channel =
    downstream > -2 ? -2.6 * inChannel * Math.min(1, (downstream + 2) / 9) : 0

  const downhill = downstream > 0 ? -downstream * (0.042 - s * 0.004) : 0

  const noise =
    Math.sin(x * 0.41 + s) * Math.cos(z * 0.27) * 0.32 +
    Math.sin(x * 0.95 + z * 0.48 + s) * 0.11

  return 6.4 + mountains + farRidge + basin + channel + downhill + noise
}

export function channelHalfWidth(z: number): number {
  const s = getActiveDamId() === 'bhakra' ? 0 : seed()
  const downstream = z - DAM_SCENE.z
  return 3.2 + s * 0.5 + Math.max(0, downstream) * 0.07
}
