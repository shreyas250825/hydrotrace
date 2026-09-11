import type { CameraView } from '@/types/simulation'
import type { Vector3Tuple } from 'three'

export interface CameraPreset {
  position: Vector3Tuple
  target: Vector3Tuple
}

/** Cinematic aerial defaults — show reservoir, dam, and valley together. */
export const CAMERA_PRESETS: Record<CameraView, CameraPreset> = {
  default: { position: [38, 26, 52], target: [0, 5, 6] },
  dam: { position: [18, 14, 30], target: [0, 8, -8] },
  reservoir: { position: [-12, 24, -62], target: [0, 7, -24] },
  breach: { position: [6, 12, 14], target: [0, 6, -6] },
  downstream: { position: [20, 22, 78], target: [0, 3, 30] },
  aerial: { position: [10, 68, 42], target: [0, 2, 8] },
}

export const CINEMATIC_SHOTS: { t: number; view: CameraView }[] = [
  { t: 0, view: 'reservoir' },
  { t: 0.14, view: 'dam' },
  { t: 0.28, view: 'breach' },
  { t: 0.48, view: 'downstream' },
  { t: 0.72, view: 'aerial' },
  { t: 0.92, view: 'default' },
]
