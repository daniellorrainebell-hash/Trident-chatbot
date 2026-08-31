/**
 * Schema and gating tests.
 *
 * These cover the boundaries where a model's output becomes an action: whether a
 * guarantee may be quoted, whether scarcity may be claimed, and whether the post
 * state machine allows a transition.
 */

import { describe, expect, it } from "vitest";
import {
  isConstraintUsable,
  isGuaranteeUsable,
  offerSchema,
} from "../src/schemas/offer";
import {
  DEFAULT_VOICE_PROFILE,
  mergeVoiceProfile,
  voiceProfileSchema,
} from "../src/schemas/voice";
import { canTransition } from "../src/pipeline/state-machine";
import { ideaAnalysisSchema } from "../src/schemas/strategy";

describe("commercial gating", () => {
  it("refuses an unapproved guarantee", () => {
    expect(
      isGuaranteeUsable({ type: "conditional", terms: "Full refund", approved: false }),
    ).toBe(false);
  });

  it("allows an approved guarantee", () => {
    expect(
      isGuaranteeUsable({ type: "conditional", terms: "Full refund", approved: true }),
    ).toBe(true);
  });

  it("refuses a missing guarantee", () => {
    expect(isGuaranteeUsable(null)).toBe(false);
    expect(isGuaranteeUsable(undefined)).toBe(false);
  });

  it("refuses scarcity that is active but never verified", () => {
    expect(
      isConstraintUsable({ active: true, verified_at: null }),
    ).toBe(false);
  });

  it("refuses scarcity that is verified but not active", () => {
    expect(
      isConstraintUsable({ active: false, verified_at: "2026-08-01T00:00:00Z" }),
    ).toBe(false);
  });

  it("refuses an unparseable verification date", () => {
    expect(isConstraintUsable({ active: true, verified_at: "soon" })).toBe(false);
  });

  it("allows an active, verified constraint", () => {
    expect(
      isConstraintUsable({ active: true, verified_at: "2026-08-01T00:00:00Z" }),
    ).toBe(true);
  });

  it("accepts an offer with no guarantee, scarcity or urgency", () => {
    const parsed = offerSchema.safeParse({
      offer_name: "Governance Readiness Audit",
      avatar: "AI agencies",
      problem: "Deployments reach production with no documented controls.",
      dream_outcome: "Deploy with governance mapped before go-live.",
      core_deliverables: ["Data-flow map", "Risk register"],
      delivery_mode: "DFY",
      time_to_first_value: "Two weeks",
      client_effort: "One workshop",
      proof: [],
      bonuses: [],
      guarantee: null,
      scarcity: null,
      urgency: null,
      price: null,
      cta: "Message about a governance build",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("voice profile", () => {
  it("parses an empty object into usable defaults", () => {
    expect(DEFAULT_VOICE_PROFILE.language).toBe("UK English");
    expect(voiceProfileSchema.parse({}).sentence_length).toBe("short_to_medium");
  });

  it("merges additively without duplicating", () => {
    const merged = mergeVoiceProfile(
      { ...DEFAULT_VOICE_PROFILE, banned_words: ["leverage"] },
      { banned_words: ["leverage", "synergy"] },
    );
    expect(merged.banned_words).toEqual(["leverage", "synergy"]);
  });

  it("ignores blank preference entries", () => {
    const merged = mergeVoiceProfile(DEFAULT_VOICE_PROFILE, {
      preferred_patterns: ["  ", "direct audience callout"],
    });
    expect(merged.preferred_patterns).toEqual(["direct audience callout"]);
  });

  it("preserves settings the update does not touch", () => {
    const merged = mergeVoiceProfile(
      { ...DEFAULT_VOICE_PROFILE, humour: "frequent" },
      { banned_words: ["hype"] },
    );
    expect(merged.humour).toBe("frequent");
  });
});

describe("post state machine", () => {
  it("allows forward transitions", () => {
    expect(canTransition("idea_captured", "analysed")).toBe(true);
  });

  it("allows skipping states that do not apply", () => {
    expect(canTransition("analysed", "hooks_generated")).toBe(true);
  });

  it("refuses arbitrary backward transitions", () => {
    expect(canTransition("published", "drafted")).toBe(false);
  });

  it("allows a critiqued draft back to drafted for revision", () => {
    expect(canTransition("critiqued", "drafted")).toBe(true);
  });

  it("allows an approved post to be edited again", () => {
    expect(canTransition("approved", "user_edited")).toBe(true);
  });

  it("refuses unknown states", () => {
    expect(canTransition("idea_captured", "nonsense" as never)).toBe(false);
  });
});

describe("idea analysis schema", () => {
  it("requires at least one content pillar and hook family", () => {
    const base = {
      topic: "AI governance",
      core_claim: "Governance belongs before deployment.",
      target_audience: "AI agencies",
      reader_stage: "awareness",
      content_pillars: [],
      primary_objective: "authority",
      primary_psychology: "loss_aversion",
      secondary_psychology: [],
      signals: {
        hasTruePersonalEvent: false,
        identifiesExpensiveProblem: true,
        isStrongOpinion: false,
        isTacticalOrEducational: false,
        isProofLed: false,
        isDirectlyCommercial: false,
        hasGenuineEmotionalReaction: false,
        hasEvidencedCommonBelief: false,
        hasRealCostFigure: false,
        hasDominantObjection: false,
      },
      recommended_framework: "c2c_post_formula",
      backup_frameworks: [],
      recommended_hook_families: ["statement"],
      framework_rationale: "The idea names a cost.",
      proof_available: [],
      proof_missing: [],
      research_required: false,
      research_questions: [],
      risk_level: "medium",
      distribution_goal: "broad",
      professional_relevance: {
        primary_topic: "AI governance",
        professional_context: "Deploying AI systems that touch client data",
        target_professional_audience: "AI agencies",
        why_this_matters_to_them: "They carry the obligation they are not describing.",
      },
      original_angle: "Governance framed from the deployment rather than the policy.",
      cta_type: "none",
      tone_notes: [],
    };

    expect(ideaAnalysisSchema.safeParse(base).success).toBe(false);
    expect(
      ideaAnalysisSchema.safeParse({ ...base, content_pillars: ["problem"] }).success,
    ).toBe(true);
  });

  it("caps hook families at four (spec section 27)", () => {
    const parsed = ideaAnalysisSchema.safeParse({
      topic: "t",
      core_claim: "c",
      target_audience: "a",
      reader_stage: "awareness",
      content_pillars: ["problem"],
      primary_objective: "authority",
      primary_psychology: "loss_aversion",
      secondary_psychology: [],
      signals: {
        hasTruePersonalEvent: false,
        identifiesExpensiveProblem: true,
        isStrongOpinion: false,
        isTacticalOrEducational: false,
        isProofLed: false,
        isDirectlyCommercial: false,
        hasGenuineEmotionalReaction: false,
        hasEvidencedCommonBelief: false,
        hasRealCostFigure: false,
        hasDominantObjection: false,
      },
      recommended_framework: "c2c_post_formula",
      backup_frameworks: [],
      recommended_hook_families: ["statement", "label", "conditional", "command", "list"],
      framework_rationale: "r",
      proof_available: [],
      proof_missing: [],
      research_required: false,
      research_questions: [],
      risk_level: "low",
      distribution_goal: "broad",
      professional_relevance: {
        primary_topic: "AI governance",
        professional_context: "Deploying AI systems that touch client data",
        target_professional_audience: "AI agencies",
        why_this_matters_to_them: "They carry the obligation they are not describing.",
      },
      original_angle: "Governance framed from the deployment rather than the policy.",
      cta_type: "none",
      tone_notes: [],
    });
    expect(parsed.success).toBe(false);
  });
});
