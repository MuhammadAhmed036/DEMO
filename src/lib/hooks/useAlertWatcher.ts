"use client";

import { useEffect, useRef } from "react";
import { appendAlertEvent, fetchAlertRules } from "@/lib/services/alertRulesService";
import { subscribeToAllCamerasFeed } from "@/lib/allCamerasFeed";
import type { AlertRuleV2 } from "@/lib/types";

const COOLDOWN_MS = 15_000;
const RULES_REFRESH_MS = 15_000;

interface NormBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function intersects(a: NormBox, b: NormBox): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

/**
 * Best-effort, browser-side alert-region evaluator.
 *
 * The detection API's documented design expects the C++/NATS worker (which
 * already computes bounding boxes for every frame) to check saved alert
 * regions itself and call `POST /api/v2/alerts/{id}/events` when a person's
 * box matches. This hook is an interim stand-in that performs the same
 * check from the browser instead, using the `/ws/v2/people-count/all` live
 * feed to learn about each new detection, then fetching that detection's
 * full bounding boxes and testing them against saved regions.
 *
 * Caveat: this only runs while a browser tab with this dashboard mounted is
 * open. For guaranteed always-on detection, the same region-intersection
 * check should be ported into the detection worker, which already has the
 * bbox data with no extra network round trip.
 *
 * Scope: only evaluates rules with `conditions.triggerInside` (a person's
 * box touches or is inside the drawn region). `triggerOutside` is saved
 * with the rule but intentionally not auto-fired here — "alert when a
 * person is outside a zone" would trigger on nearly every frame for any
 * camera where the zone isn't the entire view, and needs a clearer,
 * debounced product definition before it's safe to automate.
 */
export function useAlertWatcher() {
  const rulesRef = useRef<AlertRuleV2[]>([]);
  const cooldownRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function refreshRules() {
      try {
        const rules = await fetchAlertRules({ status: "active" });
        if (cancelled) return;
        rulesRef.current = rules.filter(
          (rule) =>
            rule.boundingBox &&
            rule.refImageWidth &&
            rule.refImageHeight &&
            rule.conditions?.triggerInside
        );
      } catch {
        // Keep the previous rule set if a refresh fails; the next tick retries.
      }
    }

    refreshRules();
    const interval = setInterval(refreshRules, RULES_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    async function handleDetectionEvent(cameraId: string, eventId: string) {
      const dueRules = rulesRef.current.filter((rule) => {
        if (rule.cameraId !== cameraId) return false;
        const last = cooldownRef.current.get(rule.alertId) ?? 0;
        return Date.now() - last > COOLDOWN_MS;
      });
      if (dueRules.length === 0) return;

      const response = await fetch(`/api/ai/v2/events/${encodeURIComponent(eventId)}`, {
        cache: "no-store",
      }).catch(() => null);
      if (!response?.ok) return;

      const event = asRecord(await response.json());
      const imageWidth = Number(event.image_width);
      const imageHeight = Number(event.image_height);
      const detections = Array.isArray(event.detections) ? event.detections : [];
      if (!imageWidth || !imageHeight || detections.length === 0) return;

      const personBoxes: NormBox[] = [];
      for (const raw of detections) {
        const detection = asRecord(raw);
        const label = String(detection.class_name ?? "").toLowerCase();
        const normXyxy = detection.bbox_norm_xyxy as [number, number, number, number] | undefined;
        const pixelXyxy = detection.bbox_xyxy as [number, number, number, number] | undefined;
        if (label !== "person") continue;

        if (Array.isArray(normXyxy) && normXyxy.length === 4) {
          personBoxes.push({ x1: normXyxy[0], y1: normXyxy[1], x2: normXyxy[2], y2: normXyxy[3] });
        } else if (Array.isArray(pixelXyxy) && pixelXyxy.length === 4) {
          personBoxes.push({
            x1: pixelXyxy[0] / imageWidth,
            y1: pixelXyxy[1] / imageHeight,
            x2: pixelXyxy[2] / imageWidth,
            y2: pixelXyxy[3] / imageHeight,
          });
        }
      }
      if (personBoxes.length === 0) return;

      for (const rule of dueRules) {
        const box = rule.boundingBox;
        if (!box || !rule.refImageWidth || !rule.refImageHeight) continue;
        const region: NormBox = {
          x1: box.x1 / rule.refImageWidth,
          y1: box.y1 / rule.refImageHeight,
          x2: box.x2 / rule.refImageWidth,
          y2: box.y2 / rule.refImageHeight,
        };
        const matchedCount = personBoxes.filter((person) => intersects(person, region)).length;
        if (matchedCount === 0) continue;

        cooldownRef.current.set(rule.alertId, Date.now());
        appendAlertEvent(rule.alertId, {
          eventId,
          personCountInside: matchedCount,
          personCountOutside: personBoxes.length - matchedCount,
          boundingBox: box,
          note: "Auto-detected by dashboard region watcher",
        }).catch(() => {
          // Best-effort — a missed match will likely re-trigger on the next detection.
        });
      }
    }

    return subscribeToAllCamerasFeed((data) => {
      if (data.type !== "people_count") return;
      const cameraId = String(data.camera_id ?? "");
      const eventId = String(data.event_id ?? "");
      if (!cameraId || !eventId) return;
      void handleDetectionEvent(cameraId, eventId);
    });
  }, []);
}
