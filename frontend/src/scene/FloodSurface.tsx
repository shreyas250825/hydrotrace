import { getCachedFlood, getPrimaryFlood, type FloodCell } from '@/demo/demoFloodModel'
import { DEMO_DAM } from '@/demo/demoDamConfig'
import { TERRAIN_DEPTH, TERRAIN_WIDTH, terrainHeight } from '@/demo/demoTerrain'
import { vizRuntime } from '@/scene/vizRuntime'
import type { EventType } from '@/types/simulation'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three'

const dummy = new Matrix4()
const pos = new Vector3()
const quat = new Quaternion()
const scale = new Vector3()
const deep = new Color('#0c4a6e')
const mid = new Color('#0284c7')
const foam = new Color('#e0f2fe')
const tint = new Color()

function FloodSurface({
  eventType,
  progressOverride,
  floodRevision,
  preferPrimary = true,
}: {
  eventType: EventType
  progressOverride?: number
  floodRevision: number
  preferPrimary?: boolean
}) {
  const meshRef = useRef<InstancedMesh>(null)
  const revealedRef = useRef(0)

  const cells = useMemo(() => {
    const primary = getPrimaryFlood()
    const result =
      preferPrimary && primary?.eventType === eventType
        ? primary
        : getCachedFlood(eventType)
    if (!result) return [] as FloodCell[]
    return [...result.cells].sort((a, b) => a.arrival - b.arrival)
  }, [eventType, floodRevision, preferPrimary])

  const maxArrival = Math.max(1, cells.at(-1)?.arrival ?? 1)
  const cellW = TERRAIN_WIDTH / DEMO_DAM.grid.cols
  const cellD = TERRAIN_DEPTH / DEMO_DAM.grid.rows

  useLayoutEffect(() => {
    revealedRef.current = 0
    const mesh = meshRef.current
    if (!mesh) return
    mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    dummy.makeScale(0, 0, 0)
    for (let i = 0; i < cells.length; i += 1) {
      mesh.setMatrixAt(i, dummy)
      mesh.setColorAt(i, deep)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.count = cells.length
  }, [cells])

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh || cells.length === 0) return
    const p = progressOverride ?? vizRuntime.progress
    const cutoff = p * maxArrival
    let revealed = revealedRef.current

    if (p <= 0.02) {
      if (revealed > 0) {
        dummy.makeScale(0, 0, 0)
        for (let i = 0; i < revealed; i += 1) mesh.setMatrixAt(i, dummy)
        mesh.instanceMatrix.needsUpdate = true
        revealedRef.current = 0
      }
      return
    }

    while (revealed < cells.length && cells[revealed].arrival <= cutoff) {
      const cell = cells[revealed]
      const elev = terrainHeight(cell.x, cell.z)
      // Thin surface sheet following terrain — not tall glowing columns
      const h = Math.max(0.12, Math.min(1.8, cell.depthScene * 0.28))
      pos.set(cell.x, elev + h * 0.55, cell.z)
      scale.set(cellW * 1.55, h, cellD * 1.55)
      dummy.compose(pos, quat, scale)
      mesh.setMatrixAt(revealed, dummy)
      const t = Math.min(1, cell.depthScene / 3.4)
      tint.copy(deep).lerp(mid, t * 0.85).lerp(foam, t > 0.82 ? 0.22 : 0)
      mesh.setColorAt(revealed, tint)
      revealed += 1
    }
    if (revealed !== revealedRef.current) {
      revealedRef.current = revealed
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  })

  if (cells.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, Math.max(1, cells.length)]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.52}
        roughness={0.28}
        metalness={0.04}
        depthWrite={false}
      />
    </instancedMesh>
  )
}

export { FloodSurface }
