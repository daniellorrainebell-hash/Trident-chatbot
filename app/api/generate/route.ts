/**
 * POST /api/generate
 *
 * Runs the pipeline for one idea.
 *
 * This handler is the trust boundary. The OpenAI key, the service role key and
 * every model call live on this side of it.
 *
 * Called twice in the normal flow: once to get hooks, then again with the hook
 * the user picked. Passing the hook back rather than holding server state means
 * a refresh mid-flow loses nothing that was not already on screen.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePost } from "../../../src/pipeline/generate-post";
import { getStore } from "../../../src/store";
import { postRequirementsSchema } from "../../../src/schemas/requirements";
import {
  buildContext,
  errorResponse,
  getCurrentUserId,
  lintOptionsSchema,
  parseBody,
} from "../../../src/lib/api";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  idea: z.string().min(3, "Give the idea at least a sentence."),
  mode: z.enum(["quick_draft", "strategy", "research", "rewrite"]).default("quick_draft"),
  /** Stop after scoring hooks so the user can choose. */
  pauseForHookSelection: z.boolean().default(false),
  /** The hook the user chose, sent back on the second call. */
  selectedHook: z
    .object({
      text: z.string(),
      hook_family: z.string(),
      promise: z.string(),
    })
    .optional(),
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
  lintOptions: lintOptionsSchema,
  /** Which trade-offs this post is willing to make. Source section 54. */
  distributionMode: z
    .enum(["broad_reach", "balanced", "voice_first", "conversion_first", "network_first"])
    .default("balanced"),
  /** Description of attached media, for the alignment check. */
  mediaDescription: z.string().optional(),
  /** Supporting material: notes, evidence, raw thoughts. */
  brief: z.string().optional(),
  /** The checklist ticked before generating. */
  requirements: postRequirementsSchema.optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = await parseBody(request, requestSchema);
  if ("response" in parsed) return parsed.response;

  const {
    idea,
    mode,
    pauseForHookSelection,
    selectedHook,
    overrides,
    lintOptions,
    distributionMode,
    mediaDescription,
    brief,
    requirements,
  } = parsed.data;

  try {
    const context = await buildContext(idea);
    if (overrides) context.overrides = overrides;
    if (brief?.trim()) context.brief = brief.trim();
    if (requirements) context.requirements = requirements;

    const result = await generatePost(context, {
      mode,
      pauseForHookSelection,
      distributionMode,
      ...(selectedHook ? { selectedHook } : {}),
      ...(lintOptions ? { lintOptions } : {}),
      ...(mediaDescription ? { mediaDescription } : {}),
    });

    // Only persist a run that produced a draft. A hook-selection pause is a
    // half-finished run and would clutter history with nothing to read.
    const postId = result.draft
      ? await getStore().savePostRun(getCurrentUserId(), result)
      : null;

    return NextResponse.json({ postId, result });
  } catch (error) {
    return errorResponse("Generation failed", error);
  }
}
