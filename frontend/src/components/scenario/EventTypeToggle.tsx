import { cn } from '@/lib/utils'
import type { EventType } from '@/types/simulation'

function EventTypeToggle({
  value,
  onChange,
  size = 'default',
}: {
  value: EventType
  onChange: (value: EventType) => void
  size?: 'default' | 'compact'
}) {
  const compact = size === 'compact'
  return (
    <div className={cn('grid grid-cols-2 gap-2', compact && 'gap-1.5')}>
      <button
        type="button"
        onClick={() => onChange('CONTROLLED_RELEASE')}
        className={cn(
          'rounded-lg border px-3 text-left transition-colors',
          compact ? 'py-2' : 'py-3',
          value === 'CONTROLLED_RELEASE'
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-navy-100 bg-white hover:bg-navy-50',
        )}
      >
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          Controlled release
        </p>
        {!compact ? (
          <p className="mt-1 text-xs text-slate-600">Spillway / gated discharge</p>
        ) : null}
      </button>
      <button
        type="button"
        onClick={() => onChange('DAM_BREAK')}
        className={cn(
          'rounded-lg border px-3 text-left transition-colors',
          compact ? 'py-2' : 'py-3',
          value === 'DAM_BREAK'
            ? 'border-red-300 bg-red-50'
            : 'border-navy-100 bg-white hover:bg-navy-50',
        )}
      >
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-danger">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" aria-hidden />
          Dam break
        </p>
        {!compact ? (
          <p className="mt-1 text-xs text-slate-600">Catastrophic breach</p>
        ) : null}
      </button>
    </div>
  )
}

export { EventTypeToggle }
