/**
 * Local JSON store.
 *
 * The zero-setup backend for a single user. Everything lives in one file under
 * NEXUS_DATA_DIR so it can be backed up by copying it, and inspected by reading
 * it.
 *
 * Writes are serialised through a promise chain. Node is single-threaded and
 * this is a single-user tool, so a queue is sufficient to stop two concurrent
 * requests writing over each other's snapshot.
 */

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { getServerEnv } from "../lib/env";
import {
  EMPTY_IDENTITY,
  type EngineStore,
  type IdentityRecord,
  type StoredFeedbackEvent,
  type StoredPost,
  type StoredVersion,
  type VersionSource,
} from "./types";
import {
  voiceProfileSchema,
  type VoiceProfile,
  DEFAULT_VOICE_PROFILE,
} from "../schemas/voice";
import type { Offer } from "../schemas/offer";
import type { FeedbackExtraction } from "../schemas/feedback";
import type { GeneratePostResult } from "../pipeline/generate-post";
import type { PastPostSummary, RetrievedItem } from "../agents/types";

interface Snapshot {
  version: 1;
  identity: IdentityRecord;
  voiceProfile: VoiceProfile;
  offer: Offer | null;
  posts: StoredPost[];
  versions: Record<string, StoredVersion[]>;
  feedback: StoredFeedbackEvent[];
}

/**
 * A fresh empty snapshot.
 *
 * This must be a factory, not a shared constant. A spread of a constant is a
 * shallow copy, so every store instance would end up pushing into the same
 * `posts` array and writes would leak between them.
 */
function emptySnapshot(): Snapshot {
  return {
    version: 1,
    identity: { ...EMPTY_IDENTITY, beliefs: [] },
    voiceProfile: { ...DEFAULT_VOICE_PROFILE },
    offer: null,
    posts: [],
    versions: {},
    feedback: [],
  };
}

/**
 * Newest first, with a deterministic tiebreak.
 *
 * Two posts written in the same millisecond tie on createdAt, and a stable sort
 * then falls back to insertion order, which is the wrong way round for a
 * newest-first list. Posts are appended, so a later array index means a later
 * post.
 */
function newestFirst(posts: readonly StoredPost[]): StoredPost[] {
  return posts
    .map((post, index) => ({ post, index }))
    .sort(
      (a, b) =>
        b.post.createdAt.localeCompare(a.post.createdAt) || b.index - a.index,
    )
    .map((entry) => entry.post);
}

export class LocalStore implements EngineStore {
  readonly kind = "local" as const;
  readonly supportsSemanticRetrieval = false;

  private readonly file: string;
  /** Serialises writes so concurrent requests cannot clobber each other. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(dataDir?: string) {
    const dir = dataDir ?? getServerEnv().NEXUS_DATA_DIR;
    this.file = resolve(join(dir, "nexus.json"));
  }

  private async read(): Promise<Snapshot> {
    try {
      const raw = await readFile(this.file, "utf8");
      const parsed = JSON.parse(raw) as Partial<Snapshot>;
      return {
        ...emptySnapshot(),
        ...parsed,
        // A file written by an older version may be missing fields.
        voiceProfile: voiceProfileSchema.parse(parsed.voiceProfile ?? {}),
        identity: { ...EMPTY_IDENTITY, ...(parsed.identity ?? {}) },
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptySnapshot();
      throw error;
    }
  }

  /** Read, mutate, write atomically with respect to other calls on this store. */
  private mutate<T>(fn: (snapshot: Snapshot) => T | Promise<T>): Promise<T> {
    const next = this.queue.then(async () => {
      const snapshot = await this.read();
      const outcome = await fn(snapshot);
      await mkdir(dirname(this.file), { recursive: true });
      // Write to a temporary file and rename, so an interrupted write cannot
      // leave a truncated JSON file behind.
      const temporary = `${this.file}.tmp`;
      await writeFile(temporary, JSON.stringify(snapshot, null, 2), "utf8");
      await rename(temporary, this.file);
      return outcome;
    });

    this.queue = next.catch(() => undefined);
    return next;
  }

  async loadIdentity(_userId: string): Promise<IdentityRecord> {
    return (await this.read()).identity;
  }

  async saveIdentity(_userId: string, identity: IdentityRecord): Promise<void> {
    await this.mutate((snapshot) => {
      snapshot.identity = identity;
    });
  }

  async loadVoiceProfile(_userId: string): Promise<VoiceProfile> {
    return (await this.read()).voiceProfile;
  }

  async saveVoiceProfile(_userId: string, profile: VoiceProfile): Promise<void> {
    await this.mutate((snapshot) => {
      snapshot.voiceProfile = profile;
    });
  }

  async loadOffer(_userId: string): Promise<Offer | null> {
    return (await this.read()).offer;
  }

  async saveOffer(_userId: string, offer: Offer | null): Promise<void> {
    await this.mutate((snapshot) => {
      snapshot.offer = offer;
    });
  }

  async recentPosts(_userId: string, limit = 10): Promise<PastPostSummary[]> {
    const snapshot = await this.read();
    return newestFirst(snapshot.posts)
      .slice(0, limit)
      .map((post) => ({
        id: post.id,
        topic: post.topic,
        frameworkId: post.frameworkId,
        hookFamily: post.hookFamily,
        hook: post.selectedHook,
        contentPillar: post.contentPillar,
        ctaType: "",
        ...(post.publishedAt ? { publishedAt: post.publishedAt } : {}),
      }));
  }

  async listPosts(_userId: string, limit = 50): Promise<StoredPost[]> {
    const snapshot = await this.read();
    return newestFirst(snapshot.posts).slice(0, limit);
  }

  async getPost(_userId: string, postId: string): Promise<StoredPost | null> {
    const snapshot = await this.read();
    return snapshot.posts.find((post) => post.id === postId) ?? null;
  }

  async getVersions(_userId: string, postId: string): Promise<StoredVersion[]> {
    const snapshot = await this.read();
    return snapshot.versions[postId] ?? [];
  }

  /**
   * Editorial preferences, repetition first.
   *
   * A preference expressed five times outranks a one-off correction. That is the
   * difference between "the user cut a sentence once" and "the user always cuts
   * this kind of sentence".
   */
  async feedbackPreferences(_userId: string, limit = 12): Promise<string[]> {
    const snapshot = await this.read();
    if (!snapshot.feedback.length) return [];

    const ordered = snapshot.feedback
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const frequency = new Map<string, number>();
    for (const event of ordered) {
      for (const tag of event.tags) {
        frequency.set(tag, (frequency.get(tag) ?? 0) + 1);
      }
    }

    const seen = new Set<string>();
    return ordered
      .map((event, index) => ({
        summary: event.reasonSummary,
        score:
          event.tags.reduce((total, tag) => total + (frequency.get(tag) ?? 0), 0) * 2 +
          (1 - index / ordered.length),
      }))
      .sort((a, b) => b.score - a.score)
      .filter((entry) => {
        if (!entry.summary || seen.has(entry.summary)) return false;
        seen.add(entry.summary);
        return true;
      })
      .slice(0, limit)
      .map((entry) => entry.summary);
  }

  /** Not available without pgvector. Returns nothing rather than faking it. */
  async similarPosts(
    _userId: string,
    _idea: string,
    _limit?: number,
  ): Promise<RetrievedItem[]> {
    return [];
  }

  async searchKnowledge(
    _userId: string,
    _query: string,
    _limit?: number,
  ): Promise<RetrievedItem[]> {
    return [];
  }

  async savePostRun(_userId: string, result: GeneratePostResult): Promise<string> {
    const id = randomUUID();
    const now = new Date().toISOString();

    return this.mutate((snapshot) => {
      const post: StoredPost = {
        id,
        topic: result.analysis.topic,
        coreClaim: result.analysis.core_claim,
        contentPillar: result.analysis.content_pillars[0] ?? "",
        frameworkId: result.analysis.recommended_framework,
        frameworkRationale: result.analysis.framework_rationale,
        hookFamily: result.selectedHook?.hook_family ?? "",
        selectedHook: result.selectedHook?.text ?? "",
        draftText: result.draft ?? "",
        finalText: null,
        status: result.state,
        researchRequired: result.analysis.research_required,
        criticScore: result.criticReport?.score ?? null,
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
      };

      snapshot.posts.push(post);

      if (result.draft) {
        snapshot.versions[id] = [
          {
            versionNumber: 1,
            text: result.draft,
            source: result.revisionCount > 0 ? "ai_revision" : "ai_draft",
            createdAt: now,
          },
        ];
      }

      return id;
    });
  }

  async appendVersion(
    _userId: string,
    postId: string,
    text: string,
    source: VersionSource,
  ): Promise<number> {
    return this.mutate((snapshot) => {
      const existing = snapshot.versions[postId] ?? [];
      const versionNumber = existing.length + 1;
      existing.push({
        versionNumber,
        text,
        source,
        createdAt: new Date().toISOString(),
      });
      snapshot.versions[postId] = existing;
      return versionNumber;
    });
  }

  async updatePost(
    _userId: string,
    postId: string,
    changes: Partial<StoredPost>,
  ): Promise<void> {
    await this.mutate((snapshot) => {
      const post = snapshot.posts.find((entry) => entry.id === postId);
      if (!post) throw new Error(`Unknown post: ${postId}`);
      Object.assign(post, changes, { updatedAt: new Date().toISOString() });
    });
  }

  async saveFeedback(
    _userId: string,
    postId: string,
    userVersion: string,
    extraction: FeedbackExtraction,
    updatedProfile: VoiceProfile,
  ): Promise<void> {
    const now = new Date().toISOString();

    await this.mutate((snapshot) => {
      const versions = snapshot.versions[postId] ?? [];
      versions.push({
        versionNumber: versions.length + 1,
        text: userVersion,
        source: "user_edit",
        createdAt: now,
      });
      snapshot.versions[postId] = versions;

      for (const event of extraction.events) {
        snapshot.feedback.push({
          id: randomUUID(),
          postId,
          feedbackType: event.feedback_type,
          originalText: event.original_text,
          replacementText: event.replacement_text,
          reasonSummary: event.reason_summary,
          tags: event.tags,
          createdAt: now,
        });
      }

      const post = snapshot.posts.find((entry) => entry.id === postId);
      if (post) {
        post.finalText = userVersion;
        post.updatedAt = now;
      }

      snapshot.voiceProfile = updatedProfile;
    });
  }
}
