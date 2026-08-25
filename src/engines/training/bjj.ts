import type { BjjBelt, BjjLog, BjjRound, IsoDate, SubmissionEvent, Workout } from '@/types';
import { BJJ_BELT_ORDER, BJJ_BELT_REQUIREMENTS, BJJ_POINTS, findPosition, findSubmission } from '@/data/disciplines';

/**
 * Mat engine.
 *
 * The unit of jiu-jitsu is time on the mat and what happened in it, so nothing
 * here borrows from the gym side. A submission is not a rep, tapping somebody
 * is not volume, and a session where you were submitted eight times may well
 * have been the best training of the week — so the numbers are reported without
 * a verdict attached.
 */

export type SubmissionTally = {
  submissionId: string;
  submissionName: string;
  landed: number;
  conceded: number;
};

export type MatSummary = {
  /** Everything from stepping on to stepping off. */
  matMinutes: number;
  /** Live rounds only, which is the number that actually tracks hard mileage. */
  rollingMinutes: number;
  rounds: number;
  submissionsLanded: number;
  submissionsConceded: number;
  /** Landed as a share of all submissions in the session. Null when nobody tapped. */
  submissionRate: number | null;
  sweeps: number;
  sweepsConceded: number;
  passes: number;
  passesConceded: number;
  takedowns: number;
  takedownsConceded: number;
  /** IBJJF points for the positional work, as a rough read on control. */
  pointsFor: number;
  pointsAgainst: number;
};

function countEvents(events: SubmissionEvent[]): number {
  return events.length;
}

export function summariseRounds(rounds: BjjRound[], matMinutes: number): MatSummary {
  const rollingMinutes = rounds.reduce((sum, r) => sum + r.minutes, 0);

  const totals = rounds.reduce(
    (acc, round) => ({
      landed: acc.landed + countEvents(round.submissionsLanded),
      conceded: acc.conceded + countEvents(round.submissionsConceded),
      sweeps: acc.sweeps + round.sweeps,
      sweepsConceded: acc.sweepsConceded + round.sweepsConceded,
      passes: acc.passes + round.passes,
      passesConceded: acc.passesConceded + round.passesConceded,
      takedowns: acc.takedowns + round.takedowns,
      takedownsConceded: acc.takedownsConceded + round.takedownsConceded,
    }),
    { landed: 0, conceded: 0, sweeps: 0, sweepsConceded: 0, passes: 0, passesConceded: 0, takedowns: 0, takedownsConceded: 0 },
  );

  const submissionTotal = totals.landed + totals.conceded;

  // Positional points, counted once per round for each position reached. A
  // scramble that hits mount three times in one round is not three mounts.
  let pointsFor = 0;
  for (const round of rounds) {
    for (const positionId of new Set(round.positionsReached)) {
      pointsFor += findPosition(positionId)?.points ?? 0;
    }
    pointsFor += round.sweeps * BJJ_POINTS.sweep;
    pointsFor += round.passes * BJJ_POINTS.guardPass;
    pointsFor += round.takedowns * BJJ_POINTS.takedown;
  }

  const pointsAgainst =
    totals.sweepsConceded * BJJ_POINTS.sweep +
    totals.passesConceded * BJJ_POINTS.guardPass +
    totals.takedownsConceded * BJJ_POINTS.takedown;

  return {
    matMinutes,
    rollingMinutes,
    rounds: rounds.length,
    submissionsLanded: totals.landed,
    submissionsConceded: totals.conceded,
    submissionRate: submissionTotal === 0 ? null : totals.landed / submissionTotal,
    sweeps: totals.sweeps,
    sweepsConceded: totals.sweepsConceded,
    passes: totals.passes,
    passesConceded: totals.passesConceded,
    takedowns: totals.takedowns,
    takedownsConceded: totals.takedownsConceded,
    pointsFor,
    pointsAgainst,
  };
}

export function summariseSession(log: BjjLog): MatSummary {
  return summariseRounds(log.rounds, log.matMinutes);
}

/**
 * Which submissions a person actually hits, and which keep catching them.
 *
 * Sorted by how often it happened at all rather than by landed count, because
 * the finish you get caught in six times a month is at least as useful to see
 * as the one you land.
 */
export function submissionBreakdown(logs: BjjLog[]): SubmissionTally[] {
  const tally = new Map<string, SubmissionTally>();

  const bump = (event: SubmissionEvent, key: 'landed' | 'conceded') => {
    const existing = tally.get(event.submissionId) ?? {
      submissionId: event.submissionId,
      submissionName: findSubmission(event.submissionId)?.name ?? event.submissionName,
      landed: 0,
      conceded: 0,
    };
    existing[key] += 1;
    tally.set(event.submissionId, existing);
  };

  for (const log of logs) {
    for (const round of log.rounds) {
      round.submissionsLanded.forEach((e) => bump(e, 'landed'));
      round.submissionsConceded.forEach((e) => bump(e, 'conceded'));
    }
  }

  return [...tally.values()].sort(
    (a, b) => b.landed + b.conceded - (a.landed + a.conceded) || a.submissionName.localeCompare(b.submissionName),
  );
}

/** Total mat time across sessions, in hours. The number people actually quote. */
export function matHours(logs: BjjLog[]): number {
  return logs.reduce((sum, log) => sum + log.matMinutes, 0) / 60;
}

export type BeltStanding = {
  belt: BjjBelt;
  stripes: number;
  monthsAtBelt: number;
  /** IBJJF minimum time in grade before the next belt. Null at white and black. */
  minimumMonths: number | null;
  /** True once the minimum has passed. Emphatically not "you are due a belt". */
  minimumServed: boolean;
  nextBelt: BjjBelt | null;
};

function monthsBetween(from: IsoDate, to: IsoDate): number {
  const a = new Date(`${from}T00:00:00.000Z`);
  const b = new Date(`${to}T00:00:00.000Z`);
  const months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  return b.getUTCDate() < a.getUTCDate() ? months - 1 : months;
}

/**
 * Where somebody stands at their current belt.
 *
 * The minimum is reported as a fact about the ruleset, never as a countdown to
 * a promotion. Time in grade is necessary and nowhere near sufficient, and an
 * app that implied otherwise would be teaching people to badger their coach.
 */
export function beltStanding(belt: BjjBelt, stripes: number, promotedOn: IsoDate, today: IsoDate): BeltStanding {
  const requirement = BJJ_BELT_REQUIREMENTS[belt];
  const monthsAtBelt = Math.max(0, monthsBetween(promotedOn, today));
  const index = BJJ_BELT_ORDER.indexOf(belt);

  return {
    belt,
    stripes,
    monthsAtBelt,
    minimumMonths: requirement.minimumMonthsBeforeNext,
    minimumServed:
      requirement.minimumMonthsBeforeNext === null ? false : monthsAtBelt >= requirement.minimumMonthsBeforeNext,
    nextBelt: index >= 0 && index < BJJ_BELT_ORDER.length - 1 ? BJJ_BELT_ORDER[index + 1]! : null,
  };
}

/** Pull the mat logs out of a mixed session history. */
export function bjjLogs(workouts: Workout[]): BjjLog[] {
  return workouts.flatMap((w) => (w.log?.kind === 'bjj' ? [w.log] : []));
}
