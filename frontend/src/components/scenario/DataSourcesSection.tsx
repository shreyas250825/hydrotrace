import { Button } from '@/components/ui/button'
import { geospatialService } from '@/services/geospatialService'
import { useFloodStore } from '@/store/useFloodStore'
import type { DataSourceKind } from '@/types/simulation'
import { formatBytes } from '@/utils/format'
import { ChevronDown, FileUp, Satellite, Waves } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'

function DataSourcesSection() {
  const [open, setOpen] = useState(true)
  const [demBusy, setDemBusy] = useState(false)
  const [demMessage, setDemMessage] = useState<string | null>(null)
  const sources = useFloodStore((s) => s.scenario.dataSources)
  const registerDataSource = useFloodStore((s) => s.registerDataSource)
  const removeDataSource = useFloodStore((s) => s.removeDataSource)
  const selectedDam = useFloodStore((s) => s.selectedDam)
  const terrainType = useFloodStore((s) => s.terrainType)
  const terrainSource = useFloodStore((s) => s.terrainSource)
  const uploadDemForSelectedDam = useFloodStore((s) => s.uploadDemForSelectedDam)
  const clearUploadedDem = useFloodStore((s) => s.clearUploadedDem)

  const demRef = useRef<HTMLInputElement>(null)
  const hydroRef = useRef<HTMLInputElement>(null)
  const satRef = useRef<HTMLInputElement>(null)

  const onFile = (kind: DataSourceKind) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const meta = geospatialService.registerFile(file, kind)
    registerDataSource(meta)
  }

  const onDemUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setDemBusy(true)
    setDemMessage(null)
    try {
      // Keep local metadata record for the scenario panel
      registerDataSource(geospatialService.registerFile(file, 'dem'))
      await uploadDemForSelectedDam(file)
      setDemMessage(`Real DEM decoded for ${selectedDam.name}.`)
    } catch (error) {
      setDemMessage(
        error instanceof Error
          ? error.message
          : 'DEM upload failed. Demonstration Terrain remains active.',
      )
    } finally {
      setDemBusy(false)
    }
  }

  const byKind = (kind: DataSourceKind) =>
    sources.filter((item) => item.kind === kind)

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-navy-500">
          Data sources
        </p>
        <ChevronDown
          className={`h-4 w-4 text-navy-500 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>
      {open ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-navy-100 bg-navy-50/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-navy-900">DEM (GeoTIFF)</p>
                <p className="mt-0.5 text-xs text-navy-500">
                  Uploads are decoded on the backend and bound to{' '}
                  <span className="font-medium text-navy-800">{selectedDam.name}</span> only.
                  Supported: .tif / .tiff. Not SRTM/GEE unless that file is what you upload.
                </p>
                <p className="mt-2 text-[11px] text-navy-600">
                  Active terrain:{' '}
                  <span className="font-semibold">
                    {terrainType === 'REAL' ? 'REAL DEM' : 'DEMONSTRATION TERRAIN'}
                  </span>
                  {' — '}
                  {terrainSource}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={demBusy}
                  onClick={() => demRef.current?.click()}
                >
                  <FileUp className="h-3.5 w-3.5" />
                  {demBusy ? 'Processing…' : 'Upload DEM'}
                </Button>
                {terrainType === 'REAL' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void clearUploadedDem().then(() =>
                        setDemMessage(
                          'Uploaded DEM removed. HYDROTRACE is using Demonstration Terrain.',
                        ),
                      )
                    }}
                  >
                    Clear DEM
                  </Button>
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-navy-400">
              .tif  .tiff
            </p>
            {byKind('dem').length === 0 ? (
              <p className="mt-2 text-xs text-navy-500">No DEM uploaded for this dam</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {byKind('dem').map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs text-navy-800"
                  >
                    <span className="min-w-0 truncate">
                      {item.name}{' '}
                      <span className="text-navy-400">
                        ({formatBytes(item.sizeBytes)})
                      </span>
                    </span>
                    <button
                      type="button"
                      className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-danger"
                      onClick={() => {
                        geospatialService.release(item.id)
                        removeDataSource(item.id)
                      }}
                    >
                      Remove meta
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {demMessage ? (
              <p className="mt-2 text-[11px] leading-relaxed text-navy-700">{demMessage}</p>
            ) : null}
          </div>
          <input
            ref={demRef}
            type="file"
            accept=".tif,.tiff"
            className="hidden"
            onChange={(e) => {
              void onDemUpload(e)
            }}
          />

          <SourceCard
            title="Hydrological data"
            hint="Discharge, stage or reservoir time series (metadata only in this phase)."
            formats={geospatialService.supportedFormats('hydro')}
            items={byKind('hydro')}
            empty="No hydrological dataset loaded"
            onUpload={() => hydroRef.current?.click()}
            onRemove={removeDataSource}
            icon={Waves}
          />
          <input
            ref={hydroRef}
            type="file"
            accept=".csv,.json,.nc,.txt"
            className="hidden"
            onChange={onFile('hydro')}
          />

          <SourceCard
            title="Earth observation"
            hint="Optional Google Earth Engine integration when configured."
            formats={[...geospatialService.supportedFormats('satellite'), '.geojson']}
            items={[...byKind('satellite'), ...byKind('geojson')]}
            empty="No satellite or GeoJSON layer loaded"
            onUpload={() => satRef.current?.click()}
            onRemove={removeDataSource}
            icon={Satellite}
            extra={
              <div className="mt-2 rounded-lg border border-navy-100 bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500">
                  Google Earth Engine
                </p>
                <p className="mt-1 text-xs text-navy-600">
                  Integration ready — optional provider. Primary basemap remains OpenStreetMap /
                  Esri.
                </p>
              </div>
            }
          />
          <input
            ref={satRef}
            type="file"
            accept=".tif,.tiff,.jp2,.geojson,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              const kind = file.name.toLowerCase().endsWith('.geojson')
                ? 'geojson'
                : 'satellite'
              registerDataSource(geospatialService.registerFile(file, kind))
            }}
          />
        </div>
      ) : null}
    </section>
  )
}

function SourceCard({
  title,
  hint,
  formats,
  items,
  empty,
  onUpload,
  onRemove,
  extra,
  icon: Icon = FileUp,
}: {
  title: string
  hint: string
  formats: string[]
  items: { id: string; name: string; sizeBytes: number; format: string }[]
  empty: string
  onUpload: () => void
  onRemove: (id: string) => void
  extra?: ReactNode
  icon?: typeof FileUp
}) {
  return (
    <div className="rounded-xl border border-navy-100 bg-navy-50/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-navy-900">{title}</p>
          <p className="mt-0.5 text-xs text-navy-500">{hint}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onUpload}>
          <Icon className="h-3.5 w-3.5" />
          Upload
        </Button>
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-navy-400">
        {formats.join('  ')}
      </p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-navy-500">{empty}</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-xs text-navy-800"
            >
              <span className="min-w-0 truncate">
                {item.name}{' '}
                <span className="text-navy-400">
                  ({formatBytes(item.sizeBytes)})
                </span>
              </span>
              <button
                type="button"
                className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-danger"
                onClick={() => {
                  geospatialService.release(item.id)
                  onRemove(item.id)
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {extra}
    </div>
  )
}

export { DataSourcesSection }
