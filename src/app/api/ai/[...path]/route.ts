import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_EXACT = new Set(["stats", "events", "cameras"]);
const ALLOWED_PREFIXES = ["v2/cameras", "v2/zones", "v2/events"];

function isAllowedEndpoint(endpoint: string): boolean {
  if (ALLOWED_EXACT.has(endpoint)) return true;
  return ALLOWED_PREFIXES.some(
    (prefix) => endpoint === prefix || endpoint.startsWith(`${prefix}/`)
  );
}

function resolveUpstreamUrl(request: NextRequest, endpoint: string): URL {
  const baseValue = process.env.NEXT_PUBLIC_API_BASE;
  if (!baseValue) throw new Error("NEXT_PUBLIC_API_BASE is not configured");

  const base = new URL(baseValue.endsWith("/") ? baseValue : `${baseValue}/`);
  const upstreamUrl = new URL(`api/${endpoint}`, base);
  upstreamUrl.search = request.nextUrl.search;
  return upstreamUrl;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  if (!isAllowedEndpoint(endpoint)) {
    return Response.json({ error: "Unknown AI API endpoint" }, { status: 404 });
  }

  try {
    const upstreamUrl = resolveUpstreamUrl(request, endpoint);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  if (!endpoint.startsWith("v2/cameras/")) {
    return Response.json({ error: "Unknown AI API endpoint" }, { status: 404 });
  }

  try {
    const upstreamUrl = resolveUpstreamUrl(request, endpoint);
    const requestBody = await request.text();
    const upstream = await fetch(upstreamUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: requestBody,
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
