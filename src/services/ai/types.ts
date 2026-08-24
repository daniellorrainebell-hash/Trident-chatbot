import { z } from 'zod';
import type { MealType, NutritionProfile, WeeklyCheckIn } from '@/types';

/**
 * AI provider abstraction (spec §54).
 *
 * The application talks to this interface and never to a vendor SDK. Swapping
 * OpenAI for Anthropic or Gemini is one adapter, not a repo-wide change.
 *
 * Note what the interface does *not* expose: there is no `calculateCalories`,
 * no `setMacros` and no `isThisSafe`. Those are deterministic engine concerns,
 * and keeping them off this interface is what stops them drifting into a prompt
 * later (spec §29).
 */

/**
 * A proposed meal. The model returns food ids and grams — nothing else about the
 * nutrition. Calories and macros are computed from the food table afterwards, so
 * a hallucinated nutrient figure has nowhere to enter (spec §55).
 */
export const ProposedIngredientSchema = z.object({
  foodId: z.string().min(1),
  grams: z.number().positive().max(2000),
});

export const ProposedMealSchema = z.object({
  mealName: z.string().min(1).max(80),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  ingredients: z.array(ProposedIngredientSchema).min(1).max(12),
  preparation: z.array(z.string().min(1)).min(1).max(12),
  prepMinutes: z.number().int().min(0).max(180),
  cookMinutes: z.number().int().min(0).max(240),
});

export const ProposedMealSetSchema = z.object({
  options: z.array(ProposedMealSchema).min(1).max(3),
});

export type ProposedIngredient = z.infer<typeof ProposedIngredientSchema>;
export type ProposedMeal = z.infer<typeof ProposedMealSchema>;
export type ProposedMealSet = z.infer<typeof ProposedMealSetSchema>;

export const TrainingInsightSchema = z.object({
  headline: z.string().min(1).max(80),
  detail: z.string().min(1).max(400),
  /** What the insight is about, so the UI can route the user somewhere useful. */
  subject: z.enum(['volume', 'frequency', 'imbalance', 'contract', 'progression', 'recovery']),
});

export type TrainingInsight = z.infer<typeof TrainingInsightSchema>;

export const CheckInSummarySchema = z.object({
  summary: z.string().min(1).max(400),
  /** Never a calorie number — the adjustment engine owns that decision. */
  observations: z.array(z.string().min(1)).max(4),
});

export type CheckInSummary = z.infer<typeof CheckInSummarySchema>;

export type MealGenerationRequest = {
  mealType: MealType;
  /** The macro budget this meal must hit. Set by the engine, not negotiable. */
  budget: { calories: number; proteinG: number; carbsG: number; fatG: number };
  /** Food ids the model may choose from. Exclusions are already removed. */
  allowedFoodIds: string[];
  /** A subset of allowed foods the user marked LOVE IT. */
  preferredFoodIds: string[];
  /** How many accepted options the caller ultimately needs. */
  optionCount: 1 | 2 | 3;
  /**
   * How many candidates to propose. Always at least `optionCount`, usually more:
   * the deterministic validator rejects proposals that miss their macro budget,
   * and without spare candidates a couple of rejections leave a meal slot empty.
   * Over-generating is the cheap half of spec §40's propose-and-check loop.
   */
  candidateCount?: number;
  /** Used to keep the week varied rather than repeating one meal. */
  avoidFoodIds?: string[];
  seed?: string;
};

export type MealSwapRequest = MealGenerationRequest & {
  /** What the user rejected, so the replacement is actually different. */
  replacingFoodIds: string[];
};

export type TrainingInsightRequest = {
  /** Pre-aggregated signals. Raw workout history is not shipped to a vendor. */
  weeklyVolumeTrend: number[];
  sessionsPerWeek: number[];
  stalledLifts: string[];
  neglectedMuscleGroups: string[];
  contractBehind: boolean;
};

export type CheckInSummaryRequest = {
  checkIns: Array<Pick<WeeklyCheckIn, 'weightKg' | 'planAdherence' | 'hunger' | 'energy' | 'performance'>>;
  goal: NutritionProfile['goal'];
};

export interface AIProvider {
  readonly name: string;
  generateMealOptions(request: MealGenerationRequest): Promise<ProposedMealSet>;
  generateMealSwap(request: MealSwapRequest): Promise<ProposedMeal>;
  generateTrainingInsight(request: TrainingInsightRequest): Promise<TrainingInsight>;
  summariseCheckIn(request: CheckInSummaryRequest): Promise<CheckInSummary>;
}

/** Thrown when a provider's output fails schema validation (spec §56). */
export class AIOutputError extends Error {
  constructor(
    message: string,
    readonly provider: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AIOutputError';
  }
}
