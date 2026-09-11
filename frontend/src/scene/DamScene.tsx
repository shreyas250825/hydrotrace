import { SceneErrorBoundary } from '@/components/scene/SceneErrorBoundary'
import { BreachEffects } from '@/scene/BreachEffects'
import { CameraController } from '@/scene/CameraController'
import { CAMERA_PRESETS } from '@/scene/cameraPresets'
import { CinematicAtmosphere } from '@/scene/CinematicEffects'
import { DamScene2D } from '@/scene/DamScene2D'
import { DamStructure } from '@/scene/DamStructure'
import { DemoInfrastructure } from '@/scene/DemoInfrastructure'
import { FloodSurface } from '@/scene/FloodSurface'
import { FlowAnalysis } from '@/scene/FlowAnalysis'
import { TerrainMesh } from '@/scene/TerrainMesh'
import { Vegetation } from '@/scene/Vegetation'
import { ensureVizClock } from '@/scene/vizRuntime'
import { WaterSystem } from '@/scene/WaterSystem'
import { isWebGLAvailable } from '@/scene/webglSupport'
import type { CameraMode, CameraView, EventType, SceneLayers } from '@/types/simulation'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'

function SceneContent({
  eventType,
  layers,
  cameraView,
  cameraNonce,
  cameraMode,
  quality,
  breached,
  progressOverride,
  floodRevision,
  preferPrimary,
}: {
  eventType: EventType
  layers: SceneLayers
  cameraView: CameraView
  cameraNonce: number
  cameraMode: CameraMode
  quality: 'high' | 'preview'
  breached: boolean
  progressOverride?: number
  floodRevision: number
  preferPrimary: boolean
}) {
  return (
    <>
      <CinematicAtmosphere quality={quality} />
      <CameraController view={cameraView} nonce={cameraNonce} mode={cameraMode} />
      <OrbitControls
        makeDefault
        enabled={cameraMode === 'orbit'}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={8}
        maxDistance={150}
        target={CAMERA_PRESETS[cameraView].target}
      />
      {layers.terrain ? <TerrainMesh quality={quality} /> : null}
      {layers.dam ? <DamStructure breached={breached} quality={quality} /> : null}
      {layers.water ? (
        <WaterSystem
          eventType={eventType}
          breached={breached}
          progressOverride={progressOverride}
        />
      ) : null}
      {layers.floodPreview ? (
        <FloodSurface
          eventType={eventType}
          progressOverride={progressOverride}
          floodRevision={floodRevision}
          preferPrimary={preferPrimary}
        />
      ) : null}
      {layers.buildings || layers.roads || layers.infrastructure ? (
        <DemoInfrastructure
          showBuildings={layers.buildings}
          showRoads={layers.roads}
          showCritical={layers.infrastructure}
          showRisk={layers.riskZones}
        />
      ) : null}
      {layers.vegetation ? <Vegetation quality={quality} /> : null}
      {layers.flowAnalysis ? <FlowAnalysis visible floodRevision={floodRevision} /> : null}
      {eventType === 'DAM_BREAK' && breached ? <BreachEffects active /> : null}
    </>
  )
}

function DamScene({
  eventType,
  layers,
  cameraView,
  cameraNonce,
  cameraMode = 'orbit',
  quality = 'high',
  className,
  breached = false,
  progressOverride,
  floodRevision = 0,
  preferPrimary = true,
}: {
  eventType: EventType
  layers: SceneLayers
  cameraView: CameraView
  cameraNonce: number
  cameraMode?: CameraMode
  quality?: 'high' | 'preview'
  className?: string
  breached?: boolean
  progressOverride?: number
  floodRevision?: number
  preferPrimary?: boolean
}) {
  const [tier, setTier] = useState<'full' | 'core' | '2d'>(() =>
    isWebGLAvailable() ? 'full' : '2d',
  )

  useEffect(() => {
    ensureVizClock()
  }, [])

  const twoD = (
    <DamScene2D
      eventType={eventType}
      layers={layers}
      cameraView={cameraView}
      cameraNonce={cameraNonce}
      quality={quality}
      className={className}
      breached={breached}
      progressOverride={progressOverride}
      floodRevision={floodRevision}
      preferPrimary={preferPrimary}
    />
  )

  if (tier === '2d') return twoD

  const preset = CAMERA_PRESETS[cameraView]
  const sceneQuality = tier === 'full' && quality === 'high' ? 'high' : 'preview'

  return (
    <SceneErrorBoundary
      key={tier}
      preserveWebGL
      onFail={() => setTier((current) => (current === 'full' ? 'core' : '2d'))}
      fallback={null}
    >
      {/* Absolute fill parent is required so R3F ResizeObserver never sees height:0 */}
      <div
        className={className}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <Canvas
          style={{
            position: 'absolute',
            inset: 0,
            display: 'block',
            width: '100%',
            height: '100%',
          }}
          shadows={sceneQuality === 'high'}
          dpr={[1, 1.25]}
          resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
          camera={{
            position: preset.position,
            fov: 38,
            near: 0.35,
            far: 420,
          }}
          gl={{
            antialias: sceneQuality === 'high',
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
            alpha: false,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#8fa8bc')
          }}
        >
          <Suspense fallback={null}>
            <SceneContent
              eventType={eventType}
              layers={layers}
              cameraView={cameraView}
              cameraNonce={cameraNonce}
              cameraMode={cameraMode}
              quality={sceneQuality}
              breached={breached}
              progressOverride={progressOverride}
              floodRevision={floodRevision}
              preferPrimary={preferPrimary}
            />
          </Suspense>
        </Canvas>
      </div>
    </SceneErrorBoundary>
  )
}

export { DamScene }
