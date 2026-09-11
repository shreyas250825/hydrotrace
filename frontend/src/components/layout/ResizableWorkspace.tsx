import { cn } from '@/lib/utils'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type SplitDirection = 'horizontal' | 'vertical'

function readStored(key: string | undefined, fallback: number, min: number, max: number) {
  if (!key || typeof window === 'undefined') return fallback
  const saved = Number(window.localStorage.getItem(key))
  if (!Number.isFinite(saved)) return fallback
  return Math.min(max, Math.max(min, saved))
}

/**
 * Drag-to-resize split. Persists primary size when storageKey is set.
 * horizontal: primary | secondary (vertical divider)
 * vertical: primary / secondary (horizontal divider)
 */
function ResizableSplitPane({
  direction = 'horizontal',
  initialPrimaryPercent = 78,
  minPrimaryPercent = 35,
  maxPrimaryPercent = 92,
  className,
  primary,
  secondary,
  storageKey,
  onResize,
  hideSecondary = false,
}: {
  direction?: SplitDirection
  initialPrimaryPercent?: number
  minPrimaryPercent?: number
  maxPrimaryPercent?: number
  className?: string
  primary: ReactNode
  secondary: ReactNode
  storageKey?: string
  onResize?: (primaryPercent: number) => void
  hideSecondary?: boolean
}) {
  const [primaryPct, setPrimaryPct] = useState(() =>
    readStored(storageKey, initialPrimaryPercent, minPrimaryPercent, maxPrimaryPercent),
  )
  const dragging = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const pctRef = useRef(primaryPct)
  pctRef.current = primaryPct

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!dragging.current || !rootRef.current) return
      const rect = rootRef.current.getBoundingClientRect()
      if (rect.width < 8 || rect.height < 8) return
      let next =
        direction === 'horizontal'
          ? ((event.clientX - rect.left) / rect.width) * 100
          : ((event.clientY - rect.top) / rect.height) * 100
      next = Math.max(minPrimaryPercent, Math.min(maxPrimaryPercent, next))
      setPrimaryPct(next)
      onResize?.(next)
    },
    [direction, maxPrimaryPercent, minPrimaryPercent, onResize],
  )

  const stop = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    if (storageKey) window.localStorage.setItem(storageKey, String(pctRef.current))
  }, [storageKey])

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [onPointerMove, stop])

  const isH = direction === 'horizontal'

  if (hideSecondary) {
    return (
      <div ref={rootRef} className={cn('flex min-h-0 min-w-0 flex-1', className)}>
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{primary}</div>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className={cn('flex min-h-0 min-w-0 flex-1', isH ? 'flex-row' : 'flex-col', className)}
    >
      <div
        className="min-h-0 min-w-0 overflow-hidden"
        style={
          isH
            ? { width: `${primaryPct}%`, flex: 'none' }
            : { height: `${primaryPct}%`, flex: 'none' }
        }
      >
        {primary}
      </div>
      <button
        type="button"
        aria-label="Resize panels"
        onPointerDown={(e) => {
          e.preventDefault()
          dragging.current = true
          document.body.style.cursor = isH ? 'col-resize' : 'row-resize'
          document.body.style.userSelect = 'none'
        }}
        className={cn(
          'group relative shrink-0 bg-navy-200/80 transition hover:bg-cyan-600/50',
          isH ? 'w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize',
        )}
      >
        <span
          className={cn(
            'absolute rounded-full bg-navy-400/70 group-hover:bg-cyan-600',
            isH
              ? 'left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2'
              : 'left-1/2 top-1/2 h-1 w-8 -translate-x-1/2 -translate-y-1/2',
          )}
        />
      </button>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{secondary}</div>
    </div>
  )
}

/** Observe element size; fire on every meaningful change (panel drag, fullscreen). */
function useElementSize(
  onSize: (width: number, height: number) => void,
  deps: unknown[] = [],
) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const notify = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 2 && height > 2) onSize(width, height)
    }
    notify()
    const ro = new ResizeObserver(() => notify())
    ro.observe(el)
    window.addEventListener('resize', notify)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', notify)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}

function useWorkspaceFullscreen() {
  const [fullscreen, setFullscreen] = useState(false)

  const enterFullscreen = useCallback(() => setFullscreen(true), [])
  const exitFullscreen = useCallback(() => setFullscreen(false), [])
  const toggleFullscreen = useCallback(() => setFullscreen((v) => !v), [])

  return { fullscreen, enterFullscreen, exitFullscreen, toggleFullscreen, setFullscreen }
}

/**
 * Professional GIS / digital-twin workspace shell.
 * Fullscreen toggles CSS on the SAME root — children are never remounted.
 *
 * Layout: left tools | primary viz (+ floating right) / bottom timeline
 * Default: visualization dominates (~78–85%).
 */
function VisualizationWorkspace({
  title,
  subtitle,
  toolbar,
  left,
  bottom,
  floatingRight,
  children,
  fullscreen,
  onToggleFullscreen,
  onExitFullscreen,
  leftStorageKey = 'hydrotrace.workspace.leftPercent',
  bottomStorageKey = 'hydrotrace.workspace.bottomPercent',
  /** Percent of width for LEFT tools (default 18 → viz ~82%) */
  initialLeftPercent = 18,
  /** Percent of height for BOTTOM (default 16 → viz ~84%) */
  initialBottomPercent = 16,
  minLeftPercent = 12,
  maxLeftPercent = 34,
  minBottomPercent = 10,
  maxBottomPercent = 38,
  hideLeft = false,
  hideBottom = false,
  dark = false,
  className,
  resizeNonce = 0,
  onWorkspaceResize,
  shortcuts = true,
}: {
  title: string
  subtitle?: string
  toolbar?: ReactNode
  left?: ReactNode
  bottom?: ReactNode
  floatingRight?: ReactNode
  children: ReactNode
  fullscreen: boolean
  onToggleFullscreen: () => void
  onExitFullscreen: () => void
  leftStorageKey?: string
  bottomStorageKey?: string
  initialLeftPercent?: number
  initialBottomPercent?: number
  minLeftPercent?: number
  maxLeftPercent?: number
  minBottomPercent?: number
  maxBottomPercent?: number
  hideLeft?: boolean
  hideBottom?: boolean
  dark?: boolean
  className?: string
  resizeNonce?: number
  onWorkspaceResize?: () => void
  shortcuts?: boolean
}) {
  const [resizeTick, setResizeTick] = useState(0)
  const bump = useCallback(() => {
    setResizeTick((n) => n + 1)
    onWorkspaceResize?.()
    window.dispatchEvent(new Event('resize'))
  }, [onWorkspaceResize])

  useEffect(() => {
    const t1 = window.setTimeout(bump, 40)
    const t2 = window.setTimeout(bump, 200)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [fullscreen, resizeNonce, bump])

  useEffect(() => {
    if (!shortcuts) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Escape' && fullscreen) {
        e.preventDefault()
        onExitFullscreen()
      }
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        onToggleFullscreen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcuts, fullscreen, onExitFullscreen, onToggleFullscreen])

  const vizPane = (
    <div className="relative h-full min-h-0 w-full overflow-hidden" data-resize-tick={resizeTick}>
      {children}
      {floatingRight ? (
        <div className="pointer-events-none absolute inset-y-3 right-3 z-[30] w-[min(300px,36vw)]">
          <div className="pointer-events-auto max-h-full overflow-y-auto">{floatingRight}</div>
        </div>
      ) : null}
    </div>
  )

  const mainRow =
    hideLeft || !left ? (
      vizPane
    ) : (
      <ResizableSplitPane
        direction="horizontal"
        initialPrimaryPercent={initialLeftPercent}
        minPrimaryPercent={minLeftPercent}
        maxPrimaryPercent={maxLeftPercent}
        storageKey={leftStorageKey}
        onResize={bump}
        primary={
          <div
            className={cn(
              'h-full overflow-y-auto',
              dark ? 'bg-[#0a101c]/95' : 'bg-white',
            )}
          >
            {left}
          </div>
        }
        secondary={vizPane}
      />
    )

  return (
    <div
      className={cn(
        'flex min-h-0 min-w-0 flex-col overflow-hidden',
        dark ? 'bg-[#0c1220] text-white' : 'bg-navy-50 text-navy-900',
        fullscreen
          ? 'fixed inset-0 z-[4000] h-[100dvh] w-[100vw]'
          : 'relative h-full flex-1',
        className,
      )}
      data-workspace-fullscreen={fullscreen ? '1' : '0'}
    >
      <header
        className={cn(
          'flex h-12 shrink-0 items-center justify-between gap-3 border-b px-3',
          dark ? 'border-white/10 bg-[#07121f]' : 'border-navy-100 bg-white',
        )}
      >
        <div className="min-w-0">
          <p className={cn('truncate text-sm font-semibold tracking-tight', dark ? 'text-white' : 'text-navy-800')}>
            {title}
            {subtitle ? (
              <span className={cn('ml-2 font-normal', dark ? 'text-navy-200' : 'text-muted')}>
                {subtitle}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {toolbar}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={cn(
              'rounded-md border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]',
              dark
                ? 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                : 'border-navy-100 bg-white text-navy-800 hover:border-navy-200',
            )}
          >
            {fullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {hideBottom || !bottom ? (
          mainRow
        ) : (
          <ResizableSplitPane
            direction="vertical"
            initialPrimaryPercent={100 - initialBottomPercent}
            minPrimaryPercent={100 - maxBottomPercent}
            maxPrimaryPercent={100 - minBottomPercent}
            storageKey={bottomStorageKey}
            onResize={bump}
            primary={mainRow}
            secondary={
              <div
                className={cn(
                  'h-full overflow-y-auto',
                  dark ? 'bg-[#0a101c]' : 'bg-white',
                )}
              >
                {bottom}
              </div>
            }
          />
        )}
      </div>
    </div>
  )
}

/** @deprecated Use VisualizationWorkspace — kept for call sites that still import it */
function FullscreenPanel({
  active,
  onExit,
  title,
  children,
  toolbar,
}: {
  active: boolean
  onExit: () => void
  title: string
  children: ReactNode
  toolbar?: ReactNode
}) {
  return (
    <VisualizationWorkspace
      title={title}
      toolbar={toolbar}
      fullscreen={active}
      onToggleFullscreen={() => (active ? onExit() : undefined)}
      onExitFullscreen={onExit}
      hideLeft
      hideBottom
    >
      {children}
    </VisualizationWorkspace>
  )
}

export {
  ResizableSplitPane,
  VisualizationWorkspace,
  FullscreenPanel,
  useWorkspaceFullscreen,
  useElementSize,
}
