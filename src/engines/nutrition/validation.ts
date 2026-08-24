import type {
  FoodItem,
  FoodPreferences,
  MacroDelta,
  MealIngredient,
  MealNutrients,
  MealOption,
  ValidationResult,
  ValidationTolerance,
} from '@/types';

/**
 * Deterministic nutrient calculation and meal validation (spec §40, §55, §56).
 *
 * The AI proposes a meal as a list of `foodId` + grams. It never supplies a
 * calorie or macro figure — and if it did, nothing here would read it. Nutrients
 * are computed from the structured food table every single time.
 *
 * A meal is not shown to the user until it has passed through here.
 */

export const DEFAULT_TOLERANCE: ValidationTolerance = {
  caloriesPercent: 0.05,
  proteinPercent: 0.08,
  carbsPercent: 0.12,
  fatPercent: 0.12,
};

/**
 * Per-meal tolerance is looser than per-day. Individual meals rounding to sane
 * portions matters more than each one hitting its share exactly; the day is what
 * has to land (spec §41).
 */
export const MEAL_TOLERANCE: ValidationTolerance = {
  caloriesPercent: 0.1,
  proteinPercent: 0.15,
  carbsPercent: 0.2,
  fatPercent: 0.2,
};

export type FoodLookup = (foodId: string) => FoodItem | undefined;

export const ZERO_NUTRIENTS: MealNutrients = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fibreG: 0,
};

/** Nutrients for one ingredient, scaled from per-100g food data. */
export function nutrientsForIngredient(
  ingredient: MealIngredient,
  lookup: FoodLookup,
): MealNutrients | null {
  const food = lookup(ingredient.foodId);
  if (!food) return null;

  const factor = ingredient.grams / 100;
  return {
    calories: food.kcalPer100g * factor,
    proteinG: food.proteinPer100g * factor,
    carbsG: food.carbsPer100g * factor,
    fatG: food.fatPer100g * factor,
    fibreG: food.fibrePer100g * factor,
  };
}

export function sumNutrients(values: MealNutrients[]): MealNutrients {
  return values.reduce(
    (total, n) => ({
      calories: total.calories + n.calories,
      proteinG: total.proteinG + n.proteinG,
      carbsG: total.carbsG + n.carbsG,
      fatG: total.fatG + n.fatG,
      fibreG: total.fibreG + n.fibreG,
    }),
    { ...ZERO_NUTRIENTS },
  );
}

export function roundNutrients(n: MealNutrients): MealNutrients {
  return {
    calories: Math.round(n.calories),
    proteinG: Math.round(n.proteinG),
    carbsG: Math.round(n.carbsG),
    fatG: Math.round(n.fatG),
    fibreG: Math.round(n.fibreG),
  };
}

/**
 * Compute a meal's nutrients from its ingredients.
 * Returns null if any food is unknown — an unrecognised ingredient invalidates
 * the whole meal rather than being silently skipped, which would understate it.
 */
export function calculateMealNutrients(
  ingredients: MealIngredient[],
  lookup: FoodLookup,
): MealNutrients | null {
  const parts: MealNutrients[] = [];
  for (const ingredient of ingredients) {
    const n = nutrientsForIngredient(ingredient, lookup);
    if (n === null) return null;
    parts.push(n);
  }
  return roundNutrients(sumNutrients(parts));
}

export function nutrientDelta(actual: MealNutrients, budget: MealNutrients): MacroDelta {
  return {
    calories: Math.round(actual.calories - budget.calories),
    proteinG: Math.round(actual.proteinG - budget.proteinG),
    carbsG: Math.round(actual.carbsG - budget.carbsG),
    fatG: Math.round(actual.fatG - budget.fatG),
  };
}

/** Compare computed nutrients against a budget within tolerance. */
export function validateAgainstBudget(
  actual: MealNutrients,
  budget: MealNutrients,
  tolerance: ValidationTolerance = DEFAULT_TOLERANCE,
): ValidationResult {
  const delta = nutrientDelta(actual, budget);
  const failures: ValidationResult['failures'] = [];

  const deviation = (value: number, target: number): number =>
    target === 0 ? 0 : (value - target) / target;

  const devCalories = deviation(actual.calories, budget.calories);
  const devProtein = deviation(actual.proteinG, budget.proteinG);
  const devCarbs = deviation(actual.carbsG, budget.carbsG);
  const devFat = deviation(actual.fatG, budget.fatG);

  if (Math.abs(devCalories) > tolerance.caloriesPercent) failures.push('calories');
  if (Math.abs(devProtein) > tolerance.proteinPercent) failures.push('protein');
  if (Math.abs(devCarbs) > tolerance.carbsPercent) failures.push('carbs');
  if (Math.abs(devFat) > tolerance.fatPercent) failures.push('fat');

  return {
    valid: failures.length === 0,
    delta,
    deviationPercent: {
      calories: round(devCalories * 100, 1),
      proteinG: round(devProtein * 100, 1),
      carbsG: round(devCarbs * 100, 1),
      fatG: round(devFat * 100, 1),
    },
    failures,
  };
}

/**
 * Scale portions toward a calorie budget (spec §40's adjust-and-recalculate step).
 *
 * Scaling is bounded: portions may move by at most ±40%, and each is rounded to
 * 5 g because nobody weighs 137 g of rice. A meal that still misses after this is
 * rejected rather than stretched into something absurd.
 */
export const MAX_PORTION_SCALE = 1.4;
export const MIN_PORTION_SCALE = 0.6;
export const PORTION_ROUNDING_G = 5;

export function scaleIngredients(
  ingredients: MealIngredient[],
  factor: number,
): MealIngredient[] {
  const bounded = Math.min(MAX_PORTION_SCALE, Math.max(MIN_PORTION_SCALE, factor));
  return ingredients.map((ingredient) => ({
    ...ingredient,
    grams: Math.max(
      PORTION_ROUNDING_G,
      Math.round((ingredient.grams * bounded) / PORTION_ROUNDING_G) * PORTION_ROUNDING_G,
    ),
  }));
}

export type FitResult = {
  ingredients: MealIngredient[];
  nutrients: MealNutrients;
  validation: ValidationResult;
  iterations: number;
};

/**
 * Iteratively fit a proposed meal to its budget.
 *
 * Converges in a couple of passes for a normal meal; the iteration cap stops a
 * pathological case from looping. Returns whatever it reached along with the
 * validation result, so the caller can reject it — no unvalidated plan is ever
 * shown as final (spec §56).
 */
export function fitMealToBudget(
  ingredients: MealIngredient[],
  budget: MealNutrients,
  lookup: FoodLookup,
  tolerance: ValidationTolerance = MEAL_TOLERANCE,
  maxIterations = 4,
): FitResult | null {
  let current = ingredients;
  let nutrients = calculateMealNutrients(current, lookup);
  if (nutrients === null) return null;

  let validation = validateAgainstBudget(nutrients, budget, tolerance);
  let iterations = 0;

  while (!validation.valid && iterations < maxIterations) {
    if (nutrients.calories <= 0) break;
    const factor = budget.calories / nutrients.calories;
    const next = scaleIngredients(current, factor);

    const nextNutrients = calculateMealNutrients(next, lookup);
    if (nextNutrients === null) break;

    current = next;
    nutrients = nextNutrients;
    validation = validateAgainstBudget(nutrients, budget, tolerance);
    iterations += 1;
  }

  return { ingredients: current, nutrients, validation, iterations };
}

/**
 * Allergy, exclusion and dietary-rule enforcement.
 *
 * Runs on every AI output, every meal swap and every rebalance. The model is not
 * trusted to have respected the constraints it was given — it is checked.
 * Exclusions override preferences without exception (spec §35).
 */
export type ExclusionViolation = {
  foodId: string;
  foodName: string;
  reason: 'allergy' | 'intolerance' | 'dietary_rule' | 'manual_exclusion' | 'unknown_food';
  detail: string;
};

export function findExclusionViolations(
  ingredients: MealIngredient[],
  preferences: FoodPreferences,
  lookup: FoodLookup,
): ExclusionViolation[] {
  const violations: ExclusionViolation[] = [];

  for (const ingredient of ingredients) {
    const food = lookup(ingredient.foodId);

    if (!food) {
      violations.push({
        foodId: ingredient.foodId,
        foodName: ingredient.foodName,
        reason: 'unknown_food',
        detail: 'Food is not in the structured food database.',
      });
      continue;
    }

    if (preferences.allergies.includes(food.id)) {
      violations.push({
        foodId: food.id,
        foodName: food.name,
        reason: 'allergy',
        detail: `${food.name} is listed as an allergy.`,
      });
      continue;
    }

    if (preferences.intolerances.includes(food.id)) {
      violations.push({
        foodId: food.id,
        foodName: food.name,
        reason: 'intolerance',
        detail: `${food.name} is listed as an intolerance.`,
      });
      continue;
    }

    if (preferences.manualExclusions.includes(food.id)) {
      violations.push({
        foodId: food.id,
        foodName: food.name,
        reason: 'manual_exclusion',
        detail: `${food.name} was excluded by choice.`,
      });
      continue;
    }

    if (preferences.states[food.id] === 'keep_it_out') {
      violations.push({
        foodId: food.id,
        foodName: food.name,
        reason: 'manual_exclusion',
        detail: `${food.name} is marked KEEP IT OUT.`,
      });
      continue;
    }

    for (const rule of preferences.dietaryRules) {
      if (!food.tags.includes(rule)) {
        violations.push({
          foodId: food.id,
          foodName: food.name,
          reason: 'dietary_rule',
          detail: `${food.name} does not meet the ${rule.replace('_', ' ')} requirement.`,
        });
        break;
      }
    }
  }

  return violations;
}

/** A meal option is acceptable only if it both validates and breaks no exclusion. */
export function isMealAcceptable(
  option: MealOption,
  budget: MealNutrients,
  preferences: FoodPreferences,
  lookup: FoodLookup,
  tolerance: ValidationTolerance = MEAL_TOLERANCE,
): { acceptable: boolean; validation: ValidationResult; violations: ExclusionViolation[] } {
  const violations = findExclusionViolations(option.ingredients, preferences, lookup);
  const nutrients = calculateMealNutrients(option.ingredients, lookup) ?? ZERO_NUTRIENTS;
  const validation = validateAgainstBudget(nutrients, budget, tolerance);

  return {
    acceptable: violations.length === 0 && validation.valid,
    validation,
    violations,
  };
}

/**
 * Split a day's targets across meals.
 *
 * Snacks take a smaller share than main meals; the remainder is squared off on
 * the last meal so the parts sum exactly to the day rather than drifting by a few
 * kcal per meal.
 */
export function splitDailyBudget(
  targets: MealNutrients,
  mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'>,
): MealNutrients[] {
  const weightFor = (type: string): number => (type === 'snack' ? 0.6 : 1);
  const weights = mealTypes.map(weightFor);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const budgets = weights.map((weight) => {
    const share = weight / totalWeight;
    return {
      calories: Math.round(targets.calories * share),
      proteinG: Math.round(targets.proteinG * share),
      carbsG: Math.round(targets.carbsG * share),
      fatG: Math.round(targets.fatG * share),
      fibreG: Math.round(targets.fibreG * share),
    };
  });

  const last = budgets[budgets.length - 1];
  if (last) {
    const summed = sumNutrients(budgets);
    last.calories += targets.calories - summed.calories;
    last.proteinG += targets.proteinG - summed.proteinG;
    last.carbsG += targets.carbsG - summed.carbsG;
    last.fatG += targets.fatG - summed.fatG;
    last.fibreG += targets.fibreG - summed.fibreG;
  }

  return budgets;
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}
