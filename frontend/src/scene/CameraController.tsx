import { CAMERA_PRESETS, CINEMATIC_SHOTS } from '@/scene/cameraPresets'
import { vizRuntime } from '@/scene/vizRuntime'
import type { CameraMode, CameraView } from '@/types/simulation'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'

const tmpA = new Vector3()
const tmpB = new Vector3()
const forward = new Vector3()
const right = new Vector3()

function CameraController({
  view,
  nonce,
  mode,
}: {
  view: CameraView
  nonce: number
  mode: CameraMode
}) {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls)
  const destPos = useRef(new Vector3(...CAMERA_PRESETS[view].position))
  const destTarget = useRef(new Vector3(...CAMERA_PRESETS[view].target))
  const currentTarget = useRef(new Vector3(...CAMERA_PRESETS[view].target))
  const keys = useRef<Record<string, boolean>>({})

  useEffect(() => {
    const preset = CAMERA_PRESETS[view]
    destPos.current.set(...preset.position)
    destTarget.current.set(...preset.target)
  }, [view, nonce])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current[event.code] = true
    }
    const up = (event: KeyboardEvent) => {
      keys.current[event.code] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame((_, dt) => {
    if (mode === 'cinematic') {
      const t = vizRuntime.cinematicT
      const shots = CINEMATIC_SHOTS
      let from = shots[0]
      let to = shots[shots.length - 1]
      for (let i = 0; i < shots.length - 1; i += 1) {
        if (t >= shots[i].t && t <= shots[i + 1].t) {
          from = shots[i]
          to = shots[i + 1]
          break
        }
      }
      const span = Math.max(0.001, to.t - from.t)
      const u = Math.min(1, Math.max(0, (t - from.t) / span))
      const ease = u * u * (3 - 2 * u)
      tmpA.set(...CAMERA_PRESETS[from.view].position)
      tmpB.set(...CAMERA_PRESETS[to.view].position)
      camera.position.lerpVectors(tmpA, tmpB, ease)
      tmpA.set(...CAMERA_PRESETS[from.view].target)
      tmpB.set(...CAMERA_PRESETS[to.view].target)
      currentTarget.current.lerpVectors(tmpA, tmpB, ease)
      camera.lookAt(currentTarget.current)
      return
    }

    if (mode === 'explore' || mode === 'drone') {
      const speed = mode === 'drone' ? 26 : 14
      camera.getWorldDirection(forward)
      if (mode === 'explore') forward.y = 0
      forward.normalize()
      right.crossVectors(forward, camera.up).normalize()
      if (keys.current.KeyW) camera.position.addScaledVector(forward, speed * dt)
      if (keys.current.KeyS) camera.position.addScaledVector(forward, -speed * dt)
      if (keys.current.KeyA) camera.position.addScaledVector(right, -speed * dt)
      if (keys.current.KeyD) camera.position.addScaledVector(right, speed * dt)
      if (mode === 'drone') {
        if (keys.current.KeyE || keys.current.Space) camera.position.y += speed * dt
        if (keys.current.KeyQ || keys.current.ShiftLeft) camera.position.y -= speed * dt
      }
      camera.position.x = Math.max(-52, Math.min(52, camera.position.x))
      camera.position.z = Math.max(-72, Math.min(78, camera.position.z))
      camera.position.y = Math.max(
        mode === 'explore' ? 2.4 : 6,
        Math.min(mode === 'drone' ? 72 : 16, camera.position.y),
      )
      return
    }

    const k = 1 - Math.pow(0.0008, dt)
    camera.position.lerp(destPos.current, k)
    currentTarget.current.lerp(destTarget.current, k)
    camera.lookAt(currentTarget.current)
    if (
      controls &&
      typeof controls === 'object' &&
      'target' in controls &&
      'update' in controls
    ) {
      const orbit = controls as {
        target: { copy: (v: Vector3) => void }
        update: () => void
      }
      orbit.target.copy(currentTarget.current)
      orbit.update()
    }
  })

  return null
}

export { CameraController }
