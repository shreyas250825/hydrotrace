from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.dams.catalog import MODEL_NAME, get_dam
from app.dams.providers import infrastructure_for
from app.geospatial.export import to_geojson, to_kml
from app.models.schemas import SimulationRequest
from app.services.report import build_report
from app.services.store import get_result, save_result
from app.services.terrain import terrain_service
from app.simulation.flood_model import run_flood_model

router = APIRouter()


@router.get("/health")
def health():
    cap = terrain_service.capability()
    return {
        "ok": True,
        "product": "HYDROTRACE",
        "problemStatement": "PS 26161",
        "model": MODEL_NAME,
        "terrain": {
            "demIngestion": cap["demIngestion"],
            "supportedFormats": cap["supportedFormats"],
        },
    }


@router.get("/terrain/capability")
def terrain_capability():
    return terrain_service.capability()


@router.get("/demo/dam")
def demo_dam():
    """Backward-compatible Bhakra demo endpoint."""
    return get_dam("bhakra")


@router.get("/demo/terrain")
def demo_terrain():
    return terrain_service.get_api_payload("bhakra", purpose="analysis", include_grid=True)


@router.get("/demo/infrastructure")
def demo_infrastructure():
    return infrastructure_for("bhakra")


@router.post("/simulation/run")
def simulation_run(body: SimulationRequest):
    """Backward-compatible simulation endpoint (defaults to Bhakra)."""
    dam_id = body.damId or "bhakra"
    if not get_dam(dam_id):
        raise HTTPException(404, f"Dam '{dam_id}' not found")
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


@router.get("/simulation/{simulation_id}")
def simulation_get(simulation_id: str):
    result = get_result(simulation_id)
    if not result:
        raise HTTPException(404, "Simulation not found")
    return {
        "simulation_id": simulation_id,
        "status": result["status"],
        "damId": result.get("damId"),
        "metrics": result["metrics"],
    }


@router.get("/simulation/{simulation_id}/results")
def simulation_results(simulation_id: str):
    result = _need(simulation_id)
    return {**result, "simulation_id": simulation_id}


@router.get("/simulation/{simulation_id}/geojson")
def simulation_geojson(simulation_id: str):
    result = _need(simulation_id)
    result = {**result, "simulation_id": simulation_id}
    return to_geojson(result)


@router.get("/impact/{simulation_id}")
def impact(simulation_id: str):
    result = _need(simulation_id)
    return result["infrastructure_impact"]


@router.get("/report/{simulation_id}")
def report(simulation_id: str):
    result = _need(simulation_id)
    return result["report"]


@router.get("/export/{simulation_id}/kml")
def export_kml(simulation_id: str):
    result = _need(simulation_id)
    result = {**result, "simulation_id": simulation_id}
    kml = to_kml(result)
    return Response(content=kml, media_type="application/vnd.google-earth.kml+xml")


def _need(simulation_id: str) -> dict:
    result = get_result(simulation_id)
    if not result:
        raise HTTPException(404, "Simulation not found")
    return result
