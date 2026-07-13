import type { VehicleAlertSeverity } from "@/lib/mock/vehicleAlerts";
import { cn } from "@/lib/utils";

const STYLES: Record<VehicleAlertSeverity, string> = {
  critical: "bg-severity-critical/15 text-severity-critical border-severity-critical/30",
  high: "bg-severity-high/15 text-severity-high border-severity-high/30",
  medium: "bg-severity-medium/15 text-severity-medium border-severity-medium/30",
  low: "bg-severity-low/15 text-severity-low border-severity-low/30",
};

const LABEL: Record<VehicleAlertSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function VehicleSeverityBadge({
  severity,
  className,
}: {
  severity: VehicleAlertSeverity;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        STYLES[severity],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {LABEL[severity]}
    </span>
  );
}
