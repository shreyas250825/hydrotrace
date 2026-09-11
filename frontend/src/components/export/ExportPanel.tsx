import { Button } from '@/components/ui/button'
import { exportService } from '@/services/exportService'
import { useFloodStore } from '@/store/useFloodStore'
import { FileDown, Globe } from 'lucide-react'

function ExportPanel({ compact = false }: { compact?: boolean }) {
  const simulation = useFloodStore((s) => s.simulation)
  const polygon = useFloodStore((s) => s.floodPolygon)
  const scenario = useFloodStore((s) => s.scenario)
  const lastSimulationId = useFloodStore((s) => s.lastSimulationId)
  const enabled = exportService.canExport(simulation) && Boolean(polygon)

  return (
    <section className={compact ? '' : 'rounded-xl border border-navy-100 bg-white p-4'}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">
        Export results
      </p>
      <div className="mt-3 grid gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!enabled}
          onClick={() =>
            exportService.exportKml(polygon, { scenario })
          }
        >
          <Globe className="h-4 w-4" />
          Export KML (.kml)
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!enabled}
          onClick={() =>
            exportService.exportGeoJson(polygon, {
              scenario,
              simulationId: lastSimulationId,
            })
          }
        >
          <FileDown className="h-4 w-4" />
          Export GeoJSON (.geojson)
        </Button>
        <Button type="button" variant="outline" disabled>
          SHP — Coming Soon
        </Button>
      </div>
      <p className="mt-2 text-xs text-navy-500">
        {enabled
          ? 'Exports include dam_id / dam_name. Shapefile (.shp) is not implemented yet.'
          : 'Complete a simulation to enable KML and GeoJSON export.'}
      </p>
    </section>
  )
}

export { ExportPanel }
