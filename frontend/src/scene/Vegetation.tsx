import { terrainHeight } from '@/demo/demoTerrain'
import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { InstancedMesh, Object3D } from 'three'

/** Sparse stylized canopy markers — not cartoon cones. */
function Vegetation({ quality }: { quality: 'high' | 'preview' }) {
  const canopyRef = useRef<InstancedMesh>(null)
  const trunkRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const trees = useMemo(() => {
    const count = quality === 'high' ? 36 : 16
    const items: { x: number; z: number; y: number; h: number; s: number }[] = []
    let i = 0
    let seed = 17
    while (items.length < count && i < 400) {
      seed = (seed * 16807) % 2147483647
      const x = ((seed % 1000) / 1000 - 0.5) * 108
      seed = (seed * 16807) % 2147483647
      const z = ((seed % 1000) / 1000 - 0.5) * 148
      const h = terrainHeight(x, z)
      if (Math.abs(x) > 10 && h > 5.8 && h < 13.5 && z > -18) {
        items.push({
          x,
          z,
          y: h,
          h: 1.1 + (seed % 10) / 12,
          s: 0.45 + (seed % 8) / 20,
        })
      }
      i += 1
    }
    return items
  }, [quality])

  useLayoutEffect(() => {
    const canopy = canopyRef.current
    const trunk = trunkRef.current
    if (!canopy || !trunk) return
    trees.forEach((tree, index) => {
      dummy.position.set(tree.x, tree.y + tree.h * 0.85, tree.z)
      dummy.scale.set(tree.s, tree.h * 0.55, tree.s)
      dummy.updateMatrix()
      canopy.setMatrixAt(index, dummy.matrix)

      dummy.position.set(tree.x, tree.y + tree.h * 0.28, tree.z)
      dummy.scale.set(0.12, tree.h * 0.55, 0.12)
      dummy.updateMatrix()
      trunk.setMatrixAt(index, dummy.matrix)
    })
    canopy.instanceMatrix.needsUpdate = true
    trunk.instanceMatrix.needsUpdate = true
  }, [dummy, trees])

  const n = Math.max(1, trees.length)
  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, n]} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 1, 5]} />
        <meshStandardMaterial color="#5b4636" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, n]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#4a6b42" roughness={0.92} />
      </instancedMesh>
    </group>
  )
}

const VegetationMemo = memo(Vegetation)
export { VegetationMemo as Vegetation }
