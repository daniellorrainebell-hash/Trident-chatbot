import { makeNutritionProfile } from '../__fixtures__/builders';
import { DEFAULT_NUTRITION_POLICY, energyFloor } from './safetyPolicy';
import {
  ACTIVITY_MULTIPLIERS,
  assessTimeframe,
  calculateBMR,
  calculateEnergyTargets,
  calculateMacros,
  calculateMaintenance,
  katchMcArdle,
  mifflinStJeor,
  projectTargetForTimeframe,
} from './energy';

describe('mifflinStJeor', () => {
  it('matches the published formula for men', () => {
    // 10*90 + 6.25*180 - 5*30 + 5 = 1880
    expect(mifflinStJeor('male', 90, 180, 30)).toBe(1880);
  });

  it('matches the published formula for women', () => {
    // 10*65 + 6.25*165 - 5*30 - 161 = 1370.25 -> 1370
    expect(mifflinStJeor('female', 65, 165, 30)).toBe(1370);
  });
});

describe('katchMcArdle', () => {
  it('works from lean mass', () => {
    // lean = 90 * 0.8 = 72; 370 + 21.6*72 = 1925.2 -> 1925
    expect(katchMcArdle(90, 20)).toBe(1925);
  });
});

describe('calculateBMR', () => {
  it('uses Mifflin-St Jeor when body fat is unknown', () => {
    expect(calculateBMR(makeNutritionProfile()).equation).toBe('mifflin_st_jeor');
  });

  it('prefers Katch-McArdle when a real body-fat figure exists', () => {
    const result = calculateBMR(makeNutritionProfile({ bodyFatPercent: 18 }));
    expect(result.equation).toBe('katch_mcardle');
  });
});

describe('calculateMaintenance', () => {
  it('applies the activity multiplier to BMR', () => {
    const profile = makeNutritionProfile();
    const expected = Math.round(1880 * ACTIVITY_MULTIPLIERS.moderately_active);
    expect(calculateMaintenance(profile)).toBe(expected);
  });
});

describe('assessTimeframe', () => {
  it('accepts a request inside the supported rate', () => {
    // 8 kg over 16 weeks = 0.5 kg/wk; cap for 90 kg is 0.9 kg/wk.
    const assessment = assessTimeframe(makeNutritionProfile());
    expect(assessment.withinPolicy).toBe(true);
    expect(assessment.requestedWeeklyRateKg).toBeCloseTo(0.5);
    expect(assessment.supportedWeeklyRateKg).toBeCloseTo(0.9);
  });

  it('rejects a crash timeframe and reports the earliest supported one', () => {
    // The spec's worked example: 100 kg -> 90 kg in 12 weeks.
    const profile = makeNutritionProfile({
      currentWeightKg: 100,
      targetWeightKg: 90,
      requestedTimeframeWeeks: 4,
    });

    const assessment = assessTimeframe(profile);
    expect(assessment.withinPolicy).toBe(false);
    expect(assessment.requestedWeeklyRateKg).toBeCloseTo(2.5);
    expect(assessment.earliestSupportedWeeks).toBe(10);
  });

  it('applies a stricter cap to weight gain than to loss', () => {
    const gaining = assessTimeframe(
      makeNutritionProfile({ goal: 'build_muscle', currentWeightKg: 80, targetWeightKg: 88 }),
    );
    expect(gaining.supportedWeeklyRateKg).toBeCloseTo(0.4);
  });

  it('reports no change needed at maintenance', () => {
    const assessment = assessTimeframe(
      makeNutritionProfile({ goal: 'maintain_recomp', targetWeightKg: 90 }),
    );
    expect(assessment.totalChangeKg).toBe(0);
    expect(assessment.earliestSupportedWeeks).toBe(0);
  });
});

describe('calculateMacros', () => {
  const profile = makeNutritionProfile();

  it('sets protein and fat from bodyweight and gives carbs the remainder', () => {
    const macros = calculateMacros(2400, profile);
    expect(macros.proteinG).toBe(198); // 90 kg x 2.2
    expect(macros.fatG).toBe(72); // 90 kg x 0.8

    const kcal = macros.proteinG * 4 + macros.carbsG * 4 + macros.fatG * 9;
    expect(Math.abs(kcal - 2400)).toBeLessThanOrEqual(4);
  });

  it('never exceeds the policy protein ceiling', () => {
    const macros = calculateMacros(3000, makeNutritionProfile({ currentWeightKg: 120 }));
    const perKg = macros.proteinG / 120;
    expect(perKg).toBeLessThanOrEqual(DEFAULT_NUTRITION_POLICY.maxProteinGPerKg);
  });

  it('protects protein and trims fat when calories are tight', () => {
    const small = makeNutritionProfile({ currentWeightKg: 60 });
    const macros = calculateMacros(1200, small);

    expect(macros.proteinG).toBe(132); // protein held at 2.2 g/kg
    expect(macros.fatG).toBeGreaterThanOrEqual(60 * DEFAULT_NUTRITION_POLICY.minFatGPerKg);
    expect(macros.carbsG).toBeGreaterThanOrEqual(0);
  });

  it('recommends fibre proportional to intake, capped', () => {
    expect(calculateMacros(2000, profile).fibreG).toBe(28);
    expect(calculateMacros(5000, profile).fibreG).toBe(50);
  });
});

describe('calculateEnergyTargets', () => {
  it('produces a deficit for a fat-loss goal', () => {
    const result = calculateEnergyTargets(makeNutritionProfile());
    expect(result.calorieAdjustment).toBeLessThan(0);
    expect(result.targetCalories).toBeLessThan(result.maintenanceCalories);
  });

  it('produces a surplus for a muscle-gain goal', () => {
    const result = calculateEnergyTargets(
      makeNutritionProfile({
        goal: 'build_muscle',
        currentWeightKg: 80,
        targetWeightKg: 86,
        requestedTimeframeWeeks: 20,
      }),
    );
    expect(result.calorieAdjustment).toBeGreaterThan(0);
  });

  it('lands on maintenance for a recomp goal', () => {
    const result = calculateEnergyTargets(
      makeNutritionProfile({ goal: 'maintain_recomp', targetWeightKg: 90 }),
    );
    expect(result.targetCalories).toBe(result.maintenanceCalories);
    expect(result.calorieAdjustment).toBe(0);
  });

  it('never cuts more than 500 below maintenance, however aggressive the request', () => {
    const profile = makeNutritionProfile({
      currentWeightKg: 100,
      targetWeightKg: 90,
      requestedTimeframeWeeks: 4,
    });
    const result = calculateEnergyTargets(profile);

    const deficit = result.maintenanceCalories - result.targetCalories;
    expect(deficit).toBeLessThanOrEqual(DEFAULT_NUTRITION_POLICY.maxDeficitKcal);
  });

  it('never returns a target below the floor', () => {
    const profile = makeNutritionProfile({
      sex: 'female',
      currentWeightKg: 50,
      heightCm: 155,
      ageYears: 45,
      activityLevel: 'sedentary',
      targetWeightKg: 44,
      requestedTimeframeWeeks: 6,
    });

    const result = calculateEnergyTargets(profile);
    expect(result.targetCalories).toBeGreaterThanOrEqual(energyFloor(result.maintenanceCalories));
  });

  it('records the equation and policy version behind every target', () => {
    const result = calculateEnergyTargets(makeNutritionProfile());
    expect(result.equation).toBe('mifflin_st_jeor');
    expect(result.equationVersion).toBe(1);
    expect(result.policyVersion).toBe(DEFAULT_NUTRITION_POLICY.version);
  });

  it('is deterministic for identical input', () => {
    const profile = makeNutritionProfile();
    const a = calculateEnergyTargets(profile);
    const b = calculateEnergyTargets(profile);

    expect(a.targetCalories).toBe(b.targetCalories);
    expect(a.macros).toEqual(b.macros);
  });
});

describe('projectTargetForTimeframe', () => {
  const profile = makeNutritionProfile({ currentWeightKg: 100, targetWeightKg: 90 });

  it('marks an achievable timeframe as supported', () => {
    const result = projectTargetForTimeframe(profile, 16);
    expect(result?.supported).toBe(true);
  });

  it('marks a too-short timeframe as unsupported rather than quietly clamping', () => {
    const result = projectTargetForTimeframe(profile, 5);
    expect(result?.supported).toBe(false);
  });

  it('allows more calories as the timeframe lengthens', () => {
    const fast = projectTargetForTimeframe(profile, 10);
    const slow = projectTargetForTimeframe(profile, 20);
    expect(slow!.calories).toBeGreaterThan(fast!.calories);
  });

  it('rejects a nonsense timeframe', () => {
    expect(projectTargetForTimeframe(profile, 0)).toBeNull();
  });
});
