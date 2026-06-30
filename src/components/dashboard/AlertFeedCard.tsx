"use client";

import { Eye } from "lucide-react";
import type { Alert } from "@/lib/types";
import { SeverityBadge } from "@/components/alerts/SeverityBadge";
import { CameraThumbnail } from "@/components/cameras/CameraThumbnail";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/formatters";
import { useAcknowledgeAlert, useResolveAlert } from "@/lib/hooks/useAlerts";

export function AlertFeedCard({
  alert,
  onViewCamera,
}: {
  alert: Alert;
  onViewCamera: (cameraId: string) => void;
}) {
  const acknowledge = useAcknowledgeAlert();
  const resolve = useResolveAlert();

  return (
    <div className="rounded-lg border border-surface-border bg-surface-2 p-3">
      <div className="flex gap-3">
        <CameraThumbnail seed={alert.cameraId} className="h-14 w-20 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <SeverityBadge severity={alert.severity} />
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatTime(alert.timestamp)}
            </span>
          </div>
          <div className="mt-1 truncate text-sm font-medium">{alert.title}</div>
          <div className="truncate text-xs text-muted-foreground">{alert.description}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {alert.cameraCode} &middot; {alert.zoneName}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 flex-1 gap-1 px-2 text-xs"
          onClick={() => onViewCamera(alert.cameraId)}
        >
          <Eye className="size-3.5" /> View Camera
        </Button>
        {alert.status === "active" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            disabled={acknowledge.isPending}
            onClick={() => acknowledge.mutate(alert.id)}
          >
            Acknowledge
          </Button>
        )}
        {alert.status !== "resolved" && (
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={resolve.isPending}
            onClick={() => resolve.mutate(alert.id)}
          >
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
}
