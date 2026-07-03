"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert, Users, Video, VideoOff, Wifi } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { MetricTrendCard } from "@/components/dashboard/MetricTrendCard";
import { LiveAlertRulesPanel } from "@/components/dashboard/LiveAlertRulesPanel";
import { CameraLocationMapLoader } from "@/components/map/CameraLocationMapLoader";
import { CameraLiveInfoPanel } from "@/components/map/CameraLiveInfoPanel";
import { Button } from "@/components/ui/button";
import { useDashboardStats, useTrend } from "@/lib/hooks/useDashboardStats";
import { useCameras } from "@/lib/hooks/useCameras";
import {
  useCameraLocations,
  useCameraPeopleCountSeries,
  useUpdateCameraLocation,
} from "@/lib/hooks/useCameraLocations";
import { useLiveCameraOccupancy } from "@/lib/hooks/useLiveCameraOccupancy";
import { useAlertStats, useUnseenAlertMatchCount } from "@/lib/hooks/useAlertRules";
import { useZones } from "@/lib/hooks/useZones";
import { densityTierBadgeTone, densityTierColor, densityTierFromCount } from "@/lib/density";
import { formatCompactNumber, formatNumber, formatTime } from "@/lib/formatters";

type PanelMode = "alerts" | "camera" | "closed";

export default function DashboardPage() {
  const { data: stats } = useDashboardStats();
  const { data: cameras } = useCameras();
  const { data: zones } = useZones();
  const { data: cameraLocations } = useCameraLocations();
  const updateLocation = useUpdateCameraLocation();
  const { data: alertStats } = useAlertStats();
  const unseenMatchCount = useUnseenAlertMatchCount();
  const liveOccupancy = useLiveCameraOccupancy();
  const { data: alertTrend } = useTrend("active-alert-trend");
  const { data: offlineTrend } = useTrend("offline-cameras-trend");
  const { data: personTrend } = useTrend("person-count-trend");

  const [selectedLocationCameraId, setSelectedLocationCameraId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("alerts");
  const activeCameraCount = cameras?.filter((camera) => camera.status === "online").length;

  const selectedCameraLocation = useMemo(
    () => cameraLocations?.find((c) => c.cameraId === selectedLocationCameraId) ?? null,
    [cameraLocations, selectedLocationCameraId]
  );

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

  const highestOccupancy = useMemo(() => {
    const entries = Object.values(liveOccupancy);
    if (entries.length === 0) return null;
    return [...entries].sort((a, b) => b.peopleCount - a.peopleCount)[0];
  }, [liveOccupancy]);

  const { data: highestOccupancySeries } = useCameraPeopleCountSeries(
    highestOccupancy?.cameraId ?? null
  );
  const highestOccupancyTrend = useMemo(
    () => highestOccupancySeries?.map((p) => ({ label: formatTime(p.time), value: p.peopleCount })),
    [highestOccupancySeries]
  );

  function handleSelectCamera(cameraId: string) {
    setSelectedLocationCameraId(cameraId);
    setPanelMode("camera");
  }

  function persistCameraLocation(cameraId: string, latitude: number, longitude: number) {
    updateLocation.mutate({ cameraId, latitude, longitude });
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={Video}
          label="Total Cameras"
          value={cameras ? formatNumber(cameras.length) : stats ? formatNumber(stats.totalCameras) : "—"}
          href="/cameras"
          hrefLabel="View all cameras"
        />
        <StatCard
          icon={Wifi}
          label="Active Cameras"
          value={
            activeCameraCount !== undefined
              ? formatNumber(activeCameraCount)
              : stats
                ? formatNumber(stats.activeCameras)
                : "—"
          }
          trend={
            cameras?.length && activeCameraCount !== undefined
              ? Math.round((activeCameraCount / cameras.length) * 1000) / 10
              : undefined
          }
          trendLabel="Online"
        />
        <StatCard
          icon={VideoOff}
          iconClassName="bg-destructive/15 text-destructive"
          label="Offline Cameras"
          value={
            cameras && activeCameraCount !== undefined
              ? formatNumber(cameras.length - activeCameraCount)
              : stats
                ? formatNumber(stats.offlineCameras)
                : "—"
          }
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
          label="Active Alert Rules"
          value={alertStats ? formatNumber(alertStats.byStatus.active ?? 0) : "—"}
          href="/alerts"
          hrefLabel="View alerts"
        />
        <StatCard
          icon={ShieldAlert}
          iconClassName="bg-severity-critical/15 text-severity-critical"
          label="Unseen Alert Matches"
          value={formatNumber(unseenMatchCount)}
          href="/alerts"
          hrefLabel="View alerts"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="h-[420px] overflow-hidden rounded-xl border border-surface-border sm:h-[520px] lg:h-[600px]">
          <CameraLocationMapLoader
            cameras={cameraLocations ?? []}
            selectedCameraId={selectedLocationCameraId}
            onSelectCamera={handleSelectCamera}
            onDragEnd={persistCameraLocation}
            placementCameraId={null}
            onPickLocation={() => {}}
          />
        </div>

        <div className="h-[420px] overflow-hidden rounded-xl border border-surface-border sm:h-[520px] lg:h-[600px]">
          {panelMode === "camera" && selectedCameraLocation ? (
            <CameraLiveInfoPanel
              key={selectedCameraLocation.cameraId}
              camera={selectedCameraLocation}
              onClose={() => {
                setSelectedLocationCameraId(null);
                setPanelMode("alerts");
              }}
            />
          ) : panelMode === "alerts" ? (
            <LiveAlertRulesPanel
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
        {highestOccupancy &&
          highestOccupancyTrend &&
          (() => {
            const tier = densityTierFromCount(highestOccupancy.peopleCount);
            return (
              <MetricTrendCard
                label="Highest Density Camera"
                badge={tier}
                badgeTone={densityTierBadgeTone(tier)}
                value={highestOccupancy.cameraName}
                subLabel={`${highestOccupancy.zone ?? "No zone"} · ${highestOccupancy.peopleCount} Person${highestOccupancy.peopleCount === 1 ? "" : "s"}`}
                chartData={highestOccupancyTrend}
                chartColor={densityTierColor(tier)}
              />
            );
          })()}
        {alertTrend && (
          <MetricTrendCard
            label="Active Alert Trend (24H)"
            badge="+12%"
            badgeTone="negative"
            value={alertStats?.total ?? "—"}
            valueSuffix="Rules"
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
