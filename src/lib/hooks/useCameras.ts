import { useQuery } from "@tanstack/react-query";
import {
  fetchCameraById,
  fetchCameras,
  fetchCamerasByZone,
} from "@/lib/services/camerasService";

export function useCameras() {
  return useQuery({ queryKey: ["cameras"], queryFn: fetchCameras });
}

export function useCamerasByZone(zoneId: string | null) {
  return useQuery({
    queryKey: ["cameras", "zone", zoneId],
    queryFn: () => fetchCamerasByZone(zoneId as string),
    enabled: Boolean(zoneId),
  });
}

export function useCamera(id: string | null) {
  return useQuery({
    queryKey: ["camera", id],
    queryFn: () => fetchCameraById(id as string),
    enabled: Boolean(id),
  });
}
