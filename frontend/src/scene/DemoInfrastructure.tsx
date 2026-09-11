import { getPrimaryFlood } from '@/demo/demoFloodModel'
import { getDemoRoads, getDemoSites, type InfraCategory } from '@/demo/demoInfrastructure'
import { terrainHeight } from '@/demo/demoTerrain'
import { useFloodStore } from '@/store/useFloodStore'
import { Html } from '@react-three/drei'
import { memo } from 'react'

const COLORS: Record<InfraCategory, string> = {
  settlement: '#64748b',
  building: '#78716c',
  hospital: '#e11d48',
  school: '#d97706',
  power: '#475569',
  emergency: '#dc2626',
  bridge: '#334155',
  road: '#1e293b',
}

function statusColor(id: string, fallback: string) {
  const flood = getPrimaryFlood()
  const asset = flood?.assets.find((item) => item.id === id)
  if (!asset) return fallback
  if (asset.priority === 'HIGH') return '#ef4444'
  if (asset.priority === 'MEDIUM') return '#f59e0b'
  return fallback
}

function BuildingCluster({
  x,
  y,
  z,
  footprint,
  category,
  color,
  selected,
  onSelect,
}: {
  x: number
  y: number
  z: number
  footprint: number
  category: InfraCategory
  color: string
  selected: boolean
  onSelect: () => void
}) {
  const w = Math.min(2.4, footprint)
  if (category === 'bridge') {
    return (
      <group position={[x, y + 0.35, z]} onClick={(e) => { e.stopPropagation(); onSelect() }}>
        <mesh>
          <boxGeometry args={[w * 2.2, 0.22, 0.55]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.2} />
        </mesh>
        <mesh position={[-w * 0.9, -0.35, 0]}>
          <boxGeometry args={[0.18, 0.7, 0.18]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        <mesh position={[w * 0.9, -0.35, 0]}>
          <boxGeometry args={[0.18, 0.7, 0.18]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        {selected ? <SelectRing y={1.1} /> : null}
      </group>
    )
  }

  if (category === 'settlement') {
    const h1 = 1.4
    const h2 = 1.9
    const h3 = 1.15
    return (
      <group position={[x, y, z]} onClick={(e) => { e.stopPropagation(); onSelect() }}>
        <mesh position={[-0.55, h1 * 0.5, 0.1]} castShadow>
          <boxGeometry args={[0.7, h1, 0.65]} />
          <meshStandardMaterial color={color} roughness={0.82} />
        </mesh>
        <mesh position={[0.35, h2 * 0.5, -0.15]} castShadow>
          <boxGeometry args={[0.85, h2, 0.7]} />
          <meshStandardMaterial color="#6b7280" roughness={0.8} />
        </mesh>
        <mesh position={[0.1, h3 * 0.5, 0.7]} castShadow>
          <boxGeometry args={[0.55, h3, 0.5]} />
          <meshStandardMaterial color="#78716c" roughness={0.85} />
        </mesh>
        {selected ? <SelectRing y={h2 + 0.6} /> : null}
      </group>
    )
  }

  const h =
    category === 'hospital' || category === 'power' ? 2.4 : category === 'school' ? 2.0 : 1.7
  return (
    <group position={[x, y, z]} onClick={(e) => { e.stopPropagation(); onSelect() }}>
      <mesh position={[0, h * 0.5, 0]} castShadow>
        <boxGeometry args={[w, h, w * 0.78]} />
        <meshStandardMaterial color={color} roughness={0.78} />
      </mesh>
      {/* roof plate */}
      <mesh position={[0, h + 0.06, 0]}>
        <boxGeometry args={[w * 1.08, 0.12, w * 0.86]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>
      {/* marker pin for critical */}
      {['hospital', 'school', 'power', 'emergency'].includes(category) ? (
        <mesh position={[0, h + 0.55, 0]}>
          <sphereGeometry args={[0.18, 10, 10]} />
          <meshStandardMaterial color={color} roughness={0.4} emissive={color} emissiveIntensity={0.15} />
        </mesh>
      ) : null}
      {selected ? <SelectRing y={h + 0.9} /> : null}
    </group>
  )
}

function SelectRing({ y }: { y: number }) {
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.55, 0.72, 24]} />
      <meshBasicMaterial color="#2563eb" transparent opacity={0.85} />
    </mesh>
  )
}

function DemoInfrastructure({
  showBuildings,
  showRoads,
  showCritical,
  showRisk,
}: {
  showBuildings: boolean
  showRoads: boolean
  showCritical: boolean
  showRisk: boolean
}) {
  const selected = useFloodStore((s) => s.selectedAssetId)
  const setSelected = useFloodStore((s) => s.setSelectedAssetId)
  const flood = getPrimaryFlood()

  return (
    <group>
      {getDemoSites().map((site) => {
        const critical = ['hospital', 'school', 'power', 'emergency', 'bridge'].includes(
          site.category,
        )
        if (critical && !showCritical && !showBuildings) return null
        if (!critical && !showBuildings) return null
        const y = terrainHeight(site.x, site.z)
        const color = statusColor(site.id, COLORS[site.category])
        const hit = flood?.assets.find((a) => a.id === site.id)
        return (
          <group key={site.id}>
            <BuildingCluster
              x={site.x}
              y={y}
              z={site.z}
              footprint={site.footprint}
              category={site.category}
              color={color}
              selected={selected === site.id}
              onSelect={() => setSelected(site.id)}
            />
            {showRisk && hit ? (
              <mesh position={[site.x, y + 0.06, site.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[Math.min(2.8, site.footprint) * 1.5, 20]} />
                <meshBasicMaterial
                  color={hit.priority === 'HIGH' ? '#ef4444' : '#f59e0b'}
                  transparent
                  opacity={0.2}
                  depthWrite={false}
                />
              </mesh>
            ) : null}
            {selected === site.id ? (
              <Html position={[site.x, y + 3.2, site.z]} center distanceFactor={18}>
                <div className="min-w-[160px] rounded-lg border border-navy-100 bg-white px-3 py-2 text-left shadow-lg">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    {site.category}
                  </p>
                  <p className="text-sm font-semibold text-navy-950">{site.name}</p>
                  <p className="text-[11px] text-muted">
                    {hit
                      ? `${hit.priority} · ${hit.depthM.toFixed(1)} m demonstration depth`
                      : 'Outside inundation mask'}
                  </p>
                </div>
              </Html>
            ) : null}
          </group>
        )
      })}
      {showRoads
        ? getDemoRoads().map((road) =>
            road.points.length > 1 ? (
              <RoadRibbon key={road.id} points={road.points} />
            ) : null,
          )
        : null}
    </group>
  )
}

function RoadRibbon({ points }: { points: { x: number; z: number }[] }) {
  return (
    <group>
      {points.slice(0, -1).map((p, i) => {
        const n = points[i + 1]
        const mx = (p.x + n.x) / 2
        const mz = (p.z + n.z) / 2
        const dx = n.x - p.x
        const dz = n.z - p.z
        const len = Math.hypot(dx, dz)
        const y = (terrainHeight(p.x, p.z) + terrainHeight(n.x, n.z)) / 2 + 0.08
        const rot = Math.atan2(dx, dz)
        return (
          <mesh key={i} position={[mx, y, mz]} rotation={[0, rot, 0]}>
            <boxGeometry args={[0.55, 0.06, len]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

const DemoInfrastructureMemo = memo(DemoInfrastructure)
export { DemoInfrastructureMemo as DemoInfrastructure }
