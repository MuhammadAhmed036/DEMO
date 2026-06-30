"use client";

import { useMemo } from "react";
import type { Camera, Zone } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ZoneLegendPanel({
  zones,
  cameras,
  activeZoneId,
  onSelectZone,
}: {
  zones: Zone[];
  cameras: Camera[];
  activeZoneId: string | null;
  onSelectZone: (zone: Zone) => void;
}) {
  const totalsByZone = useMemo(() => {
    const map = new Map<string, { persons: number; online: number; offline: number }>();
    zones.forEach((z) => map.set(z.id, { persons: 0, online: 0, offline: 0 }));
    cameras.forEach((c) => {
      const entry = map.get(c.zoneId);
      if (!entry) return;
      entry.persons += c.currentPersonCount;
      if (c.status === "online") entry.online += 1;
      else entry.offline += 1;
    });
    return map;
  }, [zones, cameras]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-surface-border p-3">
        <h3 className="text-sm font-semibold">Operational Zones</h3>
        <p className="text-xs text-muted-foreground">{zones.length} zones · {cameras.length} cameras</p>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {zones.map((zone) => {
          const totals = totalsByZone.get(zone.id);
          return (
            <button
              key={zone.id}
              onClick={() => onSelectZone(zone)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
                activeZoneId === zone.id
                  ? "border-primary bg-primary/10"
                  : "border-surface-border bg-surface-2 hover:bg-surface-3"
              )}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: zone.color }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{zone.name}</div>
                <div className="text-xs text-muted-foreground">
                  {zone.cameraCount} cameras · {totals?.persons ?? 0} persons
                </div>
              </div>
              {totals && totals.offline > 0 && (
                <span className="shrink-0 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                  {totals.offline} off
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
