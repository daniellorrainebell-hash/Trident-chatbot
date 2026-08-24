import type {
  BodyMetric,
  Contract,
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardScope,
  MealPlan,
  Pack,
  PackMember,
  PackStats,
  PersonalRecord,
  Profile,
  RabidScore,
  Workout,
  YardPost,
} from '@/types';

/**
 * Backend interface (spec §5: Supabase, §61: security).
 *
 * The app talks to this, not to a Supabase client. Two reasons: the vendor stays
 * swappable, and the boundary is somewhere the security rules can be stated once.
 *
 * Note what is absent. There is no `submitScore`, no `setContractComplete` and no
 * `approveNutritionTarget`. Those are server-computed, because a client that can
 * assert its own Rabid Score or Contract completion is a client that can cheat
 * (spec §61). The client reads them; it never writes them.
 *
 * The service-role key never reaches the device. Anything needing elevated rights
 * goes through an Edge Function behind Row Level Security.
 */

export type SyncResult = {
  synced: string[];
  failed: Array<{ id: string; error: string }>;
};

export interface BackendClient {
  readonly name: string;

  // ── Profile ───────────────────────────────────────────────────────────
  getProfile(userId: string): Promise<Profile | null>;
  updateProfile(userId: string, patch: Partial<Profile>): Promise<Profile>;
  /** Full erasure, not a soft delete (spec §60). */
  deleteAccount(userId: string): Promise<void>;
  /** Machine-readable export of everything held about the user (spec §60). */
  exportUserData(userId: string): Promise<Record<string, unknown>>;

  // ── Training ──────────────────────────────────────────────────────────
  listWorkouts(userId: string, options?: { from?: string; to?: string; limit?: number }): Promise<Workout[]>;
  /** Batch upload of queued offline sessions (spec §13). */
  syncWorkouts(workouts: Workout[]): Promise<SyncResult>;
  /** Server-detected, so the PR board cannot be forged from the client. */
  listPersonalRecords(userId: string): Promise<PersonalRecord[]>;

  // ── Contracts ─────────────────────────────────────────────────────────
  listContracts(userId: string): Promise<Contract[]>;
  createContract(contract: Contract): Promise<Contract>;
  /** Status is resolved server-side from logged work, never asserted by the client. */
  refreshContractStatuses(userId: string): Promise<Contract[]>;

  // ── Packs and competition ─────────────────────────────────────────────
  listPacks(userId: string): Promise<Pack[]>;
  getPack(packId: string): Promise<Pack | null>;
  listPackMembers(packId: string): Promise<PackMember[]>;
  getPackStats(packId: string): Promise<PackStats>;
  joinPack(packId: string, userId: string): Promise<void>;
  leavePack(packId: string, userId: string): Promise<void>;

  getLeaderboard(options: {
    scope: LeaderboardScope;
    category: LeaderboardCategory;
    packId?: string;
    limit?: number;
  }): Promise<LeaderboardEntry[]>;

  /** Computed server-side from a versioned algorithm (spec §21). */
  getRabidScore(userId: string): Promise<RabidScore>;

  // ── The Yard ──────────────────────────────────────────────────────────
  listYardPosts(options: { packId?: string; limit?: number }): Promise<YardPost[]>;
  reactToPost(postId: string, userId: string): Promise<void>;
  reportPost(postId: string, userId: string, reason: string): Promise<void>;
  blockUser(userId: string, blockedUserId: string): Promise<void>;

  // ── Body and nutrition ────────────────────────────────────────────────
  listBodyMetrics(userId: string): Promise<BodyMetric[]>;
  recordBodyMetric(metric: BodyMetric): Promise<void>;
  /** Private by default; readable only by its owner under RLS (spec §63). */
  getMealPlan(userId: string, weekStarting: string): Promise<MealPlan | null>;
  saveMealPlan(plan: MealPlan): Promise<void>;
}

/** Thrown for anything the backend rejects, so callers handle one error shape. */
export class BackendError extends Error {
  constructor(
    message: string,
    readonly code: 'unauthorised' | 'not_found' | 'conflict' | 'network' | 'server',
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'BackendError';
  }
}
