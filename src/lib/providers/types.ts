/**
 * Model provider abstraction.
 *
 * The engine asks for a role ("primary", "deep", "fast") and a schema. Which
 * company answers is a deployment decision, made by whichever API key is
 * present.
 *
 * Everything above this layer is provider-neutral. No agent, prompt or schema
 * mentions a vendor, so adding a fourth provider is a new file here and nothing
 * else.
 */

import type { z } from "zod";

export type ProviderId = "openai" | "anthropic" | "google";

export type ModelRole = "primary" | "deep" | "fast" | "embedding";

export interface StructuredRequest<T extends z.ZodTypeAny> {
  role: ModelRole;
  system: string;
  input: string;
  schema: T;
  /** Snake case, stable across versions. Used as the schema name on the wire. */
  schemaName: string;
  /** Ask the provider to search the web. Ignored where unsupported. */
  webSearch?: boolean;
}

export interface TextRequest {
  role: ModelRole;
  system: string;
  input: string;
  webSearch?: boolean;
}

export interface ModelProvider {
  readonly id: ProviderId;
  /** Human-readable, for the status endpoint. */
  readonly label: string;
  /** True when this provider can search the web during a call. */
  readonly supportsWebSearch: boolean;
  /**
   * True when this provider offers embeddings.
   * Anthropic does not, so semantic retrieval needs a second key or degrades.
   */
  readonly supportsEmbeddings: boolean;

  /** The model ID this provider resolves for a role. Surfaced in errors. */
  modelFor(role: ModelRole): string;

  generateStructured<T extends z.ZodTypeAny>(
    request: StructuredRequest<T>,
  ): Promise<z.infer<T>>;

  generateText(request: TextRequest): Promise<string>;

  /** Returns null when this provider cannot embed. */
  embed(texts: readonly string[]): Promise<number[][] | null>;
}

/**
 * Extract the first JSON object or array from a model response.
 *
 * Providers with native schema enforcement rarely need this. It exists for the
 * ones that return JSON as text, and for the case where a model wraps valid
 * JSON in a code fence despite being told not to.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();

  // Strip a fenced block if one is present.
  const fenced = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n?```$/);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    // Fall back to the outermost braces or brackets.
    const start = candidate.search(/[[{]/);
    const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
    if (start === -1 || end <= start) {
      throw new Error(
        `Model did not return JSON. First 200 characters: ${candidate.slice(0, 200)}`,
      );
    }
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

/** Validate a parsed payload, with a readable error naming the stage. */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  payload: unknown,
  schemaName: string,
  provider: ProviderId,
): z.infer<T> {
  const parsed = schema.safeParse(payload);
  if (parsed.success) return parsed.data;

  const issues = parsed.error.issues
    .slice(0, 6)
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");

  throw new Error(
    `The ${provider} response did not match the "${schemaName}" schema. ${issues}`,
  );
}
