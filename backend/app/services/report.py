from datetime import datetime, timezone

from app.dams.catalog import require_dam


def build_report(event_type: str, metrics: dict, assets: list, roads: list, dam_id: str = "bhakra") -> dict:
    dam = require_dam(dam_id)
    event = "catastrophic dam break" if event_type == "DAM_BREAK" else "controlled water release"
    names = [a["name"] for a in assets]
    road_names = [r["name"] for r in roads]
    high = [a for a in assets if a["priority"] == "HIGH"]
    medium = [a for a in assets if a["priority"] == "MEDIUM"]
    reservoir = dam.get("reservoirName") or dam["name"]
    corridor = dam.get("river") or dam.get("downstreamRegion") or dam["name"]
    town = dam.get("nearestTown") or dam.get("downstreamRegion") or dam["state"]
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "damId": dam_id,
        "damName": dam["name"],
        "modelNote": dam["modelNote"],
        "executiveSummary": (
            f"{dam['name']} ({reservoir}) was evaluated for a {event} using the "
            f"{dam['modelName']}. The demonstration fill inundated "
            f"{metrics['inundatedAreaKm2']:.2f} km² across {metrics['floodedCellCount']} terrain cells, "
            f"with a peak demonstration water level of {metrics['maxWaterDepthM']:.1f} m. "
            f"{len(assets)} mapped sites and {len(roads)} road segments intersect the inundation mask."
        ),
        "floodOverview": (
            f"Water is sourced at the dam axis and propagated downhill on the demonstration elevation grid "
            f"toward {town}. Arrival across the flooded set spans about "
            f"{max(1, round(metrics['estimatedArrivalMin']))} minutes of demonstration time. "
            f"Terrain source: {dam['terrainSource']}. {dam['modelNote']}"
        ),
        "infrastructureExposure": (
            "No demonstration sites intersect the inundation mask for this release."
            if not names
            else f"Exposed sites: {'; '.join(names)}."
            + (f" Road exposure: {'; '.join(road_names)}." if road_names else "")
        ),
        "priorityZones": [
            {
                "level": a["priority"],
                "name": a["name"],
                "detail": f"Demonstration depth {a['depthM']:.1f} m.",
            }
            for a in high + medium
        ],
        "recommendedActions": [
            (
                f"Treat {', '.join(a['name'] for a in high)} as first-wave warning points along the {corridor} corridor."
                if high
                else f"Monitor the immediate downstream channel toward {town}."
            ),
            (
                "Hold gated discharge narratives; this demonstration is an uncontrolled breach with a wide valley fill."
                if event_type == "DAM_BREAK"
                else "This demonstration is a gated/spillway release with a channel-constrained fill."
            ),
            "Do not treat these depths or arrival times as a calibrated hydrodynamic forecast.",
            "Use the geospatial flood polygon and KML export for briefing overlays only.",
        ],
    }
