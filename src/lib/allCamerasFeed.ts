"use client";

import { wsBaseUrl } from "@/lib/wsBaseUrl";
import { isDemoMode } from "@/lib/demoMode";
import { CAMERAS } from "@/lib/mock/cameras";

type FeedListener = (message: Record<string, unknown>) => void;

const RECONNECT_MS = 5000;
const DEMO_TICK_MS = 3000;

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let demoTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<FeedListener>();
let manuallyClosed = false;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/** Broadcasts a plausible fake `people_count` message for a rotating subset of mock cameras. */
function startDemoTicker() {
  let cursor = 0;
  demoTimer = setInterval(() => {
    const online = CAMERAS.filter((c) => c.status === "online");
    if (online.length === 0) return;
    const batch = Math.min(15, online.length);
    for (let i = 0; i < batch; i++) {
      const camera = online[(cursor + i) % online.length];
      const delta = Math.round((Math.random() - 0.5) * 6);
      const peopleCount = Math.max(0, camera.currentPersonCount + delta);
      listeners.forEach((listener) =>
        listener({
          type: "people_count",
          camera_id: camera.id,
          camera_name: camera.name,
          zone: camera.zoneName,
          people_count: peopleCount,
          time: new Date().toISOString(),
        })
      );
    }
    cursor = (cursor + batch) % online.length;
  }, DEMO_TICK_MS);
}

function connect() {
  if (isDemoMode()) {
    startDemoTicker();
    return;
  }

  const base = wsBaseUrl();
  if (!base) return;

  socket = new WebSocket(`${base}/ws/v2/people-count/all?bucket=1m&mode=latest`);

  socket.onmessage = (event) => {
    let data: Record<string, unknown>;
    try {
      data = asRecord(JSON.parse(event.data));
    } catch {
      return;
    }
    listeners.forEach((listener) => listener(data));
  };

  socket.onclose = () => {
    if (manuallyClosed) return;
    reconnectTimer = setTimeout(connect, RECONNECT_MS);
  };

  socket.onerror = () => {
    socket?.close();
  };
}

/**
 * Shared subscription to `/ws/v2/people-count/all` — one real WebSocket
 * connection regardless of how many consumers subscribe (the alert
 * watcher, live occupancy tracking, etc.). Previously each consumer opened
 * its own connection to this same feed, doubling traffic and message-driven
 * re-renders on any page using more than one of them at once.
 */
export function subscribeToAllCamerasFeed(listener: FeedListener): () => void {
  if (listeners.size === 0) {
    manuallyClosed = false;
    connect();
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      manuallyClosed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (demoTimer) clearInterval(demoTimer);
      demoTimer = null;
      socket?.close();
      socket = null;
    }
  };
}
