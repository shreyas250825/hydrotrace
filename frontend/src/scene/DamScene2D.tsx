import { ensureVizClock, vizRuntime } from '@/scene/vizRuntime'
import type { CameraView, EventType, SceneLayers } from '@/types/simulation'
import { useEffect, useState } from 'react'

function DamScene2D({
  eventType,
  layers,
  cameraView,
  breached,
  progressOverride,
  quality = 'high',
  className,
}: {
  eventType: EventType
  layers: SceneLayers
  cameraView: CameraView
  cameraNonce?: number
  quality?: 'high' | 'preview'
  className?: string
  breached?: boolean
  progressOverride?: number
  floodRevision?: number
  preferPrimary?: boolean
}) {
  const [progress, setProgress] = useState(
    progressOverride ?? vizRuntime.progress,
  )

  useEffect(() => {
    ensureVizClock()
    if (progressOverride != null) {
      setProgress(progressOverride)
      return
    }
    const id = window.setInterval(() => {
      setProgress(vizRuntime.progress)
    }, 80)
    return () => window.clearInterval(id)
  }, [progressOverride])

  const p = Math.max(0, Math.min(1, progress))
  const breakMode = eventType === 'DAM_BREAK' && Boolean(breached)
  const floodReach = breakMode
    ? 120 + p * 520
    : 80 + p * 220
  const floodOpacity = layers.floodPreview
    ? breakMode
      ? 0.28 + p * 0.35
      : 0.18 + p * 0.22
    : 0
  const cam = cameraShift(cameraView)
  const wave = p * 18

  return (
    <div className={`relative h-full min-h-[160px] w-full overflow-hidden bg-[#7ea3bc] ${className ?? ''}`}>
      <svg
        viewBox={`${cam.x} ${cam.y} ${cam.w} ${cam.h}`}
        className="h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c5d8e8" />
            <stop offset="100%" stopColor="#8eabc2" />
          </linearGradient>
          <linearGradient id="res" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5ec8e8" />
            <stop offset="100%" stopColor="#0e7490" />
          </linearGradient>
          <linearGradient id="flood" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
        </defs>

        <rect x={cam.x} y={cam.y} width={cam.w} height={cam.h} fill="url(#sky)" />
        <path d="M-40 210 C 80 170 140 230 260 190 C 360 160 420 210 520 180 L 520 0 L -40 0 Z" fill="#9bb3c4" />
        <path d="M 520 200 C 640 140 760 190 920 150 C 1040 120 1160 170 1280 140 L 1280 0 L 520 0 Z" fill="#8aa3b5" />

        <path d="M -40 430 C 180 390 320 470 520 420 C 760 360 980 470 1280 400 L 1280 720 L -40 720 Z" fill="#6b7a52" />
        <path d="M 200 470 C 360 500 480 455 640 490 C 820 530 980 480 1280 520 L 1280 720 L 200 720 Z" fill="#5c6b45" />

        {layers.water ? (
          <g>
            <path
              d={`M -20 ${248 + Math.sin(wave) * 3} C 80 ${238 + Math.sin(wave + 1) * 4} 180 255 250 248
                 L 250 318 L -20 318 Z`}
              fill="url(#res)"
              opacity={0.92}
            />
            <path
              d={`M -10 ${262 + Math.sin(wave + 0.6) * 2} C 90 254 170 268 248 260`}
              fill="none"
              stroke="#ecfeff"
              strokeWidth="1.4"
              opacity="0.45"
            />
          </g>
        ) : null}

        <g>
          <rect x="236" y="168" width="28" height="168" rx="2" fill="#c9c2b6" />
          <rect x="232" y="160" width="36" height="14" rx="1" fill="#2a3140" />
          <rect x="238" y="176" width="8" height="52" fill="#d8d3ca" />
          <rect x="254" y="176" width="8" height="52" fill="#d8d3ca" />
          {breakMode ? (
            <>
              <rect x="244" y="214" width="12" height="122" fill="#4b1d1d" />
              <path d="M 246 214 L 254 214 L 258 336 L 242 336 Z" fill="#7f1d1d" />
              {layers.water ? (
                <path
                  d={`M 250 230 C 280 ${240 + p * 20} 340 ${260 + p * 40} ${280 + floodReach * 0.15} ${300 + p * 30}
                     C 420 ${340 + p * 50} 520 ${380 + p * 40} ${250 + floodReach * 0.55} 430`}
                  fill="none"
                  stroke="#67e8f9"
                  strokeWidth={6 + p * 10}
                  strokeLinecap="round"
                  opacity={0.55 + p * 0.3}
                />
              ) : null}
            </>
          ) : (
            <rect x="244" y="174" width="12" height="154" fill="#d5cfc4" />
          )}
        </g>

        {eventType === 'CONTROLLED_RELEASE' && layers.water ? (
          <path
            d={`M 262 250 C 320 280 380 310 460 ${330 + p * 40} C 560 ${360 + p * 50} 680 400 820 430`}
            fill="none"
            stroke="#22d3ee"
            strokeWidth={4 + p * 5}
            opacity={0.45 + p * 0.25}
          />
        ) : null}

        {layers.floodPreview ? (
          <path
            d={
              breakMode
                ? `M 250 330 C 360 350 480 390 ${250 + floodReach * 0.45} ${380 + p * 30}
                   C ${400 + floodReach * 0.4} ${440 + p * 20} ${620 + floodReach * 0.35} 500 1280 470
                   L 1280 720 L 180 720 Z`
                : `M 270 300 C 360 330 480 350 ${400 + floodReach * 0.3} ${370 + p * 20}
                   C 620 420 760 430 980 450 L 980 470 L 270 400 Z`
            }
            fill="url(#flood)"
            opacity={floodOpacity}
          />
        ) : null}

        {layers.infrastructure ? (
          <g fill="#64748b">
            <rect x="620" y="448" width="22" height="28" />
            <rect x="648" y="456" width="16" height="20" />
            <rect x="700" y="442" width="26" height="34" fill="#78716c" />
            <rect x="780" y="450" width="18" height="24" fill="#f43f5e" />
            <rect x="820" y="458" width="20" height="22" fill="#f59e0b" />
            <rect x="560" y="430" width="36" height="8" fill="#1e293b" />
            <rect x="596" y="430" width="90" height="6" fill="#1e293b" />
          </g>
        ) : null}

        <text x="48" y="230" fill="#0b1f3a" fontSize="13" fontFamily="IBM Plex Sans, sans-serif">
          Reservoir
        </text>
        <text x="278" y="154" fill="#0b1f3a" fontSize="13" fontFamily="IBM Plex Sans, sans-serif">
          Dam
        </text>
        <text x="640" y="530" fill="#ecfeff" fontSize="12" fontFamily="IBM Plex Sans, sans-serif">
          Downstream
        </text>
      </svg>
      {quality === 'high' ? (
        <p className="pointer-events-none absolute bottom-3 left-3 max-w-md rounded-lg bg-navy-950/80 px-2.5 py-1.5 text-[10px] leading-relaxed tracking-[0.04em] text-cyan-100">
          2D command view — 3D WebGL did not start in this tab. Open
          http://127.0.0.1:5177/ in Chrome with hardware acceleration on.
        </p>
      ) : null}
    </div>
  )
}

function cameraShift(view: CameraView): { x: number; y: number; w: number; h: number } {
  switch (view) {
    case 'dam':
    case 'breach':
      return { x: 160, y: 80, w: 520, h: 360 }
    case 'reservoir':
      return { x: -40, y: 40, w: 560, h: 380 }
    case 'downstream':
      return { x: 420, y: 220, w: 760, h: 460 }
    case 'aerial':
      return { x: -40, y: 0, w: 1320, h: 720 }
    default:
      return { x: 0, y: 40, w: 1100, h: 620 }
  }
}

export { DamScene2D }
