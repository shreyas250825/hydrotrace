import { Button } from '@/components/ui/button'
import { DEMO_TOUR_STEPS } from '@/demo/demoScenarios'
import { useFloodStore } from '@/store/useFloodStore'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

function DemoCoach() {
  const tour = useFloodStore((s) => s.demoTour)
  const nextDemoStep = useFloodStore((s) => s.nextDemoStep)
  const prevDemoStep = useFloodStore((s) => s.prevDemoStep)
  const exitDemoTour = useFloodStore((s) => s.exitDemoTour)

  if (!tour.active) return null

  const step = DEMO_TOUR_STEPS[tour.step]
  const last = tour.step === DEMO_TOUR_STEPS.length - 1

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[80] p-4 md:pl-[236px]">
      <div className="pointer-events-auto mx-auto max-w-2xl rounded-2xl border border-cyan-400/30 bg-navy-950/94 p-4 text-white shadow-2xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Demo mode · {tour.step + 1} / {DEMO_TOUR_STEPS.length}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-navy-100">{step.body}</p>
          </div>
          <button
            type="button"
            aria-label="Exit demo"
            onClick={exitDemoTour}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="bg-cyan-400"
            style={{ width: `${((tour.step + 1) / DEMO_TOUR_STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10"
            disabled={tour.step === 0}
            onClick={prevDemoStep}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-white/70 hover:bg-white/10"
            onClick={exitDemoTour}
          >
            Exit demo
          </Button>
          <Button type="button" size="sm" variant="accent" onClick={last ? exitDemoTour : nextDemoStep}>
            {last ? 'Finish' : 'Next step'}
            {last ? null : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export { DemoCoach }
