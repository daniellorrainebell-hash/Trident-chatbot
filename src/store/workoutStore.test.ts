import { EXERCISES, findExercise } from '@/data/exercises';
import { useWorkoutStore } from './workoutStore';

const bench = findExercise('ex-bench-press')!;
const squat = findExercise('ex-back-squat')!;

function reset() {
  useWorkoutStore.setState({ active: null, lastSummary: null, persistence: null });
}

beforeEach(reset);

describe('active workout lifecycle', () => {
  it('starts an empty session', () => {
    useWorkoutStore.getState().startWorkout('Push');
    const { active } = useWorkoutStore.getState();

    expect(active?.title).toBe('Push');
    expect(active?.status).toBe('active');
    expect(active?.exercises).toEqual([]);
    // Created offline, so it is local until it syncs.
    expect(active?.syncState).toBe('local');
  });

  it('adds exercises with one empty set ready to fill', () => {
    const store = useWorkoutStore.getState();
    store.startWorkout('Push');
    store.addExercise(bench);

    const exercise = useWorkoutStore.getState().active!.exercises[0]!;
    expect(exercise.exerciseName).toBe('Bench Press');
    expect(exercise.sets).toHaveLength(1);
    expect(exercise.sets[0]!.completed).toBe(false);
  });

  it('carries the previous load onto a new set', () => {
    const store = useWorkoutStore.getState();
    store.startWorkout('Push');
    store.addExercise(bench);

    const exerciseId = useWorkoutStore.getState().active!.exercises[0]!.id;
    const setId = useWorkoutStore.getState().active!.exercises[0]!.sets[0]!.id;

    useWorkoutStore.getState().updateSet(exerciseId, setId, { weightKg: 100, reps: 8 });
    useWorkoutStore.getState().addSet(exerciseId);

    const sets = useWorkoutStore.getState().active!.exercises[0]!.sets;
    expect(sets[1]!.weightKg).toBe(100);
    expect(sets[1]!.reps).toBe(8);
    expect(sets[1]!.completed).toBe(false);
  });

  it('stamps a completion time when a set is ticked', () => {
    const store = useWorkoutStore.getState();
    store.startWorkout('Push');
    store.addExercise(bench);

    const exerciseId = useWorkoutStore.getState().active!.exercises[0]!.id;
    const setId = useWorkoutStore.getState().active!.exercises[0]!.sets[0]!.id;

    useWorkoutStore.getState().toggleSetComplete(exerciseId, setId);
    const done = useWorkoutStore.getState().active!.exercises[0]!.sets[0]!;

    expect(done.completed).toBe(true);
    expect(done.completedAt).not.toBeNull();

    useWorkoutStore.getState().toggleSetComplete(exerciseId, setId);
    expect(useWorkoutStore.getState().active!.exercises[0]!.sets[0]!.completedAt).toBeNull();
  });

  it('reorders and reindexes exercises', () => {
    const store = useWorkoutStore.getState();
    store.startWorkout('Push');
    store.addExercise(bench);
    store.addExercise(squat);

    const second = useWorkoutStore.getState().active!.exercises[1]!.id;
    useWorkoutStore.getState().reorderExercise(second, 'up');

    const names = useWorkoutStore.getState().active!.exercises.map((e) => e.exerciseName);
    expect(names).toEqual(['Back Squat', 'Bench Press']);
    expect(useWorkoutStore.getState().active!.exercises.map((e) => e.order)).toEqual([0, 1]);
  });

  it('renumbers remaining sets after a deletion', () => {
    const store = useWorkoutStore.getState();
    store.startWorkout('Push');
    store.addExercise(bench);

    const exerciseId = useWorkoutStore.getState().active!.exercises[0]!.id;
    useWorkoutStore.getState().addSet(exerciseId);
    useWorkoutStore.getState().addSet(exerciseId);

    const middle = useWorkoutStore.getState().active!.exercises[0]!.sets[1]!.id;
    useWorkoutStore.getState().removeSet(exerciseId, middle);

    expect(useWorkoutStore.getState().active!.exercises[0]!.sets.map((s) => s.index)).toEqual([1, 2]);
  });
});

describe('finishing a workout', () => {
  function logSession(weight: number, reps: number) {
    const store = useWorkoutStore.getState();
    store.startWorkout('Push');
    store.addExercise(bench);

    const exerciseId = useWorkoutStore.getState().active!.exercises[0]!.id;
    const setId = useWorkoutStore.getState().active!.exercises[0]!.sets[0]!.id;

    useWorkoutStore.getState().updateSet(exerciseId, setId, { weightKg: weight, reps });
    useWorkoutStore.getState().toggleSetComplete(exerciseId, setId);

    return useWorkoutStore.getState().finishWorkout();
  }

  it('returns totals and clears the active session', () => {
    const summary = logSession(100, 10);

    expect(summary).not.toBeNull();
    expect(summary!.volumeKg).toBe(1000);
    expect(summary!.workingSets).toBe(1);
    expect(summary!.exerciseCount).toBe(1);
    expect(useWorkoutStore.getState().active).toBeNull();
  });

  it('moves the session into history, queued for sync', () => {
    const before = useWorkoutStore.getState().history.length;
    logSession(100, 10);

    const history = useWorkoutStore.getState().history;
    expect(history).toHaveLength(before + 1);
    expect(history[history.length - 1]!.syncState).toBe('queued');
    expect(history[history.length - 1]!.status).toBe('completed');
  });

  it('detects a PR against the user\'s own history', () => {
    // Far beyond anything in the seed history, so it must register.
    const summary = logSession(200, 3);
    const maxWeight = summary!.personalRecords.find((pr) => pr.type === 'max_weight');

    expect(maxWeight).toBeDefined();
    expect(maxWeight!.value).toBe(200);
    expect(maxWeight!.previousValue).not.toBeNull();
  });

  it('does not invent a PR for an ordinary session', () => {
    const summary = logSession(60, 5);
    expect(summary!.personalRecords.filter((pr) => pr.type === 'max_weight')).toHaveLength(0);
  });

  it('returns null when there is nothing to finish', () => {
    expect(useWorkoutStore.getState().finishWorkout()).toBeNull();
  });
});

describe('offline persistence', () => {
  it('writes through on every mutation', async () => {
    const saved: Array<unknown> = [];
    useWorkoutStore.getState().setPersistence({
      async saveActive(workout) { saved.push(workout); },
      async loadActive() { return null; },
      async saveCompleted() {},
    });

    const store = useWorkoutStore.getState();
    store.startWorkout('Push');
    store.addExercise(bench);

    const exerciseId = useWorkoutStore.getState().active!.exercises[0]!.id;
    useWorkoutStore.getState().addSet(exerciseId);

    // start + addExercise + addSet
    expect(saved.length).toBeGreaterThanOrEqual(3);
  });

  it('restores an in-progress session after a restart', async () => {
    const store = useWorkoutStore.getState();
    store.startWorkout('Interrupted');
    const stored = useWorkoutStore.getState().active!;

    reset();
    expect(useWorkoutStore.getState().active).toBeNull();

    useWorkoutStore.getState().setPersistence({
      async saveActive() {},
      async loadActive() { return stored; },
      async saveCompleted() {},
    });

    await useWorkoutStore.getState().hydrate();
    expect(useWorkoutStore.getState().active?.title).toBe('Interrupted');
  });
});

describe('repeatWorkout', () => {
  it('copies loads forward but ticks nothing', () => {
    const store = useWorkoutStore.getState();
    const previous = useWorkoutStore.getState().history[0]!;
    store.repeatWorkout(previous);

    const active = useWorkoutStore.getState().active!;
    expect(active.title).toBe(previous.title);
    expect(active.id).not.toBe(previous.id);

    const allSets = active.exercises.flatMap((e) => e.sets);
    expect(allSets.every((s) => !s.completed)).toBe(true);
    expect(allSets.some((s) => (s.weightKg ?? 0) > 0)).toBe(true);
    // Warm-ups are not carried over.
    expect(allSets.every((s) => !s.isWarmup)).toBe(true);
  });
});

describe('exercise library', () => {
  it('is internally consistent', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
