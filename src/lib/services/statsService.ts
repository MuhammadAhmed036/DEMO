import type { DashboardStats, TrendPoint } from "@/lib/types";
import { buildDashboardStats } from "@/lib/mock/stats";
import {
  ACTIVE_ALERT_TREND,
  CROWD_DENSITY_TODAY,
  OFFLINE_CAMERAS_TREND,
  PEOPLE_COUNT_TODAY,
  PERSON_COUNT_TREND,
} from "@/lib/mock/trends";

const LATENCY_MS = 200;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return delay(buildDashboardStats());
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
  return delay(TRENDS[key]);
}
