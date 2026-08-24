import { create } from 'zustand';
import type {
  Exercise,
  PersonalRecord,
  SetMetric,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutSummary,
} from '@/types';
import { createId } from '@/utils/id';
import { detectWorkoutPRs } from '@/engines/training/personalRecords';
import { summariseWorkout } from '@/engines/training/volume';
import { seedWorkouts, seedPersonalRecords, SEED_USER_ID } from '@/data/seed';

/**
 * Active workout state (spec §12, §13).
 *
 * The live session lives in memory and is designed to be mirrored to SQLite on
 * every mutation — gym Wi-Fi cannot be trusted, and a dropped connection or an
 * OS kill mid-session must not cost someone their work. The persistence adapter
 * is injected rather than imported so this store stays testable and free of
 * native dependencies.
 *
 * IDs are minted locally so a session created offline keeps a stable identity
 * through to sync.
 */

export type WorkoutPersistence = {
  saveActive(workout: Workout | null): Promise<void>;
  loadActive(): Promise<Workout | null>;
  saveCompleted(workout: Workout): Promise<void>;
};

type WorkoutState = {
  active: Workout | null;
  history: Workout[];
  personalRecords: PersonalRecord[];
  restTimerSeconds: number | null;
  restTimerStartedAt: number | null;
  lastSummary: WorkoutSummary | null;
  persistence: WorkoutPersistence | null;

  setPersistence(adapter: WorkoutPersistence): void;
  hydrate(): Promise<void>;

  startWorkout(title: string, userId?: string): void;
  startFromTemplate(title: string, exercises: Array<{ exerciseId: string; exerciseName: string; metric: SetMetric; targetSets: number; targetReps?: number }>, userId?: string): void;
  repeatWorkout(workout: Workout): void;
  abandonWorkout(): void;
  finishWorkout(): WorkoutSummary | null;

  addExercise(exercise: Exercise): void;
  removeExercise(workoutExerciseId: string): void;
  reorderExercise(workoutExerciseId: string, direction: 'up' | 'down'): void;

  addSet(workoutExerciseId: string): void;
  updateSet(workoutExerciseId: string, setId: string, patch: Partial<WorkoutSet>): void;
  toggleSetComplete(workoutExerciseId: string, setId: string): void;
  removeSet(workoutExerciseId: string, setId: string): void;
  copyPreviousSet(workoutExerciseId: string): void;

  setNotes(notes: string): void;
  startRestTimer(seconds: number): void;
  clearRestTimer(): void;
};

/** A new set inherits the previous set's load — the common case is repeating it. */
function blankSet(index: number, previous?: WorkoutSet): WorkoutSet {
  return {
    id: createId(),
    index,
    weightKg: previous?.weightKg ?? null,
    reps: previous?.reps ?? null,
    durationSeconds: previous?.durationSeconds ?? null,
    distanceMeters: previous?.distanceMeters ?? null,
    rounds: previous?.rounds ?? null,
    rpe: null,
    isWarmup: false,
    completed: false,
    completedAt: null,
  };
}

function reindex(sets: WorkoutSet[]): WorkoutSet[] {
  return sets.map((set, i) => ({ ...set, index: i + 1 }));
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  active: null,
  history: seedWorkouts,
  personalRecords: seedPersonalRecords,
  restTimerSeconds: null,
  restTimerStartedAt: null,
  lastSummary: null,
  persistence: null,

  setPersistence(adapter) {
    set({ persistence: adapter });
  },

  async hydrate() {
    const { persistence } = get();
    if (!persistence) return;

    // An in-progress session survives an app restart (spec §13).
    const restored = await persistence.loadActive();
    if (restored) set({ active: restored });
  },

  startWorkout(title, userId = SEED_USER_ID) {
    const workout: Workout = {
      id: createId(),
      userId,
      title,
      status: 'active',
      startedAt: new Date().toISOString(),
      completedAt: null,
      durationSeconds: 0,
      exercises: [],
      syncState: 'local',
    };
    set({ active: workout, lastSummary: null });
    void get().persistence?.saveActive(workout);
  },

  startFromTemplate(title, exercises, userId = SEED_USER_ID) {
    const workout: Workout = {
      id: createId(),
      userId,
      title,
      status: 'active',
      startedAt: new Date().toISOString(),
      completedAt: null,
      durationSeconds: 0,
      syncState: 'local',
      exercises: exercises.map((entry, order) => ({
        id: createId(),
        exerciseId: entry.exerciseId,
        exerciseName: entry.exerciseName,
        metric: entry.metric,
        order,
        // Pre-fill the target sets, empty and unticked. Nothing counts until logged.
        sets: Array.from({ length: entry.targetSets }, (_, i) => ({
          ...blankSet(i + 1),
          reps: entry.targetReps ?? null,
        })),
      })),
    };
    set({ active: workout, lastSummary: null });
    void get().persistence?.saveActive(workout);
  },

  /** Repeat a previous session: same movements and loads, nothing ticked. */
  repeatWorkout(previous) {
    const workout: Workout = {
      id: createId(),
      userId: previous.userId,
      title: previous.title,
      status: 'active',
      startedAt: new Date().toISOString(),
      completedAt: null,
      durationSeconds: 0,
      syncState: 'local',
      exercises: previous.exercises.map((exercise) => ({
        id: createId(),
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        metric: exercise.metric,
        order: exercise.order,
        sets: exercise.sets
          .filter((s) => !s.isWarmup)
          .map((s, i) => ({
            ...blankSet(i + 1),
            weightKg: s.weightKg,
            reps: s.reps,
            durationSeconds: s.durationSeconds,
            distanceMeters: s.distanceMeters,
            rounds: s.rounds,
          })),
      })),
    };
    set({ active: workout, lastSummary: null });
    void get().persistence?.saveActive(workout);
  },

  abandonWorkout() {
    set({ active: null, restTimerSeconds: null, restTimerStartedAt: null });
    void get().persistence?.saveActive(null);
  },

  finishWorkout() {
    const { active, history, personalRecords, persistence } = get();
    if (!active) return null;

    const completedAt = new Date().toISOString();
    const durationSeconds = Math.round(
      (new Date(completedAt).getTime() - new Date(active.startedAt).getTime()) / 1000,
    );

    const completed: Workout = {
      ...active,
      status: 'completed',
      completedAt,
      durationSeconds,
      syncState: 'queued',
    };

    // PR detection runs here, deterministically, against the user's own history.
    const newRecords = detectWorkoutPRs(completed, personalRecords, {
      userId: completed.userId,
      workoutId: completed.id,
      achievedAt: completedAt,
      makeId: createId,
    });

    const summary: WorkoutSummary = {
      ...summariseWorkout(completed),
      personalRecords: newRecords,
    };

    set({
      active: null,
      history: [...history, completed],
      personalRecords: [...personalRecords, ...newRecords],
      lastSummary: summary,
      restTimerSeconds: null,
      restTimerStartedAt: null,
    });

    void persistence?.saveCompleted(completed);
    void persistence?.saveActive(null);

    return summary;
  },

  addExercise(exercise) {
    const { active } = get();
    if (!active) return;

    const workoutExercise: WorkoutExercise = {
      id: createId(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      metric: exercise.metric,
      order: active.exercises.length,
      sets: [blankSet(1)],
    };

    persist(set, get, { ...active, exercises: [...active.exercises, workoutExercise] });
  },

  removeExercise(workoutExerciseId) {
    const { active } = get();
    if (!active) return;

    persist(set, get, {
      ...active,
      exercises: active.exercises
        .filter((e) => e.id !== workoutExerciseId)
        .map((e, order) => ({ ...e, order })),
    });
  },

  reorderExercise(workoutExerciseId, direction) {
    const { active } = get();
    if (!active) return;

    const index = active.exercises.findIndex((e) => e.id === workoutExerciseId);
    if (index === -1) return;

    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= active.exercises.length) return;

    const exercises = [...active.exercises];
    const moved = exercises[index]!;
    exercises[index] = exercises[target]!;
    exercises[target] = moved;

    persist(set, get, {
      ...active,
      exercises: exercises.map((e, order) => ({ ...e, order })),
    });
  },

  addSet(workoutExerciseId) {
    const { active } = get();
    if (!active) return;

    persist(set, get, {
      ...active,
      exercises: active.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;
        const previous = exercise.sets[exercise.sets.length - 1];
        return { ...exercise, sets: [...exercise.sets, blankSet(exercise.sets.length + 1, previous)] };
      }),
    });
  },

  updateSet(workoutExerciseId, setId, patch) {
    const { active } = get();
    if (!active) return;

    persist(set, get, {
      ...active,
      exercises: active.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
        };
      }),
    });
  },

  toggleSetComplete(workoutExerciseId, setId) {
    const { active } = get();
    if (!active) return;

    persist(set, get, {
      ...active,
      exercises: active.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((s) => {
            if (s.id !== setId) return s;
            const completed = !s.completed;
            return {
              ...s,
              completed,
              completedAt: completed ? new Date().toISOString() : null,
            };
          }),
        };
      }),
    });
  },

  removeSet(workoutExerciseId, setId) {
    const { active } = get();
    if (!active) return;

    persist(set, get, {
      ...active,
      exercises: active.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;
        return { ...exercise, sets: reindex(exercise.sets.filter((s) => s.id !== setId)) };
      }),
    });
  },

  /** Duplicate the last logged set — the fastest path through a straight-sets session. */
  copyPreviousSet(workoutExerciseId) {
    const { active } = get();
    if (!active) return;

    persist(set, get, {
      ...active,
      exercises: active.exercises.map((exercise) => {
        if (exercise.id !== workoutExerciseId) return exercise;
        const last = [...exercise.sets].reverse().find((s) => s.completed) ?? exercise.sets[exercise.sets.length - 1];
        return { ...exercise, sets: [...exercise.sets, blankSet(exercise.sets.length + 1, last)] };
      }),
    });
  },

  setNotes(notes) {
    const { active } = get();
    if (!active) return;
    persist(set, get, { ...active, notes });
  },

  startRestTimer(seconds) {
    set({ restTimerSeconds: seconds, restTimerStartedAt: Date.now() });
  },

  clearRestTimer() {
    set({ restTimerSeconds: null, restTimerStartedAt: null });
  },
}));

/** Every mutation writes through to local storage. Losing a set is not acceptable. */
function persist(
  set: (partial: Partial<WorkoutState>) => void,
  get: () => WorkoutState,
  workout: Workout,
): void {
  set({ active: workout });
  void get().persistence?.saveActive(workout);
}
