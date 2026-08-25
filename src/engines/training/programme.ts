import type { Discipline, Equipment, Exercise, MuscleGroup, Uuid } from '@/types';
import { EXERCISES } from '@/data/exercises';
import {
  COACHING_VERSION, type Experience, type Goal, PRIMARY_MUSCLES, REP_RANGES,
  REST_SECONDS, SETS_PER_EXERCISE, TARGET_RIR, WEEKLY_SETS,
} from '@/data/programmes/coaching';
import {
  DISCIPLINE_WEEKS, REST_DAY_LAYOUT, SLOTS, SPLITS, type SlotId, WEEKDAYS,
} from '@/data/programmes/splits';

/**
 * Programme generator.
 *
 * Deterministic, like everything else that produces a number in this app: the
 * same inputs give the same week, every time, on every device. That is not
 * fussiness. A plan that quietly reshuffles itself between openings is a plan
 * nobody can follow, and one that cannot be reproduced cannot be explained
 * either — and being able to say *why* an exercise is in your Wednesday is the
 * difference between a programme and a list.
 *
 * There is no randomness anywhere below. Where a choice has to be made between
 * equally good exercises, it is made by a stated rule.
 */

export type ProgrammeExercise = {
  exerciseId: Uuid;
  exerciseName: string;
  muscle: MuscleGroup;
  role: 'compound' | 'isolation';
  sets: number;
  repsLow: number;
  repsHigh: number;
  restSeconds: number;
  targetRir: number;
};

export type ProgrammeDay = {
  /** 0 = Monday. */
  dayIndex: number;
  weekday: string;
  slotId: SlotId | null;
  name: string;
  /** Empty on a rest day, which is a day in the plan rather than a gap in it. */
  exercises: ProgrammeExercise[];
};

export type Programme = {
  splitId: string;
  splitName: string;
  daysPerWeek: number;
  goal: Goal;
  experience: Experience;
  days: ProgrammeDay[];
  /** Hard sets landing on each muscle across the week, for checking the plan. */
  weeklySets: Partial<Record<MuscleGroup, number>>;
  note: string;
  version: number;
};

export type ProgrammeInput = {
  daysPerWeek: number;
  experience: Experience;
  goal: Goal;
  /** What the gym actually has. An empty list means everything is available. */
  equipment?: Equipment[];
};

/** Past this a session stops being a session and becomes an afternoon. */
export const MAX_MOVEMENTS_PER_SESSION = 8;

const COMPOUND_PATTERNS = new Set(['horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull', 'squat', 'hinge', 'lunge']);

function isCompound(exercise: Exercise): boolean {
  return COMPOUND_PATTERNS.has(exercise.pattern);
}

/**
 * Candidate exercises for a muscle, best first.
 *
 * The ordering rule is the whole selection algorithm, and it is deliberately
 * boring: compounds before isolation, then free weights before machines, then
 * alphabetically so the result is stable. Free weights first is not snobbery —
 * they are the ones with the longest progression runway, and a machine is a
 * better substitute than it is a starting point.
 */
function candidatesFor(muscle: MuscleGroup, equipment: Equipment[]): Exercise[] {
  const equipmentRank: Record<string, number> = {
    barbell: 0, dumbbell: 1, trap_bar: 1, ez_bar: 1, bodyweight: 2,
    cable: 3, smith: 4, machine: 5,
  };

  return EXERCISES.filter((exercise) => {
    if (!exercise.active) return false;
    if (exercise.primaryMuscle !== muscle) return false;
    if (exercise.metric !== 'weight_reps' && exercise.metric !== 'reps' && exercise.metric !== 'weighted_reps') return false;
    if (equipment.length > 0 && !equipment.includes(exercise.equipment)) return false;
    return true;
  }).sort((a, b) => {
    const compound = Number(isCompound(b)) - Number(isCompound(a));
    if (compound !== 0) return compound;
    const rank = (equipmentRank[a.equipment] ?? 9) - (equipmentRank[b.equipment] ?? 9);
    if (rank !== 0) return rank;
    return a.name.localeCompare(b.name);
  });
}

/**
 * How many exercises a muscle gets in one session.
 *
 * Derived from the weekly set target rather than picked: the target is divided
 * by the two sessions a week the split guarantees, then by the sets each
 * exercise contributes. Capped at three, because a fourth movement for one
 * muscle in a session is nearly always volume the previous three should have
 * carried.
 */
export function exerciseCountFor(
  muscle: MuscleGroup,
  experience: Experience,
  goal: Goal,
  sessionsForMuscle: number,
): number {
  if (!PRIMARY_MUSCLES.includes(muscle)) return 1;

  const weeklyTarget = WEEKLY_SETS[experience];
  const perSession = weeklyTarget / Math.max(1, sessionsForMuscle);
  const setsPer = SETS_PER_EXERCISE[goal].compound;

  return Math.max(1, Math.min(3, Math.round(perSession / setsPer)));
}

/** How many times a muscle appears across the week's pattern. */
function sessionsPerMuscle(pattern: SlotId[]): Map<MuscleGroup, number> {
  const counts = new Map<MuscleGroup, number>();
  for (const slotId of pattern) {
    for (const muscle of SLOTS[slotId].muscles) {
      counts.set(muscle, (counts.get(muscle) ?? 0) + 1);
    }
  }
  return counts;
}

function buildSession(
  slotId: SlotId,
  input: ProgrammeInput,
  perMuscle: Map<MuscleGroup, number>,
  used: Map<MuscleGroup, number>,
): ProgrammeExercise[] {
  const { experience, goal } = input;
  const equipment = input.equipment ?? [];
  const slot = SLOTS[slotId];
  const compounds: ProgrammeExercise[] = [];
  const isolations: ProgrammeExercise[] = [];

  for (const muscle of slot.muscles) {
    const candidates = candidatesFor(muscle, equipment);
    if (candidates.length === 0) continue;

    const count = exerciseCountFor(muscle, experience, goal, perMuscle.get(muscle) ?? 1);

    // Rotate through the candidate list across the week rather than restarting
    // it, so the second chest day is not a carbon copy of the first. Stable,
    // because the offset comes from how many have already been spent.
    const offset = used.get(muscle) ?? 0;
    used.set(muscle, offset + count);

    // One heavy movement per muscle, then accessories — not three variations of
    // the same lift. Nobody writes back squat, front squat and hack squat into
    // one session: after the first, the second is a worse version of a thing
    // you have already done tired.
    const heavy = candidates.filter(isCompound);
    const accessories = candidates.filter((e) => !isCompound(e));
    const picks: Exercise[] = [];

    if (heavy.length > 0) picks.push(heavy[offset % heavy.length]!);
    for (let i = 0; picks.length < count; i += 1) {
      const pool = accessories.length > 0 ? accessories : heavy;
      if (pool.length === 0) break;
      const next = pool[(offset + i) % pool.length]!;
      if (!picks.some((p) => p.id === next.id)) picks.push(next);
      else if (i > pool.length) break;
    }

    for (const exercise of picks) {
      const role = isCompound(exercise) ? 'compound' : 'isolation';
      const [repsLow, repsHigh] = REP_RANGES[goal][role];

      const row: ProgrammeExercise = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscle,
        role,
        sets: SETS_PER_EXERCISE[goal][role],
        repsLow,
        repsHigh,
        restSeconds: REST_SECONDS[goal][role],
        targetRir: TARGET_RIR[experience],
      };

      (role === 'compound' ? compounds : isolations).push(row);
    }
  }

  // Compounds first, while you are fresh and coordinated. A bad rep costs less
  // on a cable than it does under a bar.
  //
  // Then a ceiling. An upper day owns five muscles, and left alone that
  // arithmetic produces a ten-movement session nobody finishes — so the tail is
  // trimmed, and it is trimmed off the accessories, because the heavy work is
  // the part the session exists for.
  const trimmed = [...compounds, ...isolations].slice(0, MAX_MOVEMENTS_PER_SESSION);
  return trimmed;
}

export function generateProgramme(input: ProgrammeInput): Programme {
  const days = Math.max(2, Math.min(6, Math.round(input.daysPerWeek)));
  const split = SPLITS[days]!;
  const restDays = new Set(REST_DAY_LAYOUT[days] ?? []);
  const perMuscle = sessionsPerMuscle(split.pattern);
  const used = new Map<MuscleGroup, number>();

  const programmeDays: ProgrammeDay[] = [];
  let trainingDayIndex = 0;

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    if (restDays.has(dayIndex)) {
      programmeDays.push({
        dayIndex,
        weekday: WEEKDAYS[dayIndex]!,
        slotId: null,
        name: 'Rest',
        exercises: [],
      });
      continue;
    }

    const slotId = split.pattern[trainingDayIndex];
    trainingDayIndex += 1;
    if (!slotId) {
      programmeDays.push({ dayIndex, weekday: WEEKDAYS[dayIndex]!, slotId: null, name: 'Rest', exercises: [] });
      continue;
    }

    programmeDays.push({
      dayIndex,
      weekday: WEEKDAYS[dayIndex]!,
      slotId,
      name: SLOTS[slotId].name,
      exercises: buildSession(slotId, { ...input, daysPerWeek: days }, perMuscle, used),
    });
  }

  const weeklySets: Partial<Record<MuscleGroup, number>> = {};
  for (const day of programmeDays) {
    for (const exercise of day.exercises) {
      weeklySets[exercise.muscle] = (weeklySets[exercise.muscle] ?? 0) + exercise.sets;
    }
  }

  return {
    splitId: split.id,
    splitName: split.name,
    daysPerWeek: days,
    goal: input.goal,
    experience: input.experience,
    days: programmeDays,
    weeklySets,
    note: split.note,
    version: COACHING_VERSION,
  };
}

// ── Fight and event weeks ───────────────────────────────────────────────────

export type DisciplineDay = {
  dayIndex: number;
  weekday: string;
  name: string | null;
  focus: string | null;
  minutes: number;
  hard: boolean;
};

export type DisciplineWeek = {
  discipline: Discipline;
  daysPerWeek: number;
  days: DisciplineDay[];
  totalMinutes: number;
  hardDays: number;
  version: number;
};

/**
 * A week for one of the fight or event disciplines.
 *
 * The sessions come from the template; the *placement* is the work this does.
 * Hard days are pushed apart before anything else is scheduled, because two
 * hard days back to back is the thing that ends camps — and once they are
 * spaced, the rest fills in around them.
 */
export function generateDisciplineWeek(
  discipline: Exclude<Discipline, 'gym'>,
  daysPerWeek: number,
): DisciplineWeek {
  const days = Math.max(3, Math.min(5, Math.round(daysPerWeek)));
  const template = DISCIPLINE_WEEKS[discipline][days] ?? DISCIPLINE_WEEKS[discipline][3]!;
  const restDays = new Set(REST_DAY_LAYOUT[days] ?? []);

  const trainingSlots: number[] = [];
  for (let i = 0; i < 7; i += 1) if (!restDays.has(i)) trainingSlots.push(i);

  // Hard sessions first, spread as far apart as the training days allow. With
  // two hard days and four training days that is first and last, not first and
  // second.
  const hard = template.filter((s) => s.hard);
  const easy = template.filter((s) => !s.hard);
  const placement = new Map<number, (typeof template)[number]>();

  if (hard.length > 0) {
    const stride = hard.length === 1 ? 0 : (trainingSlots.length - 1) / (hard.length - 1);
    hard.forEach((session, i) => {
      const slot = trainingSlots[Math.round(i * stride)]!;
      placement.set(slot, session);
    });
  }

  let easyIndex = 0;
  for (const slot of trainingSlots) {
    if (placement.has(slot)) continue;
    const session = easy[easyIndex];
    easyIndex += 1;
    if (session) placement.set(slot, session);
  }

  const weekDays: DisciplineDay[] = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const session = placement.get(dayIndex);
    weekDays.push({
      dayIndex,
      weekday: WEEKDAYS[dayIndex]!,
      name: session?.name ?? null,
      focus: session?.focus ?? null,
      minutes: session?.minutes ?? 0,
      hard: session?.hard ?? false,
    });
  }

  return {
    discipline,
    daysPerWeek: days,
    days: weekDays,
    totalMinutes: weekDays.reduce((sum, d) => sum + d.minutes, 0),
    hardDays: weekDays.filter((d) => d.hard).length,
    version: COACHING_VERSION,
  };
}

/** The longest run of consecutive training days, for sanity-checking a week. */
export function longestTrainingRun(days: Array<{ exercises?: unknown[]; name: string | null }>): number {
  let longest = 0;
  let run = 0;
  for (const day of days) {
    const training = day.name !== null && day.name !== 'Rest';
    run = training ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return longest;
}
