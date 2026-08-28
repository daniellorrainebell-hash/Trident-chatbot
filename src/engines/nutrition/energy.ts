import type {
  ActivityLevel,
  EnergyCalculation,
  MacroTargets,
  NutritionProfile,
  Sex,
  TimeframeAssessment,
} from '@/types';
import {
  DEFAULT_NUTRITION_POLICY,
  NutritionSafetyPolicy,
  clampCalories,
} from './safetyPolicy';

/**
 * Deterministic energy and macro engine (spec §29, §30).
 *
 * This is the file the spec's central architectural rule protects: the LLM must
 * not calculate calories or macros. Every target the user ever sees originates
 * here, from an equation with a name and a version, and is then clamped by policy
 * before it goes anywhere near a meal plan.
 *
 * All outputs are estimates. Nothing here is a measurement, and the UI is
 * required to say so.
 */

export const ENERGY_EQUATION_VERSION = 1;

/**
 * Activity multipliers applied to BMR to estimate maintenance.
 *
 * Deliberately conservative at the top end. Published multipliers run to 1.9,
 * but self-reported activity skews high, and overestimating maintenance means
 * setting a "deficit" that is really maintenance — which reads to the user as
 * the plan not working.
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.85,
};

/** Energy in ~7,700 kcal per kg of body mass. A textbook approximation, not a law. */
export const KCAL_PER_KG_BODYWEIGHT = 7700;

/**
 * Mifflin-St Jeor. The spec's suggested development starting point for adults
 * (§30), and swappable — the equation name and version travel with every result
 * so a later change does not silently rewrite history.
 */
export function mifflinStJeor(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  ageYears: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

/**
 * Katch-McArdle. More accurate where body-fat percentage is genuinely known,
 * so it is used only when the user supplied one rather than guessed.
 */
export function katchMcArdle(weightKg: number, bodyFatPercent: number): number {
  const leanMass = weightKg * (1 - bodyFatPercent / 100);
  return Math.round(370 + 21.6 * leanMass);
}

export function calculateBMR(profile: NutritionProfile): {
  bmr: number;
  equation: EnergyCalculation['equation'];
} {
  if (profile.bodyFatPercent != null && profile.bodyFatPercent > 0) {
    return {
      bmr: katchMcArdle(profile.currentWeightKg, profile.bodyFatPercent),
      equation: 'katch_mcardle',
    };
  }
  return {
    bmr: mifflinStJeor(
      profile.sex,
      profile.currentWeightKg,
      profile.heightCm,
      profile.ageYears,
    ),
    equation: 'mifflin_st_jeor',
  };
}

export function calculateMaintenance(profile: NutritionProfile): number {
  const { bmr } = calculateBMR(profile);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
}

/**
 * Assess a requested timeframe against policy (spec §31).
 *
 * Nothing is rejected outright here — the assessment reports what was asked for
 * and what is supported, so the UI can show both and offer the earliest supported
 * date rather than a bare refusal.
 */
export function assessTimeframe(
  profile: NutritionProfile,
  policy: NutritionSafetyPolicy = DEFAULT_NUTRITION_POLICY,
): TimeframeAssessment {
  const current = profile.currentWeightKg;
  const target = profile.targetWeightKg ?? current;
  const totalChangeKg = target - current;
  const losing = totalChangeKg < 0;

  const maxRatePercent = losing
    ? policy.maxWeightLossRatePercentPerWeek
    : policy.maxWeightGainRatePercentPerWeek;
  const supportedWeeklyRateKg = current * maxRatePercent;

  const absChange = Math.abs(totalChangeKg);
  const earliestSupportedWeeks =
    absChange === 0 ? 0 : Math.ceil(absChange / supportedWeeklyRateKg);

  const requestedWeeks = profile.requestedTimeframeWeeks;
  const requestedWeeklyRateKg =
    requestedWeeks && requestedWeeks > 0 ? absChange / requestedWeeks : 0;

  const withinPolicy =
    absChange === 0 ||
    requestedWeeks == null ||
    requestedWeeklyRateKg <= supportedWeeklyRateKg + 1e-9;

  return {
    requestedWeeks,
    earliestSupportedWeeks,
    totalChangeKg,
    requestedWeeklyRateKg: round(requestedWeeklyRateKg, 3),
    supportedWeeklyRateKg: round(supportedWeeklyRateKg, 3),
    withinPolicy,
  };
}

/**
 * Protein first, fat second, carbohydrate takes the remainder.
 *
 * That order is deliberate. Protein and fat both have floors that matter — one
 * protects lean mass in a deficit, the other is an essential-intake guard — while
 * carbohydrate is the flexible fuel that absorbs whatever is left. Filling carbs
 * first would let a low-calorie plan squeeze protein below its floor.
 */
export function calculateMacros(
  calories: number,
  profile: NutritionProfile,
  policy: NutritionSafetyPolicy = DEFAULT_NUTRITION_POLICY,
): MacroTargets {
  const weight = profile.currentWeightKg;

  // Higher protein in a deficit; the target still respects the policy ceiling.
  const proteinPerKg =
    profile.goal === 'lose_body_fat'
      ? 2.2
      : profile.goal === 'build_muscle'
        ? 1.9
        : 1.8;

  const proteinG = Math.round(
    weight * clamp(proteinPerKg, policy.minProteinGPerKg, policy.maxProteinGPerKg),
  );

  const fatPerKg = profile.goal === 'lose_body_fat' ? 0.8 : 0.9;
  const fatG = Math.round(weight * Math.max(policy.minFatGPerKg, fatPerKg));

  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  const remaining = calories - proteinKcal - fatKcal;

  // A very low target can leave no room for carbohydrate once the floors are met.
  // Trim fat toward its floor rather than cutting protein, which is protected.
  if (remaining < 0) {
    const minFatG = Math.round(weight * policy.minFatGPerKg);
    const adjustedRemaining = calories - proteinKcal - minFatG * 9;
    return {
      calories,
      proteinG,
      fatG: minFatG,
      carbsG: Math.max(0, Math.round(adjustedRemaining / 4)),
      fibreG: recommendedFibre(calories),
    };
  }

  return {
    calories,
    proteinG,
    fatG,
    carbsG: Math.round(remaining / 4),
    fibreG: recommendedFibre(calories),
  };
}

/** Roughly 14 g per 1,000 kcal, a commonly cited general guideline. Capped at 50 g. */
export function recommendedFibre(calories: number): number {
  return Math.min(50, Math.round((calories / 1000) * 14));
}

/**
 * The full deterministic pipeline: profile in, approved targets out.
 *
 * The caller is expected to have run `checkEligibility` first. This function
 * still clamps against policy — defence in depth, so a missed gate upstream
 * cannot produce an unsupported target.
 */
export function calculateEnergyTargets(
  profile: NutritionProfile,
  policy: NutritionSafetyPolicy = DEFAULT_NUTRITION_POLICY,
): EnergyCalculation {
  const { bmr, equation } = calculateBMR(profile);
  const activityMultiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel];
  const maintenance = Math.round(bmr * activityMultiplier);

  const timeframe = assessTimeframe(profile, policy);

  // Rate is driven by the timeframe when one is supported, otherwise by the
  // policy maximum for the direction of travel.
  const weeklyRateKg = resolveWeeklyRate(profile, timeframe);
  const dailyAdjustment = Math.round((weeklyRateKg * KCAL_PER_KG_BODYWEIGHT) / 7);

  const proposed = maintenance + dailyAdjustment;
  const { calories: targetCalories } = clampCalories(proposed, maintenance, profile, policy);

  return {
    equation,
    equationVersion: ENERGY_EQUATION_VERSION,
    policyVersion: policy.version,
    bmr,
    activityMultiplier,
    maintenanceCalories: maintenance,
    calorieAdjustment: targetCalories - maintenance,
    targetCalories,
    macros: calculateMacros(targetCalories, profile, policy),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * The weekly rate this plan is actually built around. Signed; negative loses weight.
 *
 * Exported because the adjustment engine has to judge progress against the *same*
 * rate the target was derived from. Comparing a user who asked for a gentle
 * 0.5 kg/week against the policy maximum of 0.9 would read as "behind target"
 * when they are doing exactly what they signed up for.
 *
 * No policy argument: the ceiling is already baked into
 * `timeframe.supportedWeeklyRateKg` by `assessTimeframe`. Taking one here and
 * not applying it invited a caller to pass a stricter policy and quietly get
 * the rate for a different one.
 */
export function resolveWeeklyRate(
  profile: NutritionProfile,
  timeframe: TimeframeAssessment,
): number {
  if (profile.goal === 'maintain_recomp') return 0;
  if (timeframe.totalChangeKg === 0) return 0;

  const direction = timeframe.totalChangeKg < 0 ? -1 : 1;
  const maxRate = timeframe.supportedWeeklyRateKg;

  if (timeframe.requestedWeeks && timeframe.withinPolicy) {
    const requested = Math.abs(timeframe.totalChangeKg) / timeframe.requestedWeeks;
    return direction * Math.min(requested, maxRate);
  }

  // No timeframe given, or one outside policy: use the policy maximum. The UI is
  // responsible for telling the user their request was moved (spec §31, §51).
  return direction * maxRate;
}

/**
 * Project the calorie target for an arbitrary timeframe, for the goal-timeline
 * slider (spec §51). Returns null where the timeframe is not supported, so the
 * UI can mark the range rather than quietly showing a clamped number.
 */
export function projectTargetForTimeframe(
  profile: NutritionProfile,
  weeks: number,
  policy: NutritionSafetyPolicy = DEFAULT_NUTRITION_POLICY,
): { calories: number; supported: boolean; weeklyRateKg: number } | null {
  if (weeks <= 0) return null;

  const maintenance = calculateMaintenance(profile);
  const timeframe = assessTimeframe({ ...profile, requestedTimeframeWeeks: weeks }, policy);

  if (timeframe.totalChangeKg === 0) {
    return { calories: maintenance, supported: true, weeklyRateKg: 0 };
  }

  const direction = timeframe.totalChangeKg < 0 ? -1 : 1;
  const rate = Math.abs(timeframe.totalChangeKg) / weeks;
  const supported = rate <= timeframe.supportedWeeklyRateKg + 1e-9;

  const dailyAdjustment = Math.round((direction * rate * KCAL_PER_KG_BODYWEIGHT) / 7);
  const proposed = maintenance + dailyAdjustment;
  const clampedResult = clampCalories(proposed, maintenance, profile, policy);

  return {
    calories: supported ? Math.round(proposed) : clampedResult.calories,
    supported,
    weeklyRateKg: round(direction * rate, 3),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}
