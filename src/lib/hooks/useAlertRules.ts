import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AlertRuleFilters,
  type CreateAlertRulePayload,
  createAlertRule,
  deleteAlertRule,
  fetchAlertHistory,
  fetchAlertRule,
  fetchAlertRules,
  fetchAlertStats,
  markAlertSeen,
  updateAlertRuleStatus,
} from "@/lib/services/alertRulesService";

export function useAlertRules(filters: AlertRuleFilters = {}) {
  return useQuery({
    queryKey: ["alert-rules", filters],
    queryFn: () => fetchAlertRules(filters),
    refetchInterval: 10_000,
  });
}

export function useAlertStats() {
  return useQuery({
    queryKey: ["alert-rules", "stats"],
    queryFn: fetchAlertStats,
    refetchInterval: 10_000,
  });
}

export function useAlertRule(alertId: string | null) {
  return useQuery({
    queryKey: ["alert-rules", "detail", alertId],
    queryFn: () => fetchAlertRule(alertId as string),
    enabled: Boolean(alertId),
    refetchInterval: 10_000,
  });
}

export function useAlertHistory(alertId: string | null) {
  return useQuery({
    queryKey: ["alert-rules", "history", alertId],
    queryFn: () => fetchAlertHistory(alertId as string),
    enabled: Boolean(alertId),
    refetchInterval: 10_000,
  });
}

function useInvalidateAlertRules() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
}

export function useCreateAlertRule() {
  const invalidate = useInvalidateAlertRules();
  return useMutation({
    mutationFn: (payload: CreateAlertRulePayload) => createAlertRule(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateAlertRuleStatus() {
  const invalidate = useInvalidateAlertRules();
  return useMutation({
    mutationFn: ({ alertId, status }: { alertId: string; status: string }) =>
      updateAlertRuleStatus(alertId, status),
    onSuccess: invalidate,
  });
}

export function useDeleteAlertRule() {
  const invalidate = useInvalidateAlertRules();
  return useMutation({
    mutationFn: (alertId: string) => deleteAlertRule(alertId),
    onSuccess: invalidate,
  });
}

export function useMarkAlertSeen() {
  const invalidate = useInvalidateAlertRules();
  return useMutation({
    mutationFn: ({ alertId, user, seen }: { alertId: string; user?: string; seen?: boolean }) =>
      markAlertSeen(alertId, { user, seen }),
    onSuccess: invalidate,
  });
}
