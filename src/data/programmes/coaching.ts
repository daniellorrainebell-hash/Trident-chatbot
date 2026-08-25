import type { Discipline, MuscleGroup } from '@/types';

/**
 * The coaching rules the generator works from.
 *
 * Everything here is a published, defensible position rather than a preference,
 * and it is versioned for the same reason the nutrition policy is: a programme
 * generated in March should still be explainable in September, and that only
 * holds if the rules that produced it are pinned rather than quietly edited.
 *
 * The short version of the evidence these encode:
 *
 *   Volume is the main driver of growth, and it works in a range rather than at
 *   a point — roughly 10 to 20 hard sets per muscle per week, with beginners
 *   nearer the bottom because they grow on less and recover from less.
 *
 *   Frequency beats cramming. The same weekly volume split over two sessions
 *   outperforms one, which is why every split below hits each muscle twice.
 *
 *   Rep range matters less than proximity to failure. Growth happens across a
 *   wide band, so the ranges below are chosen for what a person can actually
 *   hold technique through, not because a particular number is magic.
 *
 *   Compounds first, while you are fresh and coordinated. Isolation after,
 *   when a bad rep costs less.
 */
export const COACHING_VERSION = 1;

export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type Goal = 'strength' | 'hypertrophy' | 'endurance';

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const GOAL_LABELS: Record<Goal, string> = {
  strength: 'Strength',
  hypertrophy: 'Size',
  endurance: 'Endurance',
};

/**
 * Hard sets per muscle per week.
 *
 * A beginner on twenty sets is not growing faster, they are just sore and
 * likely to stop turning up — which is the failure mode that actually matters.
 */
export const WEEKLY_SETS: Record<Experience, number> = {
  beginner: 10,
  intermediate: 14,
  advanced: 18,
};

/** Muscles that get the full target. The rest are worked as they come. */
export const PRIMARY_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps',
];

/**
 * Rep ranges, low and high.
 *
 * Given as a range on purpose: the range is the progression. You add reps until
 * you reach the top of it, then add load and drop back to the bottom. A single
 * number gives a lifter nowhere to go except heavier, every session, forever.
 */
export const REP_RANGES: Record<Goal, { compound: [number, number]; isolation: [number, number] }> = {
  strength: { compound: [3, 6], isolation: [6, 10] },
  hypertrophy: { compound: [6, 10], isolation: [10, 15] },
  endurance: { compound: [12, 15], isolation: [15, 20] },
};

/**
 * Rest between sets, in seconds.
 *
 * The commonest self-inflicted mistake in a gym is resting ninety seconds after
 * a heavy squat because the internet said ninety seconds. Strength work needs
 * long rests; the set after an insufficient one is a worse set, not a harder one.
 */
export const REST_SECONDS: Record<Goal, { compound: number; isolation: number }> = {
  strength: { compound: 240, isolation: 120 },
  hypertrophy: { compound: 150, isolation: 75 },
  endurance: { compound: 90, isolation: 45 },
};

/** Sets per exercise, before the weekly target decides how many exercises there are. */
export const SETS_PER_EXERCISE: Record<Goal, { compound: number; isolation: number }> = {
  strength: { compound: 5, isolation: 3 },
  hypertrophy: { compound: 4, isolation: 3 },
  endurance: { compound: 3, isolation: 3 },
};

/** Reps in reserve to leave on a working set. Zero would be training to failure every set. */
export const TARGET_RIR: Record<Experience, number> = {
  beginner: 3,
  intermediate: 2,
  advanced: 1,
};

/**
 * How many sessions a week each discipline is generated at, by intensity.
 *
 * Two rest days is the default across the board. It is not a rule of physics,
 * but it is the shape that survives contact with a job, and a plan nobody can
 * keep is worth less than a smaller plan they can.
 */
export const SESSIONS_BY_INTENSITY: Record<Experience, number> = {
  beginner: 3,
  intermediate: 4,
  advanced: 5,
};

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  gym: 'Gym',
  bjj: 'BJJ',
  mma: 'MMA',
  boxing: 'Boxing',
  strongman: 'Strongman',
};
