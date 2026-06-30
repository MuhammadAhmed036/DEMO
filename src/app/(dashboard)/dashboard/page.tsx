"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert, Users, Video, VideoOff, Wifi } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { MetricTrendCard } from "@/components/dashboard/MetricTrendCard";
import { LiveAlertsPanel } from "@/components/dashboard/LiveAlertsPanel";
import { MapCanvasLoader } from "@/components/map/MapCanvasLoader";
import { CameraInfoPanel } from "@/components/map/CameraInfoPanel";
import { Button } from "@/components/ui/button";
import { useDashboardStats, useTrend } from "@/lib/hooks/useDashboardStats";
import { useCameras } from "@/lib/hooks/useCameras";
import { useZoneBlobs, useZones } from "@/lib/hooks/useZones";
import { formatCompactNumber, formatNumber } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";

type PanelMode = "alerts" | "camera" | "closed";

export default function DashboardPage() {
  const { data: stats } = useDashboardStats();
  const { data: cameras } = useCameras();
  const { data: zones } = useZones();
  const { data: zoneBlobs } = useZoneBlobs();
  const { data: alertTrend } = useTrend("active-alert-trend");
  const { data: offlineTrend } = useTrend("offline-cameras-trend");
  const { data: personTrend } = useTrend("person-count-trend");

  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("alerts");

  const peakZone = useMemo(() => {
    if (!cameras || !zones) return null;
    const totals = new Map<string, number>();
    cameras.forEach((c) => totals.set(c.zoneId, (totals.get(c.zoneId) ?? 0) + c.currentPersonCount));
    let bestZoneId = zones[0]?.id;
    let bestValue = -1;
    totals.forEach((value, zoneId) => {
      if (value > bestValue) {
        bestValue = value;
        bestZoneId = zoneId;
      }
    });
    const zone = zones.find((z) => z.id === bestZoneId);
    return zone ? { zone, persons: bestValue } : null;
  }, [cameras, zones]);

  const highestDensityCamera = useMemo(() => {
    if (!cameras) return null;
    return [...cameras]
      .filter((c) => c.status === "online")
      .sort((a, b) => b.densityPercent - a.densityPercent)[0];
  }, [cameras]);

  function handleSelectCamera(id: string) {
    setSelectedCameraId(id);
    setPanelMode("camera");
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={Video}
          label="Total Cameras"
          value={stats ? formatNumber(stats.totalCameras) : "—"}
          href="/cameras"
          hrefLabel="View all cameras"
        />
        <StatCard
          icon={Wifi}
          label="Active Cameras"
          value={stats ? formatNumber(stats.activeCameras) : "—"}
          trend={stats ? Math.round((stats.activeCameras / stats.totalCameras) * 1000) / 10 : undefined}
          trendLabel="Online"
        />
        <StatCard
          icon={VideoOff}
          iconClassName="bg-destructive/15 text-destructive"
          label="Offline Cameras"
          value={stats ? formatNumber(stats.offlineCameras) : "—"}
          trend={stats?.offlineCamerasTrendPercent}
          trendLabel="vs yesterday"
        />
        <StatCard
          icon={Users}
          label="Total Persons Detected"
          value={stats ? formatCompactNumber(stats.totalPersonsToday) : "—"}
          trend={stats?.personsTrendPercent}
          trendLabel="Today"
        />
        <StatCard
          icon={AlertTriangle}
          iconClassName="bg-severity-high/15 text-severity-high"
          label="Active Alerts"
          value={stats ? formatNumber(stats.activeAlerts) : "—"}
          href="/alerts"
          hrefLabel="View alerts"
        />
        <StatCard
          icon={ShieldAlert}
          iconClassName="bg-severity-critical/15 text-severity-critical"
          label="Critical Alerts"
          value={stats ? formatNumber(stats.criticalAlerts) : "—"}
          href="/alerts?severity=critical"
          hrefLabel="View critical"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="h-[420px] overflow-hidden rounded-xl border border-surface-border sm:h-[520px] lg:h-[600px]">
          {cameras && zones ? (
            <MapCanvasLoader
              cameras={cameras}
              zones={zones}
              zoneBlobs={zoneBlobs}
              selectedCameraId={selectedCameraId}
              onSelectCamera={handleSelectCamera}
            />
          ) : (
            <Skeleton className="h-full w-full" />
          )}
        </div>

        <div className="h-[420px] overflow-hidden rounded-xl border border-surface-border sm:h-[520px] lg:h-[600px]">
          {panelMode === "camera" && selectedCameraId ? (
            <CameraInfoPanel
              cameraId={selectedCameraId}
              onClose={() => {
                setSelectedCameraId(null);
                setPanelMode("alerts");
              }}
            />
          ) : panelMode === "alerts" ? (
            <LiveAlertsPanel
              onViewCamera={handleSelectCamera}
              onClose={() => setPanelMode("closed")}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">Alerts panel is closed.</p>
              <Button size="sm" onClick={() => setPanelMode("alerts")}>
                Show Live Alerts
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {peakZone && personTrend && (
          <MetricTrendCard
            label="Peak Crowd Zone"
            badge="High"
            badgeTone="high"
            value={peakZone.zone.shortName}
            subLabel={`${formatNumber(peakZone.persons)} Persons`}
            chartData={personTrend}
            chartColor="#a855f7"
          />
        )}
        {highestDensityCamera && personTrend && (
          <MetricTrendCard
            label="Highest Density Camera"
            badge="Critical"
            badgeTone="critical"
            value={highestDensityCamera.code}
            subLabel={`${highestDensityCamera.zoneName} · ${highestDensityCamera.currentPersonCount} Persons`}
            chartData={personTrend}
            chartColor="#ef4444"
          />
        )}
        {alertTrend && (
          <MetricTrendCard
            label="Active Alert Trend (24H)"
            badge="+12%"
            badgeTone="negative"
            value={stats?.activeAlerts ?? "—"}
            valueSuffix="Alerts"
            chartData={alertTrend}
            chartColor="#f97316"
          />
        )}
        {offlineTrend && (
          <MetricTrendCard
            label="Offline Cameras"
            badge="-3%"
            badgeTone="positive"
            value={stats?.offlineCameras ?? "—"}
            valueSuffix="Cameras"
            chartData={offlineTrend}
            chartColor="#3b82f6"
          />
        )}
      </div>
    </div>
  );
}
