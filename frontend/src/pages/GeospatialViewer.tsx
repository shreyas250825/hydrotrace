import { FloodTimeline } from '@/components/map/FloodTimeline'
import {
  VisualizationWorkspace,
  useWorkspaceFullscreen,
} from '@/components/layout/ResizableWorkspace'
import { DemoMapLayers } from '@/components/map/DemoMapLayers'
import { FloodLegend, FloodProductLayers } from '@/components/map/FloodProductLayers'
import { FloodMap } from '@/components/map/FloodMap'
import { ModelAssumptionsHint } from '@/components/science/ModelStatus'
import { Button } from '@/components/ui/button'
import { getDamConfig } from '@/demo/demoDamConfig'
import { useGlobalFullscreenRequest } from '@/hooks/useGlobalFullscreenRequest'
import { useFloodStore } from '@/store/useFloodStore'
import type { FloodProductMode, GeospatialLayers } from '@/types/simulation'
import { Layers, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const LAYER_META: { key: keyof GeospatialLayers; label: string; group: string }[] = [
  { key: 'terrain', label: 'OSM Basemap', group: 'BASEMAP' },
  { key: 'satellite', label: 'Satellite Basemap', group: 'BASEMAP' },
  { key: 'dam', label: 'Dam', group: 'CONTEXT' },
  { key: 'reservoir', label: 'Reservoir', group: 'CONTEXT' },
  { key: 'infrastructure', label: 'Infrastructure', group: 'CONTEXT' },
  { key: 'roads', label: 'Roads', group: 'CONTEXT' },
  { key: 'settlements', label: 'Settlements', group: 'CONTEXT' },
  { key: 'floodExtent', label: 'Flood Extent', group: 'FLOOD' },
  { key: 'floodDepth', label: 'Depth', group: 'FLOOD' },
  { key: 'floodArrival', label: 'Arrival Time', group: 'FLOOD' },
  { key: 'hillshade', label: 'Hillshade (REAL DEM)', group: 'TERRAIN' },
  { key: 'slope', label: 'Slope (REAL DEM)', group: 'TERRAIN' },
]

function LayerChecklist({
  dark = false,
  onClose,
}: {
  dark?: boolean
  onClose?: () => void
}) {
  const layers = useFloodStore((s) => s.geospatialLayers)
  const toggle = useFloodStore((s) => s.toggleGeospatialLayer)
  const setFloodProductMode = useFloodStore((s) => s.setFloodProductMode)
  const terrainType = useFloodStore((s) => s.terrainType)

  const groups = ['BASEMAP', 'CONTEXT', 'FLOOD', 'TERRAIN'] as const

  return (
    <div className={dark ? 'p-3 text-white' : 'p-3'}>
      <div className="mb-2 flex items-center justify-between">
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${dark ? 'text-slate-400' : 'text-navy-500'}`}
        >
          Layers
        </p>
        {onClose ? (
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-black/10">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group}>
            <p
              className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${dark ? 'text-slate-500' : 'text-navy-400'}`}
            >
              {group}
            </p>
            <div className="space-y-1">
              {LAYER_META.filter((l) => l.group === group).map((layer) => {
                const demOnly = layer.key === 'hillshade' || layer.key === 'slope'
                const disabled = demOnly && terrainType !== 'REAL'
                return (
                  <label
                    key={layer.key}
                    className={`flex items-center gap-2 text-sm ${disabled ? 'opacity-40' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className="accent-navy-800"
                      disabled={disabled}
                      checked={
                        layer.key === 'terrain' ? !layers.satellite : layers[layer.key]
                      }
                      onChange={() => {
                        if (layer.key === 'terrain') {
                          if (layers.satellite) toggle('satellite')
                          return
                        }
                        if (layer.key === 'floodDepth') {
                          setFloodProductMode('depth')
                          if (layers.floodArrival) toggle('floodArrival')
                        }
                        if (layer.key === 'floodArrival') {
                          setFloodProductMode('arrival')
                          if (layers.floodDepth) toggle('floodDepth')
                        }
                        toggle(layer.key)
                      }}
                    />
                    {layer.label}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GeospatialViewer() {
  const selectedDam = useFloodStore((s) => s.selectedDam)
  const damCfg = getDamConfig()
  const location = useFloodStore((s) => s.scenario.location) ?? damCfg.location
  const layers = useFloodStore((s) => s.geospatialLayers)
  const toggle = useFloodStore((s) => s.toggleGeospatialLayer)
  const status = useFloodStore((s) => s.simulation.status)
  const polygon = useFloodStore((s) => s.floodPolygon)
  const impact = useFloodStore((s) => s.impactAnalysis)
  const floodCells = useFloodStore((s) => s.floodCells)
  const timelineProgress = useFloodStore((s) => s.timelineProgress)
  const floodProductMode = useFloodStore((s) => s.floodProductMode)
  const setFloodProductMode = useFloodStore((s) => s.setFloodProductMode)
  const mapFitRequestId = useFloodStore((s) => s.mapFitRequestId)
  const requestMapReset = useFloodStore((s) => s.requestMapReset)
  const terrainSource = useFloodStore((s) => s.terrainSource)
  const terrainType = useFloodStore((s) => s.terrainType)
  const maxDepth = useFloodStore((s) => s.simulation.results.maxWaterDepthM) ?? 1
  const arrivalMin = useFloodStore((s) => s.simulation.results.estimatedArrivalTimeMin) ?? 0
  const setWorkspaceFullscreen = useFloodStore((s) => s.setWorkspaceFullscreen)
  const hasResults = status === 'COMPLETED'
  const { fullscreen, toggleFullscreen, exitFullscreen, enterFullscreen } = useWorkspaceFullscreen()
  const [layersOpen, setLayersOpen] = useState(false)
  const [resizeToken, setResizeToken] = useState(0)

  useGlobalFullscreenRequest(enterFullscreen)

  useEffect(() => {
    setWorkspaceFullscreen(fullscreen)
    if (fullscreen) setLayersOpen(true)
    return () => setWorkspaceFullscreen(false)
  }, [fullscreen, setWorkspaceFullscreen])

  const productMode: FloodProductMode = layers.floodArrival
    ? 'arrival'
    : layers.floodDepth
      ? 'depth'
      : floodProductMode

  const setProduct = (mode: FloodProductMode) => {
    setFloodProductMode(mode)
    if (mode === 'depth') {
      if (!layers.floodDepth) toggle('floodDepth')
      if (layers.floodArrival) toggle('floodArrival')
    } else if (mode === 'arrival') {
      if (!layers.floodArrival) toggle('floodArrival')
      if (layers.floodDepth) toggle('floodDepth')
    } else {
      if (!layers.floodExtent) toggle('floodExtent')
      if (layers.floodDepth) toggle('floodDepth')
      if (layers.floodArrival) toggle('floodArrival')
    }
  }

  return (
    <VisualizationWorkspace
      title={selectedDam.name}
      subtitle="Geospatial Viewer"
      dark={false}
      fullscreen={fullscreen}
      onToggleFullscreen={toggleFullscreen}
      onExitFullscreen={exitFullscreen}
      leftStorageKey="hydrotrace.workspace.geospatial.leftPercent"
      bottomStorageKey="hydrotrace.workspace.geospatial.bottomPercent"
      initialLeftPercent={14}
      initialBottomPercent={14}
      maxLeftPercent={24}
      hideLeft
      onWorkspaceResize={() => setResizeToken((n) => n + 1)}
      toolbar={
        <>
          <ModelAssumptionsHint compact />
          <Button type="button" size="sm" variant="outline" onClick={() => setLayersOpen((v) => !v)}>
            <Layers className="h-3.5 w-3.5" />
            Layers
          </Button>
          <Button
            type="button"
            size="sm"
            variant={productMode === 'extent' || layers.floodExtent ? 'accent' : 'outline'}
            onClick={() => setProduct('extent')}
          >
            Flood
          </Button>
          <Button
            type="button"
            size="sm"
            variant={layers.floodDepth || productMode === 'depth' ? 'accent' : 'outline'}
            onClick={() => setProduct('depth')}
          >
            Depth
          </Button>
          <Button
            type="button"
            size="sm"
            variant={layers.floodArrival || productMode === 'arrival' ? 'accent' : 'outline'}
            onClick={() => setProduct('arrival')}
          >
            Arrival
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={requestMapReset}>
            Reset view
          </Button>
        </>
      }
      floatingRight={
        layersOpen ? (
          <div className="border border-navy-100 bg-white/98 shadow-lg">
            <LayerChecklist onClose={() => setLayersOpen(false)} />
          </div>
        ) : hasResults && !fullscreen ? (
          <FloodLegend
            mode={layers.floodArrival ? 'arrival' : layers.floodDepth ? 'depth' : 'extent'}
            maxDepthM={maxDepth}
            maxArrivalMin={arrivalMin}
          />
        ) : null
      }
      bottom={<FloodTimeline />}
    >
      <div className="relative h-full min-h-0 w-full">
        <FloodMap
          mapKey={selectedDam.id}
          marker={location}
          interactive={false}
          basemap={layers.satellite ? 'satellite' : 'osm'}
          fitRequestId={mapFitRequestId}
          onResetView={requestMapReset}
          resizeToken={resizeToken}
          className="rounded-none border-0"
          environmentLabel={damCfg.name}
          environmentDetail={`${terrainType === 'REAL' ? 'REAL DEM' : 'Demonstration Terrain'} · ${terrainSource}`}
          overlay={
            <>
              <DemoMapLayers
                layers={layers}
                floodPolygon={hasResults && layers.floodExtent ? polygon : null}
                impact={impact}
              />
              {hasResults && (layers.floodDepth || layers.floodArrival || productMode) ? (
                <FloodProductLayers
                  cells={floodCells}
                  mode={
                    layers.floodArrival ? 'arrival' : layers.floodDepth ? 'depth' : productMode
                  }
                  progress={timelineProgress}
                  maxDepthM={maxDepth}
                />
              ) : null}
            </>
          }
        />
        {fullscreen && hasResults ? (
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500]">
            <div className="pointer-events-auto">
              <FloodLegend
                mode={layers.floodArrival ? 'arrival' : layers.floodDepth ? 'depth' : 'extent'}
                maxDepthM={maxDepth}
                maxArrivalMin={arrivalMin}
              />
            </div>
          </div>
        ) : null}
      </div>
    </VisualizationWorkspace>
  )
}

export { GeospatialViewer }
