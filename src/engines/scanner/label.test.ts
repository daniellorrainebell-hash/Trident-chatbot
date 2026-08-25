import {
  detectBasis,
  kjToKcal,
  mgToG,
  normaliseConfirmedLabel,
  parseLabel,
  parseNumber,
  sodiumToSalt,
  type OcrLine,
} from './label';

const lines = (...texts: string[]): OcrLine[] => texts.map((text) => ({ text, confidence: 0.9 }));

/** A typical UK back-of-pack panel. */
const UK_PANEL = lines(
  'Nutrition Information',
  'Typical values per 100g',
  'Energy 1553kJ / 370kcal',
  'Fat 4.0g',
  'of which saturates 0.9g',
  'Carbohydrate 70.0g',
  'of which sugars 1.2g',
  'Fibre 3.5g',
  'Protein 12.0g',
  'Salt 0.02g',
);

describe('parseNumber', () => {
  it('pulls the first number from a row', () => {
    expect(parseNumber('Protein 12.0g')).toBe(12);
    expect(parseNumber('Fat 4.0g')).toBe(4);
  });

  it('handles a decimal comma', () => {
    expect(parseNumber('Protein 12,5g')).toBe(12.5);
  });

  it('returns undefined when there is no number', () => {
    expect(parseNumber('Protein —')).toBeUndefined();
  });
});

describe('detectBasis', () => {
  it('reads per 100g', () => {
    expect(detectBasis('Typical values per 100g')).toMatchObject({ basis: 'per_100g' });
  });

  it('reads per 100ml', () => {
    expect(detectBasis('Per 100ml')).toMatchObject({ basis: 'per_100ml' });
  });

  it('reads per serving and per portion', () => {
    expect(detectBasis('Per serving')).toMatchObject({ basis: 'per_serving' });
    expect(detectBasis('Per portion (30g)')).toMatchObject({ basis: 'per_serving' });
  });

  it('drops confidence on a dual-column panel, because it cannot tell which was scanned', () => {
    const result = detectBasis('Per 100g    Per serving');
    expect(result.confidence).toBeLessThan(0.6);
  });

  it('reports no basis rather than guessing', () => {
    expect(detectBasis('Energy 370kcal')).toEqual({ confidence: 0 });
  });
});

describe('parseLabel', () => {
  it('reads a standard UK panel', () => {
    const label = parseLabel(UK_PANEL);

    expect(label.basis).toBe('per_100g');
    // The row is "Energy 1553kJ / 370kcal" — the kcal figure is the second
    // number, and taking the first would be a four-fold error.
    expect(label.energyKcal?.parsedValue).toBe(370);
    expect(label.energyKj?.parsedValue).toBe(1553);
    expect(label.protein?.parsedValue).toBe(12);
    expect(label.carbohydrate?.parsedValue).toBe(70);
    expect(label.fat?.parsedValue).toBe(4);
    expect(label.fibre?.parsedValue).toBe(3.5);
  });

  it('does not let "saturates" capture the fat row, or vice versa', () => {
    const label = parseLabel(UK_PANEL);
    expect(label.fat?.rawText).toBe('Fat 4.0g');
    expect(label.saturates?.rawText).toBe('of which saturates 0.9g');
  });

  it('does not let "sugars" capture the carbohydrate row', () => {
    const label = parseLabel(UK_PANEL);
    expect(label.carbohydrate?.rawText).toBe('Carbohydrate 70.0g');
    expect(label.sugars?.rawText).toBe('of which sugars 1.2g');
  });

  it('always requires confirmation of the critical fields, however confident', () => {
    const label = parseLabel(lines('Per 100g', 'Energy 370kcal', 'Protein 12g', 'Carbohydrate 70g', 'Fat 4g')
      .map((l) => ({ ...l, confidence: 1 })));

    expect(label.energyKcal?.requiresConfirmation).toBe(true);
    expect(label.protein?.requiresConfirmation).toBe(true);
    expect(label.carbohydrate?.requiresConfirmation).toBe(true);
    expect(label.fat?.requiresConfirmation).toBe(true);
  });

  it('reports a missing field rather than defaulting it to zero', () => {
    const label = parseLabel(lines('Per 100g', 'Energy 370kcal', 'Fat 4g'));
    expect(label.missing).toContain('protein');
    expect(label.protein).toBeUndefined();
  });

  it('asks for the basis when the panel does not state one', () => {
    const label = parseLabel(lines('Energy 370kcal', 'Protein 12g', 'Carbohydrate 70g', 'Fat 4g'));
    expect(label.missing).toContain('basis');
    expect(label.notes.join(' ')).toMatch(/per 100g/i);
  });

  it('reads serving size and servings per pack', () => {
    const label = parseLabel(lines(
      'Per serving', 'Serving size: 30g', '10 servings per pack', 'Energy 120kcal',
      'Protein 5g', 'Carbohydrate 18g', 'Fat 2g',
    ));
    expect(label.servingSizeG).toBe(30);
    expect(label.servingsPerPack).toBe(10);
  });

  it('handles an empty scan without throwing', () => {
    const label = parseLabel([]);
    expect(label.missing).toContain('basis');
    expect(label.missing).toContain('protein');
  });
});

describe('combined energy rows', () => {
  it('takes kcal from a combined kJ/kcal row, not the first number', () => {
    const label = parseLabel(lines('Per 100g', 'Energy 1553kJ / 370kcal', 'Protein 12g', 'Carbohydrate 70g', 'Fat 4g'));
    expect(label.energyKcal?.parsedValue).toBe(370);
  });

  it('handles the reverse order too', () => {
    const label = parseLabel(lines('Per 100g', 'Energy 370 kcal (1553 kJ)', 'Protein 12g', 'Carbohydrate 70g', 'Fat 4g'));
    expect(label.energyKcal?.parsedValue).toBe(370);
    expect(label.energyKj?.parsedValue).toBe(1553);
  });

  it('handles a panel that prints only kJ', () => {
    const label = parseLabel(lines('Per 100g', 'Energy 1553kJ', 'Protein 12g', 'Carbohydrate 70g', 'Fat 4g'));
    expect(label.energyKj?.parsedValue).toBe(1553);
  });
});

describe('unit normalisation', () => {
  it('converts milligrams to grams', () => {
    expect(mgToG(2500)).toBe(2.5);
  });

  it('converts kJ to kcal', () => {
    expect(kjToKcal(1553)).toBeCloseTo(371.2, 1);
  });

  it('converts sodium to salt', () => {
    expect(sodiumToSalt(0.4)).toBeCloseTo(1, 5);
  });
});

describe('normaliseConfirmedLabel', () => {
  it('keeps the printed kcal rather than recomputing it', () => {
    // 4/4/9 would give 372; the label says 370 and the label wins.
    const result = normaliseConfirmedLabel({
      energyKcal: 370, proteinG: 12, carbohydrateG: 70, fatG: 4,
    });
    expect(result.energyKcal).toBe(370);
    expect(result.calculatedFields).not.toContain('energyKcal');
  });

  it('falls back to kJ only when kcal is absent, and marks it calculated', () => {
    const result = normaliseConfirmedLabel({
      energyKj: 1553, proteinG: 12, carbohydrateG: 70, fatG: 4,
    });
    expect(result.energyKcal).toBe(371);
    expect(result.calculatedFields).toContain('energyKcal');
  });

  it('derives salt from sodium and marks it calculated', () => {
    const result = normaliseConfirmedLabel({
      energyKcal: 370, proteinG: 12, carbohydrateG: 70, fatG: 4, sodiumG: 0.4,
    });
    expect(result.saltG).toBe(1);
    expect(result.calculatedFields).toContain('saltG');
  });

  it('prefers a printed salt figure over the sodium conversion', () => {
    const result = normaliseConfirmedLabel({
      energyKcal: 370, proteinG: 12, carbohydrateG: 70, fatG: 4, saltG: 0.02, sodiumG: 0.4,
    });
    expect(result.saltG).toBe(0.02);
    expect(result.calculatedFields).not.toContain('saltG');
  });
});
