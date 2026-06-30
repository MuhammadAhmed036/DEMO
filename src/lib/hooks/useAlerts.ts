import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acknowledgeAlert,
  assignOperator,
  type AlertFilters,
  type CreateAlertRulePayload,
  createAlertRule,
  fetchAlertById,
  fetchAlerts,
  fetchAlertsByCamera,
  fetchAlertSummary,
  fetchLiveAlertFeed,
  resolveAlert,
  updateAlertNotes,
} from "@/lib/services/alertsService";

export function useAlerts(filters: AlertFilters) {
  return useQuery({
    queryKey: ["alerts", filters],
    queryFn: () => fetchAlerts(filters),
  });
}

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

export function useAlertSummary() {
  return useQuery({ queryKey: ["alerts", "summary"], queryFn: fetchAlertSummary });
}

export function useAlert(id: string | null) {
  return useQuery({
    queryKey: ["alert", id],
    queryFn: () => fetchAlertById(id as string),
    enabled: Boolean(id),
  });
}

function useInvalidateAlerts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
    queryClient.invalidateQueries({ queryKey: ["alert"] });
  };
}

export function useAcknowledgeAlert() {
  const invalidate = useInvalidateAlerts();
  return useMutation({
    mutationFn: (id: string) => acknowledgeAlert(id),
    onSuccess: invalidate,
  });
}

export function useResolveAlert() {
  const invalidate = useInvalidateAlerts();
  return useMutation({
    mutationFn: (id: string) => resolveAlert(id),
    onSuccess: invalidate,
  });
}

export function useAssignOperator() {
  const invalidate = useInvalidateAlerts();
  return useMutation({
    mutationFn: ({ id, operatorId }: { id: string; operatorId: string }) =>
      assignOperator(id, operatorId),
    onSuccess: invalidate,
  });
}

export function useUpdateAlertNotes() {
  const invalidate = useInvalidateAlerts();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => updateAlertNotes(id, notes),
    onSuccess: invalidate,
  });
}

export function useCreateAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAlertRulePayload) => createAlertRule(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alert-rules"] }),
  });
}
