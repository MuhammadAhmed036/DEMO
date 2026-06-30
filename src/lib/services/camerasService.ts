import type { Camera } from "@/lib/types";
import { CAMERAS, getCameraById, getCamerasByZone } from "@/lib/mock/cameras";

/**
 * Mock-backed data-access layer. Every export here is async and shaped like
 * a future REST/GraphQL call so swapping the body for `fetch("/api/...")`
 * (or a server action) later is a localized, one-function change — nothing
 * upstream (hooks/components) needs to change shape.
 */
const LATENCY_MS = 220;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function fetchCameras(): Promise<Camera[]> {
  return delay(CAMERAS);
}

export async function fetchCamerasByZone(zoneId: string): Promise<Camera[]> {
  return delay(getCamerasByZone(zoneId));
}

export async function fetchCameraById(id: string): Promise<Camera | undefined> {
  return delay(getCameraById(id));
}
