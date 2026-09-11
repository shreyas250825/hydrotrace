import { getPrimaryFlood } from '@/demo/demoFloodModel'
import { terrainHeight } from '@/demo/demoTerrain'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, InstancedMesh, Object3D } from 'three'

const COUNT = 140
const dummy = new Object3D()

function FlowAnalysis({
  visible,
  floodRevision,
}: {
  visible: boolean
  floodRevision: number
}) {
  const meshRef = useRef<InstancedMesh>(null)
  const seeds = useMemo(() => {
    const flood = getPrimaryFlood()
    const cells = flood?.cells.slice().sort((a, b) => a.arrival - b.arrival) ?? []
    if (cells.length === 0) return []
    const step = Math.max(1, Math.floor(cells.length / COUNT))
    return cells.filter((_, i) => i % step === 0).slice(0, COUNT)
  }, [visible, floodRevision])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh || !visible) return
    mesh.visible = visible
    const t = state.clock.elapsedTime
    seeds.forEach((cell, i) => {
      const travel = ((t * 0.35 + i * 0.07) % 1) * 8
      dummy.position.set(cell.x, terrainHeight(cell.x, cell.z) + 0.55, cell.z + travel * 0.12)
      dummy.scale.set(0.18, 0.18, 0.7)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  if (!visible || seeds.length === 0) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, Math.max(1, seeds.length)]}>
      <coneGeometry args={[0.35, 1.1, 5]} />
      <meshBasicMaterial color={new Color('#67e8f9')} transparent opacity={0.55} />
    </instancedMesh>
  )
}

export { FlowAnalysis }
