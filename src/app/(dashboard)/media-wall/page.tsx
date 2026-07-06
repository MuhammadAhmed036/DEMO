"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Save, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GridLayoutSwitch, gridDimensions } from "@/components/media-wall/GridLayoutSwitch";
import { CameraTile } from "@/components/media-wall/CameraTile";
import { CameraPickerPanel } from "@/components/media-wall/CameraPickerPanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCameras } from "@/lib/hooks/useCameras";
import { useZones } from "@/lib/hooks/useZones";
import { useLiveAlertFeed } from "@/lib/hooks/useAlerts";
import { useLiveCameraOccupancy } from "@/lib/hooks/useLiveCameraOccupancy";
import { useUIStore } from "@/lib/store/useUIStore";
import { resolveDetectionCameraId } from "@/lib/streamToDetectionCameraId";
import type { GridLayoutKey } from "@/lib/types";

export default function MediaWallPage() {
  const { data: cameras } = useCameras();
  const { data: zones } = useZones();
  const { data: liveAlerts } = useLiveAlertFeed();
  const liveOccupancy = useLiveCameraOccupancy();

  const layout = useUIStore((s) => s.mediaWallLayout);
  const setLayout = useUIStore((s) => s.setMediaWallLayout);
  const assignments = useUIStore((s) => s.mediaWallAssignments);
  const assignCameraToCell = useUIStore((s) => s.assignCameraToCell);
  const clearMediaWallAssignments = useUIStore((s) => s.clearMediaWallAssignments);
  const addCameraToWall = useUIStore((s) => s.addCameraToWall);
  const removeCameraFromWall = useUIStore((s) => s.removeCameraFromWall);

  const dims = gridDimensions(layout);
  const cellCount = dims * dims;

  const cameraById = useMemo(() => {
    const map = new Map(cameras?.map((c) => [c.id, c]));
    return map;
  }, [cameras]);

  // The live people-count feed keys by the detection API's camera_id, while
  // this page's camera list comes from the separate live-stream API — the
  // two share the same camera names in practice, so match case-insensitively.
  const livePeopleCountByName = useMemo(() => {
    const map = new Map<string, number>();
    Object.values(liveOccupancy).forEach((entry) => {
      map.set(entry.cameraId.toLowerCase(), entry.peopleCount);
    });
    return map;
  }, [liveOccupancy]);

  const alertCameraIds = useMemo(
    () => new Set((liveAlerts ?? []).map((a) => a.cameraId)),
    [liveAlerts]
  );

  const selectedCameraIds = useMemo(
    () => new Set(assignments.map((a) => a.cameraId).filter(Boolean) as string[]),
    [assignments]
  );

  useEffect(() => {
    if (!cameras?.length) return;
    const cameraIds = new Set(cameras.map((camera) => camera.id));
    const hasValidAssignment = assignments.some(
      (assignment) => assignment.cameraId && cameraIds.has(assignment.cameraId)
    );
    if (hasValidAssignment) return;

    // Default the wall to cameras that are actually online — offline/broken
    // ones can still be added manually from the picker panel on the right.
    const workingCameras = cameras.filter((camera) => camera.status === "online");
    const autoCameras = workingCameras.length > 0 ? workingCameras : cameras;

    clearMediaWallAssignments();
    const autoLayout: GridLayoutKey =
      autoCameras.length > 9 ? "4x4" : autoCameras.length > 4 ? "3x3" : "2x2";
    setLayout(autoLayout);
    const autoCellCount = gridDimensions(autoLayout) ** 2;
    autoCameras
      .slice(0, autoCellCount)
      .forEach((camera, index) => assignCameraToCell(index, camera.id));
  }, [
    cameras,
    assignments,
    assignCameraToCell,
    clearMediaWallAssignments,
    setLayout,
  ]);

  function handleToggleCamera(cameraId: string) {
    if (selectedCameraIds.has(cameraId)) removeCameraFromWall(cameraId);
    else addCameraToWall(cameraId, cellCount);
  }

  return (
    <div className="flex h-[calc(100vh-4rem-2.25rem)] flex-col">
      <PageHeader
        title="Media Wall"
        description="Real-time camera feeds and monitoring"
        actions={
          <>
            <GridLayoutSwitch
              value={layout}
              onChange={(v: GridLayoutKey) => setLayout(v)}
              options={["2x2", "3x3", "4x4"]}
            />
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href="/media-wall/configure">
                <Settings2 className="size-4" /> Configure
              </Link>
            </Button>
            <Button size="sm" className="gap-1.5">
              <Save className="size-4" /> Save Layout
            </Button>
          </>
        }
      />

      <div className="grid flex-1 gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_320px]">
        <div
          className="grid flex-1 gap-2"
          style={{
            gridTemplateColumns: `repeat(${dims}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${dims}, minmax(0, 1fr))`,
          }}
        >
          {!cameras &&
            Array.from({ length: cellCount }).map((_, i) => <Skeleton key={i} className="h-full w-full rounded-lg" />)}
          {cameras &&
            Array.from({ length: cellCount }).map((_, i) => {
              const assignment = assignments.find((a) => a.cellIndex === i);
              const camera = assignment?.cameraId ? cameraById.get(assignment.cameraId) ?? null : null;
              const livePeopleCount = camera
                ? (livePeopleCountByName.get(
                    resolveDetectionCameraId(camera.sourceName ?? camera.code).toLowerCase()
                  ) ?? null)
                : null;
              return (
                <div key={i} className="min-h-[90px]">
                  <CameraTile
                    camera={camera}
                    hasAlert={camera ? alertCameraIds.has(camera.id) : false}
                    livePeopleCount={livePeopleCount}
                  />
                </div>
              );
            })}
        </div>

        <div className="h-[420px] overflow-hidden rounded-xl border border-surface-border lg:h-full">
          {cameras && zones ? (
            <CameraPickerPanel
              cameras={cameras}
              zones={zones}
              selectedCameraIds={selectedCameraIds}
              onToggle={handleToggleCamera}
            />
          ) : (
            <Skeleton className="h-full w-full" />
          )}
        </div>
      </div>
    </div>
  );
}
