"use client";

import Link from "next/link";
import { Camera as CameraIcon, Check, Clock, Expand, MapPin, Timer, UserCog } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CameraThumbnail } from "@/components/cameras/CameraThumbnail";
import { StatusBadge } from "@/components/alerts/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert, useAcknowledgeAlert, useAssignOperator, useResolveAlert, useUpdateAlertNotes } from "@/lib/hooks/useAlerts";
import { useOperators } from "@/lib/hooks/useOperators";
import { formatDateTime, formatDuration, initialsFromName } from "@/lib/formatters";

export function AlertDetailPanel({
  alertId,
  open,
  onOpenChange,
}: {
  alertId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: alert, isLoading } = useAlert(alertId);
  const { data: operators } = useOperators();
  const acknowledge = useAcknowledgeAlert();
  const resolve = useResolveAlert();
  const assignOperator = useAssignOperator();
  const updateNotes = useUpdateAlertNotes();

  const assignedOperator = operators?.find((o) => o.id === alert?.assignedOperatorId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full p-0 sm:max-w-md">
        {isLoading || !alert ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="flex h-full flex-col overflow-y-auto">
            <SheetHeader className="border-b border-surface-border pb-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-severity-critical">
                  {alert.severity} Alert
                </span>
                <StatusBadge status={alert.status} />
              </div>
              <SheetTitle>{alert.title}</SheetTitle>
              <p className="text-xs text-muted-foreground">{alert.description}</p>
            </SheetHeader>

            <div className="space-y-4 p-4">
              <CameraThumbnail seed={alert.cameraId} className="relative aspect-video w-full rounded-lg">
                <span className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white">
                  + Live
                </span>
                <button className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md bg-black/55 text-white hover:bg-black/70">
                  <Expand className="size-3.5" />
                </button>
              </CameraThumbnail>

              <div>
                <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">Event Summary</h4>
                <p className="text-sm leading-relaxed">
                  {alert.description}. Detected by {alert.cameraName} ({alert.cameraCode}) in{" "}
                  {alert.zoneName}.
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-surface-border bg-surface-2 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><CameraIcon className="size-3.5" /> Camera</span>
                  <span className="font-medium">{alert.cameraCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-3.5" /> Zone</span>
                  <span className="font-medium">{alert.zoneName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="size-3.5" /> Timestamp</span>
                  <span className="font-medium">{formatDateTime(alert.timestamp)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><Timer className="size-3.5" /> Duration</span>
                  <span className="font-medium">{formatDuration(alert.durationSeconds)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{alert.confidence}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${alert.confidence}%` }} />
                </div>
              </div>

              <div>
                <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <UserCog className="size-3.5" /> Assigned Operator
                </h4>
                <div className="flex items-center gap-2.5 rounded-lg border border-surface-border bg-surface-2 p-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-surface-3 text-xs">
                      {assignedOperator ? initialsFromName(assignedOperator.name) : "—"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {assignedOperator?.name ?? "Unassigned"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {assignedOperator?.controlRoom ?? "—"}
                    </div>
                  </div>
                  <Select
                    value={alert.assignedOperatorId ?? undefined}
                    onValueChange={(value) => assignOperator.mutate({ id: alert.id, operatorId: value })}
                  >
                    <SelectTrigger size="sm"><SelectValue placeholder="Reassign" /></SelectTrigger>
                    <SelectContent>
                      {operators?.map((op) => (
                        <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">Notes</h4>
                <Textarea
                  key={alert.id}
                  defaultValue={alert.notes}
                  onBlur={(e) => {
                    if (e.target.value !== alert.notes) {
                      updateNotes.mutate({ id: alert.id, notes: e.target.value });
                    }
                  }}
                  placeholder="Add note..."
                  className="min-h-20 text-sm"
                />
                {!alert.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">No notes added yet.</p>
                )}
              </div>
            </div>

            <div className="mt-auto space-y-2 border-t border-surface-border p-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={alert.status !== "active" || acknowledge.isPending}
                  onClick={() => acknowledge.mutate(alert.id)}
                  className="gap-1.5"
                >
                  <Check className="size-4" /> Acknowledge
                </Button>
                <Button
                  disabled={alert.status === "resolved" || resolve.isPending}
                  onClick={() => resolve.mutate(alert.id)}
                  className="gap-1.5"
                >
                  <Check className="size-4" /> Resolve
                </Button>
              </div>
              <Button variant="secondary" className="w-full" asChild>
                <Link href={`/cameras/${alert.cameraId}`}>View Camera</Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
