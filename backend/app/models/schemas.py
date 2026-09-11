from typing import Literal, Optional

from pydantic import BaseModel, Field

EventType = Literal["CONTROLLED_RELEASE", "DAM_BREAK"]
Priority = Literal["HIGH", "MEDIUM", "LOW"]


class GeoLocation(BaseModel):
    lat: float
    lng: float
    label: str


class DamParameters(BaseModel):
    heightMeters: float
    reservoirVolumeMcm: float
    currentWaterLevelPercent: float


class BreachParameters(BaseModel):
    widthMeters: float
    depthMeters: float
    formationTimeMinutes: float


class SimulationSettings(BaseModel):
    durationHours: float
    gridResolutionMeters: float


class SimulationRequest(BaseModel):
    eventType: EventType = "DAM_BREAK"
    damParameters: DamParameters
    breachParameters: BreachParameters
    simulationSettings: SimulationSettings
    location: Optional[GeoLocation] = None
    damId: Optional[str] = Field(default="bhakra")


class FloodCell(BaseModel):
    col: int
    row: int
    x: float
    z: float
    depthScene: float
    depthM: float
    arrival: int


class ExposedAsset(BaseModel):
    id: str
    name: str
    category: str
    lat: float
    lng: float
    depthM: float
    arrival: int
    priority: Priority


class ExposedRoad(BaseModel):
    id: str
    name: str
    exposedShare: float
    priority: Priority


class FloodPolygon(BaseModel):
    latLngs: list[list[float]]
    lngLats: list[list[float]]


class AnimationFrame(BaseModel):
    t: float
    cellCount: int
    maxDepthM: float


class Metrics(BaseModel):
    inundatedAreaKm2: float
    floodedCellCount: int
    totalCells: int
    maxWaterDepthM: float
    estimatedArrivalMin: float
    peakFlowScaleMs: float
    modelName: str
    modelNote: str


class PriorityZone(BaseModel):
    level: Priority
    name: str
    detail: str


class ReportData(BaseModel):
    generatedAt: str
    modelNote: str
    executiveSummary: str
    floodOverview: str
    infrastructureExposure: str
    priorityZones: list[PriorityZone]
    recommendedActions: list[str]


class SimulationResult(BaseModel):
    simulation_id: str
    status: Literal["COMPLETED"]
    eventType: EventType
    metrics: Metrics
    flood_cells: list[FloodCell]
    flood_extent: Optional[FloodPolygon]
    animation_frames: list[AnimationFrame]
    infrastructure_impact: dict
    report: ReportData
