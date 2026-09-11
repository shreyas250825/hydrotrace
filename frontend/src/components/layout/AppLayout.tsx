import { DamChrome } from '@/components/dams/DamChrome'
import { DemoCoach } from '@/components/demo/DemoCoach'
import { Sidebar } from '@/components/layout/Sidebar'
import { useFloodStore } from '@/store/useFloodStore'
import type { ReactNode } from 'react'

function AppLayout({ children }: { children: ReactNode }) {
  const immersive = useFloodStore((s) => s.immersiveMode)
  const workspaceFullscreen = useFloodStore((s) => s.workspaceFullscreen)
  const currentView = useFloodStore((s) => s.currentView)
  const hideChrome =
    workspaceFullscreen || (immersive && currentView === 'command')

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-surface md:flex-row">
      {hideChrome ? null : <Sidebar />}
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {hideChrome ? null : <DamChrome />}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        {hideChrome ? null : <DemoCoach />}
      </main>
    </div>
  )
}

export { AppLayout }
