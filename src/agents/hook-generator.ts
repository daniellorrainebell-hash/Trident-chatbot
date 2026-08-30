/**
 * Agent 3: Hook Engine.
 *
 * Generates candidates across the selected families, avoiding near-duplicates.
 * Spec section 27 targets 12 to 20 internal candidates with the top 3 to 5 shown.
 */

import { generateStructured } from "../lib/responses";
import { HOOK_GENERATOR_PROMPT } from "../prompts";
import {
  hookCandidateListSchema,
  type HookCandidate,
} from "../schemas/hooks";
import { resolveFrameworks, renderFrameworksForPrompt } from "../frameworks/registry";
import { renderContextBlock, type GenerationContext } from "./types";
import { renderVoiceProfile } from "../schemas/voice";
import type { IdeaAnalysis } from "../schemas/strategy";
import { lintPost } from "../writing-rules/linter";

export interface HookGenerationOptions {
  /** Internal candidate target. Spec section 27. */
  targetCount?: number;
}

export async function runHookGenerator(
  context: GenerationContext,
  analysis: IdeaAnalysis,
  options: HookGenerationOptions = {},
): Promise<HookCandidate[]> {
  const target = options.targetCount ?? 16;
  const families = analysis.recommended_hook_families;
  const { resolved } = resolveFrameworks(families);

  const input = [
    renderContextBlock(context),
    `# VOICE PROFILE\n${renderVoiceProfile(context.voiceProfile)}`,
    `# STRATEGY\nAudience: ${analysis.target_audience}\nCore claim: ${analysis.core_claim}\nReader stage: ${analysis.reader_stage}\nPrimary psychology: ${analysis.primary_psychology}\nProof available: ${analysis.proof_available.join("; ") || "none"}\nProof missing (never invent these): ${analysis.proof_missing.join("; ") || "none"}`,
    `# HOOK FAMILIES TO GENERATE FROM\n${renderFrameworksForPrompt(resolved)}`,
    `# TASK\nGenerate approximately ${target} candidates spread across these families. Vary the angle within each family. For each, state the promise the body must fulfil.`,
  ].join("\n\n");

  const result = await generateStructured({
    role: "primary",
    system: HOOK_GENERATOR_PROMPT,
    input,
    schema: hookCandidateListSchema,
    schemaName: "hook_candidates",
  });

  return dedupeCandidates(result.candidates).filter(
    // A hook that violates a hard writing rule is discarded before scoring
    // rather than scored and rejected. Scoring it wastes a slot.
    (candidate) => lintPost(candidate.text).passed,
  );
}

/**
 * Remove near-duplicates.
 *
 * Compares normalised content words rather than exact strings, because the
 * common failure is the same hook reworded, not the same hook repeated.
 */
export function dedupeCandidates(
  candidates: readonly HookCandidate[],
  threshold = 0.8,
): HookCandidate[] {
  const kept: Array<{ candidate: HookCandidate; words: Set<string> }> = [];

  for (const candidate of candidates) {
    const words = new Set(
      candidate.text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3),
    );
    if (words.size === 0) continue;

    const isDuplicate = kept.some((entry) => {
      let shared = 0;
      for (const word of words) if (entry.words.has(word)) shared += 1;
      return shared / Math.min(words.size, entry.words.size) >= threshold;
    });

    if (!isDuplicate) kept.push({ candidate, words });
  }

  return kept.map((entry) => entry.candidate);
}
