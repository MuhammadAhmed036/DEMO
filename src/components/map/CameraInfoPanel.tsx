"use client";

import Link from "next/link";
import { Bell, Play, Sparkles, Users, X } from "lucide-react";
import { useCamera } from "@/lib/hooks/useCameras";
import { useTrend } from "@/lib/hooks/useDashboardStats";
import { MiniTrendChart } from "@/components/dashboard/MiniTrendChart";
import { CameraThumbnail } from "@/components/cameras/CameraThumbnail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { buildCameraBuiltinRules, buildCameraCustomRules } from "@/lib/mock/camera-rules";
import { densityTextClass } from "@/lib/density";
import { useUIStore } from "@/lib/store/useUIStore";

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
};

export function CameraInfoPanel({
  cameraId,
  onClose,
}: {
  cameraId: string;
  onClose: () => void;
}) {
  const { data: camera, isLoading } = useCamera(cameraId);
  const { data: trend } = useTrend("person-count-trend");
  const setCreateAlertModalOpen = useUIStore((s) => s.setCreateAlertModalOpen);

  if (isLoading || !camera) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  const customRules = buildCameraCustomRules(camera.id);
  const builtinRules = buildCameraBuiltinRules(camera.id);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <CameraThumbnail seed={camera.thumbnailSeed} offline={camera.status === "offline"} className="aspect-video w-full shrink-0">
        <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white">
          <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> Live
        </div>
        <button
          onClick={onClose}
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md bg-black/55 text-white hover:bg-black/70"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <div className="absolute bottom-2 left-2 text-[11px] font-medium text-white/80">
          {camera.code}
        </div>
      </CameraThumbnail>

      <div className="space-y-4 p-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold leading-tight">{camera.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                camera.status === "online"
                  ? "bg-status-active/15 text-status-active"
                  : "bg-status-resolved/15 text-status-resolved"
              }`}
            >
              {camera.status === "online" ? "Online" : "Offline"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{camera.location}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-surface-border bg-surface-2 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3.5" /> Current Persons
            </div>
            <div className="mt-1 text-xl font-semibold">{camera.currentPersonCount}</div>
          </div>
          <div className="rounded-lg border border-surface-border bg-surface-2 p-3">
            <div className="text-xs text-muted-foreground">Density</div>
            <div className={`mt-1 text-xl font-semibold ${densityTextClass(camera.density)}`}>
              {camera.density}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 gap-1.5">
            <Play className="size-3.5" /> Open Live Stream
          </Button>
          <Button size="sm" variant="secondary" className="flex-1" asChild>
            <Link href={`/cameras/${camera.id}`}>View Details</Link>
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5"
          onClick={() => setCreateAlertModalOpen(true)}
        >
          <Bell className="size-3.5" /> Create Custom Alert
        </Button>

        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5" /> AI Features (Active)
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {camera.aiFeatures.map((f) => (
              <div key={f.id} className="flex items-center gap-1.5 text-xs">
                <span className="size-1.5 rounded-full bg-status-active" />
                {f.label}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Custom Alerts ({customRules.length})
          </div>
          <div className="space-y-1.5">
            {customRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-md border border-surface-border bg-surface-2 px-2.5 py-1.5 text-xs"
              >
                <span className="flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${SEVERITY_DOT[rule.severity]}`} />
                  {rule.label}
                </span>
                <Bell className="size-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Built-in Alerts ({builtinRules.length})
          </div>
          <div className="space-y-1.5">
            {builtinRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-md border border-surface-border bg-surface-2 px-2.5 py-1.5 text-xs"
              >
                <span className="flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${SEVERITY_DOT[rule.severity]}`} />
                  {rule.label}
                </span>
                <Bell className="size-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Person Count Trend (Today)
          </div>
          {trend && <MiniTrendChart data={trend} variant="area" height={110} showAxis />}
        </div>
      </div>
    </div>
  );
}
