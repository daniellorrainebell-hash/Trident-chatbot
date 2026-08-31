/**
 * Agent 1: Strategist.
 *
 * Understands the idea, identifies audience and pillar, selects psychology and
 * framework, determines proof and research requirements and sets the CTA.
 *
 * Returns structured JSON only. It does not write.
 *
 * Deliberate division of labour: the model reports signals about the idea, and
 * deterministic code in frameworks/selection.ts converts those signals into a
 * framework ranking. That keeps spec section 25's preference orders auditable and
 * stops framework choice drifting with model temperature.
 */

import { generateStructured } from "../lib/responses";
import { STRATEGIST_PROMPT } from "../prompts";
import { ideaAnalysisSchema, type IdeaAnalysis } from "../schemas/strategy";
import {
  recommendFrameworks,
  type FrameworkRecommendation,
  type IdeaSignals,
} from "../frameworks/selection";
import { isConstraintUsable, isGuaranteeUsable } from "../schemas/offer";
import { renderContextBlock, type GenerationContext } from "./types";
import { renderVoiceProfile } from "../schemas/voice";

export interface StrategyResult {
  analysis: IdeaAnalysis;
  recommendation: FrameworkRecommendation;
  /** Set when the model's framework choice was blocked and replaced. */
  corrections: string[];
}

export async function runStrategist(
  context: GenerationContext,
): Promise<StrategyResult> {
  const input = [
    renderContextBlock(context),
    `# USER VOICE PROFILE\n${renderVoiceProfile(context.voiceProfile)}`,
    "# TASK\nAnalyse this idea and return the strategy classification. Report signals conservatively: a signal that is true unlocks a framework, and a signal reported wrongly causes the system to fabricate.",
  ].join("\n\n");

  const analysis = await generateStructured({
    role: "primary",
    system: STRATEGIST_PROMPT,
    input,
    schema: ideaAnalysisSchema,
    schemaName: "idea_analysis",
  });

  const signals = buildSignals(analysis, context);
  const recommendation = recommendFrameworks(signals);
  const corrections: string[] = [];

  // The model may propose a framework the integrity gates block. Deterministic
  // selection wins: a blocked framework is blocked because using it would mean
  // fabricating something.
  const blocked = recommendation.blocked.find(
    (entry) => entry.id === analysis.recommended_framework,
  );
  if (blocked) {
    corrections.push(
      `Strategist selected "${analysis.recommended_framework}" but it is blocked: ${blocked.reason} Replaced with "${recommendation.frameworkIds[0]}".`,
    );
    analysis.recommended_framework = recommendation.frameworkIds[0]!;
  }

  const usableHookFamilies = analysis.recommended_hook_families.filter((family) =>
    recommendation.hookFamilyIds.includes(family),
  );
  if (usableHookFamilies.length === 0) {
    corrections.push(
      `None of the strategist's hook families survived the integrity gates. Using deterministic ranking: ${recommendation.hookFamilyIds.join(", ")}.`,
    );
    analysis.recommended_hook_families = recommendation.hookFamilyIds.slice(0, 4);
  } else {
    analysis.recommended_hook_families = usableHookFamilies;
  }

  // A user override outranks both the model and the ranking (writing rule 123).
  if (context.overrides?.frameworkId) {
    analysis.recommended_framework = context.overrides.frameworkId;
  }
  if (context.overrides?.hookFamilies?.length) {
    analysis.recommended_hook_families = context.overrides.hookFamilies.slice(0, 4);
  }
  if (context.overrides?.ctaType) {
    analysis.cta_type = context.overrides.ctaType;
  }
  if (context.overrides?.forceResearch) {
    analysis.research_required = true;
  }

  return { analysis, recommendation, corrections };
}

/**
 * Combine model-reported signals with facts the system already knows.
 *
 * Commercial gates are read from the stored offer record rather than from the
 * model, because the model has no way to know whether a guarantee is approved.
 */
export function buildSignals(
  analysis: IdeaAnalysis,
  context: GenerationContext,
): IdeaSignals {
  const offer = context.offer;
  const requirements = context.requirements;

  return {
    ...analysis.signals,

    // The checklist overrides inference. The author saying they have a real
    // story is better evidence than a model reading the idea text and deciding
    // one sounds likely, and this is the exact point where fabrication starts.
    ...(requirements
      ? {
          hasTruePersonalEvent: requirements.hasPersonalStory,
          isProofLed: requirements.includeProof,
          isTacticalOrEducational: requirements.teachSomething,
          isStrongOpinion: requirements.statePosition,
          isDirectlyCommercial: requirements.includeOffer,
        }
      : {}),
    hasApprovedGuarantee: isGuaranteeUsable(offer?.guarantee),
    hasTieredOffer: offer?.delivery_mode === "mixed",
    hasVerifiedScarcityOrUrgency:
      isConstraintUsable(offer?.scarcity) || isConstraintUsable(offer?.urgency),
    recentFrameworkIds: context.recentPosts.map((post) => post.frameworkId),
    recentHookFamilyIds: context.recentPosts.map((post) => post.hookFamily),
  };
}
