import {
  ALLERGEN_GROUPS,
  allowedFoods,
  checkFoodPool,
  excludedFoods,
  makePreference,
  resolveEligibility,
  type EligibleFood,
  type UserFoodRules,
} from './eligibility';

function food(id: string, allergens: EligibleFood['allergenTags'] = [], derivation: EligibleFood['derivationTags'] = []): EligibleFood {
  return { id, allergenTags: allergens, derivationTags: derivation };
}

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

const CHICKEN = food('chicken', [], ['contains_poultry']);
const SALMON = food('salmon', ['fish'], ['contains_fish']);
const PEANUT_BUTTER = food('peanut-butter', ['peanuts']);
const MILK = food('milk', ['milk'], ['contains_dairy']);
const PRAWNS = food('prawns', ['crustaceans'], ['contains_shellfish']);
const RICE = food('rice');
const HONEY = food('honey', [], ['contains_honey']);
const HALAL_CHICKEN = food('halal-chicken', [], ['contains_poultry', 'halal_certified']);

describe('exclusion precedence', () => {
  it('an allergy beats LOVE IT', () => {
    const result = resolveEligibility(PEANUT_BUTTER, rules({
      allergies: ['peanuts'],
      preferences: { 'peanut-butter': makePreference('peanut-butter', 'love') },
    }));

    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('allergy');
  });

  it('an intolerance beats LOVE IT', () => {
    const result = resolveEligibility(MILK, rules({
      intolerances: ['milk'],
      preferences: { milk: makePreference('milk', 'love') },
    }));
    expect(result).toMatchObject({ allowed: false, reason: 'intolerance' });
  });

  it('CAN\'T EAT beats LOVE IT', () => {
    // The later write wins in the record; what matters is that a hard-excluded
    // record is never resurrected by a preference score.
    const result = resolveEligibility(RICE, rules({
      preferences: { rice: makePreference('rice', 'cant_eat') },
    }));
    expect(result).toMatchObject({ allowed: false, reason: 'manual_cant_eat' });
  });

  it('a medical exclusion beats a dietary rule and a preference', () => {
    const result = resolveEligibility(RICE, rules({
      medicalExclusions: ['rice'],
      preferences: { rice: makePreference('rice', 'love') },
    }));
    expect(result).toMatchObject({ allowed: false, reason: 'medical' });
  });

  it('allergy outranks intolerance when both match', () => {
    const result = resolveEligibility(SALMON, rules({ allergies: ['fish'], intolerances: ['fish'] }));
    expect(result).toMatchObject({ allowed: false, reason: 'allergy' });
  });

  it('a dietary rule outranks a manual CAN\'T EAT for reporting', () => {
    const result = resolveEligibility(CHICKEN, rules({
      dietaryStyle: 'vegan',
      preferences: { chicken: makePreference('chicken', 'cant_eat') },
    }));
    expect(result).toMatchObject({ allowed: false, reason: 'dietary_rule' });
  });

  it('KEEP IT OUT removes a candidate', () => {
    const result = resolveEligibility(RICE, rules({
      preferences: { rice: makePreference('rice', 'keep_out') },
    }));
    expect(result).toMatchObject({ allowed: false, reason: 'preference' });
  });
});

describe('preference scoring', () => {
  it('ranks loved above don\'t mind above unrated, without gating any of them', () => {
    const loved = resolveEligibility(RICE, rules({ preferences: { rice: makePreference('rice', 'love') } }));
    const fine = resolveEligibility(RICE, rules({ preferences: { rice: makePreference('rice', 'dont_mind') } }));
    const unrated = resolveEligibility(RICE, rules());

    expect(loved).toEqual({ allowed: true, preferenceScore: 5 });
    expect(fine).toEqual({ allowed: true, preferenceScore: 1 });
    expect(unrated).toEqual({ allowed: true, preferenceScore: 0 });
  });
});

describe('dietary styles', () => {
  const pool = [CHICKEN, SALMON, PRAWNS, MILK, RICE, HONEY, PEANUT_BUTTER];

  it('vegan removes every animal-derived food', () => {
    const allowed = allowedFoods(pool, rules({ dietaryStyle: 'vegan' })).map((f) => f.id);
    expect(allowed).toEqual(['rice', 'peanut-butter']);
  });

  it('vegetarian removes meat and fish but keeps dairy and honey', () => {
    const allowed = allowedFoods(pool, rules({ dietaryStyle: 'vegetarian' })).map((f) => f.id);
    expect(allowed).toContain('milk');
    expect(allowed).toContain('honey');
    expect(allowed).not.toContain('chicken');
    expect(allowed).not.toContain('salmon');
  });

  it('pescatarian removes meat but permits fish', () => {
    const allowed = allowedFoods(pool, rules({ dietaryStyle: 'pescatarian' })).map((f) => f.id);
    expect(allowed).toContain('salmon');
    expect(allowed).toContain('prawns');
    expect(allowed).not.toContain('chicken');
  });

  it('halal preference does not imply certification for a generic food', () => {
    const generic = resolveEligibility(CHICKEN, rules({ dietaryStyle: 'halal_preference' }));
    expect(generic).toMatchObject({ allowed: false, reason: 'religious_rule' });

    const certified = resolveEligibility(HALAL_CHICKEN, rules({ dietaryStyle: 'halal_preference' }));
    expect(certified.allowed).toBe(true);
  });

  it('halal preference leaves non-meat foods alone', () => {
    expect(resolveEligibility(RICE, rules({ dietaryStyle: 'halal_preference' })).allowed).toBe(true);
    expect(resolveEligibility(SALMON, rules({ dietaryStyle: 'halal_preference' })).allowed).toBe(true);
  });
});

describe('excludedFoods', () => {
  it('reports why each food was removed, for the review screen', () => {
    const excluded = excludedFoods([PEANUT_BUTTER, MILK, CHICKEN], rules({
      allergies: ['peanuts'],
      intolerances: ['milk'],
      dietaryStyle: 'vegetarian',
    }));

    expect(excluded.map((e) => [e.food.id, e.reason])).toEqual([
      ['peanut-butter', 'allergy'],
      ['milk', 'intolerance'],
      ['chicken', 'dietary_rule'],
    ]);
    for (const entry of excluded) expect(entry.detail.length).toBeGreaterThan(0);
  });
});

describe('makePreference', () => {
  it("marks CAN'T EAT as a hard exclusion", () => {
    const record = makePreference('x', 'cant_eat');
    expect(record.hardExcluded).toBe(true);
    expect(record.exclusionReason).toBe('manual_cant_eat');
  });

  it('records an optional reason without demanding detail', () => {
    expect(makePreference('x', 'cant_eat', 'medical').exclusionReason).toBe('medical');
  });

  it('leaves ordinary preferences unexcluded', () => {
    expect(makePreference('x', 'love').hardExcluded).toBe(false);
    expect(makePreference('x', 'keep_out').hardExcluded).toBe(false);
  });
});

describe('checkFoodPool', () => {
  it('hard-blocks when no valid plan can exist', () => {
    expect(checkFoodPool({ protein: 2, carbohydrate: 8, fat: 4, produce: 8 }).hardBlock).toBe(true);
    expect(checkFoodPool({ protein: 8, carbohydrate: 1, fat: 4, produce: 8 }).hardBlock).toBe(true);
  });

  it('warns rather than blocking on a narrow pool', () => {
    const check = checkFoodPool({ protein: 4, carbohydrate: 4, fat: 3, produce: 3 });
    expect(check.hardBlock).toBe(false);
    expect(check.warnings.length).toBeGreaterThan(0);
  });

  it('stays quiet on a healthy pool', () => {
    expect(checkFoodPool({ protein: 12, carbohydrate: 10, fat: 8, produce: 15 }).warnings).toEqual([]);
  });
});

describe('allergen catalogue', () => {
  it('covers all fourteen UK regulated groups', () => {
    expect(ALLERGEN_GROUPS).toHaveLength(14);
    expect(new Set(ALLERGEN_GROUPS).size).toBe(14);
  });
});
