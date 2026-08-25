import type { BjjLog, BjjRound, HyroxLog, MmaLog, MmaRound, Workout } from '@/types';
import { HYROX_STATIONS } from './disciplines';
import { SEED_TODAY, SEED_USER_ID, seedWorkouts } from './seed';

/**
 * Seeded mat, fight and race sessions.
 *
 * Kept apart from `seedWorkouts` on purpose. That list is the gym history, and
 * a good deal of the app's arithmetic — volume, working sets, progression —
 * assumes every entry in it has exercises to count. A BJJ session has none, and
 * quietly appending one would not crash anything; it would just make the volume
 * curve wrong in a way nobody would notice for months.
 *
 * `seedAllSessions` is the combined view for anywhere that genuinely means
 * "everything I trained", which is most places a person looks.
 */

function daysBefore(days: number, hour = 19): string {
  const d = new Date(`${SEED_TODAY}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return `${d.toISOString().slice(0, 10)}T${String(hour).padStart(2, '0')}:30:00.000Z`;
}

function session(
  id: string,
  title: string,
  discipline: Workout['discipline'],
  completedAt: string,
  durationSeconds: number,
  log: Workout['log'],
): Workout {
  return {
    id,
    userId: SEED_USER_ID,
    title,
    discipline,
    log,
    status: 'completed',
    startedAt: completedAt,
    completedAt,
    durationSeconds,
    exercises: [],
    syncState: 'synced',
  };
}

// ── Mat ─────────────────────────────────────────────────────────────────────

/** When the current belt was awarded, for time in grade. */
export const SEED_BELT_PROMOTED_ON = '2024-06-22';
export const SEED_BELT = 'blue' as const;
export const SEED_STRIPES = 3;

let rollId = 0;
function roll(minutes: number, overrides: Partial<BjjRound> = {}): BjjRound {
  rollId += 1;
  return {
    id: `roll-seed-${rollId}`,
    index: rollId,
    minutes,
    intensity: 'hard',
    submissionsLanded: [],
    submissionsConceded: [],
    sweeps: 0,
    sweepsConceded: 0,
    passes: 0,
    passesConceded: 0,
    takedowns: 0,
    takedownsConceded: 0,
    positionsReached: [],
    ...overrides,
  };
}

const sub = (submissionId: string, submissionName: string, fromPositionId?: string) => ({
  submissionId,
  submissionName,
  fromPositionId,
});

function mat(
  sessionType: BjjLog['sessionType'],
  gi: boolean,
  matMinutes: number,
  rounds: BjjRound[],
  techniquesDrilled: string[],
): BjjLog {
  return {
    kind: 'bjj',
    sessionType,
    gi,
    matMinutes,
    rounds,
    techniquesDrilled,
    beltAtSession: SEED_BELT,
    stripesAtSession: SEED_STRIPES,
  };
}

export const seedMatSessions: Workout[] = [
  session('bjj-seed-1', 'No-gi', 'bjj', daysBefore(1, 19), 5400, mat('nogi', false, 90, [
    roll(6, {
      partnerName: 'Reece', partnerBelt: 'blue',
      submissionsLanded: [sub('rear_naked_choke', 'Rear naked choke', 'back_control')],
      passes: 2, positionsReached: ['side_control', 'back_control'],
    }),
    roll(6, {
      partnerName: 'Sam', partnerBelt: 'purple',
      submissionsConceded: [sub('triangle', 'Triangle choke', 'closed_guard')],
      sweepsConceded: 1, positionsReached: ['half_guard'],
    }),
    roll(6, {
      partnerName: 'Tom', partnerBelt: 'white',
      submissionsLanded: [sub('armbar', 'Armbar', 'mount'), sub('kimura', 'Kimura', 'side_control')],
      passes: 3, takedowns: 1, positionsReached: ['mount', 'side_control'],
    }),
    roll(6, { partnerName: 'Reece', partnerBelt: 'blue', intensity: 'flow', sweeps: 2, positionsReached: ['butterfly'] }),
    roll(6, {
      partnerName: 'Danielle', partnerBelt: 'blue',
      submissionsConceded: [sub('armbar', 'Armbar', 'closed_guard')],
      positionsReached: ['closed_guard'],
    }),
  ], ['darce', 'front_headlock', 'single_leg'])),

  session('bjj-seed-2', 'Gi class', 'bjj', daysBefore(3, 19), 5400, mat('gi', true, 90, [
    roll(5, {
      partnerName: 'Sam', partnerBelt: 'purple',
      submissionsConceded: [sub('bow_and_arrow', 'Bow and arrow choke', 'back_control')],
      positionsReached: ['turtle_bottom'],
    }),
    roll(5, {
      partnerName: 'Mo', partnerBelt: 'blue',
      submissionsLanded: [sub('cross_collar', 'Cross collar choke', 'mount')],
      passes: 2, positionsReached: ['mount'],
    }),
    roll(5, { partnerName: 'Tom', partnerBelt: 'white', sweeps: 3, passes: 1, positionsReached: ['closed_guard', 'side_control'] }),
    roll(5, {
      partnerName: 'Chris', partnerBelt: 'brown',
      submissionsConceded: [sub('kimura', 'Kimura', 'half_guard'), sub('cross_collar', 'Cross collar choke', 'mount')],
      passesConceded: 2, positionsReached: ['half_guard'],
    }),
  ], ['bow_and_arrow', 'cross_collar', 'knee_slice'])),

  session('bjj-seed-3', 'Open mat', 'bjj', daysBefore(6, 11), 4800, mat('open_mat', false, 80, [
    roll(8, { partnerName: 'Reece', partnerBelt: 'blue', submissionsLanded: [sub('guillotine', 'Guillotine', 'front_headlock')], takedowns: 2, positionsReached: ['front_headlock'] }),
    roll(8, { partnerName: 'Sam', partnerBelt: 'purple', intensity: 'situational', sweeps: 1, sweepsConceded: 2, positionsReached: ['butterfly', 'half_guard'] }),
    roll(8, { partnerName: 'Mo', partnerBelt: 'blue', submissionsLanded: [sub('straight_ankle_lock', 'Straight ankle lock', 'single_leg_x')], positionsReached: ['single_leg_x'] }),
  ], ['single_leg_x', 'straight_ankle_lock'])),

  session('bjj-seed-4', 'No-gi', 'bjj', daysBefore(8, 19), 5400, mat('nogi', false, 90, [
    roll(6, { partnerName: 'Tom', partnerBelt: 'white', submissionsLanded: [sub('darce', "D'arce choke", 'side_control')], passes: 2, positionsReached: ['side_control'] }),
    roll(6, { partnerName: 'Chris', partnerBelt: 'brown', submissionsConceded: [sub('heel_hook_inside', 'Inside heel hook', 'fifty_fifty')], positionsReached: ['fifty_fifty'] }),
    roll(6, { partnerName: 'Reece', partnerBelt: 'blue', sweeps: 2, takedowns: 1, positionsReached: ['butterfly', 'mount'] }),
    roll(6, { partnerName: 'Danielle', partnerBelt: 'blue', submissionsLanded: [sub('triangle', 'Triangle choke', 'closed_guard')], positionsReached: ['closed_guard'] }),
  ], ['darce', 'anaconda'])),

  session('bjj-seed-5', 'Gi class', 'bjj', daysBefore(11, 19), 5400, mat('gi', true, 90, [
    roll(5, { partnerName: 'Mo', partnerBelt: 'blue', submissionsLanded: [sub('armbar', 'Armbar', 'closed_guard')], sweeps: 1, positionsReached: ['closed_guard'] }),
    roll(5, { partnerName: 'Sam', partnerBelt: 'purple', submissionsConceded: [sub('triangle', 'Triangle choke', 'closed_guard')], passesConceded: 1, positionsReached: ['inside_guard'] }),
    roll(5, { partnerName: 'Tom', partnerBelt: 'white', passes: 3, positionsReached: ['knee_on_belly', 'mount'] }),
  ], ['spider_guard', 'lasso_guard'])),

  session('bjj-seed-6', 'Drilling', 'bjj', daysBefore(14, 18), 3600, mat('drilling', false, 60, [], ['single_leg', 'arm_drag', 'body_lock'])),
];

// ── Rounds ──────────────────────────────────────────────────────────────────

let mmaRoundId = 0;
function mmaRound(minutes: number, range: MmaRound['range'], intensity: MmaRound['intensity'], overrides: Partial<MmaRound> = {}): MmaRound {
  mmaRoundId += 1;
  return {
    id: `round-seed-${mmaRoundId}`,
    index: mmaRoundId,
    minutes,
    range,
    intensity,
    takedownsFor: 0,
    takedownsAgainst: 0,
    submissionsFor: 0,
    submissionsAgainst: 0,
    knockdownsFor: 0,
    knockdownsAgainst: 0,
    ...overrides,
  };
}

function fight(sessionType: MmaLog['sessionType'], rounds: MmaRound[], techniquesDrilled: string[]): MmaLog {
  return { kind: 'mma', sessionType, rounds, restSeconds: 60, techniquesDrilled };
}

export const seedFightSessions: Workout[] = [
  session('mma-seed-1', 'Sparring', 'mma', daysBefore(2, 20), 4200, fight('sparring', [
    mmaRound(5, 'striking', 'hard', { partnerName: 'Kaz', knockdownsAgainst: 0 }),
    mmaRound(5, 'striking', 'hard', { partnerName: 'Kaz' }),
    mmaRound(5, 'clinch', 'medium', { partnerName: 'Elliot', takedownsFor: 1 }),
    mmaRound(5, 'ground', 'medium', { partnerName: 'Elliot', submissionsFor: 1, submissionsAgainst: 1 }),
    mmaRound(5, 'cage', 'hard', { partnerName: 'Kaz', takedownsAgainst: 2 }),
  ], ['jab', 'low_kick', 'cage_takedown'])),

  session('mma-seed-2', 'Pads', 'mma', daysBefore(4, 18), 3000, fight('pads', [
    mmaRound(3, 'striking', 'technical'),
    mmaRound(3, 'striking', 'technical'),
    mmaRound(3, 'striking', 'light'),
    mmaRound(3, 'striking', 'light'),
    mmaRound(3, 'clinch', 'light'),
    mmaRound(3, 'clinch', 'light'),
  ], ['jab', 'cross', 'lead_hook', 'body_kick', 'straight_knee'])),

  session('mma-seed-3', 'Wrestling', 'mma', daysBefore(5, 19), 3600, fight('wrestling', [
    mmaRound(4, 'wrestling', 'medium', { partnerName: 'Elliot', takedownsFor: 3, takedownsAgainst: 2 }),
    mmaRound(4, 'wrestling', 'medium', { partnerName: 'Elliot', takedownsFor: 2, takedownsAgainst: 3 }),
    mmaRound(4, 'wrestling', 'hard', { partnerName: 'Jay', takedownsFor: 1, takedownsAgainst: 4 }),
    mmaRound(4, 'cage', 'medium', { partnerName: 'Jay', takedownsFor: 2 }),
  ], ['double_leg', 'sprawl', 'wall_walk', 'body_lock_takedown'])),

  session('mma-seed-4', 'Grappling', 'mma', daysBefore(9, 19), 3600, fight('grappling', [
    mmaRound(6, 'ground', 'medium', { partnerName: 'Elliot', submissionsFor: 2 }),
    mmaRound(6, 'ground', 'medium', { partnerName: 'Sam', submissionsAgainst: 1 }),
    mmaRound(6, 'ground', 'light', { partnerName: 'Mo', submissionsFor: 1 }),
  ], ['back_take', 'guard_retention'])),

  session('mma-seed-5', 'Technical sparring', 'mma', daysBefore(12, 20), 3000, fight('technical_sparring', [
    mmaRound(5, 'striking', 'technical', { partnerName: 'Kaz' }),
    mmaRound(5, 'striking', 'technical', { partnerName: 'Kaz' }),
    mmaRound(5, 'clinch', 'technical', { partnerName: 'Jay' }),
    mmaRound(5, 'ground', 'technical', { partnerName: 'Elliot' }),
  ], ['teep', 'check_hook', 'pummelling'])),

  session('mma-seed-6', 'Bag work', 'mma', daysBefore(16, 7), 2400, fight('bag', [
    mmaRound(3, 'striking', 'light'),
    mmaRound(3, 'striking', 'light'),
    mmaRound(3, 'striking', 'medium'),
    mmaRound(3, 'striking', 'medium'),
    mmaRound(3, 'striking', 'light'),
  ], ['low_kick', 'overhand', 'spinning_back_kick'])),
];

// ── Race ────────────────────────────────────────────────────────────────────

function race(
  format: HyroxLog['format'],
  runs: number[],
  stations: number[],
  totalSeconds: number,
  extra: Partial<HyroxLog> = {},
): HyroxLog {
  return {
    kind: 'hyrox',
    format,
    division: 'open',
    category: 'mens',
    runs: runs.map((seconds, i) => ({ index: i + 1, metres: 1000, seconds })),
    stations: stations.map((seconds, i) => ({
      stationId: HYROX_STATIONS[i]!.id,
      seconds,
      reps: HYROX_STATIONS[i]!.measure === 'reps' ? HYROX_STATIONS[i]!.amount : undefined,
    })),
    totalSeconds,
    ...extra,
  };
}

export const seedRaceSessions: Workout[] = [
  // A real race. The runs fade, the sled push is the expensive one, and the
  // roxzone is what the clock has left over - which is how it goes.
  session('hyrox-seed-1', 'HYROX Birmingham', 'hyrox', daysBefore(21, 10), 5327, race(
    'race',
    [286, 291, 298, 305, 312, 318, 327, 341],
    [268, 214, 186, 341, 249, 176, 292, 388],
    5327,
    { eventName: 'HYROX Birmingham', eventDate: '2026-02-13' },
  )),

  session('hyrox-seed-2', 'Full simulation', 'hyrox', daysBefore(7, 8), 5498, race(
    'full_simulation',
    [292, 296, 303, 310, 318, 325, 336, 349],
    [272, 228, 194, 352, 254, 181, 301, 396],
    5498,
  )),

  session('hyrox-seed-3', 'Station work', 'hyrox', daysBefore(10, 18), 2700, {
    kind: 'hyrox',
    format: 'station_work',
    division: 'open',
    category: 'mens',
    runs: [],
    // Sled work and the carry only. Listing the untouched stations at zero
    // seconds would read as having done them instantly.
    stations: [
      { stationId: 'sled_push', seconds: 198 },
      { stationId: 'sled_pull', seconds: 172 },
      { stationId: 'farmers_carry', seconds: 168 },
    ],
    totalSeconds: 2700,
  }),

  session('hyrox-seed-4', 'Compromised running', 'hyrox', daysBefore(13, 7), 3600, {
    kind: 'hyrox',
    format: 'compromised_running',
    division: 'open',
    category: 'mens',
    runs: [284, 288, 294, 299].map((seconds, i) => ({ index: i + 1, metres: 1000, seconds })),
    stations: [{ stationId: 'sled_push', seconds: 205 }],
    totalSeconds: 3600,
  }),
];

/**
 * Everything trained, in date order.
 *
 * This is the list for anywhere that means "my training", as opposed to the
 * gym-only history the volume and progression maths runs on.
 */
export const seedDisciplineSessions: Workout[] = [
  ...seedMatSessions,
  ...seedFightSessions,
  ...seedRaceSessions,
];

export const seedAllSessions: Workout[] = [...seedWorkouts, ...seedDisciplineSessions].sort((a, b) =>
  (a.completedAt ?? '').localeCompare(b.completedAt ?? ''),
);
