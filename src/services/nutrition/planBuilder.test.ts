import type { FoodPreferences } from '@/types';
import { makeNutritionProfile } from '@/engines/__fixtures__/builders';
import { calculateEnergyTargets } from '@/engines/nutrition/energy';
import { findExclusionViolations, validateAgainstBudget, MEAL_TOLERANCE } from '@/engines/nutrition/validation';
import { findFood } from '@/data/foods';
import { localMealProvider } from '@/services/ai/localProvider';
import type { AIProvider, ProposedMealSet } from '@/services/ai/types';
import {
  allowedFoodIds,
  buildMealPlan,
  buildMealPrep,
  buildShoppingList,
  mealTypesFor,
  proposeRebalance,
  targetsForDay,
} from './planBuilder';

const profile = makeNutritionProfile();
const targets = calculateEnergyTargets(profile);

function prefs(overrides: Partial<FoodPreferences> = {}): FoodPreferences {
  return {
    userId: 'user-1',
    states: {},
    allergenGroups: [],
    allergies: [],
    intolerances: [],
    dietaryRules: [],
    manualExclusions: [],
    ...overrides,
  };
}

/**
 * Replace one method on the local provider. Spreading the instance would drop
 * its prototype methods, so delegate explicitly.
 */
function providerWith(
  name: string,
  generateMealOptions: AIProvider['generateMealOptions'],
): AIProvider {
  return {
    name,
    generateMealOptions,
    generateMealSwap: (r) => localMealProvider.generateMealSwap(r),
    generateTrainingInsight: (r) => localMealProvider.generateTrainingInsight(r),
    summariseCheckIn: (r) => localMealProvider.summariseCheckIn(r),
  };
}

let idCounter = 0;
const makeId = () => `id-${(idCounter += 1)}`;
beforeEach(() => {
  idCounter = 0;
});

async function build(preferences = prefs(), provider: AIProvider = localMealProvider) {
  return buildMealPlan({
    provider,
    profile,
    preferences,
    targets: targets.macros,
    weekStarting: '2026-03-02',
    energyCalculationId: 'calc-1',
    trainingDays: [1, 2, 4, 5],
    splitTrainingDays: false,
    makeId,
  });
}

describe('allowedFoodIds', () => {
  it('removes an allergen from the usable pool', () => {
    const allowed = allowedFoodIds(prefs({ allergies: ['peanut-butter'] }));
    expect(allowed).not.toContain('peanut-butter');
    expect(allowed).toContain('chicken-breast');
  });

  it('applies a dietary rule across the whole table', () => {
    const allowed = allowedFoodIds(prefs({ dietaryRules: ['vegan'] }));
    expect(allowed).not.toContain('chicken-breast');
    expect(allowed).not.toContain('greek-yoghurt');
    expect(allowed).toContain('lentils');
  });
});

describe('mealTypesFor', () => {
  it('shapes the day around the requested meal count', () => {
    expect(mealTypesFor(3)).toEqual(['breakfast', 'lunch', 'dinner']);
    expect(mealTypesFor(4)).toHaveLength(4);
    expect(mealTypesFor(6)).toHaveLength(6);
  });

  it('clamps an implausible request', () => {
    expect(mealTypesFor(1)).toHaveLength(3);
    expect(mealTypesFor(12)).toHaveLength(6);
  });
});

describe('buildMealPlan', () => {
  it('generates a full Monday to Sunday week', async () => {
    const { plan } = await build();
    expect(plan).not.toBeNull();
    expect(plan!.days).toHaveLength(7);
    expect(plan!.days.map((d) => d.dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(plan!.days[0]!.date).toBe('2026-03-02');
    expect(plan!.days[6]!.date).toBe('2026-03-08');
  });

  it('offers three options for every meal, which spec §39 requires', async () => {
    const { plan, failures } = await build();
    const counts = plan!.days.flatMap((d) => d.meals.map((m) => m.options.length));

    expect(failures).toEqual([]);
    // Not "up to three" — three. A meal offering one choice is not a choice.
    expect(counts.every((c) => c === 3)).toBe(true);
  });

  it('offers up to three options per meal', async () => {
    const { plan } = await build();
    for (const day of plan!.days) {
      for (const meal of day.meals) {
        expect(meal.options.length).toBeGreaterThanOrEqual(1);
        expect(meal.options.length).toBeLessThanOrEqual(3);
        expect(meal.options.map((o) => o.slot)).toEqual(
          ['A', 'B', 'C'].slice(0, meal.options.length),
        );
      }
    }
  });

  it('computes every option against its budget, within tolerance', async () => {
    const { plan } = await build();
    for (const day of plan!.days) {
      for (const meal of day.meals) {
        for (const option of meal.options) {
          const result = validateAgainstBudget(option.nutrients, meal.budget, MEAL_TOLERANCE);
          expect(result.valid).toBe(true);
        }
      }
    }
  });

  it('lands each day close to the daily calorie target', async () => {
    const { plan } = await build();
    for (const day of plan!.days) {
      const drift = Math.abs(day.totals.calories - day.targets.calories);
      expect(drift / day.targets.calories).toBeLessThan(0.12);
    }
  });

  it('never puts an excluded food into a plan', async () => {
    const preferences = prefs({
      allergies: ['peanut-butter'],
      intolerances: ['semi-skimmed-milk'],
      states: { basmati_rice: 'keep_it_out', salmon: 'keep_it_out' },
    });

    const { plan } = await build(preferences);

    for (const day of plan!.days) {
      for (const meal of day.meals) {
        for (const option of meal.options) {
          expect(findExclusionViolations(option.ingredients, preferences, findFood)).toEqual([]);
        }
      }
    }
  });

  it('builds a full week for someone with a nut allergy', async () => {
    // The realistic failure mode for allergen groups is over-exclusion leaving
    // too little to plan from. A nut allergy must still yield a complete week.
    const preferences = prefs({ allergenGroups: ['nuts'] });
    const { plan, failures } = await build(preferences);

    expect(plan).not.toBeNull();
    expect(plan!.days).toHaveLength(7);
    expect(failures).toEqual([]);

    for (const day of plan!.days) {
      for (const meal of day.meals) {
        for (const option of meal.options) {
          expect(findExclusionViolations(option.ingredients, preferences, findFood)).toEqual([]);
        }
      }
    }
  });

  it('keeps every allergen group out of the plan entirely', async () => {
    for (const group of ['nuts', 'dairy', 'gluten', 'soy'] as const) {
      const preferences = prefs({ allergenGroups: [group] });
      const { plan } = await build(preferences);
      if (!plan) continue;

      for (const day of plan.days) {
        for (const meal of day.meals) {
          for (const option of meal.options) {
            expect(
              findExclusionViolations(option.ingredients, preferences, findFood),
            ).toEqual([]);
          }
        }
      }
    }
  });

  it('honours a vegan rule across the whole week', async () => {
    const preferences = prefs({ dietaryRules: ['vegan'] });
    const { plan } = await build(preferences);

    const allFoodIds = plan!.days.flatMap((day) =>
      day.meals.flatMap((meal) => meal.options.flatMap((o) => o.ingredients.map((i) => i.foodId))),
    );

    for (const id of allFoodIds) {
      expect(findFood(id)!.tags).toContain('vegan');
    }
  });

  it('records the calculation the plan was built against', async () => {
    const { plan } = await build();
    expect(plan!.energyCalculationId).toBe('calc-1');
    expect(plan!.targets).toEqual(targets.macros);
  });

  it('is deterministic for the same inputs', async () => {
    const a = await build();
    idCounter = 0;
    const b = await build();

    const names = (p: typeof a) =>
      p.plan!.days.flatMap((d) => d.meals.flatMap((m) => m.options.map((o) => o.name)));

    expect(names(a)).toEqual(names(b));
  });

  it('drops a malformed proposal instead of showing it', async () => {
    const badProvider = providerWith('bad', async (): Promise<ProposedMealSet> => {
      return {
        // Negative grams and an empty preparation list: invalid on both counts.
        options: [
          {
            mealName: 'Broken meal',
            mealType: 'breakfast',
            ingredients: [{ foodId: 'oats', grams: -50 }],
            preparation: [],
            prepMinutes: 5,
            cookMinutes: 5,
          },
        ],
      } as unknown as ProposedMealSet;
    });

    const { plan, failures } = await build(prefs(), badProvider);
    expect(plan).toBeNull();
    expect(failures.length).toBeGreaterThan(0);
    expect(failures[0]!.reason).toBe('all_rejected');
  });

  it('rejects a meal that names a food outside the database', async () => {
    const hallucinating = providerWith('hallucinating', async () => ({
      options: [
        {
          mealName: 'Invented meal',
          mealType: 'breakfast' as const,
          ingredients: [{ foodId: 'unicorn-protein', grams: 100 }],
          preparation: ['Imagine it.'],
          prepMinutes: 1,
          cookMinutes: 0,
        },
      ],
    }));

    const { plan } = await build(prefs(), hallucinating);
    expect(plan).toBeNull();
  });

  it('fails safe when the provider throws', async () => {
    const failing = providerWith('failing', async (): Promise<ProposedMealSet> => {
      throw new Error('provider timeout');
    });

    const { plan, failures } = await build(prefs(), failing);
    expect(plan).toBeNull();
    expect(failures.length).toBeGreaterThan(0);
  });
});

describe('targetsForDay', () => {
  it('leaves targets alone when carb cycling is off', () => {
    expect(targetsForDay(targets.macros, true, false)).toEqual(targets.macros);
  });

  it('moves carbs onto training days and off rest days', () => {
    const training = targetsForDay(targets.macros, true, true);
    const rest = targetsForDay(targets.macros, false, true);

    expect(training.carbsG).toBeGreaterThan(targets.macros.carbsG);
    expect(rest.carbsG).toBeLessThan(targets.macros.carbsG);
    expect(training.proteinG).toBe(rest.proteinG);
    expect(training.fatG).toBe(rest.fatG);
  });
});

describe('buildShoppingList', () => {
  it('consolidates the week into aisle-grouped quantities', async () => {
    const { plan } = await build();
    const list = buildShoppingList(plan!);

    expect(list.items.length).toBeGreaterThan(0);
    expect(list.planId).toBe(plan!.id);

    const aisles = list.items.map((i) => i.aisle);
    expect([...aisles].sort()).toEqual(aisles);
  });

  it('keeps raw and dry states as separate lines', async () => {
    const { plan } = await build();
    const list = buildShoppingList(plan!);

    for (const item of list.items) {
      expect(findFood(item.foodId)!.state).toBe(item.state);
    }
  });
});

describe('buildMealPrep', () => {
  it('totals only the bulk items worth batching', async () => {
    const { plan } = await build();
    const prep = buildMealPrep(plan!, 3);

    expect(prep.length).toBeGreaterThan(0);
    for (const item of prep) {
      expect(item.totalGrams).toBeGreaterThanOrEqual(100);
      expect(item.usedIn.length).toBeGreaterThan(0);
    }
  });

  it('scales with the number of days requested', async () => {
    const { plan } = await build();
    const three = buildMealPrep(plan!, 3).reduce((s, i) => s + i.totalGrams, 0);
    const seven = buildMealPrep(plan!, 7).reduce((s, i) => s + i.totalGrams, 0);

    expect(seven).toBeGreaterThan(three);
  });
});

describe('proposeRebalance', () => {
  it('stays quiet when the day is tracking normally', async () => {
    const { plan } = await build();
    const day = plan!.days[0]!;
    const breakfast = day.meals[0]!;

    expect(proposeRebalance(day, breakfast.budget, [breakfast.id])).toBeNull();
  });

  it('flags a meaningful drift and names the remaining meals', async () => {
    const { plan } = await build();
    const day = plan!.days[0]!;
    const breakfast = day.meals[0]!;

    const overshoot = {
      ...breakfast.budget,
      calories: breakfast.budget.calories + 400,
      carbsG: breakfast.budget.carbsG + 60,
    };

    const proposal = proposeRebalance(day, overshoot, [breakfast.id]);
    expect(proposal).not.toBeNull();
    expect(proposal!.drift.calories).toBe(400);
    expect(proposal!.message).toMatch(/\+60g carbs/);
    expect(proposal!.adjustableMeals.length).toBe(day.meals.length - 1);
  });

  it('returns nothing once the day is finished', async () => {
    const { plan } = await build();
    const day = plan!.days[0]!;
    const allIds = day.meals.map((m) => m.id);

    expect(proposeRebalance(day, day.totals, allIds)).toBeNull();
  });
});
