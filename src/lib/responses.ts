/**
 * Thin wrapper over the OpenAI Responses API.
 *
 * Every agent boundary in this system is a structured output. Parsing loose
 * prose where a schema is available is a source of silent drift, so the only
 * exported call that returns free text is `generateText`, used by the writer
 * and revision agents where the deliverable genuinely is prose.
 */

import type { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { getModel, getOpenAI, type ModelRole } from "./openai";

export type ToolChoice = "web_search" | "file_search";

export interface StructuredCallOptions<T extends z.ZodTypeAny> {
  /** Which configured model role to run on. */
  role: ModelRole;
  /** System instructions for this agent. */
  system: string;
  /** The user-role payload for this call. */
  input: string;
  /** Zod schema constraining the response. */
  schema: T;
  /** Schema name sent to the API. Snake case, stable across versions. */
  schemaName: string;
  /** Hosted tools to enable for this call. */
  tools?: ToolChoice[];
  /** Vector store IDs, required when file_search is enabled. */
  vectorStoreIds?: string[];
}

export interface TextCallOptions {
  role: ModelRole;
  system: string;
  input: string;
  tools?: ToolChoice[];
  vectorStoreIds?: string[];
}

function buildTools(
  tools: ToolChoice[] | undefined,
  vectorStoreIds: string[] | undefined,
): unknown[] | undefined {
  if (!tools || tools.length === 0) return undefined;

  return tools.map((tool) => {
    if (tool === "web_search") return { type: "web_search" };
    if (!vectorStoreIds || vectorStoreIds.length === 0) {
      throw new Error(
        "file_search was requested without vectorStoreIds. Set OPENAI_VECTOR_STORE_ID " +
          "or pass vector store IDs explicitly.",
      );
    }
    return {
      type: "file_search",
      vector_store_ids: vectorStoreIds,
      max_num_results: 6,
    };
  });
}

/**
 * Run a structured call and return parsed, schema-valid data.
 *
 * Throws when the model returns nothing parseable. Callers decide whether that
 * is fatal or whether the stage can be skipped, because some stages (research,
 * offer analysis) are genuinely optional.
 */
export async function generateStructured<T extends z.ZodTypeAny>(
  options: StructuredCallOptions<T>,
): Promise<z.infer<T>> {
  const client = getOpenAI();

  const response = await client.responses.parse({
    model: getModel(options.role),
    input: [
      { role: "system", content: options.system },
      { role: "user", content: options.input },
    ],
    ...(buildTools(options.tools, options.vectorStoreIds)
      ? { tools: buildTools(options.tools, options.vectorStoreIds) as never }
      : {}),
    text: {
      format: zodTextFormat(options.schema, options.schemaName),
    },
  });

  const parsed = response.output_parsed;
  if (parsed == null) {
    throw new Error(
      `Structured call "${options.schemaName}" returned no parsed output. ` +
        `Model role: ${options.role}.`,
    );
  }

  return parsed as z.infer<T>;
}

/** Free-text call. Used only where the deliverable is prose. */
export async function generateText(options: TextCallOptions): Promise<string> {
  const client = getOpenAI();

  const response = await client.responses.create({
    model: getModel(options.role),
    instructions: options.system,
    input: options.input,
    ...(buildTools(options.tools, options.vectorStoreIds)
      ? { tools: buildTools(options.tools, options.vectorStoreIds) as never }
      : {}),
  });

  const text = response.output_text?.trim() ?? "";
  if (!text) {
    throw new Error(
      `Text call returned empty output. Model role: ${options.role}.`,
    );
  }
  return text;
}
