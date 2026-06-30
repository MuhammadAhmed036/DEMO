import { VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

function hueFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % 360;
}

/**
 * Deterministic, fully-offline "video feed" placeholder rendered with CSS
 * gradients only (no network images) — every camera gets a stable, distinct
 * look derived from its id. Swap for a real <video>/HLS player later behind
 * the same props.
 */
export function CameraThumbnail({
  seed,
  offline,
  className,
  children,
}: {
  seed: string;
  offline?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const hue = hueFromSeed(seed);

  if (offline) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-surface-3",
          className
        )}
      >
        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
          <VideoOff className="size-6" />
          <span className="text-xs font-medium">Camera Offline</span>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 28px),
          repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 28px),
          radial-gradient(circle at 30% 20%, hsl(${hue} 55% 22%) 0%, transparent 60%),
          linear-gradient(155deg, hsl(${hue} 40% 12%) 0%, hsl(${(hue + 40) % 360} 35% 7%) 100%)
        `,
      }}
    >
      <div className="absolute inset-0 bg-black/10" />
      {children}
    </div>
  );
}
