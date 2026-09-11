export type TerrainType = 'REAL' | 'DEMONSTRATION' | 'UNAVAILABLE'

export interface TerrainBounds {
  west: number
  south: number
  east: number
  north: number
}

export interface TerrainMetadata {
  dam_id: string
  source_type: string
  source_name: string
  terrain_type: TerrainType
  status: string
  resolution_meters: number | null
  crs: string | null
  bounds: TerrainBounds | null
  width: number | null
  height: number | null
  min_elevation: number | null
  max_elevation: number | null
  nodata_value: number | null
  generated_at: string
  analysis_width: number | null
  analysis_height: number | null
  viz_width: number | null
  viz_height: number | null
  message: string | null
  original_filename: string | null
}

export interface TerrainApiResponse {
  dam_id: string
  damId?: string
  terrain_type: TerrainType
  source_type: string
  status: string
  metadata: TerrainMetadata
  cols: number
  rows: number
  heights: number[] | null
  width?: number
  depth?: number
  terrainSource: string
  terrainProvider: string
  label: string
  grid?: {
    width: number
    height: number
    elevations: number[]
    unit: string
    scene_width: number | null
    scene_depth: number | null
  } | null
}

export interface TerrainStatusResponse {
  dam_id: string
  terrain_type: TerrainType
  source_type: string
  status: string
  source_name: string
  message: string | null
  metadata: TerrainMetadata
  has_real_dem: boolean
}
