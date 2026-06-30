import type { EventHistoryItem } from "@/lib/types";
import { createRng } from "@/lib/mock/seed";
import { REFERENCE_NOW } from "@/lib/mock/seed";

const EVENT_TYPES = [
  "High Crowd Density",
  "Line Crossing",
  "Loitering Detected",
  "Vehicle Detected",
  "Person Counting",
];

export function buildEventHistory(cameraId: string, count = 8): EventHistoryItem[] {
  const seed = cameraId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rng = createRng(seed * 97 + 13);
  let minutesAgo = rng.int(2, 12);

  return Array.from({ length: count }, (_, i) => {
    minutesAgo += rng.int(8, 40);
    const type = rng.pick(EVENT_TYPES);
    const time = new Date(REFERENCE_NOW.getTime() - minutesAgo * 60_000);
    const details =
      type === "High Crowd Density"
        ? `Density: ${rng.int(60, 95)}%`
        : type === "Line Crossing"
        ? rng.pick(["South Gate Line", "North Boundary", "East Perimeter"])
        : type === "Loitering Detected"
        ? `Duration: ${rng.int(1, 5)}m ${rng.int(0, 59)}s`
        : type === "Vehicle Detected"
        ? rng.pick(["Sedan", "SUV", "Motorcycle", "Pickup Truck"])
        : `Count: ${rng.int(5, 70)}`;

    return {
      id: `${cameraId}-evt-${i}`,
      time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      type,
      details,
      confidence: rng.int(82, 99),
    };
  });
}
