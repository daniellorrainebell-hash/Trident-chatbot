import type { Workout, WorkoutSet, WorkoutSummary, SetMetric } from '@/types';

/**
 * Volume and session totals.
 *
 * One rule runs through this file: warm-up sets and incomplete sets never count.
 * A set the user typed but did not tick is an intention, and intentions do not
 * score (spec §1). Every consumer — summaries, contracts, leaderboards, the
 * Rabid Score — reads volume from here so the number is the same everywhere.
 */

export function isCountableSet(set: WorkoutSet): boolean {
  return set.completed && !set.isWarmup;
}

/**
 * Volume for a single set, in kilograms.
 *
 * Only weight-based metrics produce volume. A 5 km run and a 90-second plank are
 * real work, but they are not tonnage, and folding them in would make the number
 * meaningless. They are counted by their own metrics elsewhere.
 */
export function setVolumeKg(set: WorkoutSet, metric: SetMetric): number {
  if (!isCountableSet(set)) return 0;
  if (metric !== 'weight_reps' && metric !== 'weighted_reps') return 0;
  const weight = set.weightKg ?? 0;
  const reps = set.reps ?? 0;
  if (weight <= 0 || reps <= 0) return 0;
  return weight * reps;
}

export function workoutVolumeKg(workout: Workout): number {
  let total = 0;
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      total += setVolumeKg(set, exercise.metric);
    }
  }
  return Math.round(total);
}

export function countWorkingSets(workout: Workout): number {
  let count = 0;
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (isCountableSet(set)) count += 1;
    }
  }
  return count;
}

export function countTotalReps(workout: Workout): number {
  let reps = 0;
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (isCountableSet(set)) reps += set.reps ?? 0;
    }
  }
  return reps;
}

/** Exercises with at least one countable set. An exercise added but never worked does not count. */
export function countWorkedExercises(workout: Workout): number {
  return workout.exercises.filter((e) => e.sets.some(isCountableSet)).length;
}

export function totalDistanceMeters(workout: Workout): number {
  let metres = 0;
  for (const exercise of workout.exercises) {
    for (const set of exercise.sets) {
      if (isCountableSet(set)) metres += set.distanceMeters ?? 0;
    }
  }
  return metres;
}

/**
 * Session totals for the completion screen (spec §12).
 * PRs are attached by the caller — detection needs history this function does not have.
 */
export function summariseWorkout(workout: Workout): Omit<WorkoutSummary, 'personalRecords'> {
  return {
    workoutId: workout.id,
    durationSeconds: workout.durationSeconds,
    exerciseCount: countWorkedExercises(workout),
    workingSets: countWorkingSets(workout),
    volumeKg: workoutVolumeKg(workout),
    totalReps: countTotalReps(workout),
  };
}

/**
 * Epley estimated 1RM: weight x (1 + reps/30).
 *
 * Accurate enough in the 1–10 rep range and badly optimistic beyond it, so it is
 * capped. A 20-rep set says a lot about work capacity and very little about a
 * true single, and reporting an estimate from one would be fake precision (spec §97.11).
 */
export const ESTIMATED_1RM_MAX_REPS = 12;

export function estimate1RM(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps <= 0) return null;
  if (reps > ESTIMATED_1RM_MAX_REPS) return null;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}
