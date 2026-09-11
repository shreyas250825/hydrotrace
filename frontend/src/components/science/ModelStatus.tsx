import { estimateInitialBreachDischarge, deriveHydraulicHeadMeters } from '@/science/hydraulics'
import { useFloodStore } from '@/store/useFloodStore'
import { formatNumber } from '@/utils/format'
import { Info } from 'lucide-react'
import { useState } from 'react'

function ModelAssumptionsHint({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={compact ? 'relative' : ''}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 border border-navy-100 bg-white px-2.5 py-1 text-[11px] font-medium text-navy-700 hover:border-navy-200"
        title="Model assumptions"
      >
        <Info className="h-3.5 w-3.5" />
        Assumptions
      </button>
      {open ? (
        <div className="absolute right-0 z-[50] mt-2 w-80 border border-navy-100 bg-white p-3 text-left text-xs leading-relaxed text-muted shadow-lg">
          <p className="font-semibold text-navy-800">Model status</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Engine: Terrain-Aware Flood Propagation (demonstration model).</li>
            <li>
              Continuity / momentum equations are foundation references — not claimed as numerically
              solved here.
            </li>
            <li>
              Q = C_d A √(2gH) is a derived initial breach-discharge estimate from scenario inputs.
            </li>
            <li>Earth Observation (GEE) is optional and not required for this demo.</li>
          </ul>
          <button
            type="button"
            className="mt-2 text-[11px] font-semibold text-navy-500"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  )
}

function DerivedHydraulicsCard() {
  const scenario = useFloodStore((s) => s.scenario)
  const { damParameters, breachParameters } = scenario
  const head = deriveHydraulicHeadMeters(
    damParameters.heightMeters,
    damParameters.currentWaterLevelPercent,
    breachParameters.hydraulicHeadMeters,
  )
  const result = estimateInitialBreachDischarge({
    breachWidthM: breachParameters.widthMeters,
    breachDepthM: breachParameters.depthMeters,
    hydraulicHeadM: head,
    dischargeCoefficient: breachParameters.dischargeCoefficient ?? 0.6,
  })

  return (
    <section className="border-t border-navy-100 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        Derived hydraulics
      </p>
      <p className="mt-1 text-sm font-medium text-navy-800">{result.label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-navy-800">
        {formatNumber(result.qCms, 1)}{' '}
        <span className="text-base font-medium text-muted">m³/s</span>
      </p>
      <p className="mt-2 font-mono text-xs text-navy-700">{result.formula}</p>
      <p className="mt-2 text-[11px] text-muted">{result.note}</p>
    </section>
  )
}

export { ModelAssumptionsHint, DerivedHydraulicsCard }
