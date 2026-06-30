import { useQuery } from "@tanstack/react-query";
import { fetchOperatorById, fetchOperators } from "@/lib/services/operatorsService";

export function useOperators() {
  return useQuery({ queryKey: ["operators"], queryFn: fetchOperators });
}

export function useOperator(id: string | null) {
  return useQuery({
    queryKey: ["operator", id],
    queryFn: () => fetchOperatorById(id),
    enabled: Boolean(id),
  });
}
