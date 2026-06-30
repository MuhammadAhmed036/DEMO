"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Camera, Zone } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function CameraPickerPanel({
  cameras,
  zones,
  selectedCameraIds,
  onToggle,
}: {
  cameras: Camera[];
  zones: Zone[];
  selectedCameraIds: Set<string>;
  onToggle: (cameraId: string) => void;
}) {
  const [tab, setTab] = useState<"all" | "selected">("all");
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = cameras.filter((c) => {
      if (tab === "selected" && !selectedCameraIds.has(c.id)) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    });
    const zoneById = new Map(
      zones.map((zone) => [zone.id, { id: zone.id, name: zone.name, color: zone.color }])
    );
    const groups = new Map<
      string,
      { zone: { id: string; name: string; color: string }; cameras: Camera[] }
    >();

    for (const camera of filtered) {
      const zone = zoneById.get(camera.zoneId) ?? {
        id: camera.zoneId,
        name: camera.zoneName,
        color: "#3b82f6",
      };
      const group = groups.get(zone.id) ?? { zone, cameras: [] };
      group.cameras.push(camera);
      groups.set(zone.id, group);
    }

    return Array.from(groups.values());
  }, [cameras, zones, tab, search, selectedCameraIds]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-surface-border p-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "selected")}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All Cameras</TabsTrigger>
            <TabsTrigger value="selected" className="flex-1">
              Selected ({selectedCameraIds.size})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative mt-2.5">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cameras..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {grouped.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No cameras found.</p>
        )}
        {grouped.map(({ zone, cameras: zoneCameras }) => (
          <div key={zone.id} className="mb-3">
            <div className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: zone.color }} />
              {zone.name} ({zoneCameras.length})
            </div>
            <div className="space-y-0.5">
              {zoneCameras.map((camera) => (
                <label
                  key={camera.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-surface-2",
                    selectedCameraIds.has(camera.id) && "bg-primary/10"
                  )}
                >
                  <Checkbox
                    checked={selectedCameraIds.has(camera.id)}
                    onCheckedChange={() => onToggle(camera.id)}
                  />
                  <span className="min-w-0 flex-1 truncate">{camera.name}</span>
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      camera.status === "online" ? "bg-status-active" : "bg-status-resolved"
                    )}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
