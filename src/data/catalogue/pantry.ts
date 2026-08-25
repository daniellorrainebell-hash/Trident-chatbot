import type { CatalogueFood } from './types';
import { f, PLANT, EGG } from './helpers';

/**
 * Pantry and flavour (Feed spec §15.6).
 *
 * These stop recipes being bland, and they carry allergen tags for the same
 * reason everything else does. The spec calls two out specifically: soy sauce
 * is not automatically gluten-free, and tamari is not automatically safe
 * without verified product data. Both are tagged accordingly rather than
 * assumed clean, because a generic record is not a certification.
 *
 * Most are used in gram quantities too small to move a macro target, but they
 * still need eligibility rules — someone with a mustard or celery allergy
 * needs them filtered like anything else.
 */
export const PANTRY_FOODS: CatalogueFood[] = [
  f('chopped-tomatoes', 'Chopped tomatoes', ['tinned tomatoes', 'passata'], ['pantry', 'vegetable'], 'pantry', 'as_sold', 32, 1.3, 5.4, 0.3, 1.4, 200, PLANT),
  f('tomato-puree', 'Tomato purée', ['tomato paste'], ['pantry'], 'pantry', 'as_sold', 82, 4.3, 18.9, 0.5, 4.1, 30, PLANT),
  f('stock', 'Reduced-salt stock', ['stock cube', 'bouillon'], ['pantry'], 'pantry', 'as_sold', 8, 0.5, 1.2, 0.2, 0, 250, PLANT, { canonicalUnit: 'ml', densityGPerMl: 1.0, allergens: ['celery'] }),
  f('garlic', 'Garlic', [], ['pantry', 'vegetable'], 'fruit_vegetables', 'raw', 149, 6.4, 33.1, 0.5, 2.1, 10, PLANT),
  f('ginger', 'Ginger', [], ['pantry', 'vegetable'], 'fruit_vegetables', 'raw', 80, 1.8, 17.8, 0.8, 2.0, 10, PLANT),
  f('fresh-chilli', 'Fresh chilli', ['chilli', 'chili'], ['pantry', 'vegetable'], 'fruit_vegetables', 'raw', 40, 1.9, 8.8, 0.4, 1.5, 10, PLANT),

  // Soy sauce contains wheat unless a product says otherwise; tamari usually
  // does not, but "usually" is not a claim the app is entitled to make.
  f('soy-sauce', 'Soy sauce', [], ['pantry'], 'pantry', 'as_sold', 53, 8.1, 4.9, 0.1, 0.8, 15, PLANT, { canonicalUnit: 'ml', densityGPerMl: 1.2, allergens: ['soybeans', 'cereals_containing_gluten'] }),
  f('tamari', 'Tamari', [], ['pantry'], 'pantry', 'as_sold', 60, 10.5, 5.6, 0.1, 0.8, 15, PLANT, { canonicalUnit: 'ml', densityGPerMl: 1.2, allergens: ['soybeans'] }),

  f('vinegar', 'Vinegar', ['balsamic'], ['pantry'], 'pantry', 'as_sold', 88, 0.5, 17.0, 0, 0, 15, PLANT, { canonicalUnit: 'ml', densityGPerMl: 1.05, allergens: ['sulphites'] }),
  f('mustard', 'Mustard', [], ['pantry'], 'pantry', 'as_sold', 66, 4.4, 5.8, 3.3, 3.3, 10, PLANT, { allergens: ['mustard'] }),
  f('hot-sauce', 'Hot sauce', [], ['pantry'], 'pantry', 'as_sold', 12, 0.5, 1.8, 0.4, 0.3, 10, PLANT, { canonicalUnit: 'ml', densityGPerMl: 1.0 }),
  f('salsa', 'Salsa', [], ['pantry', 'vegetable'], 'pantry', 'as_sold', 36, 1.5, 7.0, 0.2, 1.8, 50, PLANT),
  f('hummus', 'Hummus', [], ['pantry', 'fat', 'protein'], 'dairy_chilled', 'as_sold', 166, 7.9, 14.3, 9.6, 6.0, 50, PLANT, { allergens: ['sesame'] }),
  f('light-mayonnaise', 'Light mayonnaise', ['mayo'], ['pantry', 'fat'], 'pantry', 'as_sold', 290, 1.0, 8.0, 28.0, 0, 15, EGG, { allergens: ['mustard'] }),
  f('cooking-spray', 'Low-fat cooking spray', ['spray oil'], ['pantry', 'fat'], 'pantry', 'as_sold', 536, 0, 0, 59.0, 0, 1, PLANT),

  f('cocoa-powder', 'Cocoa powder', ['cacao'], ['pantry'], 'pantry', 'as_sold', 228, 19.6, 57.9, 13.7, 37.0, 10, PLANT),
  f('cinnamon', 'Cinnamon', [], ['pantry'], 'pantry', 'as_sold', 247, 4.0, 80.6, 1.2, 53.1, 2, PLANT),
  f('paprika', 'Paprika', [], ['pantry'], 'pantry', 'as_sold', 282, 14.1, 53.9, 12.9, 34.9, 2, PLANT),
  f('smoked-paprika', 'Smoked paprika', [], ['pantry'], 'pantry', 'as_sold', 282, 14.1, 53.9, 12.9, 34.9, 2, PLANT),
  f('cumin', 'Cumin', [], ['pantry'], 'pantry', 'as_sold', 375, 17.8, 44.2, 22.3, 10.5, 2, PLANT),
  f('coriander', 'Coriander', ['cilantro'], ['pantry'], 'pantry', 'as_sold', 23, 2.1, 3.7, 0.5, 2.8, 5, PLANT),
  f('turmeric', 'Turmeric', [], ['pantry'], 'pantry', 'as_sold', 312, 9.7, 67.1, 3.3, 22.7, 2, PLANT),
  f('curry-powder', 'Curry powder', [], ['pantry'], 'pantry', 'as_sold', 325, 12.7, 55.8, 13.8, 33.2, 5, PLANT, { allergens: ['mustard'] }),
  f('mixed-herbs', 'Mixed herbs', [], ['pantry'], 'pantry', 'as_sold', 259, 12.0, 60.0, 7.0, 37.0, 2, PLANT),
  f('basil', 'Basil', [], ['pantry'], 'pantry', 'as_sold', 23, 3.2, 2.7, 0.6, 1.6, 5, PLANT),
  f('oregano', 'Oregano', [], ['pantry'], 'pantry', 'as_sold', 265, 9.0, 68.9, 4.3, 42.5, 2, PLANT),
  f('rosemary', 'Rosemary', [], ['pantry'], 'pantry', 'as_sold', 131, 3.3, 20.7, 5.9, 14.1, 2, PLANT),
  f('black-pepper', 'Black pepper', ['pepper'], ['pantry'], 'pantry', 'as_sold', 251, 10.4, 63.9, 3.3, 25.3, 1, PLANT),
  f('salt', 'Salt', [], ['pantry'], 'pantry', 'as_sold', 0, 0, 0, 0, 0, 1, PLANT),
  f('sweetener', 'Zero-calorie sweetener', ['stevia', 'sweetener'], ['pantry'], 'pantry', 'as_sold', 0, 0, 0, 0, 0, 2, PLANT),
];

/** Milks and remaining dairy that are not primarily a protein or fat choice. */
export const DAIRY_FOODS: CatalogueFood[] = [
  f('semi-skimmed-milk', 'Semi-skimmed milk', ['milk'], ['dairy'], 'dairy_chilled', 'as_sold', 47, 3.5, 4.8, 1.7, 0, 250, ['contains_dairy'], { canonicalUnit: 'ml', densityGPerMl: 1.03 }),
  f('skimmed-milk', 'Skimmed milk', [], ['dairy'], 'dairy_chilled', 'as_sold', 35, 3.6, 5.0, 0.2, 0, 250, ['contains_dairy'], { canonicalUnit: 'ml', densityGPerMl: 1.03 }),
  f('whole-milk', 'Whole milk', [], ['dairy'], 'dairy_chilled', 'as_sold', 64, 3.4, 4.7, 3.6, 0, 250, ['contains_dairy'], { canonicalUnit: 'ml', densityGPerMl: 1.03 }),
  f('almond-milk', 'Unsweetened almond milk', ['almond milk'], ['dairy'], 'dairy_chilled', 'as_sold', 13, 0.5, 0.3, 1.1, 0.3, 250, PLANT, { canonicalUnit: 'ml', densityGPerMl: 1.0, allergens: ['tree_nuts'] }),
  f('oat-milk', 'Oat milk', [], ['dairy'], 'dairy_chilled', 'as_sold', 46, 1.0, 6.7, 1.5, 0.8, 250, PLANT, { canonicalUnit: 'ml', densityGPerMl: 1.03, allergens: ['cereals_containing_gluten'] }),
  f('soy-milk', 'Soy milk', ['soya milk'], ['dairy', 'protein'], 'dairy_chilled', 'as_sold', 33, 3.3, 0.6, 1.8, 0.5, 250, PLANT, { canonicalUnit: 'ml', densityGPerMl: 1.03, allergens: ['soybeans'] }),
  f('soy-yoghurt', 'High-protein soy yoghurt', ['soya yoghurt'], ['dairy', 'protein'], 'dairy_chilled', 'as_sold', 65, 9.0, 3.5, 1.8, 0.5, 200, PLANT, { allergens: ['soybeans'] }),
];
