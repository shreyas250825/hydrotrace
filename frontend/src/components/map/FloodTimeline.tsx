import { Button } from '@/components/ui/button'
import { useFloodStore } from '@/store/useFloodStore'
import { vizRuntime } from '@/scene/vizRuntime'
import { cn } from '@/lib/utils'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function FloodTimeline({
  className = '',
  dark = false,
  compact = false,
}: {
  className?: string
  dark?: boolean
  compact?: boolean
}) {
  const status = useFloodStore((s) => s.simulation.status)
  const arrivalMin = useFloodStore((s) => s.simulation.results.estimatedArrivalTimeMin)
  const timelineProgress = useFloodStore((s) => s.timelineProgress)
  const setTimelineProgress = useFloodStore((s) => s.setTimelineProgress)
  const [playing, setPlaying] = useState(false)
  const playingRef = useRef(false)
  playingRef.current = playing

  useEffect(() => {
    if (!playing || status !== 'COMPLETED') return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      if (!playingRef.current) return
      const dt = (now - last) / 1000
      last = now
      const cur = useFloodStore.getState().timelineProgress
      const next = Math.min(1, cur + dt / 18)
      setTimelineProgress(next)
      vizRuntime.progress = next
      if (next >= 1) {
        setPlaying(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, status, setTimelineProgress])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code !== 'Space') return
      if (status !== 'COMPLETED') return
      e.preventDefault()
      setPlaying((p) => {
        if (!p && timelineProgress >= 1) setTimelineProgress(0)
        return !p
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status, timelineProgress, setTimelineProgress])

  const span = arrivalMin ?? 60
  const ready = status === 'COMPLETED'

  const reset = () => {
    setPlaying(false)
    setTimelineProgress(0)
    vizRuntime.progress = 0
  }

  return (
    <div
      className={cn(
        'px-3 py-2.5',
        dark
          ? 'border-white/10 bg-[#0a101c] text-white'
          : 'border-navy-100 bg-white text-navy-900',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p
            className={cn(
              'text-[10px] font-semibold uppercase tracking-[0.14em]',
              dark ? 'text-slate-400' : 'text-navy-500',
            )}
          >
            Flood timeline
          </p>
          <p className={cn('font-mono text-sm', dark ? 'text-white' : 'text-navy-800')}>
            {(timelineProgress * span).toFixed(0)} / {span.toFixed(0)} min
            {!ready ? (
              <span className={cn('ml-2 text-xs', dark ? 'text-slate-500' : 'text-navy-400')}>
                · run simulation to scrub
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!ready}
            className={dark ? 'border-white/20 bg-white/5 text-white' : ''}
            onClick={() => {
              if (timelineProgress >= 1) setTimelineProgress(0)
              setPlaying((p) => !p)
            }}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? 'Pause' : 'Play'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!ready}
            className={dark ? 'border-white/20 bg-white/5 text-white' : ''}
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={1000}
        disabled={!ready}
        value={Math.round(timelineProgress * 1000)}
        onChange={(e) => {
          setPlaying(false)
          const v = Number(e.target.value) / 1000
          setTimelineProgress(v)
          vizRuntime.progress = v
        }}
        className={cn('mt-2 w-full', dark ? 'accent-cyan-400' : 'accent-cyan-700')}
      />
      {!compact ? (
        <div
          className={cn(
            'mt-1 flex justify-between text-[10px]',
            dark ? 'text-slate-500' : 'text-navy-400',
          )}
        >
          <span>0</span>
          <span>{Math.round(span / 2)}</span>
          <span>{Math.round(span)}</span>
        </div>
      ) : null}
    </div>
  )
}

export { FloodTimeline }
