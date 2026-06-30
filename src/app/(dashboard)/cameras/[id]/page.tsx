"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Camera as CameraIcon,
  Download,
  Maximize2,
  MoreVertical,
  Pause,
  Play,
  Users,
  Video,
} from "lucide-react";
import { CameraThumbnail } from "@/components/cameras/CameraThumbnail";
import { EventHistoryTable } from "@/components/cameras/EventHistoryTable";
import { AlertTimelineList } from "@/components/cameras/AlertTimelineList";
import { MiniTrendChart } from "@/components/dashboard/MiniTrendChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCamera } from "@/lib/hooks/useCameras";
import { useAlertsByCamera } from "@/lib/hooks/useAlerts";
import { useEventHistory } from "@/lib/hooks/useEventHistory";
import { useTrend } from "@/lib/hooks/useDashboardStats";
import { useUIStore } from "@/lib/store/useUIStore";
import { densityTextClass } from "@/lib/density";
import { formatNumber } from "@/lib/formatters";

export default function CameraDetailPage() {
  const params = useParams<{ id: string }>();
  const cameraId = params.id;
  const { data: camera, isLoading } = useCamera(cameraId);
  const { data: alerts, isLoading: alertsLoading } = useAlertsByCamera(cameraId);
  const { data: events, isLoading: eventsLoading } = useEventHistory(cameraId);
  const { data: peopleCountTrend } = useTrend("people-count-today");
  const { data: crowdDensityTrend } = useTrend("crowd-density-today");
  const setSelectedCameraId = useUIStore((s) => s.setSelectedCameraId);
  const setCreateAlertModalOpen = useUIStore((s) => s.setCreateAlertModalOpen);

  const [playing, setPlaying] = useState(true);

  if (isLoading || !camera) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    );
  }

  const peopleTotal = (peopleCountTrend ?? []).reduce((s, p) => s + p.value, 0);
  const yesterdayCompare = 18.6;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Link href="/cameras" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Cameras
      </Link>

      <div className="flex flex-col gap-3 rounded-xl border border-surface-border bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold">{camera.name}</h1>
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
          <p className="mt-0.5 text-sm text-muted-foreground">
            @{camera.code} · {camera.location}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {camera.aiFeatures.map((f) => (
              <span key={f.id} className="rounded-full border border-surface-border bg-surface-1 px-2 py-0.5 text-[11px] text-muted-foreground">
                {f.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-1 px-3 py-1.5 text-sm">
            <Users className="size-4 text-primary" />
            <span className="font-semibold">{camera.currentPersonCount}</span>
            <span className="text-xs text-muted-foreground">People</span>
          </div>
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
            onClick={() => {
              setSelectedCameraId(camera.id);
              setCreateAlertModalOpen(true);
            }}
          >
            <Bell className="size-4" /> Create Alert
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Download className="size-4" /> Recordings
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" aria-label="More options"><MoreVertical className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Camera</DropdownMenuItem>
              <DropdownMenuItem>Move to Zone</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Remove Camera</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-2">
          <CameraThumbnail seed={camera.thumbnailSeed} offline={camera.status === "offline"} className="aspect-video w-full rounded-xl">
            {camera.status === "online" && playing && (
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-xs font-medium text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
              </span>
            )}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-black/45 px-3 py-2 backdrop-blur">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="flex size-7 items-center justify-center rounded-md bg-white/15 text-white hover:bg-white/25"
                >
                  {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                </button>
                <span className="text-xs text-white/80">{camera.code}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <CameraIcon className="size-4" />
                <Maximize2 className="size-4" />
              </div>
            </div>
          </CameraThumbnail>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">People Count (Today)</h3>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold">{formatNumber(peopleTotal)}</span>
                <span className="text-xs font-medium text-status-active">↑ {yesterdayCompare}% vs yesterday</span>
              </div>
              {peopleCountTrend && <MiniTrendChart data={peopleCountTrend} color="#3b82f6" height={140} showAxis />}
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Crowd Density (Today)</h3>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`text-2xl font-semibold ${densityTextClass(camera.density)}`}>{camera.density}</span>
                <span className="text-xs text-muted-foreground">{camera.densityPercent}% current</span>
              </div>
              {crowdDensityTrend && (
                <MiniTrendChart data={crowdDensityTrend} color="#f59e0b" variant="area" height={140} showAxis />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface-2 p-4">
            <h3 className="mb-3 text-sm font-medium">Event History (Today)</h3>
            <EventHistoryTable events={events} isLoading={eventsLoading} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-surface-border bg-surface-2 p-3">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <Video className="size-4" /> Latest Snapshot
            </h3>
            <CameraThumbnail seed={`${camera.thumbnailSeed}-snap`} offline={camera.status === "offline"} className="aspect-video w-full rounded-lg" />
          </div>
          <div className="rounded-xl border border-surface-border bg-surface-2 p-3">
            <h3 className="mb-2 text-sm font-medium">Alert Timeline (Today)</h3>
            <AlertTimelineList alerts={alerts} isLoading={alertsLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
