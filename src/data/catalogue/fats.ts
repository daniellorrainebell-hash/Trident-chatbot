import type { CatalogueFood } from './types';
import { f, PLANT, DAIRY } from './helpers';

/**
 * Fat foods (Feed spec §15.3).
 *
 * Oils are canonically millilitres with a density recorded, so a recipe asking
 * for 10ml and a shopping list counting grams stay consistent. Without the
 * density the app refuses the conversion rather than assuming 1:1.
 *
 * Whole eggs, cheese and oily fish also live in Protein — the same record,
 * one preference.
 */
export const FAT_FOODS: CatalogueFood[] = [
  f('avocado', 'Avocado', [], ['fat', 'fruit'], 'fruit_vegetables', 'as_sold', 160, 2.0, 8.5, 14.7, 6.7, 100, PLANT, { averageItemWeightG: 150 }),

  // ── Oils ─────────────────────────────────────────────────────────────────
  f('olive-oil', 'Olive oil', ['oil'], ['fat'], 'pantry', 'as_sold', 884, 0, 0, 100.0, 0, 10, PLANT, { canonicalUnit: 'ml', densityGPerMl: 0.918 }),
  f('extra-virgin-olive-oil', 'Extra virgin olive oil', ['evoo'], ['fat'], 'pantry', 'as_sold', 884, 0, 0, 100.0, 0, 10, PLANT, { canonicalUnit: 'ml', densityGPerMl: 0.918 }),
  f('coconut-oil', 'Coconut oil', [], ['fat'], 'pantry', 'as_sold', 892, 0, 0, 99.1, 0, 10, PLANT, { canonicalUnit: 'ml', densityGPerMl: 0.924 }),
  f('sesame-oil', 'Sesame oil', [], ['fat'], 'pantry', 'as_sold', 884, 0, 0, 100.0, 0, 5, PLANT, { canonicalUnit: 'ml', densityGPerMl: 0.918, allergens: ['sesame'] }),

  // ── Nut butters ──────────────────────────────────────────────────────────
  f('peanut-butter', 'Peanut butter', ['pb'], ['fat', 'protein'], 'pantry', 'as_sold', 588, 25.1, 20.0, 50.4, 6.0, 30, PLANT, { allergens: ['peanuts'] }),
  f('almond-butter', 'Almond butter', [], ['fat', 'protein'], 'pantry', 'as_sold', 614, 21.0, 18.8, 55.5, 10.3, 30, PLANT, { allergens: ['tree_nuts'] }),
  f('cashew-butter', 'Cashew butter', [], ['fat', 'protein'], 'pantry', 'as_sold', 587, 17.6, 27.6, 49.4, 3.3, 30, PLANT, { allergens: ['tree_nuts'] }),
  f('tahini', 'Tahini', ['sesame paste'], ['fat', 'protein'], 'pantry', 'as_sold', 595, 17.0, 21.2, 53.8, 9.3, 30, PLANT, { allergens: ['sesame'] }),

  // ── Nuts ─────────────────────────────────────────────────────────────────
  f('almonds', 'Almonds', [], ['fat', 'protein'], 'pantry', 'as_sold', 579, 21.2, 21.6, 49.9, 12.5, 30, PLANT, { allergens: ['tree_nuts'] }),
  f('cashews', 'Cashews', [], ['fat', 'protein'], 'pantry', 'as_sold', 553, 18.2, 30.2, 43.9, 3.3, 30, PLANT, { allergens: ['tree_nuts'] }),
  f('walnuts', 'Walnuts', [], ['fat', 'protein'], 'pantry', 'as_sold', 654, 15.2, 13.7, 65.2, 6.7, 30, PLANT, { allergens: ['tree_nuts'] }),
  f('brazil-nuts', 'Brazil nuts', [], ['fat', 'protein'], 'pantry', 'as_sold', 659, 14.3, 11.7, 67.1, 7.5, 25, PLANT, { allergens: ['tree_nuts'] }),
  f('pistachios', 'Pistachios', [], ['fat', 'protein'], 'pantry', 'as_sold', 560, 20.2, 27.2, 45.3, 10.6, 30, PLANT, { allergens: ['tree_nuts'] }),
  f('hazelnuts', 'Hazelnuts', [], ['fat', 'protein'], 'pantry', 'as_sold', 628, 15.0, 16.7, 60.8, 9.7, 30, PLANT, { allergens: ['tree_nuts'] }),

  // ── Seeds ────────────────────────────────────────────────────────────────
  f('chia-seeds', 'Chia seeds', ['chia'], ['fat'], 'pantry', 'as_sold', 486, 16.5, 42.1, 30.7, 34.4, 20, PLANT),
  f('flaxseed', 'Flaxseed', ['linseed'], ['fat'], 'pantry', 'as_sold', 534, 18.3, 28.9, 42.2, 27.3, 20, PLANT),
  f('pumpkin-seeds', 'Pumpkin seeds', [], ['fat', 'protein'], 'pantry', 'as_sold', 559, 30.2, 10.7, 49.1, 6.0, 25, PLANT),
  f('sunflower-seeds', 'Sunflower seeds', [], ['fat', 'protein'], 'pantry', 'as_sold', 584, 20.8, 20.0, 51.5, 8.6, 25, PLANT),
  f('mixed-seeds', 'Mixed seeds', ['seeds'], ['fat'], 'pantry', 'as_sold', 559, 20.0, 15.0, 45.0, 9.0, 25, PLANT),

  // ── Dairy fats ───────────────────────────────────────────────────────────
  f('cheddar', 'Cheddar', ['cheese'], ['fat', 'protein', 'dairy'], 'dairy_chilled', 'as_sold', 402, 25.0, 1.3, 33.0, 0, 40, DAIRY),
  f('feta', 'Feta', [], ['fat', 'protein', 'dairy'], 'dairy_chilled', 'as_sold', 264, 14.2, 4.1, 21.3, 0, 40, DAIRY),
  f('mozzarella', 'Mozzarella', [], ['fat', 'protein', 'dairy'], 'dairy_chilled', 'as_sold', 280, 22.2, 2.2, 20.4, 0, 40, DAIRY),
  f('parmesan', 'Parmesan', [], ['fat', 'protein', 'dairy'], 'dairy_chilled', 'as_sold', 431, 38.5, 4.1, 29.0, 0, 20, DAIRY),

  // ── Other ────────────────────────────────────────────────────────────────
  f('dark-chocolate', 'Dark chocolate', ['chocolate'], ['fat'], 'pantry', 'as_sold', 592, 9.5, 21.0, 50.0, 10.9, 20, PLANT, { allergens: ['milk', 'soybeans'] }),
  f('olives', 'Olives', [], ['fat'], 'pantry', 'drained', 145, 1.0, 3.8, 15.3, 3.3, 40, PLANT),
];
