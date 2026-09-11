import { getDamConfig } from '@/demo/demoDamConfig'
import { sceneToLngLat } from '@/demo/demoCoords'
import { getDemoRoads, getDemoSites } from '@/demo/demoInfrastructure'
import type { FloodPolygon, GeospatialLayers, ImpactItem } from '@/types/simulation'
import { Circle, CircleMarker, Polygon, Polyline, Tooltip } from 'react-leaflet'

const PRIORITY_COLOR = {
  HIGH: '#dc2626',
  MEDIUM: '#ea580c',
  LOW: '#ca8a04',
} as const

function DemoMapLayers({
  layers,
  floodPolygon,
  impact,
}: {
  layers: GeospatialLayers
  floodPolygon: FloodPolygon | null
  impact?: { buildings: ImpactItem[]; infrastructure: ImpactItem[]; settlements: ImpactItem[] }
}) {
  const damCfg = getDamConfig()
  const dam = damCfg.location
  const reservoirPts = reservoirRing()
  const exposed = new Map<string, ImpactItem>()
  for (const list of [impact?.buildings, impact?.infrastructure, impact?.settlements]) {
    for (const item of list ?? []) exposed.set(item.id, item)
  }

  return (
    <>
      {layers.reservoir ? (
        <Polygon
          positions={reservoirPts}
          pathOptions={{
            color: '#0e7490',
            weight: 1.4,
            fillColor: '#22d3ee',
            fillOpacity: 0.18,
          }}
        >
          <Tooltip>{damCfg.reservoir}</Tooltip>
        </Polygon>
      ) : null}

      {layers.dam ? (
        <Circle
          center={[dam.lat, dam.lng]}
          radius={220}
          pathOptions={{ color: '#0b1f3a', weight: 2, fillColor: '#1e293b', fillOpacity: 0.55 }}
        >
          <Tooltip>{damCfg.name}</Tooltip>
        </Circle>
      ) : null}

      {layers.roads
        ? getDemoRoads().map((road) => (
            <Polyline
              key={road.id}
              positions={road.points.map((p) => {
                const g = sceneToLngLat(p.x, p.z)
                return [g.lat, g.lng] as [number, number]
              })}
              pathOptions={{ color: '#334155', weight: 3, opacity: 0.85 }}
            >
              <Tooltip>{road.name}</Tooltip>
            </Polyline>
          ))
        : null}

      {layers.infrastructure || layers.settlements
        ? getDemoSites()
            .filter((site) => {
              if (site.category === 'settlement') return layers.settlements
              return layers.infrastructure
            })
            .map((site) => {
              const g = sceneToLngLat(site.x, site.z)
              const hit = exposed.get(site.id)
              const color = hit?.priority
                ? PRIORITY_COLOR[hit.priority]
                : site.category === 'settlement'
                  ? '#64748b'
                  : '#0f766e'
              return (
                <CircleMarker
                  key={site.id}
                  center={[g.lat, g.lng]}
                  radius={site.category === 'settlement' ? 8 : 6}
                  pathOptions={{ color, weight: 1.5, fillColor: color, fillOpacity: 0.85 }}
                >
                  <Tooltip>
                    {site.name}
                    {hit ? ` · ${hit.priority} · ${hit.depthM?.toFixed(1)} m` : ''}
                  </Tooltip>
                </CircleMarker>
              )
            })
        : null}

      {layers.floodExtent && floodPolygon ? (
        <Polygon
          positions={floodPolygon.latLngs}
          pathOptions={{
            color: '#0369a1',
            weight: 2,
            fillColor: '#0891b2',
            fillOpacity: 0.38,
          }}
        >
          <Tooltip>Demonstration inundation</Tooltip>
        </Polygon>
      ) : null}
    </>
  )
}

function reservoirRing(): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i <= 28; i += 1) {
    const t = (i / 28) * Math.PI * 2
    const x = Math.cos(t) * 16
    const z = -42 + Math.sin(t) * 28
    const g = sceneToLngLat(x, z)
    pts.push([g.lat, g.lng])
  }
  return pts
}

export { DemoMapLayers }
