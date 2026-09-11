import { MAP_CONFIG, SATELLITE_MAP_CONFIG } from '@/config/defaults'
import { cn } from '@/lib/utils'
import type { GeoLocation, MapBasemap } from '@/types/simulation'
import { formatCoordinate } from '@/utils/format'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'

import { createDamIcon } from '@/components/map/leafletFix'

interface FloodMapProps {
  marker: GeoLocation | null
  onLocationSelect?: (lat: number, lng: number) => void
  interactive?: boolean
  showPlaceholderArea?: boolean
  environmentLabel?: string
  environmentDetail?: string
  className?: string
  fitRequestId?: number
  basemap?: MapBasemap
  compactHud?: boolean
  overlay?: ReactNode
  mapKey?: string
  onResetView?: () => void
  /** Bump after panel / fullscreen changes so Leaflet invalidateSize runs */
  resizeToken?: number
}

function MapInvalidator({ resizeToken = 0 }: { resizeToken?: number }) {
  const map = useMap()

  useEffect(() => {
    const invalidate = () => {
      try {
        map.invalidateSize({ animate: false })
      } catch {
        /* map may be disposed */
      }
    }
    invalidate()
    const frame = window.requestAnimationFrame(invalidate)
    const t1 = window.setTimeout(invalidate, 80)
    const t2 = window.setTimeout(invalidate, 250)
    const onResize = () => invalidate()
    window.addEventListener('resize', onResize)

    const container = map.getContainer()
    const parent = container.parentElement
    let ro: ResizeObserver | null = null
    if (parent && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => invalidate())
      ro.observe(parent)
      ro.observe(container)
    }

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', onResize)
      ro?.disconnect()
    }
  }, [map, resizeToken])

  return null
}

function ClickHandler({
  enabled,
  onLocationSelect,
}: {
  enabled: boolean
  onLocationSelect?: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(event) {
      if (!enabled || !onLocationSelect) return
      onLocationSelect(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function Recenter({
  marker,
  fitRequestId,
}: {
  marker: GeoLocation | null
  fitRequestId?: number
}) {
  const map = useMap()
  const markerRef = useRef(marker)
  markerRef.current = marker

  useEffect(() => {
    const current = markerRef.current
    if (!current || !fitRequestId) return
    map.flyTo([current.lat, current.lng], Math.max(map.getZoom(), 11), {
      duration: 0.7,
    })
  }, [fitRequestId, map])

  return null
}

function FloodMap({
  marker,
  onLocationSelect,
  interactive = true,
  showPlaceholderArea = false,
  environmentLabel,
  environmentDetail,
  className,
  fitRequestId,
  basemap = 'osm',
  compactHud = false,
  overlay,
  mapKey,
  onResetView,
  resizeToken = 0,
}: FloodMapProps) {
  const damIcon = useMemo(() => createDamIcon(), [])
  const center = marker
    ? ([marker.lat, marker.lng] as [number, number])
    : ([MAP_CONFIG.defaultCenter.lat, MAP_CONFIG.defaultCenter.lng] as [
        number,
        number,
      ])

  return (
    <div
      className={cn(
        'relative h-full min-h-0 w-full overflow-hidden bg-navy-50',
        className,
      )}
    >
      <MapContainer
        key={mapKey ?? `${center[0].toFixed(4)},${center[1].toFixed(4)}`}
        center={center}
        zoom={MAP_CONFIG.defaultZoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        scrollWheelZoom
        className="absolute inset-0 z-0 h-full w-full"
      >
        <TileLayer
          key={basemap}
          attribution={
            basemap === 'satellite'
              ? SATELLITE_MAP_CONFIG.attribution
              : MAP_CONFIG.attribution
          }
          url={
            basemap === 'satellite'
              ? SATELLITE_MAP_CONFIG.tileUrl
              : MAP_CONFIG.tileUrl
          }
        />
        <MapInvalidator resizeToken={resizeToken} />
        <ClickHandler
          enabled={interactive}
          onLocationSelect={onLocationSelect}
        />
        <Recenter marker={marker} fitRequestId={fitRequestId} />
        {marker ? (
          <Marker position={[marker.lat, marker.lng]} icon={damIcon} />
        ) : null}
        {marker && showPlaceholderArea ? (
          <Circle
            center={[marker.lat, marker.lng]}
            radius={6000}
            pathOptions={{
              color: '#0891b2',
              weight: 2,
              dashArray: '9 8',
              fillColor: '#22d3ee',
              fillOpacity: 0.06,
            }}
          />
        ) : null}
        {overlay}
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 z-[500] max-w-[min(100%-2rem,20rem)] space-y-2">
        {environmentLabel ? (
          <div className="border border-navy-100/80 bg-white/92 px-3 py-2 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              {environmentLabel}
            </p>
            <p className="mt-0.5 text-xs text-navy-700">
              {environmentDetail ??
                (compactHud
                  ? null
                  : 'Public map context for the selected dam.')}
            </p>
          </div>
        ) : null}
        {onResetView ? (
          <button
            type="button"
            onClick={onResetView}
            className="pointer-events-auto rounded-lg border border-navy-200 bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-800 shadow-sm hover:bg-white"
          >
            Reset view
          </button>
        ) : null}
      </div>

      <div className="absolute bottom-4 left-4 z-[500] rounded-xl border border-navy-100 bg-white/92 px-3 py-2 font-mono text-[11px] text-navy-800 shadow-sm backdrop-blur-sm">
        {marker ? (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-500">
              Dam / breach marker
            </p>
            <p className="mt-1">
              {formatCoordinate(marker.lat)}° N, {formatCoordinate(marker.lng)}°
              E
            </p>
          </div>
        ) : (
          <p className="text-navy-600">Click the map to place a dam marker</p>
        )}
      </div>
    </div>
  )
}

export { FloodMap }
