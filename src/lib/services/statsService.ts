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

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch("/api/ai/stats", { cache: "no-store" });
  if (!response.ok) throw new Error(`Stats API returned ${response.status}`);

  const payload = asRecord(await response.json());
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
    totalPersonsToday: numeric(stats, [
      "totalPersonsToday",
      "total_persons_today",
      "persons_today",
      "people_count",
    ]),
    personsTrendPercent: numeric(stats, [
      "personsTrendPercent",
      "persons_trend_percent",
      "people_trend_percent",
    ]),
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
