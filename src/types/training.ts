import type { Discipline, DisciplineLog } from './disciplines';
import type { IsoDate, IsoDateTime, Uuid } from './units';

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'neck'
  | 'full_body' | 'cardio';

export type Equipment =
  | 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight'
  | 'kettlebell' | 'band' | 'smith' | 'ez_bar' | 'trap_bar'
  | 'plate' | 'sled' | 'bag' | 'pads' | 'rope' | 'none';

export type MovementPattern =
  | 'horizontal_push' | 'vertical_push' | 'horizontal_pull' | 'vertical_pull'
  | 'squat' | 'hinge' | 'lunge' | 'carry' | 'rotation' | 'isolation'
  | 'conditioning' | 'skill';

/**
 * How a set is measured. This drives which input fields the logger shows and
 * which PR types are even possible for the movement.
 */
export type SetMetric =
  | 'weight_reps'   // 100 kg x 10
  | 'reps'          // bodyweight, 12 reps
  | 'weighted_reps' // weighted dip, +20 kg x 8
  | 'duration'      // plank, 90 s
  | 'distance'      // run, 5 km
  | 'distance_time' // roadwork, 5 km in 24:10
  | 'rounds';       // sparring / bag work

export type Exercise = {
  id: Uuid;
  name: string;
  aliases: string[];
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  pattern: MovementPattern;
  metric: SetMetric;
  unilateral: boolean;
  bodyweight: boolean;
  /** False hides it from search without breaking historical workouts. */
  active: boolean;
  /** User-created exercises carry the owner id; canonical library entries do not. */
  createdBy?: Uuid;
};

export type WorkoutSet = {
  id: Uuid;
  /** 1-based position within the exercise, working and warm-up combined. */
  index: number;
  /** Kilograms. Null for bodyweight-only and time/distance metrics. */
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rounds: number | null;
  /** Rate of perceived exertion, 1–10. Optional by design (spec §12). */
  rpe: number | null;
  /** Warm-ups are logged but excluded from volume, PRs and score. */
  isWarmup: boolean;
  completed: boolean;
  completedAt: IsoDateTime | null;
  notes?: string;
};

export type WorkoutExercise = {
  id: Uuid;
  exerciseId: Uuid;
  /** Denormalised so history survives an exercise being renamed or deactivated. */
  exerciseName: string;
  metric: SetMetric;
  order: number;
  sets: WorkoutSet[];
  notes?: string;
};

export type WorkoutStatus = 'active' | 'completed' | 'abandoned';

/** Where a record currently sits relative to the server (spec §13). */
export type SyncState = 'local' | 'queued' | 'syncing' | 'synced' | 'failed';

export type Workout = {
  id: Uuid;
  userId: Uuid;
  title: string;
  /**
   * Which discipline this session was. Required rather than optional: a session
   * whose kind is unknown cannot be summarised, scored or compared, and
   * defaulting the unknown to 'gym' would quietly file mat time as lifting.
   */
  discipline: Discipline;
  /**
   * The discipline-specific record. Gym sessions carry none — their record is
   * the exercise and set list below, which is what `exercises` has always been.
   */
  log?: DisciplineLog;
  status: WorkoutStatus;
  startedAt: IsoDateTime;
  completedAt: IsoDateTime | null;
  /** Excludes paused time; not simply completedAt − startedAt. */
  durationSeconds: number;
  exercises: WorkoutExercise[];
  notes?: string;
  templateId?: Uuid;
  syncState: SyncState;
};

export type WorkoutTemplate = {
  id: Uuid;
  userId: Uuid;
  name: string;
  discipline: Discipline;
  exercises: Array<{
    exerciseId: Uuid;
    exerciseName: string;
    metric: SetMetric;
    targetSets: number;
    targetReps?: number;
  }>;
  lastUsedAt: IsoDateTime | null;
};

export type PrType =
  | 'max_weight'
  | 'rep_pr'
  | 'estimated_1rm'
  | 'max_reps'
  | 'max_distance'
  | 'fastest_time'
  | 'longest_duration';

export type PersonalRecord = {
  id: Uuid;
  userId: Uuid;
  exerciseId: Uuid;
  exerciseName: string;
  type: PrType;
  value: number;
  /** For rep_pr: the weight the rep record was set at. */
  atWeightKg: number | null;
  reps: number | null;
  achievedAt: IsoDateTime;
  workoutId: Uuid;
  /** The value this beat, for a "+5 kg" delta in the UI. Null for a first record. */
  previousValue: number | null;
};

export type WorkoutSummary = {
  workoutId: Uuid;
  durationSeconds: number;
  exerciseCount: number;
  workingSets: number;
  /** Sum of weight x reps over completed working sets, kilograms. */
  volumeKg: number;
  totalReps: number;
  personalRecords: PersonalRecord[];
};

export type BodyMetricKind =
  | 'weight' | 'body_fat' | 'waist' | 'chest' | 'arm_left' | 'arm_right'
  | 'thigh_left' | 'thigh_right' | 'hips' | 'neck' | 'custom';

export type BodyMetric = {
  id: Uuid;
  userId: Uuid;
  kind: BodyMetricKind;
  label?: string;
  /** kg for weight, % for body fat, cm for circumferences. */
  value: number;
  recordedOn: IsoDate;
  note?: string;
};
