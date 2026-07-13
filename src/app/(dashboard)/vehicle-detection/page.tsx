"use client";

import { useState } from "react";
import { AlertTriangle, Car, ScanSearch, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { VehicleAlertCard } from "@/components/vehicles/VehicleAlertCard";
import { VehicleAlertDetailPanel } from "@/components/vehicles/VehicleAlertDetailPanel";
import { VEHICLE_ALERTS } from "@/lib/mock/vehicleAlerts";

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Car;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-2 p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold leading-tight">{value}</div>
        <div className="truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export default function VehicleDetectionPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedAlert = VEHICLE_ALERTS.find((a) => a.id === selectedId) ?? null;

  const criticalCount = VEHICLE_ALERTS.filter((a) => a.severity === "critical").length;
  const unrecognizedCount = VEHICLE_ALERTS.filter((a) => !a.plateNumber).length;
  const avgConfidence = Math.round(
    VEHICLE_ALERTS.reduce((sum, a) => sum + a.confidence, 0) / VEHICLE_ALERTS.length
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Vehicle Detection"
        description="Vehicle-related detections across all cameras — restricted-area entries, no-parking violations, and overspeeding."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Car} label="Total Detections" value={VEHICLE_ALERTS.length} />
        <StatTile icon={ShieldAlert} label="Critical" value={criticalCount} />
        <StatTile icon={ScanSearch} label="Unrecognized Plates" value={unrecognizedCount} />
        <StatTile icon={AlertTriangle} label="Avg. Confidence" value={`${avgConfidence}%`} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VEHICLE_ALERTS.map((alert) => (
          <VehicleAlertCard key={alert.id} alert={alert} onSelect={setSelectedId} />
        ))}
      </div>

      <VehicleAlertDetailPanel
        alert={selectedAlert}
        open={Boolean(selectedId)}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}
