import type { Alert, AlertSeverity, AlertStatus } from "@/lib/types";
import { createRng } from "@/lib/mock/seed";
import { REFERENCE_NOW } from "@/lib/mock/seed";
import { ALERT_TYPE_DEFS } from "@/lib/mock/alert-types";
import { CAMERAS } from "@/lib/mock/cameras";
import { OPERATORS } from "@/lib/mock/operators";

function typesBySeverity(severity: AlertSeverity) {
  return ALERT_TYPE_DEFS.filter((d) => d.defaultSeverity === severity);
}

function buildAlert(
  rng: ReturnType<typeof createRng>,
  index: number,
  severity: AlertSeverity,
  status: AlertStatus,
  minutesAgo: number
): Alert {
  const pool = typesBySeverity(severity);
  const def = rng.pick(pool.length ? pool : ALERT_TYPE_DEFS);
  const camera = rng.pick(CAMERAS);
  const timestamp = new Date(REFERENCE_NOW.getTime() - minutesAgo * 60_000).toISOString();
  const assignedOperatorId =
    status === "active" || status === "investigating" || rng.bool(0.7)
      ? rng.pick(OPERATORS).id
      : null;

  return {
    id: `alert-${index}`,
    title: def.title,
    description: def.description,
    cameraId: camera.id,
    cameraCode: camera.code,
    cameraName: camera.name,
    zoneId: camera.zoneId,
    zoneName: camera.zoneName,
    severity,
    status,
    timestamp,
    durationSeconds: rng.int(15, 320),
    confidence: rng.int(78, 99),
    assignedOperatorId,
    notes: "",
    type: def.type,
  };
}

function buildAlerts(): Alert[] {
  const rng = createRng(871234);
  const alerts: Alert[] = [];
  let index = 1;
  let minutesAgo = 0;

  // "All Alerts" feed (36 total): Critical 7, High 12, Medium 10, Low 7,
  // statuses split Active 28 / Acknowledged 6 / Investigating 2.
  const severityPlan: { severity: AlertSeverity; count: number }[] = [
    { severity: "critical", count: 7 },
    { severity: "high", count: 12 },
    { severity: "medium", count: 10 },
    { severity: "low", count: 7 },
  ];
  const statusPlan: AlertStatus[] = [
    ...Array(28).fill("active"),
    ...Array(6).fill("acknowledged"),
    ...Array(2).fill("investigating"),
  ];
  const shuffledStatuses = rng.shuffle(statusPlan);

  let statusCursor = 0;
  severityPlan.forEach(({ severity, count }) => {
    for (let i = 0; i < count; i++) {
      minutesAgo += rng.int(2, 9);
      const status = shuffledStatuses[statusCursor++];
      alerts.push(buildAlert(rng, index++, severity, status, minutesAgo));
    }
  });

  // Historical resolved feed (312) — coarser severity mix, all resolved/closed.
  for (let i = 0; i < 312; i++) {
    minutesAgo += rng.int(3, 25);
    const severity = rng.pick<AlertSeverity>(["critical", "high", "medium", "low"]);
    const status: AlertStatus = rng.bool(0.92) ? "resolved" : "closed";
    alerts.push(buildAlert(rng, index++, severity, status, minutesAgo));
  }

  return alerts.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export const ALERTS: Alert[] = buildAlerts();

export const ALERT_FEED_COUNT = 36;

export function getAlertById(id: string): Alert | undefined {
  return ALERTS.find((a) => a.id === id);
}

export function getLiveAlertFeed(): Alert[] {
  return ALERTS.filter((a) => a.status !== "resolved" && a.status !== "closed");
}

export function getResolvedAlerts(): Alert[] {
  return ALERTS.filter((a) => a.status === "resolved" || a.status === "closed");
}
