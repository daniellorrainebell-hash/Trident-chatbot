import type { CatalogueFood } from './types';
import { f, PLANT, EGG, HONEY } from './helpers';

/**
 * Carbohydrate foods (Feed spec §15.2).
 *
 * Grains and pasta are `dry` because that is how they are bought and weighed —
 * 75g dry rice becomes roughly 200g cooked, and merging the two is one of the
 * most common ways a plan ends up badly wrong.
 *
 * Fruit appears here as well as under Fruit: it is a real carbohydrate source
 * and the same record serves both views.
 */
export const CARBOHYDRATE_FOODS: CatalogueFood[] = [
  // ── Rice and grains ──────────────────────────────────────────────────────
  f('basmati-rice', 'Basmati rice', ['rice'], ['carbohydrate'], 'carbohydrates', 'dry', 356, 8.5, 78.0, 1.0, 1.4, 75, PLANT),
  f('jasmine-rice', 'Jasmine rice', [], ['carbohydrate'], 'carbohydrates', 'dry', 360, 7.1, 79.0, 0.7, 1.0, 75, PLANT),
  f('brown-rice', 'Brown rice', [], ['carbohydrate'], 'carbohydrates', 'dry', 348, 8.0, 72.0, 2.5, 3.5, 75, PLANT),
  f('wild-rice', 'Wild rice', [], ['carbohydrate'], 'carbohydrates', 'dry', 357, 14.7, 74.9, 1.1, 6.2, 75, PLANT),
  f('rice-noodles', 'Rice noodles', [], ['carbohydrate'], 'carbohydrates', 'dry', 364, 3.4, 83.2, 0.6, 1.6, 75, PLANT),
  f('quinoa', 'Quinoa', [], ['carbohydrate', 'protein'], 'carbohydrates', 'dry', 368, 14.1, 64.0, 6.1, 7.0, 75, PLANT),
  f('couscous', 'Couscous', [], ['carbohydrate'], 'carbohydrates', 'dry', 376, 12.8, 72.0, 0.6, 5.0, 75, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('barley', 'Barley', ['pearl barley'], ['carbohydrate'], 'carbohydrates', 'dry', 352, 9.9, 77.7, 1.2, 15.6, 75, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('bulgur-wheat', 'Bulgur wheat', ['bulgur'], ['carbohydrate'], 'carbohydrates', 'dry', 342, 12.3, 75.9, 1.3, 18.3, 75, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('polenta', 'Polenta', ['cornmeal'], ['carbohydrate'], 'carbohydrates', 'dry', 362, 8.1, 79.0, 1.5, 3.6, 75, PLANT),

  // ── Potatoes ─────────────────────────────────────────────────────────────
  f('potatoes', 'Potatoes', ['potato'], ['carbohydrate', 'vegetable'], 'fruit_vegetables', 'raw', 77, 2.0, 17.0, 0.1, 2.2, 300, PLANT),
  f('sweet-potatoes', 'Sweet potatoes', ['sweet potato'], ['carbohydrate', 'vegetable'], 'fruit_vegetables', 'raw', 86, 1.6, 20.1, 0.1, 3.0, 250, PLANT),
  f('baby-potatoes', 'Baby potatoes', ['new potatoes'], ['carbohydrate', 'vegetable'], 'fruit_vegetables', 'raw', 75, 2.0, 16.5, 0.1, 2.0, 250, PLANT),

  // ── Oats and cereals ─────────────────────────────────────────────────────
  f('oats', 'Oats', ['porridge', 'porridge oats'], ['carbohydrate'], 'carbohydrates', 'dry', 379, 13.2, 60.0, 8.0, 10.0, 60, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('cream-of-rice', 'Cream of rice', [], ['carbohydrate'], 'carbohydrates', 'dry', 366, 6.0, 82.0, 1.0, 1.5, 50, PLANT),
  f('granola', 'Granola', [], ['carbohydrate', 'fat'], 'carbohydrates', 'as_sold', 471, 10.0, 60.0, 20.0, 7.0, 45, PLANT, { allergens: ['cereals_containing_gluten', 'tree_nuts'] }),
  f('high-fibre-cereal', 'High-fibre cereal', ['bran sticks'], ['carbohydrate'], 'carbohydrates', 'as_sold', 260, 14.0, 46.0, 3.5, 27.0, 45, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('cornflakes', 'Cornflakes', [], ['carbohydrate'], 'carbohydrates', 'as_sold', 378, 7.0, 84.0, 0.9, 3.0, 40, PLANT),
  f('bran-flakes', 'Bran flakes', [], ['carbohydrate'], 'carbohydrates', 'as_sold', 355, 10.0, 67.0, 2.0, 15.0, 45, PLANT, { allergens: ['cereals_containing_gluten'] }),

  // ── Pasta and noodles ────────────────────────────────────────────────────
  f('white-pasta', 'White pasta', ['pasta'], ['carbohydrate'], 'carbohydrates', 'dry', 358, 12.5, 71.0, 1.5, 3.2, 80, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('wholewheat-pasta', 'Wholewheat pasta', ['wholemeal pasta'], ['carbohydrate'], 'carbohydrates', 'dry', 348, 13.4, 66.0, 2.5, 9.0, 80, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('lentil-pasta', 'Lentil pasta', ['red lentil pasta'], ['carbohydrate', 'protein'], 'carbohydrates', 'dry', 340, 25.0, 52.0, 2.0, 9.0, 80, PLANT),
  f('noodles', 'Noodles', [], ['carbohydrate'], 'carbohydrates', 'dry', 350, 11.0, 71.0, 1.8, 3.0, 75, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('udon-noodles', 'Udon noodles', ['udon'], ['carbohydrate'], 'carbohydrates', 'as_sold', 130, 4.0, 27.0, 0.5, 1.5, 200, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('egg-noodles', 'Egg noodles', [], ['carbohydrate'], 'carbohydrates', 'dry', 350, 12.0, 71.0, 2.0, 3.0, 75, EGG, { allergens: ['cereals_containing_gluten'] }),

  // ── Bread ────────────────────────────────────────────────────────────────
  f('sourdough-bread', 'Sourdough bread', ['sourdough'], ['carbohydrate'], 'carbohydrates', 'as_sold', 258, 9.0, 51.0, 1.5, 3.0, 80, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('wholemeal-bread', 'Wholemeal bread', ['brown bread', 'bread', 'toast'], ['carbohydrate'], 'carbohydrates', 'as_sold', 247, 10.5, 41.0, 3.0, 6.5, 80, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('bagels', 'Bagels', ['bagel'], ['carbohydrate'], 'carbohydrates', 'as_sold', 275, 10.5, 52.0, 1.5, 2.3, 85, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('wraps', 'Wraps', ['wrap', 'tortilla'], ['carbohydrate'], 'carbohydrates', 'as_sold', 297, 8.0, 49.0, 7.0, 3.0, 62, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('pitta-bread', 'Pitta bread', ['pitta', 'pita'], ['carbohydrate'], 'carbohydrates', 'as_sold', 275, 9.0, 55.0, 1.2, 2.6, 60, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('english-muffins', 'English muffins', ['muffin'], ['carbohydrate'], 'carbohydrates', 'as_sold', 235, 8.5, 44.0, 1.8, 3.0, 67, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('corn-tortillas', 'Corn tortillas', ['tortilla'], ['carbohydrate'], 'carbohydrates', 'as_sold', 218, 5.7, 44.6, 2.9, 6.3, 50, PLANT),
  f('rice-cakes', 'Rice cakes', [], ['carbohydrate'], 'carbohydrates', 'as_sold', 387, 8.0, 81.0, 3.0, 2.5, 20, PLANT),
  f('crackers', 'Crackers', ['cream crackers'], ['carbohydrate'], 'carbohydrates', 'as_sold', 420, 9.0, 70.0, 12.0, 3.0, 30, PLANT, { allergens: ['cereals_containing_gluten'] }),

  // ── Fruit as carbohydrate ────────────────────────────────────────────────
  f('bananas', 'Bananas', ['banana'], ['carbohydrate', 'fruit'], 'fruit_vegetables', 'as_sold', 89, 1.1, 22.8, 0.3, 2.6, 120, PLANT, { averageItemWeightG: 118 }),
  f('apples', 'Apples', ['apple'], ['carbohydrate', 'fruit'], 'fruit_vegetables', 'as_sold', 52, 0.3, 13.8, 0.2, 2.4, 150, PLANT, { averageItemWeightG: 150 }),
  f('oranges', 'Oranges', ['orange'], ['carbohydrate', 'fruit'], 'fruit_vegetables', 'as_sold', 47, 0.9, 11.8, 0.1, 2.4, 150, PLANT, { averageItemWeightG: 140 }),
  f('berries', 'Berries', ['mixed berries'], ['carbohydrate', 'fruit'], 'frozen', 'as_sold', 45, 1.0, 8.0, 0.4, 4.0, 100, PLANT),
  f('mango', 'Mango', [], ['carbohydrate', 'fruit'], 'fruit_vegetables', 'as_sold', 60, 0.8, 15.0, 0.4, 1.6, 120, PLANT),
  f('pineapple', 'Pineapple', [], ['carbohydrate', 'fruit'], 'fruit_vegetables', 'as_sold', 50, 0.5, 13.1, 0.1, 1.4, 120, PLANT),
  f('dates', 'Dates', ['medjool dates'], ['carbohydrate', 'fruit'], 'pantry', 'as_sold', 277, 1.8, 75.0, 0.2, 6.7, 40, PLANT),
  f('honey', 'Honey', [], ['carbohydrate', 'pantry'], 'pantry', 'as_sold', 304, 0.3, 82.0, 0, 0.2, 20, HONEY),
];
