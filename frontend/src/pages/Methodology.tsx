import { PageHeader } from '@/components/layout/PageHeader'
import { MethodologyPanel } from '@/components/science/MethodologyPanel'
import { DataTransparencyPanel } from '@/components/dams/DataTransparencyPanel'
import { ModelAssumptionsHint } from '@/components/science/ModelStatus'

function Methodology() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PageHeader
        eyebrow="Science"
        title="How HYDROTRACE works"
        description="Dam scenario → terrain → hydraulic derivation → flood propagation → impact."
        actions={<ModelAssumptionsHint />}
      />
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
        <MethodologyPanel />
        <aside className="overflow-y-auto border-t border-navy-100 bg-white p-5 lg:border-l lg:border-t-0">
          <DataTransparencyPanel />
          <p className="mt-6 text-[11px] leading-relaxed text-muted">
            SIH 2026 · PS 26161 · The Paradox Guild
          </p>
        </aside>
      </div>
    </div>
  )
}

export { Methodology }
