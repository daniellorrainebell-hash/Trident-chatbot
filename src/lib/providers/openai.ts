/**
 * OpenAI provider.
 *
 * Uses the Responses API with structured outputs, which constrains the reply to
 * the schema rather than asking for JSON and hoping.
 */

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import type {
  ModelProvider,
  ModelRole,
  StructuredRequest,
  TextRequest,
} from "./types";

export interface OpenAIConfig {
  apiKey: string;
  primary: string;
  deep: string;
  fast: string;
  embedding: string;
}

export class OpenAIProvider implements ModelProvider {
  readonly id = "openai" as const;
  readonly label = "OpenAI";
  readonly supportsWebSearch = true;
  readonly supportsEmbeddings = true;

  private readonly client: OpenAI;

  constructor(private readonly config: OpenAIConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  modelFor(role: ModelRole): string {
    return this.config[role];
  }

  async generateStructured<T extends z.ZodTypeAny>({
    role,
    system,
    input,
    schema,
    schemaName,
    webSearch,
  }: StructuredRequest<T>): Promise<z.infer<T>> {
    const response = await this.client.responses.parse({
      model: this.modelFor(role),
      input: [
        { role: "system", content: system },
        { role: "user", content: input },
      ],
      ...(webSearch ? { tools: [{ type: "web_search" }] as never } : {}),
      text: { format: zodTextFormat(schema, schemaName) },
    });

    const parsed = response.output_parsed;
    if (parsed == null) {
      throw new Error(
        `OpenAI returned no parsed output for "${schemaName}" on ${this.modelFor(role)}.`,
      );
    }
    return parsed as z.infer<T>;
  }

  async generateText({ role, system, input, webSearch }: TextRequest): Promise<string> {
    const response = await this.client.responses.create({
      model: this.modelFor(role),
      instructions: system,
      input,
      ...(webSearch ? { tools: [{ type: "web_search" }] as never } : {}),
    });

    const text = response.output_text?.trim() ?? "";
    if (!text) throw new Error(`OpenAI returned empty text on ${this.modelFor(role)}.`);
    return text;
  }

  async embed(texts: readonly string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const response = await this.client.embeddings.create({
      model: this.config.embedding,
      input: [...texts],
      encoding_format: "float",
    });

    return response.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  }
}
