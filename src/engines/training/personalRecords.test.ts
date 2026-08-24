import type { PersonalRecord } from '@/types';
import { makeExercise, makeSet, makeWorkout, resetIds } from '../__fixtures__/builders';
import { buildBaseline, describePR, detectWorkoutPRs } from './personalRecords';

const options = {
  userId: 'user-1',
  workoutId: 'wo-1',
  achievedAt: '2026-03-02T10:00:00.000Z',
  makeId: (() => {
    let n = 0;
    return () => `pr-${(n += 1)}`;
  })(),
};

beforeEach(resetIds);

function existingPR(overrides: Partial<PersonalRecord>): PersonalRecord {
  return {
    id: 'pr-existing',
    userId: 'user-1',
    exerciseId: 'ex-bench',
    exerciseName: 'Bench Press',
    type: 'max_weight',
    value: 120,
    atWeightKg: null,
    reps: 3,
    achievedAt: '2026-01-01T10:00:00.000Z',
    workoutId: 'wo-old',
    previousValue: null,
    ...overrides,
  };
}

describe('detectWorkoutPRs', () => {
  it('records a first-ever attempt with no previous value', () => {
    const workout = makeWorkout({
      exercises: [makeExercise({ sets: [makeSet({ weightKg: 100, reps: 5 })] })],
    });

    const prs = detectWorkoutPRs(workout, [], options);
    const maxWeight = prs.find((p) => p.type === 'max_weight');

    expect(maxWeight?.value).toBe(100);
    expect(maxWeight?.previousValue).toBeNull();
  });

  it('reports only the heaviest set of an ascending ramp, not one PR per set', () => {
    const workout = makeWorkout({
      exercises: [
        makeExercise({
          sets: [
            makeSet({ weightKg: 100, reps: 10 }),
            makeSet({ weightKg: 110, reps: 8 }),
            makeSet({ weightKg: 120, reps: 5 }),
          ],
        }),
      ],
    });

    const maxWeightPRs = detectWorkoutPRs(workout, [], options).filter(
      (p) => p.type === 'max_weight',
    );

    expect(maxWeightPRs).toHaveLength(1);
    expect(maxWeightPRs[0]?.value).toBe(120);
  });

  it('does not fire when the set fails to beat the existing best', () => {
    const workout = makeWorkout({
      exercises: [makeExercise({ sets: [makeSet({ weightKg: 110, reps: 3 })] })],
    });

    const prs = detectWorkoutPRs(workout, [existingPR({ value: 120 })], options);
    expect(prs.find((p) => p.type === 'max_weight')).toBeUndefined();
  });

  it('carries the beaten value through so the UI can show a delta', () => {
    const workout = makeWorkout({
      exercises: [makeExercise({ sets: [makeSet({ weightKg: 125, reps: 3 })] })],
    });

    const pr = detectWorkoutPRs(workout, [existingPR({ value: 120 })], options).find(
      (p) => p.type === 'max_weight',
    );

    expect(pr?.value).toBe(125);
    expect(pr?.previousValue).toBe(120);
  });

  it('tracks rep PRs separately per weight', () => {
    const workout = makeWorkout({
      exercises: [
        makeExercise({
          sets: [makeSet({ weightKg: 100, reps: 12 }), makeSet({ weightKg: 120, reps: 4 })],
        }),
      ],
    });

    const existing = [
      existingPR({ type: 'rep_pr', value: 10, atWeightKg: 100 }),
      existingPR({ type: 'rep_pr', value: 6, atWeightKg: 120 }),
    ];

    const repPRs = detectWorkoutPRs(workout, existing, options).filter(
      (p) => p.type === 'rep_pr',
    );

    // 12 reps at 100 kg beats 10; 4 reps at 120 kg does not beat 6.
    expect(repPRs).toHaveLength(1);
    expect(repPRs[0]?.atWeightKg).toBe(100);
    expect(repPRs[0]?.value).toBe(12);
  });

  it('ignores warm-up and uncompleted sets', () => {
    const workout = makeWorkout({
      exercises: [
        makeExercise({
          sets: [
            makeSet({ weightKg: 200, reps: 1, isWarmup: true }),
            makeSet({ weightKg: 300, reps: 1, completed: false }),
          ],
        }),
      ],
    });

    expect(detectWorkoutPRs(workout, [], options)).toHaveLength(0);
  });

  it('only produces PR types the metric supports', () => {
    const workout = makeWorkout({
      exercises: [
        makeExercise({
          exerciseId: 'ex-plank',
          exerciseName: 'Plank',
          metric: 'duration',
          sets: [makeSet({ weightKg: null, reps: null, durationSeconds: 120 })],
        }),
      ],
    });

    const types = detectWorkoutPRs(workout, [], options).map((p) => p.type);
    expect(types).toEqual(['longest_duration']);
  });

  it('treats a lower time as an improvement for fastest_time', () => {
    const workout = makeWorkout({
      exercises: [
        makeExercise({
          exerciseId: 'ex-run',
          exerciseName: 'Run',
          metric: 'distance_time',
          sets: [
            makeSet({ weightKg: null, reps: null, distanceMeters: 5000, durationSeconds: 1400 }),
          ],
        }),
      ],
    });

    const existing = [
      existingPR({ exerciseId: 'ex-run', type: 'fastest_time', value: 1500, reps: null }),
    ];

    const pr = detectWorkoutPRs(workout, existing, options).find(
      (p) => p.type === 'fastest_time',
    );
    expect(pr?.value).toBe(1400);
  });

  it('is deterministic: the same input yields the same records', () => {
    const workout = makeWorkout({
      exercises: [makeExercise({ sets: [makeSet({ weightKg: 130, reps: 3 })] })],
    });

    const first = detectWorkoutPRs(workout, [], { ...options, makeId: () => 'fixed' });
    const second = detectWorkoutPRs(workout, [], { ...options, makeId: () => 'fixed' });

    expect(first).toEqual(second);
  });
});

describe('buildBaseline', () => {
  it('keeps the best value when several records exist for one key', () => {
    const baseline = buildBaseline([
      existingPR({ value: 100 }),
      existingPR({ value: 130 }),
      existingPR({ value: 115 }),
    ]);
    expect(baseline.get('ex-bench:max_weight')).toBe(130);
  });

  it('keeps the lowest value for fastest_time', () => {
    const baseline = buildBaseline([
      existingPR({ type: 'fastest_time', value: 1500 }),
      existingPR({ type: 'fastest_time', value: 1380 }),
    ]);
    expect(baseline.get('ex-bench:fastest_time')).toBe(1380);
  });
});

describe('describePR', () => {
  it('labels a rep PR with its weight', () => {
    expect(describePR(existingPR({ type: 'rep_pr', value: 12, atWeightKg: 100 }))).toBe(
      '12 reps at 100 kg',
    );
  });

  it('formats a distance in kilometres', () => {
    expect(describePR(existingPR({ type: 'max_distance', value: 10500 }))).toBe('10.50 km');
  });

  it('formats a time as minutes and seconds', () => {
    expect(describePR(existingPR({ type: 'fastest_time', value: 1445 }))).toBe('24:05');
  });
});
