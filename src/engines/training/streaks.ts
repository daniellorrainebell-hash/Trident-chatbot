import type { IsoDate, Workout } from '@/types';
import { countWorkingSets } from './volume';
import { daysBetween, parseIsoDate, toIsoDate } from './contracts';

/**
 * Streaks.
 *
 * A daily streak would punish anyone training a sane 4-day split, so the streak
 * is measured in *weeks meeting a target*, not consecutive days. Missing Tuesday
 * does not wipe a year of consistent work; missing a whole week does.
 */

export const DEFAULT_WEEKLY_TARGET = 3;

/** Monday-starting week key, matching the meal planner's Monday–Sunday week. */
export function weekStart(date: IsoDate): IsoDate {
  const d = parseIsoDate(date);
  const day = d.getUTCDay(); // 0 = Sunday
  const offset = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - offset);
  return toIsoDate(d);
}

export function countedWorkoutDays(workouts: Workout[]): IsoDate[] {
  const days = new Set<IsoDate>();
  for (const workout of workouts) {
    if (workout.status !== 'completed') continue;
    if (countWorkingSets(workout) === 0) continue;
    const day = workout.completedAt?.slice(0, 10);
    if (day) days.add(day);
  }
  return [...days].sort();
}

export function sessionsPerWeek(workouts: Workout[]): Map<IsoDate, number> {
  const counts = new Map<IsoDate, number>();
  for (const day of countedWorkoutDays(workouts)) {
    const key = weekStart(day);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export type StreakResult = {
  /** Consecutive weeks hitting target, counting back from the current week. */
  current: number;
  longest: number;
  /** Sessions logged in the week containing `today`. */
  sessionsThisWeek: number;
  target: number;
  /** True when this week is already safe. */
  weekSecured: boolean;
};

/**
 * The current week is treated as in-progress: it extends a streak once the target
 * is met, but falling short mid-week does not break it yet. Breaking someone's
 * streak on a Tuesday for not having trained three times is nonsense.
 */
export function calculateStreak(
  workouts: Workout[],
  today: IsoDate,
  target: number = DEFAULT_WEEKLY_TARGET,
): StreakResult {
  const perWeek = sessionsPerWeek(workouts);
  const thisWeek = weekStart(today);
  const sessionsThisWeek = perWeek.get(thisWeek) ?? 0;

  let current = 0;
  let cursor = thisWeek;

  if (sessionsThisWeek >= target) {
    current = 1;
    cursor = previousWeek(thisWeek);
  } else {
    // In-progress week neither adds to nor breaks the streak.
    cursor = previousWeek(thisWeek);
  }

  while ((perWeek.get(cursor) ?? 0) >= target) {
    current += 1;
    cursor = previousWeek(cursor);
  }

  return {
    current,
    longest: longestStreak(perWeek, target),
    sessionsThisWeek,
    target,
    weekSecured: sessionsThisWeek >= target,
  };
}

function previousWeek(week: IsoDate): IsoDate {
  const d = parseIsoDate(week);
  d.setUTCDate(d.getUTCDate() - 7);
  return toIsoDate(d);
}

function longestStreak(perWeek: Map<IsoDate, number>, target: number): number {
  const weeks = [...perWeek.keys()].sort();
  let longest = 0;
  let run = 0;
  let previous: IsoDate | null = null;

  for (const week of weeks) {
    const hit = (perWeek.get(week) ?? 0) >= target;
    // A gap week has no entry at all, so check adjacency explicitly.
    const contiguous = previous !== null && daysBetween(previous, week) === 7;
    run = hit ? (contiguous ? run + 1 : 1) : 0;
    longest = Math.max(longest, run);
    previous = week;
  }

  return longest;
}

export function workoutsInRange(workouts: Workout[], from: IsoDate, to: IsoDate): Workout[] {
  return workouts.filter((w) => {
    if (w.status !== 'completed') return false;
    const day = w.completedAt?.slice(0, 10);
    return day != null && day >= from && day <= to;
  });
}
