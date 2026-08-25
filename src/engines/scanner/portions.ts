import type { NormalisedNutrients, NutrientBasis } from './label';

/**
 * Portion and pack arithmetic (Feed spec §25), and scanned-product
 * validation and classification (§24, §26).
 *
 * All of it is per-100 arithmetic with explicit units. The one rule underneath
 * every function here: a basis is never converted without the information that
 * conversion actually requires. Treating millilitres as grams, or per-serving
 * as per-100g, is how a plan quietly goes hundreds of calories wrong.
 */

export type NutrientVector = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre?: number;
};

export function multiplyNutrients(n: NutrientVector, factor: number): NutrientVector {
  return {
    kcal: round(n.kcal * factor, 1),
    protein: round(n.protein * factor, 1),
    carbs: round(n.carbs * factor, 1),
    fat: round(n.fat * factor, 1),
    fibre: n.fibre === undefined ? undefined : round(n.fibre * factor, 1),
  };
}

export function subtractNutrients(a: NutrientVector, b: NutrientVector): NutrientVector {
  return {
    kcal: round(a.kcal - b.kcal, 1),
    protein: round(a.protein - b.protein, 1),
    carbs: round(a.carbs - b.carbs, 1),
    fat: round(a.fat - b.fat, 1),
    fibre: a.fibre === undefined ? undefined : round(a.fibre - (b.fibre ?? 0), 1),
  };
}

export function toVector(n: NormalisedNutrients): NutrientVector {
  return {
    kcal: n.energyKcal,
    protein: n.proteinG,
    carbs: n.carbohydrateG,
    fat: n.fatG,
    fibre: n.fibreG,
  };
}

/** Nutrients for a chosen weight, from per-100g data. */
export function fromPer100g(per100g: NutrientVector, grams: number): NutrientVector {
  return multiplyNutrients(per100g, grams / 100);
}

/**
 * Nutrients for a chosen volume, from per-100ml data.
 *
 * Deliberately separate from the gram path. Millilitres are only grams when a
 * verified density says so, and assuming otherwise is wrong for oil, syrup and
 * most drinks.
 */
export function fromPer100ml(per100ml: NutrientVector, millilitres: number): NutrientVector {
  return multiplyNutrients(per100ml, millilitres / 100);
}

export function fromServings(perServing: NutrientVector, servings: number): NutrientVector {
  return multiplyNutrients(perServing, servings);
}

export function forWholePack(per100: NutrientVector, packQuantity: number): NutrientVector {
  return multiplyNutrients(per100, packQuantity / 100);
}

export function millilitresToGrams(ml: number, densityGPerMl?: number): number | null {
  // Without a verified density there is no honest conversion.
  if (!densityGPerMl || densityGPerMl <= 0) return null;
  return round(ml * densityGPerMl, 1);
}

export type PortionRequest =
  | { kind: 'grams'; grams: number }
  | { kind: 'millilitres'; millilitres: number }
  | { kind: 'servings'; servings: number }
  | { kind: 'whole_pack' };

export type PortionResult =
  | { ok: true; nutrients: NutrientVector; describedAs: string }
  | { ok: false; reason: 'serving_weight_unknown' | 'basis_mismatch' | 'pack_size_unknown'; detail: string };

export type ScannedProductNutrition = {
  basis: NutrientBasis;
  /** 100 for per-100 bases; the serving size for a per-serving panel. */
  basisQuantity: number;
  nutrients: NutrientVector;
  servingSizeG?: number;
  packQuantity?: number;
  packUnit?: 'g' | 'ml';
};

/**
 * Nutrients for a requested portion.
 *
 * Returns a typed failure rather than a guess whenever the label does not
 * carry what the conversion needs — a per-serving panel with no serving weight
 * genuinely cannot answer "how much is 60g of this".
 */
export function calculatePortion(
  product: ScannedProductNutrition,
  request: PortionRequest,
): PortionResult {
  switch (request.kind) {
    case 'grams': {
      if (product.basis === 'per_100g') {
        return {
          ok: true,
          nutrients: fromPer100g(product.nutrients, request.grams),
          describedAs: `${request.grams}g`,
        };
      }
      if (product.basis === 'per_serving') {
        if (!product.servingSizeG) {
          return {
            ok: false,
            reason: 'serving_weight_unknown',
            detail: 'This label gives figures per serving. Enter the serving weight in grams to work in grams.',
          };
        }
        return {
          ok: true,
          nutrients: fromServings(product.nutrients, request.grams / product.servingSizeG),
          describedAs: `${request.grams}g`,
        };
      }
      return {
        ok: false,
        reason: 'basis_mismatch',
        detail: 'This label gives figures per 100ml. Enter a volume, or provide a verified density.',
      };
    }

    case 'millilitres': {
      if (product.basis !== 'per_100ml') {
        return {
          ok: false,
          reason: 'basis_mismatch',
          detail: 'This label gives figures by weight. Enter a weight in grams.',
        };
      }
      return {
        ok: true,
        nutrients: fromPer100ml(product.nutrients, request.millilitres),
        describedAs: `${request.millilitres}ml`,
      };
    }

    case 'servings': {
      if (product.basis !== 'per_serving') {
        if (!product.servingSizeG) {
          return {
            ok: false,
            reason: 'serving_weight_unknown',
            detail: 'Enter the serving weight before working in servings.',
          };
        }
        const grams = product.servingSizeG * request.servings;
        return {
          ok: true,
          nutrients: fromPer100g(product.nutrients, grams),
          describedAs: `${request.servings} × ${product.servingSizeG}g`,
        };
      }
      return {
        ok: true,
        nutrients: fromServings(product.nutrients, request.servings),
        describedAs: `${request.servings} serving${request.servings === 1 ? '' : 's'}`,
      };
    }

    case 'whole_pack': {
      if (!product.packQuantity) {
        return { ok: false, reason: 'pack_size_unknown', detail: 'No pack size on this record.' };
      }
      if (product.basis === 'per_serving') {
        if (!product.servingSizeG) {
          return {
            ok: false,
            reason: 'serving_weight_unknown',
            detail: 'Enter the serving weight to calculate the whole pack.',
          };
        }
        return {
          ok: true,
          nutrients: fromServings(product.nutrients, product.packQuantity / product.servingSizeG),
          describedAs: `whole pack (${product.packQuantity}${product.packUnit ?? 'g'})`,
        };
      }
      return {
        ok: true,
        nutrients: forWholePack(product.nutrients, product.packQuantity),
        describedAs: `whole pack (${product.packQuantity}${product.packUnit ?? 'g'})`,
      };
    }
  }
}

/* ── Plausibility and cross-checks (§24) ─────────────────────────────────── */

export type PlausibilityIssue = {
  field: string;
  severity: 'warning' | 'error';
  message: string;
};

/**
 * Sanity-check confirmed label values.
 *
 * Warnings, not silent corrections. The user confirmed these figures against
 * the packaging in front of them; the app's job is to point at what looks
 * wrong, not to overwrite it.
 */
export function checkPlausibility(
  nutrients: NutrientVector,
  basis: NutrientBasis,
): PlausibilityIssue[] {
  const issues: PlausibilityIssue[] = [];
  const per100 = basis !== 'per_serving';

  for (const [field, value] of [
    ['protein', nutrients.protein],
    ['carbs', nutrients.carbs],
    ['fat', nutrients.fat],
    ['kcal', nutrients.kcal],
  ] as const) {
    if (value < 0) {
      issues.push({ field, severity: 'error', message: `${field} cannot be negative.` });
    }
  }

  if (per100) {
    for (const [field, value] of [
      ['protein', nutrients.protein],
      ['carbs', nutrients.carbs],
      ['fat', nutrients.fat],
    ] as const) {
      if (value > 100) {
        issues.push({
          field,
          severity: 'error',
          message: `${field} above 100g per 100g is not possible. Check the column you scanned.`,
        });
      }
    }

    // Pure fat tops out near 900 kcal/100g.
    if (nutrients.kcal > 950) {
      issues.push({
        field: 'kcal',
        severity: 'error',
        message: 'Energy above 950 kcal per 100g is not possible. Check the column you scanned.',
      });
    }
  }

  return issues;
}

export const ENERGY_CROSS_CHECK_THRESHOLD = 0.15;

/**
 * Compare printed energy against the 4/4/9 estimate.
 *
 * A mismatch is surfaced, never resolved automatically: fibre, polyols,
 * alcohol, organic acids and rounding all explain real gaps, so overwriting
 * the printed figure would be wrong more often than right.
 */
export function crossCheckEnergy(nutrients: NutrientVector): {
  estimateKcal: number;
  differenceFraction: number;
  mismatch: boolean;
  message?: string;
} {
  const estimate = nutrients.protein * 4 + nutrients.carbs * 4 + nutrients.fat * 9;
  const difference = Math.abs(nutrients.kcal - estimate) / Math.max(nutrients.kcal, 1);
  const mismatch = difference > ENERGY_CROSS_CHECK_THRESHOLD;

  return {
    estimateKcal: Math.round(estimate),
    differenceFraction: round(difference, 3),
    mismatch,
    message: mismatch
      ? 'The detected calorie value does not closely match the detected macros. Check the label before saving.'
      : undefined,
  };
}

/* ── Classification (§26) ────────────────────────────────────────────────── */

export type MacroCategory = 'protein' | 'carbohydrate' | 'fat' | 'mixed';

export const CATEGORY_CONTRIBUTION_THRESHOLD = 0.2;

/**
 * Classify a product by where its energy comes from.
 *
 * Navigation metadata for the catalogue, not a judgement — the spec is explicit
 * that foods are never labelled good or bad. Every macro clearing the threshold
 * earns a tag, so peanut butter lands under both Protein and Fat.
 */
export function classifyByMacros(nutrients: NutrientVector): {
  tags: MacroCategory[];
  dominant: MacroCategory;
  shares: { protein: number; carbohydrate: number; fat: number };
} {
  const pKcal = nutrients.protein * 4;
  const cKcal = nutrients.carbs * 4;
  const fKcal = nutrients.fat * 9;
  const total = Math.max(pKcal + cKcal + fKcal, 1);

  const shares = {
    protein: round(pKcal / total, 3),
    carbohydrate: round(cKcal / total, 3),
    fat: round(fKcal / total, 3),
  };

  const tags: MacroCategory[] = [];
  if (shares.protein >= CATEGORY_CONTRIBUTION_THRESHOLD) tags.push('protein');
  if (shares.carbohydrate >= CATEGORY_CONTRIBUTION_THRESHOLD) tags.push('carbohydrate');
  if (shares.fat >= CATEGORY_CONTRIBUTION_THRESHOLD) tags.push('fat');

  const dominant: MacroCategory =
    shares.protein >= shares.carbohydrate && shares.protein >= shares.fat
      ? 'protein'
      : shares.carbohydrate >= shares.fat
        ? 'carbohydrate'
        : 'fat';

  // Three roughly equal contributors is a composed meal, not an ingredient.
  if (tags.length === 3) return { tags: ['mixed'], dominant: 'mixed', shares };

  return { tags: tags.length > 0 ? tags : [dominant], dominant, shares };
}

/** What the portion leaves against the day. */
export function remainingAfter(
  remaining: NutrientVector,
  portion: NutrientVector,
): NutrientVector {
  return subtractNutrients(remaining, portion);
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}
