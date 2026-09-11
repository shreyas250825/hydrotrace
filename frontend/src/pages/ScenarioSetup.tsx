import { ResizableSplitPane } from '@/components/layout/ResizableWorkspace'
import { FloodMap } from '@/components/map/FloodMap'
import { ScenarioPanel } from '@/components/scenario/ScenarioPanel'
import { useFloodStore } from '@/store/useFloodStore'

function ScenarioSetup() {
  const location = useFloodStore((s) => s.scenario.location)
  const updateLocation = useFloodStore((s) => s.updateLocation)
  const simStatus = useFloodStore((s) => s.simulation.status)
  const mapFitRequestId = useFloodStore((s) => s.mapFitRequestId)
  const requestMapReset = useFloodStore((s) => s.requestMapReset)
  const selectedDam = useFloodStore((s) => s.selectedDam)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-hidden">
        <ResizableSplitPane
          direction="horizontal"
          initialPrimaryPercent={68}
          minPrimaryPercent={50}
          maxPrimaryPercent={82}
          storageKey="hydrotrace.workspace.scenario.split"
          className="h-full"
          primary={
            <div className="h-full min-h-0">
              <FloodMap
                mapKey={selectedDam.id}
                marker={location}
                interactive
                fitRequestId={mapFitRequestId}
                onResetView={requestMapReset}
                className="rounded-none border-0"
                environmentLabel={selectedDam.name}
                environmentDetail={`${selectedDam.state}${selectedDam.river ? ` · ${selectedDam.river}` : ''}`}
                onLocationSelect={(lat, lng) =>
                  updateLocation({
                    lat,
                    lng,
                    label: `${selectedDam.name} marker`,
                  })
                }
              />
            </div>
          }
          secondary={
            <div className="h-full min-h-0 border-l border-navy-100">
              <ScenarioPanel />
            </div>
          }
        />
      </div>

      {simStatus === 'COMPLETED' ? (
        <p className="shrink-0 border-t border-navy-100 bg-emerald-50 px-4 py-1.5 text-center text-[11px] text-emerald-800">
          Simulation complete. Running again recomputes inundation from current inputs.
        </p>
      ) : simStatus === 'PROCESSING' ? (
        <p className="shrink-0 border-t border-navy-100 bg-navy-50 px-4 py-1.5 text-center text-[11px] text-navy-700">
          Terrain-aware flood propagation in progress…
        </p>
      ) : null}
    </div>
  )
}

export { ScenarioSetup }
