import { ExportPanel } from '@/components/export/ExportPanel'
import {
  VisualizationWorkspace,
  useWorkspaceFullscreen,
} from '@/components/layout/ResizableWorkspace'
import { DemoMapLayers } from '@/components/map/DemoMapLayers'
import { FloodMap } from '@/components/map/FloodMap'
import { FloodTimeline } from '@/components/map/FloodTimeline'
import { AwaitingState } from '@/components/status/AwaitingState'
import { SimulationStatusBadge } from '@/components/status/SimulationStatusBadge'
import { DEMO_DAM } from '@/demo/demoDamConfig'
import { useGlobalFullscreenRequest } from '@/hooks/useGlobalFullscreenRequest'
import { useFloodStore } from '@/store/useFloodStore'
import { Building2, Hospital, Route, Tent, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const SECTIONS = [
  { key: 'settlements' as const, title: 'Settlements', icon: Tent },
  { key: 'roads' as const, title: 'Roads', icon: Route },
  { key: 'buildings' as const, title: 'Buildings', icon: Building2 },
  { key: 'infrastructure' as const, title: 'Critical infrastructure', icon: Hospital },
]

const PRIORITY_CLASS = {
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  MEDIUM: 'bg-orange-50 text-orange-700 border-orange-200',
  LOW: 'bg-amber-50 text-amber-800 border-amber-200',
} as const

function ImpactAnalysis() {
  const location = useFloodStore((s) => s.scenario.location) ?? DEMO_DAM.location
  const status = useFloodStore((s) => s.simulation.status)
  const impact = useFloodStore((s) => s.impactAnalysis)
  const layers = useFloodStore((s) => s.geospatialLayers)
  const polygon = useFloodStore((s) => s.floodPolygon)
  const selectedDam = useFloodStore((s) => s.selectedDam)
  const requestMapReset = useFloodStore((s) => s.requestMapReset)
  const mapFitRequestId = useFloodStore((s) => s.mapFitRequestId)
  const setWorkspaceFullscreen = useFloodStore((s) => s.setWorkspaceFullscreen)
  const done = status === 'COMPLETED'
  const { fullscreen, toggleFullscreen, exitFullscreen, enterFullscreen } = useWorkspaceFullscreen()
  const [resizeToken, setResizeToken] = useState(0)
  const [inspectorOpen, setInspectorOpen] = useState(true)

  useGlobalFullscreenRequest(enterFullscreen)

  useEffect(() => {
    setWorkspaceFullscreen(fullscreen)
    return () => setWorkspaceFullscreen(false)
  }, [fullscreen, setWorkspaceFullscreen])

  const inspector = (
    <div className="flex max-h-[min(80vh,720px)] w-[min(100%,320px)] flex-col overflow-hidden rounded-xl border border-navy-100 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-navy-100 px-3 py-2.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Downstream impact
          </p>
          <p className="text-sm font-medium text-navy-950">{selectedDam.name}</p>
        </div>
        <button
          type="button"
          aria-label="Close inspector"
          className="rounded p-1 text-muted hover:bg-surface"
          onClick={() => setInspectorOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">
            Low
          </span>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-orange-700">
            Moderate
          </span>
          <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-red-700">
            High
          </span>
        </div>

        {SECTIONS.map((section) => {
          const Icon = section.icon
          const items = impact[section.key]
          return (
            <section key={section.key} className="border-t border-navy-100 pt-3 first:border-0 first:pt-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {section.title}
                  </p>
                </div>
                {done ? (
                  <span className="text-xs font-semibold text-navy-500">{items.length}</span>
                ) : null}
              </div>
              {!done ? (
                <AwaitingState
                  icon={Icon}
                  title="Awaiting results"
                  detail="Exposure after flood mask exists."
                />
              ) : items.length === 0 ? (
                <p className="text-sm text-muted">No intersections in this inundation.</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-2 text-sm text-navy-800"
                    >
                      <span>
                        {item.name}
                        {item.depthM != null ? (
                          <span className="mt-0.5 block text-[11px] text-muted">
                            Depth {item.depthM.toFixed(1)} m
                            {item.arrivalMin != null
                              ? ` · Arrival ${item.arrivalMin.toFixed(0)} min`
                              : ''}
                          </span>
                        ) : null}
                      </span>
                      {item.priority ? (
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${PRIORITY_CLASS[item.priority]}`}
                        >
                          {item.priority}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
        <ExportPanel />
      </div>
    </div>
  )

  return (
    <VisualizationWorkspace
      title={selectedDam.name}
      subtitle="Impact Analysis"
      fullscreen={fullscreen}
      onToggleFullscreen={toggleFullscreen}
      onExitFullscreen={exitFullscreen}
      hideLeft
      initialBottomPercent={14}
      bottomStorageKey="hydrotrace.workspace.impact.bottomPercent"
      onWorkspaceResize={() => setResizeToken((n) => n + 1)}
      toolbar={
        <>
          <SimulationStatusBadge status={status} />
          <button
            type="button"
            className="rounded-lg border border-navy-100 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-800"
            onClick={requestMapReset}
          >
            Reset view
          </button>
          <button
            type="button"
            className="rounded-lg border border-navy-100 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-800"
            onClick={() => setInspectorOpen((v) => !v)}
          >
            {inspectorOpen ? 'Hide impact' : 'Impact'}
          </button>
        </>
      }
      floatingRight={inspectorOpen ? inspector : null}
      bottom={<FloodTimeline />}
    >
      <FloodMap
        mapKey={DEMO_DAM.id}
        marker={location}
        interactive={false}
        fitRequestId={mapFitRequestId}
        onResetView={requestMapReset}
        resizeToken={resizeToken}
        className="rounded-none border-0"
        environmentLabel="Impact canvas"
        environmentDetail={
          done
            ? 'Exposed sites by priority from the flood mask.'
            : 'Run the flood model to test infrastructure against the inundation.'
        }
        overlay={
          <DemoMapLayers
            layers={layers}
            floodPolygon={done ? polygon : null}
            impact={impact}
          />
        }
      />
    </VisualizationWorkspace>
  )
}

export { ImpactAnalysis }
