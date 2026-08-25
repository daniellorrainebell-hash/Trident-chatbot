import type { NutritionProfile, SafetyDecision, SafetyDecisionKind, Sex } from '@/types';

/**
 * Nutrition safety policy.
 *
 * Every threshold the product applies lives in this one object. Nothing in a
 * screen, and nothing in a prompt, holds a number like this.
 *
 * The rail that matters is the cut: a deficit never goes deeper than 500 kcal
 * below maintenance. The rest of the arithmetic — resting energy, an activity
 * multiplier, protein and fat from bodyweight — is ordinary.
 *
 * The LLM never sees, sets or overrides any of this. Policy runs before
 * generation and again after it.
 */

export const NUTRITION_POLICY_VERSION = 1;

export type NutritionSafetyPolicy = {
  version: number;

  minAge: number;
  supportedAgeMax: number;

  /**
   * The safety rail. A cut never goes deeper than this many calories below
   * maintenance, whatever the goal weight or the requested timeframe.
   */
  maxDeficitKcal: number;
  /** Surplus stays proportional — overshooting a bulk is not a safety issue. */
  maxSurplusPercent: number;

  /** Weight change rate, as a share of bodyweight per week. */
  maxWeightLossRatePercentPerWeek: number;
  maxWeightGainRatePercentPerWeek: number;
  /** Below this, the change is too slow to be worth planning around. */
  minWeightChangeRatePercentPerWeek: number;

  /** Protein floor, g per kg of bodyweight. Protected during a deficit. */
  minProteinGPerKg: number;
  maxProteinGPerKg: number;
  /** Fat floor, g per kg — an essential-intake guard, not a preference. */
  minFatGPerKg: number;

  pregnancyExclusion: boolean;
  breastfeedingExclusion: boolean;
  eatingDisorderExclusion: boolean;
  medicalReferralRequired: boolean;

  /** Weeks of check-in data required before any calorie adjustment (spec §50). */
  minWeeksBeforeAdjustment: number;
  /** Below this reported adherence, a missed target is not an energy problem. */
  minAdherencePercentForAdjustment: number;
  /** Cap on a single adjustment, as a share of current intake. */
  maxSingleAdjustmentPercent: number;
};

export const DEFAULT_NUTRITION_POLICY: NutritionSafetyPolicy = {
  version: NUTRITION_POLICY_VERSION,

  minAge: 18,
  supportedAgeMax: 75,

  maxDeficitKcal: 500,
  maxSurplusPercent: 0.15,

  maxWeightLossRatePercentPerWeek: 0.01,
  maxWeightGainRatePercentPerWeek: 0.005,
  minWeightChangeRatePercentPerWeek: 0.001,

  minProteinGPerKg: 1.6,
  maxProteinGPerKg: 2.8,
  minFatGPerKg: 0.6,

  pregnancyExclusion: true,
  breastfeedingExclusion: true,
  eatingDisorderExclusion: true,
  medicalReferralRequired: true,

  minWeeksBeforeAdjustment: 3,
  minAdherencePercentForAdjustment: 80,
  maxSingleAdjustmentPercent: 0.08,
};

/** Copy is plain and non-clinical. The app does not diagnose (spec §33). */
const MESSAGES: Record<SafetyDecisionKind, string> = {
  approved: 'Your targets are within The Kennel\'s supported range.',
  approved_with_adjustment:
    'Your request sits outside The Kennel\'s supported range, so it has been adjusted to the closest supported plan.',
  blocked_age:
    'The automated planner is available to adults aged 18 and over. Speak to a doctor or registered dietitian for guidance suited to you.',
  blocked_pregnancy:
    'The Kennel does not generate automated nutrition plans during pregnancy. Nutritional needs change in ways this planner is not built for — please speak to your midwife, doctor or a registered dietitian.',
  blocked_breastfeeding:
    'The Kennel does not generate automated nutrition plans while breastfeeding. Please speak to your doctor, health visitor or a registered dietitian for advice suited to you.',
  blocked_eating_disorder:
    'Based on what you have told us, an automated calorie and meal planner is not the right tool here. Please speak to your GP or an appropriately qualified professional. Everything else in The Kennel remains available to you.',
  blocked_medical:
    'You have told us about a medical condition that may affect your nutritional needs. Please get advice from an appropriately qualified healthcare professional before using the automated planner.',
  blocked_rate_unsupported:
    'The rate of weight change you have asked for is outside The Kennel\'s supported range.',
  blocked_energy_floor:
    'That would put you more than 500 calories below maintenance. The Kennel does not cut deeper than that — give it more time instead.',
};

export function messageFor(kind: SafetyDecisionKind): string {
  return MESSAGES[kind];
}

function decision(
  kind: SafetyDecisionKind,
  approved: boolean,
  referralSuggested: boolean,
  policy: NutritionSafetyPolicy,
  adjustment?: SafetyDecision['adjustment'],
): SafetyDecision {
  return {
    kind,
    approved,
    message: MESSAGES[kind],
    adjustment,
    referralSuggested,
    policyVersion: policy.version,
    decidedAt: new Date().toISOString(),
  };
}

/**
 * Eligibility gate (spec §33). Runs before any calculation — an excluded profile
 * never reaches the energy engine, so no target is produced to leak into the UI.
 *
 * Order matters: the most specific exclusion wins, so the user gets the most
 * relevant referral rather than a generic one.
 */
export function checkEligibility(
  profile: NutritionProfile,
  policy: NutritionSafetyPolicy = DEFAULT_NUTRITION_POLICY,
): SafetyDecision {
  if (profile.ageYears < policy.minAge) {
    return decision('blocked_age', false, true, policy);
  }
  if (policy.pregnancyExclusion && profile.isPregnant) {
    return decision('blocked_pregnancy', false, true, policy);
  }
  if (policy.breastfeedingExclusion && profile.isBreastfeeding) {
    return decision('blocked_breastfeeding', false, true, policy);
  }
  if (policy.eatingDisorderExclusion && profile.hasEatingDisorderHistory) {
    return decision('blocked_eating_disorder', false, true, policy);
  }
  if (policy.medicalReferralRequired && profile.hasMedicalCondition) {
    return decision('blocked_medical', false, true, policy);
  }
  // Above the supported age band the planner still runs, but flags a referral —
  // energy needs and medication interactions are more variable here.
  if (profile.ageYears > policy.supportedAgeMax) {
    return decision('approved', true, true, policy);
  }
  return decision('approved', true, false, policy);
}

/**
 * Lowest daily intake the planner will produce.
 *
 * Maintenance minus the cap, so it scales with the person instead of being a
 * fixed number that is generous for a small adult and tight for a large one.
 */
export function energyFloor(
  maintenance: number,
  policy: NutritionSafetyPolicy = DEFAULT_NUTRITION_POLICY,
): number {
  return maintenance - policy.maxDeficitKcal;
}

/**
 * Clamp a proposed intake into the supported band.
 * Returns the approved figure plus whether it had to be moved.
 */
export function clampCalories(
  proposed: number,
  maintenance: number,
  profile: NutritionProfile,
  policy: NutritionSafetyPolicy = DEFAULT_NUTRITION_POLICY,
): { calories: number; clamped: boolean; reason: 'deficit_cap' | 'surplus_cap' | null } {
  const floor = energyFloor(maintenance, policy);
  const ceiling = Math.round(maintenance * (1 + policy.maxSurplusPercent));

  if (proposed < floor) {
    return { calories: floor, clamped: true, reason: 'deficit_cap' };
  }
  if (proposed > ceiling) {
    return { calories: ceiling, clamped: true, reason: 'surplus_cap' };
  }
  return { calories: Math.round(proposed), clamped: false, reason: null };
}

/**
 * Validate a manual override from an advanced user (spec §38).
 * Manual entry is allowed; bypassing the safety band is not.
 */
export function validateManualTargets(
  calories: number,
  maintenance: number,
  profile: NutritionProfile,
  policy: NutritionSafetyPolicy = DEFAULT_NUTRITION_POLICY,
): SafetyDecision {
  const result = clampCalories(calories, maintenance, profile, policy);
  if (!result.clamped) return decision('approved', true, false, policy);

  return decision(
    'approved_with_adjustment',
    true,
    false,
    policy,
    { field: 'target_calories', requested: Math.round(calories), supported: result.calories },
  );
}

export { decision as buildSafetyDecision };
