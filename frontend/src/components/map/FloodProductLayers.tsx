import type { FloodCellGeo, FloodProductMode } from '@/types/simulation'
import { CircleMarker, Tooltip } from 'react-leaflet'

function depthColor(depthM: number, maxDepth: number): string {
  const t = Math.max(0, Math.min(1, depthM / Math.max(0.5, maxDepth)))
  if (t < 0.33) return '#7dd3fc'
  if (t < 0.66) return '#0284c7'
  return '#0c4a6e'
}

function arrivalColor(arrival: number, maxArrival: number): string {
  const t = Math.max(0, Math.min(1, arrival / Math.max(1, maxArrival)))
  if (t < 0.33) return '#ea580c'
  if (t < 0.66) return '#ca8a04'
  return '#65a30d'
}

function FloodProductLayers({
  cells,
  mode,
  progress,
  maxDepthM,
}: {
  cells: FloodCellGeo[]
  mode: FloodProductMode
  progress: number
  maxDepthM: number
}) {
  if (cells.length === 0) return null
  const maxArrival = Math.max(1, ...cells.map((c) => c.arrival))
  const cutoff = progress * maxArrival
  const visible = cells.filter((c) => c.arrival <= cutoff)
  const stride = Math.max(1, Math.ceil(visible.length / 420))
  const sampled = visible.filter((_, i) => i % stride === 0)

  return (
    <>
      {sampled.map((cell) => {
        const color =
          mode === 'arrival'
            ? arrivalColor(cell.arrival, maxArrival)
            : depthColor(cell.depthM, maxDepthM)
        return (
          <CircleMarker
            key={`${cell.col}-${cell.row}`}
            center={[cell.lat, cell.lng]}
            radius={mode === 'extent' ? 4 : 5}
            pathOptions={{
              color,
              weight: 0.4,
              fillColor: color,
              fillOpacity: mode === 'extent' ? 0.32 : 0.58,
            }}
          >
            <Tooltip>
              Depth: {cell.depthM.toFixed(1)} m · Arrival: {cell.arrivalMin.toFixed(0)} min
            </Tooltip>
          </CircleMarker>
        )
      })}
    </>
  )
}

function FloodLegend({ mode, maxDepthM, maxArrivalMin }: {
  mode: FloodProductMode
  maxDepthM: number
  maxArrivalMin: number
}) {
  if (mode === 'extent') {
    return (
      <div className="rounded-xl border border-navy-100 bg-white/95 px-3 py-2 text-[11px] text-navy-700 shadow-sm">
        <p className="font-semibold uppercase tracking-[0.12em] text-navy-500">Flood extent</p>
        <p className="mt-1">MODELLED inundation cells (demonstration solver)</p>
      </div>
    )
  }
  if (mode === 'depth') {
    return (
      <div className="rounded-xl border border-navy-100 bg-white/95 px-3 py-2 text-[11px] text-navy-700 shadow-sm">
        <p className="font-semibold uppercase tracking-[0.12em] text-navy-500">Depth (m)</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-3 w-6 rounded-sm bg-[#7dd3fc]" /> Low
          <span className="h-3 w-6 rounded-sm bg-[#0284c7]" /> Med
          <span className="h-3 w-6 rounded-sm bg-[#0c4a6e]" /> High
        </div>
        <p className="mt-1">Scale up to {maxDepthM.toFixed(1)} m (MODELLED)</p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-navy-100 bg-white/95 px-3 py-2 text-[11px] text-navy-700 shadow-sm">
      <p className="font-semibold uppercase tracking-[0.12em] text-navy-500">Arrival time (min)</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-3 w-6 rounded-sm bg-[#ea580c]" /> Early
        <span className="h-3 w-6 rounded-sm bg-[#ca8a04]" /> Mid
        <span className="h-3 w-6 rounded-sm bg-[#65a30d]" /> Late
      </div>
      <p className="mt-1">Span ~{maxArrivalMin.toFixed(0)} min (MODELLED)</p>
    </div>
  )
}

export { FloodProductLayers, FloodLegend }
