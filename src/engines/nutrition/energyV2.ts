import type { MacroTargets, Sex } from '@/types';
import {
  ACTIVITY_POLICY_V1,
  KCAL_PER_KG_BODYWEIGHT,
  NUTRITION_SAFETY_POLICY_V1,
  PROTEIN_GRAMS_PER_KG,
  SURPLUS_BY_EXPERIENCE,
  buildMetadata,
  clamp,
  roundToNearest,
  type ActivityLevel,
  type NutritionCalculationMetadata,
  type NutritionGoal,
  type NutritionSafetyPolicy,
  type TrainingExperience,
} from './policy';
import { type NutritionSafetyDecision } from './safetyDecision';

/**
 * Deterministic energy and macro engine (Feed spec §7, §8, §9).
 *
 * This is the file the spec's central rule protects: an LLM never calculates a
 * calorie target, a macro target, a supported rate of change, or anything else
 * in here. Same inputs in, same numbers out, every time, with the equation and
 * policy versions recorded alongside so a figure can be re-derived months later.
 *
 * Everything it returns is an estimate. The UI is required to say so.
 */

export type EquationBasis = 'male' | 'female' | 'manual_target';

export type EnergyInput = {
  ageYears: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  requestedWeeks: number;
  /**
   * Mifflin-St Jeor uses different constants for male and female physiology.
   * This is asked for explicitly and stored apart from display gender — it is
   * never inferred from a name or an identity (spec §5).
   */
  equationBasis: EquationBasis;
  activityLevel: ActivityLevel;
  sessionsPerWeek: number;
  experience: TrainingExperience;
  goal: NutritionGoal;
};

export type EnergyResult = {
  bmrEstimate: number;
  maintenanceCalories: number;
  targetCalories: number;
  macros: MacroTargets;
  requestedRatePercentPerWeek: number;
  supportedRatePercentPerWeek: number;
  supportedWeeks: number;
  requestedWeeks: number;
  /** Signed. Negative for a deficit. */
  calorieAdjustment: number;
  /** The floor that applied, so the UI can explain a clamped result. */
  automationFloor: number;
  safetyDecision: NutritionSafetyDecision;
  metadata: NutritionCalculationMetadata;
};

/* ── Unit conversion ─────────────────────────────────────────────────────── */

export const lbToKg = (lb: number): number => lb * 0.45359237;
export const kgToLb = (kg: number): number => kg / 0.45359237;
export const inchesToCm = (inches: number): number => inches * 2.54;
export const cmToInches = (cm: number): number => cm / 2.54;

/* ── Resting energy ──────────────────────────────────────────────────────── */

/**
 * Mifflin-St Jeor. An estimate of resting energy expenditure, not a measured
 * metabolic rate.
 */
export function calculateBmr(input: {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  basis: Sex;
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
  return input.basis === 'male' ? base + 5 : base - 161;
}

export function maintenanceFrom(bmr: number, activityLevel: ActivityLevel): number {
  return roundToNearest(bmr * ACTIVITY_POLICY_V1[activityLevel], 10);
}

/* ── Timeframe ───────────────────────────────────────────────────────────── */

/**
 * The shortest timeframe the policy supports for a given weight change.
 *
 * When a request is shorter than this the engine does *not* quietly clamp the
 * calories and leave the original date on screen — it reports the supported
 * figure so the UI can offer it (spec §8.3).
 */
export function earliestSupportedWeeks(
  changeKg: number,
  currentWeightKg: number,
  maxRateFractionPerWeek: number,
): number {
  if (changeKg === 0) return 0;
  return Math.ceil(changeKg / (currentWeightKg * maxRateFractionPerWeek));
}

export function maxRateFractionFor(
  goal: NutritionGoal,
  policy: NutritionSafetyPolicy,
): number {
  return goal === 'BUILD_MUSCLE'
    ? policy.maxGainRateFractionPerWeek
    : policy.maxLossRateFractionPerWeek;
}

/* ── Macros ──────────────────────────────────────────────────────────────── */

/**
 * Protein reference weight (spec §9.1).
 *
 * During fat loss, scaling protein off a very high current bodyweight produces
 * an absurd target, so the reference is capped relative to the goal weight.
 * This is a product policy for keeping automated numbers sensible — not a
 * diagnostic formula, and it stays configurable.
 */
export function proteinReferenceWeightKg(input: {
  goal: NutritionGoal;
  currentWeightKg: number;
  targetWeightKg?: number;
}): number {
  if (input.goal !== 'LOSE_BODY_FAT' || !input.targetWeightKg) {
    return input.currentWeightKg;
  }
  return Math.min(input.currentWeightKg, input.targetWeightKg * 1.15);
}

export type MacroResult = MacroTargets & {
  /** True when fat had to be trimmed toward its floor to leave room for carbs. */
  fatReducedForCarbs: boolean;
  /** True when the target cannot be met without breaching the carb floor. */
  infeasible: boolean;
};

/**
 * Protein first, fat second, carbohydrate takes the remainder.
 *
 * That order is deliberate: protein and fat both have floors that matter — one
 * protects lean mass in a deficit, the other is an essential-intake guard —
 * while carbohydrate is the flexible fuel. Filling carbs first would let a low
 * target squeeze protein below its floor.
 */
export function calculateMacros(
  targetCalories: number,
  input: { goal: NutritionGoal; currentWeightKg: number; targetWeightKg?: number },
  policy: NutritionSafetyPolicy = NUTRITION_SAFETY_POLICY_V1,
): MacroResult {
  const referenceKg = proteinReferenceWeightKg(input);

  const proteinPerKg = clamp(
    PROTEIN_GRAMS_PER_KG[input.goal],
    policy.minProteinGPerKg,
    policy.maxProteinGPerKg,
  );
  const proteinGrams = Math.round(referenceKg * proteinPerKg);

  const fatMinimum = referenceKg * policy.minFatGPerKg;
  const fatMaximum = (targetCalories * policy.maxFatFraction) / 9;
  const fatFromPercent = (targetCalories * policy.fatStartFraction) / 9;
  let fatGrams = Math.round(clamp(Math.max(fatFromPercent, fatMinimum), fatMinimum, fatMaximum));

  let carbsGrams = Math.round((targetCalories - proteinGrams * 4 - fatGrams * 9) / 4);
  let fatReducedForCarbs = false;

  // Trim fat toward its floor rather than cutting protein, which is protected.
  if (carbsGrams < policy.minAutomatedCarbsGrams) {
    fatGrams = Math.round(fatMinimum);
    carbsGrams = Math.round((targetCalories - proteinGrams * 4 - fatGrams * 9) / 4);
    fatReducedForCarbs = true;
  }

  const infeasible = carbsGrams < policy.minAutomatedCarbsGrams;
  // Never return a negative macro, even when reporting infeasibility.
  carbsGrams = Math.max(0, carbsGrams);

  const reconciled = reconcileMacros(
    { calories: targetCalories, proteinG: proteinGrams, carbsG: carbsGrams, fatG: fatGrams, fibreG: recommendedFibre(targetCalories) },
  );

  return { ...reconciled, fatReducedForCarbs, infeasible };
}

/**
 * Rounding each macro to whole grams makes their energy total drift from the
 * displayed calorie target. Absorb the difference into carbohydrate, then let
 * the caller re-validate (spec §9.5).
 */
export function reconcileMacros(macros: MacroTargets): MacroTargets {
  const energy = macros.proteinG * 4 + macros.carbsG * 4 + macros.fatG * 9;
  const difference = macros.calories - energy;
  const carbsG = Math.max(0, macros.carbsG + Math.round(difference / 4));
  return { ...macros, carbsG };
}

export function macroCalories(macros: MacroTargets): number {
  return macros.proteinG * 4 + macros.carbsG * 4 + macros.fatG * 9;
}

/** Roughly 14 g per 1,000 kcal, a commonly cited general guideline. Capped. */
export function recommendedFibre(calories: number): number {
  return Math.min(50, Math.round((calories / 1000) * 14));
}

/* ── The pipeline ────────────────────────────────────────────────────────── */

/**
 * Profile in, approved targets out.
 *
 * Screening runs first and its decision travels with the result, so a caller
 * cannot accidentally use targets from a profile that should have been stopped.
 */
export function calculateTargets(
  input: EnergyInput,
  policy: NutritionSafetyPolicy = NUTRITION_SAFETY_POLICY_V1,
): EnergyResult {
  if (input.equationBasis === 'manual_target') {
    throw new Error(
      'manual_target has no equation. Use acceptManualTargets() with professionally prescribed figures.',
    );
  }

  const basis: Sex = input.equationBasis;
  const bmr = Math.round(
    calculateBmr({
      weightKg: input.currentWeightKg,
      heightCm: input.heightCm,
      ageYears: input.ageYears,
      basis,
    }),
  );
  const maintenance = maintenanceFrom(bmr, input.activityLevel);

  const changeKg = Math.abs(input.targetWeightKg - input.currentWeightKg);
  const maxRate = maxRateFractionFor(input.goal, policy);
  const supportedWeeks = earliestSupportedWeeks(changeKg, input.currentWeightKg, maxRate);

  const requestedRate =
    input.requestedWeeks > 0 ? changeKg / input.requestedWeeks / input.currentWeightKg : 0;

  // A request faster than policy is reported, not silently clamped.
  const timeframeUnsupported =
    input.goal !== 'MAINTAIN_RECOMP' && changeKg > 0 && input.requestedWeeks < supportedWeeks;

  const effectiveWeeks = timeframeUnsupported ? supportedWeeks : input.requestedWeeks;

  // The floor is simply maintenance minus the maximum deficit. One rule, and
  // it scales with the person rather than being a fixed number that is
  // generous for a small adult and tight for a large one.
  const automationFloor = maintenance - policy.maxDeficitKcal;

  let targetCalories: number;

  if (input.goal === 'MAINTAIN_RECOMP') {
    // Recomp starts at maintenance. Creating a deficit and calling it recomp
    // is exactly what the spec forbids (§8.6).
    targetCalories = maintenance;
  } else if (input.goal === 'BUILD_MUSCLE') {
    const surplusFraction = Math.min(
      SURPLUS_BY_EXPERIENCE[input.experience],
      policy.maxSurplusFraction,
    );
    // Round down for the same reason, so rounding cannot exceed the surplus cap.
    targetCalories = Math.floor((maintenance * (1 + surplusFraction)) / 10) * 10;
  } else {
    const fromTimeline =
      effectiveWeeks > 0 ? (changeKg * KCAL_PER_KG_BODYWEIGHT) / (effectiveWeeks * 7) : 0;

    // The cap is the whole safety story on a cut. Whatever the goal weight or
    // the requested date, the deficit stops here.
    const deficit = Math.min(fromTimeline, policy.maxDeficitKcal);

    // Round up, not to nearest. Rounding to nearest can shave calories off a
    // target already sitting on the cap and push the deficit past it.
    targetCalories = Math.ceil((maintenance - deficit) / 10) * 10;
  }

  // Belt and braces: nothing downstream can widen the deficit past the cap.
  const hitFloor = targetCalories < automationFloor;
  if (hitFloor) targetCalories = Math.ceil(automationFloor / 10) * 10;

  const macros = calculateMacros(targetCalories, input, policy);

  const safetyDecision = resolveDecision({
    input,
    policy,
    timeframeUnsupported,
    supportedWeeks,
    hitFloor,
  });

  return {
    bmrEstimate: bmr,
    maintenanceCalories: maintenance,
    targetCalories,
    macros,
    requestedRatePercentPerWeek: round(requestedRate * 100, 3),
    supportedRatePercentPerWeek: round(maxRate * 100, 3),
    supportedWeeks,
    requestedWeeks: input.requestedWeeks,
    calorieAdjustment: targetCalories - maintenance,
    automationFloor,
    safetyDecision,
    metadata: buildMetadata('MIFFLIN_ST_JEOR', policy),
  };
}

function resolveDecision(args: {
  input: EnergyInput;
  policy: NutritionSafetyPolicy;
  timeframeUnsupported: boolean;
  supportedWeeks: number;
  hitFloor: boolean;
}): NutritionSafetyDecision {
  const { input, policy, timeframeUnsupported, supportedWeeks, hitFloor } = args;

  // Hitting the floor means the requested pace is not achievable inside policy,
  // so it is reported as a timeframe problem the user can actually act on.
  if (hitFloor && input.goal === 'LOSE_BODY_FAT') {
    return {
      status: 'adjust_timeframe',
      supportedWeeks: Math.max(supportedWeeks, input.requestedWeeks + 1),
      requestedWeeks: input.requestedWeeks,
      policyVersion: policy.version,
    };
  }

  if (timeframeUnsupported) {
    return {
      status: 'adjust_timeframe',
      supportedWeeks,
      requestedWeeks: input.requestedWeeks,
      policyVersion: policy.version,
    };
  }

  return { status: 'approved', policyVersion: policy.version };
}

/**
 * Accept targets prescribed by a professional, for users where no equation is
 * appropriate. Still bounded by the automation floor — the app will store a
 * prescribed figure but will not itself generate meals below what it considers
 * safe to produce automatically.
 */
export function acceptManualTargets(
  input: { calories: number; proteinG: number; carbsG: number; fatG: number; basis: Sex; maintenanceCalories?: number },
  policy: NutritionSafetyPolicy = NUTRITION_SAFETY_POLICY_V1,
): { macros: MacroTargets; belowAutomationFloor: boolean; metadata: NutritionCalculationMetadata } {
  // Manual targets are stored as given; the flag simply tells the UI when a
  // prescribed figure sits below what the app would generate on its own.
  const floor = input.maintenanceCalories
    ? input.maintenanceCalories - policy.maxDeficitKcal
    : 0;

  return {
    macros: reconcileMacros({
      calories: input.calories,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      fibreG: recommendedFibre(input.calories),
    }),
    belowAutomationFloor: input.calories < floor,
    metadata: buildMetadata('MIFFLIN_ST_JEOR', policy),
  };
}

/**
 * Project a target for an arbitrary timeframe, for the goal-timeline control.
 * Returns `supported: false` rather than a clamped number pretending to be the
 * answer, so the UI can mark the range instead of quietly lying (spec §8.3).
 */
export function projectForTimeframe(
  input: EnergyInput,
  weeks: number,
  policy: NutritionSafetyPolicy = NUTRITION_SAFETY_POLICY_V1,
): { calories: number; supported: boolean; ratePercentPerWeek: number } | null {
  if (weeks <= 0) return null;

  const basis: Sex = input.equationBasis === 'manual_target' ? 'male' : input.equationBasis;
  const bmr = calculateBmr({
    weightKg: input.currentWeightKg,
    heightCm: input.heightCm,
    ageYears: input.ageYears,
    basis,
  });
  const maintenance = maintenanceFrom(bmr, input.activityLevel);
  const changeKg = Math.abs(input.targetWeightKg - input.currentWeightKg);

  if (changeKg === 0) {
    return { calories: maintenance, supported: true, ratePercentPerWeek: 0 };
  }

  const rate = changeKg / weeks / input.currentWeightKg;
  const supported = rate <= maxRateFractionFor(input.goal, policy) + 1e-9;
  const direction = input.targetWeightKg < input.currentWeightKg ? -1 : 1;

  const daily = (direction * (changeKg / weeks) * KCAL_PER_KG_BODYWEIGHT) / 7;
  const floor = maintenance - policy.maxDeficitKcal;

  return {
    calories: Math.max(floor, roundToNearest(maintenance + daily, 10)),
    supported,
    ratePercentPerWeek: round(rate * 100, 3),
  };
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}
