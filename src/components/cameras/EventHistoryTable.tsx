import type { EventHistoryItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export function EventHistoryTable({
  events,
  isLoading,
}: {
  events: EventHistoryItem[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-surface-border">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="border-b border-surface-border bg-surface-2 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Time</th>
            <th className="px-3 py-2 font-medium">Event Type</th>
            <th className="px-3 py-2 font-medium">Details</th>
            <th className="px-3 py-2 font-medium text-right">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {events?.map((event) => (
            <tr key={event.id}>
              <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{event.time}</td>
              <td className="px-3 py-2 font-medium">{event.type}</td>
              <td className="px-3 py-2 text-muted-foreground">{event.details}</td>
              <td className="px-3 py-2 text-right">{event.confidence}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
