import { HeroStage } from '@/components/landing/HeroStage'
import { Button } from '@/components/ui/button'
import { estimateInitialBreachDischarge, deriveHydraulicHeadMeters } from '@/science/hydraulics'
import { useFloodStore } from '@/store/useFloodStore'
import { formatNumber } from '@/utils/format'
import { ArrowRight, Play } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const PIPELINE = [
  { n: '01', title: 'Dam', detail: 'Select a case study and structural context' },
  { n: '02', title: 'Terrain', detail: 'Real DEM or demonstration elevation surface' },
  { n: '03', title: 'Scenario', detail: 'Reservoir level, breach geometry, hydraulics' },
  { n: '04', title: 'Flood', detail: 'Terrain-aware inundation propagation' },
  { n: '05', title: 'Impact', detail: 'Settlements, roads, bridges, critical sites' },
] as const

const FLOOD_TIMES = [
  { t: 0, label: '0 min', progress: 0.08 },
  { t: 15, label: '15 min', progress: 0.32 },
  { t: 30, label: '30 min', progress: 0.58 },
  { t: 60, label: '60 min', progress: 0.92 },
] as const

function Landing() {
  const navigate = useNavigate()
  const startDemoTour = useFloodStore((s) => s.startDemoTour)
  const catalog = useFloodStore((s) => s.damCatalog)
  const selectDam = useFloodStore((s) => s.selectDam)
  const loadDamCatalog = useFloodStore((s) => s.loadDamCatalog)
  const [hovered, setHovered] = useState<string | null>(null)
  const [floodIdx, setFloodIdx] = useState(1)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    void loadDamCatalog()
  }, [loadDamCatalog])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const qDemo = useMemo(() => {
    const head = deriveHydraulicHeadMeters(55, 85, null)
    return estimateInitialBreachDischarge({
      breachWidthM: 80,
      breachDepthM: 25,
      hydraulicHeadM: head,
      dischargeCoefficient: 0.6,
    })
  }, [])

  const enter = () => navigate('/app')
  const demo = () => {
    startDemoTour()
    navigate('/app')
  }
  const openDam = async (id: string) => {
    await selectDam(id)
    navigate('/app')
  }

  const floodProgress = FLOOD_TIMES[floodIdx].progress

  return (
    <div className="landing-root min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-[#f4f7fb] text-slate-900">
      {/* Nav */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'border-b border-slate-200/80 bg-white/85 backdrop-blur-md'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 sm:px-8 lg:px-10">
          <Link to="/" className="text-[13px] font-semibold tracking-[0.18em] text-slate-950">
            HYDROTRACE
          </Link>
          <nav className="hidden items-center gap-8 text-[14px] text-slate-500 md:flex">
            <a href="#case-studies" className="transition-colors hover:text-slate-950">
              Case Studies
            </a>
            <Link to="/app/methodology" className="transition-colors hover:text-slate-950">
              Methodology
            </Link>
            <a href="#how-it-works" className="transition-colors hover:text-slate-950">
              How It Works
            </a>
          </nav>
          <Button type="button" size="sm" onClick={enter}>
            Enter Workspace
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="landing-hero relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 landing-hero-grid opacity-[0.45]" />
        <div className="pointer-events-none absolute right-0 top-0 h-[70%] w-[65%] bg-[radial-gradient(ellipse_at_70%_40%,rgb(37_99_235_/_0.08),transparent_60%)]" />

        <div className="relative mx-auto grid max-w-[1200px] items-center gap-6 px-6 pb-12 pt-6 sm:px-8 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:gap-4 lg:px-10 lg:pb-14 lg:pt-4 lg:min-h-[calc(100dvh-4rem)]">
          <div className="landing-fade relative z-10 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">
              SIH 2026 · Disaster management
            </p>
            <h1 className="landing-display mt-4 text-slate-950">
              From dam break
              <br />
              to downstream
              <br />
              intelligence.
            </h1>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-slate-600 sm:text-[17px]">
              Model hypothetical dam-break scenarios, trace flood propagation across terrain, and
              understand downstream impact through geospatial and 3D intelligence.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button type="button" size="xl" onClick={enter}>
                Explore HYDROTRACE
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button type="button" size="xl" variant="outline" onClick={demo}>
                <Play className="h-4 w-4" />
                Watch the 3D Demo
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-0 gap-y-2">
              {['11 dam case studies', '2D geospatial', '3D digital twin', 'Impact intelligence'].map(
                (item, i) => (
                  <div key={item} className="flex items-center">
                    {i > 0 ? <span className="mx-3.5 hidden h-3 w-px bg-slate-300 sm:block" /> : null}
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
                      {item}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="relative z-0 -mx-2 sm:mx-0 lg:-mr-10 xl:-mr-20">
            <HeroStage />
          </div>
        </div>
      </section>

      {/* System flow */}
      <section id="how-it-works" className="border-t border-slate-200/80 bg-white px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="max-w-3xl text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-slate-950">
            Understand
            <br />
            what happens next.
          </h2>
          <div className="mt-16 grid gap-10 sm:grid-cols-5 sm:gap-4">
            {PIPELINE.map((step, i) => (
              <div key={step.n} className="landing-reveal relative">
                <p className="font-mono text-[12px] text-slate-400">{step.n}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 lg:text-3xl">
                  {step.title}
                </p>
                <p className="mt-2 max-w-[14rem] text-sm leading-relaxed text-slate-500">
                  {step.detail}
                </p>
                {i < PIPELINE.length - 1 ? (
                  <div className="absolute right-0 top-8 hidden h-px w-[calc(100%-4rem)] translate-x-[60%] bg-slate-200 sm:block" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case studies */}
      <section id="case-studies" className="border-t border-slate-200/80 bg-[#f4f7fb] px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Explore historical case studies
          </p>
          <h2 className="mt-3 max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-[-0.03em] text-slate-950">
            Eleven documented dam scenarios, one downstream analysis framework.
          </h2>
          <p className="mt-4 max-w-xl text-[17px] text-slate-600">
            Explore historically documented dam-failure cases through a common inundation analysis
            workspace.
          </p>

          <ul className="mt-12 divide-y divide-slate-200 border-y border-slate-200">
            {catalog.map((dam, index) => {
              const active = hovered === dam.id
              return (
                <li key={dam.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHovered(dam.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(dam.id)}
                    onBlur={() => setHovered(null)}
                    onClick={() => void openDam(dam.id)}
                    className={`group grid w-full grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-4 px-1 py-5 text-left transition-all duration-300 sm:grid-cols-[3.5rem_minmax(0,1fr)_12rem_auto] sm:px-2 ${
                      active ? 'bg-white/70 pl-3 sm:pl-4' : 'hover:bg-white/40'
                    }`}
                  >
                    <span className="font-mono text-xs text-slate-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>
                      <span className="block text-[17px] font-semibold text-slate-950 transition-colors group-hover:text-blue-600">
                        {dam.name}
                      </span>
                      <span className="mt-1 block text-sm text-slate-500">
                        {[dam.state, dam.historicalIncidentYear].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span
                      className={`hidden text-sm text-slate-500 transition-opacity sm:block ${
                        active ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {[dam.river, dam.latitude.toFixed(2) + '°N', dam.longitude.toFixed(2) + '°E']
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                      Enter →
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* See the flood */}
      <section className="border-t border-slate-200/80 bg-white px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-16">
          <div>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-slate-950">
              See the flood
              <br />
              before it happens.
            </h2>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-slate-600">
              HYDROTRACE connects terrain, scenario conditions, flood propagation and downstream
              impact in one explorable environment.
            </p>
            <div className="mt-10 flex flex-wrap gap-2">
              {FLOOD_TIMES.map((step, i) => (
                <button
                  key={step.t}
                  type="button"
                  onClick={() => setFloodIdx(i)}
                  className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                    floodIdx === i
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src="/images/hero-digital-twin.png"
                alt="Flood propagation visualization"
                className="h-full w-full scale-[1.04] object-cover object-[60%_45%]"
                loading="lazy"
                decoding="async"
              />
              <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-500"
                style={{
                  background:
                    'radial-gradient(ellipse 60% 45% at 72% 62%, rgb(14 165 233 / 0.55), transparent 72%)',
                  opacity: 0.2 + floodProgress * 0.65,
                  mixBlendMode: 'soft-light',
                }}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-md border border-white/40 bg-white/85 px-3 py-2 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Timeline
                </p>
                <p className="text-sm font-medium text-slate-900">{FLOOD_TIMES[floodIdx].label}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Science */}
      <section className="border-t border-slate-200/80 bg-[#f4f7fb] px-6 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="max-w-2xl text-[clamp(2rem,4vw,3.25rem)] font-semibold tracking-[-0.035em] text-slate-950">
            Built around engineering principles.
          </h2>
          <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Estimated initial breach discharge
              </p>
              <p className="mt-4 font-mono text-[clamp(1.75rem,4vw,3rem)] font-medium tracking-tight text-slate-950">
                Q = C<sub className="text-[0.65em]">d</sub> A √(2gH)
              </p>
              <p className="mt-4 text-[28px] font-semibold tracking-tight text-blue-600">
                {formatNumber(qDemo.qCms, 0)} m³/s
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
                Derived from scenario assumptions using orifice-style breach discharge. Distinct
                from the terrain-aware flood propagation used for inundation extents.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-slate-200 pt-8 sm:grid-cols-4 lg:border-t-0 lg:pt-0">
              {['Terrain', 'Hydraulics', 'Propagation', 'Impact'].map((item) => (
                <div key={item}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Stage
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10">
            <Link
              to="/app/methodology"
              className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              Read the methodology →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-slate-200/80 bg-slate-950 px-6 py-28 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1200px] text-center">
          <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
            Explore the
            <br />
            downstream.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[18px] text-slate-400">
            Start with a dam. Define a scenario. See what happens next.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              size="xl"
              className="bg-white text-slate-950 hover:bg-slate-100"
              onClick={enter}
            >
              Enter HYDROTRACE
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="xl"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/5"
              onClick={demo}
            >
              Watch the 3D Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-12 text-slate-400 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold tracking-[0.16em] text-white">HYDROTRACE</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed">
              Dam-Break Inundation & Decision Intelligence Platform
            </p>
            <p className="mt-2 text-xs text-slate-500">PS 26161 · Smart India Hackathon 2026</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <a href="#case-studies" className="hover:text-white">
              Case Studies
            </a>
            <Link to="/app/methodology" className="hover:text-white">
              Methodology
            </Link>
            <button type="button" onClick={enter} className="hover:text-white">
              Workspace
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export { Landing }
