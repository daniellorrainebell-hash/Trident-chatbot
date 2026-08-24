import type {
  Contract,
  IsoDate,
  PersonalRecord,
  RabidLevel,
  RabidScore,
  RabidScoreBreakdown,
  Uuid,
  Workout,
} from '@/types';
import { sessionsPerWeek, weekStart, workoutsInRange } from '../training/streaks';
import { daysBetween, parseIsoDate, toIsoDate } from '../training/contracts';
import { workoutVolumeKg } from '../training/volume';

/**
 * Rabid Score v1 (spec §21).
 *
 * The design constraint that shapes everything here: the score must not simply
 * reward the strongest user, or whoever logs the most junk volume. So raw tonnage
 * contributes *nothing* directly. What scores is showing up, keeping promises,
 * and moving forward — things a beginner can max out as readily as a veteran.
 *
 * The algorithm is versioned. Changing any weight means incrementing
 * RABID_SCORE_VERSION, because stored history must stay explainable against the
 * rules that produced it.
 *
 * In production this runs server-side. The client imports it only to render a
 * projection; a client-supplied score is never trusted (spec §61).
 */

export const RABID_SCORE_VERSION = 1;

/** Components are capped so no single behaviour can dominate. Caps sum to 1000. */
export const SCORE_WEIGHTS = {
  consistency: 300,
  contracts: 250,
  frequency: 150,
  progression: 120,
  personalRecords: 100,
  challenges: 80,
} as const;

export const MAX_SCORE = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);

/** Grace period before dormancy starts costing points. */
export const INACTIVITY_GRACE_DAYS = 10;
export const INACTIVITY_PENALTY_PER_DAY = 8;
export const MAX_INACTIVITY_PENALTY = 400;

/** Rolling window all rate-based components are measured over. */
export const OBSERVATION_WEEKS = 12;

export const LEVEL_THRESHOLDS: Array<{ level: RabidLevel; min: number }> = [
  { level: 'rabid', min: 850 },
  { level: 'feral', min: 650 },
  { level: 'hound', min: 420 },
  { level: 'mutt', min: 200 },
  { level: 'stray', min: 0 },
];

export function levelForScore(score: number): RabidLevel {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (score >= threshold.min) return threshold.level;
  }
  return 'stray';
}

export function nextLevel(score: number): { level: RabidLevel; pointsAway: number } | null {
  const ascending = [...LEVEL_THRESHOLDS].reverse();
  for (const threshold of ascending) {
    if (threshold.min > score) {
      return { level: threshold.level, pointsAway: threshold.min - score };
    }
  }
  return null;
}

export type ScoreInput = {
  userId: Uuid;
  workouts: Workout[];
  contracts: Contract[];
  personalRecords: PersonalRecord[];
  challengesCompleted: number;
  challengesJoined: number;
  weeklyTarget: number;
  today: IsoDate;
};

function windowStart(today: IsoDate, weeks: number): IsoDate {
  const d = parseIsoDate(weekStart(today));
  d.setUTCDate(d.getUTCDate() - (weeks - 1) * 7);
  return toIsoDate(d);
}

/**
 * Consistency — the share of the last 12 weeks that met the user's own weekly
 * target. This is the largest single component by design: turning up repeatedly
 * is the behaviour the product exists to reward.
 */
function scoreConsistency(input: ScoreInput): number {
  const from = windowStart(input.today, OBSERVATION_WEEKS);
  const recent = workoutsInRange(input.workouts, from, input.today);
  const perWeek = sessionsPerWeek(recent);

  let weeksHit = 0;
  let cursor = parseIsoDate(from);
  for (let i = 0; i < OBSERVATION_WEEKS; i += 1) {
    const key = toIsoDate(cursor);
    if ((perWeek.get(key) ?? 0) >= input.weeklyTarget) weeksHit += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return Math.round((weeksHit / OBSERVATION_WEEKS) * SCORE_WEIGHTS.consistency);
}

/**
 * Contracts — completion rate across resolved Contracts, scaled by how many the
 * user has actually taken on. A single completed Contract should not read the
 * same as twenty; equally, failures pull the rate down. That is the point of
 * making the promise (spec §17).
 */
function scoreContracts(input: ScoreInput): number {
  const resolved = input.contracts.filter(
    (c) => c.status === 'completed' || c.status === 'failed',
  );
  if (resolved.length === 0) return 0;

  const completed = resolved.filter((c) => c.status === 'completed').length;
  const rate = completed / resolved.length;

  // Volume factor saturates at 8 resolved Contracts.
  const volumeFactor = Math.min(1, resolved.length / 8);

  return Math.round(rate * volumeFactor * SCORE_WEIGHTS.contracts);
}

/**
 * Frequency — average sessions per week against target, capped at 1.0.
 * Training six times a week when the target is three does not score double;
 * the cap is deliberate, because rewarding ever-more volume is how accountability
 * scores turn into overtraining incentives.
 */
function scoreFrequency(input: ScoreInput): number {
  const from = windowStart(input.today, OBSERVATION_WEEKS);
  const recent = workoutsInRange(input.workouts, from, input.today);
  const perWeek = sessionsPerWeek(recent);

  const totalSessions = [...perWeek.values()].reduce((a, b) => a + b, 0);
  const average = totalSessions / OBSERVATION_WEEKS;
  const ratio = Math.min(1, average / Math.max(1, input.weeklyTarget));

  return Math.round(ratio * SCORE_WEIGHTS.frequency);
}

/**
 * Progression — is the recent half of the window doing more work than the earlier
 * half? Compares per-session volume rather than total, so the component measures
 * getting stronger, not merely training more (that is already counted above).
 *
 * Absolute strength is never compared between users, so a 60 kg bench improving
 * to 65 kg scores exactly what a 200 kg bench improving proportionally does.
 */
function scoreProgression(input: ScoreInput): number {
  const half = Math.floor(OBSERVATION_WEEKS / 2);
  const fullFrom = windowStart(input.today, OBSERVATION_WEEKS);
  const recentFrom = windowStart(input.today, half);

  const earlier = workoutsInRange(input.workouts, fullFrom, recentFrom).filter(
    (w) => (w.completedAt?.slice(0, 10) ?? '') < recentFrom,
  );
  const recent = workoutsInRange(input.workouts, recentFrom, input.today);

  // Not enough history to judge a trend. Award the neutral midpoint rather than
  // zero — a new user is not regressing, they simply have no trend yet.
  if (earlier.length < 3 || recent.length < 3) {
    return Math.round(SCORE_WEIGHTS.progression * 0.5);
  }

  const earlierAvg = average(earlier.map(workoutVolumeKg));
  const recentAvg = average(recent.map(workoutVolumeKg));
  if (earlierAvg <= 0) return Math.round(SCORE_WEIGHTS.progression * 0.5);

  // +20% or better per-session volume tops the component out.
  const growth = (recentAvg - earlierAvg) / earlierAvg;
  const normalised = clamp((growth + 0.05) / 0.25, 0, 1);

  return Math.round(normalised * SCORE_WEIGHTS.progression);
}

/** PRs in the window. Saturates at 8 so a beginner's early rush does not run away. */
function scorePersonalRecords(input: ScoreInput): number {
  const from = windowStart(input.today, OBSERVATION_WEEKS);
  const recent = input.personalRecords.filter((pr) => pr.achievedAt.slice(0, 10) >= from);
  const factor = Math.min(1, recent.length / 8);
  return Math.round(factor * SCORE_WEIGHTS.personalRecords);
}

function scoreChallenges(input: ScoreInput): number {
  if (input.challengesJoined === 0) return 0;
  const rate = Math.min(1, input.challengesCompleted / input.challengesJoined);
  const volumeFactor = Math.min(1, input.challengesJoined / 4);
  return Math.round(rate * volumeFactor * SCORE_WEIGHTS.challenges);
}

/**
 * Inactivity penalty. Applied after a grace period, then capped — the score can
 * fall a long way, but it decays rather than being wiped, so returning after a
 * lay-off does not mean starting from nothing.
 */
function inactivityPenalty(input: ScoreInput): number {
  const completed = input.workouts
    .filter((w) => w.status === 'completed' && w.completedAt)
    .map((w) => w.completedAt!.slice(0, 10))
    .sort();

  const last = completed[completed.length - 1];
  if (!last) return 0;

  const idle = daysBetween(last, input.today);
  if (idle <= INACTIVITY_GRACE_DAYS) return 0;

  const penalty = (idle - INACTIVITY_GRACE_DAYS) * INACTIVITY_PENALTY_PER_DAY;
  return -Math.min(MAX_INACTIVITY_PENALTY, penalty);
}

export function calculateRabidScore(input: ScoreInput): RabidScore {
  const breakdown: RabidScoreBreakdown = {
    consistency: scoreConsistency(input),
    contracts: scoreContracts(input),
    frequency: scoreFrequency(input),
    progression: scoreProgression(input),
    personalRecords: scorePersonalRecords(input),
    challenges: scoreChallenges(input),
    inactivityPenalty: inactivityPenalty(input),
  };

  const raw = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const total = clamp(Math.round(raw), 0, MAX_SCORE);

  return {
    userId: input.userId,
    total,
    level: levelForScore(total),
    breakdown,
    version: RABID_SCORE_VERSION,
    calculatedAt: new Date().toISOString(),
  };
}

/** Which component is costing the user the most, for the "what to fix" hint. */
export function weakestComponent(
  breakdown: RabidScoreBreakdown,
): keyof typeof SCORE_WEIGHTS {
  let worst: keyof typeof SCORE_WEIGHTS = 'consistency';
  let worstRatio = Infinity;

  for (const key of Object.keys(SCORE_WEIGHTS) as Array<keyof typeof SCORE_WEIGHTS>) {
    const ratio = breakdown[key] / SCORE_WEIGHTS[key];
    if (ratio < worstRatio) {
      worstRatio = ratio;
      worst = key;
    }
  }
  return worst;
}

export function levelLabel(level: RabidLevel): string {
  return level.toUpperCase();
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

