/**
 * POST /api/auth/login
 *
 * Exchanges the passkey for a session cookie.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  createSessionToken,
  passkeyMatches,
} from "../../../../src/lib/auth";

export const runtime = "nodejs";

const requestSchema = z.object({ passkey: z.string().min(1) });

export async function POST(request: Request): Promise<NextResponse> {
  const configured = process.env.NEXUS_ACCESS_PASSKEY;
  if (!configured) {
    return NextResponse.json(
      { error: "No password is configured on this deployment." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success || !passkeyMatches(configured, parsed.data.passkey)) {
    // One message for both cases. A distinct "no password supplied" reply would
    // tell a prober which half of the request it got right.
    return NextResponse.json({ error: "That password is not correct." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: await createSessionToken(configured),
    httpOnly: true,
    sameSite: "lax",
    // Replit terminates TLS in front of the app, so trust the forwarded scheme
    // rather than the connection this process actually received.
    secure: request.headers.get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });

  return response;
}
