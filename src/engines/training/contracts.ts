import type {
  Contract,
  ContractProgress,
  ContractStatus,
  IsoDate,
  Workout,
} from '@/types';
import { totalDistanceMeters, workoutVolumeKg, countWorkingSets } from './volume';

/**
 * Contract progress (spec §17).
 *
 * Two rules the rest of the app depends on:
 *
 *   1. Progress is derived from logged work, never stored as a counter the client
 *      can push. A client-supplied "I'm at 14/16" is not trusted (spec §61).
 *   2. A Contract that runs out of time short of target becomes `failed` and stays
 *      in history. There is no delete path, here or in the UI.
 */

export function toIsoDate(date: Date): IsoDate {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(date: IsoDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

function isWithinWindow(workout: Workout, contract: Contract): boolean {
  if (workout.status !== 'completed') return false;
  const day = workout.completedAt?.slice(0, 10);
  if (!day) return false;
  return day >= contract.startDate && day <= contract.endDate;
}

/**
 * How much a single workout contributes to a Contract.
 * Anything that does not match the Contract's metric contributes nothing.
 */
export function contributionFrom(workout: Workout, contract: Contract): number {
  if (!isWithinWindow(workout, contract)) return 0;

  switch (contract.metric) {
    case 'sessions':
      // Only sessions with real work count. Starting and abandoning is not a session.
      return countWorkingSets(workout) > 0 ? 1 : 0;

    case 'volume_kg':
      return workoutVolumeKg(workout);

    case 'distance_km':
      return totalDistanceMeters(workout) / 1000;

    case 'conditioning_sessions':
    case 'fight_camp_sessions': {
      const conditioning = workout.exercises.some(
        (e) => e.metric === 'rounds' || e.metric === 'distance' || e.metric === 'distance_time',
      );
      return conditioning ? 1 : 0;
    }

    case 'target_lift_kg': {
      // A lift target is a high-water mark, not a running total — the caller takes
      // the max across workouts rather than summing contributions.
      if (!contract.exerciseId) return 0;
      let best = 0;
      for (const exercise of workout.exercises) {
        if (exercise.exerciseId !== contract.exerciseId) continue;
        for (const set of exercise.sets) {
          if (!set.completed || set.isWarmup) continue;
          if ((set.reps ?? 0) > 0) best = Math.max(best, set.weightKg ?? 0);
        }
      }
      return best;
    }
  }
}

function isHighWaterMark(contract: Contract): boolean {
  return contract.metric === 'target_lift_kg';
}

export function currentValue(contract: Contract, workouts: Workout[]): number {
  if (isHighWaterMark(contract)) {
    return workouts.reduce((best, w) => Math.max(best, contributionFrom(w, contract)), 0);
  }
  return workouts.reduce((sum, w) => sum + contributionFrom(w, contract), 0);
}

/**
 * Resolve a Contract's status against the clock.
 *
 * Reaching target completes it immediately — the user does not have to wait out
 * the window. Missing it at the deadline fails it permanently.
 */
export function resolveStatus(
  contract: Contract,
  current: number,
  today: IsoDate,
): ContractStatus {
  if (contract.status === 'draft') return 'draft';
  if (contract.status === 'completed') return 'completed';
  if (contract.status === 'failed') return 'failed';
  if (current >= contract.target) return 'completed';
  if (today > contract.endDate) return 'failed';
  return 'active';
}

export function calculateProgress(
  contract: Contract,
  workouts: Workout[],
  today: IsoDate,
): ContractProgress {
  const current = currentValue(contract, workouts);
  const status = resolveStatus(contract, current, today);
  const remaining = Math.max(0, contract.target - current);
  const fraction = contract.target > 0 ? Math.min(1, current / contract.target) : 0;

  // Inclusive of today: a deadline of today still leaves one day to work.
  const daysRemaining = Math.max(0, daysBetween(today, contract.endDate) + 1);

  const requiredDailyRate =
    status === 'active' && daysRemaining > 0 && remaining > 0
      ? remaining / daysRemaining
      : null;

  // Off pace = at the current average rate, the window closes short.
  const elapsed = Math.max(1, daysBetween(contract.startDate, today) + 1);
  const totalDays = Math.max(1, daysBetween(contract.startDate, contract.endDate) + 1);
  const projected = (current / elapsed) * totalDays;
  const offPace = status === 'active' && projected < contract.target;

  return {
    contractId: contract.id,
    current: roundForMetric(contract, current),
    target: contract.target,
    fraction,
    daysRemaining,
    remaining: roundForMetric(contract, remaining),
    requiredDailyRate,
    offPace,
    status,
  };
}

/** Sessions are whole numbers; volume and distance are not. */
function roundForMetric(contract: Contract, value: number): number {
  switch (contract.metric) {
    case 'sessions':
    case 'conditioning_sessions':
    case 'fight_camp_sessions':
      return Math.floor(value);
    case 'distance_km':
      return Math.round(value * 10) / 10;
    default:
      return Math.round(value);
  }
}

/** Nudge copy for the Kennel card and push notifications (spec §57). */
export function describeProgress(contract: Contract, progress: ContractProgress): string {
  if (progress.status === 'completed') return 'Contract complete.';
  if (progress.status === 'failed') {
    return `Failed. ${progress.current} of ${contract.target} ${contract.unit}.`;
  }
  if (progress.daysRemaining === 0) return 'Deadline today.';
  const days = progress.daysRemaining === 1 ? '1 day' : `${progress.daysRemaining} days`;
  return `${progress.remaining} ${contract.unit} left. ${days} remaining.`;
}
