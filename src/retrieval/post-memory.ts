/**
 * Post and feedback memory retrieval.
 *
 * Spec section 31 sets the retrieval priority:
 *   1. Recent explicit user preferences
 *   2. Repeated preferences
 *   3. Final approved posts
 *   4. Strong-performing posts
 *   5. Similar topic posts
 *   6. General voice rules
 *
 * And the constraint that matters most: do not copy an old post merely because it
 * is semantically similar. Similar posts are context for what has already been
 * said, not templates.
 */

import { getServiceClient } from "../lib/supabase";
import { embed, toVectorLiteral } from "./embeddings";
import type { PastPostSummary, RetrievedItem } from "../agents/types";

export interface MemoryQuery {
  userId: string;
  idea: string;
  topic?: string;
  contentPillar?: string;
  limit?: number;
}

/**
 * Retrieve editorial preferences, most useful first.
 *
 * Preferences expressed repeatedly rank above one-off corrections, which is the
 * difference between "the user once cut a sentence" and "the user always cuts
 * this kind of sentence".
 */
export async function retrieveFeedbackPreferences(
  userId: string,
  limit = 12,
): Promise<string[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("feedback_events")
    .select("reason_summary, tags_json, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`Failed to retrieve feedback events: ${error.message}`);
  if (!data?.length) return [];

  // Count tag frequency so repeated preferences outrank single corrections.
  const frequency = new Map<string, number>();
  for (const row of data) {
    const tags = (row.tags_json as string[] | null) ?? [];
    for (const tag of tags) frequency.set(tag, (frequency.get(tag) ?? 0) + 1);
  }

  const scored = data.map((row, index) => {
    const tags = (row.tags_json as string[] | null) ?? [];
    const repetition = tags.reduce((total, tag) => total + (frequency.get(tag) ?? 0), 0);
    // Recency is the index position; both terms matter, repetition more.
    const recency = 1 - index / data.length;
    return {
      summary: row.reason_summary as string,
      score: repetition * 2 + recency,
    };
  });

  const seen = new Set<string>();
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((entry) => {
      if (!entry.summary || seen.has(entry.summary)) return false;
      seen.add(entry.summary);
      return true;
    })
    .slice(0, limit)
    .map((entry) => entry.summary);
}

/** Recent posts, for framework and hook variation. */
export async function retrieveRecentPosts(
  userId: string,
  limit = 10,
): Promise<PastPostSummary[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id, topic, framework_id, hook_family, selected_hook, content_pillar, published_at, created_at")
    .eq("user_id", userId)
    .in("status", ["approved", "published", "performance_recorded"])
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
    publishedAt: (row.published_at as string) ?? undefined,
  }));
}

/**
 * Semantically similar previous posts.
 *
 * Returned as context, clearly labelled. The caller passes these to agents with
 * the instruction that they show what has already been said, not what to say.
 */
export async function retrieveSimilarPosts(
  query: MemoryQuery,
): Promise<RetrievedItem[]> {
  const supabase = getServiceClient();
  const vector = await embed(query.idea);

  const { data, error } = await supabase.rpc("match_user_posts", {
    query_embedding: toVectorLiteral(vector),
    match_user_id: query.userId,
    match_count: query.limit ?? 5,
  });

  if (error) throw new Error(`Similar post retrieval failed: ${error.message}`);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.post_id),
    namespace: "writing" as const,
    title: `Previous post: ${String(row.topic ?? "untitled")}`,
    content: String(row.text ?? ""),
    score: typeof row.similarity === "number" ? row.similarity : undefined,
    metadata: {
      framework: row.framework_id,
      hookFamily: row.hook_family,
      note: "Context only. Do not reuse this wording or structure.",
    },
  }));
}
