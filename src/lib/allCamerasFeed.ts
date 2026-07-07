"use client";

import { wsBaseUrl } from "@/lib/wsBaseUrl";

type FeedListener = (message: Record<string, unknown>) => void;

const RECONNECT_MS = 5000;

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<FeedListener>();
let manuallyClosed = false;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function connect() {
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
      socket?.close();
      socket = null;
    }
  };
}
