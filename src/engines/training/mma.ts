import type { IsoDate, MmaLog, MmaRange, MmaRound, SparIntensity, Workout } from '@/types';
import { HARD_SPARRING_WINDOW_DAYS } from '@/data/disciplines';
import { daysBetween } from './contracts';

/**
 * Rounds engine.
 *
 * A fight session is measured in rounds, and rounds are not interchangeable:
 * six on the pads and six of hard sparring are the same number and nothing like
 * the same week. Everything here keeps the range and the intensity attached to
 * the count, because the moment they are averaged away the number stops meaning
 * anything.
 */

export type RoundSummary = {
  rounds: number;
  roundMinutes: number;
  byRange: Record<MmaRange, number>;
  byIntensity: Record<SparIntensity, number>;
  hardRounds: number;
  takedownsFor: number;
  takedownsAgainst: number;
  submissionsFor: number;
  submissionsAgainst: number;
  knockdownsFor: number;
  knockdownsAgainst: number;
};

const emptyByRange = (): Record<MmaRange, number> => ({
  striking: 0, clinch: 0, wrestling: 0, ground: 0, cage: 0,
});

const emptyByIntensity = (): Record<SparIntensity, number> => ({
  technical: 0, light: 0, medium: 0, hard: 0,
});

export function summariseRounds(rounds: MmaRound[]): RoundSummary {
  const byRange = emptyByRange();
  const byIntensity = emptyByIntensity();

  let roundMinutes = 0;
  let takedownsFor = 0;
  let takedownsAgainst = 0;
  let submissionsFor = 0;
  let submissionsAgainst = 0;
  let knockdownsFor = 0;
  let knockdownsAgainst = 0;

  for (const round of rounds) {
    roundMinutes += round.minutes;
    byRange[round.range] += 1;
    byIntensity[round.intensity] += 1;
    takedownsFor += round.takedownsFor;
    takedownsAgainst += round.takedownsAgainst;
    submissionsFor += round.submissionsFor;
    submissionsAgainst += round.submissionsAgainst;
    knockdownsFor += round.knockdownsFor;
    knockdownsAgainst += round.knockdownsAgainst;
  }

  return {
    rounds: rounds.length,
    roundMinutes,
    byRange,
    byIntensity,
    hardRounds: byIntensity.hard,
    takedownsFor,
    takedownsAgainst,
    submissionsFor,
    submissionsAgainst,
    knockdownsFor,
    knockdownsAgainst,
  };
}

export function summariseSession(log: MmaLog): RoundSummary {
  return summariseRounds(log.rounds);
}

/**
 * Where the work actually went, as shares of total rounds.
 *
 * Fighters are reliably wrong about this. Almost everyone believes their
 * wrestling gets more time than it does, and a flat percentage settles it
 * without anybody having to argue.
 */
export function rangeBalance(logs: MmaLog[]): Array<{ range: MmaRange; rounds: number; share: number }> {
  const byRange = emptyByRange();
  let total = 0;

  for (const log of logs) {
    for (const round of log.rounds) {
      byRange[round.range] += 1;
      total += 1;
    }
  }

  return (Object.keys(byRange) as MmaRange[])
    .map((range) => ({ range, rounds: byRange[range], share: total === 0 ? 0 : byRange[range] / total }))
    .sort((a, b) => b.rounds - a.rounds);
}

export type HardSparringLoad = {
  windowDays: number;
  hardRounds: number;
  hardRoundMinutes: number;
  sessions: number;
  /** Most recent hard sparring date in the window, for a "last hard day" line. */
  lastHardDate: IsoDate | null;
};

/**
 * Hard sparring over a rolling window.
 *
 * Reported, never prescribed. The app has no business setting anyone's contact
 * limits — that is a conversation with a coach who can see them train. What it
 * can do is answer the question honestly, because the fighter least able to
 * recall how many hard rounds they took this month is exactly the one for whom
 * the answer matters most.
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
    if (workout.log?.kind !== 'mma') continue;
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

/** Pull the fight logs out of a mixed session history. */
export function mmaLogs(workouts: Workout[]): MmaLog[] {
  return workouts.flatMap((w) => (w.log?.kind === 'mma' ? [w.log] : []));
}
