import {
  generateProgramme, generateDisciplineWeek, exerciseCountFor, longestTrainingRun,
  MAX_MOVEMENTS_PER_SESSION,
} from './programme';
import { PRIMARY_MUSCLES, WEEKLY_SETS } from '@/data/programmes/coaching';
import { SLOTS, SPLITS } from '@/data/programmes/splits';
import { EXERCISES } from '@/data/exercises';

const base = { daysPerWeek: 5, experience: 'intermediate' as const, goal: 'hypertrophy' as const };

describe('generated week', () => {
  it('always returns seven days, rest days included', () => {
    // A rest day is a day in the plan, not a gap in it.
    for (const days of [2, 3, 4, 5, 6]) {
      const programme = generateProgramme({ ...base, daysPerWeek: days });
      expect(programme.days).toHaveLength(7);
      expect(programme.days.filter((d) => d.slotId === null)).toHaveLength(7 - days);
    }
  });

  it('gives five training days two rest days', () => {
    const programme = generateProgramme(base);
    expect(programme.days.filter((d) => d.slotId !== null)).toHaveLength(5);
    expect(programme.days.filter((d) => d.slotId === null)).toHaveLength(2);
  });

  it('spreads the rest days rather than stacking them at the weekend', () => {
    // Monday to Friday on, weekend off, is a worse week than three on, one off,
    // two on, one off — every session after Wednesday is run on fumes.
    const programme = generateProgramme(base);
    expect(longestTrainingRun(programme.days)).toBeLessThanOrEqual(3);
  });

  it('is deterministic', () => {
    const a = generateProgramme(base);
    const b = generateProgramme(base);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('puts three days on full body rather than push-pull-legs', () => {
    // PPL across three days trains everything once a week, which is the thing
    // a split exists to avoid.
    const programme = generateProgramme({ ...base, daysPerWeek: 3 });
    expect(programme.splitId).toBe('full_body_3');
    expect(programme.days.filter((d) => d.slotId === 'full')).toHaveLength(3);
  });

  it('hits every primary muscle at least twice a week', () => {
    for (const days of [3, 4, 5, 6]) {
      const split = SPLITS[days]!;
      const counts = new Map<string, number>();
      for (const slot of split.pattern) {
        for (const muscle of SLOTS[slot].muscles) {
          counts.set(muscle, (counts.get(muscle) ?? 0) + 1);
        }
      }
      for (const muscle of PRIMARY_MUSCLES) {
        expect(counts.get(muscle) ?? 0).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('session construction', () => {
  it('orders compounds before isolation in every session', () => {
    const programme = generateProgramme(base);

    for (const day of programme.days) {
      const roles = day.exercises.map((e) => e.role);
      const firstIsolation = roles.indexOf('isolation');
      if (firstIsolation === -1) continue;
      // Nothing compound may appear after the first isolation movement.
      expect(roles.slice(firstIsolation)).not.toContain('compound');
    }
  });

  it('does not repeat an exercise within a session', () => {
    const programme = generateProgramme(base);
    for (const day of programme.days) {
      const ids = day.exercises.map((e) => e.exerciseId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('varies the second session for a muscle rather than repeating the first', () => {
    const programme = generateProgramme({ ...base, daysPerWeek: 6 });
    const pushDays = programme.days.filter((d) => d.slotId === 'push');
    expect(pushDays).toHaveLength(2);

    const first = pushDays[0]!.exercises.map((e) => e.exerciseId);
    const second = pushDays[1]!.exercises.map((e) => e.exerciseId);
    expect(second).not.toEqual(first);
  });

  it('never writes two heavy movements for the same muscle in one session', () => {
    // Back squat then front squat is not two exercises, it is one exercise done
    // twice, the second time tired.
    for (const days of [3, 4, 5, 6]) {
      const programme = generateProgramme({ ...base, daysPerWeek: days });
      for (const day of programme.days) {
        const compoundsByMuscle = new Map<string, number>();
        for (const exercise of day.exercises) {
          if (exercise.role !== 'compound') continue;
          compoundsByMuscle.set(exercise.muscle, (compoundsByMuscle.get(exercise.muscle) ?? 0) + 1);
        }
        for (const count of compoundsByMuscle.values()) {
          expect(count).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('caps a session before it becomes an afternoon', () => {
    // An upper day owns five muscles; left to the arithmetic it produces ten
    // movements and nobody finishes it.
    for (const days of [3, 4, 5, 6]) {
      const programme = generateProgramme({ ...base, daysPerWeek: days });
      for (const day of programme.days) {
        expect(day.exercises.length).toBeLessThanOrEqual(MAX_MOVEMENTS_PER_SESSION);
      }
    }
  });

  it('trims accessories rather than the heavy work when it caps', () => {
    const programme = generateProgramme({ ...base, daysPerWeek: 5, experience: 'advanced' });
    const upper = programme.days.find((d) => d.slotId === 'upper')!;

    // Every muscle the day owns should still have its one heavy movement.
    const compoundMuscles = new Set(
      upper.exercises.filter((e) => e.role === 'compound').map((e) => e.muscle),
    );
    expect(compoundMuscles.size).toBeGreaterThanOrEqual(3);
  });

  it('lands weekly volume for the primary muscles inside the working range', () => {
    const programme = generateProgramme(base);

    for (const muscle of PRIMARY_MUSCLES) {
      const sets = programme.weeklySets[muscle] ?? 0;
      // Roughly 10-20 hard sets a week is the range the evidence supports. The
      // generator does not have to hit a number, but it must not land outside.
      expect(sets).toBeGreaterThanOrEqual(6);
      expect(sets).toBeLessThanOrEqual(24);
    }
  });

  it('gives a beginner less volume than an advanced lifter', () => {
    const beginner = generateProgramme({ ...base, experience: 'beginner' });
    const advanced = generateProgramme({ ...base, experience: 'advanced' });

    const total = (p: typeof beginner) =>
      Object.values(p.weeklySets).reduce<number>((sum, n) => sum + (n ?? 0), 0);

    expect(total(beginner)).toBeLessThan(total(advanced));
    expect(WEEKLY_SETS.beginner).toBeLessThan(WEEKLY_SETS.advanced);
  });

  it('uses heavier rep ranges and longer rests for strength than for size', () => {
    const strength = generateProgramme({ ...base, goal: 'strength' });
    const size = generateProgramme({ ...base, goal: 'hypertrophy' });

    const firstCompound = (p: typeof strength) =>
      p.days.flatMap((d) => d.exercises).find((e) => e.role === 'compound')!;

    expect(firstCompound(strength).repsHigh).toBeLessThan(firstCompound(size).repsHigh);
    expect(firstCompound(strength).restSeconds).toBeGreaterThan(firstCompound(size).restSeconds);
  });

  it('leaves more reps in reserve for a beginner', () => {
    const beginner = generateProgramme({ ...base, experience: 'beginner' });
    const advanced = generateProgramme({ ...base, experience: 'advanced' });
    const rir = (p: typeof beginner) => p.days.flatMap((d) => d.exercises)[0]!.targetRir;

    expect(rir(beginner)).toBeGreaterThan(rir(advanced));
  });

  it('builds a week from machines alone when that is all the gym has', () => {
    const programme = generateProgramme({ ...base, equipment: ['machine', 'cable'] });
    const chosen = programme.days.flatMap((d) => d.exercises);

    expect(chosen.length).toBeGreaterThan(0);
    for (const row of chosen) {
      const exercise = EXERCISES.find((e) => e.id === row.exerciseId)!;
      expect(['machine', 'cable']).toContain(exercise.equipment);
    }
  });

  it('prefers a barbell over a machine when both are available', () => {
    const programme = generateProgramme(base);
    const firstChest = programme.days.flatMap((d) => d.exercises).find((e) => e.muscle === 'chest')!;
    const exercise = EXERCISES.find((e) => e.id === firstChest.exerciseId)!;

    expect(exercise.equipment).toBe('barbell');
  });
});

describe('exercise count', () => {
  it('scales with the weekly target and the number of sessions', () => {
    // Same target over two sessions means fewer movements per session than over one.
    const overOne = exerciseCountFor('chest', 'advanced', 'hypertrophy', 1);
    const overTwo = exerciseCountFor('chest', 'advanced', 'hypertrophy', 2);
    expect(overOne).toBeGreaterThanOrEqual(overTwo);
  });

  it('caps at three movements for one muscle in one session', () => {
    expect(exerciseCountFor('chest', 'advanced', 'endurance', 1)).toBeLessThanOrEqual(3);
  });

  it('gives a non-primary muscle a single movement', () => {
    expect(exerciseCountFor('calves', 'advanced', 'hypertrophy', 2)).toBe(1);
  });
});

describe('fight and event weeks', () => {
  it('returns seven days with the right number of sessions', () => {
    for (const discipline of ['bjj', 'mma', 'boxing', 'strongman'] as const) {
      for (const days of [3, 4, 5]) {
        const week = generateDisciplineWeek(discipline, days);
        expect(week.days).toHaveLength(7);
        expect(week.days.filter((d) => d.name !== null)).toHaveLength(days);
      }
    }
  });

  it('never puts two hard days back to back', () => {
    // The thing that ends camps. Everything else in the week bends around it.
    for (const discipline of ['bjj', 'mma', 'boxing'] as const) {
      for (const days of [3, 4, 5]) {
        const week = generateDisciplineWeek(discipline, days);
        for (let i = 1; i < week.days.length; i += 1) {
          expect(week.days[i]!.hard && week.days[i - 1]!.hard).toBe(false);
        }
      }
    }
  });

  it('costs the week in minutes so it can be held against a real diary', () => {
    const week = generateDisciplineWeek('boxing', 5);
    expect(week.totalMinutes).toBeGreaterThan(0);
    expect(week.totalMinutes).toBe(week.days.reduce((s, d) => s + d.minutes, 0));
  });

  it('is deterministic', () => {
    const a = generateDisciplineWeek('bjj', 4);
    const b = generateDisciplineWeek('bjj', 4);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('falls back to the three-day week rather than returning nothing', () => {
    const week = generateDisciplineWeek('mma', 99);
    expect(week.days.filter((d) => d.name !== null).length).toBeGreaterThan(0);
  });
});
