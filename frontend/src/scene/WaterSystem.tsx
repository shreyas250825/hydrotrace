import { vizRuntime } from '@/scene/vizRuntime'
import type { EventType } from '@/types/simulation'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  Color,
  ShaderMaterial,
  type Mesh,
  type MeshStandardMaterial,
} from 'three'

const waterVert = /* glsl */ `
uniform float uTime;
uniform float uAmp;
varying vec2 vUv;
varying float vFres;
varying float vWave;
void main() {
  vUv = uv;
  vec3 p = position;
  float w1 = sin(p.x * 0.14 + uTime * 0.72) * uAmp;
  float w2 = sin(p.y * 0.11 + uTime * 0.55) * uAmp * 0.55;
  float w3 = sin((p.x + p.y) * 0.22 + uTime * 0.95) * uAmp * 0.22;
  p.z += w1 + w2 + w3;
  vWave = w1 + w2;
  vec3 world = (modelMatrix * vec4(p, 1.0)).xyz;
  vec3 viewDir = normalize(cameraPosition - world);
  vFres = pow(1.0 - abs(dot(viewDir, vec3(0.0, 1.0, 0.0))), 2.4);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

const waterFrag = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform float uOpacity;
varying vec2 vUv;
varying float vFres;
varying float vWave;
void main() {
  float shore = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
  vec3 col = mix(uDeep, uShallow, vFres * 0.65 + vWave * 1.2);
  col += vec3(0.12, 0.18, 0.22) * vFres;
  gl_FragColor = vec4(col, mix(uOpacity, 0.38, 1.0 - shore));
}
`

function WaterSystem({
  eventType,
  breached,
  progressOverride,
}: {
  eventType: EventType
  breached: boolean
  progressOverride?: number
}) {
  const reservoirMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uAmp: { value: 0.12 },
          uDeep: { value: new Color('#0c4a6e') },
          uShallow: { value: new Color('#0284c7') },
          uOpacity: { value: 0.78 },
        },
        vertexShader: waterVert,
        fragmentShader: waterFrag,
        transparent: true,
        depthWrite: false,
      }),
    [],
  )

  const sheetRef = useRef<Mesh>(null)
  const spillRef = useRef<Mesh>(null)
  const reservoirRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    reservoirMat.uniforms.uTime.value += delta
    const p = progressOverride ?? vizRuntime.progress
    const breakMode = eventType === 'DAM_BREAK' && breached

    if (reservoirRef.current) {
      reservoirRef.current.position.y = 8.18 - (breakMode ? p * 0.7 : 0)
    }

    // Broad sheet release — not a glowing cylinder jet
    const surge = breakMode && p > 0.03
    if (sheetRef.current) {
      sheetRef.current.visible = surge
      const reach = 0.4 + p * 2.4
      const width = 0.7 + p * 1.8
      sheetRef.current.scale.set(width, 0.75 + p * 0.6, reach)
      const mat = sheetRef.current.material as MeshStandardMaterial
      mat.opacity = surge ? 0.28 + p * 0.22 : 0
    }

    if (spillRef.current) {
      const visible = eventType === 'CONTROLLED_RELEASE'
      spillRef.current.visible = visible
      spillRef.current.scale.set(1, 1, 0.5 + p * 1.1)
      const mat = spillRef.current.material as MeshStandardMaterial
      mat.opacity = visible ? 0.3 + p * 0.22 : 0
    }
  })

  return (
    <group>
      <mesh
        ref={reservoirRef}
        position={[0, 8.18, -44]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={reservoirMat}
      >
        <planeGeometry args={[48, 78, 48, 56]} />
      </mesh>

      <mesh ref={spillRef} position={[10.6, 4.6, 11]} rotation={[0.55, 0, 0]}>
        <boxGeometry args={[3.4, 0.4, 18]} />
        <meshStandardMaterial
          color="#0284c7"
          transparent
          opacity={0.28}
          depthWrite={false}
          roughness={0.15}
          metalness={0.05}
        />
      </mesh>

      {/* Wide translucent sheet through breach — engineered, not game jet */}
      <mesh ref={sheetRef} position={[0, 4.2, 2]} rotation={[0.35, 0, 0]} visible={false}>
        <boxGeometry args={[3.6, 1.1, 14]} />
        <meshStandardMaterial
          color="#0369a1"
          transparent
          opacity={0.32}
          depthWrite={false}
          roughness={0.18}
          metalness={0.04}
        />
      </mesh>
    </group>
  )
}

export { WaterSystem }
