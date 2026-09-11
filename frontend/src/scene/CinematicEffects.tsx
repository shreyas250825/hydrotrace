import { ContactShadows, Sky } from '@react-three/drei'
import { EffectComposer, SMAA, Vignette } from '@react-three/postprocessing'

/** Stylized cinematic twin — soft daylight, engineered depth, no neon. */

function CinematicAtmosphere({ quality }: { quality: 'high' | 'preview' }) {
  return (
    <>
      <color attach="background" args={['#9eb4c8']} />
      <fog attach="fog" args={['#a9bdcf', 95, 275]} />
      <Sky
        sunPosition={[42, 32, 18]}
        turbidity={3.6}
        rayleigh={0.85}
        mieCoefficient={0.004}
        mieDirectionalG={0.8}
      />
      <hemisphereLight args={['#eef4fa', '#6d7a5c', 0.95]} />
      <ambientLight intensity={0.38} />
      <directionalLight
        position={[40, 52, 24]}
        intensity={1.45}
        color="#fff8ee"
        castShadow={quality === 'high'}
        shadow-mapSize-width={quality === 'high' ? 1024 : 512}
        shadow-mapSize-height={quality === 'high' ? 1024 : 512}
        shadow-camera-far={180}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
      />
      <directionalLight position={[-28, 20, -18]} intensity={0.28} color="#c5d8ea" />
      {quality === 'high' ? (
        <ContactShadows
          position={[0, 0.02, 12]}
          opacity={0.18}
          scale={160}
          blur={2.8}
          far={40}
        />
      ) : null}
      {quality === 'high' ? (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <SMAA />
          <Vignette darkness={0.22} offset={0.35} />
        </EffectComposer>
      ) : null}
    </>
  )
}

export { CinematicAtmosphere }
