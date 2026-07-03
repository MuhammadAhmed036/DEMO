"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CameraLocationMapLoader } from "@/components/map/CameraLocationMapLoader";
import { CameraLocationPanel } from "@/components/map/CameraLocationPanel";
import {
  useCameraLocations,
  useUpdateCameraLocation,
  useZoneSummaries,
} from "@/lib/hooks/useCameraLocations";

export default function MapViewPage() {
  const { data: cameras, isLoading, error } = useCameraLocations();
  const { data: zoneSummaries } = useZoneSummaries();
  const updateLocation = useUpdateCameraLocation();

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [placementCameraId, setPlacementCameraId] = useState<string | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<{ center: [number, number]; zoom: number } | null>(
    null
  );

  const selectedCamera = useMemo(
    () => cameras?.find((c) => c.cameraId === selectedCameraId) ?? null,
    [cameras, selectedCameraId]
  );

  function handleSelectCamera(cameraId: string) {
    setSelectedCameraId(cameraId);
    setPlacementCameraId(null);
    const camera = cameras?.find((c) => c.cameraId === cameraId);
    if (camera?.latitude !== null && camera?.longitude !== null && camera) {
      setFlyToTarget({ center: [camera.longitude as number, camera.latitude as number], zoom: 17 });
    }
  }

  function persistLocation(cameraId: string, latitude: number, longitude: number) {
    updateLocation.mutate({ cameraId, latitude, longitude });
    setPlacementCameraId(null);
  }

  return (
    <div className="flex h-[calc(100vh-4rem-2.25rem)] flex-col">
      <PageHeader
        title="Map View"
        description="Live camera locations from the detection API — drag a marker, click Pick on map, or type coordinates to relocate a camera"
      />
      {error && (
        <div className="mx-4 mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive sm:mx-6">
          {error.message}
        </div>
      )}
      <div className="grid flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_340px]">
        <div className="h-[480px] overflow-hidden rounded-xl border border-surface-border lg:h-full">
          <CameraLocationMapLoader
            cameras={cameras ?? []}
            selectedCameraId={selectedCameraId}
            onSelectCamera={handleSelectCamera}
            onDragEnd={persistLocation}
            placementCameraId={placementCameraId}
            onPickLocation={(latitude, longitude) => {
              if (placementCameraId) persistLocation(placementCameraId, latitude, longitude);
            }}
            flyToTarget={flyToTarget}
          />
        </div>
        <div className="h-[420px] overflow-hidden rounded-xl border border-surface-border lg:h-full">
          <CameraLocationPanel
            zoneSummaries={zoneSummaries ?? []}
            cameras={cameras ?? []}
            selectedCamera={selectedCamera}
            placementCameraId={placementCameraId}
            onArmPlacement={setPlacementCameraId}
            onCancelPlacement={() => setPlacementCameraId(null)}
            onSave={persistLocation}
            onClose={() => setSelectedCameraId(null)}
            onSelectCamera={handleSelectCamera}
            isSaving={updateLocation.isPending}
            saveError={updateLocation.error?.message ?? null}
          />
        </div>
      </div>
      {isLoading && !cameras && (
        <div className="px-4 pb-4 text-xs text-muted-foreground sm:px-6">
          Loading camera registry…
        </div>
      )}
    </div>
  );
}
