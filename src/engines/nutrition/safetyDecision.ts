import type { NutritionProfile } from '@/types';
import {
  NUTRITION_INPUT_LIMITS,
  NUTRITION_SAFETY_POLICY_V1,
  type NutritionSafetyPolicy,
} from './policy';

/**
 * Safety and referral engine (Feed spec §10).
 *
 * A discriminated union rather than a boolean, because the product needs to do
 * five genuinely different things: proceed, offer a longer timeframe, fall back
 * to a professionally prescribed manual target, route to a professional, or
 * stop. Collapsing those into `approved: false` loses the only information the
 * UI needs to be useful.
 *
 * Runs before any calculation. An excluded profile never reaches the energy
 * engine, so no target exists to leak into a screen.
 */

export type SafetyReasonCode =
  | 'UNDER_MINIMUM_AGE'
  | 'ABOVE_AUTOMATED_AGE'
  | 'PREGNANCY'
  | 'BREASTFEEDING'
  | 'EATING_DISORDER'
  | 'MEDICAL_CONDITION'
  | 'HEIGHT_OUT_OF_RANGE'
  | 'WEIGHT_OUT_OF_RANGE'
  | 'TIMEFRAME_OUT_OF_RANGE'
  | 'TARGET_DIRECTION_INVALID'
  | 'CALORIE_FLOOR_REACHED'
  | 'EQUATION_BASIS_UNAVAILABLE';

export type NutritionSafetyDecision =
  | { status: 'approved'; policyVersion: string }
  | { status: 'adjust_timeframe'; supportedWeeks: number; requestedWeeks: number; policyVersion: string }
  | { status: 'manual_target_only'; reasonCode: SafetyReasonCode; policyVersion: string }
  | { status: 'professional_referral'; reasonCode: SafetyReasonCode; policyVersion: string }
  | { status: 'blocked'; reasonCode: SafetyReasonCode; policyVersion: string };

/**
 * User-facing copy. Plain, non-clinical, and never a diagnosis — the app states
 * what it will not do automatically and who to ask instead.
 */
export const SAFETY_MESSAGES: Record<SafetyReasonCode, string> = {
  UNDER_MINIMUM_AGE:
    'The automated planner is available to adults aged 18 and over. Speak to a doctor or registered dietitian for guidance suited to you.',
  ABOVE_AUTOMATED_AGE:
    'Above 80 The Kennel does not set targets automatically. Energy needs and medication interactions vary too much for that to be responsible. A registered dietitian can set targets with you.',
  PREGNANCY:
    'The Kennel does not generate automated nutrition plans during pregnancy. Nutritional needs change in ways this planner is not built for — please speak to your midwife, doctor or a registered dietitian.',
  BREASTFEEDING:
    'The Kennel does not generate automated nutrition plans while breastfeeding. Please speak to your doctor, health visitor or a registered dietitian for advice suited to you.',
  EATING_DISORDER:
    'Based on what you have told us, an automated calorie and meal planner is not the right tool here. Please speak to your GP or an appropriately qualified professional. Everything else in The Kennel remains available to you.',
  MEDICAL_CONDITION:
    'You have told us about a condition or medication that may affect your nutritional needs. Please get advice from an appropriately qualified healthcare professional before using the automated planner.',
  HEIGHT_OUT_OF_RANGE:
    'The height entered is outside the range The Kennel plans for automatically. Check the figure, or ask a professional to set targets with you.',
  WEIGHT_OUT_OF_RANGE:
    'The weight entered is outside the range The Kennel plans for automatically. Check the figure, or ask a professional to set targets with you.',
  TIMEFRAME_OUT_OF_RANGE:
    'That timeframe is outside the range The Kennel plans for. Choose something between one week and two years.',
  TARGET_DIRECTION_INVALID:
    'Your target weight does not match your goal. Check whether you meant to lose, gain or maintain.',
  CALORIE_FLOOR_REACHED:
    'The targets this request produces fall below the lowest daily intake The Kennel will generate automatically. A longer timeframe will bring it back into range.',
  EQUATION_BASIS_UNAVAILABLE:
    'The equation used here needs a calculation basis you have not provided. You can enter targets prescribed by a professional instead.',
};

export function messageFor(code: SafetyReasonCode): string {
  return SAFETY_MESSAGES[code];
}

function blocked(reasonCode: SafetyReasonCode, policy: NutritionSafetyPolicy): NutritionSafetyDecision {
  return { status: 'blocked', reasonCode, policyVersion: policy.version };
}

function referral(reasonCode: SafetyReasonCode, policy: NutritionSafetyPolicy): NutritionSafetyDecision {
  return { status: 'professional_referral', reasonCode, policyVersion: policy.version };
}

/**
 * Screen a profile before anything is calculated.
 *
 * Order matters: the most specific exclusion wins, so the user gets the
 * referral that actually applies rather than a generic one.
 */
export function screenProfile(
  profile: NutritionProfile,
  policy: NutritionSafetyPolicy = NUTRITION_SAFETY_POLICY_V1,
): NutritionSafetyDecision {
  if (profile.ageYears < policy.minAge) return blocked('UNDER_MINIMUM_AGE', policy);
  if (profile.isPregnant) return blocked('PREGNANCY', policy);
  if (profile.isBreastfeeding) return blocked('BREASTFEEDING', policy);
  if (profile.hasEatingDisorderHistory) return referral('EATING_DISORDER', policy);
  if (profile.hasMedicalCondition) return referral('MEDICAL_CONDITION', policy);

  if (profile.ageYears > policy.maxAutomatedAge) return referral('ABOVE_AUTOMATED_AGE', policy);

  const limits = NUTRITION_INPUT_LIMITS;
  if (profile.heightCm < limits.minHeightCm || profile.heightCm > limits.maxHeightCm) {
    return blocked('HEIGHT_OUT_OF_RANGE', policy);
  }
  if (profile.currentWeightKg < limits.minWeightKg || profile.currentWeightKg > limits.maxWeightKg) {
    return blocked('WEIGHT_OUT_OF_RANGE', policy);
  }

  const weeks = profile.requestedTimeframeWeeks;
  if (weeks != null && (weeks < limits.minTimeframeWeeks || weeks > limits.maxTimeframeWeeks)) {
    return blocked('TIMEFRAME_OUT_OF_RANGE', policy);
  }

  // Goal direction must agree with the target, or the arithmetic is meaningless.
  const target = profile.targetWeightKg;
  if (target != null) {
    if (profile.goal === 'lose_body_fat' && target >= profile.currentWeightKg) {
      return blocked('TARGET_DIRECTION_INVALID', policy);
    }
    if (profile.goal === 'build_muscle' && target <= profile.currentWeightKg) {
      return blocked('TARGET_DIRECTION_INVALID', policy);
    }
  }

  return { status: 'approved', policyVersion: policy.version };
}

/** True when a decision permits automated target generation to proceed. */
export function permitsAutomation(decision: NutritionSafetyDecision): boolean {
  return decision.status === 'approved' || decision.status === 'adjust_timeframe';
}

/** True when the user should be pointed at a professional. */
export function suggestsReferral(decision: NutritionSafetyDecision): boolean {
  return decision.status === 'professional_referral' || decision.status === 'blocked';
}

export function describeDecision(decision: NutritionSafetyDecision): string {
  switch (decision.status) {
    case 'approved':
      return "Your targets are within The Kennel's supported range.";
    case 'adjust_timeframe':
      return `That timeframe needs a rate of change outside The Kennel's supported range. The earliest supported target is ${decision.supportedWeeks} weeks.`;
    case 'manual_target_only':
    case 'professional_referral':
    case 'blocked':
      return messageFor(decision.reasonCode);
  }
}
