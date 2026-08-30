/**
 * Agent 4: Hook Critic.
 *
 * The model judges each dimension. Deterministic code computes the weighted
 * score and applies penalties, so the ranking is reproducible and the weights
 * stay configurable (spec section 28).
 */

import { generateStructured } from "../lib/responses";
import { HOOK_CRITIC_PROMPT } from "../prompts";
import {
  hookScoreListSchema,
  DEFAULT_HOOK_WEIGHTS,
  PENALTY_WEIGHTS,
  type HookCandidate,
  type HookScore,
  type HookWeights,
} from "../schemas/hooks";
import { renderVoiceProfile } from "../schemas/voice";
import type { GenerationContext } from "./types";
import type { IdeaAnalysis } from "../schemas/strategy";

export interface RankedHook {
  candidate: HookCandidate;
  score: HookScore;
  /** Weighted score out of 10, after penalties. */
  weighted: number;
}

/**
 * Weighted score for one hook.
 *
 * Pure and independently testable. A false personal claim carries a penalty
 * large enough to remove the hook from contention regardless of how well it
 * scores elsewhere, because the integrity rules are not tradeable against
 * curiosity or relevance.
 */
export function computeWeightedScore(
  score: HookScore,
  weights: HookWeights = DEFAULT_HOOK_WEIGHTS,
): number {
  let total = 0;
  for (const [dimension, weight] of Object.entries(weights)) {
    const value = score.scores[dimension as keyof HookScore["scores"]] ?? 0;
    total += value * weight;
  }

  for (const penalty of score.penalties) {
    total -= PENALTY_WEIGHTS[penalty] ?? 0;
  }

  return Math.max(0, Math.min(10, Number(total.toFixed(2))));
}

export async function runHookCritic(
  context: GenerationContext,
  analysis: IdeaAnalysis,
  candidates: readonly HookCandidate[],
  weights: HookWeights = DEFAULT_HOOK_WEIGHTS,
): Promise<RankedHook[]> {
  if (candidates.length === 0) return [];

  const input = [
    `# AUDIENCE\n${analysis.target_audience}`,
    `# CORE CLAIM\n${analysis.core_claim}`,
    `# MATERIAL AVAILABLE TO THE BODY\nProof available: ${analysis.proof_available.join("; ") || "none"}\nProof missing: ${analysis.proof_missing.join("; ") || "none"}`,
    `# VOICE PROFILE\n${renderVoiceProfile(context.voiceProfile)}`,
    `# HOOKS TO SCORE\n${candidates
      .map((candidate, index) => `${index + 1}. [${candidate.hook_family}] ${candidate.text}\n   Promise: ${candidate.promise}`)
      .join("\n")}`,
    "# TASK\nScore every hook. Apply body_cannot_fulfil where the available material cannot deliver the promise, and false_personal_claim where the hook implies experience the material does not evidence.",
  ].join("\n\n");

  const result = await generateStructured({
    role: "fast",
    system: HOOK_CRITIC_PROMPT,
    input,
    schema: hookScoreListSchema,
    schemaName: "hook_scores",
  });

  const byText = new Map(candidates.map((candidate) => [candidate.text, candidate]));

  return result.scored
    .flatMap((score) => {
      const candidate = byText.get(score.text);
      if (!candidate) return [];
      return [{ candidate, score, weighted: computeWeightedScore(score, weights) }];
    })
    .sort((a, b) => b.weighted - a.weighted);
}

/** Top hooks for the hook screen. Spec section 27 shows the user three to five. */
export function selectTopHooks(ranked: readonly RankedHook[], count = 5): RankedHook[] {
  return ranked.slice(0, count);
}
