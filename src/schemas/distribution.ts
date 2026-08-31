/**
 * Distribution check boundary schema.
 *
 * Source sections 37 and 57.
 *
 * Every score carries a reason, because a bare number is not actionable and
 * because a reason is what lets the user judge whether the critic understood
 * the post. Every detection carries a severity, because the difference between
 * a knowingly accepted trade-off and a correctable mistake is the whole point
 * of this stage.
 */

import { z } from "zod";

export const distributionStatusSchema = z.enum([
  /** Strong fit with current published LinkedIn recommendation guidance. */
  "PASS",
  /** An intentional characteristic that may reduce broad recommendation but serves voice or conversion. */
  "PASS_WITH_TRADEOFF",
  /** A correctable recommendation problem. */
  "REVISE",
  /** Prohibited automation, spam manipulation, fake engagement or another platform-policy problem. */
  "BLOCK_PLATFORM_RISK",
]);

export const severitySchema = z.enum(["none", "low", "medium", "high"]);

const scored = z.object({
  score: z.number().min(0).max(10),
  reason: z.string(),
});

const detected = z.object({
  detected: z.boolean(),
  severity: severitySchema,
  reason: z.string(),
});

export const distributionCheckSchema = z.object({
  professional_relevance: scored,
  topic_clarity: scored,
  out_of_network_context: scored,
  originality: scored,
  useful_insight: scored,
  dwell_quality: scored,

  engagement_bait: detected,
  generic_recycled: detected,
  promotion_only: detected,
  unconstructive_risk: detected,

  media_alignment: z.object({
    applicable: z.boolean(),
    aligned: z.boolean(),
    reason: z.string(),
  }),

  profanity: z.object({
    detected: z.boolean(),
    broad_recommendation_tradeoff: z.boolean(),
    reason: z.string(),
  }),

  unsupported_algorithm_hack: z.object({
    detected: z.boolean(),
    details: z.array(z.string()),
  }),

  /**
   * Concerns the critic reached by inference rather than from a confirmed
   * LinkedIn statement. Kept separate so they are never reported to the user
   * as platform rules.
   */
  implementation_inference_notes: z.array(z.string()),

  status: distributionStatusSchema,
  /** Exact changes, in the same style the editorial critic uses. */
  revision_actions: z.array(z.string()),
  /** One sentence. */
  summary: z.string(),
});

export type DistributionCheck = z.infer<typeof distributionCheckSchema>;
export type DistributionStatus = z.infer<typeof distributionStatusSchema>;
export type Severity = z.infer<typeof severitySchema>;

/**
 * The Nexus Distribution Score.
 *
 * A mean of the six confirmed-category dimensions, with penalties for the
 * confirmed negatives. Deliberately simple and deliberately ours: LinkedIn
 * publishes no creator-facing quality formula, so this must never be presented
 * as a prediction of LinkedIn's own ranking.
 */
export function distributionScore(check: DistributionCheck): number {
  const dimensions = [
    check.professional_relevance.score,
    check.topic_clarity.score,
    check.out_of_network_context.score,
    check.originality.score,
    check.useful_insight.score,
    check.dwell_quality.score,
  ];

  const base = dimensions.reduce((total, value) => total + value, 0) / dimensions.length;

  const penalty = (entry: { detected: boolean; severity: Severity }): number => {
    if (!entry.detected) return 0;
    return { none: 0, low: 0.5, medium: 1.5, high: 3 }[entry.severity];
  };

  const penalties =
    penalty(check.engagement_bait) +
    penalty(check.generic_recycled) +
    penalty(check.promotion_only) +
    penalty(check.unconstructive_risk);

  return Math.max(0, Math.min(10, Number((base - penalties).toFixed(1))));
}

/** Does this check block the draft from being presented as finished? */
export function blocksPublication(check: DistributionCheck): boolean {
  return check.status === "BLOCK_PLATFORM_RISK";
}
