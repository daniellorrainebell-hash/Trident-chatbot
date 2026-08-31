/**
 * Route handler helpers.
 *
 * Single-user deployment: the user is resolved server-side from the environment,
 * so no route accepts a user ID from the client. There is nothing to spoof.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "./env";
import { getStore } from "../store";
import { renderIdentity } from "../store/types";
import type { GenerationContext } from "../agents/types";

export { getCurrentUserId };

export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { response: NextResponse.json({ error: "Body must be JSON." }, { status: 400 }) };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      response: NextResponse.json(
        {
          error: "Invalid request.",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      ),
    };
  }

  return { data: parsed.data };
}

/**
 * Turn an error into a response.
 *
 * The message is surfaced because this is a single-user tool the owner runs
 * themselves: hiding "OPENAI_API_KEY is required" behind "something went wrong"
 * would make it harder to fix, and there is no third party to leak it to.
 */
export function errorResponse(context: string, error: unknown): NextResponse {
  console.error(`[${context}]`, error);
  return NextResponse.json(
    {
      error: context,
      detail: error instanceof Error ? error.message : String(error),
    },
    { status: 500 },
  );
}

/**
 * Retrieval that cannot take a generation down with it.
 *
 * Semantic retrieval makes drafts better; it is not required to produce one. A
 * missing pgvector function, an embedding provider that cannot embed, or a
 * transient database error should cost the run its context, not the run itself.
 * The failure is logged so it does not pass unnoticed.
 */
async function optional<T>(label: string, work: Promise<T>, fallback: T): Promise<T> {
  try {
    return await work;
  } catch (error) {
    console.warn(
      `[retrieval] ${label} unavailable, continuing without it:`,
      error instanceof Error ? error.message : error,
    );
    return fallback;
  }
}

/** Assemble the generation context from whichever store is active. */
export async function buildContext(idea: string): Promise<GenerationContext> {
  const store = getStore();
  const userId = getCurrentUserId();

  // Identity and the voice profile are the two the engine should not run
  // without: they are what stop the output being generic. Everything else is
  // an enhancement and degrades quietly.
  const [identity, voiceProfile] = await Promise.all([
    store.loadIdentity(userId),
    store.loadVoiceProfile(userId),
  ]);

  const [feedbackPreferences, recentPosts, knowledge, similar, offer] = await Promise.all([
    optional("feedback preferences", store.feedbackPreferences(userId), [] as string[]),
    optional("recent posts", store.recentPosts(userId), []),
    optional("knowledge search", store.searchKnowledge(userId, idea), []),
    optional("similar posts", store.similarPosts(userId, idea), []),
    optional("offer record", store.loadOffer(userId), null),
  ]);

  return {
    idea,
    identity: renderIdentity(identity),
    voiceProfile,
    retrieved: [...knowledge, ...similar],
    recentPosts,
    feedbackPreferences,
    offer,
    signOff: identity.signOff || null,
  };
}

export const lintOptionsSchema = z
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
  .optional();
