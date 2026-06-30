"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ZoneCard } from "@/components/zones/ZoneCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useZones } from "@/lib/hooks/useZones";
import { useCameras } from "@/lib/hooks/useCameras";
import { useLiveAlertFeed } from "@/lib/hooks/useAlerts";

export default function ZonesPage() {
  const { data: zones, isLoading } = useZones();
  const { data: cameras } = useCameras();
  const { data: liveAlerts } = useLiveAlertFeed();

  const zoneStats = useMemo(() => {
    const map = new Map<string, { online: number; offline: number; persons: number; alerts: number }>();
    zones?.forEach((z) => map.set(z.id, { online: 0, offline: 0, persons: 0, alerts: 0 }));
    cameras?.forEach((c) => {
      const entry = map.get(c.zoneId);
      if (!entry) return;
      if (c.status === "online") entry.online += 1;
      else entry.offline += 1;
      entry.persons += c.currentPersonCount;
    });
    liveAlerts?.forEach((a) => {
      const entry = map.get(a.zoneId);
      if (entry) entry.alerts += 1;
    });
    return map;
  }, [zones, cameras, liveAlerts]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Zones"
        description="Operational zones across Islamabad and their current activity"
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      )}

      {zones && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {zones.map((zone) => {
            const stats = zoneStats.get(zone.id) ?? { online: 0, offline: 0, persons: 0, alerts: 0 };
            return (
              <ZoneCard
                key={zone.id}
                zone={zone}
                onlineCameras={stats.online}
                offlineCameras={stats.offline}
                totalPersons={stats.persons}
                activeAlerts={stats.alerts}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
