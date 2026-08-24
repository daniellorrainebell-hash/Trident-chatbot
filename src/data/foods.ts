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

/** Tag bundles. Most whole foods carry several dietary flags at once. */
const OMNI: FoodTag[] = ['gluten_free', 'dairy_free', 'nut_free', 'egg_free', 'soy_free'];
const VEGAN: FoodTag[] = ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'dairy_free', 'egg_free'];
const MEAT: FoodTag[] = [...OMNI, 'halal', 'high_protein'];
const FISH: FoodTag[] = [...OMNI, 'pescatarian', 'halal', 'high_protein'];

export const FOODS: FoodItem[] = [
  // ── Protein ──────────────────────────────────────────────────────────────
  f('chicken-breast', 'Chicken breast', 'protein', 'meat_fish', 'raw', 106, 24.0, 0, 1.2, 0, 180, MEAT, ['chicken']),
  f('chicken-thigh', 'Chicken thighs', 'protein', 'meat_fish', 'raw', 145, 19.5, 0, 7.4, 0, 150, MEAT),
  f('turkey-mince', 'Turkey mince', 'protein', 'meat_fish', 'raw', 148, 21.0, 0, 7.0, 0, 150, MEAT, ['turkey']),
  f('lean-beef', 'Lean beef steak', 'protein', 'meat_fish', 'raw', 155, 22.5, 0, 7.0, 0, 200, MEAT, ['steak', 'beef']),
  f('beef-mince-5', 'Lean beef mince (5%)', 'protein', 'meat_fish', 'raw', 135, 21.0, 0, 5.0, 0, 150, MEAT, ['mince']),
  f('pork-loin', 'Pork loin', 'protein', 'meat_fish', 'raw', 143, 21.5, 0, 6.0, 0, 150, [...OMNI, 'high_protein'], ['pork']),
  f('salmon', 'Salmon fillet', 'protein', 'meat_fish', 'raw', 208, 20.4, 0, 13.4, 0, 140, FISH),
  f('tuna-tinned', 'Tinned tuna', 'protein', 'meat_fish', 'drained', 108, 25.5, 0, 0.8, 0, 110, FISH, ['tuna']),
  f('cod', 'Cod fillet', 'protein', 'meat_fish', 'raw', 82, 18.0, 0, 0.7, 0, 150, FISH),
  f('prawns', 'Prawns', 'protein', 'meat_fish', 'raw', 99, 20.5, 0.9, 1.1, 0, 120, [...FISH, 'shellfish'], ['shrimp']),
  f('eggs', 'Whole eggs', 'protein', 'dairy', 'raw', 143, 12.6, 0.7, 9.5, 0, 120, ['vegetarian', 'gluten_free', 'dairy_free', 'nut_free', 'soy_free', 'halal', 'kosher'], ['egg']),
  f('egg-whites', 'Egg whites', 'protein', 'dairy', 'raw', 52, 11.0, 0.7, 0.2, 0, 200, ['vegetarian', 'gluten_free', 'dairy_free', 'nut_free', 'soy_free', 'halal', 'kosher']),
  f('greek-yoghurt', 'Greek yoghurt (0%)', 'protein', 'dairy', 'as_sold', 57, 10.0, 4.0, 0.4, 0, 200, ['vegetarian', 'gluten_free', 'nut_free', 'egg_free', 'soy_free', 'halal', 'kosher', 'high_protein'], ['yoghurt', 'yogurt']),
  f('cottage-cheese', 'Cottage cheese', 'protein', 'dairy', 'as_sold', 98, 12.5, 3.2, 4.3, 0, 200, ['vegetarian', 'gluten_free', 'nut_free', 'egg_free', 'soy_free', 'halal', 'kosher']),
  f('whey', 'Whey protein powder', 'protein', 'supplements', 'as_sold', 380, 78.0, 6.0, 5.0, 0, 30, ['vegetarian', 'gluten_free', 'nut_free', 'egg_free', 'soy_free', 'high_protein'], ['protein powder', 'shake']),
  f('vegan-protein', 'Pea protein powder', 'protein', 'supplements', 'as_sold', 375, 76.0, 5.0, 5.5, 2.0, 30, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'nut_free', 'egg_free', 'high_protein'], ['plant protein', 'vegan protein']),
  f('soy-yoghurt', 'High-protein soy yoghurt', 'protein', 'dairy', 'as_sold', 65, 9.0, 3.5, 1.8, 0.5, 200, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'nut_free', 'egg_free', 'high_protein'], ['soya yoghurt', 'plant yoghurt']),
  f('tofu', 'Firm tofu', 'protein', 'dairy', 'as_sold', 144, 15.8, 2.8, 8.7, 1.2, 150, ['vegan', 'vegetarian', 'pescatarian', 'gluten_free', 'dairy_free', 'nut_free', 'egg_free', 'halal', 'kosher']),
  f('tempeh', 'Tempeh', 'protein', 'dairy', 'as_sold', 192, 20.3, 7.6, 10.8, 1.4, 120, ['vegan', 'vegetarian', 'pescatarian', 'gluten_free', 'dairy_free', 'nut_free', 'egg_free', 'halal', 'kosher']),
  f('black-beans', 'Black beans', 'protein', 'pantry', 'drained', 91, 6.0, 12.0, 0.5, 5.5, 120, VEGAN, ['beans']),
  f('lentils', 'Lentils', 'protein', 'pantry', 'dry', 353, 25.8, 45.0, 1.1, 11.0, 80, VEGAN),
  f('chickpeas', 'Chickpeas', 'protein', 'pantry', 'drained', 119, 7.2, 13.8, 2.6, 6.0, 120, VEGAN),

  // ── Carbohydrate ─────────────────────────────────────────────────────────
  f('basmati-rice', 'Basmati rice', 'carbohydrate', 'carbohydrates', 'dry', 356, 8.5, 78.0, 1.0, 1.4, 75, VEGAN, ['rice']),
  f('brown-rice', 'Brown rice', 'carbohydrate', 'carbohydrates', 'dry', 348, 8.0, 72.0, 2.5, 3.5, 75, VEGAN),
  f('potatoes', 'White potatoes', 'carbohydrate', 'fruit_veg', 'raw', 77, 2.0, 17.0, 0.1, 2.2, 300, VEGAN, ['potato']),
  f('sweet-potatoes', 'Sweet potatoes', 'carbohydrate', 'fruit_veg', 'raw', 86, 1.6, 20.1, 0.1, 3.0, 250, VEGAN, ['sweet potato']),
  f('pasta', 'Dried pasta', 'carbohydrate', 'carbohydrates', 'dry', 358, 12.5, 71.0, 1.5, 3.2, 80, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'dairy_free', 'egg_free', 'nut_free']),
  f('oats', 'Porridge oats', 'carbohydrate', 'carbohydrates', 'dry', 379, 13.2, 60.0, 8.0, 10.0, 60, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'dairy_free', 'egg_free', 'nut_free', 'soy_free'], ['oats', 'porridge']),
  f('wholemeal-bread', 'Wholemeal bread', 'carbohydrate', 'carbohydrates', 'as_sold', 247, 10.5, 41.0, 3.0, 6.5, 80, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'dairy_free', 'egg_free', 'nut_free'], ['bread', 'toast']),
  f('bagel', 'Bagel', 'carbohydrate', 'carbohydrates', 'as_sold', 275, 10.5, 52.0, 1.5, 2.3, 85, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'dairy_free', 'egg_free', 'nut_free']),
  f('wrap', 'Tortilla wrap', 'carbohydrate', 'carbohydrates', 'as_sold', 297, 8.0, 49.0, 7.0, 3.0, 62, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'dairy_free', 'egg_free', 'nut_free'], ['wraps', 'tortilla']),
  f('couscous', 'Couscous', 'carbohydrate', 'carbohydrates', 'dry', 376, 12.8, 72.0, 0.6, 5.0, 75, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'dairy_free', 'egg_free', 'nut_free', 'soy_free']),
  f('quinoa', 'Quinoa', 'carbohydrate', 'carbohydrates', 'dry', 368, 14.1, 64.0, 6.1, 7.0, 75, VEGAN),
  f('noodles', 'Egg noodles', 'carbohydrate', 'carbohydrates', 'dry', 350, 12.0, 71.0, 2.0, 3.0, 75, ['vegetarian', 'pescatarian', 'halal', 'kosher', 'dairy_free', 'nut_free']),
  f('rice-cakes', 'Rice cakes', 'carbohydrate', 'carbohydrates', 'as_sold', 387, 8.0, 81.0, 3.0, 2.5, 20, VEGAN),

  // ── Fat ──────────────────────────────────────────────────────────────────
  f('avocado', 'Avocado', 'fat', 'fruit_veg', 'as_sold', 160, 2.0, 8.5, 14.7, 6.7, 100, VEGAN),
  f('olive-oil', 'Olive oil', 'fat', 'pantry', 'as_sold', 884, 0, 0, 100.0, 0, 10, VEGAN, ['oil']),
  f('peanut-butter', 'Peanut butter', 'fat', 'pantry', 'as_sold', 588, 25.1, 20.0, 50.4, 6.0, 30, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'egg_free'], ['pb']),
  f('almonds', 'Almonds', 'fat', 'pantry', 'as_sold', 579, 21.2, 21.6, 49.9, 12.5, 30, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'egg_free']),
  f('cashews', 'Cashews', 'fat', 'pantry', 'as_sold', 553, 18.2, 30.2, 43.9, 3.3, 30, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'egg_free']),
  f('walnuts', 'Walnuts', 'fat', 'pantry', 'as_sold', 654, 15.2, 13.7, 65.2, 6.7, 30, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'egg_free']),
  f('mixed-seeds', 'Mixed seeds', 'fat', 'pantry', 'as_sold', 559, 20.0, 15.0, 45.0, 9.0, 25, VEGAN, ['seeds']),
  f('cheddar', 'Cheddar cheese', 'fat', 'dairy', 'as_sold', 402, 25.0, 1.3, 33.0, 0, 40, ['vegetarian', 'gluten_free', 'nut_free', 'egg_free', 'soy_free', 'halal', 'kosher'], ['cheese']),
  f('dark-chocolate', 'Dark chocolate (85%)', 'fat', 'pantry', 'as_sold', 592, 9.5, 21.0, 50.0, 10.9, 20, ['vegetarian', 'gluten_free', 'egg_free', 'halal', 'kosher'], ['chocolate']),

  // ── Vegetables ───────────────────────────────────────────────────────────
  f('broccoli', 'Broccoli', 'vegetable', 'fruit_veg', 'raw', 34, 2.8, 4.0, 0.4, 2.6, 150, VEGAN),
  f('spinach', 'Spinach', 'vegetable', 'fruit_veg', 'raw', 23, 2.9, 1.4, 0.4, 2.2, 100, VEGAN),
  f('peppers', 'Peppers', 'vegetable', 'fruit_veg', 'raw', 31, 1.0, 4.6, 0.3, 2.1, 120, VEGAN, ['bell pepper', 'capsicum']),
  f('onions', 'Onions', 'vegetable', 'fruit_veg', 'raw', 40, 1.1, 7.6, 0.1, 1.7, 80, VEGAN, ['onion']),
  f('courgette', 'Courgette', 'vegetable', 'fruit_veg', 'raw', 17, 1.2, 2.1, 0.3, 1.0, 150, VEGAN, ['zucchini']),
  f('green-beans', 'Green beans', 'vegetable', 'fruit_veg', 'raw', 31, 1.8, 4.5, 0.2, 2.7, 120, VEGAN),
  f('tomatoes', 'Tomatoes', 'vegetable', 'fruit_veg', 'raw', 18, 0.9, 2.7, 0.2, 1.2, 100, VEGAN, ['tomato']),
  f('mushrooms', 'Mushrooms', 'vegetable', 'fruit_veg', 'raw', 22, 3.1, 1.3, 0.3, 1.0, 100, VEGAN),
  f('carrots', 'Carrots', 'vegetable', 'fruit_veg', 'raw', 41, 0.9, 7.0, 0.2, 2.8, 100, VEGAN),
  f('asparagus', 'Asparagus', 'vegetable', 'fruit_veg', 'raw', 20, 2.2, 2.0, 0.1, 2.1, 120, VEGAN),
  f('mixed-salad', 'Mixed salad leaves', 'vegetable', 'fruit_veg', 'as_sold', 17, 1.4, 1.5, 0.2, 1.8, 80, VEGAN, ['salad']),

  // ── Fruit ────────────────────────────────────────────────────────────────
  f('banana', 'Banana', 'fruit', 'fruit_veg', 'as_sold', 89, 1.1, 22.8, 0.3, 2.6, 120, VEGAN, ['bananas']),
  f('apple', 'Apple', 'fruit', 'fruit_veg', 'as_sold', 52, 0.3, 13.8, 0.2, 2.4, 150, VEGAN),
  f('berries', 'Mixed berries', 'fruit', 'frozen', 'as_sold', 45, 1.0, 8.0, 0.4, 4.0, 100, VEGAN, ['blueberries', 'raspberries']),
  f('orange', 'Orange', 'fruit', 'fruit_veg', 'as_sold', 47, 0.9, 11.8, 0.1, 2.4, 150, VEGAN),
  f('pineapple', 'Pineapple', 'fruit', 'fruit_veg', 'as_sold', 50, 0.5, 13.1, 0.1, 1.4, 120, VEGAN),
  f('mango', 'Mango', 'fruit', 'fruit_veg', 'as_sold', 60, 0.8, 15.0, 0.4, 1.6, 120, VEGAN),

  // ── Dairy & pantry ───────────────────────────────────────────────────────
  f('semi-skimmed-milk', 'Semi-skimmed milk', 'dairy', 'dairy', 'as_sold', 47, 3.5, 4.8, 1.7, 0, 250, ['vegetarian', 'gluten_free', 'nut_free', 'egg_free', 'soy_free', 'halal', 'kosher'], ['milk']),
  f('almond-milk', 'Unsweetened almond milk', 'dairy', 'dairy', 'as_sold', 13, 0.5, 0.3, 1.1, 0.3, 250, ['vegan', 'vegetarian', 'pescatarian', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'egg_free']),
  f('honey', 'Honey', 'pantry', 'pantry', 'as_sold', 304, 0.3, 82.0, 0, 0.2, 20, ['vegetarian', 'gluten_free', 'dairy_free', 'egg_free', 'nut_free', 'soy_free', 'halal', 'kosher']),
  f('passata', 'Passata', 'pantry', 'pantry', 'as_sold', 35, 1.5, 6.0, 0.2, 1.4, 200, VEGAN, ['tomato sauce']),
  f('soy-sauce', 'Soy sauce', 'pantry', 'pantry', 'as_sold', 53, 8.1, 4.9, 0.1, 0.8, 15, ['vegan', 'vegetarian', 'pescatarian', 'dairy_free', 'egg_free', 'nut_free']),
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
