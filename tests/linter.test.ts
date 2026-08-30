/**
 * Writing rules linter tests.
 *
 * The examples in the "correct transformation" section of the writing rules
 * document are used directly: every "bad AI draft" must fail, and every "better"
 * version must pass.
 */

import { describe, expect, it } from "vitest";
import { lintPost, checkListCountConsistency } from "../src/writing-rules/linter";

const ruleIds = (text: string, options = {}): string[] =>
  lintPost(text, options).findings.map((finding) => finding.ruleId);

describe("hard errors", () => {
  it("rejects em dashes anywhere", () => {
    const result = lintPost("Governance matters — especially before deployment.");
    expect(result.passed).toBe(false);
    expect(result.errors.map((e) => e.ruleId)).toContain("no_em_dash");
  });

  it("rejects hard-banned words", () => {
    expect(ruleIds("We leverage AI to solve this.")).toContain("banned_words_hard");
    expect(ruleIds("The synergy between the teams was clear.")).toContain(
      "banned_words_hard",
    );
  });

  it("rejects trope words by default", () => {
    expect(ruleIds("AI is quietly changing procurement.")).toContain(
      "banned_words_trope",
    );
    expect(ruleIds("No hype. Just the build.")).toContain("banned_words_trope");
  });

  it("allows a trope word when the allowlist marks it literal", () => {
    const result = lintPost("The model filters background noise from the call.", {
      allowedTerms: ["noise"],
    });
    expect(result.errors.map((e) => e.ruleId)).not.toContain("banned_words_trope");
  });

  it("rejects the banned opener 'Most businesses'", () => {
    const result = lintPost("Most businesses do not map their data flows.");
    expect(result.passed).toBe(false);
    expect(result.errors.map((e) => e.ruleId)).toContain("generic_opener_hard");
  });

  it("only applies opener rules to the opening", () => {
    const padding = "Governance work starts with the deployment itself. ".repeat(4);
    const result = lintPost(`${padding}Most businesses skip this step.`);
    expect(result.errors.map((e) => e.ruleId)).not.toContain("generic_opener_hard");
  });
});

describe("banned contrast structures (rule 3)", () => {
  it("rejects 'the problem isn't X. It's Y.'", () => {
    expect(
      ruleIds("The problem isn't the model. It's the system around it."),
    ).toContain("banned_contrast_isnt");
  });

  it("rejects 'you don't need X, you need Y'", () => {
    expect(
      ruleIds("You don't need more leads, you need better follow-up."),
    ).toContain("banned_contrast_dont_need");
  });

  it("rejects the third-person form (writing rules example A)", () => {
    expect(
      ruleIds("Most businesses don't need more AI. They need better systems."),
    ).toContain("banned_contrast_dont_need");
  });

  it("does not flag an ordinary negated sentence", () => {
    const result = lintPost(
      "The deployment does not need a separate policy for every model it calls.",
    );
    expect(result.errors.map((e) => e.ruleId)).not.toContain(
      "banned_contrast_dont_need",
    );
  });

  it("rejects 'stop doing X, start doing Y'", () => {
    expect(
      ruleIds("Stop thinking about tooling, start thinking about the workflow."),
    ).toContain("banned_contrast_stop_start");
  });

  it("accepts the naturally written contrast the rules recommend", () => {
    const result = lintPost(
      "The model can be perfectly capable while the surrounding system still fails.",
    );
    expect(result.passed).toBe(true);
  });
});

describe("rule of three (rules 6, 7, 120)", () => {
  it("flags three consecutive short fragments", () => {
    expect(ruleIds("Simple. Clean. Effective.")).toContain("rule_of_three_fragments");
  });

  it("flags a three-item slogan list", () => {
    expect(ruleIds("The build was faster, smarter, better.")).toContain(
      "triadic_slogan",
    );
  });

  it("flags three consecutive sentences opening with the same word", () => {
    expect(
      ruleIds("It saves time. It saves money. It saves rework."),
    ).toContain("fake_parallelism");
  });

  it("does not flag a factual list that genuinely has three items", () => {
    const text =
      "The governance pack covers three documents. The first is the AI use register, which lists every deployed system and its owner. The second is the data-flow map showing which subprocessor receives what. The third is the incident procedure, including who must be told and within what period.";
    expect(ruleIds(text)).not.toContain("rule_of_three_fragments");
  });
});

describe("integrity rules", () => {
  it("rejects scarcity language without verification", () => {
    const result = lintPost("Only 3 spots left before the cohort closes.");
    expect(result.errors.map((e) => e.ruleId)).toContain("fake_scarcity");
  });

  it("permits scarcity language when the constraint is verified", () => {
    const result = lintPost("Only 3 spots left before the cohort closes.", {
      verifiedScarcityOrUrgency: true,
    });
    expect(result.errors.map((e) => e.ruleId)).not.toContain("fake_scarcity");
  });

  it("rejects unsupported scale claims", () => {
    expect(
      ruleIds("After working with hundreds of agencies, the pattern is obvious."),
    ).toContain("fake_social_proof");
  });

  it("rejects phony precision", () => {
    expect(ruleIds("This workflow is 10x better than the manual process.")).toContain(
      "phony_precision",
    );
  });
});

describe("warnings", () => {
  it("flags AI-tell transitions", () => {
    expect(ruleIds("Here's the thing. Governance starts at the deployment.")).toContain(
      "ai_tell_transition",
    );
  });

  it("flags buzzwords", () => {
    expect(ruleIds("A seamless, cutting-edge platform.")).toContain("buzzwords");
  });

  it("flags engagement bait unless the user asked for it", () => {
    expect(ruleIds("Agree?")).toContain("cta_bait");
    expect(ruleIds("Agree?", { permitEngagementCta: true })).not.toContain("cta_bait");
  });

  it("flags US spellings and names the UK form", () => {
    const finding = lintPost("The organization analyzed its data.").findings.find(
      (f) => f.ruleId === "us_spelling",
    );
    expect(finding).toBeDefined();
    expect(finding?.suggestion).toContain("organisation");
  });

  it("flags Tuesday as an invented illustrative day (rule 46)", () => {
    expect(ruleIds("On Tuesday the form stopped sending enquiries.")).toContain(
      "illustrative_day",
    );
  });

  it("keeps Tuesday when the day is a sourced fact", () => {
    expect(
      ruleIds("On Tuesday the form stopped sending enquiries.", {
        dayReferencesAreFactual: true,
      }),
    ).not.toContain("illustrative_day");
  });

  it("flags mechanical framework headings", () => {
    expect(ruleIds("Problem:\nLeads go cold.\n\nSolution:\nReply faster.")).toContain(
      "mechanical_heading",
    );
  });

  it("flags hashtags and emoji by default only", () => {
    expect(ruleIds("Governance matters. #AI #compliance")).toContain("hashtags");
    expect(
      ruleIds("Governance matters. #AI", { permitHashtags: true }),
    ).not.toContain("hashtags");
  });
});

describe("structural heuristics", () => {
  it("flags a wall of one-line paragraphs", () => {
    const text = Array.from(
      { length: 10 },
      (_, i) => `Sentence number ${i} about the deployment.`,
    ).join("\n\n");
    expect(ruleIds(text)).toContain("excessive_one_line_paragraphs");
  });

  it("flags a premise restated rather than advanced (rule 10)", () => {
    const text = [
      "People are selling AI systems without governance.",
      "A lot of AI builders are selling systems without governance.",
    ].join("\n\n");
    expect(ruleIds(text)).toContain("repeated_premise");
  });

  it("does not flag a second paragraph that moves the argument forward", () => {
    const text = [
      "People are selling AI systems without governance.",
      "Once the product starts handling client data, contacting customers or making decisions, that omission can become a legal and operational problem.",
    ].join("\n\n");
    expect(ruleIds(text)).not.toContain("repeated_premise");
  });
});

describe("list hook count consistency", () => {
  it("errors when the hook count does not match the body", () => {
    const finding = checkListCountConsistency(
      "7 reasons your leads stop replying.",
      "1. First\n2. Second\n3. Third",
    );
    expect(finding?.ruleId).toBe("list_count_mismatch");
    expect(finding?.severity).toBe("error");
  });

  it("passes when the counts match", () => {
    expect(
      checkListCountConsistency("3 reasons leads go cold.", "1. One\n2. Two\n3. Three"),
    ).toBeNull();
  });

  it("ignores a hook with no promised count", () => {
    expect(
      checkListCountConsistency("Fix your response time.", "1. One\n2. Two"),
    ).toBeNull();
  });
});

describe("the document's own transformation examples (section 124)", () => {
  const cases: Array<{ label: string; bad: string; better: string }> = [
    {
      label: "Example A",
      bad: "Most businesses don't need more AI. They need better systems.",
      better: "Buying another AI tool will not fix a workflow nobody has mapped.",
    },
    {
      label: "Example B",
      bad: "AI is quietly transforming the business landscape.",
      better:
        "AI agents are starting to make decisions inside workflows that used to stop and wait for a person.",
    },
    {
      label: "Example E",
      bad: "You don't need a 2,000-word mega prompt. You need a better setup.",
      better:
        "My Claude Code builds improved far more when I fixed the project setup than when I made the prompts longer.",
    },
  ];

  for (const { label, bad, better } of cases) {
    it(`${label}: rejects the bad draft`, () => {
      expect(lintPost(bad).passed).toBe(false);
    });

    it(`${label}: accepts the better version`, () => {
      const result = lintPost(better);
      expect(result.errors).toHaveLength(0);
    });
  }
});
