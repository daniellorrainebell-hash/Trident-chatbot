/**
 * Agent 9: Fact Checker.
 *
 * Runs only when necessary. Extracts factual claims, classifies each, researches
 * current claims where tools are available and flags anything unsafe to publish
 * as fact.
 *
 * Research risk classification (spec section 42):
 *   low     personal opinion, general writing advice, personal story
 *   medium  technical explanation, product capability, company comparison
 *   high    law, regulation, medical, finance, security, statistics, current news
 *
 * High-risk claims get a dedicated verification pass on the deep model with web
 * search enabled.
 */

import { generateStructured } from "../lib/responses";
import { FACT_CHECKER_PROMPT } from "../prompts";
import {
  factCheckReportSchema,
  RESEARCH_REQUIRED_CLASSIFICATIONS,
  type FactCheckReport,
} from "../schemas/factcheck";
import type { IdeaAnalysis, RiskLevel } from "../schemas/strategy";

/** Signals that a claim is time-sensitive and cannot be answered from training. */
const CURRENT_CLAIM_MARKERS = [
  "today",
  "this week",
  "this month",
  "just released",
  "just announced",
  "new version",
  "latest",
  "currently",
  "as of",
  "now costs",
  "pricing",
  "price",
  "regulation",
  "law",
  "legal requirement",
  "compliance deadline",
  "statistic",
  "% of",
  "percent of",
  "study found",
  "research shows",
];

/**
 * Decide whether the fact checker needs to run at all.
 *
 * Spec section 41 distinguishes ideas needing no external research (opinion,
 * personal reflection, user-supplied experience, evergreen advice) from those
 * that do. Running research on every post wastes tokens and adds latency for no
 * accuracy gain.
 */
export function requiresResearch(
  analysis: IdeaAnalysis,
  draft?: string,
): boolean {
  if (analysis.research_required) return true;
  if (analysis.risk_level === "high") return true;

  const haystack = `${analysis.core_claim} ${draft ?? ""}`.toLowerCase();
  return CURRENT_CLAIM_MARKERS.some((marker) => haystack.includes(marker));
}

/** Which model and tools a given risk level warrants. */
export function researchPlan(risk: RiskLevel): {
  role: "primary" | "deep" | "fast";
  useWebSearch: boolean;
} {
  if (risk === "high") return { role: "deep", useWebSearch: true };
  if (risk === "medium") return { role: "deep", useWebSearch: true };
  return { role: "primary", useWebSearch: false };
}

export interface FactCheckInput {
  draft: string;
  analysis: IdeaAnalysis;
  /** Material the user supplied. Claims traceable to it are user-provided experience. */
  userSuppliedMaterial: string[];
}

export async function runFactChecker({
  draft,
  analysis,
  userSuppliedMaterial,
}: FactCheckInput): Promise<FactCheckReport> {
  const plan = researchPlan(analysis.risk_level);

  const input = [
    `# DRAFT\n${draft}`,
    `# RISK LEVEL\n${analysis.risk_level}`,
    `# MATERIAL THE USER SUPPLIED\nClaims traceable to this material are user-provided experience and do not need external verification.\n${
      userSuppliedMaterial.map((item) => `- ${item}`).join("\n") || "(none)"
    }`,
    analysis.research_questions.length
      ? `# QUESTIONS THE STRATEGIST FLAGGED\n${analysis.research_questions.map((question) => `- ${question}`).join("\n")}`
      : "",
    `# TASK\nExtract every externally verifiable claim, classify it, and research where required. Classifications that always require research: ${RESEARCH_REQUIRED_CLASSIFICATIONS.join(", ")}. Recommend an action for every claim that is not verified.`,
  ].filter(Boolean);

  return generateStructured({
    role: plan.role,
    system: FACT_CHECKER_PROMPT,
    input: input.join("\n\n"),
    schema: factCheckReportSchema,
    schemaName: "fact_check_report",
    ...(plan.useWebSearch ? { tools: ["web_search" as const] } : {}),
  });
}
