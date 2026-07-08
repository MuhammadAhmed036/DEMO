import { NextResponse } from "next/server";
import { fetchStreamCameras } from "@/lib/server/streams";
import { isDemoMode } from "@/lib/demoMode";
import { CAMERAS } from "@/lib/mock/cameras";
import { demoPlayerUrlFor } from "@/lib/mock/demoFeeds";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isDemoMode()) {
    const cameras = CAMERAS.map((camera) => ({
      ...camera,
      proxy_feed_url: undefined,
      proxyFeedUrl: undefined,
      playerUrl: demoPlayerUrlFor(camera.id),
      sourceName: camera.id,
    }));
    return NextResponse.json(cameras, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const cameras = await fetchStreamCameras();
    return NextResponse.json(cameras, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load cameras";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
