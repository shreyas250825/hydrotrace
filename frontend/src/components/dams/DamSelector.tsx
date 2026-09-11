import { CASE_STUDY_DISCLAIMER } from '@/catalog/bootstrap'
import { useFloodStore } from '@/store/useFloodStore'
import { Check, ChevronDown, Info } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

function DamSelector({ compact = false }: { compact?: boolean }) {
  const catalog = useFloodStore((s) => s.damCatalog)
  const selectedDam = useFloodStore((s) => s.selectedDam)
  const selectDam = useFloodStore((s) => s.selectDam)
  const damLoading = useFloodStore((s) => s.damLoading)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const demoDams = useMemo(
    () => catalog.filter((d) => d.category === 'demo_reference'),
    [catalog],
  )
  const caseDams = useMemo(
    () => catalog.filter((d) => d.category === 'historical_case_study'),
    [catalog],
  )

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={rootRef} className="relative min-w-0">
      {!compact ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Select dam
        </p>
      ) : null}
      <button
        type="button"
        disabled={damLoading}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 border border-navy-100 bg-white text-left transition hover:border-navy-200 ${
          compact ? 'h-10 rounded-md px-3' : 'mt-1 rounded-md px-3 py-2'
        }`}
      >
        <span className="min-w-0 truncate text-sm font-semibold text-navy-950">
          {selectedDam.name}
          <span className="font-normal text-muted"> — {selectedDam.state}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-[1200] mt-1.5 max-h-[min(70vh,420px)] w-[min(100vw-2rem,22rem)] overflow-y-auto border border-navy-100 bg-white p-1.5 shadow-lg">
          <div className="mb-1.5 flex items-start gap-2 bg-navy-50 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy-500" />
            <span>{CASE_STUDY_DISCLAIMER}</span>
          </div>
          <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Demo / reference
          </p>
          {demoDams.map((dam) => (
            <DamOption
              key={dam.id}
              label={dam.name}
              detail={dam.state}
              active={dam.id === selectedDam.id}
              onSelect={() => {
                void selectDam(dam.id)
                setOpen(false)
              }}
            />
          ))}
          <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Historical case studies
          </p>
          {caseDams.map((dam) => (
            <DamOption
              key={dam.id}
              label={dam.name}
              detail={dam.state}
              active={dam.id === selectedDam.id}
              onSelect={() => {
                void selectDam(dam.id)
                setOpen(false)
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function DamOption({
  label,
  detail,
  active,
  onSelect,
}: {
  label: string
  detail?: string
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition ${
        active ? 'bg-navy-50 text-navy-900' : 'text-navy-800 hover:bg-navy-50'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{label}</span>
        {detail ? <span className="block truncate text-[11px] text-muted">{detail}</span> : null}
      </span>
      {active ? <Check className="h-3.5 w-3.5 shrink-0 text-navy-500" /> : null}
    </button>
  )
}

export { DamSelector }
