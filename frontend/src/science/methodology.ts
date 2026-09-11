/**
 * Scientific methodology copy for HYDROTRACE demo.
 * Distinguishes REFERENCE equations from the implemented demonstration algorithm.
 */

export const MODEL_NAME = 'Terrain-Aware Flood Propagation'

export const MODEL_TAGLINE = 'From Terrain to Flood Intelligence'

export const PIPELINE_STEPS = [
  'Dam scenario',
  'Terrain / DEM',
  'Hydraulic derivation',
  'Flood propagation',
  'Inundation products',
  'Impact analysis',
] as const

export const GOVERNING_EQUATIONS = {
  continuity: {
    latex: '∂h/∂t + ∇·(h u) = 0',
    label: 'Continuity equation',
    kind: 'FOUNDATION' as const,
    note: 'Mass conservation / water-balance foundation for full shallow-water modelling. The current prototype uses terrain-aware propagation rather than numerically solving this PDE.',
  },
  momentum: {
    latex: '∂(hu)/∂t + ∇·(huu) = −gh∇z_b − gh∇h + source/friction terms',
    label: 'Momentum equations',
    kind: 'FOUNDATION' as const,
    note: 'Reference shallow-water momentum form for a full hydrodynamic solver.',
  },
}

export const BREACH_HYDRAULICS = {
  orificeForm: {
    latex: 'Q = C_d A √(2gH)',
    kind: 'DERIVED' as const,
    label: 'Estimated Initial Breach Discharge',
    note: 'Derived from scenario assumptions (breach geometry, hydraulic head, discharge coefficient). Not a hydrodynamic simulation discharge.',
  },
}

export const DEMONSTRATION_ALGORITHM = [
  {
    step: 1,
    title: 'Terrain elevation',
    detail: 'Load normalized TerrainGrid (REAL GeoTIFF or Demonstration Terrain) for the selected dam.',
  },
  {
    step: 2,
    title: 'Breach / release source',
    detail: 'Seed water near the dam axis using reservoir level and breach geometry parameters.',
  },
  {
    step: 3,
    title: 'Downstream propagation',
    detail: 'Deterministic downhill fill preferring lower neighbours within a channel envelope.',
  },
  {
    step: 4,
    title: 'Water-level threshold',
    detail: 'A cell inundates when proposed surface elevation exceeds terrain + tolerance.',
  },
  {
    step: 5,
    title: 'Depth estimation',
    detail: 'Depth = water surface − terrain elevation (scaled to metres via dam depth scale).',
  },
  {
    step: 6,
    title: 'Arrival-time estimation',
    detail: 'Arrival step index converted to minutes using scenario duration / max arrival steps.',
  },
] as const

export const MODEL_PIPELINE = [
  {
    id: 'terrain',
    title: 'Terrain',
    input: 'DEM raster (GeoTIFF) or procedural demonstration grid',
    method: 'Raster preprocessing + normalization into TerrainGrid',
    output: 'Elevation grid bound to selectedDamId',
    kind: 'REAL or DEMONSTRATION' as const,
  },
  {
    id: 'hydraulics',
    title: 'Hydraulic derivation',
    input: 'Breach width/depth, hydraulic head, Cd',
    method: 'Q = Cd A √(2gH) — estimated initial breach discharge',
    output: 'Derived Q (m³/s) shown in Scenario Setup',
    kind: 'DERIVED' as const,
  },
  {
    id: 'flood',
    title: 'Flood',
    input: 'TerrainGrid + scenario parameters',
    method: 'Terrain-aware downhill propagation',
    output: 'Flood extent + depth + arrival time',
    kind: 'MODELLED' as const,
  },
  {
    id: 'impact',
    title: 'Impact',
    input: 'Flood cells + infrastructure fixtures',
    method: 'Intersection of inundation mask with sites/roads',
    output: 'Potentially affected features',
    kind: 'MODELLED' as const,
  },
  {
    id: 'eo',
    title: 'Earth observation',
    input: 'Optional Google Earth Engine',
    method: 'EarthObservationService adapter',
    output: 'Integration ready — optional provider',
    kind: 'OPTIONAL' as const,
  },
] as const
