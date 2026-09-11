import { Button } from '@/components/ui/button'
import { SceneErrorBoundary } from '@/components/scene/SceneErrorBoundary'
import { DEFAULT_SCENE_LAYERS } from '@/config/defaults'
import { pathForView } from '@/navigation/routes'
import { useFloodStore } from '@/store/useFloodStore'
import type { AppView } from '@/types/simulation'
import { ArrowRight, Box, Globe2, MapPinned, Waves } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'

const CommandPreview = lazy(() =>
  import('@/scene/DamScene').then((module) => ({ default: module.DamScene })),
)

const ACTIONS: { id: AppView; label: string; icon: typeof MapPinned }[] = [
  { id: 'scenario', label: 'Scenario', icon: MapPinned },
  { id: 'geospatial', label: 'Explore Map', icon: Globe2 },
  { id: 'command', label: 'Open 3D', icon: Box },
  { id: 'impact', label: 'Analyze Impact', icon: Waves },
]

function Overview() {
  const navigate = useNavigate()
  const setCurrentView = useFloodStore((s) => s.setCurrentView)
  const selectedDam = useFloodStore((s) => s.selectedDam)
  const terrainType = useFloodStore((s) => s.terrainType)
  const simulation = useFloodStore((s) => s.simulation)
  const startDemoTour = useFloodStore((s) => s.startDemoTour)

  const go = (view: AppView) => {
    setCurrentView(view)
    navigate(pathForView(view))
  }

  const done = simulation.status === 'COMPLETED'
  const caseLabel =
    selectedDam.category === 'historical_case_study' ? 'Historical case study' : 'Reference scenario'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
      <div className="flex shrink-0 items-end justify-between gap-4 border-b border-navy-100 bg-white px-6 py-5 sm:px-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-navy-950 sm:text-4xl">
            {selectedDam.name.replace(/\s+Dam$/i, '').toUpperCase()}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {[selectedDam.reservoirName, selectedDam.river, selectedDam.basin, selectedDam.state]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="rounded-full border border-navy-100 bg-navy-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-500">
            {caseLabel}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            {terrainType === 'REAL' ? 'Real DEM' : 'Demonstration terrain'}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)]">
          <div className="relative min-h-[320px] overflow-hidden bg-[#1a2a3a] lg:min-h-0">
            <SceneErrorBoundary compact>
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    Loading preview…
                  </div>
                }
              >
                <CommandPreview
                  key={selectedDam.id}
                  eventType="DAM_BREAK"
                  layers={{
                    ...DEFAULT_SCENE_LAYERS,
                    vegetation: true,
                    buildings: true,
                    roads: true,
                  }}
                  cameraView="default"
                  cameraNonce={0}
                  quality="preview"
                  className="h-full w-full"
                  progressOverride={0.38}
                  floodRevision={0}
                />
              </Suspense>
            </SceneErrorBoundary>
          </div>

          <aside className="flex min-h-0 flex-col overflow-y-auto border-t border-navy-100 bg-white px-6 py-6 lg:border-l lg:border-t-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Quick actions
            </p>
            <div className="mt-3 flex flex-col">
              {ACTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => go(id)}
                  className="group flex items-center gap-3 border-b border-navy-100 py-3.5 text-left transition hover:pl-1"
                >
                  <Icon className="h-4 w-4 text-muted" />
                  <span className="flex-1 text-[15px] font-medium text-navy-950 group-hover:text-navy-500">
                    {label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
                </button>
              ))}
            </div>

            <div className="mt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Latest results
              </p>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
                <Metric
                  label="Inundation"
                  value={
                    done
                      ? `${(simulation.results.maxFloodExtentKm2 ?? 0).toFixed(2)} km²`
                      : '—'
                  }
                />
                <Metric
                  label="Max depth"
                  value={
                    done ? `${(simulation.results.maxWaterDepthM ?? 0).toFixed(1)} m` : '—'
                  }
                />
                <Metric
                  label="Arrival"
                  value={
                    done
                      ? `${Math.round(simulation.results.estimatedArrivalTimeMin ?? 0)} min`
                      : '—'
                  }
                />
                <Metric
                  label="Cells"
                  value={done ? String(simulation.results.floodedCellCount ?? 0) : '—'}
                />
              </div>
            </div>

            <div className="mt-auto pt-8">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  startDemoTour()
                  navigate(pathForView(useFloodStore.getState().currentView))
                }}
              >
                Start demo mode
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight text-navy-950">{value}</p>
    </div>
  )
}

export { Overview }
