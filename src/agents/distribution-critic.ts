/**
 * LinkedIn Distribution Critic.
 *
 * Runs after the editorial critic and the fact checker, before the final
 * revision (source section 36).
 *
 * Its job is to find LinkedIn-confirmed distribution problems, not to make the
 * post safe. Source section 55 is blunt about this: the module must not become
 * an excuse to flatten the author. Strong opinion, direct disagreement and
 * humour are all explicitly permitted by LinkedIn, and the threshold here is
 * evidence-based recommendation risk rather than generic caution.
 *
 * Deterministic folklore detection runs alongside the model call, so algorithm
 * mythology gets caught whatever the model happens to believe.
 */

import { generateStructured } from "../lib/responses";
import {
  distributionCheckSchema,
  distributionScore,
  type DistributionCheck,
} from "../schemas/distribution";
import {
  BROAD_RECOMMENDATION_GATE,
  DISTRIBUTION_KNOWLEDGE_VERSION,
  DISTRIBUTION_RULES,
  HARD_FAIL_CONDITIONS,
  SOFT_WARNINGS,
  detectAlgorithmFolklore,
  getDistributionMode,
  type DistributionMode,
} from "../frameworks/linkedin-distribution";
import type { IdeaAnalysis } from "../schemas/strategy";

const DISTRIBUTION_CRITIC_PROMPT = `
You are the LinkedIn Distribution Critic.

Evaluate the draft against LinkedIn's currently published recommendation
guidance. Use only LinkedIn-confirmed categories and clearly labelled Nexus
implementation inferences.

HARD CONSTRAINTS
- Do not invent algorithm weights, multipliers or thresholds. LinkedIn publishes none.
- Do not optimise for 360Brew. It was an internal test, it was shut down, and it is not the current ranking system.
- Do not apply unsupported rules about posting time, first-hour velocity, hashtag counts, external-link penalties, editing penalties, save or comment multipliers, link-in-comments tricks, or automatic format boosts.
- Do not diagnose a shadow ban. Say "may not be eligible for broad recommendation" where that is what you mean.
- Never state a target dwell time. No creator-facing threshold is published.

WHAT YOU ARE LOOKING FOR
Confirmed by LinkedIn:
- professional relevance and a clear professional subject
- whether an out-of-network reader has enough context
- original insight rather than paraphrase
- engagement bait
- generic or recycled content with no new angle
- promotional-only content with no professional value
- media that does not relate to the text
- unconstructive tone: mocking, talking down, provoking, jokes at others' expense
- exaggerating to create fear
- inauthentic engagement tactics

Judged as inference, and reported as such:
- topic coherence
- read-through quality: does the hook create real interest, does the next line advance it, does the middle carry new information, does the payoff land

WHAT YOU MUST NOT DO
Do not rewrite a strong voice into corporate language. LinkedIn permits opinion,
disagreement, humour and strong professional perspectives. A confident, direct,
opinionated post is not a distribution problem. Only flag what the evidence
supports.

A trade-off the author has chosen knowingly is not a failure. Profanity in
voice_first mode, or direct selling in conversion_first mode, is PASS_WITH_TRADEOFF
rather than REVISE.

STATUS
PASS                  strong fit with published guidance
PASS_WITH_TRADEOFF    an intentional characteristic that may reduce broad reach but serves voice or conversion
REVISE                a correctable problem: bait, generic language, weak context, media mismatch
BLOCK_PLATFORM_RISK   prohibited automation, spam manipulation, fake engagement or another policy problem

If there is no meaningful issue, return PASS with empty revision actions. Do not
manufacture concerns to look thorough.
`.trim();

export interface DistributionCriticInput {
  draft: string;
  analysis: IdeaAnalysis;
  mode: DistributionMode;
  /** Description of any attached media, for the alignment check. */
  mediaDescription?: string;
}

export interface DistributionResult {
  check: DistributionCheck;
  /** The Nexus Distribution Score. Never a prediction of LinkedIn's ranking. */
  score: number;
  /** Folklore found deterministically, independent of the model's judgement. */
  folklore: ReturnType<typeof detectAlgorithmFolklore>;
}

export async function runDistributionCritic({
  draft,
  analysis,
  mode,
  mediaDescription,
}: DistributionCriticInput): Promise<DistributionResult> {
  const modeDefinition = getDistributionMode(mode);

  const confirmedRules = DISTRIBUTION_RULES.filter(
    (rule) => rule.evidence === "CONFIRMED" || rule.evidence === "CONFIRMED_CATEGORY",
  )
    .map((rule) => `- [${rule.evidence}] ${rule.statement}\n  Apply as: ${rule.application}`)
    .join("\n");

  const input = [
    `# DRAFT\n${draft}`,
    `# OBJECTIVE\nPrimary objective: ${analysis.primary_objective}\nReader stage: ${analysis.reader_stage}\nAudience: ${analysis.target_audience}\nCore claim: ${analysis.core_claim}\nCTA: ${analysis.cta_type}`,
    `# DISTRIBUTION MODE: ${modeDefinition.label}\n${modeDefinition.description}\nFlag in this mode: ${modeDefinition.flags.join(", ")}\nAccepted in this mode (report as trade-offs, not failures): ${
      modeDefinition.accepts.join(", ") || "none"
    }`,
    mediaDescription
      ? `# ATTACHED MEDIA\n${mediaDescription}`
      : "# ATTACHED MEDIA\nNone. Set media_alignment.applicable to false.",
    `# CONFIRMED LINKEDIN GUIDANCE (knowledge version ${DISTRIBUTION_KNOWLEDGE_VERSION})\n${confirmedRules}`,
    `# BROAD RECOMMENDATION GATE\n${BROAD_RECOMMENDATION_GATE.map((item) => `- ${item}`).join("\n")}`,
    `# HARD FAILS (these are BLOCK_PLATFORM_RISK)\n${HARD_FAIL_CONDITIONS.map((item) => `- ${item}`).join("\n")}`,
    `# SOFT WARNINGS (warn, do not block; legitimate depending on objective)\n${SOFT_WARNINGS.map((item) => `- ${item}`).join("\n")}`,
    "# TASK\nReturn the distribution check. Give a reason for every score and every detection. Put anything you inferred rather than took from confirmed guidance into implementation_inference_notes.",
  ].join("\n\n");

  const check = await generateStructured({
    role: "primary",
    system: DISTRIBUTION_CRITIC_PROMPT,
    input,
    schema: distributionCheckSchema,
    schemaName: "linkedin_distribution_check",
  });

  // Deterministic folklore detection. The model is asked not to repeat
  // mythology, and this catches it if it does anyway.
  const folklore = detectAlgorithmFolklore(draft);
  if (folklore.length > 0) {
    check.unsupported_algorithm_hack = {
      detected: true,
      details: [
        ...new Set([
          ...check.unsupported_algorithm_hack.details,
          ...folklore.map((hit) => `${hit.claim} (${hit.status}): "${hit.excerpt}"`),
        ]),
      ],
    };

    // A post asserting a false platform claim needs correcting whatever else
    // the critic concluded, but it is not a platform-policy violation.
    if (check.status === "PASS") check.status = "REVISE";
    for (const hit of folklore) {
      const action = `Remove or correct the claim that ${hit.claim.toLowerCase()}. ${
        hit.note ?? "There is no primary-source evidence for it."
      }`;
      if (!check.revision_actions.includes(action)) check.revision_actions.push(action);
    }
  }

  return { check, score: distributionScore(check), folklore };
}

/** Render a distribution check for the revision writer. */
export function renderDistributionFindings(result: DistributionResult): string {
  const { check } = result;
  if (check.status === "PASS" && check.revision_actions.length === 0) {
    return "The distribution check passed with no actions.";
  }

  const lines = [`Distribution status: ${check.status}. ${check.summary}`];

  if (check.revision_actions.length) {
    lines.push(
      `\nRequired changes:\n${check.revision_actions.map((action) => `  - ${action}`).join("\n")}`,
    );
  }

  if (check.implementation_inference_notes.length) {
    lines.push(
      `\nInferred concerns (Nexus judgement, not LinkedIn-confirmed rules). Weigh these, do not treat them as platform requirements:\n${check.implementation_inference_notes
        .map((note) => `  - ${note}`)
        .join("\n")}`,
    );
  }

  lines.push(
    "\nDo not flatten the author's voice to satisfy this check. Strong opinion, direct disagreement and humour are all permitted by LinkedIn.",
  );

  return lines.join("\n");
}
