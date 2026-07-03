"use client";

import { useAlertWatcher } from "@/lib/hooks/useAlertWatcher";

/** Mounts the browser-side alert-region watcher for as long as the dashboard shell is open. */
export function AlertWatcherMount() {
  useAlertWatcher();
  return null;
}
