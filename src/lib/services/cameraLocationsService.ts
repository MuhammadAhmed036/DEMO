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
    createdAt: asString(record.created_at),
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

export async function fetchCameraLocation(cameraId: string): Promise<CameraLocation> {
  const response = await fetch(`/api/ai/v2/cameras/${encodeURIComponent(cameraId)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Camera registry API returned ${response.status}`));
  }
  return normalizeCameraLocation(await response.json());
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

export interface CameraSnapshot {
  eventId: string;
  imageWidth: number;
  imageHeight: number;
  detectionTs: string | null;
}

export async function fetchLatestCameraSnapshot(cameraId: string): Promise<CameraSnapshot | null> {
  const response = await fetch(
    `/api/ai/v2/cameras/${encodeURIComponent(cameraId)}/events?limit=1`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Camera events API returned ${response.status}`));
  }
  const payload = asRecord(await response.json());
  const rows = Array.isArray(payload.events) ? payload.events : [];
  const latest = asRecord(rows[0]);
  const eventId = asString(latest.event_id);
  const imageWidth = asNumber(latest.image_width);
  const imageHeight = asNumber(latest.image_height);
  if (!eventId || !imageWidth || !imageHeight) return null;

  return {
    eventId,
    imageWidth,
    imageHeight,
    detectionTs: asString(latest.detection_ts),
  };
}

export interface PeopleCountPoint {
  time: string;
  peopleCount: number;
  eventCount: number;
}

export async function fetchCameraPeopleCountSeries(
  cameraId: string,
  options: { fromTs: string; toTs: string; bucket?: string; mode?: string }
): Promise<PeopleCountPoint[]> {
  const params = new URLSearchParams({
    from_ts: options.fromTs,
    to_ts: options.toTs,
    bucket: options.bucket ?? "5m",
    mode: options.mode ?? "max",
  });
  const response = await fetch(
    `/api/ai/v2/cameras/${encodeURIComponent(cameraId)}/people-count-series?${params.toString()}`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `People-count series API returned ${response.status}`));
  }
  const payload = asRecord(await response.json());
  const points = Array.isArray(payload.points) ? payload.points : [];
  return points.map((raw: unknown) => {
    const record = asRecord(raw);
    return {
      time: String(record.time ?? ""),
      peopleCount: asNumber(record.people_count) ?? 0,
      eventCount: asNumber(record.event_count) ?? 0,
    };
  });
}

/**
 * Sums real per-camera people-count series into one city-wide total per
 * time bucket. There's no server-side "all cameras" aggregate endpoint, so
 * this fetches each camera's series in parallel and adds them up — bounded
 * by the number of registered cameras, which is small for this deployment.
 */
export async function fetchAggregatePeopleCountSeries(
  cameraIds: string[],
  options: { fromTs: string; toTs: string; bucket?: string; mode?: string }
): Promise<PeopleCountPoint[]> {
  const perCamera = await Promise.all(
    cameraIds.map((cameraId) =>
      fetchCameraPeopleCountSeries(cameraId, options).catch(() => [] as PeopleCountPoint[])
    )
  );

  const totalsByTime = new Map<string, number>();
  perCamera.forEach((series) => {
    series.forEach((point) => {
      totalsByTime.set(point.time, (totalsByTime.get(point.time) ?? 0) + point.peopleCount);
    });
  });

  return Array.from(totalsByTime.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, peopleCount]) => ({ time, peopleCount, eventCount: 0 }));
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
