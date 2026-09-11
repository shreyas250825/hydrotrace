import { ExportPanel } from '@/components/export/ExportPanel'
import { PageHeader } from '@/components/layout/PageHeader'
import { AwaitingState } from '@/components/status/AwaitingState'
import { SimulationStatusBadge } from '@/components/status/SimulationStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEMO_DAM } from '@/demo/demoDamConfig'
import { hasOpenRouterKey } from '@/services/intelligenceService'
import { useFloodStore } from '@/store/useFloodStore'
import { AlertTriangle, Building2, FileText, ListOrdered, Sparkles } from 'lucide-react'

const PRIORITY_CLASS = {
  HIGH: 'border-red-200 bg-red-50 text-red-800',
  MEDIUM: 'border-orange-200 bg-orange-50 text-orange-800',
  LOW: 'border-amber-200 bg-amber-50 text-amber-900',
} as const

function IntelligenceReport() {
  const status = useFloodStore((s) => s.simulation.status)
  const report = useFloodStore((s) => s.intelligenceReport)
  const enhanceReport = useFloodStore((s) => s.enhanceReport)
  const enhancing = useFloodStore((s) => s.enhancing)
  const canEnhance = hasOpenRouterKey()
  const ready = status === 'COMPLETED' && report

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        eyebrow="Briefing"
        title="Intelligence Report"
        description="Assembled from the demonstration flood model and infrastructure intersection. AI may only rewrite this text — never the numbers."
        actions={
          <div className="flex items-center gap-2">
            {ready && canEnhance ? (
              <Button
                type="button"
                size="sm"
                variant="accent"
                disabled={enhancing}
                onClick={() => void enhanceReport()}
              >
                <Sparkles className="h-4 w-4" />
                {enhancing ? 'Enhancing…' : 'Enhance with AI'}
              </Button>
            ) : null}
            <SimulationStatusBadge status={status} />
          </div>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="rounded-xl border border-navy-100 bg-navy-50/80 px-4 py-3 text-sm leading-relaxed text-navy-700">
            Assembled from terrain-aware flood model outputs and infrastructure intersection for{' '}
            {DEMO_DAM.name}.
          </div>

          {!ready ? (
            <Card>
              <CardContent className="pt-6">
                <AwaitingState
                  title="Awaiting simulation"
                  detail="Run a demonstration for the selected dam to generate the briefing from actual model outputs."
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-navy-600" />
                    <CardTitle>Executive summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-navy-700">
                  {report.executiveSummary}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Flood overview</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-navy-700">
                  {report.floodOverview}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-navy-600" />
                    <CardTitle>Infrastructure exposure</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-navy-700">
                  {report.infrastructureExposure}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <CardTitle>Priority response zones</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {report.priorityZones.length === 0 ? (
                    <p className="text-sm text-navy-500">
                      No high or medium priority sites in this inundation.
                    </p>
                  ) : (
                    report.priorityZones.map((zone) => (
                      <div
                        key={`${zone.level}-${zone.name}`}
                        className={`rounded-xl border px-3 py-2 text-sm ${PRIORITY_CLASS[zone.level]}`}
                      >
                        <p className="font-semibold">
                          {zone.level} · {zone.name}
                        </p>
                        <p className="mt-0.5 text-[13px] opacity-90">{zone.detail}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ListOrdered className="h-4 w-4 text-navy-600" />
                    <CardTitle>Recommended actions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal space-y-2 pl-4 text-sm text-navy-700">
                    {report.recommendedActions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {report.enhancedNarrative ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-600" />
                      <CardTitle>AI narrative</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="whitespace-pre-wrap text-sm leading-relaxed text-navy-700">
                    {report.enhancedNarrative}
                  </CardContent>
                </Card>
              ) : null}

              <p className="text-[11px] text-navy-400">
                Generated {new Date(report.generatedAt).toLocaleString('en-IN')} ·{' '}
                {report.modelNote}
              </p>
            </>
          )}

          <ExportPanel />
        </div>
      </div>
    </div>
  )
}

export { IntelligenceReport }
