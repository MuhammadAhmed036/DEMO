import { createRng } from "@/lib/mock/seed";
import { REFERENCE_NOW } from "@/lib/mock/seed";
import { CAMERAS } from "@/lib/mock/cameras";

function seedFor(cameraId: string): number {
  let hash = 0;
  for (let i = 0; i < cameraId.length; i++) hash = (hash * 31 + cameraId.charCodeAt(i)) | 0;
  return Math.abs(hash) || 1;
}

/** Raw snake_case rows matching the real `/api/v2/events` shape. */
export function buildCameraEventRows(cameraId: string, limit: number) {
  const rng = createRng(seedFor(cameraId));
  const rows = [];

  for (let i = 0; i < limit; i++) {
    const minutesAgo = i * rng.int(2, 6);
    const detectionCount = rng.int(0, 8);
    const detections = Array.from({ length: detectionCount }, () => ({
      class_id: 0,
      class_name: "person",
      confidence: rng.float(0.55, 0.98, 2),
      bbox_xyxy: [rng.int(0, 800), rng.int(0, 400), rng.int(850, 1600), rng.int(450, 1000)],
    }));
    const ts = new Date(REFERENCE_NOW.getTime() - minutesAgo * 60_000).toISOString();

    rows.push({
      event_id: `${cameraId}-evt-${i}`,
      camera_id: cameraId,
      camera_ip: null,
      zone: null,
      scene: null,
      detection_ts: ts,
      model_name: "yolov8n",
      backend: "onnxruntime",
      device: "cpu",
      image_width: 1920,
      image_height: 1080,
      detection_count: detectionCount,
      decode_ms: rng.float(2, 8, 1),
      preprocess_ms: rng.float(1, 4, 1),
      inference_ms: rng.float(15, 45, 1),
      postprocess_ms: rng.float(1, 3, 1),
      total_ms: rng.float(20, 60, 1),
      detections,
      raw_image_status: "retained",
      // No real frame image exists for mock events — gates components that
      // conditionally render a frame thumbnail (e.g. `event.imageExists`).
      image_exists: false,
      created_at: ts,
    });
  }

  return rows;
}

/** Raw snake_case rows matching the real `/api/camera-retention` shape. */
export function buildCameraRetentionRows() {
  return CAMERAS.map((camera) => {
    const rng = createRng(seedFor(camera.id) + 1);
    const target = 100;
    const retainedRaw = Math.min(target, rng.int(40, target));
    return {
      camera_id: camera.id,
      total_events: rng.int(200, 5000),
      with_raw: retainedRaw,
      retained_raw: retainedRaw,
      target,
      remaining_to_target: Math.max(0, target - retainedRaw),
      latest_ts: REFERENCE_NOW.toISOString(),
    };
  });
}
