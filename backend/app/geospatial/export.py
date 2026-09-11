from app.dams.catalog import require_dam


def to_geojson(result: dict) -> dict:
    dam_id = result.get("damId") or "bhakra"
    dam = require_dam(dam_id)
    poly = result.get("flood_extent")
    coords = poly["lngLats"] if poly else []
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "dam_id": dam_id,
                    "dam_name": dam["name"],
                    "scenario_id": result.get("simulation_id"),
                    "event_type": result.get("eventType"),
                    "source_type": "terrain_aware_demonstration",
                    "name": f"{dam['name']} demonstration inundation",
                    "model": dam["modelName"],
                    "note": dam["modelNote"],
                    "terrain_source": dam["terrainSource"],
                },
                "geometry": {"type": "Polygon", "coordinates": [coords]},
            }
        ],
    }


def to_kml(result: dict) -> str:
    dam_id = result.get("damId") or "bhakra"
    dam = require_dam(dam_id)
    poly = result.get("flood_extent") or {}
    coords = " ".join(f"{lng},{lat},0" for lng, lat in poly.get("lngLats", []))
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>HYDROTRACE — {dam['name']} inundation</name>
    <description>
      Dam: {dam['name']}
      Scenario: {result.get('eventType')}
      Model: {dam['modelName']}
      {dam['modelNote']}
    </description>
    <Placemark>
      <name>Demonstration flood extent</name>
      <description>Impact layers derived from demonstration infrastructure fixtures.</description>
      <Style>
        <LineStyle><color>ffb09108</color><width>2</width></LineStyle>
        <PolyStyle><color>7fb09108</color></PolyStyle>
      </Style>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>{coords}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>"""
