"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import { Protocol } from "pmtiles";
import type { CameraLocation } from "@/lib/types";
import {
  ISLAMABAD_BOUNDS,
  ISLAMABAD_CENTER,
  ISLAMABAD_DEFAULT_ZOOM,
  buildSatelliteStyle,
  buildVectorStyle,
} from "@/components/map/mapStyles";
import type { MapTheme } from "@/components/map/mapStyles";
import { Crosshair, Expand, Minus, Plus } from "lucide-react";
import { MapLayerToggle } from "@/components/map/MapControls";
import { cn } from "@/lib/utils";

let protocolRegistered = false;
function ensurePmtilesProtocol() {
  if (protocolRegistered) return;
  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile.bind(protocol));
  protocolRegistered = true;
}

function getDocumentTheme(): MapTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

const ZONE_PALETTE = ["#3b82f6", "#a855f7", "#f97316", "#22c55e", "#ec4899", "#eab308", "#06b6d4"];

export function zoneColor(zone: string | null): string {
  if (!zone) return "#94a3b8";
  let hash = 0;
  for (let i = 0; i < zone.length; i++) hash = (hash * 31 + zone.charCodeAt(i)) >>> 0;
  return ZONE_PALETTE[hash % ZONE_PALETTE.length];
}

// Lucide's "camera" glyph, inlined so marker elements (plain DOM, not React)
// render the same icon used everywhere else in the app.
const CAMERA_ICON_SVG = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="60%" height="60%">
  <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
  <circle cx="12" cy="13" r="3" />
</svg>`.trim();

function createMarkerElement(camera: CameraLocation): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${camera.cameraName} location`);
  el.style.color = "#f8fafc";
  el.innerHTML = CAMERA_ICON_SVG;
  return el;
}

function applyMarkerStyle(el: HTMLButtonElement, camera: CameraLocation, selected: boolean, placing: boolean) {
  // MapLibre positions markers by writing `transform` directly onto this
  // element on every render tick (translate for lng/lat). Never put `scale`
  // or any other `transform` in this element's own CSS (hover/active
  // included) — the two would fight over the same property every frame and
  // the marker visibly jitters. Hover/active feedback below only uses
  // filter/shadow, which MapLibre never touches.
  el.className = cn(
    "flex items-center justify-center rounded-full border-2 shadow-lg transition-[filter,box-shadow]",
    selected ? "border-white" : "border-black/30",
    placing
      ? "animate-pulse cursor-crosshair"
      : "cursor-grab hover:brightness-110 hover:shadow-xl active:cursor-grabbing"
  );
  const size = selected ? 36 : 28;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.backgroundColor = camera.enabled ? zoneColor(camera.zone) : "#6b7280";
}

export interface FlyToTarget {
  center: [number, number];
  zoom: number;
}

export interface CameraLocationMapProps {
  cameras: CameraLocation[];
  selectedCameraId: string | null;
  onSelectCamera: (cameraId: string) => void;
  onDragEnd: (cameraId: string, latitude: number, longitude: number) => void;
  placementCameraId: string | null;
  onPickLocation: (latitude: number, longitude: number) => void;
  flyToTarget?: FlyToTarget | null;
  className?: string;
}

export function CameraLocationMap({
  cameras,
  selectedCameraId,
  onSelectCamera,
  onDragEnd,
  placementCameraId,
  onPickLocation,
  flyToTarget,
  className,
}: CameraLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);
  const [viewMode, setViewMode] = useState<"vector" | "satellite">("vector");
  const [theme, setTheme] = useState<MapTheme>(() => getDocumentTheme());

  const placedCameras = useMemo(
    () => cameras.filter((c) => c.latitude !== null && c.longitude !== null),
    [cameras]
  );

  const onDragEndRef = useRef(onDragEnd);
  const onSelectCameraRef = useRef(onSelectCamera);
  const onPickLocationRef = useRef(onPickLocation);
  useEffect(() => {
    onDragEndRef.current = onDragEnd;
    onSelectCameraRef.current = onSelectCamera;
    onPickLocationRef.current = onPickLocation;
  });

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setTheme(getDocumentTheme()));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    ensurePmtilesProtocol();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildVectorStyle(getDocumentTheme()),
      center: ISLAMABAD_CENTER,
      zoom: ISLAMABAD_DEFAULT_ZOOM,
      maxBounds: ISLAMABAD_BOUNDS,
      minZoom: 9,
      maxZoom: 20,
      attributionControl: false,
    });
    mapRef.current = map;
    map.on("style.load", () => setMapReady(true));

    const markers = markersRef.current;
    return () => {
      markers.forEach((marker) => marker.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.setStyle(viewMode === "vector" ? buildVectorStyle(theme) : buildSatelliteStyle());
  }, [viewMode, theme, mapReady]);

  // Click-to-place: when a camera is armed for placement, the next map click sets its coordinates.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    function handleClick(event: maplibregl.MapMouseEvent) {
      if (!placementCameraId) return;
      onPickLocationRef.current(event.lngLat.lat, event.lngLat.lng);
    }
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [placementCameraId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const canvas = map.getCanvas();
    canvas.style.cursor = placementCameraId ? "crosshair" : "";
  }, [placementCameraId]);

  // Sync markers incrementally: add/remove only the cameras that actually
  // appeared/disappeared, and update position + style on existing marker
  // instances in place. Recreating every marker on each poll tick or click
  // (as a naive rebuild-from-scratch would) makes pins visibly snap/flicker
  // even when their real position hasn't changed.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const markers = markersRef.current;
    const nextIds = new Set(placedCameras.map((c) => c.cameraId));

    markers.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    });

    placedCameras.forEach((camera) => {
      const selected = camera.cameraId === selectedCameraId;
      const placing = camera.cameraId === placementCameraId;
      const lngLat: [number, number] = [camera.longitude as number, camera.latitude as number];

      const existing = markers.get(camera.cameraId);
      if (existing) {
        existing.setLngLat(lngLat);
        applyMarkerStyle(existing.getElement() as HTMLButtonElement, camera, selected, placing);
        return;
      }

      const el = createMarkerElement(camera);
      applyMarkerStyle(el, camera, selected, placing);
      el.onclick = (event) => {
        event.stopPropagation();
        onSelectCameraRef.current(camera.cameraId);
      };
      const marker = new maplibregl.Marker({ element: el, anchor: "center", draggable: true })
        .setLngLat(lngLat)
        .addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLngLat();
        onDragEndRef.current(camera.cameraId, lat, lng);
      });
      markers.set(camera.cameraId, marker);
    });
  }, [placedCameras, selectedCameraId, placementCameraId, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !flyToTarget) return;
    map.flyTo({ center: flyToTarget.center, zoom: flyToTarget.zoom, duration: 700 });
  }, [flyToTarget, mapReady]);

  // Auto-fit to the real cameras once, on initial load — many camera
  // registries seed all cameras within a few hundred meters of each other,
  // where the default city-wide zoom would render every marker as a single
  // overlapping, unclickable pixel.
  const hasAutoFitRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || hasAutoFitRef.current || placedCameras.length === 0) return;
    hasAutoFitRef.current = true;

    if (placedCameras.length === 1) {
      const only = placedCameras[0];
      map.jumpTo({ center: [only.longitude as number, only.latitude as number], zoom: 16 });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    placedCameras.forEach((camera) => {
      bounds.extend([camera.longitude as number, camera.latitude as number]);
    });
    map.fitBounds(bounds, { padding: 80, maxZoom: 18, duration: 0 });
  }, [placedCameras, mapReady]);

  function handleZoomIn() {
    mapRef.current?.zoomIn({ duration: 200 });
  }
  function handleZoomOut() {
    mapRef.current?.zoomOut({ duration: 200 });
  }
  function handleLocate() {
    mapRef.current?.flyTo({ center: ISLAMABAD_CENTER, zoom: ISLAMABAD_DEFAULT_ZOOM, duration: 600 });
  }
  function handleFullscreen() {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-xl", className)}>
      <div ref={containerRef} className="h-full w-full" />
      {placementCameraId && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-md border border-primary bg-surface-2/95 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
          Click anywhere on the map to place this camera
        </div>
      )}
      <MapLayerToggle viewMode={viewMode} onChange={setViewMode} />
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
        <div className="flex flex-col overflow-hidden rounded-md border border-surface-border bg-surface-2/95 shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="flex size-9 items-center justify-center border-b border-surface-border hover:bg-surface-3"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="flex size-9 items-center justify-center hover:bg-surface-3"
          >
            <Minus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleLocate}
          aria-label="Recenter"
          className="flex size-9 items-center justify-center rounded-md border border-surface-border bg-surface-2/95 shadow-sm backdrop-blur hover:bg-surface-3"
        >
          <Crosshair className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleFullscreen}
          aria-label="Fullscreen"
          className="flex size-9 items-center justify-center rounded-md border border-surface-border bg-surface-2/95 shadow-sm backdrop-blur hover:bg-surface-3"
        >
          <Expand className="size-4" />
        </button>
      </div>
    </div>
  );
}
