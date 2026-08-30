/**
 * OpenAI client and model routing.
 *
 * SERVER ONLY. Importing this from client code throws via getServerEnv().
 *
 * Model IDs are resolved here and nowhere else. Application code asks for a
 * role ("primary", "deep", "fast", "embedding") and never names a model.
 */

import OpenAI from "openai";
import { getServerEnv } from "./env";

export type ModelRole = "primary" | "deep" | "fast" | "embedding";

let cachedClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (cachedClient) return cachedClient;
  const env = getServerEnv();
  cachedClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return cachedClient;
}

/**
 * Resolve a role to the configured model ID.
 *
 * primary   strategist and writer
 * deep      high-stakes analysis, legal and technical research, fact checking
 * fast      classification, tagging, hook pre-scoring
 * embedding retrieval vectors
 */
export function getModel(role: ModelRole): string {
  const env = getServerEnv();
  switch (role) {
    case "primary":
      return env.OPENAI_MODEL_PRIMARY;
    case "deep":
      return env.OPENAI_MODEL_DEEP;
    case "fast":
      return env.OPENAI_MODEL_FAST;
    case "embedding":
      return env.OPENAI_EMBEDDING_MODEL;
  }
}

export function getVectorStoreId(): string | undefined {
  return getServerEnv().OPENAI_VECTOR_STORE_ID || undefined;
}

/** Test seam. Allows a fake client to be injected without network access. */
export function __setOpenAIClientForTests(client: OpenAI | null): void {
  cachedClient = client;
}
