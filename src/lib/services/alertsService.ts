import type { Alert } from "@/lib/types";
import { ALERTS, getLiveAlertFeed } from "@/lib/mock/alerts";

const LATENCY_MS = 200;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function fetchLiveAlertFeed(): Promise<Alert[]> {
  return delay(getLiveAlertFeed());
}

export async function fetchAlertsByCamera(cameraId: string): Promise<Alert[]> {
  return delay(ALERTS.filter((a) => a.cameraId === cameraId));
}
