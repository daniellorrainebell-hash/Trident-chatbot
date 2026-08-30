/**
 * Storage interface.
 *
 * Two implementations: Supabase for a real deployment, and a local JSON file for
 * a single user who has not stood up a database. Everything above this layer is
 * written against the interface, so the engine behaves the same either way.
 *
 * The one honest difference is semantic retrieval. That needs pgvector, so the
 * local store returns nothing from `similarPosts` and `searchKnowledge` rather
 * than faking a similarity score. The UI reports which store is active so this
 * is never a silent downgrade.
 */

import type { PastPostSummary, RetrievedItem } from "../agents/types";
import type { VoiceProfile, Offer } from "../schemas";
import type { FeedbackExtraction } from "../schemas/feedback";
import type { GeneratePostResult } from "../pipeline/generate-post";
import type { PostState } from "../pipeline/state-machine";

export type VersionSource = "ai_draft" | "ai_revision" | "user_edit" | "final";

export interface IdentityRecord {
  bio: string;
  expertise: string;
  targetAudience: string;
  positioning: string;
  offers: string;
  goals: string;
  /** Genuine beliefs, from onboarding step 2. Used by belief and opinion posts. */
  beliefs: string[];
}

export const EMPTY_IDENTITY: IdentityRecord = {
  bio: "",
  expertise: "",
  targetAudience: "",
  positioning: "",
  offers: "",
  goals: "",
  beliefs: [],
};

export interface StoredVersion {
  versionNumber: number;
  text: string;
  source: VersionSource;
  createdAt: string;
}

export interface StoredPost {
  id: string;
  topic: string;
  coreClaim: string;
  contentPillar: string;
  frameworkId: string;
  frameworkRationale: string;
  hookFamily: string;
  selectedHook: string;
  draftText: string;
  finalText: string | null;
  status: PostState;
  researchRequired: boolean;
  criticScore: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface StoredFeedbackEvent {
  id: string;
  postId: string;
  feedbackType: string;
  originalText: string | null;
  replacementText: string | null;
  reasonSummary: string;
  tags: string[];
  createdAt: string;
}

export interface EngineStore {
  /** Which backend is active. Surfaced in the UI. */
  readonly kind: "supabase" | "local";
  /** True when semantic retrieval is available. */
  readonly supportsSemanticRetrieval: boolean;

  loadIdentity(userId: string): Promise<IdentityRecord>;
  saveIdentity(userId: string, identity: IdentityRecord): Promise<void>;

  loadVoiceProfile(userId: string): Promise<VoiceProfile>;
  saveVoiceProfile(userId: string, profile: VoiceProfile): Promise<void>;

  loadOffer(userId: string): Promise<Offer | null>;
  saveOffer(userId: string, offer: Offer | null): Promise<void>;

  recentPosts(userId: string, limit?: number): Promise<PastPostSummary[]>;
  listPosts(userId: string, limit?: number): Promise<StoredPost[]>;
  getPost(userId: string, postId: string): Promise<StoredPost | null>;
  getVersions(userId: string, postId: string): Promise<StoredVersion[]>;

  feedbackPreferences(userId: string, limit?: number): Promise<string[]>;
  similarPosts(userId: string, idea: string, limit?: number): Promise<RetrievedItem[]>;
  searchKnowledge(userId: string, query: string, limit?: number): Promise<RetrievedItem[]>;

  savePostRun(userId: string, result: GeneratePostResult): Promise<string>;
  appendVersion(
    userId: string,
    postId: string,
    text: string,
    source: VersionSource,
  ): Promise<number>;
  updatePost(
    userId: string,
    postId: string,
    changes: Partial<Pick<StoredPost, "draftText" | "finalText" | "status" | "publishedAt">>,
  ): Promise<void>;
  saveFeedback(
    userId: string,
    postId: string,
    userVersion: string,
    extraction: FeedbackExtraction,
    updatedProfile: VoiceProfile,
  ): Promise<void>;
}

/** Render an identity record as prompt context. */
export function renderIdentity(identity: IdentityRecord): string {
  const fields: Array<[string, string]> = [
    ["Bio", identity.bio],
    ["Expertise", identity.expertise],
    ["Target audience", identity.targetAudience],
    ["Positioning", identity.positioning],
    ["Offers", identity.offers],
    ["Goals", identity.goals],
  ];

  const lines = fields
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}: ${value}`);

  if (identity.beliefs.length) {
    lines.push(
      `Beliefs this user genuinely holds (use these, do not invent new ones):\n${identity.beliefs
        .map((belief) => `  - ${belief}`)
        .join("\n")}`,
    );
  }

  return lines.join("\n");
}
