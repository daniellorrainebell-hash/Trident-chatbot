/**
 * Hook engine boundary schemas.
 *
 * Spec section 27 sets the generation target at 12 to 20 internal candidates,
 * with the top 3 to 5 shown. Section 28 defines the scoring dimensions and a
 * weighted example, and states the weights are a product decision that must
 * remain configurable.
 */

import { z } from "zod";

export const hookCandidateSchema = z.object({
  text: z.string().min(1),
  hook_family: z.string(),
  /** What promise, tension or question the body must now fulfil. */
  promise: z.string(),
});

export const hookCandidateListSchema = z.object({
  candidates: z.array(hookCandidateSchema).min(1),
});

export const hookScoreSchema = z.object({
  text: z.string(),
  hook_family: z.string(),
  scores: z.object({
    audience_relevance: z.number().min(0).max(10),
    specificity: z.number().min(0).max(10),
    curiosity: z.number().min(0).max(10),
    tension: z.number().min(0).max(10),
    credibility: z.number().min(0).max(10),
    originality: z.number().min(0).max(10),
    clarity: z.number().min(0).max(10),
    body_fulfilment_potential: z.number().min(0).max(10),
    voice_fit: z.number().min(0).max(10),
  }),
  penalties: z
    .array(
      z.enum([
        "cliche",
        "clickbait",
        "unsupported_number",
        "false_personal_claim",
        "generic_ai_language",
        "overly_long",
        "body_cannot_fulfil",
      ]),
    )
    .describe("Each penalty applied reduces the weighted score."),
  /** One sentence. No essay. */
  verdict: z.string(),
});

export const hookScoreListSchema = z.object({
  scored: z.array(hookScoreSchema).min(1),
});

export type HookCandidate = z.infer<typeof hookCandidateSchema>;
export type HookScore = z.infer<typeof hookScoreSchema>;
export type HookPenalty = HookScore["penalties"][number];

/**
 * Default scoring weights from spec section 28.
 *
 * Sums to 1.0. Configurable per deployment; the spec is explicit that these are
 * an implementation decision rather than a source constant.
 */
export type HookWeights = Record<keyof HookScore["scores"], number>;

export const DEFAULT_HOOK_WEIGHTS: HookWeights = {
  audience_relevance: 0.2,
  specificity: 0.15,
  credibility: 0.15,
  curiosity: 0.1,
  tension: 0.1,
  originality: 0.1,
  clarity: 0.1,
  voice_fit: 0.1,
  // Judged as a gate rather than scored: a hook the body cannot fulfil takes the
  // body_cannot_fulfil penalty instead of losing a fraction of a weighted point.
  body_fulfilment_potential: 0,
};

/** Penalty deductions applied to the weighted score, in points out of 10. */
export const PENALTY_WEIGHTS: Record<HookPenalty, number> = {
  cliche: 1.5,
  clickbait: 2,
  unsupported_number: 3,
  false_personal_claim: 10,
  generic_ai_language: 1.5,
  overly_long: 1,
  body_cannot_fulfil: 3,
};
