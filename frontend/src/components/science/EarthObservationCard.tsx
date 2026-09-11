import { Satellite } from 'lucide-react'

/** Compact secondary data-source item — optional, no warning styling. */
function EarthObservationCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'py-1' : 'py-2'}>
      <div className="flex items-center gap-2">
        <Satellite className="h-3.5 w-3.5 text-muted" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Earth observation
        </p>
      </div>
      <p className="mt-1 text-sm text-navy-800">Optional GEE integration</p>
      <p className="mt-0.5 text-[11px] text-muted">Status: Optional / not connected</p>
    </div>
  )
}

export { EarthObservationCard }
