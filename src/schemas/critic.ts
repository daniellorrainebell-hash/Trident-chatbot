/**
 * Critic boundary schema.
 *
 * The critic's job is to make the post better, not to be polite. It returns
 * scores, problems and exact changes, never an essay (spec section 56).
 */

import { z } from "zod";

export const criticProblemSchema = z.object({
  /** What is wrong. One sentence. */
  problem: z.string(),
  /** The offending text, quoted so the revision writer can locate it. */
  excerpt: z.string(),
  /** The exact change required, not a description of a change. */
  fix: z.string(),
  severity: z.enum(["blocking", "significant", "minor"]),
  category: z.enum([
    "hook_not_fulfilled",
    "no_clear_point",
    "no_movement",
    "insufficient_specificity",
    "proof_missing",
    "unsupported_claim",
    "generic_ai_language",
    "repetition",
    "framework_visible",
    "voice_mismatch",
    "cta_mismatch",
    "invented_experience",
    "writing_rule_violation",
    "over_selling",
  ]),
});

export const criticReportSchema = z.object({
  /** 0 to 10. Below 7 sends the draft to the revision writer. */
  score: z.number().min(0).max(10),
  scores: z.object({
    hook_fulfilment: z.number().min(0).max(10),
    clarity: z.number().min(0).max(10),
    specificity: z.number().min(0).max(10),
    movement: z.number().min(0).max(10),
    proof: z.number().min(0).max(10),
    voice_fit: z.number().min(0).max(10),
    cta_fit: z.number().min(0).max(10),
  }),
  problems: z.array(criticProblemSchema),
  /** True when the framework has become visible to the reader. */
  framework_is_visible: z.boolean(),
  /** True when the draft contains experience the user did not supply. */
  contains_invented_experience: z.boolean(),
  /** Claims that need the fact checker before publication. */
  claims_requiring_verification: z.array(z.string()),
  /** Would this post have been generated for anybody? Spec section 125. */
  is_generic: z.boolean(),
  verdict: z.enum(["ready", "revise", "reject"]),
});

export type CriticReport = z.infer<typeof criticReportSchema>;
export type CriticProblem = z.infer<typeof criticProblemSchema>;

/** Critic score at or above this returns the draft without a revision pass. */
export const CRITIC_PASS_THRESHOLD = 7;
