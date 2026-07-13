import { REFERENCE_NOW } from "@/lib/mock/seed";

export interface CameraVehicleDetection {
  image: string;
  vehicleType: string;
  vehicleColor: string;
  plateNumber: string;
  confidence: number;
  detectedAt: string;
  description: string;
}

const CAMERA_VEHICLE_DETECTIONS: Record<string, CameraVehicleDetection> = {
  "cam-fai-01": {
    image: "/alerts/vehicles/airport-entrance.jpg",
    vehicleType: "Sedan",
    vehicleColor: "White",
    plateNumber: "RIB-951",
    confidence: 96,
    detectedAt: new Date(REFERENCE_NOW.getTime() - 14 * 60_000).toISOString(),
    description: "Vehicle detected and tracked at the airport entrance gate.",
  },
};

export function getCameraVehicleDetection(cameraId: string | null | undefined): CameraVehicleDetection | undefined {
  if (!cameraId) return undefined;
  return CAMERA_VEHICLE_DETECTIONS[cameraId.toLowerCase()];
}
