export type AlertSeverity = "critical" | "high" | "medium" | "low";

export type AlertStatus =
  | "active"
  | "acknowledged"
  | "investigating"
  | "resolved"
  | "closed";

export type CameraStatus = "online" | "offline";

export interface Operator {
  id: string;
  name: string;
  initials: string;
  controlRoom: string;
}

export interface Zone {
  id: string;
  name: string;
  shortName: string;
  color: string;
  center: [number, number];
  cameraCount: number;
}

export interface AiFeature {
  id: string;
  label: string;
  active: boolean;
}

export interface Camera {
  id: string;
  code: string;
  name: string;
  zoneId: string;
  zoneName: string;
  location: string;
  position: [number, number];
  status: CameraStatus;
  type: "PTZ Dome" | "Bullet" | "Fixed" | "LPR" | "Thermal";
  currentPersonCount: number;
  density: "Low" | "Medium" | "High" | "Critical";
  densityPercent: number;
  aiFeatures: AiFeature[];
  thumbnailSeed: string;
  isFavorite: boolean;
  proxy_feed_url?: string;
  proxyFeedUrl?: string;
  playerUrl?: string;
  sourceName?: string;
}

export interface AlertRule {
  id: string;
  label: string;
  severity: AlertSeverity;
  enabled: boolean;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  cameraId: string;
  cameraCode: string;
  cameraName: string;
  zoneId: string;
  zoneName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: string;
  durationSeconds: number;
  confidence: number;
  assignedOperatorId: string | null;
  notes: string;
  type: AlertType;
}

export type AlertType =
  | "perimeter_breach"
  | "loitering"
  | "vehicle_no_parking"
  | "crowd_gathering"
  | "tampering"
  | "fence_cut"
  | "abandoned_object"
  | "license_plate_unrecognized"
  | "intrusion"
  | "fire_smoke"
  | "fight_altercation"
  | "traffic_violation"
  | "line_crossing"
  | "vehicle_restricted"
  | "face_recognition_match";

export interface TrendPoint {
  label: string;
  value: number;
}

export interface DashboardStats {
  totalCameras: number;
  activeCameras: number;
  offlineCameras: number;
  totalPersonsToday: number;
  personsTrendPercent: number;
  activeAlerts: number;
  criticalAlerts: number;
  offlineCamerasTrendPercent: number;
  activeAlertTrendPercent: number;
}

export interface EventHistoryItem {
  id: string;
  time: string;
  type: string;
  details: string;
  confidence: number;
}

export interface CameraLocation {
  id: number;
  cameraId: string;
  cameraName: string;
  cameraIp: string | null;
  zone: string | null;
  scene: string | null;
  latitude: number | null;
  longitude: number | null;
  headingDegrees: number | null;
  address: string | null;
  building: string | null;
  floor: string | null;
  description: string | null;
  enabled: boolean;
  updatedAt: string | null;
}

export interface ZoneSummary {
  zone: string;
  cameraCount: number;
  withCoords: number;
  enabledCount: number;
}

export type GridLayoutKey = "1x1" | "2x2" | "3x3" | "4x4" | "5x5";

export interface MediaWallAssignment {
  cellIndex: number;
  cameraId: string | null;
}

export interface NotificationMethod {
  id: "email" | "sms" | "in_app" | "push";
  label: string;
}
