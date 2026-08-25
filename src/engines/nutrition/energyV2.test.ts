import {
  ACTIVITY_POLICY_V1,
  NUTRITION_SAFETY_POLICY_V1,
  MEAL_DISTRIBUTIONS,
  SURPLUS_BY_EXPERIENCE,
} from './policy';
import {
  acceptManualTargets,
  calculateBmr,
  calculateMacros,
  calculateTargets,
  earliestSupportedWeeks,
  inchesToCm,
  kgToLb,
  lbToKg,
  macroCalories,
  maintenanceFrom,
  projectForTimeframe,
  proteinReferenceWeightKg,
  reconcileMacros,
  type EnergyInput,
} from './energyV2';

const policy = NUTRITION_SAFETY_POLICY_V1;

function input(overrides: Partial<EnergyInput> = {}): EnergyInput {
  return {
    ageYears: 35,
    heightCm: 180,
    currentWeightKg: 90,
    targetWeightKg: 82,
    requestedWeeks: 16,
    equationBasis: 'male',
    activityLevel: 'lightly_active',
    sessionsPerWeek: 4,
    experience: 'three_to_five_years',
    goal: 'LOSE_BODY_FAT',
    ...overrides,
  };
}

describe('unit conversion', () => {
  it('round-trips pounds and kilograms', () => {
    expect(lbToKg(220.462)).toBeCloseTo(100, 3);
    expect(kgToLb(100)).toBeCloseTo(220.462, 3);
  });

  it('converts inches to centimetres', () => {
    expect(inchesToCm(71)).toBeCloseTo(180.34, 2);
  });
});

describe('calculateBmr', () => {
  it('matches the worked example in the spec', () => {
    // 10x90 + 6.25x180 - 5x35 + 5 = 1,855
    expect(calculateBmr({ weightKg: 90, heightCm: 180, ageYears: 35, basis: 'male' })).toBe(1855);
  });

  it('applies the female constant', () => {
    // 10x65 + 6.25x165 - 5x30 - 161 = 1,370.25
    expect(calculateBmr({ weightKg: 65, heightCm: 165, ageYears: 30, basis: 'female' })).toBeCloseTo(1370.25, 2);
  });
});

describe('maintenanceFrom', () => {
  it('matches the spec worked example and rounds to 10', () => {
    // 1,855 x 1.48 = 2,745.4 -> 2,750
    expect(maintenanceFrom(1855, 'lightly_active')).toBe(2750);
  });

  it('uses the versioned activity policy', () => {
    expect(ACTIVITY_POLICY_V1.mostly_seated).toBe(1.35);
    expect(ACTIVITY_POLICY_V1.very_active).toBe(1.78);
  });

  it('does not count training twice', () => {
    // Sessions per week is not an input to the multiplier at all.
    const four = calculateTargets(input({ sessionsPerWeek: 4 }));
    const seven = calculateTargets(input({ sessionsPerWeek: 7 }));
    expect(seven.maintenanceCalories).toBe(four.maintenanceCalories);
  });
});

describe('earliestSupportedWeeks', () => {
  it('rounds up to a whole week', () => {
    // 8 kg from 90 kg at 1%/week -> 8 / 0.9 = 8.9 -> 9
    expect(earliestSupportedWeeks(8, 90, 0.01)).toBe(9);
  });

  it('returns zero when no change is needed', () => {
    expect(earliestSupportedWeeks(0, 90, 0.01)).toBe(0);
  });

  it('is stricter for gain than loss', () => {
    expect(earliestSupportedWeeks(6, 80, policy.maxGainRateFractionPerWeek)).toBe(15);
    expect(earliestSupportedWeeks(6, 80, policy.maxLossRateFractionPerWeek)).toBe(8);
  });
});

describe('proteinReferenceWeightKg', () => {
  it('uses current weight outside fat loss', () => {
    expect(proteinReferenceWeightKg({ goal: 'BUILD_MUSCLE', currentWeightKg: 90, targetWeightKg: 96 })).toBe(90);
  });

  it('caps the reference during fat loss so a high bodyweight cannot inflate protein', () => {
    // 80 x 1.15 = 92, well below 140
    expect(proteinReferenceWeightKg({ goal: 'LOSE_BODY_FAT', currentWeightKg: 140, targetWeightKg: 80 })).toBe(92);
  });

  it('never raises the reference above current weight', () => {
    expect(proteinReferenceWeightKg({ goal: 'LOSE_BODY_FAT', currentWeightKg: 85, targetWeightKg: 82 })).toBe(85);
  });
});

describe('calculateMacros', () => {
  const person = { goal: 'LOSE_BODY_FAT' as const, currentWeightKg: 90, targetWeightKg: 82 };

  it('sets protein from the reference weight and goal', () => {
    const macros = calculateMacros(2200, person);
    // reference = min(90, 82 x 1.15 = 94.3) = 90; 90 x 2.0 = 180
    expect(macros.proteinG).toBe(180);
  });

  it('starts fat near 25% of calories', () => {
    const macros = calculateMacros(2400, { goal: 'MAINTAIN_RECOMP', currentWeightKg: 80 });
    expect(macros.fatG).toBe(Math.round((2400 * 0.25) / 9));
  });

  it('enforces the fat floor', () => {
    const macros = calculateMacros(1600, { goal: 'LOSE_BODY_FAT', currentWeightKg: 100, targetWeightKg: 85 });
    const reference = proteinReferenceWeightKg({ goal: 'LOSE_BODY_FAT', currentWeightKg: 100, targetWeightKg: 85 });
    expect(macros.fatG).toBeGreaterThanOrEqual(Math.round(reference * policy.minFatGPerKg) - 1);
  });

  it('caps fat at the maximum fraction', () => {
    const macros = calculateMacros(2000, { goal: 'MAINTAIN_RECOMP', currentWeightKg: 130 });
    expect(macros.fatG).toBeLessThanOrEqual(Math.ceil((2000 * policy.maxFatFraction) / 9));
  });

  it('gives carbohydrate the remaining energy', () => {
    const macros = calculateMacros(2400, person);
    expect(Math.abs(macroCalories(macros) - 2400)).toBeLessThanOrEqual(4);
  });

  it('trims fat toward its floor rather than cutting protein when carbs run short', () => {
    const macros = calculateMacros(1500, { goal: 'LOSE_BODY_FAT', currentWeightKg: 95, targetWeightKg: 80 });
    const reference = proteinReferenceWeightKg({ goal: 'LOSE_BODY_FAT', currentWeightKg: 95, targetWeightKg: 80 });

    expect(macros.proteinG).toBe(Math.round(reference * 2.0));
    if (macros.fatReducedForCarbs) {
      expect(macros.fatG).toBeLessThanOrEqual(Math.round(reference * policy.minFatGPerKg) + 1);
    }
  });

  it('never returns a negative macro', () => {
    const macros = calculateMacros(900, { goal: 'LOSE_BODY_FAT', currentWeightKg: 120, targetWeightKg: 90 });
    expect(macros.carbsG).toBeGreaterThanOrEqual(0);
    expect(macros.fatG).toBeGreaterThanOrEqual(0);
    expect(macros.proteinG).toBeGreaterThanOrEqual(0);
  });

  it('flags an infeasible target rather than fabricating one', () => {
    const macros = calculateMacros(900, { goal: 'LOSE_BODY_FAT', currentWeightKg: 120, targetWeightKg: 90 });
    expect(macros.infeasible).toBe(true);
  });
});

describe('reconcileMacros', () => {
  it('absorbs rounding drift into carbohydrate', () => {
    const reconciled = reconcileMacros({ calories: 2000, proteinG: 150, carbsG: 100, fatG: 70, fibreG: 28 });
    expect(Math.abs(macroCalories(reconciled) - 2000)).toBeLessThanOrEqual(4);
  });
});

describe('calculateTargets', () => {
  it('reproduces the worked example, with the cap applied', () => {
    const result = calculateTargets(input());

    expect(result.bmrEstimate).toBe(1855);
    expect(result.maintenanceCalories).toBe(2750);

    // 8 kg over 16 weeks needs 550 kcal/day. The cap is 500, so the target is
    // 2,250 rather than the 2,200 the raw arithmetic gives — the deficit stops
    // at 500 and the goal date moves instead.
    expect(result.targetCalories).toBe(2250);
    expect(result.maintenanceCalories - result.targetCalories).toBe(500);
  });

  it('records every policy version behind the number', () => {
    const { metadata } = calculateTargets(input());
    expect(metadata.equation).toBe('MIFFLIN_ST_JEOR');
    expect(metadata.equationVersion).toBe('1990-v1');
    expect(metadata.safetyPolicyVersion).toBe(policy.version);
    expect(metadata.activityPolicyVersion).toBeTruthy();
    expect(metadata.macroPolicyVersion).toBeTruthy();
  });

  it('offers a longer timeframe instead of clamping a crash request', () => {
    const result = calculateTargets(input({ currentWeightKg: 100, targetWeightKg: 90, requestedWeeks: 4 }));

    expect(result.safetyDecision.status).toBe('adjust_timeframe');
    if (result.safetyDecision.status === 'adjust_timeframe') {
      expect(result.safetyDecision.supportedWeeks).toBe(10);
      expect(result.safetyDecision.requestedWeeks).toBe(4);
    }
  });

  it('never cuts more than 500 kcal below maintenance', () => {
    const result = calculateTargets(input({ currentWeightKg: 100, targetWeightKg: 85, requestedWeeks: 6 }));
    const deficit = result.maintenanceCalories - result.targetCalories;
    expect(deficit).toBeLessThanOrEqual(policy.maxDeficitKcal);
  });

  it('holds the 500 cap however aggressive the request', () => {
    // Every one of these asks for a rate the cap will refuse to fund.
    const aggressive = [
      input({ currentWeightKg: 120, targetWeightKg: 80, requestedWeeks: 4 }),
      input({ currentWeightKg: 90, targetWeightKg: 70, requestedWeeks: 2 }),
      input({ currentWeightKg: 60, targetWeightKg: 50, requestedWeeks: 3, equationBasis: 'female' }),
    ];

    for (const request of aggressive) {
      const result = calculateTargets(request);
      const deficit = result.maintenanceCalories - result.targetCalories;
      expect(deficit).toBeLessThanOrEqual(policy.maxDeficitKcal);
    }
  });

  it('moves the date rather than the deficit when a request is too fast', () => {
    const result = calculateTargets(input({ currentWeightKg: 100, targetWeightKg: 90, requestedWeeks: 3 }));

    expect(result.maintenanceCalories - result.targetCalories).toBeLessThanOrEqual(500);
    expect(result.safetyDecision.status).toBe('adjust_timeframe');
  });

  it('never falls below the floor, which is maintenance minus the cap', () => {
    const result = calculateTargets(
      input({
        equationBasis: 'female',
        ageYears: 45,
        heightCm: 155,
        currentWeightKg: 52,
        targetWeightKg: 46,
        requestedWeeks: 6,
        activityLevel: 'mostly_seated',
      }),
    );
    expect(result.targetCalories).toBeGreaterThanOrEqual(result.automationFloor);
    expect(result.automationFloor).toBe(result.maintenanceCalories - policy.maxDeficitKcal);
  });

  it('scales the floor with the person rather than using a fixed number', () => {
    const small = calculateTargets(
      input({ equationBasis: 'female', heightCm: 155, currentWeightKg: 52, targetWeightKg: 48, activityLevel: 'mostly_seated' }),
    );
    const large = calculateTargets(input({ currentWeightKg: 120, targetWeightKg: 100, requestedWeeks: 30 }));

    // A fixed floor is generous for a small adult and tight for a large one.
    expect(large.automationFloor).toBeGreaterThan(small.automationFloor);
  });

  it('sets muscle gain from experience, not from the timeline', () => {
    const novice = calculateTargets(
      input({ goal: 'BUILD_MUSCLE', targetWeightKg: 96, requestedWeeks: 30, experience: 'new_to_training' }),
    );
    const veteran = calculateTargets(
      input({ goal: 'BUILD_MUSCLE', targetWeightKg: 96, requestedWeeks: 30, experience: 'five_plus_years' }),
    );

    expect(novice.targetCalories).toBeGreaterThan(veteran.targetCalories);
    const surplus = (novice.targetCalories - novice.maintenanceCalories) / novice.maintenanceCalories;
    expect(surplus).toBeCloseTo(SURPLUS_BY_EXPERIENCE.new_to_training, 2);
  });

  it('never exceeds the maximum surplus fraction', () => {
    const result = calculateTargets(
      input({ goal: 'BUILD_MUSCLE', targetWeightKg: 110, requestedWeeks: 8, experience: 'new_to_training' }),
    );
    const surplus = (result.targetCalories - result.maintenanceCalories) / result.maintenanceCalories;
    expect(surplus).toBeLessThanOrEqual(policy.maxSurplusFraction + 1e-9);
  });

  it('puts recomp at maintenance rather than a disguised deficit', () => {
    const result = calculateTargets(
      input({ goal: 'MAINTAIN_RECOMP', targetWeightKg: 90 }),
    );
    expect(result.targetCalories).toBe(result.maintenanceCalories);
    expect(result.calorieAdjustment).toBe(0);
  });

  it('is deterministic', () => {
    const a = calculateTargets(input());
    const b = calculateTargets(input());
    expect(a.targetCalories).toBe(b.targetCalories);
    expect(a.macros).toEqual(b.macros);
  });

  it('refuses to run an equation for a manual-target basis', () => {
    expect(() => calculateTargets(input({ equationBasis: 'manual_target' }))).toThrow(/manual_target/);
  });
});

describe('acceptManualTargets', () => {
  it('stores professionally prescribed figures', () => {
    const result = acceptManualTargets({
      calories: 2400, proteinG: 180, carbsG: 260, fatG: 70, basis: 'male',
    });
    expect(result.macros.calories).toBe(2400);
    expect(result.belowAutomationFloor).toBe(false);
  });

  it('flags a prescription below what the app would generate, without refusing to store it', () => {
    const result = acceptManualTargets({
      calories: 1300, proteinG: 140, carbsG: 100, fatG: 40, basis: 'male', maintenanceCalories: 2750,
    });
    expect(result.belowAutomationFloor).toBe(true);
    expect(result.macros.calories).toBe(1300);
  });
});

describe('projectForTimeframe', () => {
  const person = input({ currentWeightKg: 100, targetWeightKg: 90 });

  it('marks a too-short timeframe unsupported rather than clamping silently', () => {
    expect(projectForTimeframe(person, 5)?.supported).toBe(false);
  });

  it('marks an achievable timeframe supported', () => {
    expect(projectForTimeframe(person, 16)?.supported).toBe(true);
  });

  it('allows more calories once the timeframe is long enough to clear the cap', () => {
    // 20 weeks still needs 550 kcal/day and lands on the cap; 24 weeks needs
    // 458 and comes in under it.
    const capped = projectForTimeframe(person, 20)!;
    const under = projectForTimeframe(person, 24)!;
    expect(under.calories).toBeGreaterThan(capped.calories);
  });

  it('flattens every timeframe that would need more than the cap', () => {
    // Asking for it faster does not produce a deeper cut, only an earlier date
    // the app will refuse.
    const six = projectForTimeframe(person, 6)!;
    const ten = projectForTimeframe(person, 10)!;
    expect(six.calories).toBe(ten.calories);
    expect(six.supported).toBe(false);
  });

  it('rejects a nonsense timeframe', () => {
    expect(projectForTimeframe(person, 0)).toBeNull();
  });
});

describe('meal distributions', () => {
  it('every configured day sums to one', () => {
    for (const [count, distribution] of Object.entries(MEAL_DISTRIBUTIONS)) {
      const total = Object.values(distribution).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1, 6);
      expect(Object.keys(distribution)).toHaveLength(Number(count));
    }
  });
});
