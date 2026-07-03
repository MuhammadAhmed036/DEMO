import { Maximize2, Users } from "lucide-react";
import type { Camera } from "@/lib/types";
import { CameraThumbnail } from "@/components/cameras/CameraThumbnail";
import { cn } from "@/lib/utils";

export function CameraTile({
  camera,
  hasAlert,
  onExpand,
  livePeopleCount,
}: {
  camera: Camera | null;
  hasAlert?: boolean;
  onExpand?: () => void;
  /** Live person count from the detection API's people-count feed; `null`/`undefined` while no live reading has arrived yet. */
  livePeopleCount?: number | null;
}) {
  if (!camera) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-surface-border bg-surface-2 text-xs text-muted-foreground">
        No camera assigned
      </div>
    );
  }

  return (
    <CameraThumbnail
      seed={camera.thumbnailSeed}
      feedUrl={camera.proxy_feed_url ?? camera.proxyFeedUrl}
      playerUrl={camera.playerUrl}
      offline={camera.status === "offline"}
      className={cn(
        "group relative h-full w-full rounded-lg ring-1 ring-surface-border",
        hasAlert && "ring-2 ring-destructive"
      )}
    >
      <div className="absolute left-2 top-2 flex items-center gap-1.5">
        {camera.status === "online" && (
          <span className="rounded-md bg-status-active/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            LIVE
          </span>
        )}
        {hasAlert && (
          <span className="rounded-md bg-destructive/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            ALERT
          </span>
        )}
      </div>
      {camera.status === "online" && (
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] text-white">
          <Users className="size-3" /> {livePeopleCount ?? "—"}
        </div>
      )}
      <button
        onClick={onExpand}
        className="absolute right-2 bottom-2 flex size-6 items-center justify-center rounded-md bg-black/55 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
        aria-label="Expand"
      >
        <Maximize2 className="size-3.5" />
      </button>
      <div className="absolute bottom-2 left-2 right-9 truncate text-[11px] font-medium text-white/90">
        {camera.code} · {camera.zoneName}
      </div>
    </CameraThumbnail>
  );
}
