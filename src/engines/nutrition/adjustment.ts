import type {
  AdjustmentSuggestion,
  EnergyCalculation,
  NutritionProfile,
  WeeklyCheckIn,
} from '@/types';
import { DEFAULT_NUTRITION_POLICY, NutritionSafetyPolicy, clampCalories } from './safetyPolicy';
import {
  KCAL_PER_KG_BODYWEIGHT,
  assessTimeframe,
  calculateMacros,
  resolveWeeklyRate,
} from './energy';

/**
 * Controlled calorie adjustment (spec §50).
 *
 * The governing instruction is "do not change calories constantly". Three gates
 * have to open before a suggestion is even produced:
 *
 *   1. Enough weeks of check-in data to see a trend rather than water weight.
 *   2. Adherence high enough that the plan was actually followed — if someone hit
 *      60% of their plan, the calories are not the problem and cutting them again
 *      is the wrong response.
 *   3. A trend that meaningfully misses the target rate.
 *
 * And the change is capped and always requires explicit approval. Nothing here
 * writes a target; it returns a proposal.
 */

/** Weight trend must miss target by this share before anything is suggested. */
export const TREND_DEVIATION_THRESHOLD = 0.4;

export type TrendAnalysis = {
  weeksObserved: number;
  /** Signed. Negative means losing. */
  observedWeeklyRateKg: number;
  targetWeeklyRateKg: number;
  averageAdherence: number;
  /** How far off the target rate, as a share of target. */
  deviation: number;
  sufficientData: boolean;
  sufficientAdherence: boolean;
};

/**
 * Least-squares slope over the check-in weights, rather than first-vs-last.
 * A single bad weigh-in — a heavy meal, a bad night's sleep — should not swing
 * a fortnight's conclusion, and a regression over every point is far less
 * sensitive to one outlier (spec §49: prefer trend over a single weigh-in).
 */
export function weeklyTrendKg(checkIns: WeeklyCheckIn[]): number {
  if (checkIns.length < 2) return 0;

  const sorted = [...checkIns].sort((a, b) => a.weekStarting.localeCompare(b.weekStarting));
  const n = sorted.length;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  sorted.forEach((checkIn, index) => {
    sumX += index;
    sumY += checkIn.weightKg;
    sumXY += index * checkIn.weightKg;
    sumXX += index * index;
  });

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;

  // Slope is per index step, and one step is one week.
  return (n * sumXY - sumX * sumY) / denominator;
}

export function analyseTrend(
  profile: NutritionProfile,
  checkIns: WeeklyCheckIn[],
  policy: NutritionSafetyPolicy = DEFAULT_NUTRITION_POLICY,
): TrendAnalysis {
  const observed = weeklyTrendKg(checkIns);
  const timeframe = assessTimeframe(profile, policy);

  // The rate the plan was actually built around, not the policy ceiling.
  const targetRate = resolveWeeklyRate(profile, timeframe);

  const averageAdherence =
    checkIns.length === 0
      ? 0
      : checkIns.reduce((sum, c) => sum + c.planAdherence, 0) / checkIns.length;

  const deviation =
    targetRate === 0 ? 0 : Math.abs(observed - targetRate) / Math.abs(targetRate);

  return {
    weeksObserved: checkIns.length,
    observedWeeklyRateKg: round(observed, 3),
    targetWeeklyRateKg: round(targetRate, 3),
    averageAdherence: Math.round(averageAdherence),
    deviation: round(deviation, 3),
    sufficientData: checkIns.length >= policy.minWeeksBeforeAdjustment,
    sufficientAdherence: averageAdherence >= policy.minAdherencePercentForAdjustment,
  };
}

export type AdjustmentContext = {
  profile: NutritionProfile;
  current: EnergyCalculation;
  checkIns: WeeklyCheckIn[];
  makeId: () => string;
};

/**
 * Produce an adjustment suggestion, or null where the gates are not met.
 *
 * Returning null is the common and correct outcome. A planner that suggests a
 * change every week is a planner nobody can follow.
 */
export function suggestAdjustment(
  context: AdjustmentContext,
  policy: NutritionSafetyPolicy = DEFAULT_NUTRITION_POLICY,
): AdjustmentSuggestion | null {
  const { profile, current, checkIns } = context;
  const trend = analyseTrend(profile, checkIns, policy);

  if (!trend.sufficientData) return null;
  if (!trend.sufficientAdherence) return null;
  if (profile.goal === 'maintain_recomp') return null;
  if (trend.deviation < TREND_DEVIATION_THRESHOLD) return null;

  // Convert the shortfall in weekly rate into a daily calorie delta.
  const rateGap = trend.targetWeeklyRateKg - trend.observedWeeklyRateKg;
  const rawDailyDelta = (rateGap * KCAL_PER_KG_BODYWEIGHT) / 7;

  // Cap the size of any single change. Small, infrequent moves beat big swings.
  const maxDelta = current.targetCalories * policy.maxSingleAdjustmentPercent;
  const dailyDelta = Math.round(
    Math.sign(rawDailyDelta) * Math.min(Math.abs(rawDailyDelta), maxDelta),
  );

  // Round to something a person can act on rather than a precise-looking number.
  const rounded = Math.round(dailyDelta / 20) * 20;
  if (rounded === 0) return null;

  const proposed = current.targetCalories + rounded;
  const { calories: suggestedCalories } = clampCalories(
    proposed,
    current.maintenanceCalories,
    profile,
    policy,
  );

  // Already at the cap. The honest answer is that the app will not cut deeper,
  // not a silent no-op — `explainNoAdjustment` says so.
  if (suggestedCalories === current.targetCalories) return null;

  return {
    id: context.makeId(),
    userId: profile.userId,
    currentCalories: current.targetCalories,
    suggestedCalories,
    currentMacros: current.macros,
    suggestedMacros: calculateMacros(suggestedCalories, profile, policy),
    reason: buildReason(trend, profile),
    weeksObserved: trend.weeksObserved,
    observedWeeklyRateKg: trend.observedWeeklyRateKg,
    targetWeeklyRateKg: trend.targetWeeklyRateKg,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
}

/** Explains the change in terms of the user's own data — no vague "optimisation". */
function buildReason(trend: TrendAnalysis, profile: NutritionProfile): string {
  const weeks = `${trend.weeksObserved}-week`;
  const adherence = `${trend.averageAdherence}% reported adherence`;

  if (profile.goal === 'lose_body_fat') {
    const slower = Math.abs(trend.observedWeeklyRateKg) < Math.abs(trend.targetWeeklyRateKg);
    return slower
      ? `Your ${weeks} trend is behind your target rate of loss. Based on ${adherence}, a small reduction is suggested.`
      : `Your ${weeks} trend is ahead of your target rate of loss. Based on ${adherence}, a small increase is suggested to bring it back into range.`;
  }

  const slower = Math.abs(trend.observedWeeklyRateKg) < Math.abs(trend.targetWeeklyRateKg);
  return slower
    ? `Your ${weeks} trend is behind your target rate of gain. Based on ${adherence}, a small increase is suggested.`
    : `Your ${weeks} trend is ahead of your target rate of gain. Based on ${adherence}, a small reduction is suggested.`;
}

/** Why no suggestion was made, so the check-in screen can say something useful. */
export function explainNoAdjustment(
  trend: TrendAnalysis,
  policy: NutritionSafetyPolicy = DEFAULT_NUTRITION_POLICY,
  context?: { targetCalories: number; maintenanceCalories: number },
): string {
  if (!trend.sufficientData) {
    const needed = policy.minWeeksBeforeAdjustment - trend.weeksObserved;
    return `${needed} more weekly check-in${needed === 1 ? '' : 's'} needed before The Kennel will suggest a change.`;
  }
  if (!trend.sufficientAdherence) {
    return `Reported adherence is ${trend.averageAdherence}%. The Kennel does not adjust targets until the current plan has been followed consistently.`;
  }

  // Being at the cap is the one case where the app has a reason and no lever.
  // Saying nothing would read as the feature being broken.
  if (context && atDeficitCap(context.targetCalories, context.maintenanceCalories, policy)) {
    return 'You are already 500 calories below maintenance, which is as deep as The Kennel cuts. If the trend has stalled, more time or more activity is the way forward — not fewer calories.';
  }

  return 'Your trend is tracking close enough to target. No change needed.';
}

/** True when a target already sits on the deficit cap. */
export function atDeficitCap(
  targetCalories: number,
  maintenanceCalories: number,
  policy: NutritionSafetyPolicy = DEFAULT_NUTRITION_POLICY,
): boolean {
  return maintenanceCalories - targetCalories >= policy.maxDeficitKcal;
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}
