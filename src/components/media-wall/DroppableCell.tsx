"use client";

import { useDroppable } from "@dnd-kit/core";
import { X } from "lucide-react";
import type { Camera } from "@/lib/types";
import { CameraThumbnail } from "@/components/cameras/CameraThumbnail";
import { cn } from "@/lib/utils";

export function DroppableCell({
  index,
  camera,
  onClear,
}: {
  index: number;
  camera: Camera | null;
  onClear: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${index}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex h-full min-h-[100px] items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-surface-border bg-surface-2 transition-colors",
        isOver && "border-primary bg-primary/10"
      )}
    >
      <span className="absolute left-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded bg-black/50 text-[10px] font-medium text-white">
        {index + 1}
      </span>
      {camera ? (
        <CameraThumbnail seed={camera.thumbnailSeed} offline={camera.status === "offline"} className="h-full w-full">
          <button
            onClick={onClear}
            className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded bg-black/55 text-white hover:bg-black/70"
            aria-label="Remove camera"
          >
            <X className="size-3" />
          </button>
          <div className="absolute bottom-1.5 left-1.5 right-1.5 truncate text-[11px] font-medium text-white/90">
            {camera.code}
          </div>
        </CameraThumbnail>
      ) : (
        <span className="px-2 text-center text-xs text-muted-foreground">
          Select camera or drop camera here
        </span>
      )}
    </div>
  );
}
