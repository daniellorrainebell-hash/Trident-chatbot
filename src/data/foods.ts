import type { FoodItem, FoodCategory, FoodTag, ShoppingAisle, FoodState } from '@/types';

/**
 * Structured food data (spec §36).
 *
 * Nutrient values are per 100 g and every entry declares its state — raw, dry,
 * cooked or as sold. Mixing those silently is how a meal plan ends up hundreds of
 * calories out (spec §37): 100 g of dry rice and 100 g of cooked rice differ by a
 * factor of roughly three.
 *
 * Values here are development data compiled from published composition tables and
 * rounded to sensible precision. Before launch this table should be replaced with,
 * or reconciled against, a licensed source — and spec §36 requires the commercial
 * rights to be verified first. `source` and `sourceVersion` exist so a swap is
 * traceable per row rather than a silent bulk overwrite.
 *
 * An LLM never writes to this table and never supplies a nutrient figure.
 */

const SOURCE = 'kennel-dev-composition';
const SOURCE_VERSION = '2026.03';

function f(
  id: string,
  name: string,
  category: FoodCategory,
  aisle: ShoppingAisle,
  state: FoodState,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  fibre: number,
  typicalPortionG: number,
  tags: FoodTag[],
  aliases: string[] = [],
): FoodItem {
  return {
    id, name, aliases, category, aisle, state,
    kcalPer100g: kcal,
    proteinPer100g: protein,
    carbsPer100g: carbs,
    fatPer100g: fat,
    fibrePer100g: fibre,
    typicalPortionG,
    source: SOURCE,
    sourceVersion: SOURCE_VERSION,
    tags,
  };
}

/**
 * Tags are composed rather than hand-listed per row.
 *
 * The allergen checks fail closed — a food is unsafe for an allergen group
 * unless it positively carries the matching "-free" tag — so a missing tag
 * silently excludes a food that is perfectly fine. Hand-maintaining five
 * allergen flags across seventy rows is exactly where that mistake happens.
 *
 * So each food starts from a base of "free of everything" and names only what it
 * actually contains. Getting a row wrong then reads as an obvious omission in
 * one short list, not as a missing entry in a long one.
 */
const ALL_FREE: FoodTag[] = ['gluten_free', 'dairy_free', 'nut_free', 'egg_free', 'soy_free'];

type Contains = 'gluten' | 'dairy' | 'nuts' | 'eggs' | 'soy';

const FREE_TAG: Record<Contains, FoodTag> = {
  gluten: 'gluten_free',
  dairy: 'dairy_free',
  nuts: 'nut_free',
  eggs: 'egg_free',
  soy: 'soy_free',
};

/** Diet suitability, independent of allergens. */
type Diet = 'vegan' | 'vegetarian' | 'pescatarian' | 'meat';

function dietTags(diet: Diet): FoodTag[] {
  switch (diet) {
    case 'vegan':
      return ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher'];
    case 'vegetarian':
      return ['vegetarian', 'pescatarian', 'halal', 'kosher'];
    case 'pescatarian':
      return ['pescatarian', 'halal'];
    case 'meat':
      return ['halal'];
  }
}

/** Build a food's tag set from its diet, what it contains, and any extras. */
function tags(diet: Diet, contains: Contains[] = [], extra: FoodTag[] = []): FoodTag[] {
  const excluded = new Set(contains.map((c) => FREE_TAG[c]));
  return [
    ...dietTags(diet),
    ...ALL_FREE.filter((tag) => !excluded.has(tag)),
    ...extra,
  ];
}

export const FOODS: FoodItem[] = [
  // ── Protein ──────────────────────────────────────────────────────────────
  f('chicken-breast', 'Chicken breast', 'protein', 'meat_fish', 'raw', 106, 24.0, 0, 1.2, 0, 180, tags('meat', [], ['high_protein']), ['chicken']),
  f('chicken-thigh', 'Chicken thighs', 'protein', 'meat_fish', 'raw', 145, 19.5, 0, 7.4, 0, 150, tags('meat', [], ['high_protein'])),
  f('turkey-mince', 'Turkey mince', 'protein', 'meat_fish', 'raw', 148, 21.0, 0, 7.0, 0, 150, tags('meat', [], ['high_protein']), ['turkey']),
  f('lean-beef', 'Lean beef steak', 'protein', 'meat_fish', 'raw', 155, 22.5, 0, 7.0, 0, 200, tags('meat', [], ['high_protein']), ['steak', 'beef']),
  f('beef-mince-5', 'Lean beef mince (5%)', 'protein', 'meat_fish', 'raw', 135, 21.0, 0, 5.0, 0, 150, tags('meat', [], ['high_protein']), ['mince']),
  f('pork-loin', 'Pork loin', 'protein', 'meat_fish', 'raw', 143, 21.5, 0, 6.0, 0, 150, tags('meat', [], ['high_protein']), ['pork']),
  f('salmon', 'Salmon fillet', 'protein', 'meat_fish', 'raw', 208, 20.4, 0, 13.4, 0, 140, tags('pescatarian', [], ['high_protein'])),
  f('tuna-tinned', 'Tinned tuna', 'protein', 'meat_fish', 'drained', 108, 25.5, 0, 0.8, 0, 110, tags('pescatarian', [], ['high_protein']), ['tuna']),
  f('cod', 'Cod fillet', 'protein', 'meat_fish', 'raw', 82, 18.0, 0, 0.7, 0, 150, tags('pescatarian', [], ['high_protein'])),
  f('prawns', 'Prawns', 'protein', 'meat_fish', 'raw', 99, 20.5, 0.9, 1.1, 0, 120, tags('pescatarian', [], ['high_protein', 'shellfish']), ['shrimp']),
  f('eggs', 'Whole eggs', 'protein', 'dairy', 'raw', 143, 12.6, 0.7, 9.5, 0, 120, tags('vegetarian', ['eggs'], []), ['egg']),
  f('egg-whites', 'Egg whites', 'protein', 'dairy', 'raw', 52, 11.0, 0.7, 0.2, 0, 200, tags('vegetarian', ['eggs'], ['high_protein'])),
  f('greek-yoghurt', 'Greek yoghurt (0%)', 'protein', 'dairy', 'as_sold', 57, 10.0, 4.0, 0.4, 0, 200, tags('vegetarian', ['dairy'], ['high_protein']), ['yoghurt', 'yogurt']),
  f('cottage-cheese', 'Cottage cheese', 'protein', 'dairy', 'as_sold', 98, 12.5, 3.2, 4.3, 0, 200, tags('vegetarian', ['dairy'], ['high_protein'])),
  f('whey', 'Whey protein powder', 'protein', 'supplements', 'as_sold', 380, 78.0, 6.0, 5.0, 0, 30, tags('vegetarian', ['dairy'], ['high_protein']), ['protein powder', 'shake']),
  f('vegan-protein', 'Pea protein powder', 'protein', 'supplements', 'as_sold', 375, 76.0, 5.0, 5.5, 2.0, 30, tags('vegan', [], ['high_protein']), ['plant protein', 'vegan protein']),
  f('soy-yoghurt', 'High-protein soy yoghurt', 'protein', 'dairy', 'as_sold', 65, 9.0, 3.5, 1.8, 0.5, 200, tags('vegan', ['soy'], ['high_protein']), ['soya yoghurt', 'plant yoghurt']),
  f('tofu', 'Firm tofu', 'protein', 'dairy', 'as_sold', 144, 15.8, 2.8, 8.7, 1.2, 150, tags('vegan', ['soy'], ['high_protein'])),
  f('tempeh', 'Tempeh', 'protein', 'dairy', 'as_sold', 192, 20.3, 7.6, 10.8, 1.4, 120, tags('vegan', ['soy'], ['high_protein'])),
  f('black-beans', 'Black beans', 'protein', 'pantry', 'drained', 91, 6.0, 12.0, 0.5, 5.5, 120, tags('vegan'), ['beans']),
  f('lentils', 'Lentils', 'protein', 'pantry', 'dry', 353, 25.8, 45.0, 1.1, 11.0, 80, tags('vegan')),
  f('chickpeas', 'Chickpeas', 'protein', 'pantry', 'drained', 119, 7.2, 13.8, 2.6, 6.0, 120, tags('vegan')),

  // ── Carbohydrate ─────────────────────────────────────────────────────────
  f('basmati-rice', 'Basmati rice', 'carbohydrate', 'carbohydrates', 'dry', 356, 8.5, 78.0, 1.0, 1.4, 75, tags('vegan'), ['rice']),
  f('brown-rice', 'Brown rice', 'carbohydrate', 'carbohydrates', 'dry', 348, 8.0, 72.0, 2.5, 3.5, 75, tags('vegan')),
  f('potatoes', 'White potatoes', 'carbohydrate', 'fruit_veg', 'raw', 77, 2.0, 17.0, 0.1, 2.2, 300, tags('vegan'), ['potato']),
  f('sweet-potatoes', 'Sweet potatoes', 'carbohydrate', 'fruit_veg', 'raw', 86, 1.6, 20.1, 0.1, 3.0, 250, tags('vegan'), ['sweet potato']),
  f('pasta', 'Dried pasta', 'carbohydrate', 'carbohydrates', 'dry', 358, 12.5, 71.0, 1.5, 3.2, 80, tags('vegan', ['gluten'], [])),
  f('oats', 'Porridge oats', 'carbohydrate', 'carbohydrates', 'dry', 379, 13.2, 60.0, 8.0, 10.0, 60, tags('vegan', ['gluten'], []), ['oats', 'porridge']),
  f('wholemeal-bread', 'Wholemeal bread', 'carbohydrate', 'carbohydrates', 'as_sold', 247, 10.5, 41.0, 3.0, 6.5, 80, tags('vegan', ['gluten'], []), ['bread', 'toast']),
  f('bagel', 'Bagel', 'carbohydrate', 'carbohydrates', 'as_sold', 275, 10.5, 52.0, 1.5, 2.3, 85, tags('vegan', ['gluten'], [])),
  f('wrap', 'Tortilla wrap', 'carbohydrate', 'carbohydrates', 'as_sold', 297, 8.0, 49.0, 7.0, 3.0, 62, tags('vegan', ['gluten'], []), ['wraps', 'tortilla']),
  f('couscous', 'Couscous', 'carbohydrate', 'carbohydrates', 'dry', 376, 12.8, 72.0, 0.6, 5.0, 75, tags('vegan', ['gluten'], [])),
  f('quinoa', 'Quinoa', 'carbohydrate', 'carbohydrates', 'dry', 368, 14.1, 64.0, 6.1, 7.0, 75, tags('vegan')),
  f('noodles', 'Egg noodles', 'carbohydrate', 'carbohydrates', 'dry', 350, 12.0, 71.0, 2.0, 3.0, 75, tags('vegetarian', ['gluten', 'eggs'], [])),
  f('rice-cakes', 'Rice cakes', 'carbohydrate', 'carbohydrates', 'as_sold', 387, 8.0, 81.0, 3.0, 2.5, 20, tags('vegan')),

  // ── Fat ──────────────────────────────────────────────────────────────────
  f('avocado', 'Avocado', 'fat', 'fruit_veg', 'as_sold', 160, 2.0, 8.5, 14.7, 6.7, 100, tags('vegan')),
  f('olive-oil', 'Olive oil', 'fat', 'pantry', 'as_sold', 884, 0, 0, 100.0, 0, 10, tags('vegan'), ['oil']),
  f('peanut-butter', 'Peanut butter', 'fat', 'pantry', 'as_sold', 588, 25.1, 20.0, 50.4, 6.0, 30, tags('vegan', ['nuts'], []), ['pb']),
  f('almonds', 'Almonds', 'fat', 'pantry', 'as_sold', 579, 21.2, 21.6, 49.9, 12.5, 30, tags('vegan', ['nuts'], [])),
  f('cashews', 'Cashews', 'fat', 'pantry', 'as_sold', 553, 18.2, 30.2, 43.9, 3.3, 30, tags('vegan', ['nuts'], [])),
  f('walnuts', 'Walnuts', 'fat', 'pantry', 'as_sold', 654, 15.2, 13.7, 65.2, 6.7, 30, tags('vegan', ['nuts'], [])),
  f('mixed-seeds', 'Mixed seeds', 'fat', 'pantry', 'as_sold', 559, 20.0, 15.0, 45.0, 9.0, 25, tags('vegan'), ['seeds']),
  f('cheddar', 'Cheddar cheese', 'fat', 'dairy', 'as_sold', 402, 25.0, 1.3, 33.0, 0, 40, tags('vegetarian', ['dairy'], []), ['cheese']),
  f('dark-chocolate', 'Dark chocolate (85%)', 'fat', 'pantry', 'as_sold', 592, 9.5, 21.0, 50.0, 10.9, 20, tags('vegetarian', ['dairy'], []), ['chocolate']),

  // ── Vegetables ───────────────────────────────────────────────────────────
  f('broccoli', 'Broccoli', 'vegetable', 'fruit_veg', 'raw', 34, 2.8, 4.0, 0.4, 2.6, 150, tags('vegan')),
  f('spinach', 'Spinach', 'vegetable', 'fruit_veg', 'raw', 23, 2.9, 1.4, 0.4, 2.2, 100, tags('vegan')),
  f('peppers', 'Peppers', 'vegetable', 'fruit_veg', 'raw', 31, 1.0, 4.6, 0.3, 2.1, 120, tags('vegan'), ['bell pepper', 'capsicum']),
  f('onions', 'Onions', 'vegetable', 'fruit_veg', 'raw', 40, 1.1, 7.6, 0.1, 1.7, 80, tags('vegan'), ['onion']),
  f('courgette', 'Courgette', 'vegetable', 'fruit_veg', 'raw', 17, 1.2, 2.1, 0.3, 1.0, 150, tags('vegan'), ['zucchini']),
  f('green-beans', 'Green beans', 'vegetable', 'fruit_veg', 'raw', 31, 1.8, 4.5, 0.2, 2.7, 120, tags('vegan')),
  f('tomatoes', 'Tomatoes', 'vegetable', 'fruit_veg', 'raw', 18, 0.9, 2.7, 0.2, 1.2, 100, tags('vegan'), ['tomato']),
  f('mushrooms', 'Mushrooms', 'vegetable', 'fruit_veg', 'raw', 22, 3.1, 1.3, 0.3, 1.0, 100, tags('vegan')),
  f('carrots', 'Carrots', 'vegetable', 'fruit_veg', 'raw', 41, 0.9, 7.0, 0.2, 2.8, 100, tags('vegan')),
  f('asparagus', 'Asparagus', 'vegetable', 'fruit_veg', 'raw', 20, 2.2, 2.0, 0.1, 2.1, 120, tags('vegan')),
  f('mixed-salad', 'Mixed salad leaves', 'vegetable', 'fruit_veg', 'as_sold', 17, 1.4, 1.5, 0.2, 1.8, 80, tags('vegan'), ['salad']),

  // ── Fruit ────────────────────────────────────────────────────────────────
  f('banana', 'Banana', 'fruit', 'fruit_veg', 'as_sold', 89, 1.1, 22.8, 0.3, 2.6, 120, tags('vegan'), ['bananas']),
  f('apple', 'Apple', 'fruit', 'fruit_veg', 'as_sold', 52, 0.3, 13.8, 0.2, 2.4, 150, tags('vegan')),
  f('berries', 'Mixed berries', 'fruit', 'frozen', 'as_sold', 45, 1.0, 8.0, 0.4, 4.0, 100, tags('vegan'), ['blueberries', 'raspberries']),
  f('orange', 'Orange', 'fruit', 'fruit_veg', 'as_sold', 47, 0.9, 11.8, 0.1, 2.4, 150, tags('vegan')),
  f('pineapple', 'Pineapple', 'fruit', 'fruit_veg', 'as_sold', 50, 0.5, 13.1, 0.1, 1.4, 120, tags('vegan')),
  f('mango', 'Mango', 'fruit', 'fruit_veg', 'as_sold', 60, 0.8, 15.0, 0.4, 1.6, 120, tags('vegan')),

  // ── Dairy & pantry ───────────────────────────────────────────────────────
  f('semi-skimmed-milk', 'Semi-skimmed milk', 'dairy', 'dairy', 'as_sold', 47, 3.5, 4.8, 1.7, 0, 250, tags('vegetarian', ['dairy'], []), ['milk']),
  f('almond-milk', 'Unsweetened almond milk', 'dairy', 'dairy', 'as_sold', 13, 0.5, 0.3, 1.1, 0.3, 250, tags('vegan', ['nuts'], [])),
  f('honey', 'Honey', 'pantry', 'pantry', 'as_sold', 304, 0.3, 82.0, 0, 0.2, 20, tags('vegetarian')),
  f('passata', 'Passata', 'pantry', 'pantry', 'as_sold', 35, 1.5, 6.0, 0.2, 1.4, 200, tags('vegan'), ['tomato sauce']),
  f('soy-sauce', 'Soy sauce', 'pantry', 'pantry', 'as_sold', 53, 8.1, 4.9, 0.1, 0.8, 15, tags('vegan', ['gluten', 'soy'], [])),
];

const BY_ID = new Map(FOODS.map((food) => [food.id, food]));

/** The lookup handed to the validation engine. */
export function findFood(id: string): FoodItem | undefined {
  return BY_ID.get(id);
}

export function searchFoods(query: string): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOODS;
  return FOODS.filter(
    (food) =>
      food.name.toLowerCase().includes(q) ||
      food.aliases.some((alias) => alias.toLowerCase().includes(q)),
  );
}

export function foodsByCategory(category: FoodCategory): FoodItem[] {
  return FOODS.filter((food) => food.category === category);
}

/** Category order for the preference picker (spec §35). */
export const FOOD_CATEGORY_ORDER: Array<{ id: FoodCategory; label: string }> = [
  { id: 'protein', label: 'Protein' },
  { id: 'carbohydrate', label: 'Carbohydrates' },
  { id: 'fat', label: 'Fats' },
  { id: 'vegetable', label: 'Vegetables' },
  { id: 'fruit', label: 'Fruit' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'supplement', label: 'Supplements' },
];

export const AISLE_LABELS: Record<ShoppingAisle, string> = {
  meat_fish: 'Meat & Fish',
  dairy: 'Dairy',
  carbohydrates: 'Carbohydrates',
  fruit_veg: 'Fruit & Veg',
  pantry: 'Pantry',
  frozen: 'Frozen',
  supplements: 'Supplements',
};

/** Shown next to every portion so raw/cooked is never ambiguous (spec §37). */
export const STATE_LABELS: Record<FoodState, string> = {
  raw: 'raw',
  cooked: 'cooked',
  dry: 'dry',
  drained: 'drained',
  as_sold: '',
};

export function formatPortion(grams: number, state: FoodState): string {
  const label = STATE_LABELS[state];
  return label ? `${grams}g ${label}` : `${grams}g`;
}
