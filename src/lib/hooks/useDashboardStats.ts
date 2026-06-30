import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, fetchTrend, type TrendKey } from "@/lib/services/statsService";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30_000,
  });
}

export function useTrend(key: TrendKey) {
  return useQuery({ queryKey: ["trend", key], queryFn: () => fetchTrend(key) });
}
