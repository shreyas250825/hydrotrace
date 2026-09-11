import { EventTypeToggle } from '@/components/scenario/EventTypeToggle'
import { DerivedHydraulicsCard } from '@/components/science/ModelStatus'
import { SceneErrorBoundary } from '@/components/scene/SceneErrorBoundary'
import {
  VisualizationWorkspace,
  useWorkspaceFullscreen,
} from '@/components/layout/ResizableWorkspace'
import { FloodTimeline } from '@/components/map/FloodTimeline'
import { Button } from '@/components/ui/button'
import { getDamConfig } from '@/demo/demoDamConfig'
import { DamScene } from '@/scene/DamScene'
import { ensureVizClock, vizRuntime } from '@/scene/vizRuntime'
import { useFloodStore } from '@/store/useFloodStore'
import type { CameraMode, CameraView, SceneLayers } from '@/types/simulation'
import { formatNumber } from '@/utils/format'
import { eventTypeLabel } from '@/utils/scenario'
import { useGlobalFullscreenRequest } from '@/hooks/useGlobalFullscreenRequest'
import { Camera, Layers, RotateCcw, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'

const LAYER_LABELS: { key: keyof SceneLayers; label: string }[] = [
  { key: 'terrain', label: 'Terrain' },
  { key: 'water', label: 'Reservoir' },
  { key: 'dam', label: 'Dam' },
  { key: 'floodPreview', label: 'Flood water' },
  { key: 'buildings', label: 'Buildings' },
  { key: 'roads', label: 'Roads' },
  { key: 'infrastructure', label: 'Critical infrastructure' },
  { key: 'vegetation', label: 'Vegetation' },
  { key: 'riskZones', label: 'Risk zones' },
  { key: 'flowAnalysis', label: 'Flow analysis' },
]

const CAMERA_PRESET_BUTTONS: { id: CameraView; label: string }[] = [
  { id: 'dam', label: 'Dam' },
  { id: 'downstream', label: 'Downstream' },
  { id: 'aerial', label: 'Aerial' },
  { id: 'breach', label: 'Impact' },
  { id: 'reservoir', label: 'Overview' },
]

function statusCopy(phase: string, completed: boolean) {
  if (phase === 'warning') return { title: 'STRUCTURAL ALERT', tone: 'warn' as const }
  if (phase === 'breach') return { title: 'BREACH FORMING', tone: 'warn' as const }
  if (phase === 'release' || phase === 'flood')
    return { title: 'FLOOD PROPAGATION', tone: 'alert' as const }
  if (completed) return { title: 'MAX EXTENT REACHED', tone: 'ok' as const }
  return { title: 'IDLE · STABLE', tone: 'ok' as const }
}

function FloatingCard({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-slate-950/85 p-3 shadow-lg backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {title}
        </p>
        <button type="button" onClick={onClose} className="rounded p-0.5 text-slate-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  )
}

function CommandCenter() {
  const scenario = useFloodStore((s) => s.scenario)
  const selectedDamId = useFloodStore((s) => s.selectedDamId)
  const selectedDam = useFloodStore((s) => s.selectedDam)
  const previewEventType = useFloodStore((s) => s.previewEventType)
  const setPreviewEventType = useFloodStore((s) => s.setPreviewEventType)
  const sceneLayers = useFloodStore((s) => s.sceneLayers)
  const toggleSceneLayer = useFloodStore((s) => s.toggleSceneLayer)
  const cameraView = useFloodStore((s) => s.cameraView)
  const cameraNonce = useFloodStore((s) => s.cameraNonce)
  const setCameraView = useFloodStore((s) => s.setCameraView)
  const cameraMode = useFloodStore((s) => s.cameraMode)
  const setCameraMode = useFloodStore((s) => s.setCameraMode)
  const setImmersiveMode = useFloodStore((s) => s.setImmersiveMode)
  const cinematicActive = useFloodStore((s) => s.cinematicActive)
  const startCinematic = useFloodStore((s) => s.startCinematic)
  const skipCinematic = useFloodStore((s) => s.skipCinematic)
  const setCurrentView = useFloodStore((s) => s.setCurrentView)
  const breachPhase = useFloodStore((s) => s.breachPhase)
  const initiateDamBreak = useFloodStore((s) => s.initiateDamBreak)
  const simulation = useFloodStore((s) => s.simulation)
  const runDemonstration = useFloodStore((s) => s.runDemonstration)
  const timelineProgress = useFloodStore((s) => s.timelineProgress)
  const terrainExaggeration = useFloodStore((s) => s.terrainExaggeration)
  const setTerrainExaggeration = useFloodStore((s) => s.setTerrainExaggeration)
  const setWorkspaceFullscreen = useFloodStore((s) => s.setWorkspaceFullscreen)

  const { fullscreen, toggleFullscreen, exitFullscreen, enterFullscreen } = useWorkspaceFullscreen()
  const [layersOpen, setLayersOpen] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [resizeNonce, setResizeNonce] = useState(0)
  const damCfg = getDamConfig()

  useGlobalFullscreenRequest(enterFullscreen)

  const breached =
    previewEventType === 'DAM_BREAK' &&
    (vizRuntime.breached ||
      breachPhase === 'breach' ||
      breachPhase === 'release' ||
      breachPhase === 'flood' ||
      (simulation.status === 'COMPLETED' && scenario.eventType === 'DAM_BREAK'))

  useEffect(() => {
    ensureVizClock()
    vizRuntime.eventType = previewEventType
  }, [previewEventType])

  useEffect(() => {
    setWorkspaceFullscreen(fullscreen)
    setImmersiveMode(fullscreen)
    return () => {
      setWorkspaceFullscreen(false)
      setImmersiveMode(false)
    }
  }, [fullscreen, setWorkspaceFullscreen, setImmersiveMode])

  // Force R3F parent size after fullscreen CSS settles (same canvas instance — no remount)
  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setResizeNonce((n) => n + 1)
      window.dispatchEvent(new Event('resize'))
    }, 60)
    const t2 = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 240)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [fullscreen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setCameraView('aerial')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCameraView])

  const floodRevision = simulation.results.floodedCellCount ?? 0
  const status = statusCopy(breachPhase, simulation.status === 'COMPLETED')

  return (
    <VisualizationWorkspace
      title={selectedDam.name}
      subtitle="3D Command Center"
      dark
      fullscreen={fullscreen}
      onToggleFullscreen={toggleFullscreen}
      onExitFullscreen={exitFullscreen}
      leftStorageKey="hydrotrace.workspace.commandCenter.leftPercent"
      bottomStorageKey="hydrotrace.workspace.commandCenter.bottomPercent"
      hideLeft
      initialBottomPercent={12}
      maxLeftPercent={22}
      minLeftPercent={12}
      resizeNonce={resizeNonce}
      onWorkspaceResize={() => setResizeNonce((n) => n + 1)}
      toolbar={
        <>
          <span
            className={
              status.tone === 'warn' || status.tone === 'alert'
                ? 'text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200'
                : 'text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/90'
            }
          >
            {status.title}
          </span>
          <Button type="button" variant="danger" size="sm" onClick={initiateDamBreak}>
            Initiate dam break
          </Button>
          <Button
            type="button"
            size="sm"
            variant="accent"
            disabled={simulation.status === 'PROCESSING'}
            onClick={() => void runDemonstration({ stayOnView: 'command' })}
          >
            Run simulation
          </Button>
          {cinematicActive ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 text-white"
              onClick={skipCinematic}
            >
              Skip animation
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 text-white"
              onClick={startCinematic}
            >
              Replay sequence
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/20 text-white"
            onClick={() => {
              setLayersOpen((v) => !v)
              setCameraOpen(false)
            }}
          >
            <Layers className="h-3.5 w-3.5" />
            Layers
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/20 text-white"
            onClick={() => {
              setCameraOpen((v) => !v)
              setLayersOpen(false)
            }}
          >
            <Camera className="h-3.5 w-3.5" />
            Camera
          </Button>
        </>
      }
      floatingRight={
        <div className="space-y-2">
          {layersOpen ? (
            <FloatingCard title="Layers" onClose={() => setLayersOpen(false)}>
              <div className="max-h-[40vh] space-y-1 overflow-y-auto">
                {LAYER_LABELS.map((layer) => (
                  <label
                    key={layer.key}
                    className="flex items-center gap-2 text-sm text-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={sceneLayers[layer.key]}
                      onChange={() => toggleSceneLayer(layer.key)}
                      className="accent-cyan-500"
                    />
                    {layer.label}
                  </label>
                ))}
              </div>
              <label className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-300">
                Terrain exaggeration
                <span className="font-mono text-white">{terrainExaggeration.toFixed(1)}×</span>
              </label>
              <input
                type="range"
                min={50}
                max={300}
                value={Math.round(terrainExaggeration * 100)}
                onChange={(e) => setTerrainExaggeration(Number(e.target.value) / 100)}
                className="mt-1 w-full accent-cyan-400"
              />
            </FloatingCard>
          ) : null}
          {cameraOpen ? (
            <FloatingCard title="Camera" onClose={() => setCameraOpen(false)}>
              <div className="mb-2 grid grid-cols-3 gap-1">
                {(['orbit', 'explore', 'drone'] as CameraMode[]).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    size="sm"
                    variant={cameraMode === mode ? 'accent' : 'outline'}
                    className={cameraMode === mode ? '' : 'border-white/15 bg-white/5 text-white'}
                    onClick={() => setCameraMode(mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {CAMERA_PRESET_BUTTONS.map(({ id, label }) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={cameraView === id ? 'accent' : 'outline'}
                    className={
                      cameraView === id ? '' : 'border-white/15 bg-white/5 text-white'
                    }
                    onClick={() => setCameraView(id)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-2 w-full border-white/15 bg-white/5 text-white"
                variant="outline"
                onClick={() => setCameraView('aerial')}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset camera
              </Button>
            </FloatingCard>
          ) : (
            <div className="rounded-xl border border-white/15 bg-slate-950/85 p-3 text-sm text-slate-100 shadow-lg backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Scenario · {damCfg.reservoir}
              </p>
              <p className="mt-1 font-medium">{eventTypeLabel(previewEventType)}</p>
              <p className="mt-1 text-xs text-slate-400">
                Breach {formatNumber(scenario.breachParameters.widthMeters)} ×{' '}
                {formatNumber(scenario.breachParameters.depthMeters)} m
              </p>
              {simulation.status === 'COMPLETED' ? (
                <p className="mt-2 text-xs text-cyan-200">
                  Inundation {formatNumber(simulation.results.maxFloodExtentKm2 ?? 0, 2)} km²
                </p>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="mt-2 w-full border-white/15 bg-white/5 text-white"
                  variant="outline"
                  onClick={() => setCurrentView('scenario')}
                >
                  Adjust parameters
                </Button>
              )}
              <div className="mt-2">
                <EventTypeToggle
                  size="compact"
                  value={previewEventType}
                  onChange={setPreviewEventType}
                />
              </div>
              <div className="mt-2 [&_section]:border-white/10 [&_section]:bg-white/5">
                <DerivedHydraulicsCard />
              </div>
            </div>
          )}
        </div>
      }
      bottom={
        <div className="space-y-0">
          {breachPhase === 'warning' ? (
            <p className="border-b border-amber-400/20 bg-amber-950/40 px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-[0.14em] text-amber-100">
              Breach sequence starting
            </p>
          ) : null}
          {simulation.status === 'PROCESSING' ? (
            <div className="border-b border-white/10 px-3 py-2">
              <p className="text-[11px] text-cyan-300">{simulation.stepLabel}</p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-cyan-400"
                  style={{ width: `${simulation.progress}%` }}
                />
              </div>
            </div>
          ) : null}
          <FloodTimeline dark />
        </div>
      }
    >
      {/* Stable canvas host — never remounted when toggling fullscreen */}
      <div className="absolute inset-0 h-full w-full" key={`scene-host-${selectedDamId}`}>
        <SceneErrorBoundary preserveWebGL>
          <DamScene
            key={selectedDamId}
            className="h-full w-full"
            eventType={previewEventType}
            layers={sceneLayers}
            cameraView={cameraView}
            cameraNonce={cameraNonce}
            cameraMode={cameraMode}
            quality="high"
            breached={breached}
            floodRevision={floodRevision}
            progressOverride={timelineProgress}
          />
        </SceneErrorBoundary>
      </div>
    </VisualizationWorkspace>
  )
}

export { CommandCenter }
