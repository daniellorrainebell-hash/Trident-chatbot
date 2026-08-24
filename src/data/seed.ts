import { detectWorkoutPRs } from '@/engines/training/personalRecords';
import type {
  BodyMetric,
  Contract,
  FightCamp,
  FoodPreferences,
  LeaderboardEntry,
  Pack,
  PackMember,
  PackStats,
  PersonalRecord,
  Profile,
  TrainingProfile,
  Workout,
  WorkoutTemplate,
  YardPost,
  NutritionProfile,
} from '@/types';

/**
 * Development seed data (spec §75).
 *
 * Realistic rather than decorative: the history spans months so streaks, the
 * Rabid Score and progression trends have something real to compute over, and
 * screens can be judged with plausible numbers rather than lorem ipsum. It is a
 * development fixture only — spec §75 is explicit that fake users never ship to
 * production.
 */

export const SEED_TODAY = '2026-03-06';
export const SEED_USER_ID = 'user-seed-1';

export const seedProfile: Profile = {
  id: SEED_USER_ID,
  displayName: 'Danny Bell',
  handle: 'dbell',
  avatarUrl: null,
  dateOfBirth: '1994-07-18',
  countryCode: 'GB',
  gym: 'Ironworks Gym',
  town: 'Sheffield',
  memberSince: '2025-08-14',
  units: { weight: 'kg', length: 'cm', distance: 'km' },
  isPrivate: false,
};

export const seedTrainingProfile: TrainingProfile = {
  userId: SEED_USER_ID,
  primaryActivity: 'hybrid',
  experience: 'advanced',
  goal: 'improve_strength',
  sessionsPerWeek: 4,
  averageSessionMinutes: 72,
  perceivedIntensity: 4,
  dailyActivityLevel: 'moderately_active',
};

export const seedNutritionProfile: NutritionProfile = {
  userId: SEED_USER_ID,
  sex: 'male',
  ageYears: 31,
  heightCm: 181,
  currentWeightKg: 88.4,
  bodyFatPercent: null,
  activityLevel: 'moderately_active',
  trainingSessionsPerWeek: 4,
  averageSessionMinutes: 72,
  experience: 'advanced',
  goal: 'lose_body_fat',
  targetWeightKg: 82,
  requestedTimeframeWeeks: 14,
  mealsPerDay: 4,
  isPregnant: false,
  isBreastfeeding: false,
  hasEatingDisorderHistory: false,
  hasMedicalCondition: false,
};

export const seedFoodPreferences: FoodPreferences = {
  userId: SEED_USER_ID,
  states: {
    'chicken-breast': 'love_it',
    'lean-beef': 'love_it',
    'basmati-rice': 'love_it',
    'greek-yoghurt': 'love_it',
    oats: 'love_it',
    'sweet-potatoes': 'dont_mind_it',
    salmon: 'dont_mind_it',
    cod: 'keep_it_out',
    'cottage-cheese': 'keep_it_out',
    tempeh: 'keep_it_out',
  },
  allergies: [],
  intolerances: [],
  dietaryRules: [],
  manualExclusions: [],
};

/* ── Workout history ──────────────────────────────────────────────────────
 * Generated rather than hand-written: eighteen weeks of a four-day split, with
 * loads creeping up over time so the progression component of the Rabid Score
 * has a genuine trend to read.
 */

type SessionShape = {
  title: string;
  lifts: Array<{ id: string; name: string; base: number; reps: number[] }>;
};

const SESSION_SHAPES: SessionShape[] = [
  {
    title: 'Push',
    lifts: [
      { id: 'ex-bench-press', name: 'Bench Press', base: 100, reps: [8, 6, 5] },
      { id: 'ex-ohp', name: 'Overhead Press', base: 60, reps: [8, 8, 6] },
      { id: 'ex-incline-db', name: 'Incline Dumbbell Press', base: 32, reps: [10, 10, 8] },
      { id: 'ex-tricep-pushdown', name: 'Tricep Pushdown', base: 40, reps: [12, 12, 12] },
    ],
  },
  {
    title: 'Pull',
    lifts: [
      { id: 'ex-deadlift', name: 'Deadlift', base: 160, reps: [5, 5, 3] },
      { id: 'ex-barbell-row', name: 'Barbell Row', base: 90, reps: [8, 8, 8] },
      { id: 'ex-lat-pulldown', name: 'Lat Pulldown', base: 70, reps: [10, 10, 10] },
      { id: 'ex-barbell-curl', name: 'Barbell Curl', base: 35, reps: [10, 10, 10] },
    ],
  },
  {
    title: 'Legs',
    lifts: [
      { id: 'ex-back-squat', name: 'Back Squat', base: 130, reps: [6, 5, 5] },
      { id: 'ex-romanian-dl', name: 'Romanian Deadlift', base: 110, reps: [8, 8, 8] },
      { id: 'ex-leg-press', name: 'Leg Press', base: 200, reps: [12, 12, 10] },
      { id: 'ex-calf-raise', name: 'Standing Calf Raise', base: 80, reps: [15, 15, 15] },
    ],
  },
  {
    title: 'Conditioning',
    lifts: [
      { id: 'ex-bench-press', name: 'Bench Press', base: 90, reps: [10, 10, 10] },
      { id: 'ex-kb-swing', name: 'Kettlebell Swing', base: 32, reps: [15, 15, 15] },
      { id: 'ex-db-row', name: 'Dumbbell Row', base: 34, reps: [12, 12, 12] },
    ],
  },
];

const TRAINING_DAYS = [1, 2, 4, 5]; // Mon, Tue, Thu, Fri

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Rounded to 2.5 kg — real plate maths, not a smooth curve. */
function progressiveLoad(base: number, weekIndex: number, totalWeeks: number): number {
  const growth = 1 + (weekIndex / totalWeeks) * 0.12;
  return Math.round((base * growth) / 2.5) * 2.5;
}

function buildHistory(weeks: number, endDate: string): Workout[] {
  const workouts: Workout[] = [];
  // Monday of the week containing endDate.
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const offset = end.getUTCDay() === 0 ? 6 : end.getUTCDay() - 1;
  const currentMonday = addDays(endDate, -offset);

  for (let w = 0; w < weeks; w += 1) {
    const weekIndex = weeks - 1 - w;
    const monday = addDays(currentMonday, -w * 7);

    // A missed week 9 weeks back, so the streak logic has a real break to find.
    if (w === 9) continue;

    TRAINING_DAYS.forEach((dayOfWeek, i) => {
      const date = addDays(monday, dayOfWeek - 1);
      if (date > endDate) return;

      const shape = SESSION_SHAPES[(w + i) % SESSION_SHAPES.length]!;
      const startedAt = `${date}T17:30:00.000Z`;
      const durationSeconds = 3900 + ((w * 7 + i) % 5) * 240;

      workouts.push({
        id: `wo-seed-${w}-${i}`,
        userId: SEED_USER_ID,
        title: shape.title,
        status: 'completed',
        startedAt,
        completedAt: `${date}T${18 + (i % 2)}:${(30 + i * 5) % 60 < 10 ? '05' : '45'}:00.000Z`,
        durationSeconds,
        syncState: 'synced',
        exercises: shape.lifts.map((lift, order) => ({
          id: `we-seed-${w}-${i}-${order}`,
          exerciseId: lift.id,
          exerciseName: lift.name,
          metric: 'weight_reps' as const,
          order,
          sets: [
            // One warm-up, then the working sets.
            {
              id: `set-seed-${w}-${i}-${order}-warm`,
              index: 1,
              weightKg: Math.round((progressiveLoad(lift.base, weekIndex, weeks) * 0.5) / 2.5) * 2.5,
              reps: 10,
              durationSeconds: null,
              distanceMeters: null,
              rounds: null,
              rpe: null,
              isWarmup: true,
              completed: true,
              completedAt: startedAt,
            },
            ...lift.reps.map((reps, s) => ({
              id: `set-seed-${w}-${i}-${order}-${s}`,
              index: s + 2,
              weightKg: progressiveLoad(lift.base, weekIndex, weeks),
              reps,
              durationSeconds: null,
              distanceMeters: null,
              rounds: null,
              rpe: s === lift.reps.length - 1 ? 9 : 8,
              isWarmup: false,
              completed: true,
              completedAt: startedAt,
            })),
          ],
        })),
      });
    });
  }

  return workouts.sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''));
}

export const seedWorkouts: Workout[] = buildHistory(18, SEED_TODAY);

export const seedTemplates: WorkoutTemplate[] = SESSION_SHAPES.map((shape, i) => ({
  id: `template-seed-${i}`,
  userId: SEED_USER_ID,
  name: shape.title,
  lastUsedAt: seedWorkouts.find((w) => w.title === shape.title)?.completedAt ?? null,
  exercises: shape.lifts.map((lift) => ({
    exerciseId: lift.id,
    exerciseName: lift.name,
    metric: 'weight_reps' as const,
    targetSets: lift.reps.length,
    targetReps: lift.reps[0],
  })),
}));

/**
 * The PR board is *derived* from the seed history rather than hand-written.
 *
 * A hand-written board drifts the moment the history changes, and a PR board that
 * contradicts the sessions behind it is worse than no fixture at all. Running the
 * real detection engine over the history in order gives a board that is correct by
 * construction, with genuine `previousValue` deltas for the UI to show.
 */
function deriveRecords(workouts: Workout[]): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  let counter = 0;

  for (const workout of workouts) {
    const found = detectWorkoutPRs(workout, records, {
      userId: SEED_USER_ID,
      workoutId: workout.id,
      achievedAt: workout.completedAt ?? workout.startedAt,
      makeId: () => `pr-seed-${(counter += 1)}`,
    });
    records.push(...found);
  }

  return records;
}

export const seedPersonalRecords: PersonalRecord[] = deriveRecords(seedWorkouts);

/** The current best per exercise and type, for the PR Board screen. */
export const seedCurrentRecords: PersonalRecord[] = (() => {
  const best = new Map<string, PersonalRecord>();
  for (const record of seedPersonalRecords) {
    const key = `${record.exerciseId}:${record.type}`;
    const incumbent = best.get(key);
    const better =
      record.type === 'fastest_time'
        ? !incumbent || record.value < incumbent.value
        : !incumbent || record.value > incumbent.value;
    if (better) best.set(key, record);
  }
  return [...best.values()].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));
})();

export const seedContracts: Contract[] = [
  {
    id: 'contract-seed-1', userId: SEED_USER_ID,
    title: '16 sessions in 30 days',
    metric: 'sessions', target: 16, unit: 'sessions',
    startDate: '2026-02-16', endDate: '2026-03-17',
    status: 'active', visibility: 'pack', verification: 'logged',
    createdAt: '2026-02-16T08:00:00.000Z', completedAt: null, failedAt: null,
  },
  {
    id: 'contract-seed-2', userId: SEED_USER_ID,
    title: 'Deadlift 180 kg',
    metric: 'target_lift_kg', target: 180, unit: 'kg',
    exerciseId: 'ex-deadlift', exerciseName: 'Deadlift',
    startDate: '2026-01-05', endDate: '2026-03-30',
    status: 'completed', visibility: 'public', verification: 'logged',
    createdAt: '2026-01-05T08:00:00.000Z',
    completedAt: '2026-03-03T18:20:00.000Z', failedAt: null,
  },
  {
    id: 'contract-seed-3', userId: SEED_USER_ID,
    title: 'Move 120,000 kg in January',
    metric: 'volume_kg', target: 120000, unit: 'kg',
    startDate: '2026-01-01', endDate: '2026-01-31',
    status: 'completed', visibility: 'private', verification: 'logged',
    createdAt: '2026-01-01T08:00:00.000Z',
    completedAt: '2026-01-29T19:10:00.000Z', failedAt: null,
  },
  {
    // Kept deliberately: failed Contracts stay in the record (spec §17).
    id: 'contract-seed-4', userId: SEED_USER_ID,
    title: 'Run 100 km in December',
    metric: 'distance_km', target: 100, unit: 'km',
    startDate: '2025-12-01', endDate: '2025-12-31',
    status: 'failed', visibility: 'private', verification: 'logged',
    createdAt: '2025-12-01T08:00:00.000Z',
    completedAt: null, failedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const seedPack: Pack = {
  id: 'pack-seed-1',
  name: 'Ironworks',
  handle: 'ironworks',
  description: 'Sheffield. Early doors, heavy bars, no excuses.',
  memberCount: 9,
  createdAt: '2025-09-02T10:00:00.000Z',
  isPrivate: false,
  location: 'Sheffield',
};

export const seedPackMembers: PackMember[] = [
  { userId: SEED_USER_ID, packId: 'pack-seed-1', displayName: 'Danny Bell', role: 'admin', joinedAt: '2025-09-02T10:00:00.000Z', workoutsThisWeek: 3, volumeThisWeekKg: 41250, currentStreak: 8, rabidScore: 742 },
  { userId: 'user-2', packId: 'pack-seed-1', displayName: 'Marcus Cole', role: 'owner', joinedAt: '2025-09-02T10:00:00.000Z', workoutsThisWeek: 4, volumeThisWeekKg: 52400, currentStreak: 14, rabidScore: 811 },
  { userId: 'user-3', packId: 'pack-seed-1', displayName: 'Priya Nair', role: 'member', joinedAt: '2025-09-14T10:00:00.000Z', workoutsThisWeek: 4, volumeThisWeekKg: 38900, currentStreak: 11, rabidScore: 776 },
  { userId: 'user-4', packId: 'pack-seed-1', displayName: 'Tom Whitfield', role: 'member', joinedAt: '2025-10-01T10:00:00.000Z', workoutsThisWeek: 2, volumeThisWeekKg: 27600, currentStreak: 3, rabidScore: 604 },
  { userId: 'user-5', packId: 'pack-seed-1', displayName: 'Ade Okafor', role: 'member', joinedAt: '2025-10-19T10:00:00.000Z', workoutsThisWeek: 3, volumeThisWeekKg: 44100, currentStreak: 6, rabidScore: 688 },
  { userId: 'user-6', packId: 'pack-seed-1', displayName: 'Jess Hardy', role: 'member', joinedAt: '2025-11-03T10:00:00.000Z', workoutsThisWeek: 5, volumeThisWeekKg: 31200, currentStreak: 19, rabidScore: 823 },
  { userId: 'user-7', packId: 'pack-seed-1', displayName: 'Owen Price', role: 'member', joinedAt: '2025-11-20T10:00:00.000Z', workoutsThisWeek: 1, volumeThisWeekKg: 12800, currentStreak: 0, rabidScore: 412 },
  { userId: 'user-8', packId: 'pack-seed-1', displayName: 'Nadia Rahman', role: 'member', joinedAt: '2026-01-08T10:00:00.000Z', workoutsThisWeek: 3, volumeThisWeekKg: 22400, currentStreak: 5, rabidScore: 571 },
  { userId: 'user-9', packId: 'pack-seed-1', displayName: 'Callum Reid', role: 'member', joinedAt: '2026-02-02T10:00:00.000Z', workoutsThisWeek: 2, volumeThisWeekKg: 18900, currentStreak: 2, rabidScore: 388 },
];

export const seedPackStats: PackStats = {
  packId: 'pack-seed-1',
  workoutsThisWeek: seedPackMembers.reduce((s, m) => s + m.workoutsThisWeek, 0),
  combinedVolumeKg: seedPackMembers.reduce((s, m) => s + m.volumeThisWeekKg, 0),
  activeStreaks: seedPackMembers.filter((m) => m.currentStreak > 0).length,
  prsThisWeek: 6,
  attendance: seedPackMembers.filter((m) => m.workoutsThisWeek > 0).length / seedPackMembers.length,
};

export const seedLeaderboard: LeaderboardEntry[] = [...seedPackMembers]
  .sort((a, b) => b.rabidScore - a.rabidScore)
  .map((member, i) => ({
    userId: member.userId,
    displayName: member.displayName,
    packName: 'Ironworks',
    rank: i + 1,
    value: member.rabidScore,
    change: [0, 2, -1, 1, 0, 3, -2, 1, 0][i] ?? 0,
    isCurrentUser: member.userId === SEED_USER_ID,
  }));

export const seedYardPosts: YardPost[] = [
  { id: 'yard-1', userId: 'user-6', displayName: 'Jess Hardy', type: 'contract_completed', headline: 'Completed a Contract', detail: '20 sessions in 30 days. Finished four days early.', createdAt: '2026-03-06T07:12:00.000Z', reactionCount: 14, commentCount: 3, reactedByMe: false },
  { id: 'yard-2', userId: SEED_USER_ID, displayName: 'Danny Bell', type: 'personal_record', headline: 'Deadlift PR', detail: '180 kg x 3. Up 5 kg.', createdAt: '2026-03-03T18:22:00.000Z', reactionCount: 21, commentCount: 5, reactedByMe: false },
  { id: 'yard-3', userId: 'user-2', displayName: 'Marcus Cole', type: 'fight_announced', headline: 'Fight booked', detail: 'Leeds, 18 April. Camp starts Monday.', createdAt: '2026-03-02T20:40:00.000Z', reactionCount: 33, commentCount: 11, reactedByMe: true },
  { id: 'yard-4', userId: 'user-3', displayName: 'Priya Nair', type: 'workout_completed', headline: 'Logged the work', detail: 'Legs. 18 sets, 24,400 kg.', createdAt: '2026-03-02T19:05:00.000Z', reactionCount: 7, commentCount: 0, reactedByMe: false },
  { id: 'yard-5', userId: 'user-5', displayName: 'Ade Okafor', type: 'personal_record', headline: 'Back Squat PR', detail: '160 kg x 5. First time at that weight.', createdAt: '2026-03-01T11:30:00.000Z', reactionCount: 18, commentCount: 4, reactedByMe: false },
  { id: 'yard-6', userId: 'user-4', displayName: 'Tom Whitfield', type: 'progress_milestone', headline: '100 sessions logged', detail: 'Since October.', createdAt: '2026-02-28T18:00:00.000Z', reactionCount: 12, commentCount: 2, reactedByMe: false },
];

export const seedFightCamp: FightCamp = {
  id: 'camp-seed-1',
  userId: 'user-2',
  opponent: 'D. Ferreira',
  discipline: 'boxing',
  fightDate: '2026-04-18',
  campStartDate: '2026-02-22',
  targetWeightKg: 77,
  currentWeightKg: 80.2,
  plannedWeeklySessions: 9,
  sessionsCompleted: 42,
  sparringRounds: 76,
  bagRounds: 148,
  padRounds: 96,
  roadworkKm: 84,
  strengthSessions: 14,
  conditioningSessions: 18,
  recoverySessions: 6,
};

export const seedBodyMetrics: BodyMetric[] = [
  { id: 'bm-1', userId: SEED_USER_ID, kind: 'weight', value: 91.2, recordedOn: '2026-01-05' },
  { id: 'bm-2', userId: SEED_USER_ID, kind: 'weight', value: 90.6, recordedOn: '2026-01-12' },
  { id: 'bm-3', userId: SEED_USER_ID, kind: 'weight', value: 90.4, recordedOn: '2026-01-19' },
  { id: 'bm-4', userId: SEED_USER_ID, kind: 'weight', value: 89.8, recordedOn: '2026-01-26' },
  { id: 'bm-5', userId: SEED_USER_ID, kind: 'weight', value: 89.9, recordedOn: '2026-02-02' },
  { id: 'bm-6', userId: SEED_USER_ID, kind: 'weight', value: 89.3, recordedOn: '2026-02-09' },
  { id: 'bm-7', userId: SEED_USER_ID, kind: 'weight', value: 88.9, recordedOn: '2026-02-16' },
  { id: 'bm-8', userId: SEED_USER_ID, kind: 'weight', value: 88.8, recordedOn: '2026-02-23' },
  { id: 'bm-9', userId: SEED_USER_ID, kind: 'weight', value: 88.4, recordedOn: '2026-03-02' },
  { id: 'bm-10', userId: SEED_USER_ID, kind: 'waist', value: 86, recordedOn: '2026-03-02' },
  { id: 'bm-11', userId: SEED_USER_ID, kind: 'chest', value: 108, recordedOn: '2026-03-02' },
  { id: 'bm-12', userId: SEED_USER_ID, kind: 'arm_left', value: 40.5, recordedOn: '2026-03-02' },
];
