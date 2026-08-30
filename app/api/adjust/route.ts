/**
 * POST /api/adjust
 *
 * Applies a one-click adjustment to a draft and records the preference.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { ADJUSTMENTS, runAdjuster } from "../../../src/agents/adjuster";
import { lintPost } from "../../../src/writing-rules/linter";
import { getStore } from "../../../src/store";
import {
  errorResponse,
  getCurrentUserId,
  lintOptionsSchema,
  parseBody,
} from "../../../src/lib/api";

export const runtime = "nodejs";
export const maxDuration = 120;

const requestSchema = z.object({
  postId: z.string().optional(),
  draft: z.string().min(1),
  adjustment: z.enum(
    Object.keys(ADJUSTMENTS) as [keyof typeof ADJUSTMENTS, ...Array<keyof typeof ADJUSTMENTS>],
  ),
  customInstruction: z.string().optional(),
  lintOptions: lintOptionsSchema,
});

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseBody(request, requestSchema);
  if ("response" in parsed) return parsed.response;

  const { postId, draft, adjustment, customInstruction, lintOptions } = parsed.data;
  const store = getStore();
  const userId = getCurrentUserId();

  try {
    const voiceProfile = await store.loadVoiceProfile(userId);

    const result = await runAdjuster({
      draft,
      adjustment,
      voiceProfile,
      ...(customInstruction ? { customInstruction } : {}),
      ...(lintOptions ? { lintOptions } : {}),
    });

    if (postId) {
      await store.appendVersion(userId, postId, result.text, "ai_revision");
      await store.updatePost(userId, postId, { draftText: result.text });
    }

    return NextResponse.json({
      text: result.text,
      tag: result.tag,
      lint: lintPost(result.text, lintOptions ?? {}),
    });
  } catch (error) {
    return errorResponse("Adjustment failed", error);
  }
}
