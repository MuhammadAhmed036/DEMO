/**
 * Static bounding-box snapshot + supporting event images stored under
 * `public/alerts/`. These aren't generated — they're real captured frames
 * dropped in by hand, so the mapping between a bounding-box image and its
 * event images is a fixed lookup table, not something derived at runtime.
 */
export interface AlertBoundingBoxDemoItem {
  key: string;
  title: string;
  boundingBoxImage: string;
  eventImages: string[];
  /** Show the camera's live feed as the primary frame instead of `boundingBoxImage`. */
  useLiveFeed?: boolean;
}

export const ALERT_BBOX_DEMO_ITEMS: AlertBoundingBoxDemoItem[] = [
  {
    key: "airport_persons",
    title: "Airport - Person Detection",
    boundingBoxImage: "/alerts/bounding_box/airport_persons.jpg",
    eventImages: ["/alerts/events/airport.jpg", "/alerts/events/airport2.jpg"],
  },
  {
    key: "ceo",
    title: "CEO Office",
    boundingBoxImage: "/alerts/bounding_box/ceo.jpg",
    eventImages: ["/alerts/events/ceooffice.jpg", "/alerts/events/ceooffice2.jpg"],
  },
  {
    key: "entrance",
    title: "Entrance",
    boundingBoxImage: "/alerts/bounding_box/entrance.jpg",
    eventImages: ["/alerts/events/entrance.jpg", "/alerts/events/entrance2.jpg"],
  },
  {
    key: "kitchen",
    title: "Kitchen",
    boundingBoxImage: "/alerts/bounding_box/kitchen.jpg",
    eventImages: ["/alerts/events/kitchen.jpg", "/alerts/events/kitchen2.jpg"],
  },
  {
    key: "airport_entrance_area",
    title: "Airport Entrance Area",
    boundingBoxImage: "/alerts/vehicles/airport-entrance.jpg",
    eventImages: ["/alerts/vehicles/airport-entrance.jpg"],
    useLiveFeed: true,
  },
];

export function getAlertBoundingBoxDemoByKey(key: string | null | undefined) {
  if (!key) return undefined;
  return ALERT_BBOX_DEMO_ITEMS.find((item) => item.key === key);
}

/**
 * Fallback for alert rules that don't carry an explicit `demoImageKey`
 * (e.g. rules coming from a real backend) — matches by keyword against the
 * rule's name/description/zone/camera so the gallery can still surface if
 * those fields happen to reference one of these locations.
 */
export function matchAlertBoundingBoxDemo(fields: {
  name?: string | null;
  description?: string | null;
  label?: string | null;
  zone?: string | null;
  cameraId?: string | null;
}) {
  const haystack = [fields.name, fields.description, fields.label, fields.zone, fields.cameraId]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (!haystack) return undefined;
  return ALERT_BBOX_DEMO_ITEMS.find((item) => haystack.includes(item.key.replace("_", " ")) || haystack.includes(item.key));
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

/**
 * Resolves the bounding-box + event image set for any alert rule, real or
 * mock: an explicit `demoImageKey` wins, then a keyword match against the
 * rule's own fields, and finally a deterministic pick (stable per alertId)
 * so every already-configured alert — including ones from the real
 * detection backend, which has no concept of these local demo images —
 * still has a snapshot + events gallery to show instead of an empty panel.
 */
export function getAlertBoundingBoxDemoForRule(rule: {
  alertId: string;
  name?: string | null;
  description?: string | null;
  label?: string | null;
  zone?: string | null;
  cameraId?: string | null;
  demoImageKey?: string | null;
}): AlertBoundingBoxDemoItem {
  const explicit = getAlertBoundingBoxDemoByKey(rule.demoImageKey);
  if (explicit) return explicit;

  const keywordMatch = matchAlertBoundingBoxDemo(rule);
  if (keywordMatch) return keywordMatch;

  const index = hashString(rule.alertId) % ALERT_BBOX_DEMO_ITEMS.length;
  return ALERT_BBOX_DEMO_ITEMS[index];
}
