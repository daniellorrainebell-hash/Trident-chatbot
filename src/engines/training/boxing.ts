import type { BoxingLog, BoxingRound, BoxingSessionType, IsoDate, SparIntensity, Workout } from '@/types';
import { LIVE_SESSION_TYPES } from '@/data/disciplines';
import { HARD_SPARRING_WINDOW_DAYS } from '@/data/disciplines';
import { daysBetween } from './contracts';

/**
 * Ring engine.
 *
 * Boxing measures in rounds like MMA does, but it asks different questions of
 * them. There are no ranges to balance — there is one range — so what matters
 * instead is output, accuracy, and whether any of it went downstairs. Work rate
 * and the body/head split are the two numbers a coach will ask for and almost
 * nobody can answer.
 *
 * Punch counts are optional everywhere. Most sessions are not scored, and a
 * zero would be a lie about a round nobody watched with a clicker — so an
 * uncounted round is absent from the averages rather than dragging them down.
 */

export type RingSummary = {
  rounds: number;
  roundMinutes: number;
  byIntensity: Record<SparIntensity, number>;
  hardRounds: number;
  knockdownsFor: number;
  knockdownsAgainst: number;
  /** Only across rounds where somebody actually counted. */
  countedRounds: number;
  punchesThrown: number | null;
  punchesLanded: number | null;
  /** Landed over thrown. Null when nothing was counted. */
  accuracy: number | null;
  /** Punches thrown per round, across counted rounds only. */
  workRate: number | null;
  /** Body shots as a share of everything thrown. The number people are worst at. */
  bodyShare: number | null;
};

const emptyByIntensity = (): Record<SparIntensity, number> => ({
  technical: 0, light: 0, medium: 0, hard: 0,
});

export function summariseRounds(rounds: BoxingRound[]): RingSummary {
  const byIntensity = emptyByIntensity();

  let roundMinutes = 0;
  let knockdownsFor = 0;
  let knockdownsAgainst = 0;

  const counted = rounds.filter((r) => r.punchesThrown !== null);
  let thrown = 0;
  let landed = 0;
  let body = 0;
  let landedKnown = 0;

  for (const round of rounds) {
    roundMinutes += round.minutes;
    byIntensity[round.intensity] += 1;
    knockdownsFor += round.knockdownsFor;
    knockdownsAgainst += round.knockdownsAgainst;
  }

  for (const round of counted) {
    thrown += round.punchesThrown ?? 0;
    body += round.bodyPunchesThrown ?? 0;
    if (round.punchesLanded !== null) {
      landed += round.punchesLanded;
      landedKnown += round.punchesThrown ?? 0;
    }
  }

  return {
    rounds: rounds.length,
    roundMinutes,
    byIntensity,
    hardRounds: byIntensity.hard,
    knockdownsFor,
    knockdownsAgainst,
    countedRounds: counted.length,
    punchesThrown: counted.length === 0 ? null : thrown,
    punchesLanded: landedKnown === 0 ? null : landed,
    // Accuracy is only over the rounds where the landed count was kept too.
    accuracy: landedKnown === 0 ? null : landed / landedKnown,
    workRate: counted.length === 0 ? null : thrown / counted.length,
    bodyShare: thrown === 0 ? null : body / thrown,
  };
}

export function summariseSession(log: BoxingLog): RingSummary {
  return summariseRounds(log.rounds);
}

export type SessionTypeTally = {
  sessionType: BoxingSessionType;
  sessions: number;
  rounds: number;
};

/**
 * Where the rounds went, by kind of session.
 *
 * The useful read is the ratio of bag to pads to sparring. Almost every
 * self-coached boxer is heavy on the bag, because the bag never hits back and
 * never needs booking.
 */
export function sessionMix(logs: BoxingLog[]): SessionTypeTally[] {
  const tally = new Map<BoxingSessionType, SessionTypeTally>();

  for (const log of logs) {
    const existing = tally.get(log.sessionType) ?? { sessionType: log.sessionType, sessions: 0, rounds: 0 };
    existing.sessions += 1;
    existing.rounds += log.rounds.length;
    tally.set(log.sessionType, existing);
  }

  return [...tally.values()].sort((a, b) => b.rounds - a.rounds);
}

/** Rounds against a live opponent, which is the load that actually accumulates. */
export function liveRounds(logs: BoxingLog[]): number {
  return logs
    .filter((log) => LIVE_SESSION_TYPES.includes(log.sessionType))
    .reduce((sum, log) => sum + log.rounds.length, 0);
}

export type HardSparringLoad = {
  windowDays: number;
  hardRounds: number;
  hardRoundMinutes: number;
  sessions: number;
  lastHardDate: IsoDate | null;
};

/**
 * Hard sparring over a rolling window.
 *
 * The same count the fight side keeps, and for the same reason: reported, never
 * prescribed. What a head can take is a conversation with a coach who can see
 * you train. What the app can do is answer the question honestly, because the
 * boxer least able to recall how many hard rounds they took this month is
 * exactly the one for whom the answer matters.
 */
export function hardSparringLoad(
  workouts: Workout[],
  today: IsoDate,
  windowDays: number = HARD_SPARRING_WINDOW_DAYS,
): HardSparringLoad {
  let hardRounds = 0;
  let hardRoundMinutes = 0;
  let sessions = 0;
  let lastHardDate: IsoDate | null = null;

  for (const workout of workouts) {
    if (workout.log?.kind !== 'boxing') continue;
    const date = (workout.completedAt ?? workout.startedAt).slice(0, 10) as IsoDate;
    const age = daysBetween(date, today);
    if (age < 0 || age >= windowDays) continue;

    const hard = workout.log.rounds.filter((r) => r.intensity === 'hard');
    if (hard.length === 0) continue;

    sessions += 1;
    hardRounds += hard.length;
    hardRoundMinutes += hard.reduce((sum, r) => sum + r.minutes, 0);
    if (lastHardDate === null || date > lastHardDate) lastHardDate = date;
  }

  return { windowDays, hardRounds, hardRoundMinutes, sessions, lastHardDate };
}

/** Pull the ring logs out of a mixed session history. */
export function boxingLogs(workouts: Workout[]): BoxingLog[] {
  return workouts.flatMap((w) => (w.log?.kind === 'boxing' ? [w.log] : []));
}
