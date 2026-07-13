"use client";

import { Car, Clock, Gauge, MapPin, ShieldAlert } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { VIOLATION_LABEL, type VehicleAlert } from "@/lib/mock/vehicleAlerts";
import { VehicleSeverityBadge } from "@/components/vehicles/VehicleSeverityBadge";
import { VehicleSnapshotFrame } from "@/components/vehicles/VehicleSnapshotFrame";
import { formatDateTime } from "@/lib/formatters";

export function VehicleAlertDetailPanel({
  alert,
  open,
  onOpenChange,
}: {
  alert: VehicleAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full p-0 sm:max-w-md">
        {alert && (
          <div className="flex h-full flex-col overflow-y-auto">
            <SheetHeader className="border-b border-surface-border pb-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Car className="size-3.5" /> {alert.vehicleType}
                </span>
                <VehicleSeverityBadge severity={alert.severity} />
              </div>
              <SheetTitle>{alert.title}</SheetTitle>
              <p className="text-xs text-muted-foreground">{alert.description}</p>
            </SheetHeader>

            <div className="space-y-4 p-4">
              <VehicleSnapshotFrame
                alert={alert}
                sizes="448px"
                priority
                className="aspect-video w-full rounded-lg border border-surface-border"
              />

              <div className="space-y-2 rounded-lg border border-surface-border bg-surface-2 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3.5" /> Camera
                  </span>
                  <span className="font-medium">
                    {alert.cameraName} · {alert.zone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <ShieldAlert className="size-3.5" /> Violation
                  </span>
                  <span className="font-medium">{VIOLATION_LABEL[alert.violationType]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium">
                    {alert.vehicleColor} {alert.vehicleType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plate Number</span>
                  <span className="font-mono font-medium">{alert.plateNumber ?? "Unrecognized"}</span>
                </div>
                {alert.speedKph && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Gauge className="size-3.5" /> Speed
                    </span>
                    <span className="font-medium text-severity-medium">
                      {alert.speedKph} km/h in a {alert.speedLimitKph} km/h zone
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="size-3.5" /> Detected
                  </span>
                  <span className="font-medium">{formatDateTime(alert.timestamp)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{alert.confidence}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
