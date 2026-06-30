import type { EventHistoryItem } from "@/lib/types";
import { buildEventHistory } from "@/lib/mock/events";

const LATENCY_MS = 180;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function fetchEventHistory(cameraId: string, count = 8): Promise<EventHistoryItem[]> {
  return delay(buildEventHistory(cameraId, count));
}
