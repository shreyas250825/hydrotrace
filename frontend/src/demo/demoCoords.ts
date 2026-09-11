import { DAM_SCENE, getDamConfig } from '@/demo/demoDamConfig'

const DEG = Math.PI / 180

export function sceneToLngLat(x: number, z: number): { lat: number; lng: number } {
  const dam = getDamConfig()
  const bearing = dam.downstreamBearingDeg * DEG
  const acrossBearing = bearing + Math.PI / 2
  const downstream = (z - DAM_SCENE.z) * dam.metersPerSceneUnit
  const across = x * dam.metersPerSceneUnit
  const dNorth = Math.cos(bearing) * downstream + Math.cos(acrossBearing) * across
  const dEast = Math.sin(bearing) * downstream + Math.sin(acrossBearing) * across
  const lat0 = dam.location.lat
  const lat = lat0 + dNorth / 111320
  const lng =
    dam.location.lng + dEast / (111320 * Math.cos((lat0 * Math.PI) / 180))
  return { lat, lng }
}

export function lngLatToScene(lat: number, lng: number): { x: number; z: number } {
  const dam = getDamConfig()
  const lat0 = dam.location.lat
  const dNorth = (lat - lat0) * 111320
  const dEast =
    (lng - dam.location.lng) * 111320 * Math.cos((lat0 * Math.PI) / 180)
  const bearing = dam.downstreamBearingDeg * DEG
  const acrossBearing = bearing + Math.PI / 2
  const downstream =
    Math.cos(bearing) * dNorth + Math.sin(bearing) * dEast
  const across =
    Math.cos(acrossBearing) * dNorth + Math.sin(acrossBearing) * dEast
  return {
    x: across / dam.metersPerSceneUnit,
    z: DAM_SCENE.z + downstream / dam.metersPerSceneUnit,
  }
}
