import type { CameraMode, EventType } from '@/types/simulation'

export interface VizRuntime {
  progress: number
  playing: boolean
  eventType: EventType
  breached: boolean
  cameraMode: CameraMode
  cinematicT: number
}

export const vizRuntime: VizRuntime = {
  progress: 0.08,
  playing: true,
  eventType: 'DAM_BREAK',
  breached: false,
  cameraMode: 'orbit',
  cinematicT: 0,
}

export const VIZ_DURATION_SECONDS = 60

let clockRaf = 0
let lastStamp = 0

export function ensureVizClock() {
  if (typeof window === 'undefined' || clockRaf) return
  lastStamp = performance.now()
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - lastStamp) / 1000)
    lastStamp = now
    if (vizRuntime.playing) {
      vizRuntime.progress = Math.min(1, vizRuntime.progress + dt / 36)
    }
    if (vizRuntime.cameraMode === 'cinematic') {
      vizRuntime.cinematicT = Math.min(1, vizRuntime.cinematicT + dt / 20)
    }
    clockRaf = window.requestAnimationFrame(tick)
  }
  clockRaf = window.requestAnimationFrame(tick)
}
