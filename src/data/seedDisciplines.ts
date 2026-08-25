import type { BjjLog, BjjRound, BoxingLog, BoxingRound, MmaLog, MmaRound, StrongmanAttempt, StrongmanLog, Workout } from '@/types';
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

// ── Ring ────────────────────────────────────────────────────────────────────

let boxRoundId = 0;
function boxRound(
  minutes: number,
  intensity: BoxingRound['intensity'],
  overrides: Partial<BoxingRound> = {},
): BoxingRound {
  boxRoundId += 1;
  return {
    id: `box-seed-${boxRoundId}`,
    index: boxRoundId,
    minutes,
    intensity,
    punchesThrown: null,
    punchesLanded: null,
    bodyPunchesThrown: null,
    knockdownsFor: 0,
    knockdownsAgainst: 0,
    ...overrides,
  };
}

function ring(
  sessionType: BoxingLog['sessionType'],
  rounds: BoxingRound[],
  worked: string[],
  extra: Partial<BoxingLog> = {},
): BoxingLog {
  return { kind: 'boxing', sessionType, stance: 'orthodox', rounds, restSeconds: 60, worked, ...extra };
}

export const seedBoxingSessions: Workout[] = [
  // A counted spar. Output and accuracy only exist because somebody was on the
  // clicker; most of the sessions below leave them null, which is honest.
  session('box-seed-1', 'Sparring', 'boxing', daysBefore(3, 20), 3600, ring('sparring', [
    boxRound(3, 'hard', { partnerName: 'Ryan', punchesThrown: 58, punchesLanded: 21, bodyPunchesThrown: 9 }),
    boxRound(3, 'hard', { partnerName: 'Ryan', punchesThrown: 64, punchesLanded: 26, bodyPunchesThrown: 14 }),
    boxRound(3, 'hard', { partnerName: 'Ryan', punchesThrown: 51, punchesLanded: 19, bodyPunchesThrown: 8 }),
    boxRound(3, 'medium', { partnerName: 'Dec', punchesThrown: 47, punchesLanded: 20, bodyPunchesThrown: 12 }),
    boxRound(3, 'medium', { partnerName: 'Dec', punchesThrown: 44, punchesLanded: 17, bodyPunchesThrown: 10 }),
  ], ['one_two_three', 'three_body_three', 'slip', 'pivot'])),

  session('box-seed-2', 'Pads', 'boxing', daysBefore(5, 18), 2700, ring('pads', [
    boxRound(3, 'technical'),
    boxRound(3, 'technical'),
    boxRound(3, 'light'),
    boxRound(3, 'light'),
    boxRound(3, 'medium'),
    boxRound(3, 'medium'),
  ], ['one_two', 'one_one_two', 'one_six_three', 'check_hook'])),

  session('box-seed-3', 'Heavy bag', 'boxing', daysBefore(6, 7), 2400, ring('heavy_bag', [
    boxRound(3, 'medium', { punchesThrown: 96, bodyPunchesThrown: 18 }),
    boxRound(3, 'medium', { punchesThrown: 88, bodyPunchesThrown: 22 }),
    boxRound(3, 'medium', { punchesThrown: 91, bodyPunchesThrown: 14 }),
    boxRound(3, 'light', { punchesThrown: 74, bodyPunchesThrown: 26 }),
    boxRound(3, 'light', { punchesThrown: 70, bodyPunchesThrown: 20 }),
    boxRound(3, 'medium', { punchesThrown: 84, bodyPunchesThrown: 16 }),
    boxRound(3, 'medium', { punchesThrown: 79, bodyPunchesThrown: 21 }),
    boxRound(3, 'hard', { punchesThrown: 102, bodyPunchesThrown: 12 }),
  ], ['one_two_three_two', 'two_three_two', 'shovel_hook'])),

  session('box-seed-4', 'Body sparring', 'boxing', daysBefore(8, 20), 2400, ring('body_sparring', [
    boxRound(3, 'medium', { partnerName: 'Dec', punchesThrown: 62, punchesLanded: 29, bodyPunchesThrown: 51 }),
    boxRound(3, 'medium', { partnerName: 'Dec', punchesThrown: 58, punchesLanded: 25, bodyPunchesThrown: 47 }),
    boxRound(3, 'medium', { partnerName: 'Ryan', punchesThrown: 55, punchesLanded: 21, bodyPunchesThrown: 44 }),
    boxRound(3, 'light', { partnerName: 'Ryan', punchesThrown: 49, punchesLanded: 22, bodyPunchesThrown: 40 }),
  ], ['three_body_three', 'one_two_body', 'frame'])),

  session('box-seed-5', 'Technical sparring', 'boxing', daysBefore(10, 20), 2400, ring('technical_sparring', [
    boxRound(3, 'technical', { partnerName: 'Ryan' }),
    boxRound(3, 'technical', { partnerName: 'Ryan' }),
    boxRound(3, 'technical', { partnerName: 'Dec' }),
    boxRound(3, 'technical', { partnerName: 'Dec' }),
  ], ['slip', 'roll', 'shoulder_roll', 'angle_out'])),

  session('box-seed-6', 'Shadow and skipping', 'boxing', daysBefore(12, 7), 1800, ring('shadow', [
    boxRound(3, 'light'),
    boxRound(3, 'light'),
    boxRound(3, 'light'),
    boxRound(3, 'light'),
    boxRound(3, 'light'),
    boxRound(3, 'light'),
  ], ['step_drag', 'pivot', 'in_and_out', 'lateral'])),

  session('box-seed-7', 'Ring work', 'boxing', daysBefore(15, 19), 2700, ring('ring_work', [
    boxRound(3, 'medium', { partnerName: 'Dec' }),
    boxRound(3, 'medium', { partnerName: 'Dec' }),
    boxRound(3, 'medium', { partnerName: 'Ryan' }),
    boxRound(3, 'light', { partnerName: 'Ryan' }),
    boxRound(3, 'light', { partnerName: 'Dec' }),
  ], ['cut_the_ring', 'off_the_ropes', 'angle_out'])),
];

// ── Events ──────────────────────────────────────────────────────────────────

let attemptId = 0;
function attempt(
  eventId: string,
  eventName: string,
  style: StrongmanAttempt['style'],
  fields: Partial<StrongmanAttempt> = {},
): StrongmanAttempt {
  attemptId += 1;
  return {
    id: `attempt-seed-${attemptId}`,
    eventId,
    eventName,
    style,
    loadKg: null,
    reps: null,
    distanceMetres: null,
    seconds: null,
    successful: true,
    ...fields,
  };
}

function events(
  sessionType: StrongmanLog['sessionType'],
  attempts: StrongmanAttempt[],
  extra: Partial<StrongmanLog> = {},
): StrongmanLog {
  return { kind: 'strongman', sessionType, attempts, ...extra };
}

export const seedEventSessions: Workout[] = [
  // A working openers-to-third-attempt log press day. The 150 misses, which is
  // the point: it has been missing for a month and the log should show that.
  session('sm-seed-1', 'Log press', 'strongman', daysBefore(2, 18), 4200, events('max_effort', [
    attempt('log_press', 'Log press', 'max_load', { loadKg: 110 }),
    attempt('log_press', 'Log press', 'max_load', { loadKg: 130 }),
    attempt('log_press', 'Log press', 'max_load', { loadKg: 142 }),
    attempt('log_press', 'Log press', 'max_load', { loadKg: 150, successful: false, notes: 'Off the chest, died at the lockout.' }),
    attempt('axle_deadlift', 'Axle deadlift', 'reps_in_time', { loadKg: 180, reps: 8, seconds: 60 }),
  ])),

  session('sm-seed-2', 'Moving medley', 'strongman', daysBefore(5, 18), 4800, events('event_day', [
    attempt('yoke_walk', 'Yoke walk', 'time_for_distance', { loadKg: 300, distanceMetres: 20, seconds: 10.8 }),
    attempt('yoke_walk', 'Yoke walk', 'time_for_distance', { loadKg: 320, distanceMetres: 20, seconds: 12.1 }),
    attempt('farmers_walk', 'Farmers walk', 'time_for_distance', { loadKg: 100, distanceMetres: 20, seconds: 8.4 }),
    attempt('farmers_walk', 'Farmers walk', 'time_for_distance', { loadKg: 110, distanceMetres: 20, seconds: 9.6 }),
    attempt('sandbag_carry', 'Sandbag carry', 'time_for_distance', { loadKg: 90, distanceMetres: 20, seconds: 11.2 }),
    attempt('moving_medley', 'Moving medley', 'medley', { distanceMetres: 60, seconds: 48.6 }),
  ])),

  session('sm-seed-3', 'Stones', 'strongman', daysBefore(9, 18), 4200, events('event_day', [
    attempt('atlas_stones', 'Atlas stones', 'time_for_reps', { loadKg: 120, reps: 5, seconds: 41.2 }),
    attempt('atlas_stones', 'Atlas stones', 'max_load', { loadKg: 140 }),
    attempt('atlas_stones', 'Atlas stones', 'max_load', { loadKg: 150, successful: false, notes: 'Lapped it, could not extend.' }),
    attempt('stone_to_shoulder', 'Stone to shoulder', 'reps_in_time', { loadKg: 100, reps: 6, seconds: 60 }),
  ])),

  session('sm-seed-4', 'Grip and holds', 'strongman', daysBefore(12, 18), 3000, events('accessory', [
    attempt('hercules_hold', 'Hercules hold', 'hold_time', { loadKg: 80, seconds: 38 }),
    attempt('hercules_hold', 'Hercules hold', 'hold_time', { loadKg: 80, seconds: 44 }),
    attempt('crucifix_hold', 'Crucifix hold', 'hold_time', { loadKg: 15, seconds: 52 }),
  ])),

  session('sm-seed-5', 'Deadlift', 'strongman', daysBefore(16, 18), 4200, events('max_effort', [
    attempt('deadlift_max', 'Deadlift', 'max_load', { loadKg: 220 }),
    attempt('deadlift_max', 'Deadlift', 'max_load', { loadKg: 250 }),
    attempt('deadlift_max', 'Deadlift', 'max_load', { loadKg: 265 }),
    attempt('silver_dollar', 'Silver dollar deadlift', 'reps_in_time', { loadKg: 250, reps: 11, seconds: 60 }),
  ])),

  session('sm-seed-6', 'Northants Strongest', 'strongman', daysBefore(24, 11), 10800, events('competition', [
    attempt('log_press', 'Log press', 'reps_in_time', { loadKg: 100, reps: 7, seconds: 60 }),
    attempt('truck_pull', 'Truck pull', 'time_for_distance', { distanceMetres: 20, seconds: 24.8 }),
    attempt('farmers_walk', 'Farmers walk', 'distance_in_time', { loadKg: 110, distanceMetres: 42, seconds: 60 }),
    attempt('tyre_flip', 'Tyre flip', 'time_for_reps', { loadKg: 220, reps: 6, seconds: 38.4 }),
    attempt('atlas_stones', 'Atlas stones', 'time_for_reps', { loadKg: 130, reps: 5, seconds: 44.9 }),
  ], { competitionName: 'Northants Strongest', weightClass: 'u105' })),
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
  ...seedBoxingSessions,
  ...seedEventSessions,
];

export const seedAllSessions: Workout[] = [...seedWorkouts, ...seedDisciplineSessions].sort((a, b) =>
  (a.completedAt ?? '').localeCompare(b.completedAt ?? ''),
);
