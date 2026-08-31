/**
 * Embeddings.
 *
 * Vectors are stored in Postgres with pgvector. The application's own database
 * stays the canonical store for the user's history, so the product is never
 * dependent on a hosted file store it does not control.
 *
 * Not every provider offers embeddings. Anthropic does not, so an
 * Anthropic-only deployment cannot do semantic retrieval. That degrades to off
 * and is reported, rather than failing a generation.
 */

import { getEmbeddingProvider } from "../lib/providers";

/** Can this deployment embed at all? */
export function embeddingsAvailable(): boolean {
  return getEmbeddingProvider() !== null;
}

export async function embed(text: string): Promise<number[]> {
  const vectors = await embedMany([text]);
  const vector = vectors[0];
  if (!vector) throw new Error("Embedding response contained no vector.");
  return vector;
}

/** Batch embed. Returns vectors in input order. */
export async function embedMany(texts: readonly string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const provider = getEmbeddingProvider();
  if (!provider) {
    throw new Error(
      "No configured provider offers embeddings, so semantic retrieval is unavailable. " +
        "Anthropic has no embeddings endpoint: add an OpenAI or Google key alongside it.",
    );
  }

  const vectors = await provider.embed(texts);
  if (!vectors) {
    throw new Error(`${provider.label} returned no embeddings.`);
  }
  return vectors;
}

export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}.`);
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

/** pgvector literal format. */
export function toVectorLiteral(vector: readonly number[]): string {
  return `[${vector.join(",")}]`;
}
