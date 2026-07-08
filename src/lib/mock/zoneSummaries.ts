import { ZONES } from "@/lib/mock/zones";
import { CAMERAS } from "@/lib/mock/cameras";

/** Raw snake_case rows matching the real `/api/v2/zones` shape. */
export function buildZoneSummaryRows() {
  return ZONES.map((zone) => {
    const camerasInZone = CAMERAS.filter((c) => c.zoneId === zone.id);
    const enabledCount = camerasInZone.filter((c) => c.status === "online").length;
    return {
      zone: zone.name,
      camera_count: camerasInZone.length,
      with_coords: camerasInZone.length,
      enabled_count: enabledCount,
    };
  });
}
