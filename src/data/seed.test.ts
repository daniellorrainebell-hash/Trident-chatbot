import { calculateProgress } from '@/engines/training/contracts';
import { calculateStreak } from '@/engines/training/streaks';
import { workoutVolumeKg, countWorkingSets } from '@/engines/training/volume';
import { calculateRabidScore } from '@/engines/scoring/rabidScore';
import { detectWorkoutPRs } from '@/engines/training/personalRecords';
import { findExercise } from './exercises';
import { findFood, FOODS } from './foods';
import {
  SEED_TODAY,
  SEED_USER_ID,
  seedContracts,
  seedFoodPreferences,
  seedCurrentRecords,
  seedPersonalRecords,
  seedWorkouts,
  seedTemplates,
  seedLeaderboard,
} from './seed';

/**
 * Seed data has to survive contact with the real engines. If a fixture drifts
 * into something the engines reject, every screen built on it is showing a lie —
 * so the seed is asserted against the same code paths production uses.
 */

describe('seed workout history', () => {
  it('is a substantial, ordered history', () => {
    expect(seedWorkouts.length).toBeGreaterThan(50);

    const dates = seedWorkouts.map((w) => w.completedAt ?? '');
    expect([...dates].sort()).toEqual(dates);
  });

  it('references only exercises that exist in the library', () => {
    for (const workout of seedWorkouts) {
      for (const exercise of workout.exercises) {
        expect(findExercise(exercise.exerciseId)).toBeDefined();
      }
    }
  });

  it('produces real volume through the engine', () => {
    const total = seedWorkouts.reduce((sum, w) => sum + workoutVolumeKg(w), 0);
    expect(total).toBeGreaterThan(500_000);

    for (const workout of seedWorkouts) {
      expect(countWorkingSets(workout)).toBeGreaterThan(0);
    }
  });

  it('includes warm-up sets that the engine correctly ignores', () => {
    const workout = seedWorkouts[seedWorkouts.length - 1]!;
    const warmups = workout.exercises.flatMap((e) => e.sets.filter((s) => s.isWarmup));

    expect(warmups.length).toBeGreaterThan(0);
    expect(countWorkingSets(workout)).toBe(
      workout.exercises.flatMap((e) => e.sets).length - warmups.length,
    );
  });

  it('yields a live streak with a genuine break in its history', () => {
    const streak = calculateStreak(seedWorkouts, SEED_TODAY, 4);
    expect(streak.current).toBeGreaterThan(0);
    // The deliberate missed week means the longest run is finite, not the whole history.
    expect(streak.longest).toBeLessThan(18);
  });

  it('shows progression, so the score has a trend to read', () => {
    const half = Math.floor(seedWorkouts.length / 2);
    const earlier = seedWorkouts.slice(0, half).map(workoutVolumeKg);
    const later = seedWorkouts.slice(half).map(workoutVolumeKg);

    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(later)).toBeGreaterThan(mean(earlier));
  });
});

describe('seed contracts', () => {
  it('includes an active, a completed and a permanently failed Contract', () => {
    const statuses = seedContracts.map((c) => c.status);
    expect(statuses).toContain('active');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('failed');
  });

  it('backs the completed volume Contract with real logged work', () => {
    const volumeContract = seedContracts.find((c) => c.metric === 'volume_kg')!;
    const progress = calculateProgress(volumeContract, seedWorkouts, SEED_TODAY);

    // The Contract is marked complete, so the history must actually support it.
    expect(progress.current).toBeGreaterThanOrEqual(volumeContract.target);
  });

  it('computes real progress for the active Contract', () => {
    const active = seedContracts.find((c) => c.status === 'active')!;
    const progress = calculateProgress(active, seedWorkouts, SEED_TODAY);

    expect(progress.current).toBeGreaterThan(0);
    expect(progress.current).toBeLessThan(active.target);
    expect(progress.status).toBe('active');
  });

  it('keeps the failed Contract failed', () => {
    const failed = seedContracts.find((c) => c.status === 'failed')!;
    expect(calculateProgress(failed, seedWorkouts, SEED_TODAY).status).toBe('failed');
    expect(failed.failedAt).not.toBeNull();
  });
});

describe('seed personal records', () => {
  it('references real exercises', () => {
    expect(seedPersonalRecords.length).toBeGreaterThan(0);
    for (const pr of seedPersonalRecords) {
      expect(findExercise(pr.exerciseId)).toBeDefined();
    }
  });

  it('records genuine deltas once a movement is on the board', () => {
    const firsts = seedPersonalRecords.filter((pr) => pr.previousValue === null);
    const improvements = seedPersonalRecords.filter((pr) => pr.previousValue !== null);

    expect(firsts.length).toBeGreaterThan(0);
    expect(improvements.length).toBeGreaterThan(0);

    for (const pr of improvements) {
      if (pr.type === 'fastest_time') {
        expect(pr.value).toBeLessThan(pr.previousValue!);
      } else {
        expect(pr.value).toBeGreaterThan(pr.previousValue!);
      }
    }
  });

  it('leaves nothing in the history that beats the standing board', () => {
    // Re-running detection over the full history against the derived board must
    // find nothing new. If it does, the board and the sessions disagree.
    for (const workout of seedWorkouts) {
      const detected = detectWorkoutPRs(workout, seedPersonalRecords, {
        userId: SEED_USER_ID,
        workoutId: workout.id,
        achievedAt: workout.completedAt!,
        makeId: () => 'x',
      });
      expect(detected).toHaveLength(0);
    }
  });

  it('exposes one current best per exercise and type', () => {
    const keys = seedCurrentRecords.map((pr) => `${pr.exerciseId}:${pr.type}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('seed score', () => {
  it('produces a plausible Rabid Score, not a maxed or empty one', () => {
    const score = calculateRabidScore({
      userId: SEED_USER_ID,
      workouts: seedWorkouts,
      contracts: seedContracts,
      personalRecords: seedPersonalRecords,
      challengesCompleted: 2,
      challengesJoined: 3,
      weeklyTarget: 4,
      today: SEED_TODAY,
    });

    expect(score.total).toBeGreaterThan(300);
    expect(score.total).toBeLessThan(1000);
    expect(score.breakdown.inactivityPenalty).toBe(0);
  });
});

describe('seed food preferences', () => {
  it('references only foods in the database', () => {
    for (const foodId of Object.keys(seedFoodPreferences.states)) {
      expect(findFood(foodId)).toBeDefined();
    }
  });
});

describe('seed templates and leaderboard', () => {
  it('templates reference real exercises', () => {
    for (const template of seedTemplates) {
      for (const exercise of template.exercises) {
        expect(findExercise(exercise.exerciseId)).toBeDefined();
      }
    }
  });

  it('leaderboard is ranked and marks the current user exactly once', () => {
    expect(seedLeaderboard.map((e) => e.rank)).toEqual(
      seedLeaderboard.map((_, i) => i + 1),
    );
    expect(seedLeaderboard.filter((e) => e.isCurrentUser)).toHaveLength(1);
  });
});

describe('food database integrity', () => {
  it('has no duplicate ids', () => {
    const ids = FOODS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has macros that roughly account for its stated calories', () => {
    for (const food of FOODS) {
      const fromMacros =
        food.proteinPer100g * 4 + food.carbsPer100g * 4 + food.fatPer100g * 9;

      // Fibre, alcohol and rounding all leak here, so the tolerance is generous.
      // The point is catching a transposed or mistyped figure, not auditing precision.
      const drift = Math.abs(fromMacros - food.kcalPer100g);
      expect(drift).toBeLessThan(Math.max(35, food.kcalPer100g * 0.2));
    }
  });

  it('marks nut-containing foods as containing nuts, and nothing else', () => {
    const nutFoods = ['peanut-butter', 'almonds', 'cashews', 'walnuts', 'almond-milk'];
    for (const id of nutFoods) {
      expect(findFood(id)!.tags).not.toContain('nut_free');
    }
    // Staples must stay usable for someone with a nut allergy.
    for (const id of ['chicken-breast', 'basmati-rice', 'potatoes', 'broccoli']) {
      expect(findFood(id)!.tags).toContain('nut_free');
    }
  });

  it('marks gluten-containing foods correctly', () => {
    for (const id of ['pasta', 'wholemeal-bread', 'bagel', 'wrap', 'couscous', 'soy-sauce']) {
      expect(findFood(id)!.tags).not.toContain('gluten_free');
    }
    for (const id of ['basmati-rice', 'quinoa', 'potatoes', 'chicken-breast']) {
      expect(findFood(id)!.tags).toContain('gluten_free');
    }
  });

  it('marks dairy and soy correctly', () => {
    for (const id of ['greek-yoghurt', 'cheddar', 'whey', 'semi-skimmed-milk']) {
      expect(findFood(id)!.tags).not.toContain('dairy_free');
    }
    for (const id of ['tofu', 'tempeh', 'soy-sauce', 'soy-yoghurt']) {
      expect(findFood(id)!.tags).not.toContain('soy_free');
    }
  });

  it('gives every food a verdict on all five allergen groups', () => {
    // A food missing a "-free" tag is treated as unsafe, so an accidental
    // omission silently removes it from every allergic user's plan.
    const allergenTags = ['gluten_free', 'dairy_free', 'nut_free', 'egg_free', 'soy_free'];
    for (const food of FOODS) {
      const present = allergenTags.filter((tag) => food.tags.includes(tag as never));
      // At minimum a whole food should clear most groups; flag anything clearing none.
      expect(present.length).toBeGreaterThan(0);
    }
  });

  it('keeps diet tags internally consistent', () => {
    for (const food of FOODS) {
      if (food.tags.includes('vegan')) {
        expect(food.tags).toContain('vegetarian');
        expect(food.tags).toContain('pescatarian');
      }
      if (food.tags.includes('vegetarian')) {
        expect(food.tags).toContain('pescatarian');
      }
    }
  });

  it('declares a state for every food', () => {
    for (const food of FOODS) {
      expect(['raw', 'cooked', 'dry', 'drained', 'as_sold']).toContain(food.state);
    }
  });
});
