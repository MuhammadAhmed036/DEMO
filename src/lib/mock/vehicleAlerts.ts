import { REFERENCE_NOW } from "@/lib/mock/seed";

export type VehicleViolationType =
  | "unauthorized_entry"
  | "restricted_zone"
  | "no_parking"
  | "overspeeding";

export type VehicleAlertSeverity = "critical" | "high" | "medium" | "low";

export interface VehicleAlert {
  id: string;
  title: string;
  description: string;
  violationType: VehicleViolationType;
  severity: VehicleAlertSeverity;
  cameraName: string;
  zone: string;
  vehicleType: string;
  vehicleColor: string;
  plateNumber: string | null;
  speedKph?: number;
  speedLimitKph?: number;
  confidence: number;
  timestamp: string;
  /** Path under /alerts/vehicles/ for a real captured snapshot, or null for cameras without one yet. */
  image: string | null;
}

function minutesAgo(minutes: number): string {
  return new Date(REFERENCE_NOW.getTime() - minutes * 60_000).toISOString();
}

export const VIOLATION_LABEL: Record<VehicleViolationType, string> = {
  unauthorized_entry: "Unauthorized Entry",
  restricted_zone: "Restricted Zone",
  no_parking: "No Parking",
  overspeeding: "Overspeeding",
};

export const VEHICLE_ALERTS: VehicleAlert[] = [
  {
    id: "veh_0001",
    title: "Unrecognized Vehicle at Restricted Entrance",
    description:
      "Vehicle detected stopped at the airport entrance gate outside of authorized pickup/drop-off hours.",
    violationType: "unauthorized_entry",
    severity: "critical",
    cameraName: "Airport Entrance",
    zone: "Faizabad / I-8",
    vehicleType: "Sedan",
    vehicleColor: "White",
    plateNumber: "RIB-951",
    confidence: 96,
    timestamp: minutesAgo(14),
    image: "/alerts/vehicles/airport-entrance.jpg",
  },
  {
    id: "veh_0002",
    title: "Unauthorized Vehicle on Tarmac",
    description:
      "Ground-service vehicle detected in a restricted apron zone without an active flight assignment.",
    violationType: "restricted_zone",
    severity: "high",
    cameraName: "Airside Tarmac",
    zone: "Faizabad / I-8",
    vehicleType: "Service Truck",
    vehicleColor: "White",
    plateNumber: null,
    confidence: 91,
    timestamp: minutesAgo(52),
    image: "/alerts/vehicles/airport-tarmac.jpg",
  },
  {
    id: "veh_0003",
    title: "Vehicle in No Parking Zone",
    description: "Sedan parked along a marked no-parking curb for over 8 minutes.",
    violationType: "no_parking",
    severity: "medium",
    cameraName: "Main Gate",
    zone: "Blue Area",
    vehicleType: "Sedan",
    vehicleColor: "Silver",
    plateNumber: "ISB-4471",
    confidence: 88,
    timestamp: minutesAgo(133),
    image: null,
  },
  {
    id: "veh_0004",
    title: "Overspeeding Detected",
    description: "SUV clocked well above the posted limit approaching the toll plaza.",
    violationType: "overspeeding",
    severity: "medium",
    cameraName: "Toll Plaza",
    zone: "Expressway",
    vehicleType: "SUV",
    vehicleColor: "Black",
    plateNumber: "LEA-2290",
    speedKph: 92,
    speedLimitKph: 60,
    confidence: 94,
    timestamp: minutesAgo(207),
    image: null,
  },
];
