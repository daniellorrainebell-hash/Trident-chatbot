/**
 * Hook scoring tests.
 *
 * The model judges the dimensions. This code computes the ranking, so the
 * ranking is what gets tested.
 */

import { describe, expect, it } from "vitest";
import { computeWeightedScore } from "../src/agents/hook-critic";
import { dedupeCandidates } from "../src/agents/hook-generator";
import { DEFAULT_HOOK_WEIGHTS, type HookScore } from "../src/schemas/hooks";

const score = (
  values: Partial<HookScore["scores"]>,
  penalties: HookScore["penalties"] = [],
): HookScore => ({
  text: "test hook",
  hook_family: "statement",
  scores: {
    audience_relevance: 5,
    specificity: 5,
    curiosity: 5,
    tension: 5,
    credibility: 5,
    originality: 5,
    clarity: 5,
    body_fulfilment_potential: 5,
    voice_fit: 5,
    ...values,
  },
  penalties,
  verdict: "test",
});

describe("weighted scoring", () => {
  it("sums to the input value when all dimensions are equal", () => {
    expect(computeWeightedScore(score({}))).toBeCloseTo(5, 1);
  });

  it("weights audience relevance most heavily", () => {
    const relevant = computeWeightedScore(score({ audience_relevance: 10 }));
    const original = computeWeightedScore(score({ originality: 10 }));
    expect(relevant).toBeGreaterThan(original);
  });

  it("has weights summing to one", () => {
    const total = Object.values(DEFAULT_HOOK_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it("never returns a value outside 0 to 10", () => {
    expect(computeWeightedScore(score({ audience_relevance: 10, specificity: 10 }))).toBeLessThanOrEqual(10);
    expect(
      computeWeightedScore(score({}), DEFAULT_HOOK_WEIGHTS),
    ).toBeGreaterThanOrEqual(0);
  });
});

describe("penalties", () => {
  it("removes a hook with a false personal claim from contention", () => {
    const perfect = score({
      audience_relevance: 10,
      specificity: 10,
      curiosity: 10,
      tension: 10,
      credibility: 10,
      originality: 10,
      clarity: 10,
      voice_fit: 10,
    });
    const withClaim = { ...perfect, penalties: ["false_personal_claim" as const] };

    expect(computeWeightedScore(perfect)).toBeCloseTo(10, 1);
    expect(computeWeightedScore(withClaim)).toBe(0);
  });

  it("penalises an unsupported number more than a cliche", () => {
    const base = score({});
    const cliched = { ...base, penalties: ["cliche" as const] };
    const numbered = { ...base, penalties: ["unsupported_number" as const] };

    expect(computeWeightedScore(numbered)).toBeLessThan(computeWeightedScore(cliched));
  });

  it("accumulates multiple penalties", () => {
    const base = score({});
    const one = { ...base, penalties: ["cliche" as const] };
    const two = { ...base, penalties: ["cliche" as const, "clickbait" as const] };

    expect(computeWeightedScore(two)).toBeLessThan(computeWeightedScore(one));
  });
});

describe("candidate de-duplication", () => {
  it("removes a reworded near-duplicate", () => {
    const candidates = [
      {
        text: "If your AI agent touches client customer data, your model subscription does not make the deployment compliant.",
        hook_family: "conditional",
        promise: "explain what compliance actually requires",
      },
      {
        text: "If your AI agent touches client customer data, a model subscription does not make that deployment compliant.",
        hook_family: "conditional",
        promise: "explain what compliance actually requires",
      },
    ];

    expect(dedupeCandidates(candidates)).toHaveLength(1);
  });

  it("keeps genuinely different angles within one family", () => {
    const candidates = [
      {
        text: "If your AI agent touches client customer data, your model subscription is not a data-processing structure.",
        hook_family: "conditional",
        promise: "explain controller and processor roles",
      },
      {
        text: "If nobody has written down which supplier receives your customer records, the incident procedure does not exist yet.",
        hook_family: "conditional",
        promise: "explain why the vendor map comes first",
      },
    ];

    expect(dedupeCandidates(candidates)).toHaveLength(2);
  });

  it("drops candidates with no usable content words", () => {
    expect(dedupeCandidates([{ text: "?!", hook_family: "statement", promise: "x" }])).toHaveLength(0);
  });
});
