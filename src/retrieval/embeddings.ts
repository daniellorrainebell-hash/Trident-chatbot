/**
 * Embeddings.
 *
 * Vectors are stored in Postgres with pgvector. The application's own database
 * stays the canonical store for the user's history, so the product is never
 * dependent on a hosted file store it does not control (spec section 39).
 */

import { getModel, getOpenAI } from "../lib/openai";

export async function embed(text: string): Promise<number[]> {
  const client = getOpenAI();
  const response = await client.embeddings.create({
    model: getModel("embedding"),
    input: text,
    encoding_format: "float",
  });

  const vector = response.data[0]?.embedding;
  if (!vector) throw new Error("Embedding response contained no vector.");
  return vector;
}

/** Batch embed. The API accepts an array and returns vectors in input order. */
export async function embedMany(texts: readonly string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const client = getOpenAI();
  const response = await client.embeddings.create({
    model: getModel("embedding"),
    input: [...texts],
    encoding_format: "float",
  });

  return response.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
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
