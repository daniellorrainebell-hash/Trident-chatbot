/**
 * Provider selection tests.
 *
 * The engine is provider-neutral above lib/providers. These pin the selection
 * rules and the schema conversion, because both fail silently: the wrong
 * provider still answers, and a bad schema conversion still returns JSON.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import {
  availableProviders,
  getEmbeddingProvider,
  getProvider,
  __resetProviders,
} from "../src/lib/providers";
import { extractJson, validate } from "../src/lib/providers/types";
import { toGeminiSchema } from "../src/lib/providers/google";
import { resetEnvCache } from "../src/lib/env";

const ORIGINAL = { ...process.env };

function setEnv(vars: Record<string, string | undefined>): void {
  for (const key of ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GOOGLE_API_KEY", "MODEL_PROVIDER"]) {
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetEnvCache();
  __resetProviders();
}

beforeEach(() => setEnv({ SUPABASE_SERVICE_ROLE_KEY: "x" }));
afterEach(() => {
  process.env = { ...ORIGINAL };
  resetEnvCache();
  __resetProviders();
});

describe("which provider answers", () => {
  it("reports nothing available with no keys", () => {
    expect(availableProviders()).toEqual([]);
  });

  it("uses OpenAI when only an OpenAI key is set", () => {
    setEnv({ OPENAI_API_KEY: "sk-test" });
    expect(getProvider().id).toBe("openai");
  });

  it("uses Anthropic when only an Anthropic key is set", () => {
    setEnv({ ANTHROPIC_API_KEY: "sk-ant-test" });
    expect(getProvider().id).toBe("anthropic");
  });

  it("uses Google when only a Google key is set", () => {
    setEnv({ GOOGLE_API_KEY: "goog-test" });
    expect(getProvider().id).toBe("google");
  });

  it("prefers OpenAI when several keys are set", () => {
    setEnv({ OPENAI_API_KEY: "a", ANTHROPIC_API_KEY: "b", GOOGLE_API_KEY: "c" });
    expect(getProvider().id).toBe("openai");
  });

  it("lets MODEL_PROVIDER override the preference order", () => {
    setEnv({ OPENAI_API_KEY: "a", ANTHROPIC_API_KEY: "b", MODEL_PROVIDER: "anthropic" });
    expect(getProvider().id).toBe("anthropic");
  });

  it("explains itself when no key is set at all", () => {
    expect(() => getProvider()).toThrow(/No model provider is configured/);
  });

  it("explains itself when MODEL_PROVIDER names a provider with no key", () => {
    setEnv({ OPENAI_API_KEY: "a", MODEL_PROVIDER: "google" });
    expect(() => getProvider()).toThrow(/no key for it is present/);
  });
});

describe("model routing", () => {
  it("resolves a distinct model per role", () => {
    setEnv({ OPENAI_API_KEY: "a" });
    const provider = getProvider();
    expect(provider.modelFor("primary")).toBeTruthy();
    expect(provider.modelFor("fast")).toBeTruthy();
  });

  it("uses the configured override rather than the default", () => {
    process.env.ANTHROPIC_MODEL_FAST = "claude-haiku-4-5";
    setEnv({ ANTHROPIC_API_KEY: "b" });
    expect(getProvider().modelFor("fast")).toBe("claude-haiku-4-5");
    delete process.env.ANTHROPIC_MODEL_FAST;
  });
});

describe("embeddings", () => {
  it("uses the active provider when it can embed", () => {
    setEnv({ OPENAI_API_KEY: "a" });
    expect(getEmbeddingProvider()?.id).toBe("openai");
  });

  it("returns nothing for an Anthropic-only deployment", () => {
    setEnv({ ANTHROPIC_API_KEY: "b" });
    expect(getEmbeddingProvider()).toBeNull();
  });

  it("falls back to a second key that can embed", () => {
    setEnv({ ANTHROPIC_API_KEY: "b", GOOGLE_API_KEY: "c", MODEL_PROVIDER: "anthropic" });
    expect(getProvider().id).toBe("anthropic");
    expect(getEmbeddingProvider()?.id).toBe("google");
  });

  it("reports that Anthropic has no embeddings endpoint", () => {
    setEnv({ ANTHROPIC_API_KEY: "b" });
    expect(getProvider().supportsEmbeddings).toBe(false);
  });
});

describe("JSON extraction", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("parses JSON inside a code fence", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("parses JSON inside an unlabelled fence", () => {
    expect(extractJson('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("recovers JSON wrapped in prose", () => {
    expect(extractJson('Here you go: {"a":1} hope that helps')).toEqual({ a: 1 });
  });

  it("parses a top-level array", () => {
    expect(extractJson("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("says what it got when there is no JSON", () => {
    expect(() => extractJson("I cannot do that")).toThrow(/did not return JSON/);
  });
});

describe("schema validation", () => {
  const schema = z.object({ name: z.string(), count: z.number() });

  it("passes a valid payload through", () => {
    expect(validate(schema, { name: "a", count: 1 }, "test", "openai")).toEqual({
      name: "a",
      count: 1,
    });
  });

  it("names the schema, the provider and the failing field", () => {
    expect(() => validate(schema, { name: "a" }, "idea_analysis", "google")).toThrow(
      /google.*idea_analysis.*count/s,
    );
  });
});

describe("Gemini schema conversion", () => {
  it("converts an object with required fields", () => {
    const converted = toGeminiSchema(z.object({ a: z.string(), b: z.number() }));
    expect(converted).toMatchObject({
      type: "OBJECT",
      properties: { a: { type: "STRING" }, b: { type: "NUMBER" } },
      required: ["a", "b"],
    });
  });

  it("leaves optional fields out of required", () => {
    const converted = toGeminiSchema(
      z.object({ a: z.string(), b: z.string().optional() }),
    ) as { required: string[] };
    expect(converted.required).toEqual(["a"]);
  });

  it("converts arrays with their item type", () => {
    expect(toGeminiSchema(z.array(z.string()))).toEqual({
      type: "ARRAY",
      items: { type: "STRING" },
    });
  });

  it("converts enums to a string with values", () => {
    expect(toGeminiSchema(z.enum(["low", "high"]))).toEqual({
      type: "STRING",
      enum: ["low", "high"],
    });
  });

  it("unwraps nullable, optional and default", () => {
    expect(toGeminiSchema(z.string().nullable())).toEqual({ type: "STRING" });
    expect(toGeminiSchema(z.boolean().optional())).toEqual({ type: "BOOLEAN" });
    expect(toGeminiSchema(z.number().default(1))).toEqual({ type: "NUMBER" });
  });

  it("handles nesting", () => {
    const converted = toGeminiSchema(
      z.object({ items: z.array(z.object({ id: z.string() })) }),
    ) as { properties: { items: { items: { type: string } } } };
    expect(converted.properties.items.items.type).toBe("OBJECT");
  });
});
