import type { NextRequest } from "next/server";
import { buildDashboardStats } from "@/lib/mock/stats";
import { CAMERA_LOCATION_ROWS, getCameraLocationRow } from "@/lib/mock/cameraLocations";
import { buildZoneSummaryRows } from "@/lib/mock/zoneSummaries";
import { buildCameraEventRows, buildCameraRetentionRows } from "@/lib/mock/cameraEvents";
import {
  appendAlertEventRow,
  createAlertRuleRow,
  deleteAlertRuleRow,
  getAlertHistory,
  getAlertRule,
  getAlertRuleStats,
  listAlertRules,
  markAlertRuleSeenRow,
  updateAlertRuleStatusRow,
} from "@/lib/mock/alertRules";
import { REFERENCE_NOW } from "@/lib/mock/seed";

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function notFound(): Response {
  return json({ error: "Not found" }, 404);
}

/** Deterministic-ish "now" for the demo — sums position-jittered mock camera counts into a stable fake series. */
function buildPeopleCountPoints(fromTs: string, toTs: string, seed: number) {
  const from = new Date(fromTs).getTime();
  const to = new Date(toTs).getTime();
  const bucketMs = 5 * 60_000;
  const points: { time: string; people_count: number; event_count: number }[] = [];
  for (let t = from; t <= to; t += bucketMs) {
    const wave = Math.sin((t / bucketMs + seed) * 0.7) * 8 + 12;
    points.push({
      time: new Date(t).toISOString(),
      people_count: Math.max(0, Math.round(wave + ((t / bucketMs) % 3))),
      event_count: Math.max(0, Math.round(wave / 3)),
    });
  }
  return points;
}

function seedFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) || 1;
}

/**
 * Plausible "persons detected" count for a date range, scaled to a small
 * demo fleet (~6 cameras). Uses real randomness (not a hash of the date
 * range) so each dashboard poll shows a slightly different number — the
 * card visibly ticks instead of sitting frozen at one value.
 */
function personsDetectedFor(dateFrom: string, dateTo: string): number {
  const spanHours = Math.max(
    1,
    (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 3_600_000
  );
  const perHourBaseline = 950;
  const jitter = 0.9 + Math.random() * 0.2; // 0.9x - 1.1x
  const scaled = perHourBaseline * Math.min(spanHours, 24) * jitter;
  // Floor keeps the number looking like a busy live system (~12K+) even a
  // few minutes into the day, instead of crawling up from a tiny value —
  // floor itself jitters too, so it still visibly ticks between polls.
  const floor = 12_000 + Math.random() * 4_000;
  return Math.round(Math.max(floor, scaled));
}

export async function handleDemoAiRequest(
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  request: NextRequest
): Promise<Response> {
  const segments = endpoint.split("/");
  const params = request.nextUrl.searchParams;

  // GET /api/ai/stats
  if (endpoint === "stats" && method === "GET") {
    return json({ data: buildDashboardStats() });
  }

  // GET /api/ai/events?limit=1&date_from=..&date_to=.. (date-ranged total count)
  if (endpoint === "events" && method === "GET") {
    const now = new Date().toISOString();
    const dateFrom = params.get("date_from") ?? now;
    const dateTo = params.get("date_to") ?? now;
    return json({ total: personsDetectedFor(dateFrom, dateTo) });
  }

  // GET /api/ai/camera-retention
  if (endpoint === "camera-retention" && method === "GET") {
    return json({ cameras: buildCameraRetentionRows() });
  }

  // /api/ai/v2/cameras[...]
  if (segments[0] === "v2" && segments[1] === "cameras") {
    if (segments.length === 2) {
      if (method === "GET") return json({ cameras: CAMERA_LOCATION_ROWS });
      if (method === "POST") {
        const payload = await request.json().catch(() => ({}));
        const row = {
          id: CAMERA_LOCATION_ROWS.length + 1,
          camera_id: String(payload.camera_id ?? ""),
          camera_name: String(payload.camera_name ?? payload.camera_id ?? ""),
          camera_ip: null,
          zone: payload.zone ?? null,
          scene: null,
          latitude: Number(payload.latitude),
          longitude: Number(payload.longitude),
          heading_degrees: null,
          address: null,
          building: null,
          floor: null,
          description: null,
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        CAMERA_LOCATION_ROWS.push(row);
        return json(row);
      }
    }

    if (segments.length === 3 && segments[2] === "sync") {
      if (method === "POST") {
        return json({ added: 0, before: CAMERA_LOCATION_ROWS.length, after: CAMERA_LOCATION_ROWS.length });
      }
    }

    if (segments.length === 3) {
      const cameraId = decodeURIComponent(segments[2]);
      if (method === "GET") {
        const row = getCameraLocationRow(cameraId);
        return row ? json(row) : notFound();
      }
      if (method === "PATCH") {
        const row = getCameraLocationRow(cameraId);
        if (!row) return notFound();
        const payload = await request.json().catch(() => ({}));
        if (payload.latitude !== undefined) row.latitude = Number(payload.latitude);
        if (payload.longitude !== undefined) row.longitude = Number(payload.longitude);
        row.updated_at = new Date().toISOString();
        return json(row);
      }
    }

    if (segments.length === 4 && segments[3] === "events" && method === "GET") {
      const cameraId = decodeURIComponent(segments[2]);
      const limit = Number(params.get("limit")) || 1;
      return json({ events: buildCameraEventRows(cameraId, limit) });
    }

    if (segments.length === 4 && segments[3] === "people-count-series" && method === "GET") {
      const cameraId = decodeURIComponent(segments[2]);
      const fromTs = params.get("from_ts") ?? REFERENCE_NOW.toISOString();
      const toTs = params.get("to_ts") ?? REFERENCE_NOW.toISOString();
      return json({ points: buildPeopleCountPoints(fromTs, toTs, seedFromId(cameraId)) });
    }
  }

  // GET /api/ai/v2/zones
  if (endpoint === "v2/zones" && method === "GET") {
    return json({ zones: buildZoneSummaryRows() });
  }

  // GET /api/ai/v2/events?camera_id=&limit=
  if (endpoint === "v2/events" && method === "GET") {
    const cameraId = params.get("camera_id") ?? "unknown";
    const limit = Number(params.get("limit")) || 20;
    return json({ events: buildCameraEventRows(cameraId, limit) });
  }

  // /api/ai/v2/alerts[...]
  if (segments[0] === "v2" && segments[1] === "alerts") {
    if (segments.length === 2) {
      if (method === "GET") {
        const rows = listAlertRules({
          status: params.get("status") ?? undefined,
          cameraId: params.get("camera_id") ?? undefined,
          zone: params.get("zone") ?? undefined,
          seen: params.get("seen") ?? undefined,
          q: params.get("q") ?? undefined,
        });
        return json({ alerts: rows });
      }
      if (method === "POST") {
        const payload = await request.json().catch(() => ({}));
        return json(createAlertRuleRow(payload));
      }
    }

    if (segments.length === 3 && segments[2] === "stats" && method === "GET") {
      return json(getAlertRuleStats());
    }

    if (segments.length === 3) {
      const alertId = decodeURIComponent(segments[2]);
      if (method === "GET") {
        const row = getAlertRule(alertId);
        return row ? json(row) : notFound();
      }
      if (method === "PATCH") {
        const payload = await request.json().catch(() => ({}));
        const row = updateAlertRuleStatusRow(alertId, String(payload.status ?? "active"));
        return row ? json(row) : notFound();
      }
      if (method === "DELETE") {
        return deleteAlertRuleRow(alertId) ? json({ ok: true }) : notFound();
      }
    }

    if (segments.length === 4 && segments[3] === "events") {
      const alertId = decodeURIComponent(segments[2]);
      if (method === "GET") {
        return json({ events: getAlertHistory(alertId) });
      }
      if (method === "POST") {
        const payload = await request.json().catch(() => ({}));
        appendAlertEventRow(alertId, payload);
        return json({ ok: true });
      }
    }

    if (segments.length === 4 && segments[3] === "seen" && method === "POST") {
      const alertId = decodeURIComponent(segments[2]);
      const payload = await request.json().catch(() => ({}));
      const row = markAlertRuleSeenRow(alertId, payload.seen !== false);
      return row ? json(row) : notFound();
    }
  }

  return notFound();
}
