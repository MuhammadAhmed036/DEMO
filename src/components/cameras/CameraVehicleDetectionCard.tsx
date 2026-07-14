import Image from "next/image";
import { Car, ScanSearch } from "lucide-react";
import type { CameraVehicleDetection } from "@/lib/mock/cameraVehicleDetections";
import { formatDateTime } from "@/lib/formatters";

export function CameraVehicleDetectionCard({ detection }: { detection: CameraVehicleDetection }) {
  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-2">
      <div className="flex items-center gap-1.5 border-b border-surface-border px-4 py-3">
        <ScanSearch className="size-4 text-primary" />
        <h3 className="text-sm font-medium">Vehicle Detection</h3>
      </div>

      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <Image
          src={detection.image}
          alt={`${detection.vehicleColor} ${detection.vehicleType} — ${detection.plateNumber ?? "unrecognized plate"}`}
          fill
          sizes="(min-width: 1024px) 640px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="space-y-2 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Car className="size-3.5" /> Vehicle
          </span>
          <span className="font-medium">
            {detection.vehicleColor} {detection.vehicleType}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Plate Number</span>
          <span className="font-mono font-medium">{detection.plateNumber ?? "Unrecognized"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium">{detection.confidence}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Detected</span>
          <span className="font-medium">{formatDateTime(detection.detectedAt)}</span>
        </div>
        <p className="pt-1 text-xs text-muted-foreground">{detection.description}</p>
      </div>
    </div>
  );
}
