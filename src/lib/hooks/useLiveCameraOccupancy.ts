"use client";

import { useEffect, useState } from "react";
import { wsBaseUrl } from "@/lib/wsBaseUrl";

export interface CameraOccupancy {
  cameraId: string;
  cameraName: string;
  zone: string | null;
  peopleCount: number;
  time: string;
}

const RECONNECT_MS = 5000;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

/**
 * Tracks the latest live people-count per camera via `/ws/v2/people-count/all`.
 * A camera's entry holds its most recent reported count until a newer
 * message updates it — there's no per-camera polling involved.
 */
export function useLiveCameraOccupancy() {
  const [occupancy, setOccupancy] = useState<Record<string, CameraOccupancy>>({});

  useEffect(() => {
    const base = wsBaseUrl();
    if (!base) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function connect() {
      socket = new WebSocket(`${base}/ws/v2/people-count/all?bucket=1m&mode=latest`);

      socket.onmessage = (event) => {
        if (cancelled) return;
        let data: UnknownRecord;
        try {
          data = asRecord(JSON.parse(event.data));
        } catch {
          return;
        }
        if (data.type !== "people_count") return;
        const cameraId = String(data.camera_id ?? "");
        const peopleCount = Number(data.people_count);
        if (!cameraId || !Number.isFinite(peopleCount)) return;

        setOccupancy((prev) => ({
          ...prev,
          [cameraId]: {
            cameraId,
            cameraName: typeof data.camera_name === "string" ? data.camera_name : cameraId,
            zone: typeof data.zone === "string" ? data.zone : null,
            peopleCount,
            time: typeof data.time === "string" ? data.time : new Date().toISOString(),
          },
        }));
      };

      socket.onclose = () => {
        if (cancelled) return;
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
  }, []);

  return occupancy;
}
