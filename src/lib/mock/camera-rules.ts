import type { AlertRule } from "@/lib/types";
import { createRng } from "@/lib/mock/seed";

const CUSTOM_RULE_LABELS = ["Crowd > 60 Persons", "Loitering > 2 min", "Vehicle Dwell > 10 min"];
const BUILTIN_RULE_LABELS: { label: string; severity: AlertRule["severity"] }[] = [
  { label: "Intrusion Detection", severity: "high" },
  { label: "Line Crossing", severity: "medium" },
  { label: "Vehicle in Pedestrian Zone", severity: "low" },
];

export function buildCameraCustomRules(cameraId: string): AlertRule[] {
  const seed = cameraId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rng = createRng(seed * 31 + 7);
  const count = rng.int(1, 2);
  return rng
    .shuffle(CUSTOM_RULE_LABELS)
    .slice(0, count)
    .map((label, i) => ({
      id: `${cameraId}-custom-${i}`,
      label,
      severity: rng.pick(["high", "medium"] as const),
      enabled: true,
    }));
}

export function buildCameraBuiltinRules(cameraId: string): AlertRule[] {
  return BUILTIN_RULE_LABELS.map((rule, i) => ({
    id: `${cameraId}-builtin-${i}`,
    label: rule.label,
    severity: rule.severity,
    enabled: true,
  }));
}
