/**
 * Framework selection tests.
 *
 * Spec section 67 step 7 asks for these specifically. They exist to hold two
 * failure conditions from section 64 closed: "every post uses SLAY" and "the
 * model invents personal stories".
 */

import { describe, expect, it } from "vitest";
import {
  recommendFrameworks,
  isFrameworkPermitted,
  RECENCY_WINDOW,
  type IdeaSignals,
} from "../src/frameworks/selection";

const NO_SIGNALS: IdeaSignals = {
  hasTruePersonalEvent: false,
  identifiesExpensiveProblem: false,
  isStrongOpinion: false,
  isTacticalOrEducational: false,
  isProofLed: false,
  isDirectlyCommercial: false,
  hasGenuineEmotionalReaction: false,
  hasEvidencedCommonBelief: false,
  hasRealCostFigure: false,
  hasDominantObjection: false,
};

const signals = (overrides: Partial<IdeaSignals>): IdeaSignals => ({
  ...NO_SIGNALS,
  ...overrides,
});

describe("spec section 25 preference orders", () => {
  it("prefers lara_slay when the idea contains a true personal event", () => {
    const result = recommendFrameworks(signals({ hasTruePersonalEvent: true }));
    expect(result.frameworkIds[0]).toBe("lara_slay");
    expect(result.hookFamilyIds).toContain("story_opener");
  });

  it("prefers the C2C post formula for an expensive problem, led by loss aversion", () => {
    const result = recommendFrameworks(
      signals({ identifiesExpensiveProblem: true }),
    );
    expect(result.frameworkIds[0]).toBe("c2c_post_formula");
    expect(result.psychologyIds[0]).toBe("loss_aversion");
    expect(result.hookFamilyIds[0]).toBe("statement");
  });

  it("prefers the psych SLAY variant and list hooks for tactical ideas", () => {
    const result = recommendFrameworks(
      signals({ isTacticalOrEducational: true }),
    );
    expect(result.frameworkIds[0]).toBe("psych_slay_variant");
    expect(result.hookFamilyIds[0]).toBe("list");
    expect(result.psychologyIds).toContain("cognitive_fluency");
  });

  it("prefers the content engine and the proof pillar for proof-led ideas", () => {
    const result = recommendFrameworks(signals({ isProofLed: true }));
    expect(result.frameworkIds[0]).toBe("c2c_content_engine");
    expect(result.pillarIds).toContain("proof");
  });

  it("leads with label and conditional hooks plus choice reduction when commercial", () => {
    const result = recommendFrameworks(signals({ isDirectlyCommercial: true }));
    expect(result.hookFamilyIds[0]).toBe("label");
    expect(result.psychologyIds).toContain("choice_reduction");
    expect(result.pillarIds).toContain("conversion");
  });

  it("collapses the dominant objection when one exists", () => {
    const result = recommendFrameworks(
      signals({ isDirectlyCommercial: true, hasDominantObjection: true }),
    );
    expect(result.frameworkIds[0]).toBe("hormozi_post_objection_collapse");
  });
});

describe("integrity gates", () => {
  it("blocks story frameworks when no true personal event was supplied", () => {
    const result = recommendFrameworks(signals({ identifiesExpensiveProblem: true }));

    expect(result.frameworkIds).not.toContain("lara_slay");
    expect(result.hookFamilyIds).not.toContain("story_opener");

    const blockedIds = result.blocked.map((entry) => entry.id);
    expect(blockedIds).toContain("lara_slay");
    expect(blockedIds).toContain("story_opener");
  });

  it("blocks the exclamation hook without a genuine reaction", () => {
    const result = recommendFrameworks(signals({ isStrongOpinion: true }));
    expect(result.hookFamilyIds).not.toContain("exclamation");
    expect(result.blocked.map((b) => b.id)).toContain("exclamation");
  });

  it("allows the exclamation hook when the reaction is genuine", () => {
    const result = recommendFrameworks(
      signals({ isStrongOpinion: true, hasGenuineEmotionalReaction: true }),
    );
    expect(result.hookFamilyIds).toContain("exclamation");
  });

  it("blocks the unpopular truth pattern without an evidenced common belief", () => {
    const result = recommendFrameworks(signals({ isStrongOpinion: true }));
    expect(result.frameworkIds).not.toContain("hormozi_unpopular_truth");
  });

  it("blocks risk reversal without an approved guarantee", () => {
    const result = recommendFrameworks(
      signals({ isDirectlyCommercial: true, hasApprovedGuarantee: false }),
    );
    expect(result.frameworkIds).not.toContain("hormozi_post_risk_reversal");
    expect(isFrameworkPermitted("hormozi_post_risk_reversal", result).permitted).toBe(
      false,
    );
  });

  it("allows risk reversal once a guarantee is approved", () => {
    const result = recommendFrameworks(
      signals({ isDirectlyCommercial: true, hasApprovedGuarantee: true }),
    );
    expect(result.frameworkIds).toContain("hormozi_post_risk_reversal");
  });

  it("blocks the delivery-choice structure without stored tiers", () => {
    const result = recommendFrameworks(signals({ isDirectlyCommercial: true }));
    expect(result.frameworkIds).not.toContain("hormozi_post_delivery_choice");
  });

  it("blocks the counter-intuition pattern without a real cost figure", () => {
    const result = recommendFrameworks(
      signals({ hasTruePersonalEvent: true, isProofLed: true }),
    );
    expect(result.frameworkIds).not.toContain("hormozi_counter_intuition");
    expect(result.blocked.map((b) => b.id)).toContain("hormozi_counter_intuition");
  });

  it("does not force offer frameworks onto non-commercial ideas (spec section 96)", () => {
    const result = recommendFrameworks(signals({ hasTruePersonalEvent: true }));
    const blockedIds = result.blocked.map((entry) => entry.id);
    expect(blockedIds).toContain("hormozi_scarcity_urgency");
  });
});

describe("variation (writing rule 65)", () => {
  it("demotes a framework used across the recent window", () => {
    const base = recommendFrameworks(signals({ hasTruePersonalEvent: true }));
    expect(base.frameworkIds[0]).toBe("lara_slay");

    const repeated = recommendFrameworks(
      signals({
        hasTruePersonalEvent: true,
        recentFrameworkIds: Array.from({ length: RECENCY_WINDOW }, () => "lara_slay"),
      }),
    );

    expect(repeated.frameworkIds[0]).not.toBe("lara_slay");
  });

  it("keeps a framework when it is the only structure that fits", () => {
    const result = recommendFrameworks(
      signals({
        identifiesExpensiveProblem: true,
        recentFrameworkIds: [
          "c2c_post_formula",
          "c2c_post_formula",
          "c2c_content_engine",
        ],
      }),
    );
    expect(result.frameworkIds.length).toBeGreaterThan(0);
  });

  it("never returns an empty framework list", () => {
    const result = recommendFrameworks(
      signals({
        identifiesExpensiveProblem: true,
        recentFrameworkIds: Array.from({ length: 20 }, () => "c2c_post_formula"),
        recentHookFamilyIds: Array.from({ length: 20 }, () => "statement"),
      }),
    );
    expect(result.frameworkIds.length).toBeGreaterThan(0);
    expect(result.hookFamilyIds.length).toBeGreaterThan(0);
  });
});

describe("fallbacks and shape", () => {
  it("falls back to the general post formula when no signal fires", () => {
    const result = recommendFrameworks(NO_SIGNALS);
    expect(result.frameworkIds).toContain("c2c_post_formula");
    expect(result.rationale.join(" ")).toContain("No strong shape signal");
  });

  it("returns at most four hook families (spec section 27)", () => {
    const result = recommendFrameworks(
      signals({
        hasTruePersonalEvent: true,
        identifiesExpensiveProblem: true,
        isStrongOpinion: true,
        isTacticalOrEducational: true,
        isProofLed: true,
        isDirectlyCommercial: true,
        hasGenuineEmotionalReaction: true,
      }),
    );
    expect(result.hookFamilyIds.length).toBeLessThanOrEqual(4);
  });

  it("gives a rationale so the system can explain its structure choice", () => {
    const result = recommendFrameworks(signals({ identifiesExpensiveProblem: true }));
    expect(result.rationale.length).toBeGreaterThan(0);
  });
});
