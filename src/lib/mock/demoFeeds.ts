/**
 * Every mock camera plays through an external cinema8.com embed instead of
 * a local video file — used everywhere a camera feed renders (camera grid,
 * media wall, camera detail, alert panels, map popups).
 *
 * NOTE: cinema8.com sends `Content-Security-Policy: frame-ancestors`
 * restricted to its own domains, so browsers refuse to render these
 * iframes on any other origin (including wherever this app is deployed) —
 * a link only plays when opened directly in its own tab. Kept as
 * requested; expect camera tiles to show blank/blocked everywhere.
 */
const DEMO_EXTERNAL_PLAYERS: Record<string, string> = {
  "cam-g-01": "https://cinema8.com/video/VX3725bX?autoplay=1&muted=1&loop=1&controls=0",
  "cam-h13-01": "https://cinema8.com/video/PO8P5ePO?autoplay=1&muted=1&loop=1&controls=0",
  "cam-bl-01": "https://cinema8.com/video/kDl1pbaX?autoplay=1&muted=1&loop=1&controls=0",
  "cam-i-01": "https://cinema8.com/video/PO8P5dMO?autoplay=1&muted=1&loop=1&controls=0",
  "cam-fai-01": "https://cinema8.com/video/zOwMpxvX?autoplay=1&muted=1&loop=1&controls=0",
  "cam-rwp-01": "https://cinema8.com/video/kDl1pbaX?autoplay=1&muted=1&loop=1&controls=0",
  "cam-fai-02": "https://cinema8.com/video/PO8PY17O?autoplay=1&muted=1&loop=1&controls=0",
};

export function demoPlayerUrlFor(cameraId: string): string | undefined {
  return DEMO_EXTERNAL_PLAYERS[cameraId.toLowerCase()];
}
