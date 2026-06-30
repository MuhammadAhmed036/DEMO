import type { Feature, FeatureCollection, Polygon } from "geojson";
import { ZONES } from "@/lib/mock/zones";

/**
 * The map package ships only the ICT outer boundary — no per-zone polygons.
 * These soft "blob" outlines are generated around each zone's hand-placed
 * center purely for the dashboard's zone-overview visualization. Swap for
 * real surveyed zone polygons later by replacing this generator's output
 * shape (a standard GeoJSON FeatureCollection of Polygons).
 */
function circlePolygon(
  center: [number, number],
  radiusKm: number,
  points = 48,
  jitterSeed = 1
): [number, number][] {
  const coords: [number, number][] = [];
  const latRad = (center[1] * Math.PI) / 180;
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos(latRad);

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    // Cheap deterministic wobble so blobs don't look like perfect circles.
    const wobble = 1 + 0.12 * Math.sin(angle * 3 + jitterSeed) + 0.08 * Math.cos(angle * 5 - jitterSeed);
    const dLng = (Math.cos(angle) * radiusKm * wobble) / kmPerDegLng;
    const dLat = (Math.sin(angle) * radiusKm * wobble) / kmPerDegLat;
    coords.push([center[0] + dLng, center[1] + dLat]);
  }
  return coords;
}

export function buildZoneBlobsGeoJSON(): FeatureCollection<Polygon> {
  const features: Feature<Polygon>[] = ZONES.map((zone, i) => {
    const radiusKm = 2.6 + (zone.cameraCount / 248) * 4.5;
    return {
      type: "Feature",
      properties: {
        zoneId: zone.id,
        name: zone.name,
        color: zone.color,
      },
      geometry: {
        type: "Polygon",
        coordinates: [circlePolygon(zone.center, radiusKm, 48, i + 1)],
      },
    };
  });

  return { type: "FeatureCollection", features };
}
