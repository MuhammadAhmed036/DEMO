"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useLiveAlertFeed } from "@/lib/hooks/useAlerts";
import { AlertFeedCard } from "@/components/dashboard/AlertFeedCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/mock/alert-types";
import type { AlertSeverity } from "@/lib/types";

const PAGE_SIZE = 10;

const SEVERITY_DOT: Record<AlertSeverity, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
};

export function LiveAlertsPanel({
  onViewCamera,
  onClose,
}: {
  onViewCamera: (cameraId: string) => void;
  onClose?: () => void;
}) {
  const { data: alerts, isLoading } = useLiveAlertFeed();
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = alerts ?? [];
    if (severityFilter !== "all") list = list.filter((a) => a.severity === severityFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.cameraName.toLowerCase().includes(q) ||
          a.zoneName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [alerts, severityFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: alerts?.length ?? 0 };
    SEVERITY_ORDER.forEach((s) => {
      c[s] = (alerts ?? []).filter((a) => a.severity === s).length;
    });
    return c;
  }, [alerts]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-surface-border p-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Live Alerts</h3>
          <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
            {counts.all}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-md p-1 hover:bg-surface-3" aria-label="Close panel">
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="space-y-2.5 border-b border-surface-border p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search alerts..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              setSeverityFilter("all");
              setPage(1);
            }}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium",
              severityFilter === "all"
                ? "border-primary bg-primary/15 text-primary"
                : "border-surface-border text-muted-foreground hover:bg-surface-3"
            )}
          >
            All {counts.all}
          </button>
          {SEVERITY_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSeverityFilter(s);
                setPage(1);
              }}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                severityFilter === s
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-surface-border text-muted-foreground hover:bg-surface-3"
              )}
            >
              <span className={cn("size-1.5 rounded-full", SEVERITY_DOT[s])} />
              {SEVERITY_LABEL[s]} {counts[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        {!isLoading && pageItems.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No alerts match your filters.</p>
        )}
        {pageItems.map((alert) => (
          <AlertFeedCard key={alert.id} alert={alert} onViewCamera={onViewCamera} />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-surface-border p-3 text-xs text-muted-foreground">
        <span>
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
          {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md p-1 hover:bg-surface-3 disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-md p-1 hover:bg-surface-3 disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
