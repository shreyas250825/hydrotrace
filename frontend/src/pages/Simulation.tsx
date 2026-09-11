import { ExportPanel } from '@/components/export/ExportPanel'
import {
  VisualizationWorkspace,
  useWorkspaceFullscreen,
} from '@/components/layout/ResizableWorkspace'
import { DemoMapLayers } from '@/components/map/DemoMapLayers'
import { FloodMap } from '@/components/map/FloodMap'
import { FloodTimeline } from '@/components/map/FloodTimeline'
import { DerivedHydraulicsCard, ModelAssumptionsHint } from '@/components/science/ModelStatus'
import { AwaitingState } from '@/components/status/AwaitingState'
import { SimulationStatusBadge } from '@/components/status/SimulationStatusBadge'
import { Button } from '@/components/ui/button'
import { getDamConfig } from '@/demo/demoDamConfig'
import { PROCESSING_STEPS } from '@/demo/demoScenarios'
import { useGlobalFullscreenRequest } from '@/hooks/useGlobalFullscreenRequest'
import { useFloodStore } from '@/store/useFloodStore'
import { formatNumber } from '@/utils/format'
import { eventTypeLabel } from '@/utils/scenario'
import { Clock, Droplets, Gauge, Maximize2, Play, X } from 'lucide-react'
import { useEffect, useState } from 'react'

function Simulation() {
  const scenario = useFloodStore((s) => s.scenario)
  const simulation = useFloodStore((s) => s.simulation)
  const layers = useFloodStore((s) => s.geospatialLayers)
  const polygon = useFloodStore((s) => s.floodPolygon)
  const impact = useFloodStore((s) => s.impactAnalysis)
  const setCurrentView = useFloodStore((s) => s.setCurrentView)
  const runDemonstration = useFloodStore((s) => s.runDemonstration)
  const selectedDam = useFloodStore((s) => s.selectedDam)
  const setWorkspaceFullscreen = useFloodStore((s) => s.setWorkspaceFullscreen)
  const location = scenario.location
  const done = simulation.status === 'COMPLETED'
  const processing = simulation.status === 'PROCESSING'
  const damCfg = getDamConfig()
  const { fullscreen, toggleFullscreen, exitFullscreen, enterFullscreen } = useWorkspaceFullscreen()
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [resizeToken, setResizeToken] = useState(0)

  useGlobalFullscreenRequest(enterFullscreen)

  useEffect(() => {
    setWorkspaceFullscreen(fullscreen)
    return () => setWorkspaceFullscreen(false)
  }, [fullscreen, setWorkspaceFullscreen])

  const metrics = (
    <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
      <Metric
        icon={Maximize2}
        label="Inundated area"
        value={done ? `${formatNumber(simulation.results.maxFloodExtentKm2 ?? 0, 2)} km²` : null}
      />
      <Metric
        icon={Droplets}
        label="Max depth"
        value={done ? `${formatNumber(simulation.results.maxWaterDepthM ?? 0, 1)} m` : null}
      />
      <Metric
        icon={Clock}
        label="Arrival span"
        value={
          done ? `${formatNumber(simulation.results.estimatedArrivalTimeMin ?? 0)} min` : null
        }
      />
      <Metric
        icon={Gauge}
        label="Flooded cells"
        value={done ? formatNumber(simulation.results.floodedCellCount ?? 0) : null}
      />
    </div>
  )

  return (
    <VisualizationWorkspace
      title={selectedDam.name}
      subtitle="Simulation"
      fullscreen={fullscreen}
      onToggleFullscreen={toggleFullscreen}
      onExitFullscreen={exitFullscreen}
      leftStorageKey="hydrotrace.workspace.simulation.leftPercent"
      bottomStorageKey="hydrotrace.workspace.simulation.bottomPercent"
      initialLeftPercent={0}
      hideLeft
      initialBottomPercent={22}
      onWorkspaceResize={() => setResizeToken((n) => n + 1)}
      toolbar={
        <>
          <SimulationStatusBadge status={simulation.status} />
          <ModelAssumptionsHint compact />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setInspectorOpen((v) => !v)}
          >
            {inspectorOpen ? 'Hide panel' : 'Scenario'}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={processing}
            onClick={() => void runDemonstration()}
          >
            <Play className="h-3.5 w-3.5" />
            Run
          </Button>
        </>
      }
      floatingRight={
        inspectorOpen ? (
          <div className="rounded-xl border border-navy-100 bg-white/96 p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500">
                Scenario
              </p>
              <button type="button" onClick={() => setInspectorOpen(false)}>
                <X className="h-4 w-4 text-navy-400" />
              </button>
            </div>
            {location ? (
              <dl className="space-y-2 text-sm">
                <Row label="Event" value={eventTypeLabel(scenario.eventType)} />
                <Row
                  label="Height"
                  value={`${formatNumber(scenario.damParameters.heightMeters)} m`}
                />
                <Row
                  label="Level"
                  value={`${scenario.damParameters.currentWaterLevelPercent}%`}
                />
              </dl>
            ) : (
              <AwaitingState title="No location" detail="Complete Scenario Setup." />
            )}
            <div className="mt-3">
              <DerivedHydraulicsCard />
            </div>
            <Button
              className="mt-3 w-full"
              size="sm"
              variant="outline"
              onClick={() => setCurrentView('command')}
            >
              Open 3D
            </Button>
            <div className="mt-3">
              <ExportPanel compact />
            </div>
          </div>
        ) : null
      }
      bottom={
        <div>
          {metrics}
          <p className="border-t border-navy-50 px-3 pb-1 text-[11px] text-navy-500">
            Outputs of the current terrain-aware demonstration model.
          </p>
          <FloodTimeline />
        </div>
      }
    >
      <div className="relative h-full min-h-0 w-full">
        {location ? (
          <FloodMap
            mapKey={selectedDam.id}
            marker={location}
            interactive={false}
            resizeToken={resizeToken}
            className="rounded-none border-0"
            environmentLabel="Flood map"
            environmentDetail={
              done
                ? 'Inundation from the terrain-aware flood model.'
                : `${damCfg.name} · Run the model to attach the flood mask.`
            }
            overlay={
              <DemoMapLayers
                layers={{ ...layers, floodExtent: done && layers.floodExtent }}
                floodPolygon={polygon}
                impact={impact}
              />
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-white">
            <AwaitingState
              title="No dam location"
              detail="Select a dam or place a marker on the scenario map."
            />
          </div>
        )}
        {processing ? (
          <div className="absolute inset-0 z-[700] flex items-end justify-center bg-navy-950/15 pb-8">
            <div className="w-full max-w-md rounded-xl border border-navy-100 bg-white/96 p-4 shadow-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
                {simulation.stepLabel?.toUpperCase() ?? 'PROCESSING'}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy-100">
                <div
                  className="h-full bg-navy-800 transition-all"
                  style={{ width: `${simulation.progress}%` }}
                />
              </div>
              <ol className="mt-3 grid grid-cols-2 gap-1 text-[11px] text-navy-500">
                {PROCESSING_STEPS.map((step) => (
                  <li
                    key={step.id}
                    className={
                      simulation.stepLabel === step.label ? 'font-semibold text-navy-900' : ''
                    }
                  >
                    {step.label}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </div>
    </VisualizationWorkspace>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Maximize2
  label: string
  value: string | null
}) {
  return (
    <div className="rounded-lg border border-navy-100 bg-navy-50/60 px-3 py-2">
      <div className="flex items-center gap-1.5 text-navy-500">
        <Icon className="h-3 w-3" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em]">{label}</p>
      </div>
      <p className={`mt-1 text-lg font-semibold ${value ? 'text-navy-900' : 'text-navy-400'}`}>
        {value ?? '—'}
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-xs uppercase tracking-[0.08em] text-navy-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-navy-900">{value}</dd>
    </div>
  )
}

export { Simulation }
