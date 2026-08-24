import { create } from 'zustand';
import type {
  AdjustmentSuggestion,
  EnergyCalculation,
  FoodPreferences,
  MealPlan,
  NutritionProfile,
  PreferenceState,
  SafetyDecision,
  ShoppingList,
  WeeklyCheckIn,
} from '@/types';
import { checkEligibility } from '@/engines/nutrition/safetyPolicy';
import { calculateEnergyTargets } from '@/engines/nutrition/energy';
import { suggestAdjustment } from '@/engines/nutrition/adjustment';
import { buildMealPlan, buildShoppingList, type PlanBuildFailure } from '@/services/nutrition/planBuilder';
import { localMealProvider } from '@/services/ai/localProvider';
import type { AIProvider } from '@/services/ai/types';
import { createId } from '@/utils/id';
import { seedFoodPreferences, seedNutritionProfile } from '@/data/seed';

/**
 * The Feed's state (spec §27).
 *
 * The ordering in `generateTargets` is the architectural rule made literal:
 * eligibility is checked first, and a blocked profile never reaches the energy
 * engine — so no target exists to leak into the UI. Nothing here asks a model
 * what to eat before a deterministic target has been approved.
 */

export type NutritionState = {
  profile: NutritionProfile | null;
  preferences: FoodPreferences;
  safetyDecision: SafetyDecision | null;
  energy: EnergyCalculation | null;
  plan: MealPlan | null;
  shoppingList: ShoppingList | null;
  checkIns: WeeklyCheckIn[];
  pendingAdjustment: AdjustmentSuggestion | null;
  disclaimerAcceptedVersion: string | null;

  generating: boolean;
  planFailures: PlanBuildFailure[];
  provider: AIProvider;

  setProfile(profile: NutritionProfile): void;
  acceptDisclaimer(version: string): void;
  setPreference(foodId: string, state: PreferenceState): void;
  setAllergies(foodIds: string[]): void;
  setAllergenGroups(groups: FoodPreferences['allergenGroups']): void;
  setDietaryRules(rules: FoodPreferences['dietaryRules']): void;

  generateTargets(): SafetyDecision;
  generatePlan(weekStarting: string, trainingDays: number[], split: boolean): Promise<void>;
  selectMealOption(dayId: string, mealId: string, optionId: string): void;
  toggleShoppingItem(foodId: string, state: string): void;

  submitCheckIn(checkIn: Omit<WeeklyCheckIn, 'id' | 'userId' | 'submittedAt'>): void;
  acceptAdjustment(): void;
  declineAdjustment(): void;
};

export const useNutritionStore = create<NutritionState>((set, get) => ({
  profile: seedNutritionProfile,
  preferences: seedFoodPreferences,
  safetyDecision: null,
  energy: null,
  plan: null,
  shoppingList: null,
  checkIns: [],
  pendingAdjustment: null,
  disclaimerAcceptedVersion: null,

  generating: false,
  planFailures: [],
  provider: localMealProvider,

  setProfile(profile) {
    // Targets built from an older profile are stale the moment it changes.
    set({ profile, energy: null, safetyDecision: null, plan: null, shoppingList: null });
  },

  acceptDisclaimer(version) {
    set({ disclaimerAcceptedVersion: version });
  },

  setPreference(foodId, state) {
    const { preferences } = get();
    set({ preferences: { ...preferences, states: { ...preferences.states, [foodId]: state } } });
  },

  setAllergies(foodIds) {
    set({ preferences: { ...get().preferences, allergies: foodIds } });
  },

  setAllergenGroups(groups) {
    // Targets are unaffected, but any existing plan was built against the old
    // exclusions and may contain something the user cannot eat.
    set({
      preferences: { ...get().preferences, allergenGroups: groups },
      plan: null,
      shoppingList: null,
    });
  },

  setDietaryRules(rules) {
    set({ preferences: { ...get().preferences, dietaryRules: rules } });
  },

  /**
   * Eligibility first, then the deterministic engine. A blocked profile returns
   * the decision and leaves `energy` null — there is deliberately no target to show.
   */
  generateTargets() {
    const { profile } = get();
    if (!profile) {
      throw new Error('Nutrition profile required before targets can be calculated.');
    }

    const decision = checkEligibility(profile);
    if (!decision.approved) {
      set({ safetyDecision: decision, energy: null, plan: null, shoppingList: null });
      return decision;
    }

    set({ safetyDecision: decision, energy: calculateEnergyTargets(profile) });
    return decision;
  },

  async generatePlan(weekStarting, trainingDays, split) {
    const { profile, preferences, energy, provider, safetyDecision } = get();

    // Belt and braces: no plan without an approved decision and a real target.
    if (!profile || !energy || !safetyDecision?.approved) return;

    set({ generating: true, planFailures: [] });

    try {
      const { plan, failures } = await buildMealPlan({
        provider,
        profile,
        preferences,
        targets: energy.macros,
        weekStarting,
        energyCalculationId: energy.calculatedAt,
        trainingDays,
        splitTrainingDays: split,
        makeId: createId,
      });

      set({
        plan,
        shoppingList: plan ? buildShoppingList(plan) : null,
        planFailures: failures,
      });
    } finally {
      set({ generating: false });
    }
  },

  /** Swapping to option B or C rebuilds the day's totals and the shopping list. */
  selectMealOption(dayId, mealId, optionId) {
    const { plan } = get();
    if (!plan) return;

    const days = plan.days.map((day) => {
      if (day.id !== dayId) return day;

      const meals = day.meals.map((meal) =>
        meal.id === mealId ? { ...meal, selectedOptionId: optionId } : meal,
      );

      const selected = meals
        .map((meal) => meal.options.find((o) => o.id === meal.selectedOptionId))
        .filter((o): o is NonNullable<typeof o> => o != null);

      return {
        ...day,
        meals,
        totals: selected.reduce(
          (total, option) => ({
            calories: total.calories + option.nutrients.calories,
            proteinG: total.proteinG + option.nutrients.proteinG,
            carbsG: total.carbsG + option.nutrients.carbsG,
            fatG: total.fatG + option.nutrients.fatG,
            fibreG: total.fibreG + option.nutrients.fibreG,
          }),
          { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fibreG: 0 },
        ),
      };
    });

    const updated = { ...plan, days };
    set({ plan: updated, shoppingList: buildShoppingList(updated) });
  },

  toggleShoppingItem(foodId, state) {
    const { shoppingList } = get();
    if (!shoppingList) return;

    set({
      shoppingList: {
        ...shoppingList,
        items: shoppingList.items.map((item) =>
          item.foodId === foodId && item.state === state
            ? { ...item, checked: !item.checked }
            : item,
        ),
      },
    });
  },

  /**
   * A check-in may produce an adjustment suggestion — or, more often, nothing.
   * The engine's gates decide; this store does not second-guess them.
   */
  submitCheckIn(input) {
    const { profile, energy, checkIns } = get();
    if (!profile) return;

    const checkIn: WeeklyCheckIn = {
      ...input,
      id: createId(),
      userId: profile.userId,
      submittedAt: new Date().toISOString(),
    };

    const updated = [...checkIns, checkIn];
    set({ checkIns: updated });

    if (!energy) return;

    set({
      pendingAdjustment: suggestAdjustment({
        profile,
        current: energy,
        checkIns: updated,
        makeId: createId,
      }),
    });
  },

  /** Nothing changes until the user says so (spec §50). */
  acceptAdjustment() {
    const { pendingAdjustment, energy } = get();
    if (!pendingAdjustment || !energy) return;

    set({
      energy: {
        ...energy,
        targetCalories: pendingAdjustment.suggestedCalories,
        calorieAdjustment: pendingAdjustment.suggestedCalories - energy.maintenanceCalories,
        macros: pendingAdjustment.suggestedMacros,
        calculatedAt: new Date().toISOString(),
      },
      pendingAdjustment: { ...pendingAdjustment, status: 'accepted' },
      // The plan was built for the old target, so it no longer matches.
      plan: null,
      shoppingList: null,
    });
  },

  declineAdjustment() {
    const { pendingAdjustment } = get();
    if (!pendingAdjustment) return;
    set({ pendingAdjustment: { ...pendingAdjustment, status: 'declined' } });
  },
}));
