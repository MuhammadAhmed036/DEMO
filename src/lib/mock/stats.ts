import type { DashboardStats } from "@/lib/types";
import { CAMERAS } from "@/lib/mock/cameras";
import { getLiveAlertFeed } from "@/lib/mock/alerts";

export function buildDashboardStats(): DashboardStats {
  const totalCameras = CAMERAS.length;
  const activeCameras = CAMERAS.filter((c) => c.status === "online").length;
  const offlineCameras = totalCameras - activeCameras;
  const totalPersonsToday = CAMERAS.reduce((sum, c) => sum + c.currentPersonCount * 23, 0);
  const liveAlerts = getLiveAlertFeed();

  return {
    totalCameras,
    activeCameras,
    offlineCameras,
    totalPersonsToday,
    personsTrendPercent: 18.6,
    activeAlerts: liveAlerts.length,
    criticalAlerts: liveAlerts.filter((a) => a.severity === "critical").length,
    offlineCamerasTrendPercent: -3,
    activeAlertTrendPercent: 12,
  };
}
