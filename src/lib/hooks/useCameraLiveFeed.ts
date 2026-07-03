"use client";

import { useEffect, useState } from "react";
import { wsBaseUrl } from "@/lib/wsBaseUrl";

export interface CameraLiveFeedState {
  connected: boolean;
  cameraName: string | null;
  zone: string | null;
  scene: string | null;
  latestEventId: string | null;
  peopleCount: number | null;
  lastDetectionTime: string | null;
  error: string | null;
}

const INITIAL_STATE: CameraLiveFeedState = {
  connected: false,
  cameraName: null,
  zone: null,
  scene: null,
  latestEventId: null,
  peopleCount: null,
  lastDetectionTime: null,
  error: null,
};

const RECONNECT_MS = 3000;

export function liveEventImageUrl(eventId: string): string {
  return `/api/ai/v2/events/${encodeURIComponent(eventId)}/image?kind=raw`;
}

/** Subscribes to `/ws/v2/people-count` for one camera and tracks its latest detection. */
export function useCameraLiveFeed(cameraId: string | null) {
  const base = wsBaseUrl();
  const [state, setState] = useState<CameraLiveFeedState>(INITIAL_STATE);

  useEffect(() => {
    // Callers should `key` the component using this hook by `cameraId` so a
    // camera switch remounts fresh (via the useState initializer above)
    // instead of resetting state from within this effect.
    if (!cameraId || !base) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function connect() {
      const url = `${base}/ws/v2/people-count?camera_id=${encodeURIComponent(cameraId as string)}&bucket=1m&mode=latest`;
      socket = new WebSocket(url);

      socket.onopen = () => {
        if (cancelled) return;
        setState((s) => ({ ...s, connected: true, error: null }));
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.type === "connected") {
          setState((s) => ({
            ...s,
            connected: true,
            cameraName: typeof data.camera_name === "string" ? data.camera_name : s.cameraName,
            zone: typeof data.zone === "string" ? data.zone : s.zone,
            scene: typeof data.scene === "string" ? data.scene : s.scene,
          }));
        } else if (data.type === "people_count") {
          setState((s) => ({
            ...s,
            connected: true,
            latestEventId: typeof data.event_id === "string" ? data.event_id : s.latestEventId,
            peopleCount: typeof data.people_count === "number" ? data.people_count : s.peopleCount,
            lastDetectionTime: typeof data.time === "string" ? data.time : s.lastDetectionTime,
          }));
        } else if (data.type === "error") {
          setState((s) => ({
            ...s,
            error: typeof data.message === "string" ? data.message : "WebSocket error",
          }));
        }
      };

      socket.onclose = () => {
        if (cancelled) return;
        setState((s) => ({ ...s, connected: false }));
        reconnectTimer = setTimeout(connect, RECONNECT_MS);
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [cameraId, base]);

  if (cameraId && !base) {
    return { ...INITIAL_STATE, error: "NEXT_PUBLIC_API_BASE is not configured" };
  }
  return state;
}
