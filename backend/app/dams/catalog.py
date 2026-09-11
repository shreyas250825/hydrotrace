"""HYDROTRACE dam catalog — single source of dam metadata.

Coordinates marked with coordinateNote are public map-framing locations,
not survey-grade dam axes. Incident fields come from cited CWC documents.
Do not invent unverified structural or breach parameters.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any

MODEL_NAME = "Terrain-Aware Demonstration Flood Model"
MODEL_NOTE = (
    "A simplified deterministic fill that prefers downhill neighbours on a bundled "
    "elevation grid. It is not a calibrated hydrodynamic solver."
)

CWC_DS_PROCEDURES = (
    "https://cwc.gov.in/sites/default/files/Report%20on%20DS%20Procedures.pdf"
)
CWC_NCDS_39 = (
    "https://cwc.gov.in/sites/default/files/NCDSMOM39thMeeting.pdf"
)

SCENE = {"x": 0.0, "z": -8.0, "crestY": 13.1, "reservoirY": 8.2}
TERRAIN_WIDTH = 120.0
TERRAIN_DEPTH = 160.0

DEFAULT_SCENARIO = {
    "eventType": "DAM_BREAK",
    "damParameters": {
        "heightMeters": 40,
        "reservoirVolumeMcm": 100,
        "currentWaterLevelPercent": 80,
    },
    "breachParameters": {
        "widthMeters": 80,
        "depthMeters": 20,
        "formationTimeMinutes": 30,
    },
    "simulationSettings": {
        "durationHours": 6,
        "gridResolutionMeters": 80,
    },
    "defaultsLabel": "Demonstration Scenario Defaults",
    "defaultsNote": (
        "Historical breach geometry is not available for this case study. "
        "These values are demonstration defaults for the Terrain-Aware Demonstration Flood Model "
        "and must not be treated as historical facts."
    ),
}


def _scenario(**overrides: Any) -> dict:
    base = deepcopy(DEFAULT_SCENARIO)
    for key, value in overrides.items():
        if isinstance(value, dict) and key in base and isinstance(base[key], dict):
            base[key] = {**base[key], **value}
        else:
            base[key] = value
    return base


def _dam(**fields: Any) -> dict:
    dam = {
        "officialName": None,
        "district": None,
        "river": None,
        "basin": None,
        "completionYear": None,
        "damType": None,
        "heightMetersVerified": None,
        "reservoirName": None,
        "historicalIncidentYear": None,
        "incidentType": None,
        "incidentDescription": None,
        "incidentSource": None,
        "officialSourceUrl": None,
        "terrainSource": "Demonstration Terrain",
        "terrainProvider": "procedural_demo",
        "dataAvailability": "partial",
        "demoStatus": "demonstration_fixture",
        "downstreamRegion": None,
        "nearestTown": None,
        "downstreamBearingDeg": 180,
        "metersPerSceneUnit": 72,
        "depthMetersPerSceneUnit": 3.2,
        "grid": {"cols": 72, "rows": 96},
        "coordinateNote": None,
        "modelName": MODEL_NAME,
        "modelNote": MODEL_NOTE,
        "scenarioDefaults": _scenario(),
    }
    dam.update(fields)
    return dam


DAMS: list[dict] = [
    _dam(
        id="bhakra",
        name="Bhakra Dam",
        officialName="Bhakra Dam",
        category="demo_reference",
        state="Himachal Pradesh",
        district="Bilaspur / border with Punjab",
        river="Sutlej",
        basin="Indus",
        latitude=31.4104,
        longitude=76.4332,
        completionYear=1963,
        damType="Concrete gravity",
        heightMetersVerified=226,
        reservoirName="Gobind Sagar",
        historicalIncidentYear=None,
        incidentType=None,
        incidentDescription=None,
        incidentSource=None,
        officialSourceUrl=None,
        terrainSource="Demonstration Terrain (Bhakra flagship fixture)",
        terrainProvider="bhakra_fixture",
        dataAvailability="demo_complete",
        demoStatus="flagship_demo",
        downstreamRegion="Sutlej valley toward Nangal",
        nearestTown="Nangal",
        downstreamBearingDeg=210,
        coordinateNote=(
            "Existing HYDROTRACE flagship demonstration coordinates "
            "(public geographic framing used in the original demo)."
        ),
        scenarioDefaults=_scenario(
            damParameters={
                "heightMeters": 226,
                "reservoirVolumeMcm": 9340,
                "currentWaterLevelPercent": 82,
            },
            breachParameters={
                "widthMeters": 120,
                "depthMeters": 55,
                "formationTimeMinutes": 25,
            },
            simulationSettings={"durationHours": 8, "gridResolutionMeters": 80},
            defaultsLabel="Demonstration Scenario Defaults (Bhakra flagship)",
            defaultsNote=(
                "Flagship demonstration parameters for the Terrain-Aware Demonstration Flood Model. "
                "Not a calibrated historical breach reconstruction."
            ),
        ),
    ),
    _dam(
        id="kaddam",
        name="Kaddam",
        officialName="Kaddam Project (Kadem / Kaddam Narayana Reddy Project)",
        category="historical_case_study",
        state="Telangana",
        district="Nirmal",
        river="Kadem / Kaddam (tributary of Godavari)",
        basin="Godavari",
        latitude=19.10806,
        longitude=78.79083,
        completionYear=1958,
        damType=None,
        heightMetersVerified=31,
        reservoirName="Kadem Reservoir",
        historicalIncidentYear=1958,
        incidentType="Failure",
        incidentDescription=(
            "CWC dam-safety material notes failure in 1958, with reconstruction and "
            "another failure recorded in 1995."
        ),
        incidentSource="CWC Report on Dam Safety Procedures",
        officialSourceUrl=CWC_DS_PROCEDURES,
        downstreamRegion="Kadem / Godavari corridor",
        nearestTown="Nirmal",
        downstreamBearingDeg=120,
        coordinateNote=(
            "Approximate public geographic location for map framing "
            "(Wikipedia Kaddam Project: 19°6′29″N 78°47′27″E). Not a survey-grade dam axis."
        ),
        scenarioDefaults=_scenario(
            damParameters={"heightMeters": 31, "reservoirVolumeMcm": 216, "currentWaterLevelPercent": 80}
        ),
    ),
    _dam(
        id="panshet",
        name="Panshet",
        officialName="Panshet Dam (Tanajisagar Dam)",
        category="historical_case_study",
        state="Maharashtra",
        district="Pune",
        river="Ambi",
        basin="Krishna",
        latitude=18.38750,
        longitude=73.61278,
        completionYear=None,
        damType="Earthfill / gravity",
        heightMetersVerified=63.56,
        reservoirName=None,
        historicalIncidentYear=1961,
        incidentType="Failure",
        incidentDescription="CWC dam-safety material records failure in 1961.",
        incidentSource="CWC Report on Dam Safety Procedures",
        officialSourceUrl=CWC_DS_PROCEDURES,
        downstreamRegion="Mutha corridor toward Pune",
        nearestTown="Pune",
        downstreamBearingDeg=45,
        coordinateNote=(
            "Approximate public geographic location for map framing "
            "(Wikipedia / public maps: 18°23′15″N 73°36′46″E). Not a survey-grade dam axis."
        ),
        scenarioDefaults=_scenario(
            damParameters={"heightMeters": 64, "reservoirVolumeMcm": 303, "currentWaterLevelPercent": 80}
        ),
    ),
    _dam(
        id="khadakwasla",
        name="Khadakwasla",
        officialName="Khadakwasla Dam",
        category="historical_case_study",
        state="Maharashtra",
        district="Pune",
        river="Mutha",
        basin="Krishna",
        latitude=18.45306,
        longitude=73.54111,
        completionYear=None,
        damType=None,
        heightMetersVerified=31.71,
        reservoirName="Khadakwasla Lake",
        historicalIncidentYear=1961,
        incidentType="Failure",
        incidentDescription="CWC dam-safety material records failure in 1961.",
        incidentSource="CWC Report on Dam Safety Procedures",
        officialSourceUrl=CWC_DS_PROCEDURES,
        downstreamRegion="Mutha corridor toward Pune",
        nearestTown="Pune",
        downstreamBearingDeg=55,
        coordinateNote=(
            "Approximate public geographic location for map framing "
            "(Wikipedia Khadakwasla Dam: 18°27′11″N 73°32′28″E). Not a survey-grade dam axis."
        ),
        scenarioDefaults=_scenario(
            damParameters={"heightMeters": 32, "reservoirVolumeMcm": 341, "currentWaterLevelPercent": 80}
        ),
    ),
    _dam(
        id="chikkhole",
        name="Chikkhole",
        officialName="Chikkhole / Chickkahole Dam",
        category="historical_case_study",
        state="Karnataka",
        district="Chamarajanagar",
        river="Cauvery basin tributary",
        basin="Cauvery",
        latitude=11.923,
        longitude=76.940,
        completionYear=None,
        damType=None,
        heightMetersVerified=None,
        reservoirName=None,
        historicalIncidentYear=1972,
        incidentType="Failure",
        incidentDescription="CWC dam-safety material records failure in 1972.",
        incidentSource="CWC Report on Dam Safety Procedures",
        officialSourceUrl=CWC_DS_PROCEDURES,
        downstreamRegion="Cauvery basin downstream corridor",
        nearestTown="Chamarajanagar",
        downstreamBearingDeg=160,
        coordinateNote=(
            "Approximate district-level public framing near Chamarajanagar (Chickkahole / Chikkhole "
            "case-study listing). Precise dam-axis survey coordinates were not verified in this catalog "
            "release — for map framing only."
        ),
    ),
    _dam(
        id="machhu-ii",
        name="Machhu II",
        officialName="Machhu II Dam (Machchhu-II)",
        category="historical_case_study",
        state="Gujarat",
        district="Morbi / Rajkot region",
        river="Machhu / Machchhu",
        basin="Machhu",
        latitude=22.7544,
        longitude=70.8683,
        completionYear=None,
        damType=None,
        heightMetersVerified=None,
        reservoirName="Machchhu II reservoir",
        historicalIncidentYear=1979,
        incidentType="Catastrophic failure",
        incidentDescription="CWC dam-safety material records catastrophic failure in 1979.",
        incidentSource="CWC Report on Dam Safety Procedures",
        officialSourceUrl=CWC_DS_PROCEDURES,
        downstreamRegion="Machhu corridor toward Morbi",
        nearestTown="Morbi",
        downstreamBearingDeg=200,
        coordinateNote=(
            "Approximate public geographic location for map framing "
            "(Wikimapia Machchhu II reservoir: 22°45′16″N 70°52′6″E). Not a survey-grade dam axis."
        ),
    ),
    _dam(
        id="pratappur",
        name="Pratappur",
        officialName="Pratappur Dam",
        category="historical_case_study",
        state="Gujarat",
        district=None,
        river=None,
        basin=None,
        latitude=23.2156,
        longitude=72.6369,
        completionYear=None,
        damType=None,
        heightMetersVerified=None,
        reservoirName=None,
        historicalIncidentYear=2001,
        incidentType="Breach due to floods",
        incidentDescription="CWC NCDS minutes record breach due to floods in 2001.",
        incidentSource="CWC NCDS 39th Meeting Minutes",
        officialSourceUrl=CWC_NCDS_39,
        downstreamRegion="Local floodplain (demonstration framing)",
        nearestTown=None,
        downstreamBearingDeg=180,
        coordinateNote=(
            "Precise dam-axis coordinates were not verified from the cited CWC minutes. "
            "Map uses a Gujarat state-level framing point for demonstration centering only."
        ),
        dataAvailability="limited",
    ),
    _dam(
        id="jamunia",
        name="Jamunia",
        officialName="Jamunia Dam",
        category="historical_case_study",
        state="Madhya Pradesh",
        district="Sehore",
        river=None,
        basin=None,
        latitude=23.2356,
        longitude=77.1100,
        completionYear=None,
        damType=None,
        heightMetersVerified=None,
        reservoirName=None,
        historicalIncidentYear=2002,
        incidentType="Piping leading to breaching",
        incidentDescription="CWC NCDS minutes record piping leading to breaching in 2002.",
        incidentSource="CWC NCDS 39th Meeting Minutes",
        officialSourceUrl=CWC_NCDS_39,
        downstreamRegion="Sehore district corridor",
        nearestTown="Sehore",
        downstreamBearingDeg=150,
        coordinateNote=(
            "Approximate public geographic location for map framing "
            "(Wikimapia Jamunia Dam–Sehore: 23°14′8″N 77°6′36″E). Not a survey-grade dam axis."
        ),
    ),
    _dam(
        id="nandgavan",
        name="Nandgavan",
        officialName="Nandgavan / Nandgavhan Dam",
        category="historical_case_study",
        state="Maharashtra",
        district="Yavatmal",
        river=None,
        basin=None,
        latitude=20.1500,
        longitude=77.7500,
        completionYear=None,
        damType=None,
        heightMetersVerified=None,
        reservoirName=None,
        historicalIncidentYear=2005,
        incidentType="Excessive rainfall / overflow beyond design flood lift",
        incidentDescription=(
            "CWC NCDS minutes record excessive rainfall / water flow over the waste weir "
            "beyond design flood lift in 2005."
        ),
        incidentSource="CWC NCDS 39th Meeting Minutes",
        officialSourceUrl=CWC_NCDS_39,
        downstreamRegion="Yavatmal / Digras corridor",
        nearestTown="Digras",
        downstreamBearingDeg=170,
        coordinateNote=(
            "Approximate public framing near Digras Taluka, Yavatmal District "
            "(Wikimapia Nandgavan Dam listing). Precise dam-axis survey coordinates were not "
            "fully verified in this catalog release."
        ),
    ),
    _dam(
        id="jaswant-sagar",
        name="Jaswant Sagar",
        officialName="Jaswant Sagar Dam",
        category="historical_case_study",
        state="Rajasthan",
        district="Jodhpur",
        river="Luni basin tributary",
        basin="Luni",
        latitude=26.2410,
        longitude=73.4580,
        completionYear=None,
        damType=None,
        heightMetersVerified=None,
        reservoirName="Jaswant Sagar",
        historicalIncidentYear=2007,
        incidentType="Piping leading to breaching",
        incidentDescription="CWC NCDS minutes record piping leading to breaching in 2007.",
        incidentSource="CWC NCDS 39th Meeting Minutes",
        officialSourceUrl=CWC_NCDS_39,
        downstreamRegion="Jodhpur / Pichiyak corridor",
        nearestTown="Pichiyak",
        downstreamBearingDeg=200,
        coordinateNote=(
            "Approximate public geographic location near Pichiyak, Jodhpur district "
            "(public tourism / geographic references). Not a survey-grade dam axis."
        ),
    ),
    _dam(
        id="gararda",
        name="Gararda",
        officialName="Gararda Dam",
        category="historical_case_study",
        state="Rajasthan",
        district="Bundi",
        river=None,
        basin=None,
        latitude=25.4300,
        longitude=75.6400,
        completionYear=None,
        damType=None,
        heightMetersVerified=None,
        reservoirName=None,
        historicalIncidentYear=2010,
        incidentType="Failure",
        incidentDescription=(
            "CWC NCDS minutes record failure in 2010; examination of cause by state authorities."
        ),
        incidentSource="CWC NCDS 39th Meeting Minutes",
        officialSourceUrl=CWC_NCDS_39,
        downstreamRegion="Bundi district corridor",
        nearestTown="Bundi",
        downstreamBearingDeg=180,
        coordinateNote=(
            "Approximate district-level public framing for Bundi, Rajasthan. "
            "Precise dam-axis survey coordinates were not verified in this catalog release."
        ),
        dataAvailability="limited",
    ),
]

_BY_ID = {d["id"]: d for d in DAMS}


def list_dams() -> list[dict]:
    return [
        {
            "id": d["id"],
            "name": d["name"],
            "officialName": d["officialName"],
            "category": d["category"],
            "state": d["state"],
            "district": d["district"],
            "river": d["river"],
            "latitude": d["latitude"],
            "longitude": d["longitude"],
            "historicalIncidentYear": d["historicalIncidentYear"],
            "incidentType": d["incidentType"],
            "demoStatus": d["demoStatus"],
            "terrainSource": d["terrainSource"],
            "dataAvailability": d["dataAvailability"],
        }
        for d in DAMS
    ]


def get_dam(dam_id: str) -> dict | None:
    dam = _BY_ID.get(dam_id)
    return deepcopy(dam) if dam else None


def require_dam(dam_id: str) -> dict:
    dam = get_dam(dam_id)
    if not dam:
        raise KeyError(dam_id)
    return dam
