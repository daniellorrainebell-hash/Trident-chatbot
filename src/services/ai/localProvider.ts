import type {
  AIProvider,
  CheckInSummary,
  CheckInSummaryRequest,
  MealGenerationRequest,
  MealSwapRequest,
  ProposedMeal,
  ProposedMealSet,
  TrainingInsight,
  TrainingInsightRequest,
} from './types';
import { findFood } from '@/data/foods';
import type { FoodItem } from '@/types';

/**
 * A local, deterministic meal composer.
 *
 * This is a real provider, not a mock: it builds genuine meals from the food
 * table using template shapes, and its output goes through exactly the same
 * schema validation, exclusion checks and macro fitting as a hosted model's
 * would. It exists so the whole Feed pipeline runs — in development, in tests,
 * offline, and as the fallback when a hosted provider fails or times out
 * (spec §56 requires failing safe, not failing blank).
 *
 * It is seeded, so the same request produces the same plan. That makes the
 * screens stable to work on and the pipeline testable end to end.
 */

/** Meal shapes: a protein, a carbohydrate, a fat and something green. */
type MealTemplate = {
  name: string;
  proteins: string[];
  carbs: string[];
  fats: string[];
  vegetables: string[];
  preparation: string[];
  prepMinutes: number;
  cookMinutes: number;
};

const BREAKFAST_TEMPLATES: MealTemplate[] = [
  {
    name: 'Protein oats with banana and peanut butter',
    proteins: ['whey', 'greek-yoghurt', 'vegan-protein'],
    carbs: ['oats', 'banana'],
    fats: ['peanut-butter'],
    vegetables: [],
    preparation: [
      'Bring the oats and milk to a simmer, stirring, for 4–5 minutes.',
      'Take off the heat and let it cool for a minute before stirring the protein through, or it will go claggy.',
      'Top with sliced banana and the peanut butter.',
    ],
    prepMinutes: 3,
    cookMinutes: 6,
  },
  {
    name: 'Eggs on toast with avocado',
    proteins: ['eggs', 'egg-whites'],
    carbs: ['wholemeal-bread'],
    fats: ['avocado'],
    vegetables: ['tomatoes'],
    preparation: [
      'Poach or scramble the eggs to your liking.',
      'Toast the bread and spread the avocado over it.',
      'Top with the eggs and the sliced tomatoes. Season well.',
    ],
    prepMinutes: 5,
    cookMinutes: 6,
  },
  {
    name: 'Yoghurt bowl with berries and seeds',
    proteins: ['greek-yoghurt', 'whey', 'soy-yoghurt', 'vegan-protein'],
    carbs: ['oats', 'berries'],
    fats: ['mixed-seeds', 'almonds'],
    vegetables: [],
    preparation: [
      'Stir the protein powder into the yoghurt until smooth.',
      'Fold through the oats and leave for five minutes to soften.',
      'Top with the berries and seeds.',
    ],
    prepMinutes: 5,
    cookMinutes: 0,
  },
  {
    name: 'Bagel with eggs and a shake',
    proteins: ['egg-whites', 'whey'],
    carbs: ['bagel'],
    fats: ['cheddar'],
    vegetables: ['spinach'],
    preparation: [
      'Scramble the egg whites with the spinach over a low heat.',
      'Toast and fill the bagel, adding the cheese while everything is hot.',
      'Shake the protein with cold water and drink alongside.',
    ],
    prepMinutes: 4,
    cookMinutes: 6,
  },
];

const MAIN_TEMPLATES: MealTemplate[] = [
  {
    name: 'Chicken, rice and roasted peppers',
    proteins: ['chicken-breast', 'chicken-thigh'],
    carbs: ['basmati-rice'],
    fats: ['olive-oil'],
    vegetables: ['peppers', 'onions'],
    preparation: [
      'Rinse the rice and cook it in twice its volume of salted water, 10–12 minutes.',
      'Toss the peppers and onion in the oil and roast at 200°C for 20 minutes.',
      'Season the chicken and grill 6–7 minutes a side, until cooked through.',
      'Rest the chicken for a few minutes before slicing, or the juices end up on the board.',
    ],
    prepMinutes: 10,
    cookMinutes: 22,
  },
  {
    name: 'Beef mince chilli with rice',
    proteins: ['beef-mince-5', 'black-beans'],
    carbs: ['basmati-rice'],
    fats: ['olive-oil'],
    vegetables: ['passata', 'onions', 'peppers'],
    preparation: [
      'Brown the mince hard in the oil — colour is flavour here, so do not crowd the pan.',
      'Add the onion and peppers and soften for 5 minutes.',
      'Pour in the passata and beans, then simmer for 20 minutes.',
      'Serve over the cooked rice.',
    ],
    prepMinutes: 10,
    cookMinutes: 30,
  },
  {
    name: 'Salmon, potatoes and greens',
    proteins: ['salmon'],
    carbs: ['potatoes'],
    fats: ['olive-oil'],
    vegetables: ['broccoli', 'asparagus'],
    preparation: [
      'Halve the potatoes and roast at 200°C for 30 minutes.',
      'Put the salmon in for the last 12–14 minutes.',
      'Steam the greens for 4 minutes and dress them with the oil and plenty of pepper.',
    ],
    prepMinutes: 8,
    cookMinutes: 32,
  },
  {
    name: 'Turkey pasta with tomato sauce',
    proteins: ['turkey-mince'],
    carbs: ['pasta'],
    fats: ['olive-oil', 'cheddar'],
    vegetables: ['passata', 'mushrooms', 'onions'],
    preparation: [
      'Cook the pasta in well-salted water until just short of soft.',
      'Brown the turkey mince in the oil with the onion and mushrooms.',
      'Add the passata and simmer for 15 minutes, then fold the pasta through.',
      'Finish with the grated cheese.',
    ],
    prepMinutes: 8,
    cookMinutes: 25,
  },
  {
    name: 'Steak, sweet potato and salad',
    proteins: ['lean-beef'],
    carbs: ['sweet-potatoes'],
    fats: ['olive-oil'],
    vegetables: ['mixed-salad', 'tomatoes'],
    preparation: [
      'Roast the sweet potato wedges at 200°C for 30 minutes.',
      'Get a dry pan properly hot, then cook the steak 3 minutes a side for medium-rare.',
      'Rest the steak a full 5 minutes before slicing.',
      'Dress the salad with the oil.',
    ],
    prepMinutes: 8,
    cookMinutes: 32,
  },
  {
    name: 'Cod, couscous and roast vegetables',
    proteins: ['cod', 'prawns'],
    carbs: ['couscous'],
    fats: ['olive-oil'],
    vegetables: ['courgette', 'peppers'],
    preparation: [
      'Pour boiling stock over the couscous, cover, and leave for 8 minutes.',
      'Roast the vegetables in the oil at 200°C for 20 minutes.',
      'Bake the cod for the last 12 minutes.',
      'Fork the couscous through and pile everything together.',
    ],
    prepMinutes: 8,
    cookMinutes: 22,
  },
  {
    name: 'Tofu stir-fry with noodles',
    proteins: ['tofu', 'tempeh'],
    carbs: ['noodles'],
    fats: ['olive-oil', 'mixed-seeds'],
    vegetables: ['broccoli', 'peppers', 'carrots'],
    preparation: [
      'Press the tofu for 10 minutes, then cube it.',
      'Fry it hard in the oil until the edges crisp, then set aside.',
      'Stir-fry the vegetables for 4 minutes, add the cooked noodles and soy.',
      'Return the tofu and toss through at the end so it stays crisp.',
    ],
    prepMinutes: 12,
    cookMinutes: 12,
  },
  {
    name: 'Lentil and chickpea curry with rice',
    proteins: ['lentils', 'chickpeas', 'tofu'],
    carbs: ['basmati-rice'],
    fats: ['olive-oil'],
    vegetables: ['passata', 'onions', 'spinach'],
    preparation: [
      'Soften the onion in the oil, then add your spices and let them toast for a minute.',
      'Add the lentils, chickpeas and passata with 300ml water.',
      'Simmer for 25 minutes, until the lentils are soft and the sauce has thickened.',
      'Stir the spinach through at the end and serve over the rice.',
    ],
    prepMinutes: 10,
    cookMinutes: 30,
  },
  {
    name: 'Chicken wraps with salad',
    proteins: ['chicken-breast'],
    carbs: ['wrap'],
    fats: ['avocado'],
    vegetables: ['mixed-salad', 'peppers', 'tomatoes'],
    preparation: [
      'Season and grill the chicken, 6 minutes a side, then slice.',
      'Warm the wraps for 20 seconds in a dry pan.',
      'Fill with the chicken, mashed avocado and salad.',
    ],
    prepMinutes: 10,
    cookMinutes: 14,
  },
];

const SNACK_TEMPLATES: MealTemplate[] = [
  {
    name: 'Yoghurt, berries and almonds',
    proteins: ['greek-yoghurt', 'soy-yoghurt'],
    carbs: ['berries'],
    fats: ['almonds'],
    vegetables: [],
    preparation: ['Spoon the yoghurt into a bowl and top with the berries and almonds.'],
    prepMinutes: 2,
    cookMinutes: 0,
  },
  {
    name: 'Protein shake and banana',
    proteins: ['whey', 'vegan-protein'],
    carbs: ['banana'],
    fats: [],
    vegetables: [],
    preparation: ['Shake the protein with cold water and eat the banana alongside.'],
    prepMinutes: 1,
    cookMinutes: 0,
  },
  {
    name: 'Cottage cheese on rice cakes',
    proteins: ['cottage-cheese'],
    carbs: ['rice-cakes'],
    fats: ['mixed-seeds'],
    vegetables: ['tomatoes'],
    preparation: ['Top the rice cakes with the cottage cheese, seeds and sliced tomato.'],
    prepMinutes: 3,
    cookMinutes: 0,
  },
  {
    name: 'Tuna and crackers',
    proteins: ['tuna-tinned'],
    carbs: ['rice-cakes'],
    fats: ['olive-oil'],
    vegetables: ['mixed-salad'],
    preparation: ['Dress the tuna with the oil and pile onto the rice cakes with the leaves.'],
    prepMinutes: 3,
    cookMinutes: 0,
  },
  {
    name: 'Peanut butter on toast',
    proteins: ['whey', 'vegan-protein'],
    carbs: ['wholemeal-bread'],
    fats: ['peanut-butter'],
    vegetables: [],
    preparation: ['Toast the bread and spread the peanut butter. Shake the protein alongside.'],
    prepMinutes: 2,
    cookMinutes: 2,
  },
];

/** Small deterministic PRNG so a seed reproduces a plan exactly. */
function makeRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function templatesFor(mealType: MealGenerationRequest['mealType']): MealTemplate[] {
  if (mealType === 'breakfast') return BREAKFAST_TEMPLATES;
  if (mealType === 'snack') return SNACK_TEMPLATES;
  return MAIN_TEMPLATES;
}

/**
 * Pick a food from a template slot, honouring the allowed list.
 * Prefers a LOVE IT food where one qualifies — that is the whole point of asking.
 */
function pickFood(
  candidates: string[],
  allowed: Set<string>,
  preferred: Set<string>,
  random: () => number,
): FoodItem | null {
  const usable = candidates.filter((id) => allowed.has(id));
  if (usable.length === 0) return null;

  const loved = usable.filter((id) => preferred.has(id));
  const pool = loved.length > 0 ? loved : usable;
  const chosen = pool[Math.floor(random() * pool.length)] ?? pool[0]!;

  return findFood(chosen) ?? null;
}

/**
 * Build one meal from a template.
 *
 * Portions start from a rough macro split of the budget and are then refined by
 * the deterministic fitting step downstream. The aim here is a sensible starting
 * point, not exactness — precision is the engine's job, not the composer's.
 */
function composeMeal(
  template: MealTemplate,
  request: MealGenerationRequest,
  random: () => number,
): ProposedMeal | null {
  const allowed = new Set(request.allowedFoodIds);
  const preferred = new Set(request.preferredFoodIds);

  const protein = pickFood(template.proteins, allowed, preferred, random);
  if (!protein) return null;

  const carb = pickFood(template.carbs, allowed, preferred, random);
  const fat = pickFood(template.fats, allowed, preferred, random);
  const vegetable = pickFood(template.vegetables, allowed, preferred, random);

  const ingredients: Array<{ foodId: string; grams: number }> = [];

  // Protein first: hit roughly 85% of the meal's protein budget from the main source.
  const proteinGrams = gramsForNutrient(request.budget.proteinG * 0.85, protein.proteinPer100g);
  ingredients.push({ foodId: protein.id, grams: proteinGrams });

  if (carb) {
    const carbGrams = gramsForNutrient(request.budget.carbsG * 0.8, carb.carbsPer100g);
    if (carbGrams > 0) ingredients.push({ foodId: carb.id, grams: carbGrams });
  }

  if (fat) {
    const alreadyFat = (protein.fatPer100g * proteinGrams) / 100;
    const remaining = Math.max(0, request.budget.fatG - alreadyFat);
    const fatGrams = gramsForNutrient(remaining * 0.7, fat.fatPer100g);
    if (fatGrams > 0) ingredients.push({ foodId: fat.id, grams: fatGrams });
  }

  if (vegetable) {
    ingredients.push({ foodId: vegetable.id, grams: vegetable.typicalPortionG });
  }

  return {
    mealName: template.name,
    mealType: request.mealType,
    ingredients,
    preparation: template.preparation,
    prepMinutes: template.prepMinutes,
    cookMinutes: template.cookMinutes,
  };
}

/** Grams needed to supply a nutrient target, rounded to 5 g and bounded. */
function gramsForNutrient(targetGrams: number, per100g: number): number {
  if (per100g <= 0 || targetGrams <= 0) return 0;
  const grams = (targetGrams / per100g) * 100;
  return Math.min(600, Math.max(5, Math.round(grams / 5) * 5));
}

export class LocalMealProvider implements AIProvider {
  readonly name = 'local-deterministic';

  async generateMealOptions(request: MealGenerationRequest): Promise<ProposedMealSet> {
    const random = makeRandom(`${request.seed ?? 'kennel'}:${request.mealType}`);
    const templates = templatesFor(request.mealType);
    const avoid = new Set(request.avoidFoodIds ?? []);

    // Rotate the starting point by seed so the week does not repeat one meal.
    const start = Math.floor(random() * templates.length);
    const options: ProposedMeal[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < templates.length && options.length < request.optionCount; i += 1) {
      const template = templates[(start + i) % templates.length]!;
      if (usedNames.has(template.name)) continue;

      const meal = composeMeal(template, request, random);
      if (!meal) continue;

      // Skip a meal built entirely from foods the day has already used.
      const allAvoided =
        avoid.size > 0 && meal.ingredients.every((ing) => avoid.has(ing.foodId));
      if (allAvoided) continue;

      usedNames.add(template.name);
      options.push(meal);
    }

    // Fall back to any composable template rather than returning nothing.
    if (options.length === 0) {
      for (const template of templates) {
        const meal = composeMeal(template, request, random);
        if (meal) {
          options.push(meal);
          break;
        }
      }
    }

    return { options };
  }

  async generateMealSwap(request: MealSwapRequest): Promise<ProposedMeal> {
    const set = await this.generateMealOptions({
      ...request,
      optionCount: 3,
      avoidFoodIds: [...(request.avoidFoodIds ?? []), ...request.replacingFoodIds],
      seed: `${request.seed ?? 'kennel'}:swap:${request.replacingFoodIds.join(',')}`,
    });

    const first = set.options[0];
    if (!first) {
      throw new Error('No meal could be composed from the available foods.');
    }
    return first;
  }

  async generateTrainingInsight(request: TrainingInsightRequest): Promise<TrainingInsight> {
    if (request.contractBehind) {
      return {
        headline: 'You are behind on a Contract',
        detail:
          'Your current Contract needs a higher rate than you have been training at. The sessions are still there if you take them.',
        subject: 'contract',
      };
    }

    const [neglected] = request.neglectedMuscleGroups;
    if (neglected) {
      return {
        headline: `${neglected} has been skipped`,
        detail: `You have not trained ${neglected} in your recent sessions. It is the easiest gap in your week to close.`,
        subject: 'imbalance',
      };
    }

    const [stalled] = request.stalledLifts;
    if (stalled) {
      return {
        headline: `${stalled} has stalled`,
        detail: `Your ${stalled} has not moved in several weeks. Volume, frequency or recovery is usually the reason.`,
        subject: 'progression',
      };
    }

    const trend = request.weeklyVolumeTrend;
    const latest = trend[trend.length - 1] ?? 0;
    const previous = trend[trend.length - 2] ?? latest;

    return latest < previous
      ? {
          headline: 'Weekly volume is down',
          detail: 'You moved less this week than last. One session short is usually all it is.',
          subject: 'volume',
        }
      : {
          headline: 'Consistency is holding',
          detail: 'Your training frequency has been steady. Keep it there.',
          subject: 'frequency',
        };
  }

  async summariseCheckIn(request: CheckInSummaryRequest): Promise<CheckInSummary> {
    const latest = request.checkIns[request.checkIns.length - 1];
    if (!latest) {
      return { summary: 'No check-in data yet.', observations: [] };
    }

    const observations: string[] = [];
    if (latest.hunger >= 4) observations.push('Hunger is running high.');
    if (latest.energy <= 2) observations.push('Energy has been low.');
    if (latest.performance <= 2) observations.push('Training performance has dipped.');
    if (latest.planAdherence >= 90) observations.push('Adherence has been strong.');

    return {
      summary: `${request.checkIns.length} check-in${request.checkIns.length === 1 ? '' : 's'} logged at ${latest.planAdherence}% adherence.`,
      observations: observations.slice(0, 4),
    };
  }
}

export const localMealProvider = new LocalMealProvider();
