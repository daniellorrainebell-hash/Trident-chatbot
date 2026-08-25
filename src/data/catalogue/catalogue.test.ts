import { ALLERGEN_GROUPS, resolveEligibility, type UserFoodRules } from '@/engines/food/eligibility';
import {
  CATALOGUE,
  CATEGORY_ORDER,
  categoryCounts,
  categoryPlacements,
  findCatalogueFood,
  foodsInCategory,
  searchCatalogue,
} from './index';

function rules(overrides: Partial<UserFoodRules> = {}): UserFoodRules {
  return {
    dietaryStyle: 'no_restrictions',
    allergies: [],
    intolerances: [],
    medicalExclusions: [],
    preferences: {},
    ...overrides,
  };
}

describe('catalogue size', () => {
  it('meets the 169-placement minimum from the spec', () => {
    const placements = categoryPlacements();
    console.log('records', CATALOGUE.length, 'placements', placements);
    console.log('by category', JSON.stringify(categoryCounts()));
    expect(placements).toBeGreaterThanOrEqual(169);
  });

  it('has enough in every category to build a varied plan', () => {
    expect(foodsInCategory('protein').length).toBeGreaterThanOrEqual(35);
    expect(foodsInCategory('carbohydrate').length).toBeGreaterThanOrEqual(35);
    expect(foodsInCategory('fat').length).toBeGreaterThanOrEqual(24);
    expect(foodsInCategory('fruit').length).toBeGreaterThanOrEqual(20);
    expect(foodsInCategory('vegetable').length).toBeGreaterThanOrEqual(30);
  });
});

describe('record integrity', () => {
  it('has no duplicate ids', () => {
    const ids = CATALOGUE.map((f) => f.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(duplicates).toEqual([]);
  });

  it('has no duplicate names', () => {
    const names = CATALOGUE.map((f) => f.name.toLowerCase());
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    expect(duplicates).toEqual([]);
  });

  it('gives every food at least one category', () => {
    for (const food of CATALOGUE) {
      expect(food.categories.length).toBeGreaterThan(0);
    }
  });

  it('declares a state for every food', () => {
    for (const food of CATALOGUE) {
      expect(['raw', 'cooked', 'dry', 'drained', 'prepared', 'as_sold']).toContain(food.state);
    }
  });

  it('uses only the formal UK allergen groups', () => {
    for (const food of CATALOGUE) {
      for (const allergen of food.allergenTags) {
        expect(ALLERGEN_GROUPS).toContain(allergen);
      }
    }
  });

  it('records a source and version on every row, so a licensed swap is traceable', () => {
    for (const food of CATALOGUE) {
      expect(food.source).toBeTruthy();
      expect(food.sourceVersion).toBeTruthy();
    }
  });

  /**
   * Foods whose published energy legitimately does not follow 4/4/9.
   *
   * Composition tables apply specific Atwater factors to some foods, where the
   * energy actually available from the macros is lower than the general
   * factors imply. Cocoa is the classic case: its published 228 kcal is real,
   * and a 4/4/9 estimate overshoots by more than a third. Listing the
   * exceptions is honest; widening the tolerance until they pass would just
   * blind the check to real typos.
   */
  const SPECIFIC_ATWATER_FOODS = new Set(['cocoa-powder']);

  it('has macros that roughly account for the stated calories', () => {
    const drifted: string[] = [];

    for (const food of CATALOGUE) {
      if (SPECIFIC_ATWATER_FOODS.has(food.id)) continue;

      // Fibre is not 4 kcal/g. Counting it as carbohydrate overstates energy
      // badly for high-fibre foods — cocoa and dried herbs are a third fibre by
      // weight — so available carbohydrate is used and fibre counted at 2.
      const availableCarbs = Math.max(0, food.carbs - food.fibre);
      const fromMacros = food.protein * 4 + availableCarbs * 4 + food.fat * 9 + food.fibre * 2;
      const drift = Math.abs(fromMacros - food.kcal);

      // Spices and seasonings are used in 1–5g quantities, where a 30% error is
      // under two calories in a plan, and their published values vary widely by
      // source. They get the absurd-value checks below but not this one.
      const tolerance = food.typicalPortionG >= 10
        ? Math.max(45, food.kcal * 0.25)
        : Math.max(120, food.kcal * 0.5);

      if (drift > tolerance) {
        drifted.push(`${food.name}: stated ${food.kcal}, macros give ${Math.round(fromMacros)}`);
      }
    }

    expect(drifted).toEqual([]);
  });

  it('gives every millilitre food a density, so no conversion has to guess', () => {
    for (const food of CATALOGUE) {
      if (food.canonicalUnit === 'ml') expect(food.densityGPerMl).toBeGreaterThan(0);
    }
  });

  it('carries no negative or absurd values', () => {
    for (const food of CATALOGUE) {
      for (const value of [food.kcal, food.protein, food.carbs, food.fat, food.fibre]) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
      expect(food.protein).toBeLessThanOrEqual(100);
      expect(food.carbs).toBeLessThanOrEqual(100);
      expect(food.fat).toBeLessThanOrEqual(100);
      expect(food.kcal).toBeLessThanOrEqual(950);
    }
  });
});

describe('allergen tagging', () => {
  it('tags every dairy-derived food with milk', () => {
    for (const food of CATALOGUE.filter((f) => f.derivationTags.includes('contains_dairy'))) {
      expect(food.allergenTags).toContain('milk');
    }
  });

  it('tags every egg-derived food with eggs', () => {
    for (const food of CATALOGUE.filter((f) => f.derivationTags.includes('contains_egg'))) {
      expect(food.allergenTags).toContain('eggs');
    }
  });

  it('distinguishes crustaceans from molluscs', () => {
    expect(findCatalogueFood('prawns')!.allergenTags).toContain('crustaceans');
    expect(findCatalogueFood('mussels')!.allergenTags).toContain('molluscs');
    // Someone allergic to prawns is not necessarily allergic to mussels.
    expect(findCatalogueFood('prawns')!.allergenTags).not.toContain('molluscs');
  });

  it('tags gluten on wheat-based foods', () => {
    for (const id of ['white-pasta', 'wholemeal-bread', 'couscous', 'seitan', 'oats']) {
      expect(findCatalogueFood(id)!.allergenTags).toContain('cereals_containing_gluten');
    }
  });

  it('does not assume soy sauce is gluten-free', () => {
    expect(findCatalogueFood('soy-sauce')!.allergenTags).toContain('cereals_containing_gluten');
  });

  it('tags celery on celery and on stock', () => {
    expect(findCatalogueFood('celery')!.allergenTags).toContain('celery');
    expect(findCatalogueFood('stock')!.allergenTags).toContain('celery');
  });

  it('tags sesame on tahini and sesame oil', () => {
    expect(findCatalogueFood('tahini')!.allergenTags).toContain('sesame');
    expect(findCatalogueFood('sesame-oil')!.allergenTags).toContain('sesame');
  });

  it('separates peanuts from tree nuts', () => {
    expect(findCatalogueFood('peanut-butter')!.allergenTags).toEqual(['peanuts']);
    expect(findCatalogueFood('almonds')!.allergenTags).toEqual(['tree_nuts']);
  });
});

describe('dietary styles against the real catalogue', () => {
  it('leaves a vegan a workable pool', () => {
    const vegan = rules({ dietaryStyle: 'vegan' });
    const allowed = CATALOGUE.filter((f) => resolveEligibility(f, vegan).allowed);

    const protein = allowed.filter((f) => f.categories.includes('protein'));
    const carbs = allowed.filter((f) => f.categories.includes('carbohydrate'));
    const fats = allowed.filter((f) => f.categories.includes('fat'));

    console.log('vegan pool', { protein: protein.length, carbs: carbs.length, fats: fats.length });
    expect(protein.length).toBeGreaterThanOrEqual(10);
    expect(carbs.length).toBeGreaterThanOrEqual(20);
    expect(fats.length).toBeGreaterThanOrEqual(15);
  });

  it('removes every animal-derived food from a vegan pool', () => {
    const vegan = rules({ dietaryStyle: 'vegan' });
    const allowed = CATALOGUE.filter((f) => resolveEligibility(f, vegan).allowed);

    for (const food of allowed) {
      expect(food.derivationTags).not.toContain('contains_meat');
      expect(food.derivationTags).not.toContain('contains_dairy');
      expect(food.derivationTags).not.toContain('contains_egg');
      expect(food.derivationTags).not.toContain('contains_honey');
    }
  });

  it('leaves a pescatarian fish but no meat', () => {
    const pesc = rules({ dietaryStyle: 'pescatarian' });
    const allowed = CATALOGUE.filter((f) => resolveEligibility(f, pesc).allowed);

    expect(allowed.some((f) => f.id === 'salmon')).toBe(true);
    expect(allowed.some((f) => f.id === 'chicken-breast')).toBe(false);
  });

  it('leaves a nut-allergic user a workable fat pool', () => {
    const nutFree = rules({ allergies: ['peanuts', 'tree_nuts'] });
    const fats = CATALOGUE.filter(
      (f) => f.categories.includes('fat') && resolveEligibility(f, nutFree).allowed,
    );
    expect(fats.length).toBeGreaterThanOrEqual(10);
  });

  it('leaves a coeliac a workable carbohydrate pool', () => {
    const glutenFree = rules({ allergies: ['cereals_containing_gluten'] });
    const carbs = CATALOGUE.filter(
      (f) => f.categories.includes('carbohydrate') && resolveEligibility(f, glutenFree).allowed,
    );
    console.log('gluten-free carbs', carbs.length, carbs.slice(0, 8).map((f) => f.name));
    expect(carbs.length).toBeGreaterThanOrEqual(15);
  });
});

describe('many-to-many categories', () => {
  it('places whole eggs under protein, fat and dairy from one record', () => {
    const eggs = findCatalogueFood('whole-eggs')!;
    expect(eggs.categories).toEqual(expect.arrayContaining(['protein', 'fat', 'dairy']));
    // One record, so one preference — changing eggs under Protein changes them
    // under Fats too.
    expect(CATALOGUE.filter((f) => f.name === 'Whole eggs')).toHaveLength(1);
  });

  it('places lentils under both protein and carbohydrate', () => {
    expect(findCatalogueFood('lentils')!.categories).toEqual(
      expect.arrayContaining(['protein', 'carbohydrate']),
    );
  });

  it('places salmon under both protein and fat', () => {
    expect(findCatalogueFood('salmon')!.categories).toEqual(
      expect.arrayContaining(['protein', 'fat']),
    );
  });

  it('places avocado under both fat and fruit', () => {
    expect(findCatalogueFood('avocado')!.categories).toEqual(
      expect.arrayContaining(['fat', 'fruit']),
    );
  });

  it('surfaces the same record in every category it belongs to', () => {
    const inProtein = foodsInCategory('protein').some((f) => f.id === 'whole-eggs');
    const inFat = foodsInCategory('fat').some((f) => f.id === 'whole-eggs');
    expect(inProtein && inFat).toBe(true);
  });
});

describe('search', () => {
  it('ranks an exact prefix first', () => {
    expect(searchCatalogue('chicken')[0]!.name).toBe('Chicken breast');
  });

  it('finds foods by alias', () => {
    expect(searchCatalogue('mince').some((f) => f.id === 'beef-mince-5')).toBe(true);
    expect(searchCatalogue('courgette').some((f) => f.id === 'courgette')).toBe(true);
    expect(searchCatalogue('zucchini').some((f) => f.id === 'courgette')).toBe(true);
  });

  it('returns everything for an empty query', () => {
    expect(searchCatalogue('')).toHaveLength(CATALOGUE.length);
  });
});

describe('category order', () => {
  it('covers every category present in the catalogue', () => {
    for (const category of Object.keys(categoryCounts())) {
      expect(CATEGORY_ORDER).toContain(category as never);
    }
  });
});
