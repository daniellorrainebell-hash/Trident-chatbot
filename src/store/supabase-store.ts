/**
 * Supabase store.
 *
 * The full backend. Adds semantic retrieval over previous posts and the
 * knowledge base, which is the one capability the local store cannot provide.
 */

import { getServiceClient } from "../lib/supabase";
import { embed, toVectorLiteral } from "../retrieval/embeddings";
import {
  EMPTY_IDENTITY,
  type EngineStore,
  type IdentityRecord,
  type StoredPost,
  type StoredVersion,
  type VersionSource,
} from "./types";
import { voiceProfileSchema, type VoiceProfile } from "../schemas/voice";
import { offerSchema, type Offer } from "../schemas/offer";
import type { FeedbackExtraction } from "../schemas/feedback";
import type { GeneratePostResult } from "../pipeline/generate-post";
import type { PastPostSummary, RetrievedItem } from "../agents/types";

export class SupabaseStore implements EngineStore {
  readonly kind = "supabase" as const;
  readonly supportsSemanticRetrieval = true;

  async loadIdentity(userId: string): Promise<IdentityRecord> {
    const { data, error } = await getServiceClient()
      .from("profiles")
      .select("bio, expertise, target_audience, positioning, offers, goals, voice_profile_json")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(`Failed to load profile: ${error.message}`);
    if (!data) return EMPTY_IDENTITY;

    const beliefs =
      ((data.voice_profile_json as Record<string, unknown> | null)?.beliefs as string[]) ?? [];

    return {
      bio: (data.bio as string) ?? "",
      expertise: (data.expertise as string) ?? "",
      targetAudience: (data.target_audience as string) ?? "",
      positioning: (data.positioning as string) ?? "",
      offers: (data.offers as string) ?? "",
      goals: (data.goals as string) ?? "",
      beliefs,
    };
  }

  async saveIdentity(userId: string, identity: IdentityRecord): Promise<void> {
    const { error } = await getServiceClient().from("profiles").upsert(
      {
        user_id: userId,
        bio: identity.bio,
        expertise: identity.expertise,
        target_audience: identity.targetAudience,
        positioning: identity.positioning,
        offers: identity.offers,
        goals: identity.goals,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) throw new Error(`Failed to save profile: ${error.message}`);
  }

  async loadVoiceProfile(userId: string): Promise<VoiceProfile> {
    const { data, error } = await getServiceClient()
      .from("profiles")
      .select("voice_profile_json")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(`Failed to load voice profile: ${error.message}`);
    return voiceProfileSchema.parse(data?.voice_profile_json ?? {});
  }

  async saveVoiceProfile(userId: string, profile: VoiceProfile): Promise<void> {
    const { error } = await getServiceClient()
      .from("profiles")
      .upsert(
        { user_id: userId, voice_profile_json: profile, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );

    if (error) throw new Error(`Failed to save voice profile: ${error.message}`);
  }

  async loadOffer(userId: string): Promise<Offer | null> {
    const { data, error } = await getServiceClient()
      .from("offers")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Failed to load offer: ${error.message}`);
    if (!data) return null;

    const parsed = offerSchema.safeParse({
      offer_name: data.offer_name,
      avatar: data.avatar ?? "",
      problem: data.problem ?? "",
      dream_outcome: data.dream_outcome ?? "",
      core_deliverables: data.core_deliverables ?? [],
      delivery_mode: data.delivery_mode ?? "DFY",
      time_to_first_value: data.time_to_first_value ?? "",
      client_effort: data.client_effort ?? "",
      proof: data.proof ?? [],
      bonuses: data.bonuses ?? [],
      guarantee: data.guarantee_json ?? null,
      scarcity: data.scarcity_json ?? null,
      urgency: data.urgency_json ?? null,
      price: data.price ?? null,
      cta: data.cta ?? "",
    });

    return parsed.success ? parsed.data : null;
  }

  async saveOffer(userId: string, offer: Offer | null): Promise<void> {
    const supabase = getServiceClient();

    if (!offer) {
      await supabase.from("offers").update({ active: false }).eq("user_id", userId);
      return;
    }

    await supabase.from("offers").update({ active: false }).eq("user_id", userId);

    const { error } = await supabase.from("offers").insert({
      user_id: userId,
      offer_name: offer.offer_name,
      avatar: offer.avatar,
      problem: offer.problem,
      dream_outcome: offer.dream_outcome,
      core_deliverables: offer.core_deliverables,
      delivery_mode: offer.delivery_mode,
      time_to_first_value: offer.time_to_first_value,
      client_effort: offer.client_effort,
      proof: offer.proof,
      bonuses: offer.bonuses,
      guarantee_json: offer.guarantee,
      scarcity_json: offer.scarcity,
      urgency_json: offer.urgency,
      price: offer.price,
      cta: offer.cta,
      active: true,
    });

    if (error) throw new Error(`Failed to save offer: ${error.message}`);
  }

  async recentPosts(userId: string, limit = 10): Promise<PastPostSummary[]> {
    const { data, error } = await getServiceClient()
      .from("posts")
      .select("id, topic, framework_id, hook_family, selected_hook, content_pillar, published_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to retrieve recent posts: ${error.message}`);

    return (data ?? []).map((row) => ({
      id: row.id as string,
      topic: (row.topic as string) ?? "",
      frameworkId: (row.framework_id as string) ?? "",
      hookFamily: (row.hook_family as string) ?? "",
      hook: (row.selected_hook as string) ?? "",
      contentPillar: (row.content_pillar as string) ?? "",
      ctaType: "",
      ...(row.published_at ? { publishedAt: row.published_at as string } : {}),
    }));
  }

  async listPosts(userId: string, limit = 50): Promise<StoredPost[]> {
    const { data, error } = await getServiceClient()
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to list posts: ${error.message}`);
    return (data ?? []).map(mapPost);
  }

  async getPost(userId: string, postId: string): Promise<StoredPost | null> {
    const { data, error } = await getServiceClient()
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .eq("id", postId)
      .maybeSingle();

    if (error) throw new Error(`Failed to load post: ${error.message}`);
    return data ? mapPost(data) : null;
  }

  async getVersions(_userId: string, postId: string): Promise<StoredVersion[]> {
    const { data, error } = await getServiceClient()
      .from("post_versions")
      .select("version_number, text, source, created_at")
      .eq("post_id", postId)
      .order("version_number", { ascending: true });

    if (error) throw new Error(`Failed to load versions: ${error.message}`);

    return (data ?? []).map((row) => ({
      versionNumber: row.version_number as number,
      text: row.text as string,
      source: row.source as VersionSource,
      createdAt: row.created_at as string,
    }));
  }

  async feedbackPreferences(userId: string, limit = 12): Promise<string[]> {
    const { retrieveFeedbackPreferences } = await import("../retrieval/post-memory");
    return retrieveFeedbackPreferences(userId, limit);
  }

  async similarPosts(userId: string, idea: string, limit = 5): Promise<RetrievedItem[]> {
    const { retrieveSimilarPosts } = await import("../retrieval/post-memory");
    return retrieveSimilarPosts({ userId, idea, limit });
  }

  async searchKnowledge(userId: string, query: string, limit = 8): Promise<RetrievedItem[]> {
    const { searchKnowledge } = await import("../retrieval/knowledge-search");
    return searchKnowledge({ userId, query, namespaces: ["identity", "knowledge"], limit });
  }

  async savePostRun(userId: string, result: GeneratePostResult): Promise<string> {
    const { savePostRun } = await import("../lib/db");
    return savePostRun(userId, result);
  }

  async appendVersion(
    _userId: string,
    postId: string,
    text: string,
    source: VersionSource,
  ): Promise<number> {
    const { appendVersion } = await import("../lib/db");
    return appendVersion(postId, text, source);
  }

  async updatePost(
    userId: string,
    postId: string,
    changes: Partial<StoredPost>,
  ): Promise<void> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (changes.draftText !== undefined) payload.draft_text = changes.draftText;
    if (changes.finalText !== undefined) payload.final_text = changes.finalText;
    if (changes.status !== undefined) payload.status = changes.status;
    if (changes.publishedAt !== undefined) payload.published_at = changes.publishedAt;

    const { error } = await getServiceClient()
      .from("posts")
      .update(payload)
      .eq("id", postId)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to update post: ${error.message}`);
  }

  async saveFeedback(
    userId: string,
    postId: string,
    userVersion: string,
    extraction: FeedbackExtraction,
    updatedProfile: VoiceProfile,
  ): Promise<void> {
    const { saveFeedback } = await import("../lib/db");
    await saveFeedback(userId, postId, userVersion, extraction, updatedProfile);
    await this.updatePost(userId, postId, { finalText: userVersion });
  }
}

function mapPost(row: Record<string, unknown>): StoredPost {
  return {
    id: row.id as string,
    topic: (row.topic as string) ?? "",
    coreClaim: "",
    contentPillar: (row.content_pillar as string) ?? "",
    frameworkId: (row.framework_id as string) ?? "",
    frameworkRationale: "",
    hookFamily: (row.hook_family as string) ?? "",
    selectedHook: (row.selected_hook as string) ?? "",
    draftText: (row.draft_text as string) ?? "",
    finalText: (row.final_text as string) ?? null,
    status: row.status as StoredPost["status"],
    researchRequired: Boolean(row.research_required),
    criticScore:
      ((row.critic_json as Record<string, unknown> | null)?.score as number) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    publishedAt: (row.published_at as string) ?? null,
  };
}
