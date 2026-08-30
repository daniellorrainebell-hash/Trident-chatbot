/**
 * POST /api/approve
 *
 * Saves the user's final version and learns from what they changed.
 *
 * This is the write half of the learning loop. Spec section 64 lists "user edits
 * are stored but never retrieved" as a failure condition, so the extracted
 * preferences go into the voice profile here and come back out through
 * feedbackPreferences on the next generation.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { runFeedbackExtractor } from "../../../src/agents/feedback-extractor";
import { getStore } from "../../../src/store";
import { errorResponse, getCurrentUserId, parseBody } from "../../../src/lib/api";

export const runtime = "nodejs";
export const maxDuration = 120;

const requestSchema = z.object({
  postId: z.string().min(1),
  aiDraft: z.string().min(1),
  userVersion: z.string().min(1),
  userReason: z.string().optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseBody(request, requestSchema);
  if ("response" in parsed) return parsed.response;

  const { postId, aiDraft, userVersion, userReason } = parsed.data;
  const store = getStore();
  const userId = getCurrentUserId();

  try {
    const currentProfile = await store.loadVoiceProfile(userId);

    const { extraction, updatedProfile } = await runFeedbackExtractor({
      aiDraft,
      userVersion,
      ...(userReason ? { userReason } : {}),
      currentProfile,
    });

    await store.saveFeedback(userId, postId, userVersion, extraction, updatedProfile);
    await store.updatePost(userId, postId, {
      finalText: userVersion,
      status: "approved",
    });

    return NextResponse.json({
      summary: extraction.summary,
      learned: extraction.events.map((event) => ({
        summary: event.reason_summary,
        tags: event.tags,
      })),
    });
  } catch (error) {
    return errorResponse("Failed to save", error);
  }
}
