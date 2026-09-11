import { getDemoTerrainBuffers } from '@/scene/heightField'
import { useFloodStore } from '@/store/useFloodStore'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { BufferAttribute, Uint32BufferAttribute, type BufferGeometry } from 'three'

function TerrainMesh({ quality }: { quality: 'high' | 'preview' }) {
  const geomRef = useRef<BufferGeometry>(null)
  const selectedDamId = useFloodStore((s) => s.selectedDamId)
  const terrainType = useFloodStore((s) => s.terrainType)
  const terrainSource = useFloodStore((s) => s.terrainSource)
  const exaggeration = useFloodStore((s) => s.terrainExaggeration)
  const segX = quality === 'high' ? 220 : 80
  const segZ = quality === 'high' ? 260 : 96
  const buffers = useMemo(
    () => getDemoTerrainBuffers(segX, segZ),
    [segX, segZ, selectedDamId, terrainType, terrainSource],
  )

  useLayoutEffect(() => {
    const geom = geomRef.current
    if (!geom) return
    geom.setAttribute('position', new BufferAttribute(buffers.positions, 3))
    geom.setAttribute('color', new BufferAttribute(buffers.colors, 3))
    geom.setIndex(new Uint32BufferAttribute(buffers.indices, 1))
    geom.computeVertexNormals()
  }, [buffers])

  return (
    <mesh receiveShadow={quality === 'high'} scale={[1, exaggeration, 1]}>
      <bufferGeometry ref={geomRef} />
      <meshStandardMaterial
        vertexColors
        roughness={0.88}
        metalness={0.04}
        envMapIntensity={0.45}
        flatShading={false}
      />
    </mesh>
  )
}

export { TerrainMesh }
