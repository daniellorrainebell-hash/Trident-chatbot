/**
 * Commercial and offer schemas.
 *
 * Hormozi module sections 87, 100 and 101. Storing the offer as structured data
 * is better than making the model reconstruct it from old posts on every run,
 * and it is the only way to gate guarantees, scarcity and urgency behind
 * verification rather than behind the model's judgement.
 */

import { z } from "zod";

export const guaranteeSchema = z.object({
  type: z.enum(["unconditional", "conditional", "anti_guarantee", "implied_performance"]),
  terms: z.string(),
  /** Only an approved guarantee may appear in generated copy. */
  approved: z.boolean(),
});

export const scarcitySchema = z.object({
  active: z.boolean(),
  type: z.string(),
  quantity: z.number().nullable(),
  reason: z.string(),
  /** ISO timestamp. A record with no verification date cannot be used. */
  verified_at: z.string().nullable(),
});

export const urgencySchema = z.object({
  active: z.boolean(),
  deadline: z.string().nullable(),
  reason: z.string(),
  verified_at: z.string().nullable(),
});

export const offerSchema = z.object({
  offer_name: z.string(),
  avatar: z.string(),
  problem: z.string(),
  dream_outcome: z.string(),
  core_deliverables: z.array(z.string()),
  delivery_mode: z.enum(["DIY", "DWY", "DFY", "mixed"]),
  time_to_first_value: z.string(),
  client_effort: z.string(),
  proof: z.array(z.string()),
  bonuses: z.array(z.string()),
  guarantee: guaranteeSchema.nullable(),
  scarcity: scarcitySchema.nullable(),
  urgency: urgencySchema.nullable(),
  price: z.string().nullable(),
  cta: z.string(),
});

export const commercialAnalysisSchema = z.object({
  is_commercial: z.boolean(),
  market_pain: z.string(),
  dream_outcome: z.string(),
  perceived_likelihood_levers: z.array(z.string()),
  time_delay_levers: z.array(z.string()),
  effort_reduction_levers: z.array(z.string()),
  primary_objection: z.string(),
  secondary_objections: z.array(z.string()),
  proof_available: z.array(z.string()),
  offer_components: z.array(z.string()),
  /** Null unless an approved guarantee exists in the offer record. */
  approved_guarantee: z.string().nullable(),
  real_scarcity: z.string().nullable(),
  real_urgency: z.string().nullable(),
  recommended_cta: z.string(),
});

export type Guarantee = z.infer<typeof guaranteeSchema>;
export type Offer = z.infer<typeof offerSchema>;
export type CommercialAnalysis = z.infer<typeof commercialAnalysisSchema>;

/** A guarantee may only be referenced in copy when it is approved. */
export function isGuaranteeUsable(guarantee: Guarantee | null | undefined): boolean {
  return Boolean(guarantee?.approved);
}

/**
 * Scarcity and urgency are usable only when active AND carrying a verification
 * timestamp. Hormozi module section 100: "Generator may only use these fields if
 * active and verified."
 */
export function isConstraintUsable(
  constraint: { active: boolean; verified_at: string | null } | null | undefined,
): boolean {
  if (!constraint) return false;
  if (!constraint.active) return false;
  if (!constraint.verified_at) return false;
  return !Number.isNaN(Date.parse(constraint.verified_at));
}
