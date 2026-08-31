/**
 * The generation pipeline.
 *
 * Runs the primary user flow from spec section 5:
 *
 *   idea -> analysis -> retrieval -> hooks -> scoring -> outline -> draft
 *        -> critic -> research if required -> revision -> ready for review
 *
 * Stages are separate agent calls rather than one prompt, so each boundary is a
 * schema and each failure is attributable to a stage.
 */

import { runStrategist } from "../agents/strategist";
import { runHookGenerator } from "../agents/hook-generator";
import { runHookCritic, selectTopHooks, type RankedHook } from "../agents/hook-critic";
import { runOutlineBuilder } from "../agents/outline-builder";
import { runWriter } from "../agents/writer";
import { runCritic } from "../agents/critic";
import { runRevisionWriter } from "../agents/revision-writer";
import { requiresResearch, runFactChecker } from "../agents/fact-checker";
import {
  runDistributionCritic,
  renderDistributionFindings,
  type DistributionResult,
} from "../agents/distribution-critic";
import {
  DEFAULT_DISTRIBUTION_MODE,
  type DistributionMode,
} from "../frameworks/linkedin-distribution";
import { runOfferStrategist } from "../agents/offer-strategist";
import { retrieveFrameworksForPost } from "../retrieval/framework-retrieval";
import { lintPost, type LintOptions, type LintResult } from "../writing-rules/linter";
import { runAdjuster } from "../agents/adjuster";
import { characterBudget, composePost, type ComposedPost } from "../lib/compose";
import { CRITIC_PASS_THRESHOLD, type CriticReport } from "../schemas/critic";
import type { GenerationContext } from "../agents/types";
import type { IdeaAnalysis } from "../schemas/strategy";
import type { Outline } from "../schemas/outline";
import type { FactCheckReport } from "../schemas/factcheck";
import type { CommercialAnalysis } from "../schemas/offer";
import type { HookCandidate } from "../schemas/hooks";
import type { PostState } from "./state-machine";

export type ProductMode = "quick_draft" | "strategy" | "research" | "rewrite";

export interface GeneratePostOptions {
  mode?: ProductMode;
  /** Maximum revision passes. Each pass costs a model call. */
  maxRevisions?: number;
  lintOptions?: LintOptions;
  /** Which trade-offs this post is willing to make. Source section 54. */
  distributionMode?: DistributionMode;
  /** Description of attached media, for the alignment check. */
  mediaDescription?: string;
  /**
   * Stop after hooks are scored and return them for the user to choose.
   * Used by the hook screen.
   */
  pauseForHookSelection?: boolean;
  /** A hook the user already chose. Skips generation and scoring. */
  selectedHook?: HookCandidate;
  onStateChange?: (state: PostState) => void;
}

export interface GeneratePostResult {
  state: PostState;
  analysis: IdeaAnalysis;
  strategyCorrections: string[];
  commercial?: CommercialAnalysis;
  hooks: RankedHook[];
  selectedHook?: HookCandidate;
  outline?: Outline;
  draft?: string;
  criticReport?: CriticReport;
  research?: FactCheckReport;
  distribution?: DistributionResult;
  /** The finished post: body plus sign-off, with its verified length. */
  composed?: ComposedPost;
  lint?: LintResult;
  revisionCount: number;
  /** Populated when the pipeline returned a draft that still fails the linter. */
  unresolvedLintErrors: string[];
  frameworkWarnings: string[];
}

export async function generatePost(
  context: GenerationContext,
  options: GeneratePostOptions = {},
): Promise<GeneratePostResult> {
  const {
    mode = "quick_draft",
    maxRevisions = 2,
    lintOptions,
    distributionMode = DEFAULT_DISTRIBUTION_MODE,
    mediaDescription,
    pauseForHookSelection = false,
    selectedHook,
    onStateChange,
  } = options;

  const setState = (state: PostState): PostState => {
    onStateChange?.(state);
    return state;
  };

  setState("idea_captured");

  // --- Strategy -------------------------------------------------------------
  const { analysis, recommendation, corrections } = await runStrategist(context);
  setState("analysed");

  const frameworkWarnings: string[] = [...corrections];
  const { unknownIds } = retrieveFrameworksForPost(analysis);
  if (unknownIds.length) {
    frameworkWarnings.push(
      `Strategist referenced framework IDs not in the registry: ${unknownIds.join(", ")}. They were ignored.`,
    );
  }

  // --- Commercial diagnosis --------------------------------------------------
  let commercial: CommercialAnalysis | undefined;
  if (analysis.signals.isDirectlyCommercial) {
    commercial = await runOfferStrategist(context, analysis);
  }

  const result: GeneratePostResult = {
    state: "analysed",
    analysis,
    strategyCorrections: corrections,
    ...(commercial ? { commercial } : {}),
    hooks: [],
    revisionCount: 0,
    unresolvedLintErrors: [],
    frameworkWarnings,
  };

  // --- Hooks -----------------------------------------------------------------
  let hook = selectedHook;

  if (!hook) {
    const candidates = await runHookGenerator(context, analysis);
    result.state = setState("hooks_generated");

    const ranked = await runHookCritic(context, analysis, candidates);
    result.hooks = selectTopHooks(ranked);

    if (ranked.length === 0) {
      throw new Error(
        "No usable hook survived generation and scoring. This usually means the idea has no material the body can deliver on. Ask the user for the missing detail rather than generating one.",
      );
    }

    if (pauseForHookSelection || mode === "strategy") {
      return result;
    }

    hook = ranked[0]!.candidate;
  }

  result.selectedHook = hook;
  result.state = setState("hook_selected");

  // --- Research --------------------------------------------------------------
  // Research runs before drafting when the strategist already knows the idea
  // carries current or high-risk claims. Verifying after drafting means the
  // writer has already committed to a claim the evidence may not support.
  let research: FactCheckReport | undefined;
  const researchUpFront =
    mode === "research" || analysis.risk_level === "high" || analysis.research_required;

  if (researchUpFront) {
    result.state = setState("research_pending");
    research = await runFactChecker({
      draft: `${analysis.core_claim}\n\n${analysis.research_questions.join("\n")}`,
      analysis,
      userSuppliedMaterial: analysis.proof_available,
    });
    result.research = research;
    result.state = setState("researched");
  }

  // --- Outline and draft -----------------------------------------------------
  const outline = await runOutlineBuilder(context, analysis, hook);
  result.outline = outline;
  result.state = setState("outlined");

  let draft = await runWriter({
    context,
    analysis,
    outline,
    research: research ?? null,
  });
  result.draft = draft;
  result.state = setState("drafted");

  // --- Post-draft research ---------------------------------------------------
  // A draft can introduce a checkable claim the strategist did not anticipate.
  if (!research && requiresResearch(analysis, draft)) {
    result.state = setState("research_pending");
    research = await runFactChecker({
      draft,
      analysis,
      userSuppliedMaterial: analysis.proof_available,
    });
    result.research = research;
    result.state = setState("researched");
  }

  // --- Critic and revision loop ----------------------------------------------
  let revisions = 0;

  while (revisions <= maxRevisions) {
    const { report, lint } = await runCritic({
      context,
      analysis,
      draft,
      ...(lintOptions ? { lintOptions } : {}),
    });
    result.criticReport = report;
    result.lint = lint;
    result.state = setState("critiqued");

    const clean = lint.passed && report.score >= CRITIC_PASS_THRESHOLD;
    const blocking =
      report.verdict !== "ready" ||
      report.problems.some((problem) => problem.severity === "blocking") ||
      report.contains_invented_experience ||
      !lint.passed;

    // Distribution check runs after editorial critique and fact checking, so
    // it judges the draft the reader would actually get.
    const distribution = await runDistributionCritic({
      draft,
      analysis,
      mode: distributionMode,
      ...(mediaDescription ? { mediaDescription } : {}),
    });
    result.distribution = distribution;

    const distributionBlocking =
      distribution.check.status === "BLOCK_PLATFORM_RISK" ||
      distribution.check.status === "REVISE";

    if (clean && !blocking && !distributionBlocking) break;
    if (revisions === maxRevisions) break;

    draft = await runRevisionWriter({
      context,
      draft,
      report,
      research: research ?? null,
      distributionNotes: renderDistributionFindings(distribution),
      ...(lintOptions ? { lintOptions } : {}),
    });
    result.draft = draft;
    revisions += 1;
    result.revisionCount = revisions;
  }

  // --- Assembly and the character limit -------------------------------------
  // The sign-off is appended by code rather than written by the model, so the
  // branding is exact and the length is arithmetic rather than an estimate.
  const signOff = context.requirements?.includeSignOff ? context.signOff : null;
  const budget = characterBudget(signOff);

  let composed = composePost(draft, signOff);

  // One shortening pass if the finished post would be truncated. The writer was
  // given the budget up front, so this is a fallback rather than the mechanism.
  if (!composed.withinLimit) {
    draft = await runAdjuster({
      draft: composed.body,
      adjustment: "shorter",
      voiceProfile: context.voiceProfile,
      customInstruction:
        `Cut this to under ${budget.bodyTarget} characters. It is currently ${composed.body.length}. ` +
        "Remove whole paragraphs that only restate another, and remove qualifiers that do not change whether a claim is true. " +
        "Do not remove evidence, specificity or the payoff. Do not add a sign-off.",
      ...(lintOptions ? { lintOptions } : {}),
    }).then((result) => result.text);

    composed = composePost(draft, signOff);
    result.revisionCount += 1;
  }

  result.composed = composed;
  result.draft = composed.text;

  // Final deterministic gate. A draft that still trips a hard rule is returned
  // with the failures named rather than silently presented as finished.
  const finalLint = lintPost(composed.text, lintOptions);
  result.lint = finalLint;
  result.unresolvedLintErrors = finalLint.errors.map(
    (error) => `${error.ruleId}: "${error.excerpt}" (writing rules section ${error.ruleRef})`,
  );

  result.state = setState("ready_for_review");
  return result;
}
