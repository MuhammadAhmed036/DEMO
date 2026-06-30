import { useQuery } from "@tanstack/react-query";
import { fetchEventHistory } from "@/lib/services/eventsService";

export function useEventHistory(cameraId: string | null, count = 8) {
  return useQuery({
    queryKey: ["event-history", cameraId, count],
    queryFn: () => fetchEventHistory(cameraId as string, count),
    enabled: Boolean(cameraId),
  });
}
