/** POST /api/auth/logout. Clears the session cookie. */

import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "../../../../src/lib/auth";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: SESSION_COOKIE, value: "", path: "/", maxAge: 0 });
  return response;
}
