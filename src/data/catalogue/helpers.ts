import type { AllergenGroup, DerivationTag } from '@/engines/food/eligibility';
import type { ShoppingGroup } from '@/engines/food/shoppingList';
import type { FoodState } from '@/types';
import type { CatalogueFood, FoodCategory } from './types';

/**
 * Catalogue authoring helpers.
 *
 * Development composition data compiled from published UK sources. Spec §16
 * requires this to be replaced by, or reconciled against, a licensed source
 * before launch — with the commercial rights verified first. `source` and
 * `sourceVersion` are per-row so that swap can be traced rather than being a
 * silent bulk overwrite.
 */

export const SOURCE = 'kennel-dev-composition';
export const SOURCE_VERSION = '2026.03';

/** Derivation bundles, so a single food never has to restate the obvious. */
export const MEAT: DerivationTag[] = ['contains_meat'];
export const POULTRY: DerivationTag[] = ['contains_poultry'];
export const FISH: DerivationTag[] = ['contains_fish'];
export const EGG: DerivationTag[] = ['contains_egg'];
export const DAIRY: DerivationTag[] = ['contains_dairy'];
export const HONEY: DerivationTag[] = ['contains_honey'];
/** Nothing animal-derived. Vegan-safe unless an allergen says otherwise. */
export const PLANT: DerivationTag[] = [];

/**
 * Shellfish derivation. The caller must also pass the allergen group via
 * `extras.allergens` — crustaceans and molluscs are separate regulated groups,
 * and someone allergic to prawns is not necessarily allergic to mussels.
 */
export const SHELLFISH: DerivationTag[] = ['contains_fish', 'contains_shellfish'];

/** Allergens implied by a derivation, so common cases are not hand-typed. */
function impliedAllergens(derivation: DerivationTag[]): AllergenGroup[] {
  const allergens: AllergenGroup[] = [];
  if (derivation.includes('contains_fish')) allergens.push('fish');
  if (derivation.includes('contains_dairy')) allergens.push('milk');
  if (derivation.includes('contains_egg')) allergens.push('eggs');
  return allergens;
}

export type FoodExtras = {
  allergens?: AllergenGroup[];
  averageItemWeightG?: number;
  densityGPerMl?: number;
  canonicalUnit?: 'g' | 'ml' | 'item';
};

/**
 * Build a catalogue row.
 *
 * Positional rather than an options object on purpose: with 169 of these, one
 * consistent shape reads as a table, and a table is far easier to audit
 * against a composition source than 169 nested objects.
 */
export function f(
  id: string,
  name: string,
  aliases: string[],
  categories: FoodCategory[],
  shoppingGroup: ShoppingGroup,
  state: FoodState,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  fibre: number,
  typicalPortionG: number,
  derivation: DerivationTag[],
  extras: FoodExtras = {},
): CatalogueFood {
  return {
    id,
    name,
    aliases,
    categories,
    shoppingGroup,
    state,
    canonicalUnit: extras.canonicalUnit ?? 'g',
    densityGPerMl: extras.densityGPerMl,
    averageItemWeightG: extras.averageItemWeightG,
    kcal,
    protein,
    carbs,
    fat,
    fibre,
    allergenTags: [...new Set([...impliedAllergens(derivation), ...(extras.allergens ?? [])])],
    derivationTags: derivation,
    typicalPortionG,
    source: SOURCE,
    sourceVersion: SOURCE_VERSION,
    active: true,
  };
}
