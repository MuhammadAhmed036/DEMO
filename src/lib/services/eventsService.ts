import type { EventHistoryItem } from "@/lib/types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function rows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  for (const key of ["data", "events", "results", "items"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
    const nested = asRecord(record[key]);
    for (const nestedKey of ["events", "results", "items"]) {
      if (Array.isArray(nested[nestedKey])) return nested[nestedKey] as unknown[];
    }
  }
  return [];
}

function firstString(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function eventCameraName(record: UnknownRecord): string {
  return (
    firstString(record, [
      "camera_name",
      "cameraName",
      "camera_id",
      "cameraId",
      "stream_name",
      "source",
    ]) ?? ""
  );
}

function formatTime(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function normalizeEvent(value: unknown, index: number): EventHistoryItem {
  const record = asRecord(value);
  const confidenceValue = record.confidence ?? record.score ?? record.probability ?? 0;
  const confidence = Number(confidenceValue);
  const type =
    firstString(record, ["event_type", "eventType", "type", "class_name", "label"]) ??
    "Detection";

  return {
    id:
      firstString(record, ["id", "event_id", "eventId", "uuid"]) ??
      `${eventCameraName(record) || "event"}-${index}`,
    time: formatTime(
      firstString(record, ["timestamp", "created_at", "createdAt", "time", "detected_at"])
    ),
    type,
    details:
      firstString(record, ["description", "details", "message", "object_name"]) ??
      `${type} detected`,
    confidence: Number.isFinite(confidence)
      ? Math.round((confidence <= 1 ? confidence * 100 : confidence) * 10) / 10
      : 0,
  };
}

export async function fetchEventHistory(
  cameraId: string,
  count = 8
): Promise<EventHistoryItem[]> {
  const response = await fetch("/api/ai/events?limit=1000&image_status=all", {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Events API returned ${response.status}`);

  const payload = (await response.json()) as unknown;
  const cameraKey = cameraId.toLowerCase();
  const matchingRows = rows(payload).filter((value) => {
    const name = eventCameraName(asRecord(value)).toLowerCase();
    return !name || name === cameraKey;
  });

  return matchingRows.slice(0, count).map(normalizeEvent);
}
