import { EarthObservationCard } from '@/components/science/EarthObservationCard'
import { useFloodStore } from '@/store/useFloodStore'
import { useState } from 'react'

function DataTransparencyPanel({ compact = false }: { compact?: boolean }) {
  const status = useFloodStore((s) => s.dataSourceStatus)
  const terrainSource = useFloodStore((s) => s.terrainSource)
  const terrainType = useFloodStore((s) => s.terrainType)
  const [assumptionsOpen, setAssumptionsOpen] = useState(false)

  const terrainDisplay =
    terrainType === 'REAL'
      ? `REAL DEM — ${terrainSource}`
      : terrainType === 'UNAVAILABLE'
        ? 'Not available for this case study'
        : `Demonstration Terrain — ${terrainSource || status.terrain}`

  const rows = [
    { label: 'DEM', value: terrainDisplay },
    { label: 'Basemap', value: 'OpenStreetMap / Esri' },
    { label: 'Infrastructure', value: status.infrastructure },
    { label: 'Simulation', value: 'Terrain-Aware Flood Propagation' },
  ]

  return (
    <section className={compact ? 'space-y-2' : 'space-y-3'}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Data sources
      </p>
      <dl className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2 text-sm">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {row.label}
            </dt>
            <dd className="text-navy-800">{row.value}</dd>
          </div>
        ))}
      </dl>

      <EarthObservationCard compact />

      {terrainType !== 'REAL' ? (
        <p className="text-[11px] leading-relaxed text-muted">
          Real DEM not available for this case study. Using Demonstration Terrain.
        </p>
      ) : null}

      <button
        type="button"
        className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-600 hover:text-navy-500"
        onClick={() => setAssumptionsOpen((v) => !v)}
      >
        {assumptionsOpen ? 'Hide' : 'Assumptions & provenance'}
      </button>
      {assumptionsOpen ? (
        <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-muted">
          <li>Flood products are outputs of the terrain-aware demonstration model.</li>
          <li>Q = C_d A √(2gH) is a derived breach-discharge estimate from scenario inputs.</li>
          <li>Earth Observation (GEE) is optional and not required for demo operation.</li>
          <li>Infrastructure overlays may be demonstration fixtures unless live GIS is connected.</li>
        </ul>
      ) : null}
    </section>
  )
}

export { DataTransparencyPanel }
