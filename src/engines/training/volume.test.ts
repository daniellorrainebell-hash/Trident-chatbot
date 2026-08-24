import { makeExercise, makeSet, makeWorkout } from '../__fixtures__/builders';
import {
  countWorkedExercises,
  countWorkingSets,
  estimate1RM,
  setVolumeKg,
  summariseWorkout,
  workoutVolumeKg,
  ESTIMATED_1RM_MAX_REPS,
} from './volume';

describe('setVolumeKg', () => {
  it('multiplies weight by reps for a completed working set', () => {
    expect(setVolumeKg(makeSet({ weightKg: 100, reps: 10 }), 'weight_reps')).toBe(1000);
  });

  it('ignores warm-up sets', () => {
    expect(setVolumeKg(makeSet({ isWarmup: true }), 'weight_reps')).toBe(0);
  });

  it('ignores sets the user typed but never completed', () => {
    expect(setVolumeKg(makeSet({ completed: false }), 'weight_reps')).toBe(0);
  });

  it('produces no volume for non-weight metrics', () => {
    const run = makeSet({ weightKg: null, reps: null, distanceMeters: 5000 });
    expect(setVolumeKg(run, 'distance')).toBe(0);
  });

  it('treats a bodyweight set with no load as zero volume', () => {
    expect(setVolumeKg(makeSet({ weightKg: 0, reps: 12 }), 'weight_reps')).toBe(0);
  });
});

describe('workoutVolumeKg', () => {
  it('sums working sets across exercises', () => {
    const workout = makeWorkout({
      exercises: [
        makeExercise({
          sets: [
            makeSet({ weightKg: 100, reps: 10 }),
            makeSet({ weightKg: 110, reps: 8 }),
            makeSet({ weightKg: 120, reps: 5 }),
          ],
        }),
        makeExercise({
          exerciseId: 'ex-squat',
          exerciseName: 'Back Squat',
          sets: [makeSet({ weightKg: 140, reps: 5 })],
        }),
      ],
    });

    // 1000 + 880 + 600 + 700
    expect(workoutVolumeKg(workout)).toBe(3180);
  });

  it('excludes warm-ups from the total', () => {
    const workout = makeWorkout({
      exercises: [
        makeExercise({
          sets: [
            makeSet({ weightKg: 60, reps: 10, isWarmup: true }),
            makeSet({ weightKg: 100, reps: 10 }),
          ],
        }),
      ],
    });
    expect(workoutVolumeKg(workout)).toBe(1000);
  });
});

describe('countWorkedExercises', () => {
  it('does not count an exercise that was added but never worked', () => {
    const workout = makeWorkout({
      exercises: [
        makeExercise({ sets: [makeSet()] }),
        makeExercise({
          exerciseId: 'ex-fly',
          sets: [makeSet({ completed: false })],
        }),
      ],
    });
    expect(countWorkedExercises(workout)).toBe(1);
    expect(countWorkingSets(workout)).toBe(1);
  });
});

describe('estimate1RM', () => {
  it('returns the weight itself for a single', () => {
    expect(estimate1RM(140, 1)).toBe(140);
  });

  it('applies the Epley formula', () => {
    // 100 * (1 + 5/30) = 116.67 -> 116.7
    expect(estimate1RM(100, 5)).toBe(116.7);
  });

  it('refuses to estimate beyond the rep cap rather than reporting fake precision', () => {
    expect(estimate1RM(60, ESTIMATED_1RM_MAX_REPS + 1)).toBeNull();
  });

  it('returns null for nonsense input', () => {
    expect(estimate1RM(0, 5)).toBeNull();
    expect(estimate1RM(100, 0)).toBeNull();
  });
});

describe('summariseWorkout', () => {
  it('reports the completion-screen totals', () => {
    const workout = makeWorkout({
      durationSeconds: 4200,
      exercises: [
        makeExercise({
          sets: [makeSet({ weightKg: 100, reps: 10 }), makeSet({ weightKg: 100, reps: 8 })],
        }),
      ],
    });

    expect(summariseWorkout(workout)).toEqual({
      workoutId: workout.id,
      durationSeconds: 4200,
      exerciseCount: 1,
      workingSets: 2,
      volumeKg: 1800,
      totalReps: 18,
    });
  });
});
