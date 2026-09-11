import {
  ResizableSplitPane,
  VisualizationWorkspace,
  useWorkspaceFullscreen,
} from '@/components/layout/ResizableWorkspace'
import { DemoMapLayers } from '@/components/map/DemoMapLayers'
import { FloodMap } from '@/components/map/FloodMap'
import { FloodTimeline } from '@/components/map/FloodTimeline'
import { ParameterField } from '@/components/scenario/ParameterField'
import { Button } from '@/components/ui/button'
import { SceneErrorBoundary } from '@/components/scene/SceneErrorBoundary'
import { PARAM_BOUNDS, DEFAULT_SCENE_LAYERS } from '@/config/defaults'
import { DEMO_DAM } from '@/demo/demoDamConfig'
import { getCachedFlood } from '@/demo/demoFloodModel'
import { DamScene } from '@/scene/DamScene'
import { useFloodStore } from '@/store/useFloodStore'
import type { ComparisonSlot, EventType } from '@/types/simulation'
import { formatNumber } from '@/utils/format'
import { eventTypeLabel } from '@/utils/scenario'
import { useGlobalFullscreenRequest } from '@/hooks/useGlobalFullscreenRequest'
import { Settings2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

function ScenarioComparison() {
  const sync = useFloodStore((s) => s.syncComparisonFromPrimary)
  const runComparison = useFloodStore((s) => s.runComparison)
  const results = useFloodStore((s) => s.comparisonResults)
  const selectedDam = useFloodStore((s) => s.selectedDam)
  const setWorkspaceFullscreen = useFloodStore((s) => s.setWorkspaceFullscreen)
  const { fullscreen, toggleFullscreen, exitFullscreen, enterFullscreen } = useWorkspaceFullscreen()
  const [resizeToken, setResizeToken] = useState(0)
  const [paramsOpen, setParamsOpen] = useState(false)

  useGlobalFullscreenRequest(enterFullscreen)

  useEffect(() => {
    setWorkspaceFullscreen(fullscreen)
    return () => setWorkspaceFullscreen(false)
  }, [fullscreen, setWorkspaceFullscreen])

  const metricsBar =
    results.A && results.B ? (
      <div className="overflow-x-auto border-t border-navy-100 bg-white">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-100 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              <th className="px-4 py-2.5 font-semibold">Metric</th>
              <th className="px-4 py-2.5 font-semibold text-emerald-700">Controlled</th>
              <th className="px-4 py-2.5 font-semibold text-rose-700">Dam break</th>
            </tr>
          </thead>
          <tbody className="text-navy-950">
            <CompareRow
              label="Flood area"
              a={`${formatNumber(results.A.inundatedAreaKm2, 2)} km²`}
              b={`${formatNumber(results.B.inundatedAreaKm2, 2)} km²`}
            />
            <CompareRow
              label="Peak depth"
              a={`${formatNumber(results.A.maxWaterDepthM, 1)} m`}
              b={`${formatNumber(results.B.maxWaterDepthM, 1)} m`}
            />
            <CompareRow
              label="Arrival"
              a={
                results.A.estimatedArrivalMin != null
                  ? `${formatNumber(results.A.estimatedArrivalMin, 0)} min`
                  : '—'
              }
              b={
                results.B.estimatedArrivalMin != null
                  ? `${formatNumber(results.B.estimatedArrivalMin, 0)} min`
                  : '—'
              }
            />
            <CompareRow
              label="Flooded cells"
              a={formatNumber(results.A.floodedCellCount)}
              b={formatNumber(results.B.floodedCellCount)}
            />
            <CompareRow
              label="Features"
              a={formatNumber(results.A.infrastructureCount)}
              b={formatNumber(results.B.infrastructureCount)}
            />
          </tbody>
        </table>
      </div>
    ) : (
      <p className="border-t border-navy-100 px-4 py-2.5 text-center text-[12px] text-muted">
        Run both scenarios to populate comparison metrics.
      </p>
    )

  return (
    <VisualizationWorkspace
      title={selectedDam.name}
      subtitle="Scenario Comparison"
      fullscreen={fullscreen}
      onToggleFullscreen={toggleFullscreen}
      onExitFullscreen={exitFullscreen}
      hideLeft
      initialBottomPercent={results.A && results.B ? 22 : 10}
      bottomStorageKey="hydrotrace.workspace.comparison.bottomPercent"
      onWorkspaceResize={() => setResizeToken((n) => n + 1)}
      toolbar={
        <>
          <Button type="button" size="sm" variant="outline" onClick={sync}>
            Sync A / B from current
          </Button>
          <Button type="button" size="sm" onClick={runComparison}>
            Run both scenarios
          </Button>
          <Button
            type="button"
            size="sm"
            variant={paramsOpen ? 'default' : 'outline'}
            onClick={() => setParamsOpen((v) => !v)}
            aria-label="Toggle parameter drawer"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Parameters
          </Button>
        </>
      }
      bottom={
        <div>
          {metricsBar}
          <FloodTimeline />
        </div>
      }
    >
      <div className="relative h-full min-h-0">
        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center gap-8">
          <span className="rounded-full border border-emerald-200 bg-emerald-50/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
            Controlled release
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            vs
          </span>
          <span className="rounded-full border border-rose-200 bg-rose-50/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-800">
            Dam break
          </span>
        </div>

        <ResizableSplitPane
          direction="horizontal"
          initialPrimaryPercent={50}
          minPrimaryPercent={30}
          maxPrimaryPercent={70}
          storageKey="hydrotrace.workspace.comparison.splitPercent"
          onResize={() => setResizeToken((n) => n + 1)}
          className="h-full"
          primary={
            <ComparisonColumn
              slot="A"
              eventType="CONTROLLED_RELEASE"
              resizeToken={resizeToken}
            />
          }
          secondary={
            <ComparisonColumn
              slot="B"
              eventType="DAM_BREAK"
              resizeToken={resizeToken}
            />
          }
        />

        {paramsOpen ? (
          <div className="absolute bottom-3 right-3 top-12 z-30 flex w-[min(100%,320px)] flex-col overflow-hidden rounded-xl border border-navy-100 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-navy-100 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Parameters
              </p>
              <button
                type="button"
                aria-label="Close parameters"
                className="rounded p-1 text-muted hover:bg-surface"
                onClick={() => setParamsOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
              <ParamsSlot slot="A" eventType="CONTROLLED_RELEASE" />
              <div className="border-t border-navy-100 pt-3">
                <ParamsSlot slot="B" eventType="DAM_BREAK" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </VisualizationWorkspace>
  )
}

function CompareRow({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <tr className="border-b border-navy-50 last:border-0">
      <td className="px-4 py-2 text-muted">{label}</td>
      <td className="px-4 py-2 font-medium">{a}</td>
      <td className="px-4 py-2 font-semibold">{b}</td>
    </tr>
  )
}

function ParamsSlot({
  slot,
  eventType,
}: {
  slot: ComparisonSlot
  eventType: EventType
}) {
  const scenario = useFloodStore((s) => s.comparison[slot])
  const updateDam = useFloodStore((s) => s.updateComparisonDam)
  const updateBreach = useFloodStore((s) => s.updateComparisonBreach)

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {eventTypeLabel(eventType)}
      </p>
      <ParameterField
        id={`${slot}-height`}
        label="Dam height"
        unit="m"
        type="number"
        min={PARAM_BOUNDS.heightMeters.min}
        max={PARAM_BOUNDS.heightMeters.max}
        value={scenario.damParameters.heightMeters}
        onChange={(event) => updateDam(slot, { heightMeters: Number(event.target.value) })}
      />
      <ParameterField
        id={`${slot}-width`}
        label={eventType === 'DAM_BREAK' ? 'Breach width' : 'Gate opening width'}
        unit="m"
        type="number"
        value={scenario.breachParameters.widthMeters}
        onChange={(event) => updateBreach(slot, { widthMeters: Number(event.target.value) })}
      />
    </div>
  )
}

function ComparisonColumn({
  slot,
  eventType,
  resizeToken,
}: {
  slot: ComparisonSlot
  eventType: EventType
  resizeToken: number
}) {
  const scenario = useFloodStore((s) => s.comparison[slot])
  const location = useFloodStore((s) => s.scenario.location) ?? DEMO_DAM.location
  const metrics = useFloodStore((s) => s.comparisonResults[slot])
  const floodRevision = metrics?.floodedCellCount ?? 0
  const marker = scenario.location ?? location

  return (
    <section className="flex h-full min-h-0 flex-col bg-surface">
      <div className="min-h-0 flex-1">
        <ResizableSplitPane
          direction="vertical"
          initialPrimaryPercent={62}
          minPrimaryPercent={40}
          maxPrimaryPercent={80}
          storageKey={`hydrotrace.workspace.comparison.${slot}.vizSplit`}
          className="h-full"
          primary={
            <div className="h-full min-h-0 bg-[#1a2a3a]">
              <SceneErrorBoundary compact preserveWebGL>
                <DamScene
                  eventType={eventType}
                  layers={DEFAULT_SCENE_LAYERS}
                  cameraView="default"
                  cameraNonce={0}
                  quality="preview"
                  className="h-full w-full"
                  breached={eventType === 'DAM_BREAK'}
                  progressOverride={0.72}
                  floodRevision={floodRevision}
                  preferPrimary={false}
                />
              </SceneErrorBoundary>
            </div>
          }
          secondary={
            <div className="h-full min-h-0">
              <FloodMap
                marker={marker}
                interactive={false}
                compactHud
                resizeToken={resizeToken}
                environmentLabel={eventTypeLabel(eventType)}
                environmentDetail="Shared terrain · different source"
                overlay={
                  <DemoMapLayers
                    layers={{
                      terrain: true,
                      satellite: false,
                      dam: true,
                      reservoir: true,
                      infrastructure: true,
                      roads: true,
                      settlements: true,
                      floodExtent: Boolean(metrics),
                      floodDepth: false,
                      floodArrival: false,
                      hillshade: false,
                      slope: false,
                    }}
                    floodPolygon={
                      metrics ? (getCachedFlood(eventType)?.polygon ?? null) : null
                    }
                  />
                }
              />
            </div>
          }
        />
      </div>
    </section>
  )
}

export { ScenarioComparison }
