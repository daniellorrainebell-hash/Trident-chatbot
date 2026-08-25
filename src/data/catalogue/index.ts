import { PROTEIN_FOODS } from './protein';
import { CARBOHYDRATE_FOODS } from './carbohydrate';
import { FAT_FOODS } from './fats';
import { FRUIT_FOODS, VEGETABLE_FOODS } from './produce';
import { PANTRY_FOODS, DAIRY_FOODS } from './pantry';
import type { CatalogueFood, FoodCategory } from './types';

export * from './types';
export { PROTEIN_FOODS, CARBOHYDRATE_FOODS, FAT_FOODS, FRUIT_FOODS, VEGETABLE_FOODS, PANTRY_FOODS, DAIRY_FOODS };

/**
 * The canonical catalogue.
 *
 * One record per food, however many categories it belongs to. Whole eggs are
 * declared once in the protein file and carry protein, fat and dairy tags —
 * they are not three rows, and the user's preference is stored once against
 * the id, so a choice made in one view is the same choice in every other.
 */
export const CATALOGUE: CatalogueFood[] = [
  ...PROTEIN_FOODS,
  ...CARBOHYDRATE_FOODS,
  ...FAT_FOODS,
  ...FRUIT_FOODS,
  ...VEGETABLE_FOODS,
  ...DAIRY_FOODS,
  ...PANTRY_FOODS,
];

const BY_ID = new Map(CATALOGUE.map((food) => [food.id, food]));

export function findCatalogueFood(id: string): CatalogueFood | undefined {
  return BY_ID.get(id);
}

/** Every food carrying a category, including those that carry several. */
export function foodsInCategory(category: FoodCategory): CatalogueFood[] {
  return CATALOGUE.filter((food) => food.active && food.categories.includes(category));
}

/** Category placements — the number the spec counts, not the record count. */
export function categoryPlacements(): number {
  return CATALOGUE.reduce((sum, food) => sum + food.categories.length, 0);
}

export function searchCatalogue(query: string, pool: CatalogueFood[] = CATALOGUE): CatalogueFood[] {
  const q = query.trim().toLowerCase();
  if (!q) return pool.filter((food) => food.active);

  const scored: Array<{ food: CatalogueFood; score: number }> = [];
  for (const food of pool) {
    if (!food.active) continue;
    const name = food.name.toLowerCase();

    let score = -1;
    if (name.startsWith(q)) score = 3;
    else if (name.includes(q)) score = 2;
    else if (food.aliases.some((alias) => alias.toLowerCase().includes(q))) score = 1;

    if (score >= 0) scored.push({ food, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name))
    .map((s) => s.food);
}

export function categoryCounts(): Record<FoodCategory, number> {
  const counts = {} as Record<FoodCategory, number>;
  for (const food of CATALOGUE) {
    for (const category of food.categories) {
      counts[category] = (counts[category] ?? 0) + 1;
    }
  }
  return counts;
}
