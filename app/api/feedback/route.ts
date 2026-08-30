/**
 * POST /api/feedback
 *
 * Records a user edit and everything the system learned from it.
 *
 * This is the write half of the learning loop (spec section 50). Without it the
 * product is a prompt with a database attached, and spec section 64 lists "user
 * edits are stored but never retrieved" as a failure condition.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { runFeedbackExtractor } from "../../../src/agents/feedback-extractor";
import { loadVoiceProfile, saveFeedback } from "../../../src/lib/db";

export const runtime = "nodejs";

const requestSchema = z.object({
  userId: z.string().uuid(),
  postId: z.string().uuid(),
  aiDraft: z.string().min(1),
  userVersion: z.string().min(1),
  userReason: z.string().optional(),
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

  const { userId, postId, aiDraft, userVersion, userReason } = parsed.data;

  try {
    const currentProfile = await loadVoiceProfile(userId);

    const { extraction, updatedProfile } = await runFeedbackExtractor({
      aiDraft,
      userVersion,
      ...(userReason ? { userReason } : {}),
      currentProfile,
    });

    await saveFeedback(userId, postId, userVersion, extraction, updatedProfile);

    return NextResponse.json({
      summary: extraction.summary,
      events: extraction.events.length,
      tags: extraction.events.flatMap((event) => event.tags),
    });
  } catch (error) {
    console.error("[api/feedback] failed", error);
    return NextResponse.json(
      {
        error: "Failed to record feedback.",
        detail: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 },
    );
  }
}
