"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Info, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GridLayoutSwitch, gridDimensions } from "@/components/media-wall/GridLayoutSwitch";
import { DroppableCell } from "@/components/media-wall/DroppableCell";
import { CameraLibraryPanel } from "@/components/media-wall/CameraLibraryPanel";
import { CameraThumbnail } from "@/components/cameras/CameraThumbnail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCameras } from "@/lib/hooks/useCameras";
import { useZones } from "@/lib/hooks/useZones";
import { useUIStore } from "@/lib/store/useUIStore";
import type { Camera, GridLayoutKey } from "@/lib/types";

export default function MediaWallConfigurePage() {
  const { data: cameras } = useCameras();
  const { data: zones } = useZones();

  const layout = useUIStore((s) => s.mediaWallLayout);
  const setLayout = useUIStore((s) => s.setMediaWallLayout);
  const assignments = useUIStore((s) => s.mediaWallAssignments);
  const assignCameraToCell = useUIStore((s) => s.assignCameraToCell);
  const clearMediaWallAssignments = useUIStore((s) => s.clearMediaWallAssignments);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [activeDragCamera, setActiveDragCamera] = useState<Camera | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const dims = gridDimensions(layout);
  const cellCount = dims * dims;

  const cameraById = useMemo(() => new Map(cameras?.map((c) => [c.id, c])), [cameras]);
  const assignedCameraIds = useMemo(
    () => new Set(assignments.map((a) => a.cameraId).filter(Boolean) as string[]),
    [assignments]
  );

  function toggleFavorite(cameraId: string) {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(cameraId)) next.delete(cameraId);
      else next.add(cameraId);
      return next;
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const camera = event.active.data.current?.camera as Camera | undefined;
    setActiveDragCamera(camera ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragCamera(null);
    const { active, over } = event;
    if (!over) return;
    const cameraId = String(active.id).replace("camera-", "");
    const cellIndex = Number(String(over.id).replace("cell-", ""));
    if (Number.isNaN(cellIndex)) return;
    assignCameraToCell(cellIndex, cameraId);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-4rem-2.25rem)] flex-col">
        <PageHeader
          title="Media Wall"
          description="Configure your grid layout and assign cameras"
          actions={
            <>
              <GridLayoutSwitch value={layout} onChange={(v: GridLayoutKey) => setLayout(v)} />
              <Button variant="outline" size="sm" className="gap-1.5" onClick={clearMediaWallAssignments}>
                <RotateCcw className="size-4" /> Reset
              </Button>
            </>
          }
        />

        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm text-primary">
            <Info className="mt-0.5 size-4 shrink-0" />
            Select a grid layout above, then drag and drop cameras from the right panel into any grid
            cell.
          </div>

          <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_320px]">
            {!cameras ? (
              <Skeleton className="h-[480px] w-full rounded-xl" />
            ) : (
              <div
                className="grid auto-rows-[120px] gap-3"
                style={{ gridTemplateColumns: `repeat(${dims}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: cellCount }).map((_, i) => {
                  const assignment = assignments.find((a) => a.cellIndex === i);
                  const camera = assignment?.cameraId ? cameraById.get(assignment.cameraId) ?? null : null;
                  return (
                    <DroppableCell
                      key={i}
                      index={i}
                      camera={camera}
                      onClear={() => assignCameraToCell(i, null)}
                    />
                  );
                })}
              </div>
            )}

            <div className="h-[420px] overflow-hidden rounded-xl border border-surface-border lg:h-auto">
              {cameras && zones ? (
                <CameraLibraryPanel
                  cameras={cameras}
                  zones={zones}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={toggleFavorite}
                  assignedCameraIds={assignedCameraIds}
                />
              ) : (
                <Skeleton className="h-full w-full" />
              )}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeDragCamera && (
          <div className="flex w-48 items-center gap-2 rounded-md border border-primary bg-surface-2 px-2 py-1.5 shadow-lg">
            <CameraThumbnail
              seed={activeDragCamera.thumbnailSeed}
              feedUrl={activeDragCamera.proxy_feed_url ?? activeDragCamera.proxyFeedUrl}
              playerUrl={activeDragCamera.playerUrl}
              offline={activeDragCamera.status === "offline"}
              className="size-8 shrink-0 rounded"
            />
            <span className="truncate text-xs font-medium">{activeDragCamera.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
