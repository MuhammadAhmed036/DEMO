import type { CameraLocation, ZoneSummary } from "@/lib/types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeCameraLocation(raw: unknown): CameraLocation {
  const record = asRecord(raw);
  return {
    id: Number(record.id) || 0,
    cameraId: String(record.camera_id ?? ""),
    cameraName: String(record.camera_name ?? record.camera_id ?? ""),
    cameraIp: asString(record.camera_ip),
    zone: asString(record.zone),
    scene: asString(record.scene),
    latitude: asNumber(record.latitude),
    longitude: asNumber(record.longitude),
    headingDegrees: asNumber(record.heading_degrees),
    address: asString(record.address),
    building: asString(record.building),
    floor: asString(record.floor),
    description: asString(record.description),
    enabled: Boolean(record.enabled),
    updatedAt: asString(record.updated_at),
  };
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  const detail = asRecord(body).detail ?? asRecord(body).error;
  if (typeof detail === "string") return detail;
  return fallback;
}

export async function fetchCameraLocations(): Promise<CameraLocation[]> {
  const response = await fetch("/api/ai/v2/cameras?limit=1000", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Camera registry API returned ${response.status}`));
  }
  const payload = asRecord(await response.json());
  const rows = Array.isArray(payload.cameras) ? payload.cameras : [];
  return rows.map(normalizeCameraLocation);
}

export async function updateCameraLocation(
  cameraId: string,
  updates: { latitude: number; longitude: number }
): Promise<CameraLocation> {
  const response = await fetch(`/api/ai/v2/cameras/${encodeURIComponent(cameraId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Failed to update camera location (${response.status})`));
  }
  return normalizeCameraLocation(await response.json());
}

export async function fetchZoneSummaries(): Promise<ZoneSummary[]> {
  const response = await fetch("/api/ai/v2/zones", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Zones API returned ${response.status}`));
  }
  const payload = asRecord(await response.json());
  const rows = Array.isArray(payload.zones) ? payload.zones : [];
  return rows.map((raw: unknown) => {
    const record = asRecord(raw);
    return {
      zone: String(record.zone ?? ""),
      cameraCount: Number(record.camera_count) || 0,
      withCoords: Number(record.with_coords) || 0,
      enabledCount: Number(record.enabled_count) || 0,
    };
  });
}
