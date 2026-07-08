import type { NextRequest } from "next/server";
import { isDemoMode } from "@/lib/demoMode";
import { handleDemoAiRequest } from "@/lib/mock/demoAiApi";

export const dynamic = "force-dynamic";

const GET_ALLOWED_EXACT = new Set(["stats", "events", "cameras", "camera-retention"]);
const GET_ALLOWED_PREFIXES = ["v2/cameras", "v2/zones", "v2/events", "v2/alerts"];
const WRITE_ALLOWED_PREFIXES = ["v2/cameras", "v2/alerts"];

function isAllowed(endpoint: string, prefixes: string[], exact?: Set<string>): boolean {
  if (exact?.has(endpoint)) return true;
  return prefixes.some((prefix) => endpoint === prefix || endpoint.startsWith(`${prefix}/`));
}

function resolveUpstreamUrl(request: NextRequest, endpoint: string): URL {
  const baseValue = process.env.NEXT_PUBLIC_API_BASE;
  if (!baseValue) throw new Error("NEXT_PUBLIC_API_BASE is not configured");

  const base = new URL(baseValue.endsWith("/") ? baseValue : `${baseValue}/`);
  const upstreamUrl = new URL(`api/${endpoint}`, base);
  upstreamUrl.search = request.nextUrl.search;
  return upstreamUrl;
}

async function proxy(
  request: NextRequest,
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "DELETE"
) {
  try {
    const upstreamUrl = resolveUpstreamUrl(request, endpoint);
    const hasBody = method === "POST" || method === "PATCH";
    const upstream = await fetch(upstreamUrl, {
      method,
      headers: hasBody
        ? { "Content-Type": "application/json", Accept: "application/json" }
        : { Accept: "application/json" },
      body: hasBody ? await request.text() : undefined,
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  if (!isAllowed(endpoint, GET_ALLOWED_PREFIXES, GET_ALLOWED_EXACT)) {
    return Response.json({ error: "Unknown AI API endpoint" }, { status: 404 });
  }
  if (isDemoMode()) return handleDemoAiRequest(endpoint, "GET", request);
  return proxy(request, endpoint, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  if (!isAllowed(endpoint, WRITE_ALLOWED_PREFIXES)) {
    return Response.json({ error: "Unknown AI API endpoint" }, { status: 404 });
  }
  if (isDemoMode()) return handleDemoAiRequest(endpoint, "POST", request);
  return proxy(request, endpoint, "POST");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  if (!isAllowed(endpoint, WRITE_ALLOWED_PREFIXES)) {
    return Response.json({ error: "Unknown AI API endpoint" }, { status: 404 });
  }
  if (isDemoMode()) return handleDemoAiRequest(endpoint, "PATCH", request);
  return proxy(request, endpoint, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  if (!isAllowed(endpoint, ["v2/alerts"])) {
    return Response.json({ error: "Unknown AI API endpoint" }, { status: 404 });
  }
  if (isDemoMode()) return handleDemoAiRequest(endpoint, "DELETE", request);
  return proxy(request, endpoint, "DELETE");
}
