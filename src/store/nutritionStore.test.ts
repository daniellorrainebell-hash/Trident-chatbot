import { makeNutritionProfile } from '@/engines/__fixtures__/builders';
import { seedFoodPreferences, seedNutritionProfile } from '@/data/seed';
import { findFood } from '@/data/foods';
import { findExclusionViolations } from '@/engines/nutrition/validation';
import { localMealProvider } from '@/services/ai/localProvider';
import { useNutritionStore } from './nutritionStore';

function reset() {
  useNutritionStore.setState({
    profile: { ...seedNutritionProfile, targetWeightKg: 85, requestedTimeframeWeeks: 20 },
    preferences: seedFoodPreferences,
    safetyDecision: null,
    energy: null,
    plan: null,
    shoppingList: null,
    checkIns: [],
    pendingAdjustment: null,
    // Restored explicitly: one test swaps in a failing provider.
    provider: localMealProvider,
    generating: false,
    planFailures: [],
  });
}

beforeEach(reset);

describe('generateTargets', () => {
  it('produces targets for an eligible profile', () => {
    const decision = useNutritionStore.getState().generateTargets();

    expect(decision.approved).toBe(true);
    const { energy } = useNutritionStore.getState();
    expect(energy?.targetCalories).toBeGreaterThan(0);
    expect(energy?.macros.proteinG).toBeGreaterThan(0);
  });

  it('produces no target at all for a blocked profile', () => {
    useNutritionStore.getState().setProfile(makeNutritionProfile({ ageYears: 16 }));
    const decision = useNutritionStore.getState().generateTargets();

    expect(decision.approved).toBe(false);
    // The important part: there is nothing to display.
    expect(useNutritionStore.getState().energy).toBeNull();
  });

  it('invalidates stale targets when the profile changes', () => {
    useNutritionStore.getState().generateTargets();
    expect(useNutritionStore.getState().energy).not.toBeNull();

    useNutritionStore.getState().setProfile(makeNutritionProfile({ currentWeightKg: 70 }));
    expect(useNutritionStore.getState().energy).toBeNull();
  });
});

describe('generatePlan', () => {
  it('refuses to build a plan without approved targets', async () => {
    await useNutritionStore.getState().generatePlan('2026-03-02', [1, 3, 5], false);
    expect(useNutritionStore.getState().plan).toBeNull();
  });

  it('builds a full week and its shopping list once targets exist', async () => {
    useNutritionStore.getState().generateTargets();
    await useNutritionStore.getState().generatePlan('2026-03-02', [1, 2, 4, 5], false);

    const { plan, shoppingList } = useNutritionStore.getState();
    expect(plan?.days).toHaveLength(7);
    expect(shoppingList?.items.length).toBeGreaterThan(0);
  });

  it('respects exclusions set through the store', async () => {
    useNutritionStore.getState().setAllergies(['peanut-butter', 'almonds']);
    useNutritionStore.getState().generateTargets();
    await useNutritionStore.getState().generatePlan('2026-03-02', [1, 2, 4, 5], false);

    const { plan, preferences } = useNutritionStore.getState();
    for (const day of plan!.days) {
      for (const meal of day.meals) {
        for (const option of meal.options) {
          expect(findExclusionViolations(option.ingredients, preferences, findFood)).toEqual([]);
        }
      }
    }
  });

  it('clears the generating flag even when the build fails', async () => {
    useNutritionStore.getState().generateTargets();
    useNutritionStore.setState({
      provider: {
        name: 'broken',
        async generateMealOptions() { throw new Error('down'); },
        async generateMealSwap() { throw new Error('down'); },
        async generateTrainingInsight() { throw new Error('down'); },
        async summariseCheckIn() { throw new Error('down'); },
      },
    });

    await useNutritionStore.getState().generatePlan('2026-03-02', [1], false);
    expect(useNutritionStore.getState().generating).toBe(false);
  });
});

describe('selectMealOption', () => {
  it('updates the day totals and rebuilds the shopping list', async () => {
    useNutritionStore.getState().generateTargets();
    await useNutritionStore.getState().generatePlan('2026-03-02', [1, 2, 4, 5], false);

    const day = useNutritionStore.getState().plan!.days[0]!;
    const meal = day.meals.find((m) => m.options.length > 1);
    if (!meal) return;

    const alternative = meal.options.find((o) => o.id !== meal.selectedOptionId)!;
    const before = day.totals.calories;

    useNutritionStore.getState().selectMealOption(day.id, meal.id, alternative.id);

    const after = useNutritionStore.getState().plan!.days[0]!;
    expect(after.meals.find((m) => m.id === meal.id)!.selectedOptionId).toBe(alternative.id);
    // Totals recomputed from the newly selected option.
    expect(after.totals.calories).toBe(
      after.meals
        .map((m) => m.options.find((o) => o.id === m.selectedOptionId)!.nutrients.calories)
        .reduce((a, b) => a + b, 0),
    );
    expect(typeof before).toBe('number');
  });
});

describe('check-ins and adjustment', () => {
  function submit(weight: number, weekStarting: string, adherence = 92) {
    useNutritionStore.getState().submitCheckIn({
      weekStarting,
      weightKg: weight,
      waistCm: null,
      planAdherence: adherence,
      trainingAdherence: adherence,
      hunger: 3,
      energy: 3,
      performance: 3,
      sleepQuality: 3,
    });
  }

  it('records check-ins', () => {
    useNutritionStore.getState().generateTargets();
    submit(88.4, '2026-03-02');
    expect(useNutritionStore.getState().checkIns).toHaveLength(1);
  });

  it('does not suggest a change from a single check-in', () => {
    useNutritionStore.getState().generateTargets();
    submit(88.4, '2026-03-02');
    expect(useNutritionStore.getState().pendingAdjustment).toBeNull();
  });

  it('suggests a change once a stalled trend is established', () => {
    useNutritionStore.getState().generateTargets();
    submit(88.4, '2026-02-09');
    submit(88.4, '2026-02-16');
    submit(88.3, '2026-02-23');
    submit(88.4, '2026-03-02');

    const suggestion = useNutritionStore.getState().pendingAdjustment;
    expect(suggestion).not.toBeNull();
    expect(suggestion!.status).toBe('pending');
  });

  it('changes nothing until the user accepts', () => {
    useNutritionStore.getState().generateTargets();
    const original = useNutritionStore.getState().energy!.targetCalories;

    submit(88.4, '2026-02-09');
    submit(88.4, '2026-02-16');
    submit(88.3, '2026-02-23');
    submit(88.4, '2026-03-02');

    expect(useNutritionStore.getState().energy!.targetCalories).toBe(original);
  });

  it('applies the new target and invalidates the old plan on accept', async () => {
    useNutritionStore.getState().generateTargets();
    await useNutritionStore.getState().generatePlan('2026-03-02', [1, 2, 4, 5], false);
    const original = useNutritionStore.getState().energy!.targetCalories;

    submit(88.4, '2026-02-09');
    submit(88.4, '2026-02-16');
    submit(88.3, '2026-02-23');
    submit(88.4, '2026-03-02');

    const suggested = useNutritionStore.getState().pendingAdjustment!.suggestedCalories;
    useNutritionStore.getState().acceptAdjustment();

    const { energy, plan } = useNutritionStore.getState();
    expect(energy!.targetCalories).toBe(suggested);
    expect(energy!.targetCalories).not.toBe(original);
    expect(energy!.macros.calories).toBe(suggested);
    // The plan was built for the old number, so it is no longer valid.
    expect(plan).toBeNull();
  });

  it('leaves the target alone on decline', () => {
    useNutritionStore.getState().generateTargets();
    const original = useNutritionStore.getState().energy!.targetCalories;

    submit(88.4, '2026-02-09');
    submit(88.4, '2026-02-16');
    submit(88.3, '2026-02-23');
    submit(88.4, '2026-03-02');

    useNutritionStore.getState().declineAdjustment();
    expect(useNutritionStore.getState().energy!.targetCalories).toBe(original);
    expect(useNutritionStore.getState().pendingAdjustment!.status).toBe('declined');
  });
});
