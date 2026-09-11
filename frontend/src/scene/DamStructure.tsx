import { memo, useMemo } from 'react'
import { Color } from 'three'

const SEGMENTS = 22
const SPAN = 36
const CREST = 13.2
const CONCRETE = new Color('#c4bdb0')
const CONCRETE_DARK = new Color('#9d968b')
const STEEL = new Color('#4b5563')

function DamStructure({
  breached,
  quality,
}: {
  breached: boolean
  quality: 'high' | 'preview'
}) {
  const shadows = quality === 'high'
  const slices = useMemo(() => {
    const items: {
      key: string
      x: number
      z: number
      rot: number
      width: number
      breach: boolean
    }[] = []
    for (let i = 0; i < SEGMENTS; i += 1) {
      const t = i / (SEGMENTS - 1)
      const x = (t - 0.5) * SPAN
      const z = -((x / 18) ** 2) * 3.6
      const nextX = ((i + 0.5) / (SEGMENTS - 1) - 0.5) * SPAN
      const nextZ = -((nextX / 18) ** 2) * 3.6
      const rot = Math.atan2(nextX - x, nextZ - z)
      items.push({
        key: `s${i}`,
        x,
        z,
        rot,
        width: SPAN / SEGMENTS + 0.18,
        breach: Math.abs(x) < 2.15,
      })
    }
    return items
  }, [])

  return (
    <group position={[0, 0, -8]}>
      {slices.map((slice) => {
        const open = Boolean(breached && slice.breach)
        if (open) return null
        return (
          <group key={slice.key} position={[slice.x, 0, slice.z]} rotation={[0, slice.rot, 0]}>
            <mesh position={[0, CREST * 0.5, 0.15]} castShadow={shadows} receiveShadow={shadows}>
              <boxGeometry args={[slice.width, CREST, 4.8]} />
              <meshStandardMaterial color={CONCRETE} roughness={0.78} metalness={0.06} />
            </mesh>
            <mesh position={[0, 3.2, 2.35]} rotation={[0.52, 0, 0]} receiveShadow={shadows}>
              <boxGeometry args={[slice.width * 0.98, 0.55, 7.4]} />
              <meshStandardMaterial color={CONCRETE_DARK} roughness={0.9} />
            </mesh>
            <mesh position={[0, 13.38, 0]}>
              <boxGeometry args={[slice.width + 0.08, 0.32, 5.2]} />
              <meshStandardMaterial color="#2a3140" roughness={0.86} />
            </mesh>
          </group>
        )
      })}

      {breached ? (
        <>
          <mesh position={[0, 4.6, 0.4]}>
            <boxGeometry args={[4.1, 9.4, 1.4]} />
            <meshStandardMaterial color="#3a3530" roughness={0.92} metalness={0.05} />
          </mesh>
          <mesh position={[-0.9, 1.05, 2.1]} rotation={[0.45, 0.25, 0.12]} castShadow={shadows}>
            <boxGeometry args={[1.8, 0.7, 1.2]} />
            <meshStandardMaterial color="#8a8176" roughness={0.95} />
          </mesh>
          <mesh position={[1.05, 0.8, 2.6]} rotation={[0.28, -0.32, -0.12]} castShadow={shadows}>
            <boxGeometry args={[1.5, 0.55, 1.05]} />
            <meshStandardMaterial color="#7a7368" roughness={0.95} />
          </mesh>
          <mesh position={[0.15, 0.55, 3.4]} rotation={[0.18, 0.4, 0]} castShadow={shadows}>
            <boxGeometry args={[2.1, 0.42, 1.4]} />
            <meshStandardMaterial color="#6f6860" roughness={0.95} />
          </mesh>
          <mesh position={[0, 11.6, 0]}>
            <boxGeometry args={[4.2, 0.45, 5]} />
            <meshStandardMaterial color="#b7b0a4" roughness={0.82} />
          </mesh>
        </>
      ) : null}

      <mesh position={[0, 13.62, -2.15]}>
        <boxGeometry args={[35.6, 0.5, 0.26]} />
        <meshStandardMaterial color="#d7d1c6" roughness={0.62} />
      </mesh>
      <mesh position={[0, 13.62, 2.15]}>
        <boxGeometry args={[35.6, 0.5, 0.26]} />
        <meshStandardMaterial color="#d7d1c6" roughness={0.62} />
      </mesh>

      {[-12, -6, 0, 6, 12].map((x) => (
        <mesh key={`joint-${x}`} position={[x, 6.8, 2.1]}>
          <boxGeometry args={[0.16, 12.8, 0.18]} />
          <meshStandardMaterial color="#8d867c" roughness={0.7} />
        </mesh>
      ))}

      <mesh position={[10.6, 6.5, 3.8]} rotation={[0.58, 0, 0]}>
        <boxGeometry args={[5.2, 0.28, 12]} />
        <meshStandardMaterial color="#8f99a4" roughness={0.42} metalness={0.22} />
      </mesh>
      {[-1.55, 0, 1.55].map((x) => (
        <group key={`gate-${x}`} position={[10.6 + x, 9.35, 0.7]}>
          <mesh>
            <boxGeometry args={[1.28, 1.55, 0.38]} />
            <meshStandardMaterial color={STEEL} roughness={0.4} metalness={0.28} />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <boxGeometry args={[0.18, 0.7, 0.18]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {[-6.4, 6.4].map((x) => (
        <group key={`tower-${x}`} position={[x, 0, -3.35]}>
          <mesh position={[0, 10.7, 0]} castShadow={shadows}>
            <cylinderGeometry args={[0.78, 0.96, 9.2, quality === 'high' ? 16 : 8]} />
            <meshStandardMaterial color="#d8d3ca" roughness={0.64} />
          </mesh>
          <mesh position={[0, 15.4, 0]}>
            <cylinderGeometry args={[1.05, 1.05, 0.38, 14]} />
            <meshStandardMaterial color="#6b7280" roughness={0.45} metalness={0.2} />
          </mesh>
        </group>
      ))}

      <mesh position={[-19.2, 7.6, 0]} castShadow={shadows}>
        <boxGeometry args={[5.4, 15.2, 8.2]} />
        <meshStandardMaterial color="#8b8680" roughness={0.92} />
      </mesh>
      <mesh position={[19.2, 7.6, 0]} castShadow={shadows}>
        <boxGeometry args={[5.4, 15.2, 8.2]} />
        <meshStandardMaterial color="#8b8680" roughness={0.92} />
      </mesh>
      <mesh position={[-19.2, 15.5, 0]}>
        <boxGeometry args={[5.6, 0.7, 8.4]} />
        <meshStandardMaterial color="#6b7280" roughness={0.55} />
      </mesh>
      <mesh position={[19.2, 15.5, 0]}>
        <boxGeometry args={[5.6, 0.7, 8.4]} />
        <meshStandardMaterial color="#6b7280" roughness={0.55} />
      </mesh>
    </group>
  )
}

const DamStructureMemo = memo(DamStructure)
export { DamStructureMemo as DamStructure }
