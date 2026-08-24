import type {
  FoodPreferences,
  MacroTargets,
  Meal,
  MealNutrients,
  MealOption,
  MealPlan,
  MealPlanDay,
  MealType,
  NutritionProfile,
  ShoppingList,
  ShoppingListItem,
  MealIngredient,
  MealPrepDays,
  MealPrepItem,
} from '@/types';
import { FOODS, findFood } from '@/data/foods';
import {
  MEAL_TOLERANCE,
  findExclusionViolations,
  fitMealToBudget,
  splitDailyBudget,
  sumNutrients,
  roundNutrients,
} from '@/engines/nutrition/validation';
import { ProposedMealSchema, type AIProvider, type ProposedMeal } from '@/services/ai/types';

/**
 * The meal-plan pipeline (spec §27, §29, §40).
 *
 *   targets (deterministic)
 *       |
 *   allowed foods (exclusions applied)
 *       |
 *   AI composes a meal - food ids and grams only
 *       |
 *   schema validation
 *       |
 *   exclusion re-check          <- the model is not trusted to have obeyed
 *       |
 *   nutrients computed from food data
 *       |
 *   portions fitted to budget
 *       |
 *   accepted only inside tolerance
 *
 * Anything that fails a step is dropped, not patched up and shown anyway. If a
 * meal slot ends with no acceptable option, the caller is told - an unvalidated
 * plan is never presented as final (spec §56).
 */

export type PlanBuildFailure = {
  day: number;
  mealType: MealType;
  reason: 'no_options' | 'all_rejected' | 'provider_error';
  detail: string;
};

export type PlanBuildResult = {
  plan: MealPlan | null;
  failures: PlanBuildFailure[];
};

/**
 * Foods the planner may use: everything minus allergies, intolerances, manual
 * exclusions, KEEP IT OUT choices, and anything failing a dietary rule.
 */
export function allowedFoodIds(preferences: FoodPreferences): string[] {
  return FOODS.filter((food) => {
    const probe: MealIngredient = {
      foodId: food.id,
      foodName: food.name,
      grams: 100,
      state: food.state,
    };
    return findExclusionViolations([probe], preferences, findFood).length === 0;
  }).map((food) => food.id);
}

export function preferredFoodIds(preferences: FoodPreferences): string[] {
  return Object.entries(preferences.states)
    .filter(([, state]) => state === 'love_it')
    .map(([foodId]) => foodId);
}

export function mealTypesFor(mealsPerDay: number): MealType[] {
  switch (Math.max(3, Math.min(6, mealsPerDay))) {
    case 3:
      return ['breakfast', 'lunch', 'dinner'];
    case 4:
      return ['breakfast', 'lunch', 'dinner', 'snack'];
    case 5:
      return ['breakfast', 'snack', 'lunch', 'dinner', 'snack'];
    default:
      return ['breakfast', 'snack', 'lunch', 'snack', 'dinner', 'snack'];
  }
}

/**
 * Training-day carb cycling (spec §45).
 * Carbohydrate moves between training and rest days; protein and fat are held
 * constant, so only the fuel shifts.
 */
export const TRAINING_DAY_CARB_SHIFT = 0.15;

export function targetsForDay(
  base: MacroTargets,
  isTrainingDay: boolean,
  split: boolean,
): MacroTargets {
  if (!split) return base;

  const shift = Math.round(base.carbsG * TRAINING_DAY_CARB_SHIFT);
  const carbsG = isTrainingDay ? base.carbsG + shift : base.carbsG - shift;
  const calorieDelta = (carbsG - base.carbsG) * 4;

  return { ...base, carbsG, calories: base.calories + calorieDelta };
}

type BuildMealArgs = {
  provider: AIProvider;
  mealType: MealType;
  budget: MealNutrients;
  preferences: FoodPreferences;
  allowed: string[];
  preferred: string[];
  avoid: string[];
  optionCount: 1 | 2 | 3;
  seed: string;
  makeId: () => string;
};

/**
 * Build the option set for a single meal slot.
 * Returns only options that survived every check.
 */
export async function buildMealOptions(args: BuildMealArgs): Promise<MealOption[]> {
  const { provider, budget, preferences, makeId } = args;

  let proposals: ProposedMeal[] = [];
  try {
    const set = await provider.generateMealOptions({
      mealType: args.mealType,
      budget: {
        calories: budget.calories,
        proteinG: budget.proteinG,
        carbsG: budget.carbsG,
        fatG: budget.fatG,
      },
      allowedFoodIds: args.allowed,
      preferredFoodIds: args.preferred,
      optionCount: args.optionCount,
      // Ask for spares so a rejected proposal does not empty the slot.
      candidateCount: args.optionCount + 4,
      avoidFoodIds: args.avoid,
      seed: args.seed,
    });
    proposals = set.options;
  } catch {
    // A provider failure yields no options rather than an unchecked plan.
    return [];
  }

  const accepted: MealOption[] = [];
  const slots: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];

  for (const proposal of proposals) {
    if (accepted.length >= args.optionCount) break;

    // 1. Schema. Malformed output is discarded, never coerced.
    const parsed = ProposedMealSchema.safeParse(proposal);
    if (!parsed.success) continue;

    const ingredients: MealIngredient[] = [];
    let resolvable = true;

    for (const item of parsed.data.ingredients) {
      const food = findFood(item.foodId);
      if (!food) {
        resolvable = false;
        break;
      }
      ingredients.push({
        foodId: food.id,
        foodName: food.name,
        grams: item.grams,
        state: food.state,
      });
    }
    if (!resolvable) continue;

    // 2. Exclusions, re-checked against the user's own rules.
    if (findExclusionViolations(ingredients, preferences, findFood).length > 0) continue;

    // 3. Nutrients from food data, portions fitted to budget.
    const fitted = fitMealToBudget(ingredients, budget, findFood, MEAL_TOLERANCE);
    if (!fitted || !fitted.validation.valid) continue;

    accepted.push({
      id: makeId(),
      slot: slots[accepted.length] ?? 'C',
      name: parsed.data.mealName,
      ingredients: fitted.ingredients,
      nutrients: fitted.nutrients,
      recipe: {
        prepMinutes: parsed.data.prepMinutes,
        cookMinutes: parsed.data.cookMinutes,
        steps: parsed.data.preparation,
      },
    });
  }

  return accepted;
}

export type BuildPlanArgs = {
  provider: AIProvider;
  profile: NutritionProfile;
  preferences: FoodPreferences;
  targets: MacroTargets;
  weekStarting: string;
  energyCalculationId: string;
  /** Which weekdays are training days. 1 = Monday. */
  trainingDays: number[];
  splitTrainingDays: boolean;
  makeId: () => string;
};

/** Generate a full Monday-Sunday plan (spec §39). */
export async function buildMealPlan(args: BuildPlanArgs): Promise<PlanBuildResult> {
  const allowed = allowedFoodIds(args.preferences);
  const preferred = preferredFoodIds(args.preferences);
  const mealTypes = mealTypesFor(args.profile.mealsPerDay);

  const failures: PlanBuildFailure[] = [];
  const days: MealPlanDay[] = [];

  for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek += 1) {
    const isTrainingDay = args.trainingDays.includes(dayOfWeek);
    const dayTargets = targetsForDay(args.targets, isTrainingDay, args.splitTrainingDays);

    const budgets = splitDailyBudget(
      {
        calories: dayTargets.calories,
        proteinG: dayTargets.proteinG,
        carbsG: dayTargets.carbsG,
        fatG: dayTargets.fatG,
        fibreG: dayTargets.fibreG,
      },
      mealTypes,
    );

    const meals: Meal[] = [];
    // Tracked across the day so lunch and dinner are not the same chicken and rice.
    const usedFoodIds: string[] = [];

    for (let index = 0; index < mealTypes.length; index += 1) {
      const mealType = mealTypes[index]!;
      const budget = budgets[index]!;

      const options = await buildMealOptions({
        provider: args.provider,
        mealType,
        budget,
        preferences: args.preferences,
        allowed,
        preferred,
        avoid: usedFoodIds,
        optionCount: 3,
        seed: `${args.weekStarting}:${dayOfWeek}:${index}`,
        makeId: args.makeId,
      });

      if (options.length === 0) {
        failures.push({
          day: dayOfWeek,
          mealType,
          reason: 'all_rejected',
          detail: 'No proposed option passed validation for this meal.',
        });
        continue;
      }

      const primary = options[0]!;
      usedFoodIds.push(...primary.ingredients.map((i) => i.foodId));

      meals.push({
        id: args.makeId(),
        type: mealType,
        budget,
        options,
        selectedOptionId: primary.id,
      });
    }

    days.push({
      id: args.makeId(),
      dayOfWeek,
      date: addDays(args.weekStarting, dayOfWeek - 1),
      isTrainingDay,
      targets: dayTargets,
      meals,
      totals: totalsForDay(meals),
    });
  }

  if (!days.some((day) => day.meals.length > 0)) {
    return { plan: null, failures };
  }

  return {
    plan: {
      id: args.makeId(),
      userId: args.profile.userId,
      createdAt: new Date().toISOString(),
      weekStarting: args.weekStarting,
      targets: args.targets,
      energyCalculationId: args.energyCalculationId,
      days,
      splitTrainingDays: args.splitTrainingDays,
    },
    failures,
  };
}

/** Totals from each meal's *selected* option, so swaps are reflected immediately. */
export function totalsForDay(meals: Meal[]): MealNutrients {
  const selected = meals
    .map((meal) => meal.options.find((o) => o.id === meal.selectedOptionId))
    .filter((option): option is MealOption => option != null);

  return roundNutrients(sumNutrients(selected.map((o) => o.nutrients)));
}

/** Shopping list from the accepted plan (spec §47). */
export function buildShoppingList(plan: MealPlan): ShoppingList {
  const totals = new Map<string, ShoppingListItem>();

  for (const day of plan.days) {
    for (const meal of day.meals) {
      const option = meal.options.find((o) => o.id === meal.selectedOptionId);
      if (!option) continue;

      for (const ingredient of option.ingredients) {
        const food = findFood(ingredient.foodId);
        if (!food) continue;

        // Key on food *and* state - 500g of dry rice is not 500g of cooked rice.
        const key = `${food.id}:${ingredient.state}`;
        const existing = totals.get(key);

        if (existing) {
          existing.totalGrams += ingredient.grams;
        } else {
          totals.set(key, {
            foodId: food.id,
            foodName: food.name,
            aisle: food.aisle,
            totalGrams: ingredient.grams,
            state: ingredient.state,
            checked: false,
          });
        }
      }
    }
  }

  return {
    planId: plan.id,
    items: [...totals.values()].sort(
      (a, b) => a.aisle.localeCompare(b.aisle) || a.foodName.localeCompare(b.foodName),
    ),
    generatedAt: new Date().toISOString(),
  };
}

/** Consolidated prep quantities for the first N days (spec §46). */
export function buildMealPrep(plan: MealPlan, days: MealPrepDays): MealPrepItem[] {
  const totals = new Map<string, MealPrepItem>();

  for (const day of plan.days.slice(0, days)) {
    for (const meal of day.meals) {
      const option = meal.options.find((o) => o.id === meal.selectedOptionId);
      if (!option) continue;

      for (const ingredient of option.ingredients) {
        const key = `${ingredient.foodId}:${ingredient.state}`;
        const existing = totals.get(key);

        if (existing) {
          existing.totalGrams += ingredient.grams;
          if (!existing.usedIn.includes(option.name)) existing.usedIn.push(option.name);
        } else {
          totals.set(key, {
            foodName: ingredient.foodName,
            totalGrams: ingredient.grams,
            state: ingredient.state,
            usedIn: [option.name],
          });
        }
      }
    }
  }

  // Prep is about the bulk items worth batching, not a gram of soy sauce.
  return [...totals.values()]
    .filter((item) => item.totalGrams >= 100)
    .sort((a, b) => b.totalGrams - a.totalGrams);
}

/**
 * Live day rebalancing (spec §44).
 *
 * Returns a proposal only. The caller must have the user approve it - the plan is
 * never silently altered.
 */
export type RebalanceProposal = {
  drift: { calories: number; proteinG: number; carbsG: number; fatG: number };
  adjustableMeals: MealType[];
  message: string;
};

export function proposeRebalance(
  day: MealPlanDay,
  consumed: MealNutrients,
  eatenMealIds: string[],
): RebalanceProposal | null {
  const eaten = day.meals.filter((meal) => eatenMealIds.includes(meal.id));
  const remaining = day.meals.filter((meal) => !eatenMealIds.includes(meal.id));
  if (remaining.length === 0) return null;

  // Drift is what was actually eaten against what those meals were budgeted at.
  const plannedSoFar = roundNutrients(sumNutrients(eaten.map((meal) => meal.budget)));
  const drift = {
    calories: Math.round(consumed.calories - plannedSoFar.calories),
    proteinG: Math.round(consumed.proteinG - plannedSoFar.proteinG),
    carbsG: Math.round(consumed.carbsG - plannedSoFar.carbsG),
    fatG: Math.round(consumed.fatG - plannedSoFar.fatG),
  };

  // Small drift is normal eating, not something to reorganise a day around.
  const meaningful =
    Math.abs(drift.calories) > 100 ||
    Math.abs(drift.proteinG) > 15 ||
    Math.abs(drift.carbsG) > 20 ||
    Math.abs(drift.fatG) > 10;

  if (!meaningful) return null;

  const parts: string[] = [];
  if (Math.abs(drift.carbsG) > 5) parts.push(`${signed(drift.carbsG)}g carbs`);
  if (Math.abs(drift.proteinG) > 5) parts.push(`${signed(drift.proteinG)}g protein`);
  if (Math.abs(drift.fatG) > 5) parts.push(`${signed(drift.fatG)}g fat`);

  return {
    drift,
    adjustableMeals: remaining.map((meal) => meal.type),
    message: `You are approximately ${parts.join(', ')}.`,
  };
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
