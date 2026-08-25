import type { CatalogueFood } from './types';
import { f, MEAT, POULTRY, FISH, SHELLFISH, PLANT, DAIRY, EGG } from './helpers';

/**
 * Protein foods (Feed spec §15.1).
 *
 * Values are per 100g in the stated state, compiled from published UK
 * composition data. Raw is the default for meat and fish because that is how
 * it is bought and weighed; anything sold ready-to-eat is marked `as_sold`.
 *
 * Several entries also carry a fat or carbohydrate category — salmon, whole
 * eggs and lentils are not protein alone, and pretending otherwise makes the
 * category filters lie.
 */
export const PROTEIN_FOODS: CatalogueFood[] = [
  // ── Poultry ──────────────────────────────────────────────────────────────
  f('chicken-breast', 'Chicken breast', ['chicken'], ['protein'], 'meat_fish', 'raw', 106, 24.0, 0, 1.2, 0, 180, POULTRY),
  f('chicken-thigh', 'Skinless chicken thigh', ['chicken thigh'], ['protein'], 'meat_fish', 'raw', 145, 19.5, 0, 7.4, 0, 150, POULTRY),
  f('turkey-breast', 'Turkey breast', ['turkey'], ['protein'], 'meat_fish', 'raw', 105, 24.6, 0, 0.8, 0, 170, POULTRY),
  f('turkey-mince', 'Turkey mince', [], ['protein'], 'meat_fish', 'raw', 148, 21.0, 0, 7.0, 0, 150, POULTRY),
  f('duck-breast', 'Duck breast', ['duck'], ['protein', 'fat'], 'meat_fish', 'raw', 195, 18.3, 0, 13.5, 0, 150, POULTRY),

  // ── Red meat ─────────────────────────────────────────────────────────────
  f('rump-steak', 'Rump steak', ['rump'], ['protein'], 'meat_fish', 'raw', 168, 22.8, 0, 8.5, 0, 200, MEAT),
  f('sirloin-steak', 'Sirloin steak', ['sirloin'], ['protein'], 'meat_fish', 'raw', 175, 22.2, 0, 9.6, 0, 200, MEAT),
  f('fillet-steak', 'Fillet steak', ['fillet', 'filet mignon'], ['protein'], 'meat_fish', 'raw', 155, 23.5, 0, 6.6, 0, 200, MEAT),
  f('lean-beef', 'Lean beef', ['beef'], ['protein'], 'meat_fish', 'raw', 155, 22.5, 0, 7.0, 0, 180, MEAT),
  f('beef-strips', 'Lean beef strips', ['stir fry beef'], ['protein'], 'meat_fish', 'raw', 152, 22.8, 0, 6.5, 0, 150, MEAT),
  f('beef-mince-5', '5% beef mince', ['mince', 'lean mince'], ['protein'], 'meat_fish', 'raw', 135, 21.0, 0, 5.0, 0, 150, MEAT),
  f('pork-loin', 'Pork loin', ['pork'], ['protein'], 'meat_fish', 'raw', 143, 21.5, 0, 6.0, 0, 150, MEAT),
  f('pork-tenderloin', 'Pork tenderloin', ['pork fillet'], ['protein'], 'meat_fish', 'raw', 120, 22.8, 0, 3.2, 0, 150, MEAT),
  f('lean-lamb', 'Lean lamb', ['lamb'], ['protein', 'fat'], 'meat_fish', 'raw', 190, 20.2, 0, 12.3, 0, 150, MEAT),
  f('venison', 'Venison', [], ['protein'], 'meat_fish', 'raw', 120, 22.5, 0, 3.2, 0, 150, MEAT),

  // ── Fish and seafood ─────────────────────────────────────────────────────
  f('salmon', 'Salmon', ['salmon fillet'], ['protein', 'fat'], 'meat_fish', 'raw', 208, 20.4, 0, 13.4, 0, 140, FISH),
  f('tuna', 'Tuna', ['tinned tuna'], ['protein'], 'meat_fish', 'drained', 108, 25.5, 0, 0.8, 0, 110, FISH),
  f('cod', 'Cod', ['cod fillet'], ['protein'], 'meat_fish', 'raw', 82, 18.0, 0, 0.7, 0, 150, FISH),
  f('haddock', 'Haddock', [], ['protein'], 'meat_fish', 'raw', 90, 19.9, 0, 0.9, 0, 150, FISH),
  f('sea-bass', 'Sea bass', ['bass'], ['protein'], 'meat_fish', 'raw', 124, 18.4, 0, 5.4, 0, 140, FISH),
  f('mackerel', 'Mackerel', [], ['protein', 'fat'], 'meat_fish', 'raw', 205, 18.6, 0, 13.9, 0, 130, FISH),
  f('sardines', 'Sardines', [], ['protein', 'fat'], 'meat_fish', 'drained', 208, 24.6, 0, 11.5, 0, 90, FISH),
  f('prawns', 'Prawns', ['shrimp'], ['protein'], 'meat_fish', 'raw', 99, 20.5, 0.9, 1.1, 0, 120, SHELLFISH, { allergens: ['crustaceans'] }),
  f('mussels', 'Mussels', [], ['protein'], 'meat_fish', 'raw', 86, 11.9, 3.7, 2.2, 0, 150, SHELLFISH, { allergens: ['molluscs'] }),
  f('crab', 'Crab', ['crab meat'], ['protein'], 'meat_fish', 'as_sold', 83, 18.1, 0, 1.1, 0, 100, SHELLFISH, { allergens: ['crustaceans'] }),

  // ── Eggs and dairy protein ───────────────────────────────────────────────
  f('whole-eggs', 'Whole eggs', ['egg', 'eggs'], ['protein', 'fat', 'dairy'], 'dairy_chilled', 'raw', 143, 12.6, 0.7, 9.5, 0, 120, EGG, { averageItemWeightG: 58 }),
  f('egg-whites', 'Egg whites', ['egg white'], ['protein'], 'dairy_chilled', 'raw', 52, 11.0, 0.7, 0.2, 0, 200, EGG),
  f('greek-yoghurt', 'Greek yoghurt (0%)', ['yoghurt', 'yogurt'], ['protein', 'dairy'], 'dairy_chilled', 'as_sold', 57, 10.0, 4.0, 0.4, 0, 200, DAIRY),
  f('skyr', 'Skyr', [], ['protein', 'dairy'], 'dairy_chilled', 'as_sold', 63, 11.0, 4.0, 0.2, 0, 200, DAIRY),
  f('cottage-cheese', 'Cottage cheese', [], ['protein', 'dairy'], 'dairy_chilled', 'as_sold', 98, 12.5, 3.2, 4.3, 0, 200, DAIRY),
  f('quark', 'Quark', [], ['protein', 'dairy'], 'dairy_chilled', 'as_sold', 68, 12.0, 4.0, 0.2, 0, 200, DAIRY),

  // ── Supplements ──────────────────────────────────────────────────────────
  f('whey-protein', 'Whey protein', ['whey', 'protein powder', 'shake'], ['protein', 'supplement'], 'supplements', 'as_sold', 380, 78.0, 6.0, 5.0, 0, 30, DAIRY),
  f('casein-protein', 'Casein protein', ['casein'], ['protein', 'supplement'], 'supplements', 'as_sold', 365, 76.0, 6.0, 3.5, 0, 30, DAIRY),
  f('pea-protein', 'Pea protein', ['vegan protein', 'plant protein'], ['protein', 'supplement'], 'supplements', 'as_sold', 375, 76.0, 5.0, 5.5, 2.0, 30, PLANT),

  // ── Plant protein ────────────────────────────────────────────────────────
  f('tofu', 'Tofu', ['firm tofu'], ['protein'], 'dairy_chilled', 'as_sold', 144, 15.8, 2.8, 8.7, 1.2, 150, PLANT, { allergens: ['soybeans'] }),
  f('tempeh', 'Tempeh', [], ['protein'], 'dairy_chilled', 'as_sold', 192, 20.3, 7.6, 10.8, 1.4, 120, PLANT, { allergens: ['soybeans'] }),
  f('seitan', 'Seitan', ['wheat protein'], ['protein'], 'dairy_chilled', 'as_sold', 141, 25.0, 8.0, 1.5, 0.6, 120, PLANT, { allergens: ['cereals_containing_gluten'] }),
  f('edamame', 'Edamame', ['soy beans'], ['protein', 'vegetable'], 'frozen', 'as_sold', 121, 11.9, 8.9, 5.2, 5.2, 120, PLANT, { allergens: ['soybeans'] }),
  f('black-beans', 'Black beans', ['beans'], ['protein', 'carbohydrate'], 'pantry', 'drained', 91, 6.0, 12.0, 0.5, 5.5, 120, PLANT),
  f('kidney-beans', 'Kidney beans', [], ['protein', 'carbohydrate'], 'pantry', 'drained', 100, 6.9, 13.5, 0.5, 6.2, 120, PLANT),
  f('chickpeas', 'Chickpeas', ['garbanzo'], ['protein', 'carbohydrate'], 'pantry', 'drained', 119, 7.2, 13.8, 2.6, 6.0, 120, PLANT),
  f('lentils', 'Lentils', ['red lentils', 'green lentils'], ['protein', 'carbohydrate'], 'pantry', 'dry', 353, 25.8, 45.0, 1.1, 11.0, 80, PLANT),
  f('mixed-beans', 'Mixed beans', ['bean salad'], ['protein', 'carbohydrate'], 'pantry', 'drained', 97, 6.5, 13.0, 0.6, 5.8, 120, PLANT),
  f('mycoprotein', 'Mycoprotein', ['quorn'], ['protein'], 'frozen', 'as_sold', 85, 11.5, 4.5, 2.9, 6.0, 120, PLANT, { allergens: ['eggs'] }),
];
