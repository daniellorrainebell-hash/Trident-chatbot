/**
 * Access gate.
 *
 * Runs before every page and API route. Three outcomes:
 *
 *   passkey set          -> a valid session cookie is required
 *   no passkey, local    -> allowed, so development needs no setup
 *   no passkey, remote   -> refused, with an explanation
 *
 * The last case is the important one. Failing open on a public host would leave
 * an unauthenticated endpoint that spends money on every request.
 */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isLocalHost, verifySessionToken } from "./src/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const passkey = process.env.NEXUS_ACCESS_PASSKEY;

  if (!passkey) {
    if (isLocalHost(request.headers.get("host"))) return NextResponse.next();

    return new NextResponse(
      JSON.stringify({
        error: "Not configured.",
        detail:
          "NEXUS_ACCESS_PASSKEY is not set. This deployment is refusing traffic rather " +
          "than serving an unauthenticated endpoint that spends money on every request. " +
          "Set the secret and redeploy.",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const valid = await verifySessionToken(passkey, request.cookies.get(SESSION_COOKIE)?.value);
  if (valid) return NextResponse.next();

  // An API caller wants a status code, not a redirect to an HTML page.
  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ error: "Not authenticated." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except Next's own assets and the files in public/.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
