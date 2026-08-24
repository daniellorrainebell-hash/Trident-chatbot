import type { FoodItem, FoodPreferences, MealIngredient, MealNutrients } from '@/types';
import {
  MEAL_TOLERANCE,
  calculateMealNutrients,
  fitMealToBudget,
  findExclusionViolations,
  scaleIngredients,
  splitDailyBudget,
  sumNutrients,
  validateAgainstBudget,
} from './validation';

const FOODS: Record<string, FoodItem> = {
  chicken: food('chicken', 'Chicken breast', 'raw', 106, 24, 0, 1.2, 0, ['high_protein']),
  rice: food('rice', 'Basmati rice', 'dry', 356, 8.5, 78, 1, 1.4, ['vegan', 'vegetarian', 'gluten_free', 'dairy_free']),
  oil: food('oil', 'Olive oil', 'as_sold', 884, 0, 0, 100, 0, ['vegan', 'vegetarian', 'gluten_free', 'dairy_free']),
  milk: food('milk', 'Whole milk', 'as_sold', 61, 3.2, 4.8, 3.3, 0, ['vegetarian', 'gluten_free']),
  peanuts: food('peanuts', 'Peanut butter', 'as_sold', 588, 25, 20, 50, 6, ['vegan', 'vegetarian']),
};

function food(
  id: string, name: string, state: FoodItem['state'],
  kcal: number, protein: number, carbs: number, fat: number, fibre: number,
  tags: FoodItem['tags'],
): FoodItem {
  return {
    id, name, aliases: [], category: 'protein', aisle: 'pantry', state,
    kcalPer100g: kcal, proteinPer100g: protein, carbsPer100g: carbs,
    fatPer100g: fat, fibrePer100g: fibre, typicalPortionG: 100,
    source: 'test', sourceVersion: '1', tags,
  };
}

const lookup = (id: string) => FOODS[id];

function ingredient(foodId: string, grams: number): MealIngredient {
  const f = FOODS[foodId]!;
  return { foodId, foodName: f.name, grams, state: f.state };
}

function prefs(overrides: Partial<FoodPreferences> = {}): FoodPreferences {
  return {
    userId: 'user-1',
    states: {},
    allergies: [],
    intolerances: [],
    dietaryRules: [],
    manualExclusions: [],
    ...overrides,
  };
}

describe('calculateMealNutrients', () => {
  it('scales from the per-100g food table', () => {
    const nutrients = calculateMealNutrients([ingredient('chicken', 200)], lookup);
    expect(nutrients).toEqual({
      calories: 212, proteinG: 48, carbsG: 0, fatG: 2, fibreG: 0,
    });
  });

  it('sums across ingredients', () => {
    const nutrients = calculateMealNutrients(
      [ingredient('chicken', 180), ingredient('rice', 100), ingredient('oil', 10)],
      lookup,
    );
    // 190.8 + 356 + 88.4 = 635.2 -> 635
    expect(nutrients?.calories).toBe(635);
  });

  it('rejects the whole meal when a food is unknown rather than skipping it', () => {
    const unknown: MealIngredient = {
      foodId: 'not-a-food', foodName: 'Mystery', grams: 100, state: 'raw',
    };
    expect(calculateMealNutrients([unknown], lookup)).toBeNull();
  });
});

describe('validateAgainstBudget', () => {
  const budget: MealNutrients = {
    calories: 600, proteinG: 45, carbsG: 60, fatG: 18, fibreG: 8,
  };

  it('accepts a meal inside tolerance', () => {
    const actual = { ...budget, calories: 612, proteinG: 44 };
    expect(validateAgainstBudget(actual, budget, MEAL_TOLERANCE).valid).toBe(true);
  });

  it('names the macro that failed', () => {
    const actual = { ...budget, calories: 900 };
    const result = validateAgainstBudget(actual, budget, MEAL_TOLERANCE);
    expect(result.valid).toBe(false);
    expect(result.failures).toContain('calories');
  });

  it('reports a signed delta so the UI can say over or under', () => {
    const actual = { ...budget, calories: 550, proteinG: 50 };
    const result = validateAgainstBudget(actual, budget, MEAL_TOLERANCE);
    expect(result.delta.calories).toBe(-50);
    expect(result.delta.proteinG).toBe(5);
  });
});

describe('scaleIngredients', () => {
  it('rounds portions to something a person can actually weigh', () => {
    const scaled = scaleIngredients([ingredient('chicken', 137)], 1.0);
    expect(scaled[0]!.grams % 5).toBe(0);
  });

  it('refuses to scale beyond the sane bounds', () => {
    const up = scaleIngredients([ingredient('chicken', 100)], 10);
    const down = scaleIngredients([ingredient('chicken', 100)], 0.01);
    expect(up[0]!.grams).toBe(140);
    expect(down[0]!.grams).toBe(60);
  });
});

describe('fitMealToBudget', () => {
  it('scales an under-target meal up until it validates', () => {
    const budget: MealNutrients = {
      calories: 700, proteinG: 50, carbsG: 70, fatG: 18, fibreG: 5,
    };
    const proposed = [ingredient('chicken', 150), ingredient('rice', 80), ingredient('oil', 8)];

    const result = fitMealToBudget(proposed, budget, lookup);
    expect(result).not.toBeNull();
    expect(result!.nutrients.calories).toBeGreaterThan(
      calculateMealNutrients(proposed, lookup)!.calories,
    );
    expect(result!.iterations).toBeGreaterThan(0);
  });

  it('reports failure rather than distorting portions to force a fit', () => {
    // A budget no plausible scaling of 20 g of oil can reach.
    const budget: MealNutrients = {
      calories: 900, proteinG: 60, carbsG: 90, fatG: 20, fibreG: 8,
    };
    const result = fitMealToBudget([ingredient('oil', 20)], budget, lookup);

    expect(result).not.toBeNull();
    expect(result!.validation.valid).toBe(false);
  });

  it('returns null when the meal references an unknown food', () => {
    const budget: MealNutrients = {
      calories: 600, proteinG: 45, carbsG: 60, fatG: 18, fibreG: 8,
    };
    const bad: MealIngredient = { foodId: 'ghost', foodName: 'Ghost', grams: 100, state: 'raw' };
    expect(fitMealToBudget([bad], budget, lookup)).toBeNull();
  });
});

describe('findExclusionViolations', () => {
  it('passes a clean meal', () => {
    const violations = findExclusionViolations(
      [ingredient('chicken', 180), ingredient('rice', 100)],
      prefs(),
      lookup,
    );
    expect(violations).toHaveLength(0);
  });

  it('catches an allergen the model slipped in', () => {
    const violations = findExclusionViolations(
      [ingredient('peanuts', 30)],
      prefs({ allergies: ['peanuts'] }),
      lookup,
    );
    expect(violations[0]?.reason).toBe('allergy');
  });

  it('catches an intolerance', () => {
    const violations = findExclusionViolations(
      [ingredient('milk', 200)],
      prefs({ intolerances: ['milk'] }),
      lookup,
    );
    expect(violations[0]?.reason).toBe('intolerance');
  });

  it('enforces a dietary rule against food tags', () => {
    const violations = findExclusionViolations(
      [ingredient('chicken', 180)],
      prefs({ dietaryRules: ['vegan'] }),
      lookup,
    );
    expect(violations[0]?.reason).toBe('dietary_rule');
  });

  it('treats KEEP IT OUT as a hard exclusion, not a preference', () => {
    const violations = findExclusionViolations(
      [ingredient('rice', 100)],
      prefs({ states: { rice: 'keep_it_out' } }),
      lookup,
    );
    expect(violations[0]?.reason).toBe('manual_exclusion');
  });

  it('flags an unknown food rather than trusting it', () => {
    const ghost: MealIngredient = {
      foodId: 'invented-by-the-model', foodName: 'Protein fluff', grams: 50, state: 'raw',
    };
    const violations = findExclusionViolations([ghost], prefs(), lookup);
    expect(violations[0]?.reason).toBe('unknown_food');
  });

  it('lets an allergy override a LOVE IT preference', () => {
    const violations = findExclusionViolations(
      [ingredient('peanuts', 30)],
      prefs({ allergies: ['peanuts'], states: { peanuts: 'love_it' } }),
      lookup,
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.reason).toBe('allergy');
  });
});

describe('splitDailyBudget', () => {
  const targets: MealNutrients = {
    calories: 2640, proteinG: 190, carbsG: 305, fatG: 73, fibreG: 37,
  };

  it('gives snacks a smaller share than main meals', () => {
    const [breakfast, , , snack] = splitDailyBudget(targets, [
      'breakfast', 'lunch', 'dinner', 'snack',
    ]);
    expect(snack!.calories).toBeLessThan(breakfast!.calories);
  });

  it('sums back to exactly the daily target with no drift', () => {
    const budgets = splitDailyBudget(targets, ['breakfast', 'lunch', 'dinner', 'snack']);
    const total = sumNutrients(budgets);

    expect(total.calories).toBe(targets.calories);
    expect(total.proteinG).toBe(targets.proteinG);
    expect(total.carbsG).toBe(targets.carbsG);
    expect(total.fatG).toBe(targets.fatG);
  });

  it('handles a three-meal day', () => {
    const budgets = splitDailyBudget(targets, ['breakfast', 'lunch', 'dinner']);
    expect(budgets).toHaveLength(3);
    expect(sumNutrients(budgets).calories).toBe(targets.calories);
  });
});
