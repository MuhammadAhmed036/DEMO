"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Camera as CameraIcon, Gauge, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { MiniTrendChart } from "@/components/dashboard/MiniTrendChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useCameras } from "@/lib/hooks/useCameras";
import { useZones } from "@/lib/hooks/useZones";
import { useLiveAlertFeed } from "@/lib/hooks/useAlerts";
import { useTrend } from "@/lib/hooks/useDashboardStats";
import { formatCompactNumber, formatNumber } from "@/lib/formatters";
import { SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/mock/alert-types";

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
};

export default function AnalyticsPage() {
  const { data: cameras } = useCameras();
  const { data: zones } = useZones();
  const { data: liveAlerts } = useLiveAlertFeed();
  const { data: peopleTrend } = useTrend("people-count-today");

  const totalPersons = useMemo(
    () => (cameras ?? []).reduce((sum, c) => sum + c.currentPersonCount, 0),
    [cameras]
  );
  const avgDensity = useMemo(() => {
    const online = (cameras ?? []).filter((c) => c.status === "online");
    if (online.length === 0) return 0;
    return Math.round(online.reduce((s, c) => s + c.densityPercent, 0) / online.length);
  }, [cameras]);
  const uptimePercent = useMemo(() => {
    if (!cameras || cameras.length === 0) return 0;
    return Math.round((cameras.filter((c) => c.status === "online").length / cameras.length) * 1000) / 10;
  }, [cameras]);

  const severityData = useMemo(
    () =>
      SEVERITY_ORDER.map((s) => ({
        name: SEVERITY_LABEL[s],
        value: (liveAlerts ?? []).filter((a) => a.severity === s).length,
        fill: SEVERITY_COLOR[s],
      })),
    [liveAlerts]
  );

  const busiestZones = useMemo(() => {
    if (!zones || !cameras) return [];
    const totals = new Map<string, number>();
    cameras.forEach((c) => totals.set(c.zoneId, (totals.get(c.zoneId) ?? 0) + c.currentPersonCount));
    return zones
      .map((z) => ({ zone: z, persons: totals.get(z.id) ?? 0 }))
      .sort((a, b) => b.persons - a.persons);
  }, [zones, cameras]);

  const maxZonePersons = busiestZones[0]?.persons || 1;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader title="Analytics" description="City-wide trends and insights across zones and cameras" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Persons (Live)" value={formatCompactNumber(totalPersons)} />
        <StatCard icon={Gauge} label="Avg Crowd Density" value={`${avgDensity}%`} />
        <StatCard
          icon={AlertTriangle}
          iconClassName="bg-severity-high/15 text-severity-high"
          label="Active Alerts"
          value={formatNumber(liveAlerts?.length ?? 0)}
        />
        <StatCard icon={CameraIcon} label="Camera Uptime" value={`${uptimePercent}%`} />
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
        <h3 className="mb-1 text-sm font-medium">People Traffic Trend (Today)</h3>
        <p className="mb-2 text-xs text-muted-foreground">Aggregated person detections across all online cameras</p>
        {peopleTrend ? (
          <MiniTrendChart data={peopleTrend} color="#3b82f6" variant="area" height={220} showAxis showGrid />
        ) : (
          <Skeleton className="h-[220px] w-full" />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
          <h3 className="mb-3 text-sm font-medium">Active Alerts by Severity</h3>
          {liveAlerts ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={severityData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--surface-border)", borderRadius: 8, fontSize: 12 }}
                  cursor={{ fill: "var(--surface-3)" }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-[220px] w-full" />
          )}
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
          <h3 className="mb-3 text-sm font-medium">Busiest Zones (Live)</h3>
          <div className="space-y-3">
            {busiestZones.length === 0 && <Skeleton className="h-[180px] w-full" />}
            {busiestZones.map(({ zone, persons }) => (
              <div key={zone.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: zone.color }} />
                    {zone.name}
                  </span>
                  <span className="text-muted-foreground">{persons} persons</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(4, (persons / maxZonePersons) * 100)}%`,
                      backgroundColor: zone.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
