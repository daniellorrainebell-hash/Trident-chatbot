import type { IsoDate, IsoDateTime, Uuid } from './units';

export type Sex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extremely_active';

export type TrainingExperience =
  | 'new'          // < 6 months
  | 'novice'       // 6–18 months
  | 'intermediate' // 1.5–3 years
  | 'advanced'     // 3–5 years
  | 'veteran';     // 5+ years

export type PrimaryActivity =
  | 'bodybuilding' | 'strength' | 'powerlifting' | 'boxing' | 'mma'
  | 'kickboxing_muay_thai' | 'cross_training' | 'running' | 'hybrid'
  | 'general_fitness';

export type TrainingGoal =
  | 'lose_body_fat' | 'build_muscle' | 'maintain_recomp' | 'improve_strength'
  | 'improve_conditioning' | 'sports_performance' | 'fight_preparation'
  | 'be_consistent';

export type NutritionGoal = 'lose_body_fat' | 'build_muscle' | 'maintain_recomp';

export type NutritionProfile = {
  userId: Uuid;
  sex: Sex;
  ageYears: number;
  heightCm: number;
  currentWeightKg: number;
  bodyFatPercent: number | null;
  activityLevel: ActivityLevel;
  trainingSessionsPerWeek: number;
  averageSessionMinutes: number;
  experience: TrainingExperience;
  goal: NutritionGoal;
  targetWeightKg: number | null;
  /** What the user asked for. Policy decides what they actually get. */
  requestedTimeframeWeeks: number | null;
  mealsPerDay: number;
  /** Declared health flags. Drive the exclusion checks in spec §33. */
  isPregnant: boolean;
  isBreastfeeding: boolean;
  hasEatingDisorderHistory: boolean;
  hasMedicalCondition: boolean;
  medicalNotes?: string;
};

export type MacroTargets = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number;
};

/**
 * The output of the deterministic energy engine (spec §29, §30).
 *
 * Every field is recorded, including which equation and policy version produced
 * it, so a target can be re-derived and audited months later. No LLM writes here.
 */
export type EnergyCalculation = {
  equation: 'mifflin_st_jeor' | 'katch_mcardle';
  equationVersion: number;
  policyVersion: number;
  bmr: number;
  activityMultiplier: number;
  /** TDEE — maintenance estimate, not a measurement. */
  maintenanceCalories: number;
  /** Signed. Negative for a deficit. */
  calorieAdjustment: number;
  targetCalories: number;
  macros: MacroTargets;
  calculatedAt: IsoDateTime;
};

export type SafetyDecisionKind =
  | 'approved'
  | 'approved_with_adjustment'
  | 'blocked_age'
  | 'blocked_pregnancy'
  | 'blocked_breastfeeding'
  | 'blocked_eating_disorder'
  | 'blocked_medical'
  | 'blocked_rate_unsupported'
  | 'blocked_energy_floor';

export type SafetyDecision = {
  kind: SafetyDecisionKind;
  approved: boolean;
  /** User-facing explanation. Plain, non-clinical, never a diagnosis. */
  message: string;
  /** Set when the request was clamped rather than refused. */
  adjustment?: {
    field: 'timeframe_weeks' | 'target_calories' | 'weekly_rate_kg';
    requested: number;
    supported: number;
  };
  /** True when the user should be routed to a professional (spec §33). */
  referralSuggested: boolean;
  policyVersion: number;
  decidedAt: IsoDateTime;
};

export type TimeframeAssessment = {
  requestedWeeks: number | null;
  /** Shortest timeframe the policy will support for this weight change. */
  earliestSupportedWeeks: number;
  totalChangeKg: number;
  requestedWeeklyRateKg: number;
  supportedWeeklyRateKg: number;
  withinPolicy: boolean;
};

export type PreferenceState = 'love_it' | 'dont_mind_it' | 'keep_it_out';

export type FoodCategory =
  | 'protein' | 'carbohydrate' | 'fat' | 'vegetable' | 'fruit'
  | 'dairy' | 'pantry' | 'supplement';

export type ShoppingAisle =
  | 'meat_fish' | 'dairy' | 'carbohydrates' | 'fruit_veg'
  | 'pantry' | 'frozen' | 'supplements';

/**
 * Spec §37: state is not optional. 100 g of raw rice and 100 g of cooked rice
 * are different foods nutritionally, and silently mixing them is how a plan
 * ends up hundreds of calories out.
 */
export type FoodState = 'raw' | 'cooked' | 'dry' | 'drained' | 'as_sold';

export type FoodItem = {
  id: string;
  name: string;
  aliases: string[];
  category: FoodCategory;
  aisle: ShoppingAisle;
  state: FoodState;
  /** All nutrients are per 100 g. Portions scale from here. */
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fibrePer100g: number;
  /** A typical serving, to seed sensible starting portions. */
  typicalPortionG: number;
  source: string;
  sourceVersion: string;
  tags: FoodTag[];
};

export type FoodTag =
  | 'vegetarian' | 'vegan' | 'pescatarian' | 'halal' | 'kosher'
  | 'gluten_free' | 'dairy_free' | 'nut_free' | 'egg_free' | 'soy_free'
  | 'shellfish' | 'high_protein' | 'quick';

export type DietaryRule =
  | 'vegetarian' | 'vegan' | 'pescatarian' | 'halal' | 'kosher'
  | 'gluten_free' | 'dairy_free';

/**
 * Allergen groups (spec §35).
 *
 * Per-food allergy selection is not safe on its own: someone with a nut allergy
 * should not have to remember to tick almonds, cashews, walnuts and peanut butter
 * individually, and a food added to the table later would silently slip past them.
 * A group excludes every food that does not positively carry the matching
 * "-free" tag, so the check fails closed — an untagged food is excluded rather
 * than assumed safe.
 */
export type AllergenGroup =
  | 'nuts' | 'dairy' | 'eggs' | 'gluten' | 'soy' | 'shellfish' | 'fish';

export type FoodPreferences = {
  userId: Uuid;
  states: Record<string, PreferenceState>;
  /** Whole-category blocks. Safer than listing foods one by one. */
  allergenGroups: AllergenGroup[];
  /** Individual food blocks, for anything a group does not cover. */
  allergies: string[];
  intolerances: string[];
  dietaryRules: DietaryRule[];
  manualExclusions: string[];
};

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealIngredient = {
  foodId: string;
  foodName: string;
  grams: number;
  state: FoodState;
};

export type MealNutrients = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fibreG: number;
};

export type Recipe = {
  prepMinutes: number;
  cookMinutes: number;
  /** Written by AI; the numbers beside it never are. */
  steps: string[];
};

export type MealOption = {
  id: Uuid;
  /** A, B or C. Three approximately macro-equivalent choices (spec §39). */
  slot: 'A' | 'B' | 'C';
  name: string;
  ingredients: MealIngredient[];
  /** Computed from food data, never taken from the model's output. */
  nutrients: MealNutrients;
  recipe: Recipe;
};

export type Meal = {
  id: Uuid;
  type: MealType;
  /** The share of the day's targets allotted to this meal. */
  budget: MealNutrients;
  options: MealOption[];
  selectedOptionId: Uuid;
};

export type MealPlanDay = {
  id: Uuid;
  /** 1 = Monday. */
  dayOfWeek: number;
  date: IsoDate;
  isTrainingDay: boolean;
  targets: MacroTargets;
  meals: Meal[];
  totals: MealNutrients;
};

export type MealPlan = {
  id: Uuid;
  userId: Uuid;
  createdAt: IsoDateTime;
  weekStarting: IsoDate;
  targets: MacroTargets;
  /** Which energy calculation this plan was built against. */
  energyCalculationId: string;
  days: MealPlanDay[];
  /** Set when training/rest carb cycling is on (spec §45). */
  splitTrainingDays: boolean;
};

export type ValidationTolerance = {
  caloriesPercent: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
};

export type MacroDelta = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type ValidationResult = {
  valid: boolean;
  delta: MacroDelta;
  /** Signed percentage deviation per macro, for the failure message. */
  deviationPercent: MacroDelta;
  failures: Array<'calories' | 'protein' | 'carbs' | 'fat'>;
};

export type ShoppingListItem = {
  foodId: string;
  foodName: string;
  aisle: ShoppingAisle;
  totalGrams: number;
  state: FoodState;
  checked: boolean;
};

export type ShoppingList = {
  planId: Uuid;
  items: ShoppingListItem[];
  generatedAt: IsoDateTime;
};

export type MealPrepDays = 3 | 5 | 7;

export type MealPrepItem = {
  foodName: string;
  totalGrams: number;
  state: FoodState;
  usedIn: string[];
};

export type WeeklyCheckIn = {
  id: Uuid;
  userId: Uuid;
  weekStarting: IsoDate;
  weightKg: number;
  waistCm: number | null;
  /** Self-reported percentages, 0–100. */
  planAdherence: number;
  trainingAdherence: number;
  hunger: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  performance: 1 | 2 | 3 | 4 | 5;
  sleepQuality: 1 | 2 | 3 | 4 | 5 | null;
  notes?: string;
  submittedAt: IsoDateTime;
};

export type AdjustmentSuggestion = {
  id: Uuid;
  userId: Uuid;
  currentCalories: number;
  suggestedCalories: number;
  currentMacros: MacroTargets;
  suggestedMacros: MacroTargets;
  reason: string;
  /** How many weeks of data backed this. Below policy minimum, no suggestion. */
  weeksObserved: number;
  observedWeeklyRateKg: number;
  targetWeeklyRateKg: number;
  createdAt: IsoDateTime;
  /** Nothing changes until the user accepts (spec §44, §50). */
  status: 'pending' | 'accepted' | 'declined';
};
