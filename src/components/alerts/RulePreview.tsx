import { SeverityBadge } from "@/components/alerts/SeverityBadge";
import type { AlertSeverity } from "@/lib/types";

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "accent" }) {
  return (
    <span
      className={
        tone === "accent"
          ? "rounded-md bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary"
          : "rounded-md bg-surface-3 px-2 py-0.5 text-xs font-medium text-foreground"
      }
    >
      {children}
    </span>
  );
}

export function RulePreview({
  fieldLabel,
  operatorLabel,
  threshold,
  duration,
  durationUnit,
  targetLabel,
  severity,
}: {
  fieldLabel: string;
  operatorLabel: string;
  threshold: number;
  duration: number;
  durationUnit: string;
  targetLabel: string;
  severity: AlertSeverity;
}) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-1 p-3">
      <div className="mb-2 text-xs font-medium text-muted-foreground">Rule Preview</div>
      <div className="flex flex-wrap items-center gap-1.5 text-sm leading-7">
        <span className="text-muted-foreground">If</span>
        <Pill tone="accent">{fieldLabel}</Pill>
        <span className="text-muted-foreground">{operatorLabel}</span>
        <Pill tone="accent">{threshold}</Pill>
        <span className="text-muted-foreground">for more than</span>
        <Pill tone="accent">
          {duration} {durationUnit}
        </Pill>
        <span className="ml-auto"><SeverityBadge severity={severity} /></span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5 text-sm leading-7">
        <span className="text-muted-foreground">in</span>
        <Pill tone="accent">{targetLabel}</Pill>
        <span className="text-muted-foreground">, then trigger an alert.</span>
      </div>
    </div>
  );
}
