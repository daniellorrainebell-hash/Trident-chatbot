/**
 * GET /api/frameworks
 *
 * The framework library, for the framework inspector.
 *
 * Reads from the code definitions rather than the database so the inspector shows
 * what the engine will actually apply on the next run.
 */

import { NextResponse } from "next/server";
import { ALL_FRAMEWORKS } from "../../../src/frameworks/registry";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const category = new URL(request.url).searchParams.get("category");

  const frameworks = ALL_FRAMEWORKS.filter(
    (framework) => framework.active && (!category || framework.category === category),
  );

  return NextResponse.json({ count: frameworks.length, frameworks });
}
