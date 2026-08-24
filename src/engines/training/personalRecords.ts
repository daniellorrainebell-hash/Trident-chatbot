import type {
  PersonalRecord,
  PrType,
  SetMetric,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  Uuid,
} from '@/types';
import { estimate1RM, isCountableSet } from './volume';

/**
 * PR detection (spec §15).
 *
 * Deterministic, and deliberately so — the spec is explicit that an LLM is never
 * asked whether a set is a record. Same sets in, same records out, every time.
 *
 * The engine takes the user's existing bests as input rather than reaching for
 * storage, which keeps it pure and makes it trivially testable.
 */

/** The best value already achieved, keyed by exercise and PR type. */
export type PrBaseline = Map<string, number>;

export function baselineKey(exerciseId: Uuid, type: PrType, atWeightKg?: number | null): string {
  // Rep PRs are tracked per weight: 100 kg x 8 and 120 kg x 3 are separate records.
  if (type === 'rep_pr' && atWeightKg != null) {
    return `${exerciseId}:${type}:${atWeightKg}`;
  }
  return `${exerciseId}:${type}`;
}

export function buildBaseline(records: PersonalRecord[]): PrBaseline {
  const baseline: PrBaseline = new Map();
  for (const record of records) {
    const key = baselineKey(record.exerciseId, record.type, record.atWeightKg);
    const existing = baseline.get(key);
    // Lower is better for time; higher for everything else.
    const better =
      record.type === 'fastest_time'
        ? existing == null || record.value < existing
        : existing == null || record.value > existing;
    if (better) baseline.set(key, record.value);
  }
  return baseline;
}

function isImprovement(type: PrType, candidate: number, previous: number | undefined): boolean {
  if (previous === undefined) return true;
  return type === 'fastest_time' ? candidate < previous : candidate > previous;
}

/** Which PR types a metric can even produce. Asking for a distance PR on a bench press is nonsense. */
function applicableTypes(metric: SetMetric): PrType[] {
  switch (metric) {
    case 'weight_reps':
    case 'weighted_reps':
      return ['max_weight', 'rep_pr', 'estimated_1rm'];
    case 'reps':
      return ['max_reps'];
    case 'duration':
      return ['longest_duration'];
    case 'distance':
      return ['max_distance'];
    case 'distance_time':
      return ['max_distance', 'fastest_time'];
    case 'rounds':
      return ['max_reps'];
  }
}

function candidateValue(type: PrType, set: WorkoutSet): number | null {
  switch (type) {
    case 'max_weight':
      return set.weightKg && set.reps ? set.weightKg : null;
    case 'rep_pr':
      return set.reps && set.weightKg ? set.reps : null;
    case 'estimated_1rm':
      return set.weightKg && set.reps ? estimate1RM(set.weightKg, set.reps) : null;
    case 'max_reps':
      return set.reps ?? set.rounds ?? null;
    case 'longest_duration':
      return set.durationSeconds ?? null;
    case 'max_distance':
      return set.distanceMeters ?? null;
    case 'fastest_time':
      // Only meaningful alongside a distance — a bare duration is not a "time".
      return set.durationSeconds && set.distanceMeters ? set.durationSeconds : null;
  }
}

export type DetectPrOptions = {
  userId: Uuid;
  workoutId: Uuid;
  achievedAt: string;
  /** Supplied by the caller so IDs stay deterministic under test. */
  makeId: () => Uuid;
};

/**
 * Detect records set by one exercise within a session.
 *
 * Only the session's best attempt per record type is emitted, and it is compared
 * against the baseline as it stood *before* the session. Without that, a normal
 * ascending ramp — 100, 110, 120 — would fire three separate max-weight PRs, each
 * "beating" the set before it, and the completion screen would be meaningless.
 *
 * The baseline is updated on the way out so a later exercise on the same movement
 * within the same workout is judged against the new best.
 */
export function detectExercisePRs(
  exercise: WorkoutExercise,
  baseline: PrBaseline,
  options: DetectPrOptions,
): PersonalRecord[] {
  const types = applicableTypes(exercise.metric);

  // Best candidate per baseline key across every countable set in this exercise.
  const best = new Map<string, { type: PrType; value: number; set: WorkoutSet }>();

  for (const set of exercise.sets) {
    if (!isCountableSet(set)) continue;

    for (const type of types) {
      const value = candidateValue(type, set);
      if (value == null || value <= 0) continue;

      const key = baselineKey(exercise.exerciseId, type, set.weightKg);
      const incumbent = best.get(key);
      if (incumbent && !isImprovement(type, value, incumbent.value)) continue;

      best.set(key, { type, value, set });
    }
  }

  const found: PersonalRecord[] = [];

  for (const [key, candidate] of best) {
    const previous = baseline.get(key);
    if (!isImprovement(candidate.type, candidate.value, previous)) continue;

    baseline.set(key, candidate.value);
    found.push({
      id: options.makeId(),
      userId: options.userId,
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      type: candidate.type,
      value: candidate.value,
      atWeightKg: candidate.type === 'rep_pr' ? candidate.set.weightKg : null,
      reps: candidate.set.reps,
      achievedAt: options.achievedAt,
      workoutId: options.workoutId,
      previousValue: previous ?? null,
    });
  }

  return found;
}

/**
 * Detect every PR in a completed workout.
 *
 * A first-ever attempt at a lift counts as a record — `previousValue` is null and
 * the UI shows "FIRST" rather than a delta, so it reads honestly.
 */
export function detectWorkoutPRs(
  workout: Workout,
  existing: PersonalRecord[],
  options: DetectPrOptions,
): PersonalRecord[] {
  const baseline = buildBaseline(existing);
  const records: PersonalRecord[] = [];
  for (const exercise of workout.exercises) {
    records.push(...detectExercisePRs(exercise, baseline, options));
  }
  return records;
}

/** Human-readable PR label for the completion screen and The Yard. */
export function describePR(record: PersonalRecord): string {
  switch (record.type) {
    case 'max_weight':
      return `${record.value} kg`;
    case 'rep_pr':
      return `${record.value} reps at ${record.atWeightKg} kg`;
    case 'estimated_1rm':
      return `${record.value} kg estimated 1RM`;
    case 'max_reps':
      return `${record.value} reps`;
    case 'max_distance':
      return `${(record.value / 1000).toFixed(2)} km`;
    case 'fastest_time':
      return formatDuration(record.value);
    case 'longest_duration':
      return formatDuration(record.value);
  }
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
