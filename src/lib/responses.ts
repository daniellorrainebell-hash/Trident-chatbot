/**
 * Agent call boundary.
 *
 * Every agent goes through these two functions. They delegate to whichever
 * provider is configured, so no agent, prompt or schema names a vendor.
 */

import type { z } from "zod";
import { getProvider, type ModelRole } from "./providers";

export type ToolChoice = "web_search" | "file_search";

export interface StructuredCallOptions<T extends z.ZodTypeAny> {
  role: ModelRole;
  system: string;
  input: string;
  schema: T;
  schemaName: string;
  tools?: ToolChoice[];
}

export interface TextCallOptions {
  role: ModelRole;
  system: string;
  input: string;
  tools?: ToolChoice[];
}

/**
 * Run a structured call and return parsed, schema-valid data.
 *
 * A provider that cannot search the web simply answers without searching. The
 * fact checker records what it could not verify either way, so the outcome is a
 * weaker verdict rather than a false one.
 */
export async function generateStructured<T extends z.ZodTypeAny>(
  options: StructuredCallOptions<T>,
): Promise<z.infer<T>> {
  const provider = getProvider();
  const wantsSearch = Boolean(options.tools?.includes("web_search"));

  return provider.generateStructured({
    role: options.role,
    system: options.system,
    input: options.input,
    schema: options.schema,
    schemaName: options.schemaName,
    webSearch: wantsSearch && provider.supportsWebSearch,
  });
}

/** Free-text call. Used only where the deliverable is prose. */
export async function generateText(options: TextCallOptions): Promise<string> {
  const provider = getProvider();
  const wantsSearch = Boolean(options.tools?.includes("web_search"));

  return provider.generateText({
    role: options.role,
    system: options.system,
    input: options.input,
    webSearch: wantsSearch && provider.supportsWebSearch,
  });
}
