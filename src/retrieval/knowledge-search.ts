/**
 * Knowledge base retrieval.
 *
 * Namespaces (spec section 32):
 *   A frameworks   static, resolved by ID rather than by similarity
 *   B identity     expertise, positioning, offers, beliefs, approved bio facts
 *   C writing      published posts, approved and rejected drafts, edit history
 *   D knowledge    user docs, research, product knowledge, case studies
 *   E performance  metrics, where the user records them
 */

import { getServiceClient } from "../lib/supabase";
import { embed, toVectorLiteral } from "./embeddings";
import type { RetrievedItem } from "../agents/types";

export type KnowledgeNamespace = "identity" | "writing" | "knowledge" | "performance";

export interface KnowledgeQuery {
  userId: string;
  query: string;
  namespaces?: KnowledgeNamespace[];
  /** Metadata filters. Spec section 33. */
  filters?: {
    topic?: string;
    contentPillar?: string;
    approvedOnly?: boolean;
    source?: string;
    maxRisk?: "low" | "medium" | "high";
  };
  limit?: number;
}

export async function searchKnowledge(
  query: KnowledgeQuery,
): Promise<RetrievedItem[]> {
  const supabase = getServiceClient();
  const vector = await embed(query.query);

  const { data, error } = await supabase.rpc("match_knowledge_documents", {
    query_embedding: toVectorLiteral(vector),
    match_user_id: query.userId,
    match_count: query.limit ?? 8,
    filter_namespaces: query.namespaces ?? ["identity", "knowledge"],
    filter_topic: query.filters?.topic ?? null,
    filter_approved_only: query.filters?.approvedOnly ?? false,
  });

  if (error) throw new Error(`Knowledge search failed: ${error.message}`);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    namespace: (row.knowledge_type as RetrievedItem["namespace"]) ?? "knowledge",
    title: String(row.title ?? "Untitled"),
    content: String(row.raw_text ?? ""),
    score: typeof row.similarity === "number" ? row.similarity : undefined,
    metadata: (row.metadata_json as Record<string, unknown>) ?? {},
  }));
}

/** Render the user's identity for prompt context. Namespace B. */
export async function getIdentityBlock(userId: string): Promise<string> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("bio, expertise, target_audience, positioning, offers, goals")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  if (!data) return "";

  const fields: Array<[string, unknown]> = [
    ["Bio", data.bio],
    ["Expertise", data.expertise],
    ["Target audience", data.target_audience],
    ["Positioning", data.positioning],
    ["Offers", data.offers],
    ["Goals", data.goals],
  ];

  return fields
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `${label}: ${String(value)}`)
    .join("\n");
}
