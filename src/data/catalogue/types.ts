import type { AllergenGroup, DerivationTag } from '@/engines/food/eligibility';
import type { ShoppingGroup } from '@/engines/food/shoppingList';
import type { FoodState } from '@/types';

/**
 * Canonical food record (Feed spec §12).
 *
 * A food is not a name and three numbers. Two things here matter more than
 * they look:
 *
 *   - `categories` is many-to-many. Whole eggs are protein *and* fat; lentils
 *     are protein *and* carbohydrate. The same record appears in several UI
 *     views, and the user's preference is stored once against the id — so
 *     marking eggs LOVE IT under Protein updates them under Fats too.
 *   - `state` is part of the record, not a display note. Dry rice and cooked
 *     rice are different foods nutritionally and are never the same row.
 */

export type FoodCategory =
  | 'protein' | 'carbohydrate' | 'fat' | 'fruit' | 'vegetable'
  | 'dairy' | 'pantry' | 'supplement';

export type CatalogueFood = {
  id: string;
  name: string;
  aliases: string[];
  /** Many-to-many. A food can legitimately sit in several. */
  categories: FoodCategory[];
  shoppingGroup: ShoppingGroup;
  state: FoodState;
  canonicalUnit: 'g' | 'ml' | 'item';
  densityGPerMl?: number;
  averageItemWeightG?: number;

  /** Per 100 of the canonical unit. */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;

  /** Formal UK regulated groups, not familiar labels. */
  allergenTags: AllergenGroup[];
  /** What it is derived from, for dietary-style filtering. */
  derivationTags: DerivationTag[];

  typicalPortionG: number;
  source: string;
  sourceVersion: string;
  active: boolean;
};

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  protein: 'Protein',
  carbohydrate: 'Carbohydrates',
  fat: 'Fats',
  fruit: 'Fruit',
  vegetable: 'Vegetables',
  dairy: 'Dairy',
  pantry: 'Pantry & flavour',
  supplement: 'Supplements',
};

/** The order the preference flow walks through (spec §14). */
export const CATEGORY_ORDER: FoodCategory[] = [
  'protein', 'carbohydrate', 'fat', 'fruit', 'vegetable', 'dairy', 'pantry', 'supplement',
];
