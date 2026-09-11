import { DEMO_DAM, getDamConfig } from '@/demo/demoDamConfig'
import type { FloodPolygon, Scenario, SimulationState } from '@/types/simulation'
import { hasExportableResults } from '@/utils/results'

function download(filename: string, mime: string, body: string) {
  const blob = new Blob([body], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const exportService = {
  canExport: (simulation: SimulationState) => hasExportableResults(simulation),
  exportGeoJson: (
    polygon: FloodPolygon | null,
    options?: { scenario?: Scenario | null; simulationId?: string | null },
  ) => {
    if (!polygon) throw new Error('No inundation polygon to export.')
    const dam = getDamConfig()
    const scenario = options?.scenario
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            dam_id: dam.id,
            dam_name: dam.name,
            scenario_id: options?.simulationId ?? null,
            event_type: scenario?.eventType ?? null,
            flood_depth: null,
            arrival_time: null,
            source_type: 'demonstration_flood_model',
            name: `${dam.name} demonstration inundation`,
            model: dam.modelName,
            note: dam.modelNote,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [polygon.lngLats],
          },
        },
      ],
    }
    download(
      `hydrotrace-${dam.id}-inundation.geojson`,
      'application/geo+json',
      JSON.stringify(geojson, null, 2),
    )
  },
  exportKml: (
    polygon: FloodPolygon | null,
    options?: { scenario?: Scenario | null },
  ) => {
    if (!polygon) throw new Error('No inundation polygon to export.')
    const dam = getDamConfig()
    const coords = polygon.lngLats.map(([lng, lat]) => `${lng},${lat},0`).join(' ')
    const event = options?.scenario?.eventType ?? 'scenario'
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>HYDROTRACE — ${dam.name} inundation</name>
    <description>Dam: ${dam.name}
Scenario: ${event}
Flood Extent: demonstration inundation polygon
Impact Layers: see companion GeoJSON / impact panel
Model: ${dam.modelName}
${dam.modelNote}</description>
    <Placemark>
      <name>Dam</name>
      <description>${dam.name} (${dam.id})</description>
      <Point><coordinates>${dam.location.lng},${dam.location.lat},0</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Flood Extent</name>
      <Style>
        <LineStyle><color>ffb09108</color><width>2</width></LineStyle>
        <PolyStyle><color>7fb09108</color></PolyStyle>
      </Style>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coords}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`
    download(
      `hydrotrace-${dam.id}-inundation.kml`,
      'application/vnd.google-earth.kml+xml',
      kml,
    )
  },
}

// Keep Proxy-backed DEMO_DAM available for any residual imports.
void DEMO_DAM
