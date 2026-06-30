import type { Map as MapLibreMap } from "maplibre-gl";
import type { FeatureCollection, Point, Polygon } from "geojson";
import type { Zone } from "@/lib/types";

const ZONE_BLOBS_SOURCE = "zone-blobs";
const ZONE_LABELS_SOURCE = "zone-labels";

export function buildZoneLabelPoints(zones: Zone[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: zones.map((z) => ({
      type: "Feature",
      properties: { name: z.name.toUpperCase(), color: z.color },
      geometry: { type: "Point", coordinates: z.center },
    })),
  };
}

/**
 * Re-injects the dashboard's zone overlays into the active MapLibre style.
 * Must be called on every `load`/`style.load` event since `map.setStyle()`
 * (used by the vector/satellite toggle) discards custom sources & layers.
 */
export function addCustomLayers(
  map: MapLibreMap,
  zoneBlobs: FeatureCollection<Polygon> | undefined,
  zoneLabels: FeatureCollection<Point>
) {
  if (zoneBlobs && !map.getSource(ZONE_BLOBS_SOURCE)) {
    map.addSource(ZONE_BLOBS_SOURCE, { type: "geojson", data: zoneBlobs });
    map.addLayer({
      id: "zone-blobs-fill",
      type: "fill",
      source: ZONE_BLOBS_SOURCE,
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.1,
      },
    });
    map.addLayer({
      id: "zone-blobs-outline",
      type: "line",
      source: ZONE_BLOBS_SOURCE,
      paint: {
        "line-color": ["get", "color"],
        "line-width": 1.5,
        "line-opacity": 0.55,
      },
    });
  } else if (zoneBlobs) {
    const source = map.getSource(ZONE_BLOBS_SOURCE);
    if (source && "setData" in source) (source as { setData: (d: unknown) => void }).setData(zoneBlobs);
  }

  if (!map.getSource(ZONE_LABELS_SOURCE)) {
    map.addSource(ZONE_LABELS_SOURCE, { type: "geojson", data: zoneLabels });
    map.addLayer({
      id: "zone-labels",
      type: "symbol",
      source: ZONE_LABELS_SOURCE,
      minzoom: 9,
      maxzoom: 13.5,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 9, 11, 13, 15],
        "text-letter-spacing": 0.05,
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": ["get", "color"],
        "text-halo-color": "#05070d",
        "text-halo-width": 1.6,
      },
    });
  } else {
    const source = map.getSource(ZONE_LABELS_SOURCE);
    if (source && "setData" in source) (source as { setData: (d: unknown) => void }).setData(zoneLabels);
  }
}
