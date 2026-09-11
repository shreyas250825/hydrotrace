import { AppLayout } from '@/components/layout/AppLayout'
import { pathForView, viewFromPath } from '@/navigation/routes'
import { ImpactAnalysis } from '@/pages/ImpactAnalysis'
import { IntelligenceReport } from '@/pages/IntelligenceReport'
import { Landing } from '@/pages/Landing'
import { Methodology } from '@/pages/Methodology'
import { Overview } from '@/pages/Overview'
import { ScenarioSetup } from '@/pages/ScenarioSetup'
import { Simulation } from '@/pages/Simulation'
import { useFloodStore } from '@/store/useFloodStore'
import type { AppView } from '@/types/simulation'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

const CommandCenter = lazy(() =>
  import('@/pages/CommandCenter').then((module) => ({
    default: module.CommandCenter,
  })),
)
const GeospatialViewer = lazy(() =>
  import('@/pages/GeospatialViewer').then((module) => ({
    default: module.GeospatialViewer,
  })),
)
const ScenarioComparison = lazy(() =>
  import('@/pages/ScenarioComparison').then((module) => ({
    default: module.ScenarioComparison,
  })),
)

function PageFallback({ label }: { label: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-surface">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-navy-500">
        Loading {label}…
      </p>
    </div>
  )
}

function WorkspaceRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const currentView = useFloodStore((s) => s.currentView)
  const setCurrentView = useFloodStore((s) => s.setCurrentView)

  // URL → store
  useEffect(() => {
    const fromUrl = viewFromPath(location.pathname)
    if (fromUrl && fromUrl !== useFloodStore.getState().currentView) {
      setCurrentView(fromUrl)
    }
  }, [location.pathname, setCurrentView])

  // store → URL (demo tour / internal navigation)
  useEffect(() => {
    if (!location.pathname.startsWith('/app')) return
    const desired = pathForView(currentView)
    if (location.pathname !== desired) {
      navigate(desired, { replace: true })
    }
  }, [currentView, location.pathname, navigate])

  return (
    <AppLayout>
      {currentView === 'overview' && <Overview />}
      {currentView === 'scenario' && <ScenarioSetup />}
      {currentView === 'geospatial' && (
        <Suspense fallback={<PageFallback label="geospatial viewer" />}>
          <GeospatialViewer />
        </Suspense>
      )}
      {currentView === 'command' && (
        <Suspense fallback={<PageFallback label="3D command center" />}>
          <CommandCenter />
        </Suspense>
      )}
      {currentView === 'simulation' && <Simulation />}
      {currentView === 'comparison' && (
        <Suspense fallback={<PageFallback label="scenario comparison" />}>
          <ScenarioComparison />
        </Suspense>
      )}
      {currentView === 'impact' && <ImpactAnalysis />}
      {currentView === 'methodology' && <Methodology />}
      {currentView === 'intelligence' && <IntelligenceReport />}
    </AppLayout>
  )
}

/** Hook-friendly navigation used by pages that still call setCurrentView */
function useAppNavigate() {
  const navigate = useNavigate()
  const setCurrentView = useFloodStore((s) => s.setCurrentView)
  return (view: AppView) => {
    setCurrentView(view)
    navigate(pathForView(view))
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<WorkspaceRoutes />} />
        <Route path="/app/:view" element={<WorkspaceRoutes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
export { useAppNavigate }
