import { getActiveDamId } from '@/catalog/activeDam'
import { getDamConfig } from '@/demo/demoDamConfig'
import { sceneToLngLat } from '@/demo/demoCoords'
import { terrainHeight } from '@/demo/demoTerrain'

export type InfraCategory =
  | 'building'
  | 'settlement'
  | 'road'
  | 'hospital'
  | 'school'
  | 'power'
  | 'emergency'
  | 'bridge'

export interface DemoSite {
  id: string
  name: string
  category: InfraCategory
  x: number
  z: number
  footprint: number
}

export interface DemoRoad {
  id: string
  name: string
  points: { x: number; z: number }[]
}

const BHAKRA_SITES: DemoSite[] = [
  { id: 'nangal-core', name: 'Nangal township', category: 'settlement', x: -8.4, z: 38, footprint: 3.4 },
  { id: 'nangal-west', name: 'Nangal west cluster', category: 'settlement', x: -12.2, z: 46, footprint: 2.6 },
  { id: 'bbmb-colony', name: 'BBMB colony', category: 'settlement', x: 7.8, z: 18, footprint: 2.2 },
  { id: 'hospital', name: 'Nangal Civil Hospital', category: 'hospital', x: -7.1, z: 36, footprint: 1.4 },
  { id: 'school', name: 'Govt. Senior Secondary School', category: 'school', x: -10.4, z: 42, footprint: 1.2 },
  { id: 'substation', name: 'Nangal 220 kV substation', category: 'power', x: 4.6, z: 24, footprint: 1.6 },
  { id: 'police', name: 'Nangal police station', category: 'emergency', x: -5.8, z: 41, footprint: 1.1 },
  { id: 'fire', name: 'Industrial fire post', category: 'emergency', x: 9.2, z: 28, footprint: 1.0 },
  { id: 'bridge', name: 'Sutlej valley road bridge', category: 'bridge', x: 0.2, z: 14, footprint: 1.8 },
  { id: 'market', name: 'Nangal market buildings', category: 'building', x: -9.0, z: 40, footprint: 1.5 },
  { id: 'works', name: 'Irrigation works yard', category: 'building', x: 6.2, z: 22, footprint: 1.3 },
  { id: 'farm-a', name: 'Left-bank farmstead', category: 'building', x: -14.5, z: 52, footprint: 1.1 },
  { id: 'farm-b', name: 'Right-bank farmstead', category: 'building', x: 11.8, z: 48, footprint: 1.1 },
]

const BHAKRA_ROADS: DemoRoad[] = [
  {
    id: 'nh-valley',
    name: 'Valley access road',
    points: [
      { x: -2.8, z: -4 },
      { x: -3.2, z: 8 },
      { x: -4.4, z: 22 },
      { x: -6.6, z: 36 },
      { x: -8.8, z: 50 },
      { x: -10.2, z: 62 },
    ],
  },
  {
    id: 'right-bank',
    name: 'Right-bank service road',
    points: [
      { x: 3.4, z: -2 },
      { x: 4.2, z: 12 },
      { x: 5.6, z: 26 },
      { x: 7.4, z: 40 },
      { x: 9.1, z: 54 },
    ],
  },
  {
    id: 'nangal-cross',
    name: 'Nangal cross road',
    points: [
      { x: -14, z: 40 },
      { x: -8, z: 39 },
      { x: -2, z: 38 },
      { x: 4, z: 37 },
    ],
  },
]

export function getDemoSites(): DemoSite[] {
  const damId = getActiveDamId()
  if (damId === 'bhakra') return BHAKRA_SITES
  const dam = getDamConfig()
  const town = dam.nearestTown
  const region = dam.region
  return [
    { id: `${damId}-core`, name: `${town} settlement cluster`, category: 'settlement', x: -8, z: 36, footprint: 3 },
    { id: `${damId}-west`, name: `${town} west cluster`, category: 'settlement', x: -12, z: 44, footprint: 2.4 },
    { id: `${damId}-hospital`, name: `${town} clinic`, category: 'hospital', x: -7, z: 34, footprint: 1.3 },
    { id: `${damId}-school`, name: `${town} school`, category: 'school', x: -10, z: 40, footprint: 1.2 },
    { id: `${damId}-power`, name: `${region} substation`, category: 'power', x: 4.5, z: 22, footprint: 1.5 },
    { id: `${damId}-bridge`, name: `${region} road bridge`, category: 'bridge', x: 0.2, z: 14, footprint: 1.8 },
    { id: `${damId}-emergency`, name: `${town} emergency post`, category: 'emergency', x: -5.5, z: 38, footprint: 1.1 },
    { id: `${damId}-market`, name: `${town} market buildings`, category: 'building', x: -9, z: 39, footprint: 1.4 },
    { id: `${damId}-farm`, name: `${region} farmstead`, category: 'building', x: 11, z: 48, footprint: 1.1 },
  ]
}

export function getDemoRoads(): DemoRoad[] {
  const damId = getActiveDamId()
  if (damId === 'bhakra') return BHAKRA_ROADS
  const dam = getDamConfig()
  return [
    {
      id: `${damId}-valley`,
      name: `${dam.region} valley access road`,
      points: [
        { x: -2.8, z: -4 },
        { x: -3.5, z: 12 },
        { x: -5, z: 28 },
        { x: -7.5, z: 44 },
        { x: -9.5, z: 58 },
      ],
    },
    {
      id: `${damId}-cross`,
      name: `${dam.nearestTown} cross road`,
      points: [
        { x: -14, z: 38 },
        { x: -6, z: 37 },
        { x: 2, z: 36 },
        { x: 8, z: 35 },
      ],
    },
  ]
}

/** @deprecated Prefer getDemoSites() — kept for Bhakra-era imports during migration. */
export const DEMO_SITES = BHAKRA_SITES
/** @deprecated Prefer getDemoRoads() */
export const DEMO_ROADS = BHAKRA_ROADS

export function demoSitesGeo() {
  return getDemoSites().map((site) => {
    const geo = sceneToLngLat(site.x, site.z)
    return { ...site, lat: geo.lat, lng: geo.lng, elev: terrainHeight(site.x, site.z) }
  })
}
