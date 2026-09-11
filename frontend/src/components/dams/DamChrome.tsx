import { DamSearch } from '@/components/dams/DamSearch'
import { DamSelector } from '@/components/dams/DamSelector'
import { Button } from '@/components/ui/button'
import { useFloodStore } from '@/store/useFloodStore'
import { CircleHelp, Maximize2 } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function DamChrome() {
  const loadDamCatalog = useFloodStore((s) => s.loadDamCatalog)
  const requestViewFullscreen = useFloodStore((s) => s.requestViewFullscreen)
  const navigate = useNavigate()

  useEffect(() => {
    void loadDamCatalog()
  }, [loadDamCatalog])

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-navy-100 bg-white px-4 sm:px-5">
      <Link to="/" className="hidden shrink-0 sm:block">
        <span className="text-[13px] font-semibold tracking-[0.14em] text-navy-900">
          HYDROTRACE
        </span>
      </Link>

      <div className="min-w-0 flex-1 md:mx-auto md:max-w-sm">
        <DamSelector compact />
      </div>

      <div className="hidden min-w-[10rem] max-w-xs flex-1 md:block">
        <DamSearch />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Methodology help"
          title="Methodology"
          onClick={() => navigate('/app/methodology')}
        >
          <CircleHelp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => requestViewFullscreen()}
          aria-label="Fullscreen visualization"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Fullscreen</span>
        </Button>
      </div>
    </header>
  )
}

export { DamChrome }
