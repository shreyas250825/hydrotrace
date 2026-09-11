import { cn } from '@/lib/utils'
import type { SimulationStatus } from '@/types/simulation'

const STYLES: Record<SimulationStatus, string> = {
  IDLE: 'bg-navy-50 text-navy-600 border-navy-100',
  READY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  ERROR: 'bg-red-50 text-danger border-red-200',
}

const DOT: Record<SimulationStatus, string> = {
  IDLE: 'bg-navy-400',
  READY: 'bg-emerald-500',
  PROCESSING: 'bg-blue-500',
  COMPLETED: 'bg-cyan-600',
  ERROR: 'bg-danger',
}

function SimulationStatusBadge({ status }: { status: SimulationStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]',
        STYLES[status],
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT[status])} />
      {status}
    </span>
  )
}

export { SimulationStatusBadge }
