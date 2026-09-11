import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import shadow from 'leaflet/dist/images/marker-shadow.png'

/**
 * Vite does not resolve Leaflet's default icon URLs. Apply once at startup.
 */
export function applyLeafletDefaultIconFix() {
  const proto = L.Icon.Default.prototype as unknown as {
    _getIconUrl?: unknown
  }
  delete proto._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetina,
    iconUrl: icon,
    shadowUrl: shadow,
  })
}

export function createDamIcon() {
  return L.divIcon({
    className: 'dam-marker',
    html: '<div class="dam-marker-wrap"><div class="dam-marker-pin"></div><div class="dam-marker-core"></div></div>',
    iconSize: [32, 42],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  })
}
