import Link from "next/link";
import { Users } from "lucide-react";
import type { Camera } from "@/lib/types";
import { CameraThumbnail } from "@/components/cameras/CameraThumbnail";
import { densityTextClass } from "@/lib/density";
import { cn } from "@/lib/utils";

export function CameraCard({ camera }: { camera: Camera }) {
  return (
    <Link
      href={`/cameras/${camera.id}`}
      className="group overflow-hidden rounded-xl border border-surface-border bg-surface-2 transition-colors hover:border-primary/40"
    >
      <CameraThumbnail seed={camera.thumbnailSeed} offline={camera.status === "offline"} className="aspect-video w-full">
        <span
          className={cn(
            "absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white",
            camera.status === "online" ? "bg-status-active/90" : "bg-status-resolved/90"
          )}
        >
          {camera.status === "online" ? "LIVE" : "OFFLINE"}
        </span>
        {camera.status === "online" && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] text-white">
            <Users className="size-3" /> {camera.currentPersonCount}
          </span>
        )}
      </CameraThumbnail>
      <div className="p-3">
        <div className="truncate text-sm font-medium group-hover:text-primary">{camera.name}</div>
        <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{camera.code} · {camera.zoneName}</span>
          <span className={cn("shrink-0 font-medium", densityTextClass(camera.density))}>
            {camera.density}
          </span>
        </div>
      </div>
    </Link>
  );
}
