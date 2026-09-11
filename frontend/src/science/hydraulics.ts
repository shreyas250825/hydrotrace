/**
 * Derived breach-discharge estimate (not the flood solver).
 * Q = C_d · A · √(2 g H)
 */
export const G = 9.81

export interface BreachDischargeInput {
  breachWidthM: number
  breachDepthM: number
  hydraulicHeadM: number
  dischargeCoefficient: number
}

export interface BreachDischargeResult {
  areaM2: number
  hydraulicHeadM: number
  dischargeCoefficient: number
  qCms: number
  formula: string
  label: 'Estimated Initial Breach Discharge'
  kind: 'DERIVED'
  note: string
}

export function deriveHydraulicHeadMeters(
  damHeightM: number,
  waterLevelPercent: number,
  overrideHeadM?: number | null,
): number {
  if (overrideHeadM != null && Number.isFinite(overrideHeadM) && overrideHeadM > 0) {
    return overrideHeadM
  }
  return Math.max(0.1, damHeightM * (waterLevelPercent / 100))
}

export function estimateInitialBreachDischarge(
  input: BreachDischargeInput,
): BreachDischargeResult {
  const width = Math.max(0, input.breachWidthM)
  const depth = Math.max(0, input.breachDepthM)
  const H = Math.max(0.01, input.hydraulicHeadM)
  const Cd = Math.max(0.1, Math.min(1.2, input.dischargeCoefficient))
  const A = width * depth
  const Q = Cd * A * Math.sqrt(2 * G * H)
  return {
    areaM2: A,
    hydraulicHeadM: H,
    dischargeCoefficient: Cd,
    qCms: Q,
    formula: 'Q = C_d A √(2gH)',
    label: 'Estimated Initial Breach Discharge',
    kind: 'DERIVED',
    note: 'Derived from scenario assumptions. Not a hydrodynamic simulation discharge.',
  }
}
