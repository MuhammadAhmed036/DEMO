"use client";

import { useMemo } from "react";
import { Activity, Users } from "lucide-react";
import { useCameraLiveFeed } from "@/lib/hooks/useCameraLiveFeed";
import { useCameraPeopleCountSeries } from "@/lib/hooks/useCameraLocations";
import { MiniTrendChart } from "@/components/dashboard/MiniTrendChart";
import { Skeleton } from "@/components/ui/skeleton";
import { densityTierBadgeTone, densityTierFromCount } from "@/lib/density";
import { formatTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<string, string> = {
  default: "bg-surface-3 text-muted-foreground",
  critical: "bg-severity-critical/15 text-severity-critical",
  high: "bg-severity-high/15 text-severity-high",
  positive: "bg-status-active/15 text-status-active",
};

export function CameraLiveStatsPanel({ cameraId }: { cameraId: string }) {
  const feed = useCameraLiveFeed(cameraId);
  const { data: series, isLoading: seriesLoading } = useCameraPeopleCountSeries(cameraId);

  const chartData = useMemo(
    () => series?.map((p) => ({ label: formatTime(p.time), value: p.peopleCount })),
    [series]
  );

  const tier = densityTierFromCount(feed.peopleCount ?? 0);

  return (
    <div className="rounded-xl border border-surface-border bg-surface-2 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-medium">
          <Activity className="size-4" /> Live Occupancy
        </h3>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span
            className={cn("size-1.5 rounded-full", feed.connected ? "animate-pulse bg-red-500" : "bg-gray-400")}
          />
          {feed.connected ? "Live" : "Connecting…"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-surface-border bg-surface-1 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Users className="size-3.5" /> Current Persons
          </div>
          <div className="mt-1 text-xl font-semibold">{feed.peopleCount ?? "—"}</div>
        </div>
        <div className="rounded-lg border border-surface-border bg-surface-1 p-2.5">
          <div className="text-[11px] text-muted-foreground">Density</div>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
              TONE_CLASS[densityTierBadgeTone(tier)]
            )}
          >
            {tier}
          </span>
        </div>
      </div>

      <div className="mt-2.5 text-[11px] text-muted-foreground">
        Last detection: {feed.lastDetectionTime ? formatTime(feed.lastDetectionTime) : "—"}
      </div>

      <div className="mt-3">
        <div className="mb-1 text-[11px] font-medium text-muted-foreground">Last 2 Hours</div>
        {seriesLoading ? (
          <Skeleton className="h-[70px] w-full" />
        ) : chartData && chartData.length > 0 ? (
          <MiniTrendChart data={chartData} color={"#3b82f6"} variant="area" height={70} />
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">No history in this window.</p>
        )}
      </div>

      {feed.error && <p className="mt-2 text-xs text-destructive">{feed.error}</p>}
    </div>
  );
}
