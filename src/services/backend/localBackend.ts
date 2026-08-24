import type { BackendClient, SyncResult } from './types';
import type {
  BodyMetric, Contract, LeaderboardEntry, MealPlan, Pack, PackMember,
  PackStats, PersonalRecord, Profile, RabidScore, Workout, YardPost,
} from '@/types';
import {
  SEED_USER_ID, seedBodyMetrics, seedContracts, seedCurrentRecords, seedLeaderboard,
  seedPack, seedPackMembers, seedPackStats, seedProfile, seedWorkouts, seedYardPosts,
  seedPersonalRecords, SEED_TODAY,
} from '@/data/seed';
import { calculateRabidScore } from '@/engines/scoring/rabidScore';
import { calculateProgress } from '@/engines/training/contracts';

/**
 * In-memory backend, used until Supabase is wired up.
 *
 * It implements the real interface against seed data so every screen is built
 * and reviewed against realistic shapes and latencies. Server-authoritative
 * values — the Rabid Score, Contract statuses — are computed here with the same
 * engines the server will run, so swapping in the Supabase client is a change of
 * transport rather than a change of behaviour.
 */
export class LocalBackend implements BackendClient {
  readonly name = 'local-memory';

  private workouts = [...seedWorkouts];
  private contracts = [...seedContracts];
  private metrics = [...seedBodyMetrics];
  private plans = new Map<string, MealPlan>();
  private posts = [...seedYardPosts];

  async getProfile(userId: string): Promise<Profile | null> {
    return userId === SEED_USER_ID ? seedProfile : null;
  }

  async updateProfile(_userId: string, patch: Partial<Profile>): Promise<Profile> {
    return { ...seedProfile, ...patch };
  }

  async deleteAccount(): Promise<void> {
    this.workouts = [];
    this.contracts = [];
    this.metrics = [];
    this.plans.clear();
  }

  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    return {
      profile: await this.getProfile(userId),
      workouts: this.workouts,
      contracts: this.contracts,
      bodyMetrics: this.metrics,
      mealPlans: [...this.plans.values()],
      exportedAt: new Date().toISOString(),
    };
  }

  async listWorkouts(
    _userId: string,
    options: { from?: string; to?: string; limit?: number } = {},
  ): Promise<Workout[]> {
    let results = this.workouts.filter((w) => w.status === 'completed');

    if (options.from) results = results.filter((w) => (w.completedAt ?? '') >= options.from!);
    if (options.to) results = results.filter((w) => (w.completedAt ?? '') <= options.to!);

    results = results.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
    return options.limit ? results.slice(0, options.limit) : results;
  }

  async syncWorkouts(workouts: Workout[]): Promise<SyncResult> {
    const synced: string[] = [];
    for (const workout of workouts) {
      const index = this.workouts.findIndex((w) => w.id === workout.id);
      const stored = { ...workout, syncState: 'synced' as const };
      if (index >= 0) this.workouts[index] = stored;
      else this.workouts.push(stored);
      synced.push(workout.id);
    }
    return { synced, failed: [] };
  }

  async listPersonalRecords(): Promise<PersonalRecord[]> {
    return seedCurrentRecords;
  }

  async listContracts(): Promise<Contract[]> {
    return this.contracts;
  }

  async createContract(contract: Contract): Promise<Contract> {
    this.contracts.push(contract);
    return contract;
  }

  /** Statuses are recomputed from logged work, exactly as the server will. */
  async refreshContractStatuses(): Promise<Contract[]> {
    this.contracts = this.contracts.map((contract) => {
      if (contract.status !== 'active') return contract;

      const progress = calculateProgress(contract, this.workouts, SEED_TODAY);
      if (progress.status === 'completed') {
        return { ...contract, status: 'completed', completedAt: new Date().toISOString() };
      }
      if (progress.status === 'failed') {
        return { ...contract, status: 'failed', failedAt: new Date().toISOString() };
      }
      return contract;
    });
    return this.contracts;
  }

  async listPacks(): Promise<Pack[]> {
    return [seedPack];
  }

  async getPack(packId: string): Promise<Pack | null> {
    return packId === seedPack.id ? seedPack : null;
  }

  async listPackMembers(): Promise<PackMember[]> {
    return seedPackMembers;
  }

  async getPackStats(): Promise<PackStats> {
    return seedPackStats;
  }

  async joinPack(): Promise<void> {}
  async leavePack(): Promise<void> {}

  async getLeaderboard(options: { limit?: number }): Promise<LeaderboardEntry[]> {
    return options.limit ? seedLeaderboard.slice(0, options.limit) : seedLeaderboard;
  }

  async getRabidScore(userId: string): Promise<RabidScore> {
    return calculateRabidScore({
      userId,
      workouts: this.workouts,
      contracts: this.contracts,
      personalRecords: seedPersonalRecords,
      challengesCompleted: 2,
      challengesJoined: 3,
      weeklyTarget: 4,
      today: SEED_TODAY,
    });
  }

  async listYardPosts(options: { limit?: number } = {}): Promise<YardPost[]> {
    return options.limit ? this.posts.slice(0, options.limit) : this.posts;
  }

  async reactToPost(postId: string): Promise<void> {
    this.posts = this.posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            reactedByMe: !post.reactedByMe,
            reactionCount: post.reactionCount + (post.reactedByMe ? -1 : 1),
          }
        : post,
    );
  }

  async reportPost(): Promise<void> {}
  async blockUser(): Promise<void> {}

  async listBodyMetrics(): Promise<BodyMetric[]> {
    return [...this.metrics].sort((a, b) => b.recordedOn.localeCompare(a.recordedOn));
  }

  async recordBodyMetric(metric: BodyMetric): Promise<void> {
    this.metrics.push(metric);
  }

  async getMealPlan(userId: string, weekStarting: string): Promise<MealPlan | null> {
    return this.plans.get(`${userId}:${weekStarting}`) ?? null;
  }

  async saveMealPlan(plan: MealPlan): Promise<void> {
    this.plans.set(`${plan.userId}:${plan.weekStarting}`, plan);
  }
}

export const backend: BackendClient = new LocalBackend();
