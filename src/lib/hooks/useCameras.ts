"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type { Camera } from "@/lib/types";

const pollInterval = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL ?? 5000);
const refreshInterval = Number.isFinite(pollInterval) && pollInterval > 0 ? pollInterval : 5000;

async function cameraFetcher(url: string): Promise<Camera[]> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as Camera[] | { error?: string };
  if (!response.ok) {
    const message = Array.isArray(payload) ? undefined : payload.error;
    throw new Error(message || `Camera API returned ${response.status}`);
  }
  if (!Array.isArray(payload)) throw new Error("Camera API returned an invalid response");
  return payload;
}

export function useCameras() {
  return useSWR<Camera[], Error>("/api/stream-cameras", cameraFetcher, {
    refreshInterval,
    keepPreviousData: true,
    revalidateOnFocus: true,
  });
}

export function useCamerasByZone(zoneId: string | null) {
  const query = useCameras();
  const data = useMemo(
    () => (zoneId ? query.data?.filter((camera) => camera.zoneId === zoneId) : undefined),
    [query.data, zoneId]
  );
  return { ...query, data };
}

export function useCamera(id: string | null) {
  const query = useCameras();
  const decodedId = useMemo(() => {
    if (!id) return null;
    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  }, [id]);
  const data = useMemo(
    () =>
      decodedId
        ? query.data?.find(
            (camera) =>
              camera.id === decodedId ||
              camera.sourceName === decodedId ||
              camera.code === decodedId
          )
        : undefined,
    [query.data, decodedId]
  );
  return { ...query, data };
}
