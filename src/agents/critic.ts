/**
 * Agent 7: Critic.
 *
 * Evaluates the draft and returns scores, problems and exact fixes.
 *
 * It receives the deterministic linter's findings alongside the draft. Errors are
 * not the critic's to dismiss; warnings are heuristic, and judging them is part
 * of the critic's job (rule 120 is explicit that a factual list of three items
 * must not be treated as a violation).
 */

import { generateStructured } from "../lib/responses";
import { CRITIC_PROMPT } from "../prompts";
import { criticReportSchema, type CriticReport } from "../schemas/critic";
import { getFramework } from "../frameworks/registry";
import { C2C_QUALITY_CHECKLIST } from "../frameworks/c2c";
import { renderVoiceProfile } from "../schemas/voice";
import { lintPost, renderLintFindings, type LintOptions } from "../writing-rules/linter";
import type { GenerationContext } from "./types";
import type { IdeaAnalysis } from "../schemas/strategy";

export interface CriticInput {
  context: GenerationContext;
  analysis: IdeaAnalysis;
  draft: string;
  lintOptions?: LintOptions;
}

export interface CriticResult {
  report: CriticReport;
  lint: ReturnType<typeof lintPost>;
}

export async function runCritic({
  context,
  analysis,
  draft,
  lintOptions,
}: CriticInput): Promise<CriticResult> {
  const lint = lintPost(draft, lintOptions);
  const framework = getFramework(analysis.recommended_framework);

  const input = [
    `# DRAFT\n${draft}`,
    `# STRATEGY\nCore claim: ${analysis.core_claim}\nAudience: ${analysis.target_audience}\nReader stage: ${analysis.reader_stage}\nCTA type: ${analysis.cta_type}`,
    framework
      ? `# FRAMEWORK IN USE\n${framework.name} (${framework.id}). Known failure modes:\n${framework.misuseRisks.map((risk) => `- ${risk}`).join("\n")}`
      : "",
    `# VOICE PROFILE\n${renderVoiceProfile(context.voiceProfile)}`,
    `# PROOF AVAILABLE\n${analysis.proof_available.join("; ") || "none"}`,
    `# PROOF THE POST DOES NOT HAVE\n${analysis.proof_missing.join("; ") || "none"}\nAny passage that appears to supply this material is invented. Flag it.`,
    `# DETERMINISTIC LINTER FINDINGS\n${renderLintFindings(lint)}`,
    `# QUALITY CHECKLIST\n${C2C_QUALITY_CHECKLIST.map((item) => `- ${item}`).join("\n")}`,
    "# TASK\nReturn scores, problems and exact fixes. Quote the offending text for every problem.",
  ].filter(Boolean);

  const report = await generateStructured({
    role: "primary",
    system: CRITIC_PROMPT,
    input: input.join("\n\n"),
    schema: criticReportSchema,
    schemaName: "critic_report",
  });

  // A linter error is a blocking problem whatever the critic concluded.
  if (lint.errors.length > 0 && report.verdict === "ready") {
    report.verdict = "revise";
  }

  return { report, lint };
}
