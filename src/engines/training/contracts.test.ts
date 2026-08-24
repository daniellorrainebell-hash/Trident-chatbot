import { makeContract, makeExercise, makeSet, makeWorkout, workoutOn } from '../__fixtures__/builders';
import { calculateProgress, contributionFrom, daysBetween, resolveStatus } from './contracts';

describe('daysBetween', () => {
  it('counts whole days between ISO dates', () => {
    expect(daysBetween('2026-03-01', '2026-03-30')).toBe(29);
    expect(daysBetween('2026-03-30', '2026-03-01')).toBe(-29);
  });
});

describe('contributionFrom', () => {
  it('credits one session for a workout inside the window', () => {
    expect(contributionFrom(workoutOn('2026-03-05'), makeContract())).toBe(1);
  });

  it('ignores workouts outside the window', () => {
    expect(contributionFrom(workoutOn('2026-02-20'), makeContract())).toBe(0);
    expect(contributionFrom(workoutOn('2026-04-05'), makeContract())).toBe(0);
  });

  it('does not credit a session that logged no working sets', () => {
    const empty = makeWorkout({
      completedAt: '2026-03-05T18:00:00.000Z',
      exercises: [makeExercise({ sets: [makeSet({ completed: false })] })],
    });
    expect(contributionFrom(empty, makeContract())).toBe(0);
  });

  it('ignores workouts that were never completed', () => {
    const active = workoutOn('2026-03-05');
    active.status = 'active';
    expect(contributionFrom(active, makeContract())).toBe(0);
  });

  it('sums volume for a volume contract', () => {
    const contract = makeContract({ metric: 'volume_kg', target: 250000, unit: 'kg' });
    // 3 sets x 100 kg x 10
    expect(contributionFrom(workoutOn('2026-03-05', 3), contract)).toBe(3000);
  });

  it('converts distance to kilometres', () => {
    const contract = makeContract({ metric: 'distance_km', target: 100, unit: 'km' });
    const run = makeWorkout({
      completedAt: '2026-03-05T18:00:00.000Z',
      exercises: [
        makeExercise({
          metric: 'distance',
          sets: [makeSet({ weightKg: null, reps: null, distanceMeters: 8000 })],
        }),
      ],
    });
    expect(contributionFrom(run, contract)).toBe(8);
  });

  it('takes the heaviest qualifying set for a target-lift contract', () => {
    const contract = makeContract({
      metric: 'target_lift_kg',
      target: 140,
      unit: 'kg',
      exerciseId: 'ex-bench',
    });
    const workout = makeWorkout({
      completedAt: '2026-03-05T18:00:00.000Z',
      exercises: [
        makeExercise({
          sets: [makeSet({ weightKg: 120, reps: 5 }), makeSet({ weightKg: 135, reps: 2 })],
        }),
      ],
    });
    expect(contributionFrom(workout, contract)).toBe(135);
  });
});

describe('resolveStatus', () => {
  const contract = makeContract();

  it('completes as soon as the target is met, without waiting for the deadline', () => {
    expect(resolveStatus(contract, 16, '2026-03-15')).toBe('completed');
  });

  it('stays active while inside the window and short of target', () => {
    expect(resolveStatus(contract, 9, '2026-03-15')).toBe('active');
  });

  it('fails once the deadline passes short of target', () => {
    expect(resolveStatus(contract, 12, '2026-03-31')).toBe('failed');
  });

  it('never revives a failed contract', () => {
    const failed = makeContract({ status: 'failed' });
    expect(resolveStatus(failed, 999, '2026-03-15')).toBe('failed');
  });
});

describe('calculateProgress', () => {
  it('reports current, remaining and days left', () => {
    const contract = makeContract();
    const workouts = ['2026-03-02', '2026-03-04', '2026-03-06', '2026-03-08'].map((d) =>
      workoutOn(d),
    );

    const progress = calculateProgress(contract, workouts, '2026-03-10');

    expect(progress.current).toBe(4);
    expect(progress.remaining).toBe(12);
    expect(progress.fraction).toBeCloseTo(0.25);
    expect(progress.daysRemaining).toBe(21);
    expect(progress.status).toBe('active');
  });

  it('flags a user who is behind the pace needed to finish', () => {
    const contract = makeContract();
    // 2 sessions in the first 10 days, needing 16 in 30.
    const workouts = ['2026-03-02', '2026-03-04'].map((d) => workoutOn(d));

    const progress = calculateProgress(contract, workouts, '2026-03-10');
    expect(progress.offPace).toBe(true);
    expect(progress.requiredDailyRate).toBeCloseTo(14 / 21);
  });

  it('does not flag a user tracking ahead of pace', () => {
    const contract = makeContract();
    const workouts = [
      '2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04',
      '2026-03-05', '2026-03-06', '2026-03-07', '2026-03-08',
    ].map((d) => workoutOn(d));

    expect(calculateProgress(contract, workouts, '2026-03-08').offPace).toBe(false);
  });

  it('clamps the fraction at 1 when the target is exceeded', () => {
    const contract = makeContract({ target: 2 });
    const workouts = ['2026-03-01', '2026-03-02', '2026-03-03'].map((d) => workoutOn(d));

    const progress = calculateProgress(contract, workouts, '2026-03-05');
    expect(progress.fraction).toBe(1);
    expect(progress.remaining).toBe(0);
    expect(progress.requiredDailyRate).toBeNull();
    expect(progress.status).toBe('completed');
  });

  it('marks a missed contract failed and keeps the shortfall visible', () => {
    const contract = makeContract();
    const workouts = ['2026-03-02', '2026-03-04'].map((d) => workoutOn(d));

    const progress = calculateProgress(contract, workouts, '2026-04-01');
    expect(progress.status).toBe('failed');
    expect(progress.current).toBe(2);
    expect(progress.daysRemaining).toBe(0);
  });
});
