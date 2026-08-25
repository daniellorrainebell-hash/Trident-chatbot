import type { Discipline, MuscleGroup } from '@/types';

/**
 * Splits, and the weekly patterns they run at.
 *
 * A split is a way of dividing the body so that every muscle gets trained twice
 * a week without any session running to two hours. That second visit is the
 * whole point — the same weekly volume split over two sessions beats one, and
 * every pattern below is built to deliver it.
 *
 * Which split you get is decided by how many days you can actually train, not
 * the other way round. Push-pull-legs on three days a week is a famous mistake:
 * it hits each muscle once, which is the thing the split exists to avoid.
 */

export type SlotId = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full' | 'arms' | 'chest_back';

export type SlotDefinition = {
  id: SlotId;
  name: string;
  /** Muscles this session owns, in the order they should be trained. */
  muscles: MuscleGroup[];
  description: string;
};

export const SLOTS: Record<SlotId, SlotDefinition> = {
  push: {
    id: 'push',
    name: 'Push',
    muscles: ['chest', 'shoulders', 'triceps'],
    description: 'Chest, shoulders and triceps — everything that presses away from you.',
  },
  pull: {
    id: 'pull',
    name: 'Pull',
    muscles: ['back', 'biceps'],
    description: 'Lats, back and biceps — everything that pulls towards you.',
  },
  legs: {
    id: 'legs',
    name: 'Legs',
    muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
    description: 'Quads, hamstrings, glutes and calves.',
  },
  upper: {
    id: 'upper',
    name: 'Upper',
    muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    description: 'The whole upper body in one session.',
  },
  lower: {
    id: 'lower',
    name: 'Lower',
    muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
    description: 'The whole lower body in one session.',
  },
  full: {
    id: 'full',
    name: 'Full body',
    // Glutes are named rather than left to fall out of the squat. They would
    // get worked either way, but a slot that does not own a muscle cannot be
    // held to the twice-a-week guarantee, and a guarantee with a silent
    // exception in it is not one.
    muscles: ['quads', 'chest', 'back', 'shoulders', 'hamstrings', 'glutes', 'biceps', 'triceps'],
    description: 'One compound per pattern, everything in a session.',
  },
  arms: {
    id: 'arms',
    name: 'Arms',
    muscles: ['biceps', 'triceps', 'shoulders'],
    description: 'Biceps, triceps and side delts.',
  },
  chest_back: {
    id: 'chest_back',
    name: 'Chest and back',
    muscles: ['chest', 'back'],
    description: 'Pressing and pulling paired in the same session.',
  },
};

export type SplitDefinition = {
  id: string;
  name: string;
  /** The slot for each training day, in order. Length sets the days per week. */
  pattern: SlotId[];
  note: string;
};

/**
 * One split per number of training days.
 *
 * The mapping is the opinionated part. Three days is full body, not
 * push-pull-legs, because at three days PPL hits everything once. Five days is
 * push-pull-legs plus an upper and a lower, which is how you get a sixth and
 * seventh exposure without a sixth session.
 */
export const SPLITS: Record<number, SplitDefinition> = {
  2: {
    id: 'full_body_2',
    name: 'Full body, twice',
    pattern: ['full', 'full'],
    note: 'Two sessions is enough to make progress if both are hard and neither is skipped.',
  },
  3: {
    id: 'full_body_3',
    name: 'Full body',
    pattern: ['full', 'full', 'full'],
    note: 'Three days is full body, not push-pull-legs. PPL on three days trains everything once a week, which is the thing a split exists to avoid.',
  },
  4: {
    id: 'upper_lower',
    name: 'Upper / lower',
    pattern: ['upper', 'lower', 'upper', 'lower'],
    note: 'The most reliable four-day structure there is. Everything twice, nothing rushed.',
  },
  5: {
    id: 'ppl_upper_lower',
    name: 'Push / pull / legs + upper / lower',
    pattern: ['push', 'pull', 'legs', 'upper', 'lower'],
    note: 'Five days with two rest days. The upper and lower at the end top every muscle up to a second exposure.',
  },
  6: {
    id: 'ppl_x2',
    name: 'Push / pull / legs, twice',
    pattern: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
    note: 'Six days, each muscle twice, each session short. Only worth it if sleep and food are already handled.',
  },
};

/**
 * Where the rest days fall.
 *
 * Spread rather than stacked. Training five days does not mean Monday to Friday
 * — three days on, one off, two on, one off keeps every session fresher than a
 * five-day block followed by a lost weekend.
 *
 * Index 0 is Monday.
 */
export const REST_DAY_LAYOUT: Record<number, number[]> = {
  2: [1, 2, 4, 5, 6],
  3: [1, 3, 5, 6],
  4: [2, 5, 6],
  5: [3, 6],
  6: [6],
};

// ── Fight and event weeks ───────────────────────────────────────────────────

export type DisciplineSession = {
  name: string;
  focus: string;
  /** Roughly how long, in minutes, so a week can be costed against a real diary. */
  minutes: number;
  /** True where somebody is hitting back or the load is maximal. */
  hard: boolean;
};

/**
 * Weekly templates for the other four disciplines.
 *
 * These are not sets and reps, because none of these sports are measured that
 * way. What they need instead is a shape: how many hard days, how far apart,
 * and what fills the space between them.
 *
 * The rule running through all four is that hard days are spaced. Two hard
 * sparring days back to back is how people get hurt and how camps fall apart,
 * so the templates put skill and conditioning work between them by design.
 */
export const DISCIPLINE_WEEKS: Record<Exclude<Discipline, 'gym'>, Record<number, DisciplineSession[]>> = {
  bjj: {
    3: [
      { name: 'Gi class', focus: 'Technique and positional rounds', minutes: 90, hard: false },
      { name: 'No-gi class', focus: 'Technique and live rounds', minutes: 90, hard: true },
      { name: 'Open mat', focus: 'Rolling, your own game', minutes: 90, hard: true },
    ],
    4: [
      { name: 'Gi class', focus: 'Technique and positional rounds', minutes: 90, hard: false },
      { name: 'No-gi class', focus: 'Live rounds', minutes: 90, hard: true },
      { name: 'Drilling', focus: 'Reps on two positions, no resistance', minutes: 60, hard: false },
      { name: 'Open mat', focus: 'Rolling, your own game', minutes: 90, hard: true },
    ],
    5: [
      { name: 'Gi class', focus: 'Technique and positional rounds', minutes: 90, hard: false },
      { name: 'No-gi class', focus: 'Live rounds', minutes: 90, hard: true },
      { name: 'Drilling', focus: 'Reps on two positions, no resistance', minutes: 60, hard: false },
      { name: 'Competition class', focus: 'Hard rounds to the clock', minutes: 90, hard: true },
      { name: 'Open mat', focus: 'Rolling, your own game', minutes: 90, hard: false },
    ],
  },
  boxing: {
    3: [
      { name: 'Pads', focus: 'Combinations and timing', minutes: 60, hard: false },
      { name: 'Bag and conditioning', focus: 'Output and work rate', minutes: 45, hard: false },
      { name: 'Sparring', focus: 'Live rounds', minutes: 60, hard: true },
    ],
    4: [
      { name: 'Pads', focus: 'Combinations and timing', minutes: 60, hard: false },
      { name: 'Technical sparring', focus: 'Movement and defence, light contact', minutes: 60, hard: false },
      { name: 'Bag and conditioning', focus: 'Output and work rate', minutes: 45, hard: false },
      { name: 'Sparring', focus: 'Live rounds', minutes: 60, hard: true },
    ],
    5: [
      { name: 'Pads', focus: 'Combinations and timing', minutes: 60, hard: false },
      { name: 'Sparring', focus: 'Live rounds', minutes: 60, hard: true },
      { name: 'Bag and conditioning', focus: 'Output and work rate', minutes: 45, hard: false },
      { name: 'Technical sparring', focus: 'Movement and defence, light contact', minutes: 60, hard: false },
      { name: 'Roadwork and shadow', focus: 'Engine and footwork', minutes: 45, hard: false },
    ],
  },
  mma: {
    3: [
      { name: 'Striking', focus: 'Pads and drilling', minutes: 90, hard: false },
      { name: 'Wrestling', focus: 'Takedowns and defence', minutes: 90, hard: false },
      { name: 'Sparring', focus: 'Live rounds, mixed ranges', minutes: 90, hard: true },
    ],
    4: [
      { name: 'Striking', focus: 'Pads and drilling', minutes: 90, hard: false },
      { name: 'Wrestling', focus: 'Takedowns and defence', minutes: 90, hard: false },
      { name: 'Grappling', focus: 'Submissions and positional rounds', minutes: 90, hard: false },
      { name: 'Sparring', focus: 'Live rounds, mixed ranges', minutes: 90, hard: true },
    ],
    5: [
      { name: 'Striking', focus: 'Pads and drilling', minutes: 90, hard: false },
      { name: 'Wrestling', focus: 'Takedowns and defence', minutes: 90, hard: false },
      { name: 'Sparring', focus: 'Live rounds, mixed ranges', minutes: 90, hard: true },
      { name: 'Grappling', focus: 'Submissions and positional rounds', minutes: 90, hard: false },
      { name: 'Strength and conditioning', focus: 'Power and engine', minutes: 60, hard: false },
    ],
  },
  strongman: {
    3: [
      { name: 'Press day', focus: 'Log or axle, then pressing accessories', minutes: 90, hard: true },
      { name: 'Pull day', focus: 'Deadlift variant, then back and grip', minutes: 90, hard: true },
      { name: 'Event day', focus: 'Carries and loading, medley finish', minutes: 90, hard: true },
    ],
    4: [
      { name: 'Press day', focus: 'Log or axle, then pressing accessories', minutes: 90, hard: true },
      { name: 'Pull day', focus: 'Deadlift variant, then back and grip', minutes: 90, hard: true },
      { name: 'Squat and accessory', focus: 'Legs and trunk, moderate load', minutes: 75, hard: false },
      { name: 'Event day', focus: 'Carries and loading, medley finish', minutes: 90, hard: true },
    ],
    5: [
      { name: 'Press day', focus: 'Log or axle, then pressing accessories', minutes: 90, hard: true },
      { name: 'Pull day', focus: 'Deadlift variant, then back and grip', minutes: 90, hard: true },
      { name: 'Squat and accessory', focus: 'Legs and trunk, moderate load', minutes: 75, hard: false },
      { name: 'Event day', focus: 'Carries and loading, medley finish', minutes: 90, hard: true },
      { name: 'Conditioning and grip', focus: 'Sled, holds, trunk', minutes: 45, hard: false },
    ],
  },
};

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
