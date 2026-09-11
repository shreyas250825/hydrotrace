import { useEffect, useRef, useState, type CSSProperties } from 'react'

const ANNOTATIONS = [
  { id: 'dam', label: 'Dam', value: 'Kaddam', top: '34%', left: '48%', delay: 0 },
  { id: 'scenario', label: 'Scenario', value: 'Dam break', top: '52%', left: '58%', delay: 350 },
  { id: 'terrain', label: 'Terrain', value: 'Demonstration DEM', top: '22%', left: '74%', delay: 700 },
  { id: 'flow', label: 'Flow', value: 'Propagating downstream', top: '72%', left: '66%', delay: 1050 },
] as const

/**
 * Bleed-edge cinematic hero stage — not a bordered image card.
 * Premium static visual + subtle flood / contour motion.
 */
function HeroStage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const cycle = ((now - t0) % 11000) / 11000
      setPhase(cycle)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 7
      el.style.setProperty('--parallax-x', `${x.toFixed(2)}px`)
      el.style.setProperty('--parallax-y', `${y.toFixed(2)}px`)
    }
    el.addEventListener('pointermove', onMove)
    return () => el.removeEventListener('pointermove', onMove)
  }, [])

  const floodOpacity = 0.12 + phase * 0.55
  const floodScale = 0.62 + phase * 0.42

  return (
    <div
      ref={rootRef}
      className="hero-stage-root relative h-full min-h-[400px] w-full overflow-visible lg:min-h-[560px]"
      style={
        {
          '--parallax-x': '0px',
          '--parallax-y': '0px',
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute -inset-x-20 -inset-y-12 -z-10 bg-[radial-gradient(ellipse_at_55%_45%,rgb(37_99_235_/_0.14),transparent_62%)] blur-3xl" />

      <div
        className={`relative h-full w-full overflow-hidden transition-opacity duration-700 ${
          loaded ? 'opacity-100' : 'opacity-40'
        }`}
        style={{
          transform: 'translate3d(var(--parallax-x), var(--parallax-y), 0) scale(1.035)',
          transition: 'transform 450ms ease-out',
        }}
      >
        <img
          src="/images/hero-digital-twin.png"
          alt="Cinematic digital twin of a dam, reservoir, and downstream flood propagation"
          className="h-full w-full object-cover object-[42%_36%]"
          decoding="async"
          fetchPriority="high"
          onLoad={() => setLoaded(true)}
        />

        {/* Contour intelligence */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <g
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeOpacity="0.45"
            className="hero-contour-drift"
          >
            <path d="M80 610 C300 560 480 650 720 600 C960 550 1180 640 1540 580" />
            <path d="M40 670 C280 620 520 720 780 660 C1020 610 1260 700 1560 640" />
            <path d="M120 530 C360 480 560 570 840 520 C1080 480 1300 560 1520 510" />
          </g>
          <path
            d="M680 400 C820 450 980 520 1160 590 C1280 630 1400 670 1520 710"
            fill="none"
            stroke="#7dd3fc"
            strokeWidth="1.4"
            strokeOpacity="0.4"
            strokeDasharray="5 9"
            className="hero-flow-dash"
          />
        </svg>

        {/* Animated flood veil */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 38% at 70% 60%, rgb(14 165 233 / 0.5), transparent 70%)',
            opacity: Math.min(0.75, floodOpacity),
            transform: `scale(${floodScale.toFixed(3)})`,
            transformOrigin: '55% 45%',
            mixBlendMode: 'soft-light',
          }}
        />

        {/* Bleed fades — soft merge into page, keep dam sharp */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#f4f7fb] via-[#f4f7fb]/50 to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f4f7fb] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#f4f7fb]/70 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#f4f7fb]/40 to-transparent" />
      </div>

      {!loaded ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Preparing visualization…
          </p>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {ANNOTATIONS.map((a) => (
          <div
            key={a.id}
            className="hero-annotation absolute"
            style={{ top: a.top, left: a.left, animationDelay: `${a.delay}ms` }}
          >
            <div className="flex items-start gap-2 drop-shadow-[0_1px_8px_rgb(255_255_255_/_0.85)]">
              <span className="mt-2 h-px w-7 bg-slate-700/50" />
              <div className="rounded-sm bg-white/75 px-2 py-1 backdrop-blur-[2px]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {a.label}
                </p>
                <p className="text-[13px] font-medium text-slate-900">{a.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { HeroStage }
