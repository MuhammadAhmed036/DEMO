"use client";

import { MoreVertical } from "lucide-react";
import type { Alert } from "@/lib/types";
import { SeverityBadge } from "@/components/alerts/SeverityBadge";
import { StatusBadge } from "@/components/alerts/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAcknowledgeAlert, useResolveAlert } from "@/lib/hooks/useAlerts";
import { useOperators } from "@/lib/hooks/useOperators";
import { formatDateTime, initialsFromName } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function AlertsTable({
  alerts,
  isLoading,
  onSelectAlert,
  onViewCamera,
}: {
  alerts: Alert[];
  isLoading: boolean;
  onSelectAlert: (id: string) => void;
  onViewCamera: (cameraId: string) => void;
}) {
  const { data: operators } = useOperators();
  const acknowledge = useAcknowledgeAlert();
  const resolve = useResolveAlert();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-2 py-16 text-center text-sm text-muted-foreground">
        No alerts match your filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-surface-border bg-surface-2 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Alert</th>
            <th className="px-3 py-3 font-medium">Severity</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Camera</th>
            <th className="px-3 py-3 font-medium">Zone</th>
            <th className="px-3 py-3 font-medium">Timestamp</th>
            <th className="px-3 py-3 font-medium">Operator</th>
            <th className="px-3 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {alerts.map((alert) => {
            const operator = operators?.find((o) => o.id === alert.assignedOperatorId);
            return (
              <tr
                key={alert.id}
                onClick={() => onSelectAlert(alert.id)}
                className="cursor-pointer transition-colors hover:bg-surface-2"
              >
                <td className="max-w-[260px] px-4 py-3">
                  <div className="truncate font-medium">{alert.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{alert.description}</div>
                </td>
                <td className="px-3 py-3"><SeverityBadge severity={alert.severity} /></td>
                <td className="px-3 py-3"><StatusBadge status={alert.status} /></td>
                <td className="px-3 py-3">
                  <div className="font-medium">{alert.cameraCode}</div>
                  <div className="text-xs text-muted-foreground">{alert.cameraName}</div>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{alert.zoneName}</td>
                <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                  {formatDateTime(alert.timestamp)}
                </td>
                <td className="px-3 py-3">
                  {operator ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="size-6">
                        <AvatarFallback className="bg-surface-3 text-[10px]">
                          {initialsFromName(operator.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{operator.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn("rounded-md p-1.5 hover:bg-surface-3")}
                        aria-label="Alert actions"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectAlert(alert.id)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewCamera(alert.cameraId)}>
                        View Camera
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={alert.status !== "active"}
                        onClick={() => acknowledge.mutate(alert.id)}
                      >
                        Acknowledge
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={alert.status === "resolved"}
                        onClick={() => resolve.mutate(alert.id)}
                      >
                        Resolve
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
