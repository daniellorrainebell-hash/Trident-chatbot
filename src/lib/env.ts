/**
 * Environment validation.
 *
 * Two separate schemas, deliberately:
 *
 *   serverEnv  reads secrets and is only ever importable from server code.
 *   publicEnv  reads NEXT_PUBLIC_* values and is safe in the browser.
 *
 * Non-negotiable rule 13: keep API keys server-side.
 * Non-negotiable rule 14: make models configurable.
 */

import { z } from "zod";

const nonEmpty = (label: string) =>
  z.string().min(1, `${label} is required. See .env.example.`);

const serverSchema = z.object({
  OPENAI_API_KEY: nonEmpty("OPENAI_API_KEY"),

  // Model IDs carry the spec defaults but remain overridable per environment.
  OPENAI_MODEL_PRIMARY: z.string().min(1).default("gpt-5.6-terra"),
  OPENAI_MODEL_DEEP: z.string().min(1).default("gpt-5.6-sol"),
  OPENAI_MODEL_FAST: z.string().min(1).default("gpt-5.6-luna"),
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),

  OPENAI_VECTOR_STORE_ID: z.string().optional(),

  SUPABASE_SERVICE_ROLE_KEY: nonEmpty("SUPABASE_SERVICE_ROLE_KEY"),
  DATABASE_URL: z.string().optional(),

  APP_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: nonEmpty("NEXT_PUBLIC_SUPABASE_URL").url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: nonEmpty("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type PublicEnv = z.infer<typeof publicSchema>;

/** Keys that must never reach a client bundle. */
export const SECRET_ENV_KEYS = [
  "OPENAI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
] as const;

function format(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

let cachedServerEnv: ServerEnv | null = null;

/**
 * Validate and return server environment.
 *
 * Throws on the server if configuration is missing, so a misconfigured deploy
 * fails at the boundary rather than halfway through a generation run.
 * Throws unconditionally in the browser: reaching this code client-side means
 * a server module leaked into the client graph.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error(
      "getServerEnv() was called in the browser. Server environment holds secrets " +
        "and must only be read from server code (route handlers, server actions, scripts).",
    );
  }

  if (cachedServerEnv) return cachedServerEnv;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment configuration:\n${format(parsed.error)}`,
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

let cachedPublicEnv: PublicEnv | null = null;

export function getPublicEnv(): PublicEnv {
  if (cachedPublicEnv) return cachedPublicEnv;

  // Next.js inlines NEXT_PUBLIC_* at build time, so these must be read by
  // full literal property access rather than a dynamic lookup.
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid public environment configuration:\n${format(parsed.error)}`,
    );
  }

  cachedPublicEnv = parsed.data;
  return cachedPublicEnv;
}

/** Test helper. Clears memoised env so a test can vary process.env. */
export function resetEnvCache(): void {
  cachedServerEnv = null;
  cachedPublicEnv = null;
}

export { serverSchema as serverEnvSchema, publicSchema as publicEnvSchema };
