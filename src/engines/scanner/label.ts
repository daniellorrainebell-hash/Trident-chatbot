/**
 * Nutrition-label parsing (Feed spec §23, §24).
 *
 * Deterministic throughout. OCR supplies text; this file turns text into
 * numbers using explicit aliases and unit rules, and nothing here calls a
 * model. An LLM guessing at a smudged carbohydrate row is precisely the
 * failure the spec is written to prevent.
 *
 * Every critical field is returned needing confirmation regardless of
 * confidence, because a confident misread is still a misread.
 */

export type NutrientBasis = 'per_100g' | 'per_100ml' | 'per_serving';

export type LabelUnit = 'g' | 'mg' | 'kcal' | 'kJ';

export type OcrNutrientField = {
  rawText: string;
  parsedValue?: number;
  unit?: LabelUnit;
  confidence: number;
  requiresConfirmation: boolean;
};

export type ParsedLabel = {
  basis?: NutrientBasis;
  basisConfidence: number;
  servingSizeG?: number;
  servingsPerPack?: number;
  energyKcal?: OcrNutrientField;
  energyKj?: OcrNutrientField;
  protein?: OcrNutrientField;
  carbohydrate?: OcrNutrientField;
  sugars?: OcrNutrientField;
  fat?: OcrNutrientField;
  saturates?: OcrNutrientField;
  fibre?: OcrNutrientField;
  salt?: OcrNutrientField;
  sodium?: OcrNutrientField;
  /** Fields the parser could not find at all. */
  missing: string[];
  /** Non-blocking observations for the confirmation screen. */
  notes: string[];
};

/** Row labels seen on UK packaging, lowercased for matching. */
export const LABEL_ALIASES = {
  energyKcal: ['energy kcal', 'kcal', 'calories', 'energy (kcal)'],
  energyKj: ['energy kj', 'kj', 'energy (kj)'],
  fat: ['fat', 'total fat', 'fat (g)'],
  saturates: ['of which saturates', 'saturates', 'saturated fat', 'of which saturated'],
  carbs: ['carbohydrate', 'carbohydrates', 'carbs', 'total carbohydrate'],
  sugars: ['of which sugars', 'sugars', 'total sugars'],
  fibre: ['fibre', 'fiber', 'dietary fibre', 'dietary fiber'],
  protein: ['protein'],
  salt: ['salt'],
  sodium: ['sodium'],
} as const;

/**
 * Critical fields always require confirmation, even at high confidence (§23).
 * These are the values that decide whether a plan is right.
 */
const ALWAYS_CONFIRM = new Set(['energyKcal', 'protein', 'carbohydrate', 'fat']);

const BASIS_PATTERNS: Array<{ pattern: RegExp; basis: NutrientBasis }> = [
  { pattern: /per\s*100\s*g/i, basis: 'per_100g' },
  { pattern: /per\s*100\s*ml/i, basis: 'per_100ml' },
  { pattern: /per\s*serving/i, basis: 'per_serving' },
  { pattern: /per\s*portion/i, basis: 'per_serving' },
  { pattern: /each\s*serving/i, basis: 'per_serving' },
];

export function detectBasis(text: string): { basis?: NutrientBasis; confidence: number } {
  const matches = BASIS_PATTERNS.filter((p) => p.pattern.test(text));

  if (matches.length === 0) return { confidence: 0 };
  // Two bases on one panel is the classic dual-column label. The parser cannot
  // tell which column it read, so confidence drops and the user must say.
  if (matches.length > 1) return { basis: matches[0]!.basis, confidence: 0.4 };
  return { basis: matches[0]!.basis, confidence: 0.9 };
}

/** Pull the first number from a row, tolerating commas and stray characters. */
export function parseNumber(text: string): number | undefined {
  const match = text.replace(/,/g, '.').match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * Pull the number attached to a specific unit.
 *
 * UK panels almost always print energy as one row — "Energy 1553kJ / 370kcal".
 * Taking the first number off that row yields 1553 kcal, a four-fold error on
 * the single most important figure on the label. The unit has to be matched,
 * not assumed.
 */
export function parseValueForUnit(text: string, unit: LabelUnit): number | undefined {
  const normalised = text.replace(/,/g, '.');
  const pattern = new RegExp(`(-?\\d+(?:\\.\\d+)?)\\s*${unit}\\b`, 'i');
  const match = normalised.match(pattern);
  if (!match) return undefined;
  const value = Number.parseFloat(match[1]!);
  return Number.isFinite(value) ? value : undefined;
}

function detectUnit(text: string): LabelUnit | undefined {
  const lower = text.toLowerCase();
  if (/\bkcal\b/.test(lower)) return 'kcal';
  if (/\bkj\b/.test(lower)) return 'kJ';
  if (/\bmg\b/.test(lower)) return 'mg';
  if (/\bg\b/.test(lower)) return 'g';
  return undefined;
}

function findRow(lines: string[], aliases: readonly string[]): string | undefined {
  // Longest alias first, so "of which saturates" wins over "saturates" and
  // "energy kcal" is not swallowed by a bare "kcal".
  const ordered = [...aliases].sort((a, b) => b.length - a.length);
  for (const alias of ordered) {
    const hit = lines.find((line) => line.toLowerCase().includes(alias));
    if (hit) return hit;
  }
  return undefined;
}

function buildField(
  key: string,
  row: string | undefined,
  confidence: number,
  /** When set, take the number attached to this unit rather than the first one. */
  preferUnit?: LabelUnit,
): OcrNutrientField | undefined {
  if (!row) return undefined;

  const parsedValue = preferUnit
    ? (parseValueForUnit(row, preferUnit) ?? parseNumber(row))
    : parseNumber(row);

  // A combined energy row is ambiguous until the unit pins it down, so drop
  // confidence when the preferred unit was not actually found.
  const unitMatched = preferUnit ? parseValueForUnit(row, preferUnit) !== undefined : true;

  return {
    rawText: row.trim(),
    parsedValue,
    unit: preferUnit ?? detectUnit(row),
    confidence: parsedValue === undefined ? 0 : unitMatched ? confidence : confidence * 0.5,
    requiresConfirmation:
      ALWAYS_CONFIRM.has(key) || parsedValue === undefined || confidence < 0.8 || !unitMatched,
  };
}

export type OcrLine = { text: string; confidence?: number };

/**
 * Parse OCR output into a structured label.
 *
 * Deliberately conservative: a field the parser cannot find is reported as
 * missing rather than defaulted to zero. A zero the user does not notice is
 * worse than a blank they have to fill in.
 */
export function parseLabel(lines: OcrLine[]): ParsedLabel {
  const texts = lines.map((l) => l.text);
  const joined = texts.join('\n');
  const meanConfidence =
    lines.length > 0
      ? lines.reduce((sum, l) => sum + (l.confidence ?? 0.75), 0) / lines.length
      : 0;

  const basisResult = detectBasis(joined);
  const notes: string[] = [];

  if (basisResult.confidence > 0 && basisResult.confidence < 0.6) {
    notes.push('More than one column was detected. Confirm which one you scanned.');
  }

  const label: ParsedLabel = {
    basis: basisResult.basis,
    basisConfidence: basisResult.confidence,
    servingSizeG: parseServingSize(joined),
    servingsPerPack: parseServingsPerPack(joined),
    energyKcal: buildField('energyKcal', findRow(texts, LABEL_ALIASES.energyKcal), meanConfidence, 'kcal'),
    energyKj: buildField('energyKj', findRow(texts, LABEL_ALIASES.energyKj), meanConfidence, 'kJ'),
    protein: buildField('protein', findRow(texts, LABEL_ALIASES.protein), meanConfidence),
    carbohydrate: buildField('carbohydrate', findRow(texts, LABEL_ALIASES.carbs), meanConfidence),
    sugars: buildField('sugars', findRow(texts, LABEL_ALIASES.sugars), meanConfidence),
    fat: buildField('fat', findRow(texts, LABEL_ALIASES.fat), meanConfidence),
    saturates: buildField('saturates', findRow(texts, LABEL_ALIASES.saturates), meanConfidence),
    fibre: buildField('fibre', findRow(texts, LABEL_ALIASES.fibre), meanConfidence),
    salt: buildField('salt', findRow(texts, LABEL_ALIASES.salt), meanConfidence),
    sodium: buildField('sodium', findRow(texts, LABEL_ALIASES.sodium), meanConfidence),
    missing: [],
    notes,
  };

  for (const key of ['energyKcal', 'protein', 'carbohydrate', 'fat'] as const) {
    if (!label[key]?.parsedValue) label.missing.push(key);
  }

  if (!label.basis) {
    label.missing.push('basis');
    notes.push('The panel basis was not detected. Tell us whether these figures are per 100g, per 100ml or per serving.');
  }

  return label;
}

function parseServingSize(text: string): number | undefined {
  const match = text.match(/serving\s*(?:size)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(g|ml)/i);
  return match ? Number.parseFloat(match[1]!) : undefined;
}

function parseServingsPerPack(text: string): number | undefined {
  const match = text.match(/(\d+(?:\.\d+)?)\s*servings?\s*per\s*(?:pack|container)/i);
  return match ? Number.parseFloat(match[1]!) : undefined;
}

/* ── Unit normalisation (§23) ────────────────────────────────────────────── */

export function mgToG(mg: number): number {
  return mg / 1000;
}

/** kJ to kcal, used only when kcal is absent from the panel. */
export function kjToKcal(kj: number): number {
  return kj / 4.184;
}

/** Sodium to salt. Flagged as calculated so the UI never presents it as printed. */
export function sodiumToSalt(sodiumG: number): number {
  return sodiumG * 2.5;
}

export type NormalisedNutrients = {
  energyKcal: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fibreG?: number;
  sugarsG?: number;
  saturatesG?: number;
  saltG?: number;
  /** Fields derived rather than read, so the UI can mark them. */
  calculatedFields: string[];
};

/**
 * Turn a confirmed label into normalised nutrients.
 *
 * The printed kcal is never overwritten with a 4/4/9 estimate — fibre,
 * polyols, alcohol and rounding all legitimately explain a gap (§24).
 */
export function normaliseConfirmedLabel(confirmed: {
  energyKcal?: number;
  energyKj?: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fibreG?: number;
  sugarsG?: number;
  saturatesG?: number;
  saltG?: number;
  sodiumG?: number;
}): NormalisedNutrients {
  const calculatedFields: string[] = [];

  let energyKcal = confirmed.energyKcal;
  if (energyKcal === undefined && confirmed.energyKj !== undefined) {
    energyKcal = Math.round(kjToKcal(confirmed.energyKj));
    calculatedFields.push('energyKcal');
  }

  let saltG = confirmed.saltG;
  if (saltG === undefined && confirmed.sodiumG !== undefined) {
    saltG = round(sodiumToSalt(confirmed.sodiumG), 2);
    calculatedFields.push('saltG');
  }

  return {
    energyKcal: energyKcal ?? 0,
    proteinG: confirmed.proteinG,
    carbohydrateG: confirmed.carbohydrateG,
    fatG: confirmed.fatG,
    fibreG: confirmed.fibreG,
    sugarsG: confirmed.sugarsG,
    saturatesG: confirmed.saturatesG,
    saltG,
    calculatedFields,
  };
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}
