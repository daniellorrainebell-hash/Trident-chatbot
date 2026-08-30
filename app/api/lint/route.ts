/**
 * POST /api/lint
 *
 * Runs the deterministic writing-rules linter over a draft.
 *
 * No model call, so this is cheap enough to run on every keystroke pause in the
 * draft editor. It is the same linter the pipeline gates on, so what the editor
 * shows and what blocks a final draft cannot drift apart.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { lintPost } from "../../../src/writing-rules/linter";

export const runtime = "nodejs";

const requestSchema = z.object({
  text: z.string().min(1),
  options: z
    .object({
      disabledRuleIds: z.array(z.string()).optional(),
      allowedTerms: z.array(z.string()).optional(),
      permitHashtags: z.boolean().optional(),
      permitEmoji: z.boolean().optional(),
      permitEngagementCta: z.boolean().optional(),
      verifiedScarcityOrUrgency: z.boolean().optional(),
      isCarouselCopy: z.boolean().optional(),
      subjectIsTheFramework: z.boolean().optional(),
      dayReferencesAreFactual: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  return NextResponse.json(lintPost(parsed.data.text, parsed.data.options ?? {}));
}
