"use client";

import { RotateCw, Search, SlidersHorizontal } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/mock/alert-types";
import type { AlertSeverity, AlertStatus } from "@/lib/types";
import type { AlertFilters as AlertFiltersValue } from "@/lib/services/alertsService";

const SEVERITY_DOT: Record<AlertSeverity, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
};

export interface AlertTabCounts {
  all: number;
  active: number;
  acknowledged: number;
  resolved: number;
}

export function AlertFilters({
  filters,
  onChange,
  tabCounts,
  severityCounts,
  onRefresh,
}: {
  filters: AlertFiltersValue;
  onChange: (next: AlertFiltersValue) => void;
  tabCounts: AlertTabCounts;
  severityCounts: Record<AlertSeverity, number>;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-3">
      <Tabs
        value={filters.tab ?? "all"}
        onValueChange={(v) => onChange({ ...filters, tab: v as AlertFiltersValue["tab"] })}
      >
        <TabsList>
          <TabsTrigger value="all">All Alerts {tabCounts.all}</TabsTrigger>
          <TabsTrigger value="active">Active {tabCounts.active}</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged {tabCounts.acknowledged}</TabsTrigger>
          <TabsTrigger value="resolved">Resolved {tabCounts.resolved}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap gap-1.5">
        {SEVERITY_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => onChange({ ...filters, severity: filters.severity === s ? "all" : s })}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              filters.severity === s
                ? "border-primary bg-primary/15 text-primary"
                : "border-surface-border text-muted-foreground hover:bg-surface-3"
            )}
          >
            <span className={cn("size-1.5 rounded-full", SEVERITY_DOT[s])} />
            {SEVERITY_LABEL[s]} {severityCounts[s]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search ?? ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search alerts by title, camera, zone..."
            className="pl-9"
          />
        </div>
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) => onChange({ ...filters, status: v as AlertStatus | "all" })}
        >
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh">
          <RotateCw className="size-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="More filters">
          <SlidersHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}
