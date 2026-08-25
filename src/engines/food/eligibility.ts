/**
 * Food eligibility and exclusion precedence (Feed spec §13).
 *
 * The rule this file exists to enforce: a food marked LOVE IT can never
 * override an allergy or any other hard exclusion. Preference is a *ranking*
 * signal; exclusion is a gate. They are evaluated in that order and never
 * traded off — a hard exclusion removes a candidate entirely rather than
 * scoring it down.
 *
 * Declared allergen data is information, never a guarantee. Anyone with a
 * severe allergy is told to check the physical packaging (§37).
 */

/** The 14 allergen groups regulated in UK food law. */
export type AllergenGroup =
  | 'celery' | 'cereals_containing_gluten' | 'crustaceans' | 'eggs' | 'fish'
  | 'lupin' | 'milk' | 'molluscs' | 'mustard' | 'peanuts' | 'sesame'
  | 'soybeans' | 'sulphites' | 'tree_nuts';

export const ALLERGEN_GROUPS: AllergenGroup[] = [
  'celery', 'cereals_containing_gluten', 'crustaceans', 'eggs', 'fish', 'lupin',
  'milk', 'molluscs', 'mustard', 'peanuts', 'sesame', 'soybeans', 'sulphites', 'tree_nuts',
];

/** Familiar labels for the UI. The stored tag is always the formal group. */
export const ALLERGEN_LABELS: Record<AllergenGroup, string> = {
  celery: 'Celery',
  cereals_containing_gluten: 'Gluten',
  crustaceans: 'Shellfish (crustaceans)',
  eggs: 'Egg',
  fish: 'Fish',
  lupin: 'Lupin',
  milk: 'Dairy',
  molluscs: 'Shellfish (molluscs)',
  mustard: 'Mustard',
  peanuts: 'Peanuts',
  sesame: 'Sesame',
  soybeans: 'Soya',
  sulphites: 'Sulphites',
  tree_nuts: 'Tree nuts',
};

export type DietaryStyle =
  | 'no_restrictions' | 'pescatarian' | 'vegetarian' | 'vegan' | 'halal_preference';

export const DIETARY_STYLE_LABELS: Record<DietaryStyle, string> = {
  no_restrictions: 'No restrictions',
  pescatarian: 'Pescatarian',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  halal_preference: 'Halal preference',
};

/**
 * What a food is derived from. Dietary styles are checked against these rather
 * than against a name — "chicken soup" is not a reliable signal, and a generic
 * chicken record is no proof a specific product is halal-certified (§15.7).
 */
export type DerivationTag =
  | 'contains_meat' | 'contains_poultry' | 'contains_fish' | 'contains_shellfish'
  | 'contains_dairy' | 'contains_egg' | 'contains_honey' | 'halal_certified';

export type PreferenceLevel = 'love' | 'dont_mind' | 'keep_out' | 'unrated';

export const PREFERENCE_LABELS: Record<Exclude<PreferenceLevel, 'unrated'> | 'cant_eat', string> = {
  love: 'Love it',
  dont_mind: "Don't mind it",
  keep_out: 'Keep it out',
  cant_eat: "Can't eat",
};

export type ExclusionReason =
  | 'allergy' | 'intolerance' | 'medical' | 'dietary_rule'
  | 'religious_rule' | 'manual_cant_eat' | 'preference';

export type FoodPreferenceRecord = {
  foodItemId: string;
  preference: PreferenceLevel;
  /** Set by CAN'T EAT, and by allergy/intolerance/medical declarations. */
  hardExcluded: boolean;
  exclusionReason?: ExclusionReason;
  updatedAt: string;
};

export type UserFoodRules = {
  dietaryStyle: DietaryStyle;
  allergies: AllergenGroup[];
  intolerances: AllergenGroup[];
  /** Medical exclusions, stored as food ids. */
  medicalExclusions: string[];
  preferences: Record<string, FoodPreferenceRecord>;
};

export type EligibleFood = {
  id: string;
  allergenTags: AllergenGroup[];
  derivationTags: DerivationTag[];
};

export type FoodEligibility =
  | { allowed: true; preferenceScore: number }
  | { allowed: false; reason: ExclusionReason; detail: string };

/**
 * Precedence, strongest first (§13):
 *   1 allergy · 2 intolerance · 3 medical · 4 dietary/religious rule
 *   5 manual CAN'T EAT · 6 KEEP IT OUT · 7 LOVE IT · 8 DON'T MIND · 9 unrated
 *
 * The first four come from the person's rules; the rest from the per-food
 * preference. This order is not an implementation detail — it is the safety
 * guarantee, and it is asserted directly in tests.
 */
export function resolveEligibility(food: EligibleFood, rules: UserFoodRules): FoodEligibility {
  const allergy = food.allergenTags.find((tag) => rules.allergies.includes(tag));
  if (allergy) {
    return {
      allowed: false,
      reason: 'allergy',
      detail: `Contains ${ALLERGEN_LABELS[allergy].toLowerCase()}, which you listed as an allergy.`,
    };
  }

  const intolerance = food.allergenTags.find((tag) => rules.intolerances.includes(tag));
  if (intolerance) {
    return {
      allowed: false,
      reason: 'intolerance',
      detail: `Contains ${ALLERGEN_LABELS[intolerance].toLowerCase()}, which you listed as an intolerance.`,
    };
  }

  if (rules.medicalExclusions.includes(food.id)) {
    return { allowed: false, reason: 'medical', detail: 'Excluded on medical grounds.' };
  }

  const dietary = checkDietaryStyle(food, rules.dietaryStyle);
  if (dietary) return dietary;

  const preference = rules.preferences[food.id];

  if (preference?.hardExcluded) {
    return {
      allowed: false,
      reason: preference.exclusionReason ?? 'manual_cant_eat',
      detail: 'You marked this as something you cannot eat.',
    };
  }

  if (preference?.preference === 'keep_out') {
    return { allowed: false, reason: 'preference', detail: 'You marked this KEEP IT OUT.' };
  }

  return {
    allowed: true,
    preferenceScore:
      preference?.preference === 'love' ? 5 : preference?.preference === 'dont_mind' ? 1 : 0,
  };
}

function checkDietaryStyle(food: EligibleFood, style: DietaryStyle): FoodEligibility | null {
  const has = (tag: DerivationTag): boolean => food.derivationTags.includes(tag);

  switch (style) {
    case 'no_restrictions':
      return null;

    case 'pescatarian':
      return has('contains_meat') || has('contains_poultry')
        ? { allowed: false, reason: 'dietary_rule', detail: 'Not pescatarian.' }
        : null;

    case 'vegetarian':
      return has('contains_meat') || has('contains_poultry') || has('contains_fish') || has('contains_shellfish')
        ? { allowed: false, reason: 'dietary_rule', detail: 'Not vegetarian.' }
        : null;

    case 'vegan':
      return has('contains_meat') || has('contains_poultry') || has('contains_fish') ||
        has('contains_shellfish') || has('contains_dairy') || has('contains_egg') || has('contains_honey')
        ? { allowed: false, reason: 'dietary_rule', detail: 'Not vegan.' }
        : null;

    case 'halal_preference':
      // A preference, not a certification claim. Meat and poultry are filtered
      // unless the record carries real certification.
      return (has('contains_meat') || has('contains_poultry')) && !has('halal_certified')
        ? {
            allowed: false,
            reason: 'religious_rule',
            detail: 'Not confirmed halal-certified. Check the product itself.',
          }
        : null;
  }
}

export function allowedFoods<T extends EligibleFood>(foods: T[], rules: UserFoodRules): T[] {
  return foods.filter((food) => resolveEligibility(food, rules).allowed);
}

export function excludedFoods<T extends EligibleFood>(
  foods: T[],
  rules: UserFoodRules,
): Array<{ food: T; reason: ExclusionReason; detail: string }> {
  const out: Array<{ food: T; reason: ExclusionReason; detail: string }> = [];
  for (const food of foods) {
    const result = resolveEligibility(food, rules);
    if (!result.allowed) out.push({ food, reason: result.reason, detail: result.detail });
  }
  return out;
}

/** Build a preference record, wiring CAN'T EAT to a hard exclusion. */
export function makePreference(
  foodItemId: string,
  choice: PreferenceLevel | 'cant_eat',
  reason?: ExclusionReason,
): FoodPreferenceRecord {
  if (choice === 'cant_eat') {
    return {
      foodItemId,
      preference: 'keep_out',
      hardExcluded: true,
      exclusionReason: reason ?? 'manual_cant_eat',
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    foodItemId,
    preference: choice,
    hardExcluded: false,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Feasibility check before generation (§14).
 *
 * Hard-block only when no valid plan can exist. A narrow pool is a warning —
 * refusing to generate because someone has limited tastes is worse than a
 * repetitive week.
 */
export const MIN_OPTIONS_PER_MEAL_TYPE = 3;

export type FoodPoolCheck = {
  hardBlock: boolean;
  warnings: string[];
  allowedProteinCount: number;
  allowedCarbohydrateCount: number;
  allowedFatCount: number;
  allowedProduceCount: number;
};

export function checkFoodPool(counts: {
  protein: number;
  carbohydrate: number;
  fat: number;
  produce: number;
}): FoodPoolCheck {
  const warnings: string[] = [];
  const hardBlock =
    counts.protein < MIN_OPTIONS_PER_MEAL_TYPE ||
    counts.carbohydrate < MIN_OPTIONS_PER_MEAL_TYPE ||
    counts.fat < 2;

  if (!hardBlock) {
    if (counts.protein < 6) warnings.push('Few protein sources left — expect repeats.');
    if (counts.carbohydrate < 5) warnings.push('Few carbohydrate sources left — expect repeats.');
    if (counts.produce < 5) warnings.push('Few fruit and vegetables left — your plan will be repetitive.');
  }

  return {
    hardBlock,
    warnings,
    allowedProteinCount: counts.protein,
    allowedCarbohydrateCount: counts.carbohydrate,
    allowedFatCount: counts.fat,
    allowedProduceCount: counts.produce,
  };
}
