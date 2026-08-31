/**
 * Anthropic provider.
 *
 * Uses the Messages API with structured outputs: `messages.parse()` with
 * `output_config.format`, which validates the reply against the schema.
 *
 * Anthropic does not offer an embeddings endpoint, so `embed` returns null.
 * Semantic retrieval then needs an OpenAI or Google key alongside, and degrades
 * to off rather than silently returning nothing useful.
 */

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import type {
  ModelProvider,
  ModelRole,
  StructuredRequest,
  TextRequest,
} from "./types";

export interface AnthropicConfig {
  apiKey: string;
  primary: string;
  deep: string;
  fast: string;
}

/**
 * Non-streaming ceiling.
 *
 * Kept well under the model maximum on purpose: a large max_tokens on a
 * non-streaming request risks an HTTP timeout, and no stage here needs more.
 */
const MAX_TOKENS = 16_000;

export class AnthropicProvider implements ModelProvider {
  readonly id = "anthropic" as const;
  readonly label = "Anthropic";
  readonly supportsWebSearch = true;
  readonly supportsEmbeddings = false;

  private readonly client: Anthropic;

  constructor(private readonly config: AnthropicConfig) {
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  modelFor(role: ModelRole): string {
    if (role === "embedding") {
      throw new Error("Anthropic does not provide embeddings.");
    }
    return this.config[role];
  }

  /** Server-side web search. Declared only when a stage asks for it. */
  private searchTool() {
    return [{ type: "web_search_20260209", name: "web_search" }] as never;
  }

  async generateStructured<T extends z.ZodTypeAny>({
    role,
    system,
    input,
    schema,
    schemaName,
    webSearch,
  }: StructuredRequest<T>): Promise<z.infer<T>> {
    const response = await this.client.messages.parse({
      model: this.modelFor(role),
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: input }],
      ...(webSearch ? { tools: this.searchTool() } : {}),
      // zodOutputFormat takes the schema alone; the name is ours, for errors.
      output_config: { format: zodOutputFormat(schema as never) },
    });

    // Safety classifiers can decline a request: HTTP 200 with stop_reason
    // "refusal". Reading content without checking would look like a parse bug.
    if (response.stop_reason === "refusal") {
      throw new Error(
        `Anthropic declined the "${schemaName}" request (stop_reason: refusal). ` +
          "Rephrase the idea or the brief.",
      );
    }

    const parsed = response.parsed_output;
    if (parsed == null) {
      throw new Error(
        `Anthropic returned no parsed output for "${schemaName}" on ${this.modelFor(role)}.`,
      );
    }
    return parsed as z.infer<T>;
  }

  async generateText({ role, system, input, webSearch }: TextRequest): Promise<string> {
    const response = await this.client.messages.create({
      model: this.modelFor(role),
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: "user", content: input }],
      ...(webSearch ? { tools: this.searchTool() } : {}),
    });

    if (response.stop_reason === "refusal") {
      throw new Error("Anthropic declined the request (stop_reason: refusal).");
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!text) throw new Error(`Anthropic returned empty text on ${this.modelFor(role)}.`);
    return text;
  }

  /** Anthropic has no embeddings endpoint. */
  async embed(): Promise<null> {
    return null;
  }
}
