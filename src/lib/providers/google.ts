/**
 * Google Gemini provider.
 *
 * Calls the Generative Language REST endpoint directly rather than adding an
 * SDK. The wire format is stable and small, and one fewer dependency is one
 * fewer thing whose bindings can drift.
 *
 * Structured output uses responseMimeType "application/json" with a JSON schema
 * derived from the Zod schema, then validates the reply. Validation happens on
 * every provider anyway, so a provider whose enforcement is weaker is caught at
 * the same boundary rather than a later one.
 *
 * This is the least exercised of the three adapters. See the handover document,
 * "First run" section.
 */

import { z } from "zod";
import {
  extractJson,
  validate,
  type ModelProvider,
  type ModelRole,
  type StructuredRequest,
  type TextRequest,
} from "./types";

export interface GoogleConfig {
  apiKey: string;
  primary: string;
  deep: string;
  fast: string;
  embedding: string;
}

const BASE = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  error?: { message?: string; status?: string };
  promptFeedback?: { blockReason?: string };
}

export class GoogleProvider implements ModelProvider {
  readonly id = "google" as const;
  readonly label = "Google Gemini";
  /** Grounding exists but is not wired up here. Research falls back to no search. */
  readonly supportsWebSearch = false;
  readonly supportsEmbeddings = true;

  constructor(private readonly config: GoogleConfig) {}

  modelFor(role: ModelRole): string {
    return this.config[role];
  }

  private async call(
    model: string,
    body: Record<string, unknown>,
  ): Promise<string> {
    const response = await fetch(
      `${BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const payload = (await response.json()) as GeminiResponse;

    if (!response.ok || payload.error) {
      throw new Error(
        `Gemini request failed (${response.status}) on ${model}: ${
          payload.error?.message ?? response.statusText
        }`,
      );
    }

    if (payload.promptFeedback?.blockReason) {
      throw new Error(
        `Gemini blocked the request: ${payload.promptFeedback.blockReason}.`,
      );
    }

    const text = (payload.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!text) {
      const reason = payload.candidates?.[0]?.finishReason ?? "unknown";
      throw new Error(`Gemini returned empty text on ${model} (finishReason: ${reason}).`);
    }

    return text;
  }

  async generateStructured<T extends z.ZodTypeAny>({
    role,
    system,
    input,
    schema,
    schemaName,
  }: StructuredRequest<T>): Promise<z.infer<T>> {
    const model = this.modelFor(role);

    const text = await this.call(model, {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: input }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: toGeminiSchema(schema),
      },
    });

    return validate(schema, extractJson(text), schemaName, this.id);
  }

  async generateText({ role, system, input }: TextRequest): Promise<string> {
    return this.call(this.modelFor(role), {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: input }] }],
    });
  }

  async embed(texts: readonly string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const response = await fetch(
      `${BASE}/models/${encodeURIComponent(this.config.embedding)}:batchEmbedContents?key=${encodeURIComponent(this.config.apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            model: `models/${this.config.embedding}`,
            content: { parts: [{ text }] },
          })),
        }),
      },
    );

    const payload = (await response.json()) as {
      embeddings?: Array<{ values: number[] }>;
      error?: { message?: string };
    };

    if (!response.ok || payload.error) {
      throw new Error(
        `Gemini embedding request failed (${response.status}): ${
          payload.error?.message ?? response.statusText
        }`,
      );
    }

    return (payload.embeddings ?? []).map((entry) => entry.values);
  }
}

/**
 * Convert a Zod schema to the subset of JSON Schema Gemini accepts.
 *
 * Deliberately minimal. Gemini rejects several JSON Schema keywords, so this
 * emits only type, properties, required, items, enum and description, and drops
 * everything else. Anything it cannot express is still enforced by validating
 * the reply afterwards.
 */
export function toGeminiSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const def = (schema as { _def?: Record<string, unknown> })._def ?? {};
  const typeName = def.typeName as string | undefined;

  switch (typeName) {
    case "ZodObject": {
      const shape = (schema as unknown as z.ZodObject<z.ZodRawShape>).shape;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const field = value as z.ZodTypeAny;
        properties[key] = toGeminiSchema(field);
        if (!field.isOptional()) required.push(key);
      }

      return {
        type: "OBJECT",
        properties,
        ...(required.length ? { required } : {}),
      };
    }

    case "ZodArray":
      return {
        type: "ARRAY",
        items: toGeminiSchema(def.type as z.ZodTypeAny),
      };

    case "ZodEnum":
      return { type: "STRING", enum: def.values as string[] };

    case "ZodNumber":
      return { type: "NUMBER" };

    case "ZodBoolean":
      return { type: "BOOLEAN" };

    case "ZodNullable":
    case "ZodOptional":
    case "ZodDefault":
      return toGeminiSchema((def.innerType ?? def.type) as z.ZodTypeAny);

    case "ZodString":
    default:
      return { type: "STRING" };
  }
}
