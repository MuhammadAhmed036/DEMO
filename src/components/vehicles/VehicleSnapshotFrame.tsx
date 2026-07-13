import Image from "next/image";
import { Car, Truck } from "lucide-react";
import type { VehicleAlert } from "@/lib/mock/vehicleAlerts";
import { cn } from "@/lib/utils";

function VehicleTypeIcon({ vehicleType, className }: { vehicleType: string; className?: string }) {
  const Icon = vehicleType.toLowerCase().includes("truck") ? Truck : Car;
  return <Icon className={className} />;
}

/**
 * Renders the captured bounding-box snapshot when one exists, or a
 * stylized "awaiting frame" scan graphic for cameras this demo doesn't
 * have a real photo for — deliberately graphic rather than a fake photo,
 * so it reads as a placeholder and not a broken image.
 */
export function VehicleSnapshotFrame({
  alert,
  sizes,
  priority,
  className,
  children,
}: {
  alert: VehicleAlert;
  sizes: string;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  if (alert.image) {
    return (
      <div className={cn("relative overflow-hidden bg-black", className)}>
        <Image
          src={alert.image}
          alt={`${alert.cameraName} — ${alert.title}`}
          fill
          sizes={sizes}
          className="object-cover"
          priority={priority}
        />
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-surface-3 to-surface-1",
        className
      )}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklch, var(--surface-border), transparent 20%) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--surface-border), transparent 20%) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex size-16 items-center justify-center rounded-lg border-2 border-dashed border-primary/50 text-primary/70">
          <VehicleTypeIcon vehicleType={alert.vehicleType} className="size-7" />
        </div>
      </div>
      {alert.plateNumber && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded border border-surface-border bg-surface-2/90 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-foreground">
          {alert.plateNumber}
        </span>
      )}
      <span className="absolute right-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium text-white/80">
        No frame captured
      </span>
      {children}
    </div>
  );
}
