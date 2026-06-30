import { useQuery } from "@tanstack/react-query";
import { fetchZoneBlobsGeoJSON, fetchZoneById, fetchZones } from "@/lib/services/zonesService";

export function useZones() {
  return useQuery({ queryKey: ["zones"], queryFn: fetchZones });
}

export function useZone(id: string | null) {
  return useQuery({
    queryKey: ["zone", id],
    queryFn: () => fetchZoneById(id as string),
    enabled: Boolean(id),
  });
}

export function useZoneBlobs() {
  return useQuery({ queryKey: ["zones", "blobs"], queryFn: fetchZoneBlobsGeoJSON });
}
