"use client";

import { Suspense, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AlertFilters } from "@/components/alerts/AlertFilters";
import { AlertsTable } from "@/components/alerts/AlertsTable";
import { AlertDetailPanel } from "@/components/alerts/AlertDetailPanel";
import { PaginationBar } from "@/components/layout/PaginationBar";
import { Button } from "@/components/ui/button";
import { useAlerts, useAlertSummary } from "@/lib/hooks/useAlerts";
import { useUIStore } from "@/lib/store/useUIStore";
import type { AlertFilters as AlertFiltersValue } from "@/lib/services/alertsService";
import type { AlertSeverity } from "@/lib/types";

const PAGE_SIZE = 10;

function AlertsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<AlertFiltersValue>({
    tab: "all",
    severity: (searchParams.get("severity") as AlertSeverity | null) ?? "all",
    status: "all",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  function handleFiltersChange(next: AlertFiltersValue) {
    setFilters(next);
    setPage(1);
  }

  const { data: alerts, isLoading } = useAlerts(filters);
  const { data: summary } = useAlertSummary();
  const setSelectedCameraId = useUIStore((s) => s.setSelectedCameraId);
  const setCreateAlertModalOpen = useUIStore((s) => s.setCreateAlertModalOpen);
  const queryClient = useQueryClient();

  const pageItems = (alerts ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleViewCamera(cameraId: string) {
    setSelectedCameraId(cameraId);
    router.push(`/cameras/${cameraId}`);
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Alerts Management"
        description="Monitor, triage and resolve security alerts in real-time."
        actions={
          <Button
            className="gap-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
            onClick={() => setCreateAlertModalOpen(true)}
          >
            <Plus className="size-4" /> New Alert Rule
          </Button>
        }
      />

      {summary && (
        <AlertFilters
          filters={filters}
          onChange={handleFiltersChange}
          tabCounts={summary.tabCounts}
          severityCounts={summary.severityCounts}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ["alerts"] })}
        />
      )}

      <AlertsTable
        alerts={pageItems}
        isLoading={isLoading}
        onSelectAlert={setSelectedAlertId}
        onViewCamera={handleViewCamera}
      />

      {alerts && alerts.length > 0 && (
        <PaginationBar page={page} pageSize={PAGE_SIZE} total={alerts.length} onPageChange={setPage} />
      )}

      <AlertDetailPanel
        alertId={selectedAlertId}
        open={Boolean(selectedAlertId)}
        onOpenChange={(open) => !open && setSelectedAlertId(null)}
      />
    </div>
  );
}

export default function AlertsPage() {
  return (
    <Suspense fallback={null}>
      <AlertsPageContent />
    </Suspense>
  );
}
