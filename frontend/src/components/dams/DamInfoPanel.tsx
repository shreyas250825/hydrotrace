import { displayField } from '@/catalog/bootstrap'
import { useFloodStore } from '@/store/useFloodStore'
import { ExternalLink } from 'lucide-react'

function DamInfoPanel({ compact = false }: { compact?: boolean }) {
  const dam = useFloodStore((s) => s.selectedDam)
  const damError = useFloodStore((s) => s.damError)

  return (
    <section
      className={
        compact
          ? 'rounded-xl border border-navy-100 bg-white p-3'
          : 'rounded-2xl border border-navy-100 bg-white p-4 shadow-sm'
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">
          Dam information
        </p>
        {dam.category === 'historical_case_study' ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">
            Historical case study
          </span>
        ) : (
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-800">
            Flagship demo
          </span>
        )}
        {dam.historicalIncidentYear ? (
          <span className="text-[11px] text-navy-500">
            Incident recorded: {dam.historicalIncidentYear}
          </span>
        ) : null}
      </div>

      <dl className="mt-3 grid gap-2 text-sm">
        <Row label="Dam" value={displayField(dam.name)} />
        <Row label="State" value={displayField(dam.state)} />
        <Row label="River" value={displayField(dam.river)} />
        <Row label="Basin" value={displayField(dam.basin)} />
        <Row
          label="Historical incident"
          value={displayField(dam.historicalIncidentYear)}
        />
        <Row label="Incident type" value={displayField(dam.incidentType)} />
        <Row
          label="Historical context"
          value={displayField(dam.incidentDescription)}
        />
        <Row
          label="Data status"
          value={
            dam.dataAvailability === 'demo_complete'
              ? 'Demonstration fixture (catalog)'
              : dam.dataAvailability === 'partial' ||
                  dam.dataAvailability === 'partial_demo' ||
                  dam.dataAvailability === 'limited'
                ? 'Partial data available'
                : displayField(dam.dataAvailability)
          }
        />
        <Row label="Terrain source" value={displayField(dam.terrainSource)} />
        <Row label="Source" value={displayField(dam.incidentSource)} />
      </dl>

      {dam.officialSourceUrl ? (
        <a
          href={dam.officialSourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-800 hover:underline"
        >
          View source
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : null}

      {dam.coordinateNote ? (
        <p className="mt-3 text-[11px] leading-relaxed text-navy-500">{dam.coordinateNote}</p>
      ) : null}

      {damError ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-900">
          {damError}
        </p>
      ) : null}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-navy-400">
        {label}
      </dt>
      <dd className="text-navy-800">{value}</dd>
    </div>
  )
}

export { DamInfoPanel }
