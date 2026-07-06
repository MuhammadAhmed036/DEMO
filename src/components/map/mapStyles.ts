import type { StyleSpecification } from "maplibre-gl";

export const ISLAMABAD_CENTER: [number, number] = [73.0479, 33.7295];
export const ISLAMABAD_DEFAULT_ZOOM = 11;
export const ISLAMABAD_BOUNDS: [[number, number], [number, number]] = [
  [72.7, 33.45],
  [73.4, 33.95],
];

const GLYPHS_URL = "/map-fonts/{fontstack}/{range}.pbf";
const VECTOR_TILES_URL = "pmtiles:///maps/islamabad.pmtiles";
const SATELLITE_TILES_URL = "pmtiles:///maps/islamabad-satellite.pmtiles";
const BOUNDARY_GEOJSON_URL = "/maps/islamabad.geojson";

export type MapTheme = "dark" | "light";

const MAJOR_PLACE_CLASSES = ["city", "town"];
const MINOR_PLACE_CLASSES = [
  "village",
  "suburb",
  "quarter",
  "neighbourhood",
  "hamlet",
  "isolated_dwelling",
];

// Ported from islamabad_map_package/index.html's place-label tiering, which
// keeps important place names visible at low zoom and reveals minor ones
// only once there's room (avoids MapLibre's collision detection silently
// dropping overlapping labels).
function placeLabelLayers(
  textColor: string,
  haloColor: string
): StyleSpecification["layers"] {
  return [
    {
      id: "place-label-major",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["in", ["get", "class"], ["literal", MAJOR_PLACE_CLASSES]],
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 9, 13, 14, 20],
        "text-max-width": 10,
        "symbol-sort-key": ["coalesce", ["get", "rank"], 0],
        "text-allow-overlap": false,
        "text-optional": true,
      },
      paint: {
        "text-color": textColor,
        "text-halo-color": haloColor,
        "text-halo-width": 2,
      },
    },
    {
      id: "place-label-minor",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["in", ["get", "class"], ["literal", MINOR_PLACE_CLASSES]],
      minzoom: 11,
      layout: {
        "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 11, 11, 16, 16],
        "text-max-width": 9,
        "symbol-sort-key": ["coalesce", ["get", "rank"], 10],
        "text-allow-overlap": false,
        "text-optional": true,
      },
      paint: {
        "text-color": textColor,
        "text-halo-color": haloColor,
        "text-halo-width": 1.5,
      },
    },
  ] as StyleSpecification["layers"];
}

export function buildVectorStyle(theme: MapTheme = "dark"): StyleSpecification {
  const palette =
    theme === "light"
      ? {
          bg: "#e9eef6",
          water: "#b9d9ee",
          landuse: "#dce5dc",
          park: "#c9e2c6",
          building: "#d5dde8",
          roadCasing: "#f8fafc",
          boundary: "#94a3b8",
          labelText: "#24324a",
          labelHalo: "#f8fafc",
          roadLabel: "#475569",
          residentialRoad: "#a8b3c3",
          defaultRoad: "#8d9bad",
        }
      : {
          bg: "#0a0e17",
          water: "#13283f",
          landuse: "#10182a",
          park: "#10241a",
          building: "#1a2336",
          roadCasing: "#05070d",
          boundary: "#374151",
          labelText: "#e5e7eb",
          labelHalo: "#0a0e17",
          roadLabel: "#cbd5e1",
          residentialRoad: "#4b5563",
          defaultRoad: "#374151",
        };

  return {
    version: 8,
    name: "Intellivision Islamabad Vector",
    glyphs: GLYPHS_URL,
    transition: { duration: 0, delay: 0 },
    sources: {
      openmaptiles: { type: "vector", url: VECTOR_TILES_URL, maxzoom: 14 },
      islamabad_boundary: { type: "geojson", data: BOUNDARY_GEOJSON_URL },
    },
    layers: ([
      {
        id: "background",
        type: "background",
        paint: { "background-color": palette.bg },
      },
      {
        id: "water",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "water",
        paint: { "fill-color": palette.water, "fill-opacity": 0.85 },
      },
      {
        id: "landuse",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landuse",
        paint: { "fill-color": palette.landuse, "fill-opacity": 0.35 },
      },
      {
        id: "park",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "landuse",
        filter: ["in", ["get", "class"], ["literal", ["park", "recreation_ground", "grass"]]],
        paint: { "fill-color": palette.park, "fill-opacity": 0.55 },
      },
      {
        id: "building",
        type: "fill",
        source: "openmaptiles",
        "source-layer": "building",
        paint: { "fill-color": palette.building, "fill-opacity": 0.55 },
      },
      {
        id: "road-casing",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        paint: {
          "line-color": palette.roadCasing,
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.5, 14, 5],
        },
        layout: { "line-cap": "round", "line-join": "round" },
      },
      {
        id: "road-fill",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        paint: {
          "line-color": [
            "match",
            ["get", "class"],
            "motorway",
            "#dc2626",
            "trunk",
            "#ea580c",
            "primary",
            "#d97706",
            "secondary",
            "#ca8a04",
            "residential",
            palette.residentialRoad,
            palette.defaultRoad,
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.3, 14, 4],
        },
        layout: { "line-cap": "round", "line-join": "round" },
      },
      {
        id: "boundary",
        type: "line",
        source: "openmaptiles",
        "source-layer": "boundary",
        paint: { "line-color": palette.boundary, "line-width": 1 },
      },
      {
        id: "islamabad-outline",
        type: "line",
        source: "islamabad_boundary",
        paint: { "line-color": "#3b82f6", "line-width": 2, "line-dasharray": [4, 2] },
      },
      {
        id: "road-label",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "transportation_name",
        minzoom: 12,
        layout: {
          "symbol-placement": "line",
          "text-field": ["coalesce", ["get", "name:en"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 16, 13],
        },
        paint: {
          "text-color": palette.roadLabel,
          "text-halo-color": palette.labelHalo,
          "text-halo-width": 1.5,
        },
      },
    ] as StyleSpecification["layers"]).concat(
      placeLabelLayers(palette.labelText, palette.labelHalo)
    ),
  };
}

export function buildSatelliteStyle(): StyleSpecification {
  const labelText = "#ffffff";
  const labelHalo = "#000000";

  return {
    version: 8,
    name: "Intellivision Islamabad Satellite",
    glyphs: GLYPHS_URL,
    transition: { duration: 0, delay: 0 },
    sources: {
      satellite: {
        type: "raster",
        url: SATELLITE_TILES_URL,
        tileSize: 256,
        minzoom: 0,
        maxzoom: 14,
      },
      openmaptiles: { type: "vector", url: VECTOR_TILES_URL, maxzoom: 14 },
      islamabad_boundary: { type: "geojson", data: BOUNDARY_GEOJSON_URL },
    },
    layers: ([
      { id: "background", type: "background", paint: { "background-color": "#000" } },
      {
        id: "satellite",
        type: "raster",
        source: "satellite",
        paint: { "raster-opacity": 1, "raster-brightness-min": 0 },
      },
      {
        id: "road-satellite",
        type: "line",
        source: "openmaptiles",
        "source-layer": "transportation",
        paint: {
          "line-color": [
            "match",
            ["get", "class"],
            "motorway",
            "#f59e0b",
            "trunk",
            "#f59e0b",
            "primary",
            "#ffffff",
            "#aaaaaa",
          ],
          "line-opacity": 0.7,
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.8, 14, 3],
        },
        layout: { "line-cap": "round", "line-join": "round" },
      },
      {
        id: "islamabad-outline-sat",
        type: "line",
        source: "islamabad_boundary",
        paint: { "line-color": "#60a5fa", "line-width": 2.5, "line-dasharray": [4, 2] },
      },
    ] as StyleSpecification["layers"]).concat(placeLabelLayers(labelText, labelHalo)),
  };
}
