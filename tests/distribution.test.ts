/**
 * LinkedIn distribution logic tests.
 *
 * Two things need holding down. First, the myth firewall: folklore must be
 * caught deterministically, whatever any model believes about LinkedIn. Second,
 * the discipline of the module itself: every rule labelled, no invented weights,
 * and no drift towards flattening the author.
 */

import { describe, expect, it } from "vitest";
import {
  DISTRIBUTION_RULES,
  DISTRIBUTION_MODES,
  DISTRIBUTION_KNOWLEDGE_VERSION,
  DISTRIBUTION_SCORE_LABEL,
  MYTH_FIREWALL,
  VISIBILITY_LANGUAGE,
  detectAlgorithmFolklore,
  getDistributionMode,
  DEFAULT_DISTRIBUTION_MODE,
} from "../src/frameworks/linkedin-distribution";
import { distributionScore, blocksPublication } from "../src/schemas/distribution";
import { lintPost } from "../src/writing-rules/linter";
import type { DistributionCheck } from "../src/schemas/distribution";

describe("myth firewall", () => {
  const folklore: Array<[string, string]> = [
    ["360Brew is LinkedIn's current ranking model", "Optimise for 360Brew and you win the feed."],
    ["Putting the link in the first comment avoids a penalty", "Always put the link in the first comment."],
    ["Editing a post kills reach", "Careful, editing your post kills reach."],
    ["A specific hashtag count is optimal", "Use exactly 3 hashtags for maximum reach."],
    ["Comments are worth a fixed multiple of likes", "One comment = 5 likes in the algorithm."],
    ["Saves have a known ranking multiplier", "A save equals 10 likes."],
    ["The first N minutes determine a post's lifecycle", "The first hour determines everything."],
    ["There is an optimal posting time", "Post at 8:07 am for the best reach."],
    ["Low impressions mean you are shadow banned", "Low views? You have been shadow banned."],
  ];

  for (const [claim, text] of folklore) {
    it(`catches: ${claim}`, () => {
      const hits = detectAlgorithmFolklore(text);
      expect(hits.map((hit) => hit.claim)).toContain(claim);
    });
  }

  it("marks 360Brew false rather than merely unsupported", () => {
    const hit = detectAlgorithmFolklore("They still run 360Brew.")[0];
    expect(hit?.status).toBe("false");
    expect(hit?.note).toContain("shut-down internal test");
  });

  it("marks the rest unsupported rather than false", () => {
    const hit = detectAlgorithmFolklore("Post at 9:00 am.")[0];
    expect(hit?.status).toBe("unsupported");
  });

  it("does not fire on ordinary professional writing", () => {
    const clean = [
      "The governance pack describes what the deployment does and which suppliers sit behind it.",
      "We reviewed the data-flow map before the system reached production.",
      "I edited the document after the legal review and the meaning changed completely.",
      "Three documents make up the pack: a use register, a data-flow map and an incident procedure.",
    ];
    for (const text of clean) {
      expect(detectAlgorithmFolklore(text), text).toHaveLength(0);
    }
  });

  it("reports every distinct claim in one pass", () => {
    const hits = detectAlgorithmFolklore(
      "Post at 8:07 am, use 3 hashtags, and put the link in the first comment.",
    );
    expect(hits.length).toBeGreaterThanOrEqual(3);
  });
});

describe("folklore in the linter", () => {
  it("treats an unsupported platform claim as an error", () => {
    const result = lintPost("Editing your post kills reach, so never touch it after publishing.");
    expect(result.passed).toBe(false);
    expect(result.errors.map((error) => error.ruleId)).toContain("algorithm_folklore");
  });

  it("explains why the claim is not usable", () => {
    const finding = lintPost("They still use 360Brew for ranking.").findings.find(
      (item) => item.ruleId === "algorithm_folklore",
    );
    expect(finding?.message).toContain("360Brew");
    expect(finding?.suggestion).toContain("platform fact");
  });

  it("leaves a clean professional post alone", () => {
    const result = lintPost(
      "A governance template cannot know which subprocessor receives your customer records.",
    );
    expect(result.errors).toHaveLength(0);
  });
});

describe("evidence discipline", () => {
  it("labels every rule", () => {
    const labels = new Set([
      "CONFIRMED",
      "CONFIRMED_CATEGORY",
      "IMPLEMENTATION_INFERENCE",
      "UNSUPPORTED",
    ]);
    for (const rule of DISTRIBUTION_RULES) {
      expect(labels.has(rule.evidence), rule.id).toBe(true);
      expect(rule.statement, rule.id).toBeTruthy();
      expect(rule.application, rule.id).toBeTruthy();
      expect(rule.ref, rule.id).toBeGreaterThan(0);
    }
  });

  it("records that AI-assisted text carries no confirmed penalty", () => {
    const rule = DISTRIBUTION_RULES.find((entry) => entry.id === "ai_text_not_penalised");
    expect(rule?.evidence).toBe("UNSUPPORTED");
  });

  it("keeps profanity as a trade-off rather than a ban", () => {
    const rule = DISTRIBUTION_RULES.find((entry) => entry.id === "profanity_tradeoff");
    expect(rule?.evidence).toBe("CONFIRMED_CATEGORY");
    expect(rule?.application).toContain("do not sanitise");
  });

  it("states no numeric weight, multiplier or threshold anywhere", () => {
    // The module must never encode an invented ranking mechanic.
    const text = DISTRIBUTION_RULES.map((rule) => `${rule.statement} ${rule.application}`).join(" ");
    expect(text).not.toMatch(/\b\d+\s*(likes?|comments?|shares?)\b/i);
    expect(text).not.toMatch(/\bequals?\s+\d+/i);
    expect(text).not.toMatch(/\b\d+\s*seconds?\s+of\s+dwell/i);
  });

  it("never calls the score a LinkedIn algorithm score", () => {
    expect(DISTRIBUTION_SCORE_LABEL).toContain("Nexus");
    expect(DISTRIBUTION_SCORE_LABEL.toLowerCase()).not.toContain("algorithm");
  });

  it("avoids shadow ban language and offers approved wording instead", () => {
    expect(VISIBILITY_LANGUAGE.avoid).toContain("shadow banned");
    expect(VISIBILITY_LANGUAGE.use).toContain("distribution limited");
  });

  it("carries the knowledge version from the source file", () => {
    expect(DISTRIBUTION_KNOWLEDGE_VERSION).toBe("2026-08-31");
  });

  it("registers every myth with at least one detection pattern", () => {
    for (const entry of MYTH_FIREWALL) {
      expect(entry.patterns.length, entry.claim).toBeGreaterThan(0);
    }
  });
});

describe("distribution modes", () => {
  it("offers the five modes from the source", () => {
    expect(DISTRIBUTION_MODES.map((mode) => mode.id)).toEqual([
      "broad_reach",
      "balanced",
      "voice_first",
      "conversion_first",
      "network_first",
    ]);
  });

  it("defaults to balanced", () => {
    expect(DEFAULT_DISTRIBUTION_MODE).toBe("balanced");
    expect(getDistributionMode(DEFAULT_DISTRIBUTION_MODE).id).toBe("balanced");
  });

  it("accepts profanity in voice first and flags it in broad reach", () => {
    expect(getDistributionMode("voice_first").accepts).toContain("profanity");
    expect(getDistributionMode("broad_reach").flags).toContain("profanity");
  });

  it("accepts pure promotion risk in conversion first", () => {
    expect(getDistributionMode("conversion_first").accepts).toContain("pure promotion risk");
  });

  it("still blocks fake engagement even in voice first", () => {
    expect(getDistributionMode("voice_first").flags).toContain("fake engagement");
  });

  it("falls back to balanced for an unknown mode", () => {
    expect(getDistributionMode("nonsense" as never).id).toBe("balanced");
  });
});

describe("the Nexus distribution score", () => {
  const check = (overrides: Partial<DistributionCheck> = {}): DistributionCheck =>
    ({
      professional_relevance: { score: 8, reason: "" },
      topic_clarity: { score: 8, reason: "" },
      out_of_network_context: { score: 8, reason: "" },
      originality: { score: 8, reason: "" },
      useful_insight: { score: 8, reason: "" },
      dwell_quality: { score: 8, reason: "" },
      engagement_bait: { detected: false, severity: "none", reason: "" },
      generic_recycled: { detected: false, severity: "none", reason: "" },
      promotion_only: { detected: false, severity: "none", reason: "" },
      unconstructive_risk: { detected: false, severity: "none", reason: "" },
      media_alignment: { applicable: false, aligned: true, reason: "" },
      profanity: { detected: false, broad_recommendation_tradeoff: false, reason: "" },
      unsupported_algorithm_hack: { detected: false, details: [] },
      implementation_inference_notes: [],
      status: "PASS",
      revision_actions: [],
      summary: "",
      ...overrides,
    }) as DistributionCheck;

  it("averages the six dimensions when nothing is flagged", () => {
    expect(distributionScore(check())).toBe(8);
  });

  it("penalises a confirmed negative in proportion to severity", () => {
    const low = distributionScore(
      check({ engagement_bait: { detected: true, severity: "low", reason: "" } }),
    );
    const high = distributionScore(
      check({ engagement_bait: { detected: true, severity: "high", reason: "" } }),
    );
    expect(low).toBe(7.5);
    expect(high).toBe(5);
  });

  it("accumulates penalties across categories", () => {
    const score = distributionScore(
      check({
        engagement_bait: { detected: true, severity: "medium", reason: "" },
        generic_recycled: { detected: true, severity: "medium", reason: "" },
      }),
    );
    expect(score).toBe(5);
  });

  it("stays inside 0 to 10", () => {
    const floored = distributionScore(
      check({
        professional_relevance: { score: 1, reason: "" },
        topic_clarity: { score: 1, reason: "" },
        out_of_network_context: { score: 1, reason: "" },
        originality: { score: 1, reason: "" },
        useful_insight: { score: 1, reason: "" },
        dwell_quality: { score: 1, reason: "" },
        engagement_bait: { detected: true, severity: "high", reason: "" },
        generic_recycled: { detected: true, severity: "high", reason: "" },
      }),
    );
    expect(floored).toBeGreaterThanOrEqual(0);
  });

  it("blocks only on platform risk, not on a trade-off", () => {
    expect(blocksPublication(check({ status: "BLOCK_PLATFORM_RISK" }))).toBe(true);
    expect(blocksPublication(check({ status: "PASS_WITH_TRADEOFF" }))).toBe(false);
    expect(blocksPublication(check({ status: "REVISE" }))).toBe(false);
  });
});
