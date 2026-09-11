from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.dams.catalog import get_dam, list_dams, require_dam
from app.dams.providers import infrastructure_for
from app.models.schemas import SimulationRequest
from app.services.report import build_report
from app.services.store import save_result
from app.services.terrain import terrain_service
from app.services.terrain.derivatives import derivatives_for
from app.simulation.flood_model import run_flood_model

router = APIRouter(prefix="/dams", tags=["dams"])


@router.get("")
def dams_list():
    dams = []
    for item in list_dams():
        status = terrain_service.get_status(item["id"])
        dams.append(
            {
                **item,
                "terrain": {
                    "status": (
                        "available"
                        if status["terrain_type"] == "REAL"
                        else "demonstration"
                    ),
                    "source": status["source_name"],
                    "terrain_type": status["terrain_type"],
                    "source_type": status["source_type"],
                    "resolution": status["metadata"].get("resolution_meters"),
                    "coverage": status["metadata"].get("bounds"),
                },
            }
        )
    return {
        "product": "HYDROTRACE",
        "disclaimer": (
            "Initial HYDROTRACE case-study set based on historically documented dam-failure records. "
            "Inclusion does not imply current structural unsafety."
        ),
        "terrainCapability": terrain_service.capability(),
        "dams": dams,
    }


@router.get("/{dam_id}")
def dam_get(dam_id: str):
    dam = get_dam(dam_id)
    if not dam:
        raise HTTPException(404, f"Dam '{dam_id}' not found")
    status = terrain_service.get_status(dam_id)
    return {
        **dam,
        "terrain": {
            "status": "available" if status["terrain_type"] == "REAL" else "demonstration",
            "source": status["source_name"],
            "terrain_type": status["terrain_type"],
            "source_type": status["source_type"],
            "resolution": status["metadata"].get("resolution_meters"),
            "coverage": status["metadata"].get("bounds"),
            "message": status["message"],
        },
    }


@router.get("/{dam_id}/terrain")
def dam_terrain(
    dam_id: str,
    purpose: str = Query("analysis", pattern="^(analysis|viz|meta)$"),
    include_grid: bool = Query(True),
):
    try:
        require_dam(dam_id)
    except KeyError:
        raise HTTPException(404, f"Dam '{dam_id}' not found") from None
    if purpose == "meta":
        return terrain_service.get_status(dam_id)
    return terrain_service.get_api_payload(
        dam_id,
        purpose="viz" if purpose == "viz" else "analysis",
        include_grid=include_grid,
    )


@router.get("/{dam_id}/terrain/derivatives")
def dam_terrain_derivatives(dam_id: str):
    try:
        require_dam(dam_id)
    except KeyError:
        raise HTTPException(404, f"Dam '{dam_id}' not found") from None
    return derivatives_for(dam_id)


@router.get("/{dam_id}/terrain/status")
def dam_terrain_status(dam_id: str):
    try:
        require_dam(dam_id)
    except KeyError:
        raise HTTPException(404, f"Dam '{dam_id}' not found") from None
    return terrain_service.get_status(dam_id)


@router.post("/{dam_id}/terrain/upload")
async def dam_terrain_upload(dam_id: str, file: UploadFile = File(...)):
    try:
        require_dam(dam_id)
    except KeyError:
        raise HTTPException(404, f"Dam '{dam_id}' not found") from None
    if not terrain_service.rasterio_available():
        raise HTTPException(
            503,
            "Rasterio/GDAL unavailable. Cannot decode GeoTIFF. "
            "Real DEM unavailable for this case study. HYDROTRACE is using Demonstration Terrain.",
        )
    name = file.filename or "upload.tif"
    content = await file.read()
    try:
        package = terrain_service.ingest_geotiff_bytes(dam_id, content, name)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(503, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            400,
            f"Invalid or unsupported GeoTIFF: {exc}. "
            "HYDROTRACE will keep Demonstration Terrain for this dam.",
        ) from exc
    return {
        "ok": True,
        "dam_id": dam_id,
        "terrain_type": package.metadata.terrain_type,
        "status": package.metadata.status,
        "message": package.metadata.message,
        "metadata": package.metadata.to_dict(),
    }


@router.delete("/{dam_id}/terrain")
def dam_terrain_clear(dam_id: str):
    try:
        require_dam(dam_id)
    except KeyError:
        raise HTTPException(404, f"Dam '{dam_id}' not found") from None
    cleared = terrain_service.clear_real(dam_id)
    return {
        "ok": True,
        "cleared": cleared,
        "message": (
            "Uploaded DEM removed. HYDROTRACE is using Demonstration Terrain."
            if cleared
            else "No uploaded DEM was stored for this dam."
        ),
        "status": terrain_service.get_status(dam_id),
    }


@router.get("/{dam_id}/infrastructure")
def dam_infrastructure(dam_id: str):
    try:
        return infrastructure_for(dam_id)
    except KeyError:
        raise HTTPException(404, f"Dam '{dam_id}' not found") from None


@router.post("/{dam_id}/simulation/run")
def dam_simulation_run(dam_id: str, body: SimulationRequest):
    try:
        require_dam(dam_id)
    except KeyError:
        raise HTTPException(404, f"Dam '{dam_id}' not found") from None
    raw = run_flood_model(body.model_dump(), dam_id=dam_id)
    report = build_report(
        body.eventType,
        raw["metrics"],
        raw["infrastructure_impact"]["assets"],
        raw["infrastructure_impact"]["roads"],
        dam_id=dam_id,
    )
    payload = {**raw, "status": "COMPLETED", "report": report}
    sim_id = save_result(payload)
    payload["simulation_id"] = sim_id
    return payload
