import type { Alert, AlertRule, AlertSeverity, AlertStatus } from "@/lib/types";
import { ALERTS, getAlertById, getLiveAlertFeed } from "@/lib/mock/alerts";

const LATENCY_MS = 200;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface AlertFilters {
  tab?: "all" | "active" | "acknowledged" | "resolved";
  severity?: AlertSeverity | "all";
  status?: AlertStatus | "all";
  search?: string;
}

export async function fetchAlerts(filters: AlertFilters = {}): Promise<Alert[]> {
  let result = [...ALERTS];

  if (filters.tab === "active") result = result.filter((a) => a.status === "active");
  else if (filters.tab === "acknowledged")
    result = result.filter((a) => a.status === "acknowledged");
  else if (filters.tab === "resolved")
    result = result.filter((a) => a.status === "resolved" || a.status === "closed");
  else if (!filters.tab || filters.tab === "all")
    result = result.filter((a) => a.status !== "resolved" && a.status !== "closed");

  if (filters.severity && filters.severity !== "all")
    result = result.filter((a) => a.severity === filters.severity);

  if (filters.status && filters.status !== "all")
    result = result.filter((a) => a.status === filters.status);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.cameraName.toLowerCase().includes(q) ||
        a.cameraCode.toLowerCase().includes(q) ||
        a.zoneName.toLowerCase().includes(q)
    );
  }

  return delay(result);
}

export async function fetchLiveAlertFeed(): Promise<Alert[]> {
  return delay(getLiveAlertFeed());
}

export async function fetchAlertsByCamera(cameraId: string): Promise<Alert[]> {
  return delay(ALERTS.filter((a) => a.cameraId === cameraId));
}

export async function fetchAlertById(id: string): Promise<Alert | undefined> {
  return delay(getAlertById(id));
}

export interface AlertSummary {
  tabCounts: { all: number; active: number; acknowledged: number; resolved: number };
  severityCounts: Record<AlertSeverity, number>;
}

export async function fetchAlertSummary(): Promise<AlertSummary> {
  const nonResolved = ALERTS.filter((a) => a.status !== "resolved" && a.status !== "closed");
  return delay({
    tabCounts: {
      all: nonResolved.length,
      active: ALERTS.filter((a) => a.status === "active").length,
      acknowledged: ALERTS.filter((a) => a.status === "acknowledged").length,
      resolved: ALERTS.filter((a) => a.status === "resolved" || a.status === "closed").length,
    },
    severityCounts: {
      critical: nonResolved.filter((a) => a.severity === "critical").length,
      high: nonResolved.filter((a) => a.severity === "high").length,
      medium: nonResolved.filter((a) => a.severity === "medium").length,
      low: nonResolved.filter((a) => a.severity === "low").length,
    },
  });
}

export async function acknowledgeAlert(id: string): Promise<Alert | undefined> {
  const alert = getAlertById(id);
  if (alert) alert.status = "acknowledged";
  return delay(alert);
}

export async function resolveAlert(id: string): Promise<Alert | undefined> {
  const alert = getAlertById(id);
  if (alert) alert.status = "resolved";
  return delay(alert);
}

export async function assignOperator(
  id: string,
  operatorId: string
): Promise<Alert | undefined> {
  const alert = getAlertById(id);
  if (alert) alert.assignedOperatorId = operatorId;
  return delay(alert);
}

export async function updateAlertNotes(id: string, notes: string): Promise<Alert | undefined> {
  const alert = getAlertById(id);
  if (alert) alert.notes = notes;
  return delay(alert);
}

export interface CreateAlertRulePayload {
  name: string;
  cameraOrZone: string;
  alertType: string;
  condition: string;
  threshold: number;
  duration: number;
  durationUnit: "Minutes" | "Hours";
  severity: AlertSeverity;
  notificationMethods: string[];
  enabled: boolean;
}

const ALERT_RULES: AlertRule[] = [];

export async function createAlertRule(payload: CreateAlertRulePayload): Promise<AlertRule> {
  const rule: AlertRule = {
    id: `rule-${ALERT_RULES.length + 1}`,
    label: payload.name,
    severity: payload.severity,
    enabled: payload.enabled,
  };
  ALERT_RULES.push(rule);
  return delay(rule);
}

export async function fetchAlertRules(): Promise<AlertRule[]> {
  return delay(ALERT_RULES);
}
