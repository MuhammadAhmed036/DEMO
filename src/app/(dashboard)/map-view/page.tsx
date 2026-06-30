"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { MapCanvasLoader } from "@/components/map/MapCanvasLoader";
import type { FlyToTarget } from "@/components/map/MapCanvas";
import { CameraInfoPanel } from "@/components/map/CameraInfoPanel";
import { ZoneLegendPanel } from "@/components/map/ZoneLegendPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useCameras } from "@/lib/hooks/useCameras";
import { useZoneBlobs, useZones } from "@/lib/hooks/useZones";
import type { Zone } from "@/lib/types";

function MapViewContent() {
  const searchParams = useSearchParams();
  const requestedZoneId = searchParams.get("zone");

  const { data: cameras } = useCameras();
  const { data: zones } = useZones();
  const { data: zoneBlobs } = useZoneBlobs();

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<FlyToTarget | null>(null);
  const appliedZoneParam = useRef(false);

  function handleSelectZone(zone: Zone) {
    setActiveZoneId(zone.id);
    setSelectedCameraId(null);
    setFlyToTarget({ center: zone.center, zoom: 13.2 });
  }

  function handleSelectCamera(id: string) {
    setSelectedCameraId(id);
  }

  useEffect(() => {
    if (appliedZoneParam.current || !requestedZoneId || !zones) return;
    const zone = zones.find((z) => z.id === requestedZoneId);
    if (zone) {
      appliedZoneParam.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time deep link from ?zone= query param on initial load.
      handleSelectZone(zone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedZoneId, zones]);

  return (
    <div className="flex h-[calc(100vh-4rem-2.25rem)] flex-col">
      <PageHeader title="Map View" description="Real-time geospatial view of all cameras and zones" />
      <div className="grid flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_340px]">
        <div className="h-[480px] overflow-hidden rounded-xl border border-surface-border lg:h-full">
          {cameras && zones ? (
            <MapCanvasLoader
              cameras={cameras}
              zones={zones}
              zoneBlobs={zoneBlobs}
              selectedCameraId={selectedCameraId}
              onSelectCamera={handleSelectCamera}
              flyToTarget={flyToTarget}
              initialZoom={10.6}
            />
          ) : (
            <Skeleton className="h-full w-full" />
          )}
        </div>
        <div className="h-[420px] overflow-hidden rounded-xl border border-surface-border lg:h-full">
          {selectedCameraId ? (
            <CameraInfoPanel cameraId={selectedCameraId} onClose={() => setSelectedCameraId(null)} />
          ) : zones && cameras ? (
            <ZoneLegendPanel
              zones={zones}
              cameras={cameras}
              activeZoneId={activeZoneId}
              onSelectZone={handleSelectZone}
            />
          ) : (
            <Skeleton className="h-full w-full" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function MapViewPage() {
  return (
    <Suspense fallback={null}>
      <MapViewContent />
    </Suspense>
  );
}
