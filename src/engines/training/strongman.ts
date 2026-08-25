import type {
  StrongmanAttempt,
  StrongmanEventStyle,
  StrongmanLog,
  Workout,
} from '@/types';
import { findEvent, higherIsBetter } from '@/data/disciplines';

/**
 * Events engine.
 *
 * Two rules shape everything here.
 *
 * A best is always a best *at a style*. The same yoke is a fastest-20 m, a
 * max-distance-in-60 s and a heaviest-carry, and those three numbers have
 * nothing to say to each other. Keying records on the event alone would let a
 * good carry overwrite a good sprint and call it progress.
 *
 * A miss counts. Opener, second, third is the shape of the sport, and a log
 * that kept only the makes would hide the fact that 150 kg has beaten you three
 * weeks running. So attempts are counted in full and successes separately,
 * and only a make can set a record.
 */

export type EventBestKey = `${string}:${StrongmanEventStyle}`;

export type EventBest = {
  eventId: string;
  eventName: string;
  style: StrongmanEventStyle;
  /** Load, reps, metres or seconds — whichever the style is scored in. */
  value: number;
  /** The load carried while doing it, where the score is not itself a load. */
  atLoadKg: number | null;
  achievedAt: string;
};

export type EventSummary = {
  attempts: number;
  successful: number;
  /** Null rather than zero when nothing was attempted — no attempts is not 0%. */
  successRate: number | null;
  heaviestKg: number | null;
  /** Metres covered under load, across every carry and drag in the session. */
  loadedMetres: number;
  events: number;
};

/** What a style is scored in, which is also what a record compares. */
export function scoreOf(attempt: StrongmanAttempt): number | null {
  switch (attempt.style) {
    case 'max_load':
      return attempt.loadKg;
    case 'reps_in_time':
      return attempt.reps;
    case 'distance_in_time':
      return attempt.distanceMetres;
    case 'time_for_distance':
    case 'time_for_reps':
    case 'hold_time':
    case 'medley':
      return attempt.seconds;
    default:
      return null;
  }
}

export function summariseAttempts(attempts: StrongmanAttempt[]): EventSummary {
  const successful = attempts.filter((a) => a.successful);

  const heaviest = successful.reduce<number | null>(
    (max, a) => (a.loadKg !== null && (max === null || a.loadKg > max) ? a.loadKg : max),
    null,
  );

  const loadedMetres = successful.reduce(
    (sum, a) => sum + (a.distanceMetres ?? 0),
    0,
  );

  return {
    attempts: attempts.length,
    successful: successful.length,
    successRate: attempts.length === 0 ? null : successful.length / attempts.length,
    heaviestKg: heaviest,
    loadedMetres,
    events: new Set(attempts.map((a) => a.eventId)).size,
  };
}

export function summariseSession(log: StrongmanLog): EventSummary {
  return summariseAttempts(log.attempts);
}

function betterThan(style: StrongmanEventStyle, candidate: number, incumbent: number): boolean {
  return higherIsBetter(style) ? candidate > incumbent : candidate < incumbent;
}

/**
 * Best at each event and style across a history.
 *
 * Only successful attempts are eligible. A missed 150 kg is worth logging and
 * worth seeing, but it is not a personal best in any sense the word survives.
 */
export function eventBests(workouts: Workout[]): Map<EventBestKey, EventBest> {
  const bests = new Map<EventBestKey, EventBest>();

  for (const workout of workouts) {
    if (workout.log?.kind !== 'strongman') continue;
    const achievedAt = workout.completedAt ?? workout.startedAt;

    for (const attempt of workout.log.attempts) {
      if (!attempt.successful) continue;
      const value = scoreOf(attempt);
      if (value === null) continue;

      const key: EventBestKey = `${attempt.eventId}:${attempt.style}`;
      const incumbent = bests.get(key);

      if (incumbent === undefined || betterThan(attempt.style, value, incumbent.value)) {
        bests.set(key, {
          eventId: attempt.eventId,
          eventName: findEvent(attempt.eventId)?.name ?? attempt.eventName,
          style: attempt.style,
          value,
          atLoadKg: attempt.style === 'max_load' ? null : attempt.loadKg,
          achievedAt,
        });
      }
    }
  }

  return bests;
}

/**
 * Attempts at one event and style in date order, for reading a progression.
 *
 * Misses are kept. A run of three failed 150 kg openers is the most useful
 * thing on the screen when you are deciding what to open with next time.
 */
export function attemptHistory(
  workouts: Workout[],
  eventId: string,
  style: StrongmanEventStyle,
): Array<StrongmanAttempt & { achievedAt: string }> {
  const rows: Array<StrongmanAttempt & { achievedAt: string }> = [];

  for (const workout of workouts) {
    if (workout.log?.kind !== 'strongman') continue;
    const achievedAt = workout.completedAt ?? workout.startedAt;
    for (const attempt of workout.log.attempts) {
      if (attempt.eventId === eventId && attempt.style === style) rows.push({ ...attempt, achievedAt });
    }
  }

  return rows.sort((a, b) => a.achievedAt.localeCompare(b.achievedAt));
}

/** Pull the event logs out of a mixed session history. */
export function strongmanLogs(workouts: Workout[]): StrongmanLog[] {
  return workouts.flatMap((w) => (w.log?.kind === 'strongman' ? [w.log] : []));
}
