import { vizRuntime } from '@/scene/vizRuntime'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three'

const COUNT = 90
const dummy = new Object3D()

function randoms() {
  return Array.from({ length: COUNT }, () => ({
    x: (Math.random() - 0.5) * 2.8,
    y: 3 + Math.random() * 5,
    z: -6 + Math.random() * 6,
    vx: (Math.random() - 0.5) * 2.2,
    vy: 0.8 + Math.random() * 3.5,
    vz: 3 + Math.random() * 7,
    life: Math.random(),
    size: 0.06 + Math.random() * 0.12,
  }))
}

/** Quiet mist at breach — no game-like glow or red lights. */
function BreachEffects({ active }: { active: boolean }) {
  const sprayRef = useRef<InstancedMesh>(null)
  const particles = useMemo(randoms, [])

  useFrame((_, delta) => {
    const spray = sprayRef.current
    const show = active && vizRuntime.progress > 0.03
    if (spray) spray.visible = show
    if (!show || !spray) return

    const p = vizRuntime.progress
    for (let i = 0; i < COUNT; i += 1) {
      const s = particles[i]
      s.life += delta * (0.4 + p * 0.6)
      if (s.life > 1) {
        s.life = 0
        s.x = (Math.random() - 0.5) * 2.2
        s.y = 3.2 + Math.random() * 2.5
        s.z = -7.2
      }
      const t = s.life
      dummy.position.set(
        s.x + s.vx * t,
        s.y + s.vy * t - t * t * 6,
        s.z + s.vz * t,
      )
      dummy.scale.setScalar(s.size * (1 - t))
      dummy.updateMatrix()
      spray.setMatrixAt(i, dummy.matrix)
    }
    spray.instanceMatrix.setUsage(DynamicDrawUsage)
    spray.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={sprayRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 5, 5]} />
      <meshBasicMaterial color="#bae6fd" transparent opacity={0.35} depthWrite={false} />
    </instancedMesh>
  )
}

export { BreachEffects }
