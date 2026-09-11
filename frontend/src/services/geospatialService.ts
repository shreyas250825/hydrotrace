import type { DataSourceKind, DataSourceMeta } from '@/types/simulation'

/**
 * File bytes stay in this module-level registry.
 * Zustand only stores DataSourceMeta (name, size, kind).
 */
const fileRegistry = new Map<string, File>()

function nextId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `ds-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function extensionOf(name: string): string {
  const parts = name.split('.')
  return parts.length > 1 ? (parts.at(-1) ?? '').toLowerCase() : ''
}

export const geospatialService = {
  registerFile: (file: File, kind: DataSourceKind): DataSourceMeta => {
    const id = nextId()
    fileRegistry.set(id, file)
    return {
      id,
      kind,
      name: file.name,
      format: extensionOf(file.name) || file.type || 'unknown',
      sizeBytes: file.size,
      registeredAt: new Date().toISOString(),
    }
  },
  getFile: (id: string) => fileRegistry.get(id),
  release: (id: string) => {
    fileRegistry.delete(id)
  },
  supportedFormats: (kind: DataSourceKind): string[] => {
    switch (kind) {
      case 'dem':
        return ['.tif', '.tiff', '.asc', '.img', '.dem']
      case 'hydro':
        return ['.csv', '.json', '.nc', '.txt']
      case 'satellite':
        return ['.tif', '.tiff', '.jp2']
      case 'geojson':
        return ['.geojson', '.json']
      default:
        return []
    }
  },
}
