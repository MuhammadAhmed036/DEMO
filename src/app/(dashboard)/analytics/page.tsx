"use client";

import { useMemo } from "react";
import { AlertTriangle, BellRing, Gauge, Radio, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { MiniTrendChart } from "@/components/dashboard/MiniTrendChart";
import { CameraDensityChart } from "@/components/analytics/CameraDensityChart";
import { AlertStatusChart } from "@/components/analytics/AlertStatusChart";
import { AlertCategoryBadge } from "@/components/alerts/AlertCategoryBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCameraLocations,
  useAggregatePeopleCountSeries,
  useCameraDensityLastHour,
} from "@/lib/hooks/useCameraLocations";
import { useLiveCameraOccupancy } from "@/lib/hooks/useLiveCameraOccupancy";
import { useAlertRules, useAlertStats, useUnseenAlertMatchCount } from "@/lib/hooks/useAlertRules";
import { useAlertSeenBaselineStore } from "@/lib/store/useAlertSeenBaselineStore";
import { effectiveUnseenCount } from "@/lib/alertUnseen";
import { densityTierFromCount } from "@/lib/density";
import { zoneColor } from "@/components/map/CameraLocationMap";
import { formatNumber, formatTime } from "@/lib/formatters";

export default function AnalyticsPage() {
  const { data: cameras } = useCameraLocations();
  const liveOccupancy = useLiveCameraOccupancy();
  const { data: alertStats } = useAlertStats();
  const { data: rules } = useAlertRules();
  const unseenMatchCount = useUnseenAlertMatchCount();
  const baselines = useAlertSeenBaselineStore((s) => s.baselines);

  const cameraIds = useMemo(() => cameras?.map((c) => c.cameraId) ?? [], [cameras]);
  const { data: aggregateSeries, isLoading: seriesLoading } = useAggregatePeopleCountSeries(cameraIds);
  const { data: densityLastHour, isLoading: densityLastHourLoading } = useCameraDensityLastHour(cameras);

  const occupancyEntries = useMemo(() => Object.values(liveOccupancy), [liveOccupancy]);

  const totalPersons = useMemo(
    () => occupancyEntries.reduce((sum, e) => sum + e.peopleCount, 0),
    [occupancyEntries]
  );

  const reportingCount = occupancyEntries.length;
  const totalCameraCount = cameras?.length ?? 0;
  const reportingPercent =
    totalCameraCount > 0 ? Math.round((reportingCount / totalCameraCount) * 100) : 0;

  const avgDensityLabel = useMemo(() => {
    if (occupancyEntries.length === 0) return "—";
    const avg = totalPersons / occupancyEntries.length;
    return densityTierFromCount(Math.round(avg));
  }, [occupancyEntries, totalPersons]);

  const densityChartData = useMemo(
    () => occupancyEntries.map((e) => ({ cameraName: e.cameraName, peopleCount: e.peopleCount })),
    [occupancyEntries]
  );

  const peopleTrend = useMemo(
    () => aggregateSeries?.map((p) => ({ label: formatTime(p.time), value: p.peopleCount })),
    [aggregateSeries]
  );

  const busiestZones = useMemo(() => {
    const totals = new Map<string, number>();
    occupancyEntries.forEach((e) => {
      if (!e.zone) return;
      totals.set(e.zone, (totals.get(e.zone) ?? 0) + e.peopleCount);
    });
    return Array.from(totals.entries())
      .map(([zone, persons]) => ({ zone, persons }))
      .sort((a, b) => b.persons - a.persons);
  }, [occupancyEntries]);
  const maxZonePersons = busiestZones[0]?.persons || 1;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Analytics"
        description="Live, real-time trends across cameras, zones and alert rules"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Persons (Live)" value={formatNumber(totalPersons)} />
        <StatCard icon={Gauge} label="Avg Density" value={avgDensityLabel} />
        <StatCard
          icon={AlertTriangle}
          iconClassName="bg-severity-high/15 text-severity-high"
          label="Active Alert Rules"
          value={formatNumber(alertStats?.byStatus.active ?? 0)}
        />
        <StatCard
          icon={BellRing}
          iconClassName="bg-severity-critical/15 text-severity-critical"
          label="Unseen Alert Matches"
          value={formatNumber(unseenMatchCount)}
        />
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">People Traffic Trend</h3>
            <p className="text-xs text-muted-foreground">
              Aggregated live person count across all cameras, last 2 hours
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Radio className="size-3.5" /> {reportingCount}/{totalCameraCount} reporting ({reportingPercent}%)
          </span>
        </div>
        {seriesLoading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : peopleTrend && peopleTrend.length > 0 ? (
          <MiniTrendChart data={peopleTrend} color="#3b82f6" variant="area" height={220} showAxis showGrid />
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No people-count history in this window yet.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
        <h3 className="mb-1 text-sm font-medium">Camera Density (Live)</h3>
        <p className="mb-2 text-xs text-muted-foreground">
          Current person count per camera, colored by crowd tier — Clear / Low / Medium / High / Critical
        </p>
        {densityChartData.length > 0 ? (
          <CameraDensityChart data={densityChartData} />
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Waiting for live detections from cameras…
          </p>
        )}
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
        <h3 className="mb-1 text-sm font-medium">Camera Density — Last Hour (Peak)</h3>
        <p className="mb-2 text-xs text-muted-foreground">
          Highest person count each camera reached in the last hour — answers which camera ran
          busiest vs. quietest recently, not just right now
        </p>
        {densityLastHourLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : densityLastHour && densityLastHour.length > 0 ? (
          <CameraDensityChart data={densityLastHour} />
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No people-count history in the last hour yet.
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
          <h3 className="mb-3 text-sm font-medium">Alert Rules by Status</h3>
          {alertStats ? (
            <AlertStatusChart byStatus={alertStats.byStatus} />
          ) : (
            <Skeleton className="h-[220px] w-full" />
          )}
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
          <h3 className="mb-3 text-sm font-medium">Busiest Zones (Live)</h3>
          <div className="space-y-3">
            {busiestZones.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No live occupancy reported for any zone yet.
              </p>
            )}
            {busiestZones.map(({ zone, persons }) => (
              <div key={zone}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium capitalize">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: zoneColor(zone) }} />
                    {zone}
                  </span>
                  <span className="text-muted-foreground">{persons} persons</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(4, (persons / maxZonePersons) * 100)}%`,
                      backgroundColor: zoneColor(zone),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
        <h3 className="mb-1 text-sm font-medium">Alert Rules Overview</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Every configured region alert, ranked by unread matches
        </p>
        <div className="space-y-1.5">
          {(rules ?? [])
            .map((rule) => ({
              rule,
              unseen: effectiveUnseenCount(rule, baselines[rule.alertId] ?? 0),
            }))
            .sort((a, b) => b.unseen - a.unseen)
            .slice(0, 8)
            .map(({ rule, unseen }) => (
              <div
                key={rule.alertId}
                className="flex items-center justify-between gap-2 rounded-md border border-surface-border bg-surface-1 px-3 py-2 text-xs"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{rule.name ?? rule.alertId}</span>
                <span className="shrink-0 text-muted-foreground">{rule.cameraId}</span>
                <AlertCategoryBadge category={rule.category} className="shrink-0" />
                <span className="shrink-0 capitalize text-muted-foreground">{rule.status}</span>
                <span
                  className={
                    unseen > 0
                      ? "shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 font-medium text-destructive"
                      : "shrink-0 text-muted-foreground"
                  }
                >
                  {unseen} new
                </span>
              </div>
            ))}
          {(!rules || rules.length === 0) && (
            <p className="py-6 text-center text-sm text-muted-foreground">No alert rules configured yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
