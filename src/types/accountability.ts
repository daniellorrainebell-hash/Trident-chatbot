import type { IsoDate, IsoDateTime, Uuid } from './units';

/**
 * Contracts (spec §17) — a measurable promise, with a deadline.
 *
 * The whole feature rests on one rule: a failed Contract stays in history.
 * Deleting one is not a supported action anywhere in the app.
 */
export type ContractMetric =
  | 'sessions'          // count of completed workouts
  | 'volume_kg'         // total working volume
  | 'distance_km'       // running / roadwork
  | 'conditioning_sessions'
  | 'target_lift_kg'    // hit a given weight on a given exercise
  | 'fight_camp_sessions';

export type ContractStatus = 'draft' | 'active' | 'completed' | 'failed';

export type ContractVisibility = 'private' | 'pack' | 'public';

/** How progress is credited. V1 is `logged` only; the rest are V1.5+ (spec §69). */
export type VerificationMode = 'logged' | 'photo' | 'gps' | 'wearable';

export type Contract = {
  id: Uuid;
  userId: Uuid;
  title: string;
  metric: ContractMetric;
  /** The number that must be reached. Unit implied by `metric`. */
  target: number;
  unit: string;
  startDate: IsoDate;
  endDate: IsoDate;
  status: ContractStatus;
  visibility: ContractVisibility;
  verification: VerificationMode;
  /** Only for target_lift_kg. */
  exerciseId?: Uuid;
  exerciseName?: string;
  createdAt: IsoDateTime;
  completedAt: IsoDateTime | null;
  /** Set when the deadline passes short of target. Never cleared. */
  failedAt: IsoDateTime | null;
};

export type ContractProgress = {
  contractId: Uuid;
  current: number;
  target: number;
  /** 0–1, clamped. */
  fraction: number;
  daysRemaining: number;
  /** Units still needed. Zero once the target is met. */
  remaining: number;
  /** Per-day rate needed from today to finish on time. Null once complete. */
  requiredDailyRate: number | null;
  /** True when the current pace lands short of target. Drives the nudge copy. */
  offPace: boolean;
  status: ContractStatus;
};

export type PackRole = 'owner' | 'admin' | 'member';

export type Pack = {
  id: Uuid;
  name: string;
  handle: string;
  description: string;
  memberCount: number;
  createdAt: IsoDateTime;
  isPrivate: boolean;
  /** Optional home gym / town, used for leaderboard scoping. */
  location?: string;
};

export type PackMember = {
  userId: Uuid;
  packId: Uuid;
  displayName: string;
  role: PackRole;
  joinedAt: IsoDateTime;
  workoutsThisWeek: number;
  volumeThisWeekKg: number;
  currentStreak: number;
  rabidScore: number;
};

export type PackStats = {
  packId: Uuid;
  workoutsThisWeek: number;
  combinedVolumeKg: number;
  activeStreaks: number;
  prsThisWeek: number;
  /** Share of members who logged at least one session this week, 0–1. */
  attendance: number;
};

export type LeaderboardScope = 'friends' | 'pack' | 'gym' | 'town' | 'uk' | 'global';

/**
 * Spec §20: never rank incompatible training types against each other. A
 * marathoner and a powerlifter do not belong on one list, so the board is
 * always scoped by category as well as reach.
 */
export type LeaderboardCategory =
  | 'workouts'
  | 'volume'
  | 'distance'
  | 'prs'
  | 'streak'
  | 'contracts_completed'
  | 'rabid_score';

export type LeaderboardEntry = {
  userId: Uuid;
  displayName: string;
  packName?: string;
  rank: number;
  value: number;
  /** Rank movement since the last period. Positive means climbed. */
  change: number;
  isCurrentUser: boolean;
};

export type RabidLevel = 'stray' | 'mutt' | 'hound' | 'feral' | 'rabid';

export type RabidScoreBreakdown = {
  consistency: number;
  contracts: number;
  frequency: number;
  progression: number;
  personalRecords: number;
  challenges: number;
  /** Negative. Applied after a dormant stretch. */
  inactivityPenalty: number;
};

export type RabidScore = {
  userId: Uuid;
  total: number;
  level: RabidLevel;
  breakdown: RabidScoreBreakdown;
  /** Which algorithm produced this. Stored so old scores stay explainable. */
  version: number;
  calculatedAt: IsoDateTime;
};

export type YardActivityType =
  | 'workout_completed' | 'personal_record' | 'contract_completed'
  | 'challenge_completed' | 'fight_camp_milestone' | 'fight_announced'
  | 'fight_result' | 'pack_result' | 'progress_milestone';

export type YardPost = {
  id: Uuid;
  userId: Uuid;
  displayName: string;
  type: YardActivityType;
  headline: string;
  detail?: string;
  createdAt: IsoDateTime;
  reactionCount: number;
  commentCount: number;
  reactedByMe: boolean;
};

export type FightDiscipline = 'boxing' | 'mma' | 'kickboxing' | 'muay_thai' | 'other';

export type FightCamp = {
  id: Uuid;
  userId: Uuid;
  opponent?: string;
  discipline: FightDiscipline;
  fightDate: IsoDate;
  campStartDate: IsoDate;
  targetWeightKg: number;
  currentWeightKg: number;
  plannedWeeklySessions: number;
  sessionsCompleted: number;
  sparringRounds: number;
  bagRounds: number;
  padRounds: number;
  roadworkKm: number;
  strengthSessions: number;
  conditioningSessions: number;
  recoverySessions: number;
};
