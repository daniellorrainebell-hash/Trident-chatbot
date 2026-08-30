/**
 * GET /api/status
 *
 * What is configured and what is not.
 *
 * The UI shows this so a missing key is visible before a generation fails, and
 * so the active storage backend is never a guess.
 */

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "../../../src/lib/env";
import { getStore } from "../../../src/store";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const store = getStore();

  return NextResponse.json({
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    supabaseConfigured: isSupabaseConfigured(),
    storage: store.kind,
    semanticRetrieval: store.supportsSemanticRetrieval,
  });
}
