"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import { Protocol } from "pmtiles";
import type { FeatureCollection, Polygon } from "geojson";
import type { Camera, Zone } from "@/lib/types";
import {
  ISLAMABAD_BOUNDS,
  ISLAMABAD_CENTER,
  ISLAMABAD_DEFAULT_ZOOM,
  buildSatelliteStyle,
  buildVectorStyle,
} from "@/components/map/mapStyles";
import { addCustomLayers, buildZoneLabelPoints } from "@/components/map/mapLayers";
import { MapLayerToggle, MapZoomControls } from "@/components/map/MapControls";
import { MapSearchBox } from "@/components/map/MapSearchBox";
import { densityColor } from "@/lib/density";
import { cn } from "@/lib/utils";

let protocolRegistered = false;
function ensurePmtilesProtocol() {
  if (protocolRegistered) return;
  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile.bind(protocol));
  protocolRegistered = true;
}

function pickFeaturedCameras(cameras: Camera[], perZone: number): Camera[] {
  const byZone = new Map<string, Camera[]>();
  for (const camera of cameras) {
    if (camera.status !== "online") continue;
    const list = byZone.get(camera.zoneId) ?? [];
    list.push(camera);
    byZone.set(camera.zoneId, list);
  }
  const out: Camera[] = [];
  for (const list of byZone.values()) {
    out.push(
      ...list.sort((a, b) => b.currentPersonCount - a.currentPersonCount).slice(0, perZone)
    );
  }
  return out;
}

function createMarkerElement(camera: Camera, selected: boolean) {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${camera.name} — ${camera.currentPersonCount} people`);
  el.className = cn(
    "flex items-center justify-center rounded-full border-2 text-xs font-semibold shadow-lg transition-transform hover:scale-110",
    selected ? "border-white" : "border-black/30"
  );
  const size = selected ? 38 : 32;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.backgroundColor = densityColor(camera.density);
  el.style.color = camera.density === "Low" ? "#e5e7eb" : "#0a0e17";
  el.style.cursor = "pointer";
  el.textContent = String(camera.currentPersonCount);
  return el;
}

export interface FlyToTarget {
  center: [number, number];
  zoom: number;
}

export interface MapCanvasProps {
  cameras: Camera[];
  zones: Zone[];
  zoneBlobs?: FeatureCollection<Polygon>;
  selectedCameraId: string | null;
  onSelectCamera: (id: string) => void;
  className?: string;
  markersPerZone?: number;
  showSearch?: boolean;
  initialZoom?: number;
  flyToTarget?: FlyToTarget | null;
}

export function MapCanvas({
  cameras,
  zones,
  zoneBlobs,
  selectedCameraId,
  onSelectCamera,
  className,
  markersPerZone = 3,
  showSearch = true,
  initialZoom,
  flyToTarget,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);
  const [viewMode, setViewMode] = useState<"vector" | "satellite">("vector");
  const [heatActive, setHeatActive] = useState(false);

  const featuredCameras = useMemo(
    () => pickFeaturedCameras(cameras, markersPerZone),
    [cameras, markersPerZone]
  );
  const zoneLabelPoints = useMemo(() => buildZoneLabelPoints(zones), [zones]);

  // Mount the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    ensurePmtilesProtocol();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildVectorStyle(),
      center: ISLAMABAD_CENTER,
      zoom: initialZoom ?? ISLAMABAD_DEFAULT_ZOOM,
      maxBounds: ISLAMABAD_BOUNDS,
      minZoom: 9,
      maxZoom: 18,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("style.load", () => {
      addCustomLayers(map, zoneBlobs, zoneLabelPoints);
      setMapReady(true);
    });

    const markers = markersRef.current;
    return () => {
      markers.forEach((marker) => marker.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
    // Intentionally mount once; style/data updates are handled by the
    // effects below via setStyle()/setData() rather than remounting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-inject overlays whenever the zone data resolves or changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    addCustomLayers(map, zoneBlobs, zoneLabelPoints);
  }, [zoneBlobs, zoneLabelPoints, mapReady]);

  // Toggle vector <-> satellite style.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.setStyle(viewMode === "vector" ? buildVectorStyle() : buildSatelliteStyle());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // Cosmetic heat overlay toggle.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!map.getLayer("zone-blobs-fill")) return;
    map.setPaintProperty("zone-blobs-fill", "fill-opacity", heatActive ? 0.32 : 0.1);
  }, [heatActive, mapReady]);

  // Sync camera markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const existingIds = new Set(markersRef.current.keys());
    const nextIds = new Set(featuredCameras.map((c) => c.id));

    existingIds.forEach((id) => {
      if (!nextIds.has(id)) {
        markersRef.current.get(id)?.remove();
        markersRef.current.delete(id);
      }
    });

    featuredCameras.forEach((camera) => {
      const selected = camera.id === selectedCameraId;
      const existing = markersRef.current.get(camera.id);
      if (existing) {
        existing.getElement().replaceWith(createMarkerElement(camera, selected));
        const newEl = existing.getElement();
        newEl.onclick = () => onSelectCamera(camera.id);
        return;
      }
      const el = createMarkerElement(camera, selected);
      el.onclick = () => onSelectCamera(camera.id);
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(camera.position)
        .addTo(map);
      markersRef.current.set(camera.id, marker);
    });
  }, [featuredCameras, selectedCameraId, onSelectCamera, mapReady]);

  function handleZoomIn() {
    mapRef.current?.zoomIn({ duration: 200 });
  }
  function handleZoomOut() {
    mapRef.current?.zoomOut({ duration: 200 });
  }
  function handleLocate() {
    mapRef.current?.flyTo({
      center: ISLAMABAD_CENTER,
      zoom: initialZoom ?? ISLAMABAD_DEFAULT_ZOOM,
      duration: 600,
    });
  }
  function handleFullscreen() {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }
  // Imperative "fly to" requests from the parent (e.g. clicking a zone in a
  // legend panel) — a fresh object each call so re-selecting the same target
  // still re-triggers the flight.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !flyToTarget) return;
    map.flyTo({ center: flyToTarget.center, zoom: flyToTarget.zoom, duration: 700 });
  }, [flyToTarget, mapReady]);

  function handleSearchResult(camera: Camera) {
    mapRef.current?.flyTo({ center: camera.position, zoom: 14.5, duration: 800 });
    onSelectCamera(camera.id);
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-xl", className)}>
      <div ref={containerRef} className="h-full w-full" />
      {showSearch && <MapSearchBox cameras={cameras} onResult={handleSearchResult} />}
      <MapLayerToggle viewMode={viewMode} onChange={setViewMode} />
      <MapZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocate}
        onFullscreen={handleFullscreen}
        onToggleHeat={() => setHeatActive((v) => !v)}
        heatActive={heatActive}
      />
    </div>
  );
}
