/**
 * POST /api/ideas
 *
 * Runs the generation pipeline for one idea.
 *
 * This handler is the trust boundary. Model calls, the service role key and the
 * OpenAI key all live on this side of it. Nothing here is importable from client
 * code: getServerEnv() throws in the browser if it ever is.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePost } from "../../../src/pipeline/generate-post";
import { loadVoiceProfile, savePostRun } from "../../../src/lib/db";
import {
  getIdentityBlock,
  searchKnowledge,
} from "../../../src/retrieval/knowledge-search";
import {
  retrieveFeedbackPreferences,
  retrieveRecentPosts,
  retrieveSimilarPosts,
} from "../../../src/retrieval/post-memory";
import type { GenerationContext } from "../../../src/agents/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  userId: z.string().uuid(),
  idea: z.string().min(3, "An idea needs at least a sentence."),
  mode: z.enum(["quick_draft", "strategy", "research", "rewrite"]).optional(),
  pauseForHookSelection: z.boolean().optional(),
  overrides: z
    .object({
      audience: z.string().optional(),
      objective: z.string().optional(),
      ctaType: z.string().optional(),
      tone: z.string().optional(),
      frameworkId: z.string().optional(),
      hookFamilies: z.array(z.string()).optional(),
      forceResearch: z.boolean().optional(),
    })
    .optional(),
  lintOptions: z
    .object({
      permitHashtags: z.boolean().optional(),
      permitEmoji: z.boolean().optional(),
      permitEngagementCta: z.boolean().optional(),
      allowedTerms: z.array(z.string()).optional(),
      dayReferencesAreFactual: z.boolean().optional(),
    })
    .optional(),
  persist: z.boolean().default(true),
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

  const { userId, idea, mode, pauseForHookSelection, overrides, lintOptions, persist } =
    parsed.data;

  try {
    // Retrieval runs in parallel: none of these depend on each other.
    const [identity, voiceProfile, feedbackPreferences, recentPosts, knowledge, similar] =
      await Promise.all([
        getIdentityBlock(userId),
        loadVoiceProfile(userId),
        retrieveFeedbackPreferences(userId),
        retrieveRecentPosts(userId),
        searchKnowledge({ userId, query: idea, namespaces: ["identity", "knowledge"] }),
        retrieveSimilarPosts({ userId, idea }),
      ]);

    const context: GenerationContext = {
      idea,
      identity,
      voiceProfile,
      retrieved: [...knowledge, ...similar],
      recentPosts,
      feedbackPreferences,
      ...(overrides ? { overrides } : {}),
    };

    const result = await generatePost(context, {
      ...(mode ? { mode } : {}),
      ...(pauseForHookSelection ? { pauseForHookSelection } : {}),
      ...(lintOptions ? { lintOptions } : {}),
    });

    const postId = persist && result.draft ? await savePostRun(userId, result) : null;

    return NextResponse.json({ postId, result });
  } catch (error) {
    // Never leak internals to the client. The message is logged server-side.
    console.error("[api/ideas] generation failed", error);
    return NextResponse.json(
      {
        error: "Generation failed.",
        detail: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 500 },
    );
  }
}
