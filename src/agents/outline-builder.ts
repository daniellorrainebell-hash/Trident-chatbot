/**
 * Agent 5: Outline Builder.
 *
 * Builds the post's movement from the selected hook and framework. The reader
 * never sees this structure; the writer's job is to make it invisible.
 */

import { generateStructured } from "../lib/responses";
import { OUTLINE_BUILDER_PROMPT } from "../prompts";
import { outlineSchema, type Outline } from "../schemas/outline";
import { getFramework, renderFrameworksForPrompt } from "../frameworks/registry";
import { renderContextBlock, type GenerationContext } from "./types";
import type { IdeaAnalysis } from "../schemas/strategy";
import type { HookCandidate } from "../schemas/hooks";

export async function runOutlineBuilder(
  context: GenerationContext,
  analysis: IdeaAnalysis,
  hook: HookCandidate,
): Promise<Outline> {
  const framework = getFramework(analysis.recommended_framework);
  if (!framework) {
    throw new Error(
      `Unknown framework "${analysis.recommended_framework}". The strategist must select an ID present in the registry.`,
    );
  }

  const input = [
    renderContextBlock(context),
    `# SELECTED HOOK\n${hook.text}\nFamily: ${hook.hook_family}\nPromise the body must fulfil: ${hook.promise}`,
    `# SELECTED FRAMEWORK\n${renderFrameworksForPrompt([framework])}`,
    `# STRATEGY\nCore claim: ${analysis.core_claim}\nAudience: ${analysis.target_audience}\nReader stage: ${analysis.reader_stage}\nPrimary psychology: ${analysis.primary_psychology}\nSecondary psychology: ${analysis.secondary_psychology.join(", ") || "none"}\nCTA type: ${analysis.cta_type}`,
    `# PROOF\nAvailable: ${analysis.proof_available.join("; ") || "none"}\nMissing (never invent): ${analysis.proof_missing.join("; ") || "none"}`,
    "# TASK\nBuild the outline. Use the framework's stages as section roles. Assign available material to the sections that will use it. Do not create a section that only restates another.",
  ].join("\n\n");

  const outline = await generateStructured({
    role: "primary",
    system: OUTLINE_BUILDER_PROMPT,
    input,
    schema: outlineSchema,
    schemaName: "post_outline",
  });

  // The framework the outline claims must be the one the strategist selected.
  outline.framework = analysis.recommended_framework;
  outline.hook = hook.text;

  return outline;
}
