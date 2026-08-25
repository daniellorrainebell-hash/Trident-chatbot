import type { Sex } from '@/types';

/**
 * Versioned nutrition policy (Feed spec §7.3, §8.2, §35).
 *
 * Every threshold the product applies to a person's food lives here, in one
 * reviewable object, and every calculation records which version produced it.
 *
 * THESE ARE DEVELOPMENT DEFAULTS.
 * The Feed spec is explicit that a qualified nutrition professional must review
 * them before release. They are deliberately conservative automation boundaries
 * — not clinical prescriptions, and not claims about what is healthy.
 */

export const NUTRITION_ENGINE_VERSION = 'nutrition-engine-v1';
export const SAFETY_POLICY_VERSION = 'nutrition-safety-v1-draft';
export const ACTIVITY_POLICY_VERSION = 'activity-v1';
export const MACRO_POLICY_VERSION = 'macro-v1';
export const EQUATION_VERSION = '1990-v1';

export type ActivityLevel =
  | 'mostly_seated'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active';

/**
 * The multiplier covers the user's *entire* normal week, training included.
 *
 * Sessions per week and reported consistency are cross-checks and confidence
 * signals, never a second calorie bonus on top — adding activity twice is the
 * classic way these calculators end up hundreds of calories high.
 */
export const ACTIVITY_POLICY_V1: Record<ActivityLevel, number> = {
  mostly_seated: 1.35,
  lightly_active: 1.48,
  moderately_active: 1.62,
  very_active: 1.78,
};

export const ACTIVITY_DESCRIPTIONS: Record<ActivityLevel, string> = {
  mostly_seated: 'Desk job, little walking, training is most of your movement.',
  lightly_active: 'On your feet some of the day, plus your training.',
  moderately_active: 'Active job or a lot of daily walking, plus your training.',
  very_active: 'Physical job or very high daily movement, plus your training.',
};

export type TrainingExperience =
  | 'new_to_training'
  | 'six_to_eighteen_months'
  | 'one_point_five_to_three_years'
  | 'three_to_five_years'
  | 'five_plus_years';

/**
 * Surplus for muscle gain is set by training experience, not by dividing a
 * target weight by a timeframe. Converting every target kilogram into calories
 * implies all gained bodyweight will be muscle, which the spec forbids
 * promising (§8.5).
 */
export const SURPLUS_BY_EXPERIENCE: Record<TrainingExperience, number> = {
  new_to_training: 0.10,
  six_to_eighteen_months: 0.10,
  one_point_five_to_three_years: 0.08,
  three_to_five_years: 0.06,
  five_plus_years: 0.05,
};

export type NutritionGoal = 'LOSE_BODY_FAT' | 'BUILD_MUSCLE' | 'MAINTAIN_RECOMP';

export const PROTEIN_GRAMS_PER_KG: Record<NutritionGoal, number> = {
  LOSE_BODY_FAT: 2.0,
  BUILD_MUSCLE: 1.8,
  MAINTAIN_RECOMP: 1.8,
};

/** Automation boundaries. Outside these the planner stops rather than guesses. */
export const NUTRITION_INPUT_LIMITS = {
  minAge: 18,
  maxAutomatedAge: 80,
  minHeightCm: 120,
  maxHeightCm: 230,
  minWeightKg: 35,
  maxWeightKg: 300,
  minTimeframeWeeks: 1,
  maxTimeframeWeeks: 104,
  minMealsPerDay: 2,
  maxMealsPerDay: 6,
} as const;

export type NutritionSafetyPolicy = {
  version: string;

  minAge: number;
  maxAutomatedAge: number;

  maxLossRateFractionPerWeek: number;
  preferredLossRateFractionPerWeek: number;
  maxGainRateFractionPerWeek: number;
  preferredGainRateFractionPerWeek: number;

  maxDeficitFraction: number;
  maxSurplusFraction: number;

  /** Hard automation floors, per calculation basis. */
  absoluteCalorieFloor: Record<Sex, number>;
  /**
   * A second floor relative to the person's own resting estimate. A fixed
   * absolute floor alone is too crude: 1,500 kcal is generous for a small
   * sedentary adult and too low for a large one.
   */
  bmrFloorFraction: number;

  /** Protein and fat guards, g per kg of the reference weight. */
  minProteinGPerKg: number;
  maxProteinGPerKg: number;
  minFatGPerKg: number;
  /** Fat as a share of target calories. */
  fatStartFraction: number;
  maxFatFraction: number;
  /** Below this the plan is infeasible and goes back for review. */
  minAutomatedCarbsGrams: number;

  minimumObservationDaysBeforeAdjustment: number;
  preferredObservationDaysBeforeAdjustment: number;
  minimumAdherenceForAdjustment: number;
};

export const NUTRITION_SAFETY_POLICY_V1: NutritionSafetyPolicy = {
  version: SAFETY_POLICY_VERSION,

  minAge: 18,
  maxAutomatedAge: 80,

  maxLossRateFractionPerWeek: 0.01,
  preferredLossRateFractionPerWeek: 0.005,
  maxGainRateFractionPerWeek: 0.005,
  preferredGainRateFractionPerWeek: 0.0025,

  maxDeficitFraction: 0.20,
  maxSurplusFraction: 0.12,

  absoluteCalorieFloor: { male: 1500, female: 1200 },
  bmrFloorFraction: 0.90,

  minProteinGPerKg: 1.4,
  maxProteinGPerKg: 2.2,
  minFatGPerKg: 0.60,
  fatStartFraction: 0.25,
  maxFatFraction: 0.35,
  minAutomatedCarbsGrams: 80,

  minimumObservationDaysBeforeAdjustment: 14,
  preferredObservationDaysBeforeAdjustment: 21,
  minimumAdherenceForAdjustment: 0.80,
};

/**
 * Adjustments are small and absolute-bounded as well as proportional, so a
 * large target cannot produce a large swing (§35).
 */
export const ADJUSTMENT_POLICY = {
  minimumAbsoluteKcal: 100,
  maximumAbsoluteKcal: 150,
  maximumFractionOfTarget: 0.05,
} as const;

/** The four-event day. Distributions must sum to 1 — asserted in tests. */
export const MEAL_DISTRIBUTIONS: Record<number, Record<string, number>> = {
  2: { lunch: 0.5, dinner: 0.5 },
  3: { breakfast: 0.3, lunch: 0.35, dinner: 0.35 },
  4: { breakfast: 0.25, lunch: 0.3, dinner: 0.3, snack: 0.15 },
  5: { breakfast: 0.22, snack_am: 0.12, lunch: 0.28, dinner: 0.28, snack_pm: 0.10 },
  6: { breakfast: 0.2, snack_am: 0.1, lunch: 0.25, snack_pm: 0.1, dinner: 0.25, snack_eve: 0.1 },
};

export const MEAL_TOLERANCE = {
  kcalFraction: 0.05,
  proteinFraction: 0.10,
  carbsFraction: 0.15,
  fatFraction: 0.15,
} as const;

export const DAILY_TOLERANCE = {
  kcalFraction: 0.03,
  proteinFraction: 0.05,
  carbsFraction: 0.08,
  fatFraction: 0.08,
} as const;

/** The 7,700 kcal/kg heuristic. An estimate for arithmetic, never a promise. */
export const KCAL_PER_KG_BODYWEIGHT = 7700;

export type NutritionCalculationMetadata = {
  equation: 'MIFFLIN_ST_JEOR' | 'KATCH_MCARDLE';
  equationVersion: string;
  nutritionEngineVersion: string;
  safetyPolicyVersion: string;
  activityPolicyVersion: string;
  macroPolicyVersion: string;
  calculatedAt: string;
};

export function buildMetadata(
  equation: NutritionCalculationMetadata['equation'],
  policy: NutritionSafetyPolicy = NUTRITION_SAFETY_POLICY_V1,
): NutritionCalculationMetadata {
  return {
    equation,
    equationVersion: EQUATION_VERSION,
    nutritionEngineVersion: NUTRITION_ENGINE_VERSION,
    safetyPolicyVersion: policy.version,
    activityPolicyVersion: ACTIVITY_POLICY_VERSION,
    macroPolicyVersion: MACRO_POLICY_VERSION,
    calculatedAt: new Date().toISOString(),
  };
}

export function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
