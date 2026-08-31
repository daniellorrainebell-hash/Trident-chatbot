/**
 * Strategist boundary schemas.
 *
 * Spec section 26 defines the structured classification returned for every idea.
 * The user does not see most of this by default; it powers generation and is
 * inspectable in the Advanced drawer.
 */

import { z } from "zod";

export const readerStageSchema = z.enum([
  "awareness",
  "connection",
  "trust",
  "intent",
  "action",
]);

export const contentPillarSchema = z.enum([
  "problem",
  "proof",
  "belief",
  "behind_the_scenes",
  "conversion",
  "opinion",
]);

export const objectiveSchema = z.enum([
  "authority",
  "engagement",
  "education",
  "trust",
  "lead_generation",
  "conversion",
]);

export const riskLevelSchema = z.enum(["low", "medium", "high"]);

/**
 * Who this post is for, in distribution terms (source section 39).
 *
 * LinkedIn confirms some posts are relevant to an author's network without
 * being broadly useful outside it. Forcing a personal milestone into
 * broad-discovery framing serves nobody.
 */
export const distributionGoalSchema = z.enum([
  "network",
  "broad",
  "commercial",
  "hybrid",
]);

/**
 * Professional relevance (source section 6).
 *
 * LinkedIn confirms it recommends professionally relevant content. Naming the
 * subject, the audience and why it matters is how a post qualifies. It is not a
 * prompt for inventing a business lesson that is not there.
 */
export const professionalRelevanceSchema = z.object({
  primary_topic: z.string(),
  professional_context: z.string(),
  target_professional_audience: z.string(),
  why_this_matters_to_them: z.string(),
});

/**
 * Signals describing the shape of the idea.
 *
 * These are the inputs to deterministic framework selection. The model reports
 * what is true about the idea and the evidence available; it does not choose the
 * framework here.
 */
export const ideaSignalsSchema = z.object({
  hasTruePersonalEvent: z
    .boolean()
    .describe(
      "True only if the user supplied a real event they experienced. Never infer this.",
    ),
  identifiesExpensiveProblem: z.boolean(),
  isStrongOpinion: z.boolean(),
  isTacticalOrEducational: z.boolean(),
  isProofLed: z
    .boolean()
    .describe("True only if real evidence is available: a result, build, test, screenshot or example."),
  isDirectlyCommercial: z.boolean(),
  hasGenuineEmotionalReaction: z
    .boolean()
    .describe("True only if the user genuinely reported this reaction."),
  hasEvidencedCommonBelief: z
    .boolean()
    .describe("True only if there is evidence the opposing belief is genuinely common."),
  hasRealCostFigure: z
    .boolean()
    .describe("True only if the user supplied a real figure for time, money or effort spent."),
  hasDominantObjection: z.boolean(),
});

export const ideaAnalysisSchema = z.object({
  topic: z.string(),
  core_claim: z
    .string()
    .describe("The single claim every paragraph must support. Writing rule 76."),
  target_audience: z.string(),
  reader_stage: readerStageSchema,
  content_pillars: z.array(contentPillarSchema).min(1),
  primary_objective: objectiveSchema,
  primary_psychology: z.string(),
  secondary_psychology: z.array(z.string()),

  signals: ideaSignalsSchema,

  recommended_framework: z.string(),
  backup_frameworks: z.array(z.string()),
  recommended_hook_families: z.array(z.string()).min(1).max(4),
  /** Why this framework, in one sentence. Spec section 63 success criterion. */
  framework_rationale: z.string(),

  proof_available: z
    .array(z.string())
    .describe("Evidence the user has actually supplied."),
  proof_missing: z
    .array(z.string())
    .describe("Evidence the post would benefit from but does not have. Never fill these gaps by invention."),

  research_required: z.boolean(),
  research_questions: z.array(z.string()),
  risk_level: riskLevelSchema,

  distribution_goal: distributionGoalSchema,
  professional_relevance: professionalRelevanceSchema,
  /** Named honestly. If nothing here is original, say so rather than inventing. */
  original_angle: z
    .string()
    .describe("What makes this post original. LinkedIn reduces recycled content with no new angle."),

  cta_type: z
    .string()
    .describe("One CTA maximum. Use \"none\" where the post has not earned an ask."),
  tone_notes: z.array(z.string()),
});

export type ReaderStage = z.infer<typeof readerStageSchema>;
export type ContentPillar = z.infer<typeof contentPillarSchema>;
export type Objective = z.infer<typeof objectiveSchema>;
export type RiskLevel = z.infer<typeof riskLevelSchema>;
export type IdeaAnalysis = z.infer<typeof ideaAnalysisSchema>;
export type DistributionGoal = z.infer<typeof distributionGoalSchema>;
export type ProfessionalRelevance = z.infer<typeof professionalRelevanceSchema>;
export type IdeaSignalsPayload = z.infer<typeof ideaSignalsSchema>;
