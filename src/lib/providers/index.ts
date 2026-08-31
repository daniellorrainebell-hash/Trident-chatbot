/**
 * Provider selection.
 *
 * Whichever key is present decides who answers. If more than one is set,
 * MODEL_PROVIDER breaks the tie; without it, the order below applies.
 *
 * OpenAI leads that order because it is the provider the engine was built and
 * tested against, not because it is better.
 */

import { getServerEnv } from "../env";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GoogleProvider } from "./google";
import type { ModelProvider, ProviderId } from "./types";

const PREFERENCE: ProviderId[] = ["openai", "anthropic", "google"];

let cached: ModelProvider | null = null;
let cachedEmbedder: ModelProvider | null = null;

/** Which providers have a key set. */
export function availableProviders(): ProviderId[] {
  const env = getServerEnv();
  const available: ProviderId[] = [];
  if (env.OPENAI_API_KEY) available.push("openai");
  if (env.ANTHROPIC_API_KEY) available.push("anthropic");
  if (env.GOOGLE_API_KEY) available.push("google");
  return available;
}

function construct(id: ProviderId): ModelProvider {
  const env = getServerEnv();

  switch (id) {
    case "openai":
      return new OpenAIProvider({
        apiKey: env.OPENAI_API_KEY!,
        primary: env.OPENAI_MODEL_PRIMARY,
        deep: env.OPENAI_MODEL_DEEP,
        fast: env.OPENAI_MODEL_FAST,
        embedding: env.OPENAI_EMBEDDING_MODEL,
      });

    case "anthropic":
      return new AnthropicProvider({
        apiKey: env.ANTHROPIC_API_KEY!,
        primary: env.ANTHROPIC_MODEL_PRIMARY,
        deep: env.ANTHROPIC_MODEL_DEEP,
        fast: env.ANTHROPIC_MODEL_FAST,
      });

    case "google":
      return new GoogleProvider({
        apiKey: env.GOOGLE_API_KEY!,
        primary: env.GOOGLE_MODEL_PRIMARY,
        deep: env.GOOGLE_MODEL_DEEP,
        fast: env.GOOGLE_MODEL_FAST,
        embedding: env.GOOGLE_EMBEDDING_MODEL,
      });
  }
}

/** The active provider. Throws with a readable message when no key is set. */
export function getProvider(): ModelProvider {
  if (cached) return cached;

  const available = availableProviders();
  if (available.length === 0) {
    throw new Error(
      "No model provider is configured, so nothing can be generated. Set one of " +
        "OPENAI_API_KEY, ANTHROPIC_API_KEY or GOOGLE_API_KEY. Settings and history " +
        "work without one.",
    );
  }

  const requested = getServerEnv().MODEL_PROVIDER as ProviderId | undefined;
  if (requested) {
    if (!available.includes(requested)) {
      throw new Error(
        `MODEL_PROVIDER is set to "${requested}" but no key for it is present. ` +
          `Keys found for: ${available.join(", ") || "none"}.`,
      );
    }
    cached = construct(requested);
    return cached;
  }

  const chosen = PREFERENCE.find((id) => available.includes(id))!;
  cached = construct(chosen);
  return cached;
}

/**
 * A provider that can embed.
 *
 * Anthropic has no embeddings endpoint, so an Anthropic-only deployment cannot
 * do semantic retrieval. Rather than failing a whole generation over it, this
 * returns null and retrieval degrades to off, exactly as it does on the local
 * JSON store.
 */
export function getEmbeddingProvider(): ModelProvider | null {
  if (cachedEmbedder) return cachedEmbedder;

  const available = availableProviders();
  const active = available.length > 0 ? getProvider() : null;

  if (active?.supportsEmbeddings) {
    cachedEmbedder = active;
    return cachedEmbedder;
  }

  // Fall back to any other configured provider that can embed.
  const fallback = PREFERENCE.filter((id) => available.includes(id))
    .map(construct)
    .find((provider) => provider.supportsEmbeddings);

  cachedEmbedder = fallback ?? null;
  return cachedEmbedder;
}

/** Test seam. */
export function __resetProviders(): void {
  cached = null;
  cachedEmbedder = null;
}

export * from "./types";
export { OpenAIProvider } from "./openai";
export { AnthropicProvider } from "./anthropic";
export { GoogleProvider } from "./google";
