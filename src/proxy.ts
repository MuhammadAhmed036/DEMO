import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isValidSessionToken } from "@/lib/auth";

// Static files under public/ (images, video, fonts, map tiles, ...) must stay
// reachable without the session cookie: next/image's optimizer fetches the
// original asset via its own server-to-server request, which never carries
// the browser's cookies — gating these paths made every optimized image
// fail with "received null" instead of the real bytes.
const PUBLIC_ASSET_PATTERN =
  /\.(png|jpe?g|gif|webp|avif|svg|ico|mp4|webm|mov|mp3|woff2?|ttf|otf|css|pmtiles|geojson)$/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ASSET_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  const authenticated = isValidSessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);

  if (pathname === "/login") {
    if (authenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (authenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
