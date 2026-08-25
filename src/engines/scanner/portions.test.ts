import {
  calculatePortion,
  checkPlausibility,
  classifyByMacros,
  crossCheckEnergy,
  fromPer100g,
  fromPer100ml,
  millilitresToGrams,
  remainingAfter,
  type NutrientVector,
  type ScannedProductNutrition,
} from './portions';

const CEREAL: NutrientVector = { kcal: 370, protein: 12, carbs: 70, fat: 4, fibre: 3.5 };

function product(overrides: Partial<ScannedProductNutrition> = {}): ScannedProductNutrition {
  return { basis: 'per_100g', basisQuantity: 100, nutrients: CEREAL, ...overrides };
}

describe('per-100g arithmetic', () => {
  it('matches the spec worked example', () => {
    // 40g of 370 kcal / P12 / C70 / F4 per 100g
    expect(fromPer100g(CEREAL, 40)).toMatchObject({ kcal: 148, protein: 4.8, carbs: 28, fat: 1.6 });
  });

  it('scales fibre with everything else', () => {
    expect(fromPer100g(CEREAL, 200).fibre).toBe(7);
  });
});

describe('per-100ml arithmetic', () => {
  it('scales by volume', () => {
    const milk: NutrientVector = { kcal: 47, protein: 3.5, carbs: 4.8, fat: 1.7 };
    expect(fromPer100ml(milk, 250)).toMatchObject({ kcal: 117.5, protein: 8.8 });
  });
});

describe('millilitresToGrams', () => {
  it('refuses to convert without a verified density', () => {
    expect(millilitresToGrams(250)).toBeNull();
    expect(millilitresToGrams(250, 0)).toBeNull();
  });

  it('converts when a density exists', () => {
    expect(millilitresToGrams(100, 0.92)).toBe(92);
  });
});

describe('calculatePortion', () => {
  it('calculates grams from a per-100g label', () => {
    const result = calculatePortion(product(), { kind: 'grams', grams: 60 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.nutrients.kcal).toBe(222);
  });

  it('refuses grams from a per-serving label with no serving weight', () => {
    const result = calculatePortion(
      product({ basis: 'per_serving', basisQuantity: 1 }),
      { kind: 'grams', grams: 60 },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('serving_weight_unknown');
  });

  it('calculates grams from a per-serving label once the serving weight is known', () => {
    const result = calculatePortion(
      product({ basis: 'per_serving', basisQuantity: 30, servingSizeG: 30, nutrients: { kcal: 111, protein: 3.6, carbs: 21, fat: 1.2 } }),
      { kind: 'grams', grams: 60 },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.nutrients.kcal).toBe(222);
  });

  it('refuses to treat millilitres as grams', () => {
    const result = calculatePortion(product({ basis: 'per_100ml' }), { kind: 'grams', grams: 100 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('basis_mismatch');
  });

  it('refuses a volume against a weight-based label', () => {
    const result = calculatePortion(product(), { kind: 'millilitres', millilitres: 250 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('basis_mismatch');
  });

  it('multiplies servings', () => {
    const result = calculatePortion(
      product({ basis: 'per_serving', basisQuantity: 1, nutrients: { kcal: 111, protein: 3.6, carbs: 21, fat: 1.2 } }),
      { kind: 'servings', servings: 2 },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.nutrients.kcal).toBe(222);
  });

  it('calculates the whole pack', () => {
    const result = calculatePortion(product({ packQuantity: 500, packUnit: 'g' }), { kind: 'whole_pack' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.nutrients.kcal).toBe(1850);
      expect(result.describedAs).toMatch(/500g/);
    }
  });

  it('refuses a whole pack with no pack size', () => {
    const result = calculatePortion(product(), { kind: 'whole_pack' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('pack_size_unknown');
  });
});

describe('checkPlausibility', () => {
  it('passes a normal label', () => {
    expect(checkPlausibility(CEREAL, 'per_100g')).toEqual([]);
  });

  it('rejects a negative value', () => {
    const issues = checkPlausibility({ ...CEREAL, protein: -3 }, 'per_100g');
    expect(issues).toContainEqual(expect.objectContaining({ field: 'protein', severity: 'error' }));
  });

  it('rejects more than 100g of a macro per 100g', () => {
    const issues = checkPlausibility({ ...CEREAL, carbs: 140 }, 'per_100g');
    expect(issues.some((i) => i.field === 'carbs' && i.severity === 'error')).toBe(true);
  });

  it('rejects impossible energy per 100g', () => {
    const issues = checkPlausibility({ ...CEREAL, kcal: 1200 }, 'per_100g');
    expect(issues.some((i) => i.field === 'kcal')).toBe(true);
  });

  it('does not apply per-100 limits to a per-serving panel', () => {
    // A 400g ready meal legitimately exceeds 100g of carbohydrate per serving.
    expect(checkPlausibility({ kcal: 800, protein: 40, carbs: 110, fat: 20 }, 'per_serving')).toEqual([]);
  });
});

describe('crossCheckEnergy', () => {
  it('accepts a label where macros and energy agree', () => {
    // 12x4 + 70x4 + 4x9 = 364 against a printed 370.
    expect(crossCheckEnergy(CEREAL).mismatch).toBe(false);
  });

  it('flags a mismatch without overwriting the printed value', () => {
    const result = crossCheckEnergy({ kcal: 200, protein: 12, carbs: 70, fat: 4 });
    expect(result.mismatch).toBe(true);
    expect(result.message).toMatch(/Check the label/);
    // The estimate is reported alongside; the printed figure is untouched.
    expect(result.estimateKcal).toBe(364);
  });

  it('tolerates the gap fibre and rounding legitimately create', () => {
    expect(crossCheckEnergy({ kcal: 350, protein: 12, carbs: 70, fat: 4, fibre: 8 }).mismatch).toBe(false);
  });
});

describe('classifyByMacros', () => {
  it('classifies a rice pouch as carbohydrate', () => {
    const result = classifyByMacros({ kcal: 150, protein: 3, carbs: 32, fat: 1 });
    expect(result.dominant).toBe('carbohydrate');
    expect(result.tags).toEqual(['carbohydrate']);
  });

  it('classifies peanut butter as both protein and fat', () => {
    const result = classifyByMacros({ kcal: 588, protein: 25, carbs: 20, fat: 50 });
    expect(result.tags).toContain('fat');
    expect(result.dominant).toBe('fat');
  });

  it('classifies salmon as protein and fat', () => {
    const result = classifyByMacros({ kcal: 208, protein: 20, carbs: 0, fat: 13 });
    expect(result.tags).toEqual(expect.arrayContaining(['protein', 'fat']));
  });

  it('classifies a balanced ready meal as mixed', () => {
    const result = classifyByMacros({ kcal: 500, protein: 28, carbs: 50, fat: 18 });
    expect(result.tags).toEqual(['mixed']);
  });

  it('classifies a protein yoghurt as protein', () => {
    const result = classifyByMacros({ kcal: 57, protein: 10, carbs: 4, fat: 0.4 });
    expect(result.dominant).toBe('protein');
  });

  it('does not fall over on a zero-macro product', () => {
    const result = classifyByMacros({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
    expect(result.tags.length).toBeGreaterThan(0);
  });
});

describe('remainingAfter', () => {
  it('subtracts a portion from the day', () => {
    const remaining = remainingAfter(
      { kcal: 1772, protein: 142, carbs: 204, fat: 50 },
      { kcal: 312, protein: 24, carbs: 38, fat: 8 },
    );
    expect(remaining).toMatchObject({ kcal: 1460, protein: 118, carbs: 166, fat: 42 });
  });

  it('goes negative rather than clamping, so an overshoot is visible', () => {
    const remaining = remainingAfter(
      { kcal: 200, protein: 10, carbs: 20, fat: 5 },
      { kcal: 500, protein: 30, carbs: 50, fat: 20 },
    );
    expect(remaining.kcal).toBe(-300);
  });
});
