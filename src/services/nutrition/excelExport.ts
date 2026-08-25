import * as XLSX from 'xlsx';
import type {
  EnergyCalculation,
  MealPlan,
  MealPrepItem,
  NutritionProfile,
  ShoppingList,
} from '@/types';
import { AISLE_LABELS, formatPortion, findFood } from '@/data/foods';

/**
 * Excel export (spec §48).
 *
 * Produces a genuine .xlsx workbook — eight sheets, headers, sensible column
 * widths — rather than a CSV with a misleading extension or a raw table dump.
 * The spec is explicit that this should be professionally formatted.
 *
 * Generation is pure: it takes data and returns base64. Writing to disk and
 * handing off to the native share sheet is the caller's job, which keeps this
 * testable in node without mocking the filesystem.
 *
 * The Targets sheet carries the disclaimer and the equation and policy versions,
 * because an exported file outlives the app screen it came from and needs to
 * stay honest about what it is.
 */

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export type ExportInput = {
  plan: MealPlan;
  energy: EnergyCalculation;
  profile: NutritionProfile;
  shoppingList: ShoppingList;
  mealPrep: MealPrepItem[];
  displayName: string;
  disclaimerText: string;
  /** Scanned and hand-entered foods, exported separately (spec §36). */
  myFoods?: ExportedFood[];
};

/**
 * A saved food as it appears in the workbook.
 *
 * Kept structural rather than importing the scanner's store type, so the
 * export stays a pure data-in/data-out module with no dependency on app state.
 */
export type ExportedFood = {
  name: string;
  brand?: string;
  gtin?: string;
  basis: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSizeG?: number;
  source: string;
  verificationStatus: string;
  savedAt: string;
};

type Row = Array<string | number>;

function sheet(rows: Row[], widths: number[]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  // Column widths are what stop the export reading as a raw table dump.
  ws['!cols'] = widths.map((w) => ({ wch: w }));
  return ws;
}

function buildWeeklyPlan(plan: MealPlan): XLSX.WorkSheet {
  const rows: Row[] = [
    ['Day', 'Date', 'Training day', 'Meal', 'Selected option', 'kcal', 'Protein (g)', 'Carbs (g)', 'Fat (g)'],
  ];

  for (const day of plan.days) {
    for (const meal of day.meals) {
      const option = meal.options.find((o) => o.id === meal.selectedOptionId);
      if (!option) continue;

      rows.push([
        WEEKDAYS[day.dayOfWeek - 1] ?? '',
        day.date,
        day.isTrainingDay ? 'Yes' : 'No',
        meal.type,
        option.name,
        option.nutrients.calories,
        option.nutrients.proteinG,
        option.nutrients.carbsG,
        option.nutrients.fatG,
      ]);
    }
  }

  return sheet(rows, [12, 12, 13, 12, 40, 8, 12, 11, 9]);
}

function buildDailyMacros(plan: MealPlan): XLSX.WorkSheet {
  const rows: Row[] = [
    ['Day', 'Date', 'Target kcal', 'Plan kcal', 'Difference',
     'Target P', 'Plan P', 'Target C', 'Plan C', 'Target F', 'Plan F'],
  ];

  for (const day of plan.days) {
    rows.push([
      WEEKDAYS[day.dayOfWeek - 1] ?? '',
      day.date,
      day.targets.calories,
      day.totals.calories,
      day.totals.calories - day.targets.calories,
      day.targets.proteinG,
      day.totals.proteinG,
      day.targets.carbsG,
      day.totals.carbsG,
      day.targets.fatG,
      day.totals.fatG,
    ]);
  }

  return sheet(rows, [12, 12, 12, 11, 11, 9, 8, 9, 8, 9, 8]);
}

function buildMealOptions(plan: MealPlan): XLSX.WorkSheet {
  const rows: Row[] = [
    ['Day', 'Meal', 'Option', 'Name', 'kcal', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Selected'],
  ];

  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const option of meal.options) {
        rows.push([
          WEEKDAYS[day.dayOfWeek - 1] ?? '',
          meal.type,
          option.slot,
          option.name,
          option.nutrients.calories,
          option.nutrients.proteinG,
          option.nutrients.carbsG,
          option.nutrients.fatG,
          option.id === meal.selectedOptionId ? 'Yes' : '',
        ]);
      }
    }
  }

  return sheet(rows, [12, 12, 8, 40, 8, 12, 11, 9, 10]);
}

function buildRecipes(plan: MealPlan): XLSX.WorkSheet {
  const rows: Row[] = [
    ['Meal', 'Option', 'Ingredient', 'Quantity', 'State', 'Prep (min)', 'Cook (min)', 'Method'],
  ];

  const seen = new Set<string>();

  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const option of meal.options) {
        // Options repeat across the week; the recipe only needs listing once.
        if (seen.has(option.name)) continue;
        seen.add(option.name);

        option.ingredients.forEach((ingredient, i) => {
          rows.push([
            i === 0 ? option.name : '',
            i === 0 ? option.slot : '',
            ingredient.foodName,
            `${ingredient.grams} g`,
            ingredient.state,
            i === 0 ? option.recipe.prepMinutes : '',
            i === 0 ? option.recipe.cookMinutes : '',
            i === 0 ? option.recipe.steps.join(' ') : '',
          ]);
        });
      }
    }
  }

  return sheet(rows, [34, 8, 26, 12, 10, 11, 11, 90]);
}

function buildShoppingList(list: ShoppingList): XLSX.WorkSheet {
  const rows: Row[] = [['Aisle', 'Item', 'Quantity', 'State', 'Picked up']];

  for (const item of list.items) {
    rows.push([
      AISLE_LABELS[item.aisle],
      item.foodName,
      item.totalGrams >= 1000
        ? `${(item.totalGrams / 1000).toFixed(2)} kg`
        : `${Math.ceil(item.totalGrams)} g`,
      item.state === 'as_sold' ? '' : item.state,
      '',
    ]);
  }

  return sheet(rows, [18, 26, 12, 10, 12]);
}

function buildMealPrep(items: MealPrepItem[]): XLSX.WorkSheet {
  const rows: Row[] = [['Item', 'Total quantity', 'State', 'Used in']];

  for (const item of items) {
    rows.push([
      item.foodName,
      item.totalGrams >= 1000
        ? `${(item.totalGrams / 1000).toFixed(2)} kg`
        : `${Math.ceil(item.totalGrams)} g`,
      item.state === 'as_sold' ? '' : item.state,
      item.usedIn.join(', '),
    ]);
  }

  return sheet(rows, [26, 15, 10, 60]);
}

function buildTargets(input: ExportInput): XLSX.WorkSheet {
  const { energy, profile, plan, displayName, disclaimerText } = input;

  const rows: Row[] = [
    ['RABID: THE KENNEL', ''],
    ['Nutrition plan', ''],
    ['', ''],
    ['Prepared for', displayName],
    ['Week starting', plan.weekStarting],
    ['Generated', new Date().toISOString().slice(0, 10)],
    ['', ''],
    ['TARGETS', ''],
    ['Daily calories', energy.targetCalories],
    ['Protein (g)', energy.macros.proteinG],
    ['Carbohydrate (g)', energy.macros.carbsG],
    ['Fat (g)', energy.macros.fatG],
    ['Fibre (g)', energy.macros.fibreG],
    ['', ''],
    ['HOW THESE WERE CALCULATED', ''],
    ['Equation', energy.equation === 'mifflin_st_jeor' ? 'Mifflin-St Jeor' : 'Katch-McArdle'],
    ['Equation version', energy.equationVersion],
    ['Safety policy version', energy.policyVersion],
    ['BMR', energy.bmr],
    ['Activity multiplier', energy.activityMultiplier],
    ['Estimated maintenance', energy.maintenanceCalories],
    ['Adjustment', energy.calorieAdjustment],
    ['', ''],
    ['PROFILE', ''],
    ['Goal', profile.goal.replace(/_/g, ' ')],
    ['Current weight (kg)', profile.currentWeightKg],
    ['Target weight (kg)', profile.targetWeightKg ?? 'Not set'],
    ['Activity level', profile.activityLevel.replace(/_/g, ' ')],
    ['Meals per day', profile.mealsPerDay],
    ['', ''],
    ['IMPORTANT', ''],
  ];

  // Wrapped so the disclaimer stays readable in a spreadsheet cell.
  for (const line of wrapText(disclaimerText, 110)) {
    rows.push([line, '']);
  }

  return sheet(rows, [40, 30]);
}

function wrapText(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current.length + word.length + 1 > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * My Foods (spec §36).
 *
 * Scanned and hand-entered foods are marked clearly as user-confirmed rather
 * than mixed in with the curated catalogue, because a printed plan that hides
 * which figures came off a phone camera is misleading.
 */
function buildMyFoods(foods: ExportedFood[]): XLSX.WorkSheet {
  const rows: Row[] = [
    ['Name', 'Brand', 'Barcode', 'Basis', 'kcal', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Serving (g)', 'Added by', 'Checked', 'Saved'],
  ];

  for (const food of foods) {
    rows.push([
      food.name,
      food.brand ?? '',
      food.gtin ?? '',
      BASIS_LABELS[food.basis] ?? food.basis,
      Math.round(food.kcal),
      Math.round(food.proteinG),
      Math.round(food.carbsG),
      Math.round(food.fatG),
      food.servingSizeG ?? '',
      SOURCE_LABELS[food.source] ?? food.source,
      VERIFICATION_LABELS[food.verificationStatus] ?? food.verificationStatus,
      food.savedAt.slice(0, 10),
    ]);
  }

  if (foods.length === 0) {
    rows.push(['No scanned or custom foods saved yet.']);
  } else {
    rows.push([]);
    rows.push([
      'These figures were confirmed by you against the packaging. Allergen information from product databases is not a guarantee — always check the physical pack.',
    ]);
  }

  return sheet(rows, [30, 18, 16, 14, 9, 12, 11, 9, 12, 14, 16, 12]);
}

const BASIS_LABELS: Record<string, string> = {
  per_100g: 'Per 100g',
  per_100ml: 'Per 100ml',
  per_serving: 'Per serving',
};

const SOURCE_LABELS: Record<string, string> = {
  barcode: 'Barcode scan',
  label: 'Label scan',
  manual: 'Entered by hand',
};

const VERIFICATION_LABELS: Record<string, string> = {
  provider_unverified: 'Database, unconfirmed',
  user_confirmed: 'You confirmed it',
  moderator_verified: 'Moderator checked',
  manufacturer_verified: 'Manufacturer checked',
  rejected: 'Rejected',
};

/** Build the workbook and return it as base64, ready to write to a file. */
export function buildWorkbookBase64(input: ExportInput): string {
  const workbook = XLSX.utils.book_new();

  // Targets first: it is the cover sheet and carries the disclaimer.
  XLSX.utils.book_append_sheet(workbook, buildTargets(input), 'Targets & Profile');
  XLSX.utils.book_append_sheet(workbook, buildWeeklyPlan(input.plan), 'Weekly Plan');
  XLSX.utils.book_append_sheet(workbook, buildDailyMacros(input.plan), 'Daily Macros');
  XLSX.utils.book_append_sheet(workbook, buildMealOptions(input.plan), 'Meal Options');
  XLSX.utils.book_append_sheet(workbook, buildRecipes(input.plan), 'Recipes');
  XLSX.utils.book_append_sheet(workbook, buildShoppingList(input.shoppingList), 'Shopping List');
  XLSX.utils.book_append_sheet(workbook, buildMealPrep(input.mealPrep), 'Meal Prep');
  XLSX.utils.book_append_sheet(workbook, buildMyFoods(input.myFoods ?? []), 'My Foods');

  return XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
}

export function suggestedFilename(plan: MealPlan): string {
  return `rabid-kennel-plan-${plan.weekStarting}.xlsx`;
}

export { findFood, formatPortion };
