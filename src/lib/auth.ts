import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE_NAME = "nats_session";
export const DEMO_USERNAME = "root";
export const DEMO_PASSWORD = "root@123";

const SESSION_SUBJECT = "root-session-v1";

function secret(): string {
  return process.env.AUTH_COOKIE_SECRET || "dev-only-insecure-secret-change-me";
}

export function createSessionToken(): string {
  return createHmac("sha256", secret()).update(SESSION_SUBJECT).digest("hex");
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const expected = createSessionToken();
  const provided = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  if (provided.length !== expectedBuf.length) return false;
  return timingSafeEqual(provided, expectedBuf);
}
