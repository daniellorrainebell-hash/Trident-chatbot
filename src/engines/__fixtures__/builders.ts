import type {
  Contract,
  NutritionProfile,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WeeklyCheckIn,
} from '@/types';

/**
 * Test builders. Every field has a sane default so a test states only what it
 * cares about — which keeps the assertions readable and stops an unrelated field
 * change from breaking fifty tests.
 */

let counter = 0;
export function nextId(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function resetIds(): void {
  counter = 0;
}

export function makeSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: nextId('set'),
    index: 1,
    weightKg: 100,
    reps: 10,
    durationSeconds: null,
    distanceMeters: null,
    rounds: null,
    rpe: null,
    isWarmup: false,
    completed: true,
    completedAt: '2026-03-02T10:00:00.000Z',
    ...overrides,
  };
}

export function makeExercise(overrides: Partial<WorkoutExercise> = {}): WorkoutExercise {
  return {
    id: nextId('we'),
    exerciseId: 'ex-bench',
    exerciseName: 'Bench Press',
    metric: 'weight_reps',
    order: 0,
    sets: [makeSet()],
    ...overrides,
  };
}

export function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: nextId('wo'),
    userId: 'user-1',
    title: 'Push',
    status: 'completed',
    startedAt: '2026-03-02T09:00:00.000Z',
    completedAt: '2026-03-02T10:00:00.000Z',
    durationSeconds: 3600,
    exercises: [makeExercise()],
    syncState: 'synced',
    ...overrides,
  };
}

/** A completed workout on a given day, with `sets` working sets of 100 kg x 10. */
export function workoutOn(date: string, sets = 3): Workout {
  return makeWorkout({
    completedAt: `${date}T18:00:00.000Z`,
    startedAt: `${date}T17:00:00.000Z`,
    exercises: [
      makeExercise({
        sets: Array.from({ length: sets }, (_, i) =>
          makeSet({ index: i + 1, completedAt: `${date}T18:00:00.000Z` }),
        ),
      }),
    ],
  });
}

export function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: nextId('contract'),
    userId: 'user-1',
    title: '16 sessions in 30 days',
    metric: 'sessions',
    target: 16,
    unit: 'sessions',
    startDate: '2026-03-01',
    endDate: '2026-03-30',
    status: 'active',
    visibility: 'private',
    verification: 'logged',
    createdAt: '2026-03-01T08:00:00.000Z',
    completedAt: null,
    failedAt: null,
    ...overrides,
  };
}

export function makeNutritionProfile(
  overrides: Partial<NutritionProfile> = {},
): NutritionProfile {
  return {
    userId: 'user-1',
    sex: 'male',
    ageYears: 30,
    heightCm: 180,
    currentWeightKg: 90,
    bodyFatPercent: null,
    activityLevel: 'moderately_active',
    trainingSessionsPerWeek: 4,
    averageSessionMinutes: 70,
    experience: 'intermediate',
    goal: 'lose_body_fat',
    targetWeightKg: 82,
    requestedTimeframeWeeks: 16,
    mealsPerDay: 4,
    isPregnant: false,
    isBreastfeeding: false,
    hasEatingDisorderHistory: false,
    hasMedicalCondition: false,
    ...overrides,
  };
}

export function makeCheckIn(overrides: Partial<WeeklyCheckIn> = {}): WeeklyCheckIn {
  return {
    id: nextId('checkin'),
    userId: 'user-1',
    weekStarting: '2026-03-02',
    weightKg: 90,
    waistCm: null,
    planAdherence: 90,
    trainingAdherence: 90,
    hunger: 3,
    energy: 3,
    performance: 3,
    sleepQuality: 3,
    submittedAt: '2026-03-08T09:00:00.000Z',
    ...overrides,
  };
}
