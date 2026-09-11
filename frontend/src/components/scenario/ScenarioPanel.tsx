import { DamInfoPanel } from '@/components/dams/DamInfoPanel'
import { DataTransparencyPanel } from '@/components/dams/DataTransparencyPanel'
import { DataSourcesSection } from '@/components/scenario/DataSourcesSection'
import { EventTypeToggle } from '@/components/scenario/EventTypeToggle'
import { ParameterField } from '@/components/scenario/ParameterField'
import { DerivedHydraulicsCard, ModelAssumptionsHint } from '@/components/science/ModelStatus'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { GRID_RESOLUTION_OPTIONS, PARAM_BOUNDS } from '@/config/defaults'
import { deriveHydraulicHeadMeters } from '@/science/hydraulics'
import { useFloodStore } from '@/store/useFloodStore'
import { formatCoordinate, formatNumber } from '@/utils/format'
import { AlertTriangle, ChevronDown, Play, RotateCcw } from 'lucide-react'
import { useState } from 'react'

function ScenarioPanel() {
  const scenario = useFloodStore((s) => s.scenario)
  const errors = useFloodStore((s) => s.validationErrors)
  const selectedDam = useFloodStore((s) => s.selectedDam)
  const updateDamParameters = useFloodStore((s) => s.updateDamParameters)
  const updateBreachParameters = useFloodStore((s) => s.updateBreachParameters)
  const updateSimulationSettings = useFloodStore((s) => s.updateSimulationSettings)
  const updateEventType = useFloodStore((s) => s.updateEventType)
  const runDemonstration = useFloodStore((s) => s.runDemonstration)
  const resetScenarioDefaults = useFloodStore((s) => s.resetScenarioDefaults)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  const { location, damParameters, breachParameters, simulationSettings, eventType } = scenario
  const errorCount = Object.keys(errors).length
  const derivedHead = deriveHydraulicHeadMeters(
    damParameters.heightMeters,
    damParameters.currentWaterLevelPercent,
    breachParameters.hydraulicHeadMeters,
  )

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Define scenario
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-navy-950">
              {selectedDam.name}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <ModelAssumptionsHint compact />
            <Button type="button" size="sm" variant="outline" onClick={resetScenarioDefaults}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <section className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Event
          </p>
          <div className="mt-2">
            <EventTypeToggle value={eventType} onChange={updateEventType} />
          </div>
        </section>

        <section className="mt-5 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500">
            Basic parameters
          </p>
          <ParameterField
            id="water-level"
            label="Reservoir level"
            unit="%"
            type="number"
            min={PARAM_BOUNDS.currentWaterLevelPercent.min}
            max={PARAM_BOUNDS.currentWaterLevelPercent.max}
            step={1}
            value={damParameters.currentWaterLevelPercent}
            onChange={(event) =>
              updateDamParameters({
                currentWaterLevelPercent: Number(event.target.value),
              })
            }
            error={errors.currentWaterLevelPercent}
          />
          <ParameterField
            id="breach-width"
            label={eventType === 'DAM_BREAK' ? 'Breach width' : 'Gate opening width'}
            unit="m"
            type="number"
            min={PARAM_BOUNDS.widthMeters.min}
            max={PARAM_BOUNDS.widthMeters.max}
            step={1}
            value={breachParameters.widthMeters}
            onChange={(event) =>
              updateBreachParameters({ widthMeters: Number(event.target.value) })
            }
            error={errors.widthMeters}
          />
          <ParameterField
            id="breach-depth"
            label={eventType === 'DAM_BREAK' ? 'Breach depth' : 'Gate opening height'}
            unit="m"
            type="number"
            min={PARAM_BOUNDS.depthMeters.min}
            max={PARAM_BOUNDS.depthMeters.max}
            step={1}
            value={breachParameters.depthMeters}
            onChange={(event) =>
              updateBreachParameters({ depthMeters: Number(event.target.value) })
            }
            error={errors.depthMeters}
          />
          <ParameterField
            id="formation-time"
            label={
              eventType === 'DAM_BREAK' ? 'Breach formation time' : 'Gate opening time'
            }
            unit="min"
            type="number"
            min={PARAM_BOUNDS.formationTimeMinutes.min}
            max={PARAM_BOUNDS.formationTimeMinutes.max}
            step={1}
            value={breachParameters.formationTimeMinutes}
            onChange={(event) =>
              updateBreachParameters({
                formationTimeMinutes: Number(event.target.value),
              })
            }
            error={errors.formationTimeMinutes}
          />
          <ParameterField
            id="sim-duration"
            label="Duration"
            unit="hr"
            type="number"
            min={PARAM_BOUNDS.durationHours.min}
            max={PARAM_BOUNDS.durationHours.max}
            step={1}
            value={simulationSettings.durationHours}
            onChange={(event) =>
              updateSimulationSettings({
                durationHours: Number(event.target.value),
              })
            }
            error={errors.durationHours}
          />
        </section>

        <div className="mt-4">
          <DerivedHydraulicsCard />
        </div>

        <button
          type="button"
          className="mt-5 flex w-full items-center justify-between rounded-lg border border-navy-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-600 hover:bg-navy-50"
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          Advanced
          <ChevronDown
            className={`h-4 w-4 transition ${advancedOpen ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>
        {advancedOpen ? (
          <div className="mt-3 space-y-3 rounded-xl border border-navy-100 bg-navy-50/50 p-3">
            <ParameterField
              id="dam-height"
              label="Dam height"
              unit="m"
              type="number"
              min={PARAM_BOUNDS.heightMeters.min}
              max={PARAM_BOUNDS.heightMeters.max}
              step={1}
              value={damParameters.heightMeters}
              onChange={(event) =>
                updateDamParameters({ heightMeters: Number(event.target.value) })
              }
              error={errors.heightMeters}
            />
            <ParameterField
              id="reservoir-volume"
              label="Reservoir volume"
              unit="M m³"
              type="number"
              min={PARAM_BOUNDS.reservoirVolumeMcm.min}
              max={PARAM_BOUNDS.reservoirVolumeMcm.max}
              step={10}
              value={damParameters.reservoirVolumeMcm}
              onChange={(event) =>
                updateDamParameters({
                  reservoirVolumeMcm: Number(event.target.value),
                })
              }
              error={errors.reservoirVolumeMcm}
            />
            <ParameterField
              id="hydraulic-head"
              label="Hydraulic head"
              unit="m"
              type="number"
              min={PARAM_BOUNDS.hydraulicHeadMeters.min}
              max={PARAM_BOUNDS.hydraulicHeadMeters.max}
              step={0.5}
              value={
                breachParameters.hydraulicHeadMeters != null
                  ? breachParameters.hydraulicHeadMeters
                  : Number(formatNumber(derivedHead, 1))
              }
              onChange={(event) =>
                updateBreachParameters({
                  hydraulicHeadMeters: Number(event.target.value),
                })
              }
              error={errors.hydraulicHeadMeters}
              hint="Used for the derived breach-discharge estimate."
            />
            <ParameterField
              id="discharge-coefficient"
              label="Discharge coefficient"
              unit="—"
              type="number"
              min={PARAM_BOUNDS.dischargeCoefficient.min}
              max={PARAM_BOUNDS.dischargeCoefficient.max}
              step={0.01}
              value={breachParameters.dischargeCoefficient ?? 0.6}
              onChange={(event) =>
                updateBreachParameters({
                  dischargeCoefficient: Number(event.target.value),
                })
              }
              error={errors.dischargeCoefficient}
              hint="Demonstration assumption — not site-calibrated."
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="grid-resolution">Grid resolution</Label>
              <select
                id="grid-resolution"
                value={simulationSettings.gridResolutionMeters}
                onChange={(event) =>
                  updateSimulationSettings({
                    gridResolutionMeters: Number(event.target.value),
                  })
                }
                className="flex h-10 w-full rounded-lg border border-navy-100 bg-white px-3 text-sm text-navy-900 shadow-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/15"
              >
                {GRID_RESOLUTION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} m
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-navy-100 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Location
              </p>
              <p className="mt-1 font-mono text-xs text-navy-800">
                {location
                  ? `${formatCoordinate(location.lat)}° N, ${formatCoordinate(location.lng)}° E`
                  : 'Click map to place marker'}
              </p>
              {errors.location ? (
                <p className="mt-1 text-xs text-danger">{errors.location}</p>
              ) : null}
            </div>
            <DamInfoPanel compact />
          </div>
        ) : null}

        <button
          type="button"
          className="mt-3 flex w-full items-center justify-between rounded-lg border border-navy-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-600 hover:bg-navy-50"
          onClick={() => setSourcesOpen((v) => !v)}
        >
          Data sources
          <ChevronDown
            className={`h-4 w-4 transition ${sourcesOpen ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>
        {sourcesOpen ? (
          <div className="mt-3 space-y-3">
            <DataTransparencyPanel compact />
            <DataSourcesSection />
          </div>
        ) : null}

        <Separator className="my-4" />
      </div>

      <div className="border-t border-navy-100 bg-white p-4">
        {errorCount > 0 ? (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-danger">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Complete highlighted fields before running.
          </div>
        ) : null}
        <Button
          type="button"
          size="full"
          onClick={() => {
            void runDemonstration()
          }}
        >
          <Play className="h-4 w-4" />
          Run simulation
        </Button>
      </div>
    </div>
  )
}

export { ScenarioPanel }
