/**
 * When true, every data-fetching path (API routes, live-feed hooks, camera
 * thumbnails) serves deterministic mock data and local looping video files
 * instead of hitting the real detection/streams backend. Set
 * `NEXT_PUBLIC_DEMO_MODE=true` in Vercel's project env vars for a
 * backend-free demo deploy; leave unset for real deployments.
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function isDemoMode(): boolean {
  return DEMO_MODE;
}
