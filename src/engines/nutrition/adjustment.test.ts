import { makeCheckIn, makeNutritionProfile } from '../__fixtures__/builders';
import { calculateEnergyTargets } from './energy';
import { DEFAULT_NUTRITION_POLICY } from './safetyPolicy';
import { analyseTrend, explainNoAdjustment, suggestAdjustment, weeklyTrendKg } from './adjustment';

/**
 * A gentle goal, deliberately. The default fixture asks for a rate that lands
 * exactly on the 500 cap, and a target already at the cap can never be cut
 * further — which is the point of the cap, but makes it useless for testing
 * the adjustment logic itself.
 */
const profile = makeNutritionProfile({ targetWeightKg: 85, requestedTimeframeWeeks: 20 });
const current = calculateEnergyTargets(profile);
const makeId = () => 'suggestion-1';

/** Weekly check-ins with a given starting weight and per-week change. */
function checkIns(count: number, startWeight: number, weeklyDelta: number, adherence = 92) {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date('2026-03-02T00:00:00.000Z');
    date.setUTCDate(date.getUTCDate() + i * 7);
    return makeCheckIn({
      weekStarting: date.toISOString().slice(0, 10),
      weightKg: startWeight + weeklyDelta * i,
      planAdherence: adherence,
    });
  });
}

describe('weeklyTrendKg', () => {
  it('returns the per-week slope', () => {
    expect(weeklyTrendKg(checkIns(4, 90, -0.5))).toBeCloseTo(-0.5);
  });

  it('is not thrown off by a single bad weigh-in', () => {
    const data = checkIns(6, 90, -0.5);
    data[3]!.weightKg += 1.5; // one heavy morning

    // First-vs-last would swing hard; a regression barely moves.
    expect(weeklyTrendKg(data)).toBeGreaterThan(-0.55);
    expect(weeklyTrendKg(data)).toBeLessThan(-0.25);
  });

  it('returns zero without enough data to form a trend', () => {
    expect(weeklyTrendKg([])).toBe(0);
    expect(weeklyTrendKg(checkIns(1, 90, -0.5))).toBe(0);
  });
});

describe('analyseTrend', () => {
  it('reports insufficient data below the policy minimum', () => {
    const trend = analyseTrend(profile, checkIns(2, 90, -0.5));
    expect(trend.sufficientData).toBe(false);
  });

  it('reports insufficient adherence when the plan was not followed', () => {
    const trend = analyseTrend(profile, checkIns(4, 90, -0.1, 55));
    expect(trend.sufficientAdherence).toBe(false);
  });

  it('measures deviation against the target rate', () => {
    const trend = analyseTrend(profile, checkIns(4, 90, -0.1));
    expect(trend.observedWeeklyRateKg).toBeCloseTo(-0.1);
    expect(trend.deviation).toBeGreaterThan(0);
  });
});

describe('suggestAdjustment', () => {
  it('holds off until enough weeks have been observed', () => {
    const suggestion = suggestAdjustment({
      profile, current, checkIns: checkIns(2, 90, -0.05), makeId,
    });
    expect(suggestion).toBeNull();
  });

  it('does not cut calories when the plan simply was not followed', () => {
    const suggestion = suggestAdjustment({
      profile, current, checkIns: checkIns(5, 90, -0.02, 55), makeId,
    });
    expect(suggestion).toBeNull();
  });

  it('leaves a plan alone while it is tracking to its own planned rate', () => {
    // This profile asks for 3.4 kg over 20 weeks — about 0.17 kg/week — and
    // that planned rate, not the policy ceiling, is what progress is judged
    // against. Someone doing exactly what they signed up for is not "behind".
    const onTarget = checkIns(5, 88.4, -0.17);
    expect(suggestAdjustment({ profile, current, checkIns: onTarget, makeId })).toBeNull();
  });

  it('says why it cannot help when the target is already at the cap', () => {
    const atCap = makeNutritionProfile({ targetWeightKg: 78, requestedTimeframeWeeks: 10 });
    const capped = calculateEnergyTargets(atCap);

    // 500 below maintenance already: the honest answer is that there is no
    // deeper cut on offer, not silence.
    expect(capped.maintenanceCalories - capped.targetCalories).toBe(500);

    const stalled = checkIns(6, 90, -0.01);
    expect(suggestAdjustment({ profile: atCap, current: capped, checkIns: stalled, makeId })).toBeNull();

    const message = explainNoAdjustment(
      analyseTrend(atCap, stalled),
      undefined,
      { targetCalories: capped.targetCalories, maintenanceCalories: capped.maintenanceCalories },
    );
    expect(message).toMatch(/500 calories below maintenance/);
    expect(message).toMatch(/not fewer calories/);
  });

  it('suggests a reduction when loss has stalled despite good adherence', () => {
    const suggestion = suggestAdjustment({
      profile, current, checkIns: checkIns(5, 90, -0.02), makeId,
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion!.suggestedCalories).toBeLessThan(suggestion!.currentCalories);
    expect(suggestion!.status).toBe('pending');
  });

  it('caps any single change to the policy limit', () => {
    const suggestion = suggestAdjustment({
      profile, current, checkIns: checkIns(6, 90, 0.4), makeId,
    });

    const change = Math.abs(suggestion!.suggestedCalories - suggestion!.currentCalories);
    const cap = current.targetCalories * DEFAULT_NUTRITION_POLICY.maxSingleAdjustmentPercent;
    expect(change).toBeLessThanOrEqual(Math.ceil(cap) + 20);
  });

  it('moves by a round step, unless the safety band cuts it shorter first', () => {
    const suggestion = suggestAdjustment({
      profile, current, checkIns: checkIns(5, 90, -0.02), makeId,
    });

    const delta = suggestion!.suggestedCalories - suggestion!.currentCalories;
    const deficitFloor =
      current.maintenanceCalories - DEFAULT_NUTRITION_POLICY.maxDeficitKcal;

    // Steps are rounded to 20 kcal so the change reads as a decision, not a
    // calculation. The clamp takes precedence: landing exactly on the policy
    // boundary is the correct outcome even though it is not a round number.
    const isRoundStep = delta % 20 === 0;
    const isOnPolicyBoundary = suggestion!.suggestedCalories === deficitFloor;
    expect(isRoundStep || isOnPolicyBoundary).toBe(true);
  });

  it('explains itself using the user\'s own numbers', () => {
    const suggestion = suggestAdjustment({
      profile, current, checkIns: checkIns(5, 90, -0.02), makeId,
    });
    expect(suggestion!.reason).toMatch(/5-week/);
    expect(suggestion!.reason).toMatch(/adherence/);
  });

  it('recomputes macros for the new target rather than reusing the old ones', () => {
    const suggestion = suggestAdjustment({
      profile, current, checkIns: checkIns(5, 90, -0.02), makeId,
    });
    expect(suggestion!.suggestedMacros.calories).toBe(suggestion!.suggestedCalories);
  });

  it('never adjusts a maintenance plan', () => {
    const maintain = makeNutritionProfile({ goal: 'maintain_recomp', targetWeightKg: 90 });
    const suggestion = suggestAdjustment({
      profile: maintain,
      current: calculateEnergyTargets(maintain),
      checkIns: checkIns(6, 90, 0.3),
      makeId,
    });
    expect(suggestion).toBeNull();
  });

  it('respects the safety band even when the trend argues for a bigger cut', () => {
    const suggestion = suggestAdjustment({
      profile, current, checkIns: checkIns(8, 90, 0.3), makeId,
    });

    if (suggestion) {
      const deficit = current.maintenanceCalories - suggestion.suggestedCalories;
      expect(deficit).toBeLessThanOrEqual(DEFAULT_NUTRITION_POLICY.maxDeficitKcal);
    }
  });
});

describe('explainNoAdjustment', () => {
  it('says how many more check-ins are needed', () => {
    const trend = analyseTrend(profile, checkIns(1, 90, -0.5));
    expect(explainNoAdjustment(trend)).toMatch(/2 more weekly check-ins/);
  });

  it('points at adherence when that is the blocker', () => {
    const trend = analyseTrend(profile, checkIns(4, 90, -0.05, 50));
    expect(explainNoAdjustment(trend)).toMatch(/adherence/i);
  });
});
