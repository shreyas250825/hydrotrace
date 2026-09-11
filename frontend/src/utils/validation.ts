import { PARAM_BOUNDS } from '@/config/defaults'
import type { Scenario, ValidationErrors } from '@/types/simulation'

function inRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max
}

export function validateScenario(scenario: Scenario): ValidationErrors {
  const errors: ValidationErrors = {}
  const { location, damParameters, breachParameters, simulationSettings } =
    scenario

  if (!location) {
    errors.location = 'Select a dam or breach location on the map.'
  }

  if (
    !inRange(
      damParameters.heightMeters,
      PARAM_BOUNDS.heightMeters.min,
      PARAM_BOUNDS.heightMeters.max,
    )
  ) {
    errors.heightMeters = `Dam height must be between ${PARAM_BOUNDS.heightMeters.min} and ${PARAM_BOUNDS.heightMeters.max} m.`
  }

  if (
    !inRange(
      damParameters.reservoirVolumeMcm,
      PARAM_BOUNDS.reservoirVolumeMcm.min,
      PARAM_BOUNDS.reservoirVolumeMcm.max,
    )
  ) {
    errors.reservoirVolumeMcm = `Reservoir volume must be between ${PARAM_BOUNDS.reservoirVolumeMcm.min} and ${PARAM_BOUNDS.reservoirVolumeMcm.max} million m³.`
  }

  if (
    !inRange(
      damParameters.currentWaterLevelPercent,
      PARAM_BOUNDS.currentWaterLevelPercent.min,
      PARAM_BOUNDS.currentWaterLevelPercent.max,
    )
  ) {
    errors.currentWaterLevelPercent = 'Water level must be between 1% and 100%.'
  }

  if (
    !inRange(
      breachParameters.widthMeters,
      PARAM_BOUNDS.widthMeters.min,
      PARAM_BOUNDS.widthMeters.max,
    )
  ) {
    errors.widthMeters = `Breach width must be between ${PARAM_BOUNDS.widthMeters.min} and ${PARAM_BOUNDS.widthMeters.max} m.`
  }

  if (
    !inRange(
      breachParameters.depthMeters,
      PARAM_BOUNDS.depthMeters.min,
      PARAM_BOUNDS.depthMeters.max,
    )
  ) {
    errors.depthMeters = `Breach depth must be between ${PARAM_BOUNDS.depthMeters.min} and ${PARAM_BOUNDS.depthMeters.max} m.`
  } else if (breachParameters.depthMeters > damParameters.heightMeters) {
    errors.depthMeters = 'Breach depth cannot exceed dam height.'
  }

  if (
    !inRange(
      breachParameters.formationTimeMinutes,
      PARAM_BOUNDS.formationTimeMinutes.min,
      PARAM_BOUNDS.formationTimeMinutes.max,
    )
  ) {
    errors.formationTimeMinutes = `Formation time must be between ${PARAM_BOUNDS.formationTimeMinutes.min} and ${PARAM_BOUNDS.formationTimeMinutes.max} minutes.`
  }

  if (
    breachParameters.hydraulicHeadMeters != null &&
    !inRange(
      breachParameters.hydraulicHeadMeters,
      PARAM_BOUNDS.hydraulicHeadMeters.min,
      PARAM_BOUNDS.hydraulicHeadMeters.max,
    )
  ) {
    errors.hydraulicHeadMeters = `Hydraulic head must be between ${PARAM_BOUNDS.hydraulicHeadMeters.min} and ${PARAM_BOUNDS.hydraulicHeadMeters.max} m.`
  }

  if (
    breachParameters.dischargeCoefficient != null &&
    !inRange(
      breachParameters.dischargeCoefficient,
      PARAM_BOUNDS.dischargeCoefficient.min,
      PARAM_BOUNDS.dischargeCoefficient.max,
    )
  ) {
    errors.dischargeCoefficient = `Discharge coefficient must be between ${PARAM_BOUNDS.dischargeCoefficient.min} and ${PARAM_BOUNDS.dischargeCoefficient.max}.`
  }

  if (
    !inRange(
      simulationSettings.durationHours,
      PARAM_BOUNDS.durationHours.min,
      PARAM_BOUNDS.durationHours.max,
    )
  ) {
    errors.durationHours = `Duration must be between ${PARAM_BOUNDS.durationHours.min} and ${PARAM_BOUNDS.durationHours.max} hours.`
  }

  if (
    !Number.isFinite(simulationSettings.gridResolutionMeters) ||
    simulationSettings.gridResolutionMeters <= 0
  ) {
    errors.gridResolutionMeters = 'Select a valid grid resolution.'
  }

  return errors
}
