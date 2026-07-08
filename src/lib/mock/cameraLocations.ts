import { CAMERAS } from "@/lib/mock/cameras";
import { REFERENCE_NOW } from "@/lib/mock/seed";

export interface CameraLocationRow {
  id: number;
  camera_id: string;
  camera_name: string;
  camera_ip: string | null;
  zone: string | null;
  scene: string | null;
  latitude: number;
  longitude: number;
  heading_degrees: number | null;
  address: string | null;
  building: string | null;
  floor: string | null;
  description: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Raw snake_case rows matching the real `/api/v2/cameras` registry shape,
 * so `cameraLocationsService.normalizeCameraLocation` parses them exactly
 * like a real backend response.
 */
function buildRows(): CameraLocationRow[] {
  return CAMERAS.map((camera, index) => ({
    id: index + 1,
    camera_id: camera.id,
    camera_name: camera.name,
    camera_ip: null,
    zone: camera.zoneName,
    scene: camera.location,
    latitude: camera.position[1],
    longitude: camera.position[0],
    heading_degrees: null,
    address: camera.location,
    building: null,
    floor: null,
    description: null,
    enabled: camera.status === "online",
    created_at: REFERENCE_NOW.toISOString(),
    updated_at: REFERENCE_NOW.toISOString(),
  }));
}

export const CAMERA_LOCATION_ROWS: CameraLocationRow[] = buildRows();

export function getCameraLocationRow(cameraId: string) {
  return CAMERA_LOCATION_ROWS.find(
    (row) => row.camera_id.toLowerCase() === cameraId.toLowerCase()
  );
}
