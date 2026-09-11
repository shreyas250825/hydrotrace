import {
  BREACH_HYDRAULICS,
  DEMONSTRATION_ALGORITHM,
  GOVERNING_EQUATIONS,
  MODEL_NAME,
  MODEL_PIPELINE,
  PIPELINE_STEPS,
} from '@/science/methodology'
import {
  deriveHydraulicHeadMeters,
  estimateInitialBreachDischarge,
} from '@/science/hydraulics'
import { useFloodStore } from '@/store/useFloodStore'
import { formatNumber } from '@/utils/format'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

function MethodologyPanel({ compact = false }: { compact?: boolean }) {
  const scenario = useFloodStore((s) => s.scenario)
  const dam = useFloodStore((s) => s.selectedDam)
  const terrainType = useFloodStore((s) => s.terrainType)
  const { damParameters, breachParameters } = scenario
  const [assumptionsOpen, setAssumptionsOpen] = useState(false)
  const [techOpen, setTechOpen] = useState(false)

  const head = deriveHydraulicHeadMeters(
    damParameters.heightMeters,
    damParameters.currentWaterLevelPercent,
    breachParameters.hydraulicHeadMeters,
  )
  const q = estimateInitialBreachDischarge({
    breachWidthM: breachParameters.widthMeters,
    breachDepthM: breachParameters.depthMeters,
    hydraulicHeadM: head,
    dischargeCoefficient: breachParameters.dischargeCoefficient ?? 0.6,
  })

  return (
    <div className={compact ? 'space-y-6' : 'min-h-0 flex-1 space-y-8 overflow-y-auto p-6 sm:p-8'}>
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-navy-800">
          From terrain to flood intelligence
        </h2>
        <p className="mt-2 text-sm text-muted">
          {dam.name} · {terrainType === 'REAL' ? 'Real DEM' : 'Demonstration terrain'} · {MODEL_NAME}
        </p>
      </header>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Model pipeline
        </p>
        <ol className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] text-navy-800">
          {PIPELINE_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-3">
              <span className="font-medium">{step}</span>
              {i < PIPELINE_STEPS.length - 1 ? (
                <span className="text-navy-100" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-8 border-t border-navy-100 pt-8 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Hydraulic derivation
          </p>
          <p className="mt-3 font-mono text-lg text-navy-800">{BREACH_HYDRAULICS.orificeForm.latex}</p>
          <p className="mt-2 text-sm text-muted">
            {q.label}:{' '}
            <span className="font-semibold text-navy-800">{formatNumber(q.qCms, 1)} m³/s</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Mass conservation
          </p>
          <p className="mt-3 font-mono text-lg text-navy-800">
            {GOVERNING_EQUATIONS.continuity.latex}
          </p>
          <p className="mt-2 text-sm text-muted">{GOVERNING_EQUATIONS.continuity.note}</p>
        </div>
      </section>

      <section className="border-t border-navy-100 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Current implementation
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-navy-800">{MODEL_NAME}</h3>
        <p className="mt-2 text-sm text-muted">
          Inputs: TerrainGrid + scenario parameters · Outputs: flood extent, depth, arrival time
        </p>
        <ol className="mt-5 space-y-3">
          {DEMONSTRATION_ALGORITHM.map((item) => (
            <li key={item.step} className="flex gap-3 text-sm">
              <span className="font-mono text-muted">{String(item.step).padStart(2, '0')}</span>
              <span>
                <span className="font-medium text-navy-800">{item.title}</span>
                <span className="mt-0.5 block text-muted">{item.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-navy-100">
        <button
          type="button"
          className="flex w-full items-center justify-between py-4 text-left"
          onClick={() => setAssumptionsOpen((v) => !v)}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Model assumptions
          </p>
          <ChevronDown
            className={`h-4 w-4 text-muted transition ${assumptionsOpen ? '' : '-rotate-90'}`}
          />
        </button>
        {assumptionsOpen ? (
          <div className="space-y-2 pb-4 text-sm leading-relaxed text-muted">
            <p>{BREACH_HYDRAULICS.orificeForm.note}</p>
            <p>{GOVERNING_EQUATIONS.momentum.note}</p>
            <p>
              Continuity and momentum equations are foundation references. The current engine does
              not claim to numerically solve the full shallow-water system.
            </p>
          </div>
        ) : null}
      </section>

      <section className="border-t border-navy-100">
        <button
          type="button"
          className="flex w-full items-center justify-between py-4 text-left"
          onClick={() => setTechOpen((v) => !v)}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Technical details
          </p>
          <ChevronDown
            className={`h-4 w-4 text-muted transition ${techOpen ? '' : '-rotate-90'}`}
          />
        </button>
        {techOpen ? (
          <div className="space-y-4 pb-6">
            {MODEL_PIPELINE.map((block) => (
              <div key={block.id} className="border-b border-navy-50 pb-3 last:border-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-navy-800">{block.title}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    {block.kind}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  <span className="font-medium text-navy-700">Input:</span> {block.input}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  <span className="font-medium text-navy-700">Method:</span> {block.method}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  <span className="font-medium text-navy-700">Output:</span> {block.output}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export { MethodologyPanel }
