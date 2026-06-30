"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapCanvasProps } from "@/components/map/MapCanvas";

const MapCanvasInner = dynamic(
  () => import("@/components/map/MapCanvas").then((mod) => mod.MapCanvas),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-xl" />,
  }
);

export function MapCanvasLoader(props: MapCanvasProps) {
  return <MapCanvasInner {...props} />;
}
