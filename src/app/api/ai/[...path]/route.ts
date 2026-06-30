import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_PATHS = new Set(["stats", "events", "cameras"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  if (!ALLOWED_PATHS.has(endpoint)) {
    return Response.json({ error: "Unknown AI API endpoint" }, { status: 404 });
  }

  const baseValue = process.env.NEXT_PUBLIC_API_BASE;
  if (!baseValue) {
    return Response.json({ error: "NEXT_PUBLIC_API_BASE is not configured" }, { status: 500 });
  }

  try {
    const base = new URL(baseValue.endsWith("/") ? baseValue : `${baseValue}/`);
    const upstreamUrl = new URL(`api/${endpoint}`, base);
    upstreamUrl.search = request.nextUrl.search;

    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: request.signal,
    });
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI API is unavailable";
    return Response.json({ error: message }, { status: 502 });
  }
}
