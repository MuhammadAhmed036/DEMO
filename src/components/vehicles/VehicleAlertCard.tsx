"use client";

import { Gauge, MapPin } from "lucide-react";
import type { VehicleAlert } from "@/lib/mock/vehicleAlerts";
import { VIOLATION_LABEL } from "@/lib/mock/vehicleAlerts";
import { VehicleSeverityBadge } from "@/components/vehicles/VehicleSeverityBadge";
import { VehicleSnapshotFrame } from "@/components/vehicles/VehicleSnapshotFrame";
import { formatDateTime } from "@/lib/formatters";

export function VehicleAlertCard({
  alert,
  onSelect,
}: {
  alert: VehicleAlert;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(alert.id)}
      className="group overflow-hidden rounded-xl border border-surface-border bg-surface-2 text-left transition-colors hover:border-primary/40"
    >
      <VehicleSnapshotFrame alert={alert} sizes="(min-width: 1024px) 320px, 90vw" className="aspect-video w-full">
        <span
          className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white"
        >
          {alert.vehicleType}
        </span>
      </VehicleSnapshotFrame>

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-medium group-hover:text-primary">{alert.title}</h3>
          <VehicleSeverityBadge severity={alert.severity} className="shrink-0" />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {alert.cameraName} · {alert.zone}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="rounded-md bg-surface-3 px-1.5 py-0.5 font-medium text-foreground">
            {VIOLATION_LABEL[alert.violationType]}
          </span>
          {alert.speedKph ? (
            <span className="flex items-center gap-1 text-severity-medium">
              <Gauge className="size-3.5" /> {alert.speedKph} km/h
            </span>
          ) : (
            <span className="font-mono">{alert.plateNumber ?? "Unrecognized"}</span>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">{formatDateTime(alert.timestamp)}</p>
      </div>
    </button>
  );
}
