"use client";

import { Eye } from "lucide-react";
import type { AlertRuleV2 } from "@/lib/types";
import { AlertRuleStatusBadge } from "@/components/alerts/AlertRuleStatusBadge";
import { Button } from "@/components/ui/button";
import { liveEventImageUrl } from "@/lib/hooks/useCameraLiveFeed";
import { useMarkAlertSeen, useUpdateAlertRuleStatus } from "@/lib/hooks/useAlertRules";
import { formatTime } from "@/lib/formatters";

export function AlertRuleFeedCard({
  rule,
  onViewCamera,
}: {
  rule: AlertRuleV2;
  onViewCamera: (cameraId: string) => void;
}) {
  const markSeen = useMarkAlertSeen();
  const updateStatus = useUpdateAlertRuleStatus();

  return (
    <div className="rounded-lg border border-surface-border bg-surface-2 p-3">
      <div className="flex gap-3">
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-black">
          {rule.latestEventId ? (
            // eslint-disable-next-line @next/next/no-img-element -- proxied JPEG thumbnail from the detection API
            <img
              src={liveEventImageUrl(rule.latestEventId)}
              alt="Latest matched frame"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
              No match yet
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <AlertRuleStatusBadge status={rule.status} />
            {rule.updatedAt && (
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatTime(rule.updatedAt)}
              </span>
            )}
          </div>
          <div className="mt-1 truncate text-sm font-medium">{rule.name ?? rule.alertId}</div>
          <div className="truncate text-xs text-muted-foreground">
            {rule.cameraId} &middot; {rule.zone ?? "no zone"}
          </div>
          {rule.unseenCount > 0 && (
            <div className="mt-0.5 text-[11px] font-medium text-destructive">
              {rule.unseenCount} new match{rule.unseenCount === 1 ? "" : "es"}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          className="h-7 flex-1 gap-1 px-2 text-xs"
          onClick={() => onViewCamera(rule.cameraId)}
        >
          <Eye className="size-3.5" /> View Camera
        </Button>
        {!rule.seen && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            disabled={markSeen.isPending}
            onClick={() => markSeen.mutate({ alertId: rule.alertId })}
          >
            Mark Seen
          </Button>
        )}
        {rule.status !== "resolved" && (
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ alertId: rule.alertId, status: "resolved" })}
          >
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
}
