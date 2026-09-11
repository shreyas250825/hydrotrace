/**
 * Probe WebGL once. Release the probe context so Chrome can create the real canvas.
 */
type Probe = 'unknown' | 'ok' | 'no'

let probe: Probe = 'unknown'

function runProbe(): boolean {
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  const options: WebGLContextAttributes = {
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'default',
  }
  try {
    const gl =
      canvas.getContext('webgl2', options) || canvas.getContext('webgl', options)
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    canvas.width = 0
    canvas.height = 0
    return true
  } catch {
    return false
  }
}

export function isWebGLAvailable(): boolean {
  if (probe === 'unknown') probe = runProbe() ? 'ok' : 'no'
  return probe === 'ok'
}

export function markWebGLUnavailable() {
  probe = 'no'
}

export function resetWebGLProbe() {
  probe = 'unknown'
}
