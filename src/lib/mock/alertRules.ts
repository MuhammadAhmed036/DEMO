import { createRng, REFERENCE_NOW } from "@/lib/mock/seed";
import { CAMERAS } from "@/lib/mock/cameras";
import { ALERT_BBOX_DEMO_ITEMS } from "@/lib/mock/alertBoundingBoxDemo";
import type { AlertCategory } from "@/lib/types";

const CATEGORY_BY_SEVERITY: Record<string, AlertCategory> = {
  critical: "critical",
  high: "medium",
  medium: "medium",
  low: "low",
};

// This demo only detects people (every rule's `label` is "person") — these
// per-location titles/descriptions replace the old randomly-picked
// ALERT_TYPE_DEFS entries, which included vehicle/traffic copy ("Traffic
// Violation", "Vehicle in No Parking Zone") that made no sense next to a
// person-only bounding-box snapshot.
const PERSON_ALERT_COPY: Record<string, { title: string; description: string; severity: string }> = {
  airport_persons: {
    title: "Person Detected - Airport",
    description: "Person detected in the airport terminal camera view",
    severity: "high",
  },
  ceo: {
    title: "Person Detected - CEO Office",
    description: "Unauthorized person detected in the CEO office",
    severity: "critical",
  },
  entrance: {
    title: "Person Detected - Entrance",
    description: "Person detected entering through the main entrance",
    severity: "medium",
  },
  kitchen: {
    title: "Person Detected - Kitchen",
    description: "Person detected in the kitchen area",
    severity: "low",
  },
};

type BoundingBoxRow = { x1: number; y1: number; x2: number; y2: number; region?: string };
type ConditionsRow = {
  condition: string;
  trigger_inside: boolean;
  trigger_outside: boolean;
  person_label: string;
};

interface AlertRuleRow {
  id: number;
  alert_id: string;
  camera_id: string;
  zone: string | null;
  collection_id: string | null;
  collection_name: string | null;
  label: string | null;
  name: string | null;
  description: string | null;
  source_event_id: string | null;
  bounding_box: BoundingBoxRow | null;
  demo_image_key: string | null;
  conditions: ConditionsRow | null;
  metadata: { category: AlertCategory; ref_image_width: number; ref_image_height: number };
  person_count_inside: number;
  person_count_outside: number;
  seen_count: number;
  unseen_count: number;
  seen: boolean;
  seen_by: string[];
  seen_at: string | null;
  status: string;
  latest_event_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  event_count: number;
}

interface AlertMatchEventRow {
  id: number;
  alert_id: string;
  event_id: string;
  camera_id: string;
  detection_ts: string;
  person_count_inside: number;
  person_count_outside: number;
  bounding_box: BoundingBoxRow | null;
  note: string | null;
  seen: boolean;
  is_latest: boolean;
  created_at: string;
}

// Demo alert rules live in memory only — a page refresh (or server restart
// on Vercel) resets create/update/delete/mark-seen actions back to this
// deterministic seed set, which is expected for a backend-free demo.
// cam-fai-01 ("Airport Entrance") is dedicated to the vehicle-detection
// scenario on its camera detail page — excluded here so these unrelated
// person-detection alerts never land on it and confuse the two.
const PERSON_ALERT_CAMERA_POOL = CAMERAS.filter((c) => c.id !== "cam-fai-01");

function buildRules(): AlertRuleRow[] {
  const rng = createRng(55219);
  const rules: AlertRuleRow[] = [];
  const statusPool = ["active", "active", "resolved", "muted"];

  for (let i = 0; i < 4; i++) {
    const camera = rng.pick(PERSON_ALERT_CAMERA_POOL);
    const bboxItem = ALERT_BBOX_DEMO_ITEMS[i % ALERT_BBOX_DEMO_ITEMS.length];
    const copy = PERSON_ALERT_COPY[bboxItem.key];
    const status = rng.pick(statusPool);
    const createdMinutesAgo = rng.int(20, 60 * 24 * 5);
    const createdAt = new Date(REFERENCE_NOW.getTime() - createdMinutesAgo * 60_000).toISOString();
    const seen = rng.bool(0.6);
    const unseenCount = seen ? 0 : rng.int(1, 6);

    rules.push({
      id: i + 1,
      alert_id: `alrt_${String(i + 1).padStart(4, "0")}`,
      camera_id: camera.id,
      zone: camera.zoneName,
      collection_id: null,
      collection_name: null,
      label: "person",
      name: copy.title,
      description: copy.description,
      source_event_id: null,
      bounding_box: {
        x1: rng.int(50, 200),
        y1: rng.int(50, 150),
        x2: rng.int(300, 500),
        y2: rng.int(300, 450),
      },
      demo_image_key: bboxItem.key,
      conditions: {
        condition: "boundary",
        trigger_inside: true,
        trigger_outside: false,
        person_label: "person",
      },
      metadata: {
        category: CATEGORY_BY_SEVERITY[copy.severity] ?? "medium",
        ref_image_width: 1920,
        ref_image_height: 1080,
      },
      person_count_inside: rng.int(0, 5),
      person_count_outside: rng.int(0, 3),
      seen_count: rng.int(unseenCount, unseenCount + 20),
      unseen_count: unseenCount,
      seen,
      seen_by: seen ? ["demo-operator"] : [],
      seen_at: seen ? createdAt : null,
      status,
      latest_event_id: null,
      created_by: "demo",
      created_at: createdAt,
      updated_at: createdAt,
      event_count: rng.int(1, 40),
    });
  }

  // A dedicated 5th rule for cam-fai-01 ("Airport Entrance") — its detail
  // panel shows the camera's live feed plus the captured vehicle snapshot,
  // rather than a static bounding-box frame like the person alerts above.
  const airportEntranceCamera = CAMERAS.find((c) => c.id === "cam-fai-01");
  if (airportEntranceCamera) {
    const createdAt = new Date(REFERENCE_NOW.getTime() - 14 * 60_000).toISOString();
    rules.push({
      id: 5,
      alert_id: "alrt_0005",
      camera_id: airportEntranceCamera.id,
      zone: airportEntranceCamera.zoneName,
      collection_id: null,
      collection_name: null,
      label: "vehicle",
      name: "Airport Entrance Area",
      description: "Vehicle detected and tracked at the airport entrance gate.",
      source_event_id: null,
      bounding_box: { x1: 63, y1: 178, x2: 995, y2: 812 },
      demo_image_key: "airport_entrance_area",
      conditions: {
        condition: "boundary",
        trigger_inside: true,
        trigger_outside: false,
        person_label: "vehicle",
      },
      metadata: { category: "critical", ref_image_width: 1911, ref_image_height: 852 },
      person_count_inside: 0,
      person_count_outside: 0,
      seen_count: 6,
      unseen_count: 1,
      seen: false,
      seen_by: [],
      seen_at: null,
      status: "active",
      latest_event_id: null,
      created_by: "demo",
      created_at: createdAt,
      updated_at: createdAt,
      event_count: 6,
    });
  }

  return rules.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

const rows: AlertRuleRow[] = buildRules();
const historyByAlertId = new Map<string, AlertMatchEventRow[]>();
let nextRuleSeq = rows.length + 1;
let nextEventSeq = 1;

export interface AlertRuleFilterParams {
  status?: string;
  cameraId?: string;
  zone?: string;
  seen?: string;
  q?: string;
}

export function listAlertRules(filters: AlertRuleFilterParams): AlertRuleRow[] {
  return rows.filter((rule) => {
    if (filters.status && filters.status !== "all" && rule.status !== filters.status) return false;
    if (filters.cameraId && rule.camera_id !== filters.cameraId) return false;
    if (filters.zone && rule.zone !== filters.zone) return false;
    if (filters.seen !== undefined && String(rule.seen) !== filters.seen) return false;
    if (
      filters.q &&
      !`${rule.name ?? ""} ${rule.description ?? ""}`.toLowerCase().includes(filters.q.toLowerCase())
    )
      return false;
    return true;
  });
}

export function getAlertRuleStats() {
  const byStatus: Record<string, number> = {};
  let seen = 0;
  let unseen = 0;
  rows.forEach((rule) => {
    byStatus[rule.status] = (byStatus[rule.status] ?? 0) + 1;
    if (rule.seen) seen++;
    else unseen++;
  });
  return { total: rows.length, by_status: byStatus, seen, unseen };
}

export function getAlertRule(alertId: string): AlertRuleRow | undefined {
  return rows.find((r) => r.alert_id === alertId);
}

export function getAlertHistory(alertId: string): AlertMatchEventRow[] {
  return historyByAlertId.get(alertId) ?? [];
}

export function createAlertRuleRow(payload: Record<string, unknown>): AlertRuleRow {
  const now = new Date().toISOString();
  const seq = nextRuleSeq++;
  const row: AlertRuleRow = {
    id: seq,
    alert_id: `alrt_${String(seq).padStart(4, "0")}`,
    camera_id: String(payload.camera_id ?? ""),
    zone: (payload.zone as string) ?? null,
    collection_id: null,
    collection_name: null,
    label: (payload.label as string) ?? null,
    name: (payload.name as string) ?? null,
    description: (payload.description as string) ?? null,
    source_event_id: (payload.source_event_id as string) ?? null,
    bounding_box: (payload.bounding_box as BoundingBoxRow) ?? null,
    demo_image_key: null,
    conditions: (payload.conditions as ConditionsRow) ?? null,
    metadata: (payload.metadata as AlertRuleRow["metadata"]) ?? {
      category: "medium",
      ref_image_width: 1920,
      ref_image_height: 1080,
    },
    person_count_inside: 0,
    person_count_outside: 0,
    seen_count: 0,
    unseen_count: 0,
    seen: false,
    seen_by: [],
    seen_at: null,
    status: "active",
    latest_event_id: null,
    created_by: (payload.created_by as string) ?? "dashboard",
    created_at: now,
    updated_at: now,
    event_count: 0,
  };
  rows.unshift(row);
  return row;
}

export function updateAlertRuleStatusRow(alertId: string, status: string): AlertRuleRow | undefined {
  const row = getAlertRule(alertId);
  if (!row) return undefined;
  row.status = status;
  row.updated_at = new Date().toISOString();
  return row;
}

export function deleteAlertRuleRow(alertId: string): boolean {
  const index = rows.findIndex((r) => r.alert_id === alertId);
  if (index === -1) return false;
  rows.splice(index, 1);
  return true;
}

export function markAlertRuleSeenRow(alertId: string, seen = true): AlertRuleRow | undefined {
  const row = getAlertRule(alertId);
  if (!row) return undefined;
  row.seen = seen;
  row.seen_by = seen ? ["demo-operator"] : [];
  row.seen_at = seen ? new Date().toISOString() : null;
  if (seen) row.unseen_count = 0;
  row.updated_at = new Date().toISOString();
  return row;
}

export function appendAlertEventRow(alertId: string, payload: Record<string, unknown>): void {
  const row = getAlertRule(alertId);
  if (!row) return;
  const now = new Date().toISOString();
  const history = historyByAlertId.get(alertId) ?? [];
  history.forEach((h) => (h.is_latest = false));
  history.push({
    id: nextEventSeq++,
    alert_id: alertId,
    event_id: String(payload.event_id ?? `evt_${nextEventSeq}`),
    camera_id: row.camera_id,
    detection_ts: now,
    person_count_inside: Number(payload.person_count_inside) || 0,
    person_count_outside: Number(payload.person_count_outside) || 0,
    bounding_box: (payload.bounding_box as BoundingBoxRow) ?? null,
    note: (payload.note as string) ?? null,
    seen: false,
    is_latest: true,
    created_at: now,
  });
  historyByAlertId.set(alertId, history);
  row.event_count += 1;
  row.unseen_count += 1;
  row.updated_at = now;
}
