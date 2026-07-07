import type {
  AlertBoundingBox,
  AlertCategory,
  AlertConditions,
  AlertMatchEvent,
  AlertRuleV2,
  AlertStatsSummary,
} from "@/lib/types";

const ALERT_CATEGORIES: AlertCategory[] = ["critical", "medium", "low"];

function asCategory(value: unknown): AlertCategory {
  return ALERT_CATEGORIES.includes(value as AlertCategory) ? (value as AlertCategory) : "medium";
}

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

function normalizeBoundingBox(value: unknown): AlertBoundingBox | null {
  const record = asRecord(value);
  const x1 = asNumber(record.x1);
  const y1 = asNumber(record.y1);
  const x2 = asNumber(record.x2);
  const y2 = asNumber(record.y2);
  if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
  return { x1, y1, x2, y2, region: asString(record.region) ?? undefined };
}

function normalizeConditions(value: unknown): AlertConditions | null {
  const record = asRecord(value);
  if (!("condition" in record)) return null;
  return {
    condition: String(record.condition ?? "boundary"),
    triggerInside: Boolean(record.trigger_inside),
    triggerOutside: Boolean(record.trigger_outside),
    personLabel: String(record.person_label ?? "person"),
  };
}

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  const detail = asRecord(body).detail ?? asRecord(body).error;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const message = asRecord(detail).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function normalizeAlertRule(raw: unknown): AlertRuleV2 {
  const record = asRecord(raw);
  const metadata = asRecord(record.metadata);

  return {
    id: Number(record.id) || 0,
    alertId: String(record.alert_id ?? ""),
    cameraId: String(record.camera_id ?? ""),
    zone: asString(record.zone),
    collectionId: asString(record.collection_id),
    collectionName: asString(record.collection_name),
    label: asString(record.label),
    name: asString(record.name),
    description: asString(record.description),
    sourceEventId: asString(record.source_event_id),
    boundingBox: normalizeBoundingBox(record.bounding_box),
    conditions: normalizeConditions(record.conditions),
    category: asCategory(metadata.category),
    refImageWidth: asNumber(metadata.ref_image_width),
    refImageHeight: asNumber(metadata.ref_image_height),
    personCountInside: asNumber(record.person_count_inside) ?? 0,
    personCountOutside: asNumber(record.person_count_outside) ?? 0,
    seenCount: asNumber(record.seen_count) ?? 0,
    unseenCount: asNumber(record.unseen_count) ?? 0,
    seen: Boolean(record.seen),
    seenBy: Array.isArray(record.seen_by) ? record.seen_by.map(String) : [],
    seenAt: asString(record.seen_at),
    status: (asString(record.status) as AlertRuleV2["status"]) ?? "active",
    latestEventId: asString(record.latest_event_id),
    createdBy: asString(record.created_by),
    createdAt: asString(record.created_at),
    updatedAt: asString(record.updated_at),
    eventCount: asNumber(record.event_count) ?? 0,
  };
}

function normalizeMatchEvent(raw: unknown): AlertMatchEvent {
  const record = asRecord(raw);
  return {
    id: Number(record.id) || 0,
    alertId: String(record.alert_id ?? ""),
    eventId: String(record.event_id ?? ""),
    cameraId: String(record.camera_id ?? ""),
    detectionTs: asString(record.detection_ts),
    personCountInside: asNumber(record.person_count_inside) ?? 0,
    personCountOutside: asNumber(record.person_count_outside) ?? 0,
    boundingBox: normalizeBoundingBox(record.bounding_box),
    note: asString(record.note),
    seen: Boolean(record.seen),
    isLatest: Boolean(record.is_latest),
    createdAt: asString(record.created_at),
  };
}

export interface AlertRuleFilters {
  status?: string;
  cameraId?: string;
  zone?: string;
  seen?: boolean;
  q?: string;
}

export async function fetchAlertRules(filters: AlertRuleFilters = {}): Promise<AlertRuleV2[]> {
  const params = new URLSearchParams({ limit: "200" });
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.cameraId) params.set("camera_id", filters.cameraId);
  if (filters.zone) params.set("zone", filters.zone);
  if (filters.seen !== undefined) params.set("seen", String(filters.seen));
  if (filters.q) params.set("q", filters.q);

  const response = await fetch(`/api/ai/v2/alerts?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Alerts API returned ${response.status}`));
  }
  const payload = asRecord(await response.json());
  const rows = Array.isArray(payload.alerts) ? payload.alerts : [];
  return rows.map(normalizeAlertRule);
}

export async function fetchAlertStats(): Promise<AlertStatsSummary> {
  const response = await fetch("/api/ai/v2/alerts/stats", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Alert stats API returned ${response.status}`));
  }
  const payload = asRecord(await response.json());
  const byStatus = asRecord(payload.by_status);
  return {
    total: asNumber(payload.total) ?? 0,
    byStatus: Object.fromEntries(Object.entries(byStatus).map(([k, v]) => [k, Number(v) || 0])),
    seen: asNumber(payload.seen) ?? 0,
    unseen: asNumber(payload.unseen) ?? 0,
  };
}

export async function fetchAlertRule(alertId: string): Promise<AlertRuleV2> {
  const response = await fetch(`/api/ai/v2/alerts/${encodeURIComponent(alertId)}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Alert API returned ${response.status}`));
  }
  return normalizeAlertRule(await response.json());
}

export async function fetchAlertHistory(alertId: string): Promise<AlertMatchEvent[]> {
  const response = await fetch(
    `/api/ai/v2/alerts/${encodeURIComponent(alertId)}/events?limit=100`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Alert history API returned ${response.status}`));
  }
  const payload = asRecord(await response.json());
  const rows = Array.isArray(payload.events) ? payload.events : [];
  return rows.map(normalizeMatchEvent);
}

export interface CreateAlertRulePayload {
  cameraId: string;
  zone?: string;
  name: string;
  label: string;
  category: AlertCategory;
  description?: string;
  sourceEventId?: string;
  boundingBox: AlertBoundingBox;
  triggerInside: boolean;
  triggerOutside: boolean;
  refImageWidth: number;
  refImageHeight: number;
  createdBy?: string;
}

export async function createAlertRule(payload: CreateAlertRulePayload): Promise<AlertRuleV2> {
  const response = await fetch("/api/ai/v2/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      camera_id: payload.cameraId,
      zone: payload.zone,
      name: payload.name,
      label: payload.label,
      description: payload.description,
      source_event_id: payload.sourceEventId,
      bounding_box: payload.boundingBox,
      conditions: {
        condition: "boundary",
        trigger_inside: payload.triggerInside,
        trigger_outside: payload.triggerOutside,
        person_label: payload.label,
      },
      status: "active",
      metadata: {
        category: payload.category,
        ref_image_width: payload.refImageWidth,
        ref_image_height: payload.refImageHeight,
      },
      created_by: payload.createdBy ?? "dashboard",
    }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Failed to create alert rule (${response.status})`));
  }
  return normalizeAlertRule(await response.json());
}

export async function updateAlertRuleStatus(
  alertId: string,
  status: string
): Promise<AlertRuleV2> {
  const response = await fetch(`/api/ai/v2/alerts/${encodeURIComponent(alertId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Failed to update alert rule (${response.status})`));
  }
  return normalizeAlertRule(await response.json());
}

export async function deleteAlertRule(alertId: string): Promise<void> {
  const response = await fetch(`/api/ai/v2/alerts/${encodeURIComponent(alertId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Failed to delete alert rule (${response.status})`));
  }
}

export async function markAlertSeen(
  alertId: string,
  options: { user?: string; seen?: boolean } = {}
): Promise<AlertRuleV2> {
  const response = await fetch(`/api/ai/v2/alerts/${encodeURIComponent(alertId)}/seen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Failed to acknowledge alert (${response.status})`));
  }
  return normalizeAlertRule(await response.json());
}

export interface AppendAlertEventPayload {
  eventId: string;
  personCountInside?: number;
  personCountOutside?: number;
  boundingBox?: AlertBoundingBox;
  note?: string;
  createdBy?: string;
}

export async function appendAlertEvent(
  alertId: string,
  payload: AppendAlertEventPayload
): Promise<void> {
  const response = await fetch(`/api/ai/v2/alerts/${encodeURIComponent(alertId)}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_id: payload.eventId,
      person_count_inside: payload.personCountInside,
      person_count_outside: payload.personCountOutside,
      bounding_box: payload.boundingBox,
      note: payload.note,
      created_by: payload.createdBy ?? "frontend-watcher",
    }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, `Failed to record alert match (${response.status})`));
  }
}
