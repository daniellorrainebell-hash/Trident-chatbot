/**
 * GET /api/health
 *
 * Unauthenticated on purpose: a platform health check cannot log in.
 *
 * It reports liveness and whether the required configuration is present. It
 * deliberately reveals no secret values, only whether each one is set.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const checks = {
    openaiKey: Boolean(process.env.OPENAI_API_KEY),
    accessPasskey: Boolean(process.env.NEXUS_ACCESS_PASSKEY),
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
  };

  return NextResponse.json({
    status: checks.openaiKey ? "ok" : "misconfigured",
    checks,
    uptimeSeconds: Math.round(process.uptime()),
  });
}
