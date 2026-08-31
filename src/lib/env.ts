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
  // Optional here, checked at the point of use in lib/providers.
  //
  // Requiring it at validation time meant Settings, History and the sign-off
  // editor all refused to load without a key, even though none of them calls a
  // model. Configuration should fail where it is actually needed.
  OPENAI_API_KEY: z.string().optional(),

  // Anthropic and Google are alternatives. Whichever key is present is used;
  // MODEL_PROVIDER breaks the tie when more than one is set.
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  MODEL_PROVIDER: z.enum(["openai", "anthropic", "google"]).optional(),

  // Model IDs carry the spec defaults but remain overridable per environment.
  OPENAI_MODEL_PRIMARY: z.string().min(1).default("gpt-5.6-terra"),
  OPENAI_MODEL_DEEP: z.string().min(1).default("gpt-5.6-sol"),
  OPENAI_MODEL_FAST: z.string().min(1).default("gpt-5.6-luna"),
  OPENAI_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),

  ANTHROPIC_MODEL_PRIMARY: z.string().min(1).default("claude-opus-5"),
  ANTHROPIC_MODEL_DEEP: z.string().min(1).default("claude-opus-5"),
  ANTHROPIC_MODEL_FAST: z.string().min(1).default("claude-haiku-4-5"),

  GOOGLE_MODEL_PRIMARY: z.string().min(1).default("gemini-2.5-pro"),
  GOOGLE_MODEL_DEEP: z.string().min(1).default("gemini-2.5-pro"),
  GOOGLE_MODEL_FAST: z.string().min(1).default("gemini-2.5-flash"),
  GOOGLE_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-004"),

  OPENAI_VECTOR_STORE_ID: z.string().optional(),

  // Supabase is optional. Without it the engine stores everything in a local
  // JSON file, which is enough for a single user and removes the need to stand
  // up a database before the first post. Semantic retrieval is the one feature
  // that genuinely requires Postgres, and it degrades to off rather than
  // pretending to work.
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),

  /** Single-user deployment. There is no login, so the user is resolved here. */
  NEXUS_USER_ID: z.string().uuid().default("00000000-0000-0000-0000-000000000001"),
  /** Where the local JSON store lives, when Supabase is not configured. */
  NEXUS_DATA_DIR: z.string().default(".data"),

  APP_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
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

/**
 * Is Supabase configured?
 *
 * All three values are required together. A half-configured Supabase is worse
 * than none, because it fails at the first query rather than at startup.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** The single user this deployment serves. */
export function getCurrentUserId(): string {
  return getServerEnv().NEXUS_USER_ID;
}

/** Test helper. Clears memoised env so a test can vary process.env. */
export function resetEnvCache(): void {
  cachedServerEnv = null;
  cachedPublicEnv = null;
}

export { serverSchema as serverEnvSchema, publicSchema as publicEnvSchema };
