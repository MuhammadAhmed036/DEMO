/** Derives the detection API's WebSocket origin from `NEXT_PUBLIC_API_BASE` (http→ws, https→wss). */
export function wsBaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_API_BASE;
  if (!base) return null;
  try {
    const url = new URL(base);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}
