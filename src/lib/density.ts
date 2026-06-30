import type { Camera } from "@/lib/types";

export function densityColor(density: Camera["density"]): string {
  switch (density) {
    case "Critical":
      return "#ef4444";
    case "High":
      return "#f97316";
    case "Medium":
      return "#eab308";
    default:
      return "#64748b";
  }
}

export function densityTextClass(density: Camera["density"]): string {
  switch (density) {
    case "Critical":
      return "text-severity-critical";
    case "High":
      return "text-severity-high";
    case "Medium":
      return "text-severity-medium";
    default:
      return "text-muted-foreground";
  }
}
