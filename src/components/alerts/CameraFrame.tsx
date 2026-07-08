"use client";

import { DetectionFrameImage } from "@/components/alerts/DetectionFrameImage";
import { isDemoMode } from "@/lib/demoMode";
import { demoPlayerUrlFor } from "@/lib/mock/demoFeeds";

/**
 * Renders a detection frame for a camera/event pair, falling back to the
 * camera's cinema8 embed in demo mode instead of a real matched-frame image
 * (there's no real detection backend to produce one from). Outside demo
 * mode, behaves exactly like `DetectionFrameImage` plus its "no match yet"
 * empty state.
 */
export function CameraFrame({
  cameraId,
  eventId,
  alt,
  className,
  emptyLabel = "No match yet",
}: {
  cameraId: string;
  eventId: string | null;
  alt: string;
  className?: string;
  emptyLabel?: string;
}) {
  if (isDemoMode()) {
    const externalPlayer = demoPlayerUrlFor(cameraId);
    if (externalPlayer) {
      return (
        <iframe
          src={externalPlayer}
          className={className}
          style={{ border: 0 }}
          allow="autoplay"
        />
      );
    }
    return (
      <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  if (eventId) {
    return <DetectionFrameImage key={eventId} eventId={eventId} alt={alt} className={className} />;
  }

  return (
    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
      {emptyLabel}
    </div>
  );
}
