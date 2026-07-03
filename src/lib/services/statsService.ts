import type { DashboardStats, TrendPoint } from "@/lib/types";
import {
  ACTIVE_ALERT_TREND,
  CROWD_DENSITY_TODAY,
  OFFLINE_CAMERAS_TREND,
  PEOPLE_COUNT_TODAY,
  PERSON_COUNT_TREND,
} from "@/lib/mock/trends";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function numeric(record: UnknownRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

/**
 * There's no single "total persons detected" aggregate endpoint in the
 * detection API. `/api/v2/events` returns a `total` row count in its
 * response envelope even with `limit=1`, so a date-ranged query gets an
 * accurate count for a day without paginating through every event.
 * This counts detection *events*, not summed `detection_count` (which would
 * require fetching every matching row — too expensive to poll repeatedly).
 */
async function fetchEventCountInRange(dateFrom: string, dateTo: string): Promise<number> {
  const params = new URLSearchParams({ limit: "1", date_from: dateFrom, date_to: dateTo });
  const response = await fetch(`/api/ai/v2/events?${params.toString()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Events API returned ${response.status}`);
  const payload = asRecord(await response.json());
  return numeric(payload, ["total"]);
}

async function fetchPersonsTodaySummary(): Promise<{ total: number; trendPercent: number }> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [todayCount, yesterdayCount] = await Promise.all([
    fetchEventCountInRange(todayStart.toISOString(), now.toISOString()),
    fetchEventCountInRange(yesterdayStart.toISOString(), todayStart.toISOString()),
  ]);

  const trendPercent =
    yesterdayCount > 0 ? Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 1000) / 10 : 0;

  return { total: todayCount, trendPercent };
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [statsResponse, personsToday] = await Promise.all([
    fetch("/api/ai/stats", { cache: "no-store" }),
    fetchPersonsTodaySummary(),
  ]);
  if (!statsResponse.ok) throw new Error(`Stats API returned ${statsResponse.status}`);

  const payload = asRecord(await statsResponse.json());
  const stats = asRecord(payload.data ?? payload.stats ?? payload);
  const totalCameras = numeric(stats, ["totalCameras", "total_cameras", "camera_count"]);
  const activeCameras = numeric(stats, [
    "activeCameras",
    "active_cameras",
    "online_cameras",
  ]);

  return {
    totalCameras,
    activeCameras,
    offlineCameras: numeric(
      stats,
      ["offlineCameras", "offline_cameras"],
      Math.max(0, totalCameras - activeCameras)
    ),
    totalPersonsToday: personsToday.total,
    personsTrendPercent: personsToday.trendPercent,
    activeAlerts: numeric(stats, ["activeAlerts", "active_alerts", "alert_count"]),
    criticalAlerts: numeric(stats, ["criticalAlerts", "critical_alerts"]),
    offlineCamerasTrendPercent: numeric(stats, [
      "offlineCamerasTrendPercent",
      "offline_cameras_trend_percent",
    ]),
    activeAlertTrendPercent: numeric(stats, [
      "activeAlertTrendPercent",
      "active_alert_trend_percent",
    ]),
  };
}

export type TrendKey =
  | "people-count-today"
  | "crowd-density-today"
  | "person-count-trend"
  | "active-alert-trend"
  | "offline-cameras-trend";

const TRENDS: Record<TrendKey, TrendPoint[]> = {
  "people-count-today": PEOPLE_COUNT_TODAY,
  "crowd-density-today": CROWD_DENSITY_TODAY,
  "person-count-trend": PERSON_COUNT_TREND,
  "active-alert-trend": ACTIVE_ALERT_TREND,
  "offline-cameras-trend": OFFLINE_CAMERAS_TREND,
};

export async function fetchTrend(key: TrendKey): Promise<TrendPoint[]> {
  return TRENDS[key];
}
