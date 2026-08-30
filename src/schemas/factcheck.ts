/**
 * Fact checker boundary schema.
 *
 * Spec section 57. Every externally verifiable claim is extracted and classified.
 * The system must not turn uncertainty into confident prose: an unverifiable
 * claim is removed, qualified, referred to the user or flagged, never asserted.
 */

import { z } from "zod";

export const claimClassificationSchema = z.enum([
  "user_provided_experience",
  "opinion",
  "evergreen_factual_claim",
  "current_factual_claim",
  "legal_or_regulatory_claim",
  "statistic",
  "unsupported",
]);

export const claimVerdictSchema = z.enum([
  "verified",
  "partially_verified",
  "unverified",
  "contradicted",
  "not_applicable",
]);

export const claimSchema = z.object({
  claim: z.string(),
  classification: claimClassificationSchema,
  verdict: claimVerdictSchema,
  /** Concise evidence summary. Never private reasoning. */
  evidence: z.string(),
  /** Sources consulted, where research ran. */
  sources: z.array(z.string()),
  /** What to do with the claim in the draft. */
  recommended_action: z.enum([
    "keep_as_is",
    "qualify",
    "correct",
    "remove",
    "ask_user",
  ]),
  /** The corrected wording, where correction is recommended. */
  suggested_replacement: z.string().nullable(),
});

export const factCheckReportSchema = z.object({
  claims: z.array(claimSchema),
  /** True when at least one claim is unsafe to publish as fact. */
  blocks_publication: z.boolean(),
  summary: z.string(),
});

export type Claim = z.infer<typeof claimSchema>;
export type FactCheckReport = z.infer<typeof factCheckReportSchema>;
export type ClaimClassification = z.infer<typeof claimClassificationSchema>;

/** Classifications that always require a research pass. */
export const RESEARCH_REQUIRED_CLASSIFICATIONS: ClaimClassification[] = [
  "current_factual_claim",
  "legal_or_regulatory_claim",
  "statistic",
];
