import { cn } from '@/lib/utils'
import { pathForView } from '@/navigation/routes'
import { useFloodStore } from '@/store/useFloodStore'
import type { AppView } from '@/types/simulation'
import {
  Box,
  Building2,
  Clapperboard,
  Columns2,
  FileBarChart,
  FlaskConical,
  Globe2,
  LayoutDashboard,
  MapPinned,
  Menu,
  Waves,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type NavItem = { id: AppView; label: string; icon: typeof LayoutDashboard }

const ANALYZE: NavItem[] = [
  { id: 'geospatial', label: 'Geospatial', icon: Globe2 },
  { id: 'command', label: '3D Command Center', icon: Box },
  { id: 'simulation', label: 'Simulation', icon: Waves },
  { id: 'impact', label: 'Impact Analysis', icon: Building2 },
  { id: 'comparison', label: 'Scenario Comparison', icon: Columns2 },
]

const SCIENCE: NavItem[] = [
  { id: 'methodology', label: 'Methodology', icon: FlaskConical },
  { id: 'intelligence', label: 'Intelligence Report', icon: FileBarChart },
]

function NavButton({
  item,
  active,
  onClick,
  trailing,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
  trailing?: ReactNode
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors',
        active
          ? 'bg-navy-50 text-navy-500'
          : 'text-navy-700 hover:bg-surface hover:text-navy-950',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-navy-500' : 'text-muted')} />
      <span className="flex-1 truncate">{item.label}</span>
      {trailing}
    </button>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-1 mt-5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted first:mt-1">
      {children}
    </p>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const currentView = useFloodStore((s) => s.currentView)
  const setCurrentView = useFloodStore((s) => s.setCurrentView)
  const simStatus = useFloodStore((s) => s.simulation.status)
  const tour = useFloodStore((s) => s.demoTour)
  const startDemoTour = useFloodStore((s) => s.startDemoTour)
  const exitDemoTour = useFloodStore((s) => s.exitDemoTour)
  const navigate = useNavigate()

  const go = (view: AppView) => {
    setCurrentView(view)
    navigate(pathForView(view))
    onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-navy-100 px-4 py-5">
        <Link to="/" className="block" onClick={onNavigate}>
          <p className="text-[13px] font-semibold tracking-[0.14em] text-navy-950">HYDROTRACE</p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            Decision intelligence
          </p>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-3">
        <SectionLabel>Overview</SectionLabel>
        <NavButton
          item={{ id: 'overview', label: 'Overview', icon: LayoutDashboard }}
          active={currentView === 'overview'}
          onClick={() => go('overview')}
        />

        <SectionLabel>Scenario</SectionLabel>
        <NavButton
          item={{ id: 'scenario', label: 'Scenario Setup', icon: MapPinned }}
          active={currentView === 'scenario'}
          onClick={() => go('scenario')}
        />

        <SectionLabel>Analyze</SectionLabel>
        {ANALYZE.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={() => go(item.id)}
            trailing={
              item.id === 'simulation' && simStatus === 'COMPLETED' ? (
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
              ) : item.id === 'simulation' && simStatus === 'PROCESSING' ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-navy-500" />
              ) : null
            }
          />
        ))}

        <SectionLabel>Science</SectionLabel>
        {SCIENCE.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={() => go(item.id)}
          />
        ))}

        <div className="mt-auto border-t border-navy-100 pt-3">
          <button
            type="button"
            onClick={() => {
              if (tour.active) exitDemoTour()
              else startDemoTour()
              navigate(pathForView(useFloodStore.getState().currentView))
              onNavigate?.()
            }}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors',
              tour.active
                ? 'bg-cyan-50 text-cyan-700'
                : 'text-navy-700 hover:bg-surface hover:text-navy-950',
            )}
          >
            <Clapperboard className="h-4 w-4 shrink-0" />
            Demo Mode
          </button>
        </div>
      </nav>
    </div>
  )
}

function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <aside className="hidden h-full w-[220px] shrink-0 border-r border-navy-100 bg-white md:flex md:flex-col">
        <SidebarNav />
      </aside>

      <div className="flex h-14 items-center justify-between border-b border-navy-100 bg-white px-4 md:hidden">
        <Link to="/" className="text-[13px] font-semibold tracking-[0.12em] text-navy-950">
          HYDROTRACE
        </Link>
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-navy-800 hover:bg-surface"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[2000] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy-950/30"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-[220px] border-r border-navy-100 bg-white shadow-xl">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-muted hover:bg-surface"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  )
}

export { Sidebar }
