import { useQuery } from "@tanstack/react-query";
import { fetchAlertsByCamera, fetchLiveAlertFeed } from "@/lib/services/alertsService";

export function useLiveAlertFeed() {
  return useQuery({
    queryKey: ["alerts", "live-feed"],
    queryFn: fetchLiveAlertFeed,
    refetchInterval: 15_000,
  });
}

export function useAlertsByCamera(cameraId: string | null) {
  return useQuery({
    queryKey: ["alerts", "camera", cameraId],
    queryFn: () => fetchAlertsByCamera(cameraId as string),
    enabled: Boolean(cameraId),
  });
}
