import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCameraLocations,
  fetchLatestCameraSnapshot,
  fetchZoneSummaries,
  updateCameraLocation,
} from "@/lib/services/cameraLocationsService";

const REFRESH_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL ?? 5000) || 5000;

export function useCameraLocations() {
  return useQuery({
    queryKey: ["camera-locations"],
    queryFn: fetchCameraLocations,
    refetchInterval: REFRESH_MS,
  });
}

export function useZoneSummaries() {
  return useQuery({ queryKey: ["zone-summaries"], queryFn: fetchZoneSummaries });
}

export function useCameraSnapshot(cameraId: string | null) {
  return useQuery({
    queryKey: ["camera-snapshot", cameraId],
    queryFn: () => fetchLatestCameraSnapshot(cameraId as string),
    enabled: Boolean(cameraId),
  });
}

export function useUpdateCameraLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { cameraId: string; latitude: number; longitude: number }) =>
      updateCameraLocation(variables.cameraId, {
        latitude: variables.latitude,
        longitude: variables.longitude,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camera-locations"] });
      queryClient.invalidateQueries({ queryKey: ["zone-summaries"] });
    },
  });
}
