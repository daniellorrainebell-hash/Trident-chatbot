/**
 * Offer Strategist.
 *
 * Runs only for commercial ideas. Diagnoses the idea through market pain, the
 * value equation, objection preemption, proof and risk, then hands the diagnosis
 * to the content pipeline.
 *
 * It does not write the post, and it does not turn every post into a pitch.
 */

import { generateStructured } from "../lib/responses";
import { OFFER_STRATEGIST_PROMPT } from "../prompts";
import {
  commercialAnalysisSchema,
  isConstraintUsable,
  isGuaranteeUsable,
  type CommercialAnalysis,
} from "../schemas/offer";
import { renderFrameworksForPrompt } from "../frameworks/registry";
import {
  HORMOZI_VALUE_EQUATION,
  HORMOZI_OBJECTION_PREEMPTION,
  HORMOZI_STARVING_CROWD,
  HORMOZI_ANTI_HYPE_GUARDRAIL,
} from "../frameworks/hormozi";
import type { GenerationContext } from "./types";
import type { IdeaAnalysis } from "../schemas/strategy";

export async function runOfferStrategist(
  context: GenerationContext,
  analysis: IdeaAnalysis,
): Promise<CommercialAnalysis> {
  const offer = context.offer ?? null;

  const input = [
    `# RAW IDEA\n${context.idea}`,
    `# AUDIENCE\n${analysis.target_audience}`,
    `# STORED OFFER RECORD\n${offer ? JSON.stringify(offer, null, 2) : "(no offer record stored)"}`,
    `# COMMERCIAL GATES (computed, not for you to decide)\nApproved guarantee available: ${isGuaranteeUsable(offer?.guarantee)}\nVerified scarcity available: ${isConstraintUsable(offer?.scarcity)}\nVerified urgency available: ${isConstraintUsable(offer?.urgency)}\nWhere a gate is false, return null for that field.`,
    `# DIAGNOSTIC FRAMEWORKS\n${renderFrameworksForPrompt([
      HORMOZI_STARVING_CROWD,
      HORMOZI_VALUE_EQUATION,
      HORMOZI_OBJECTION_PREEMPTION,
    ])}`,
    `# GUARDRAIL\n${HORMOZI_ANTI_HYPE_GUARDRAIL}`,
    "# TASK\nDiagnose this commercial idea. Return structured analysis only.",
  ].join("\n\n");

  const result = await generateStructured({
    role: "primary",
    system: OFFER_STRATEGIST_PROMPT,
    input,
    schema: commercialAnalysisSchema,
    schemaName: "commercial_analysis",
  });

  // Enforce the gates in code. A model asked not to invent a guarantee will
  // usually comply; a gate applied afterwards means compliance is not required.
  if (!isGuaranteeUsable(offer?.guarantee)) result.approved_guarantee = null;
  if (!isConstraintUsable(offer?.scarcity)) result.real_scarcity = null;
  if (!isConstraintUsable(offer?.urgency)) result.real_urgency = null;

  return result;
}
