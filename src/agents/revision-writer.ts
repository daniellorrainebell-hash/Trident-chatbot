/**
 * Agent 8: Revision Writer.
 *
 * Receives the original draft, the critic report, the linter findings, the voice
 * profile, the framework and any research evidence. Returns the improved draft.
 *
 * The revision loop re-lints after each pass. It stops when the draft is clean or
 * when the pass budget is spent, and it never returns a draft with unresolved
 * errors without saying so.
 */

import { generateText } from "../lib/responses";
import { REVISION_WRITER_PROMPT } from "../prompts";
import { renderVoiceProfile } from "../schemas/voice";
import { lintPost, renderLintFindings, type LintOptions } from "../writing-rules/linter";
import { renderVerifiedFacts } from "./writer";
import type { GenerationContext } from "./types";
import type { CriticReport } from "../schemas/critic";
import type { FactCheckReport } from "../schemas/factcheck";

export interface RevisionInput {
  context: GenerationContext;
  draft: string;
  report: CriticReport;
  research?: FactCheckReport | null;
  /** Rendered distribution findings, when the distribution check has run. */
  distributionNotes?: string;
  lintOptions?: LintOptions;
}

export async function runRevisionWriter({
  context,
  draft,
  report,
  research,
  distributionNotes,
  lintOptions,
}: RevisionInput): Promise<string> {
  const lint = lintPost(draft, lintOptions);

  const problems = report.problems
    .slice()
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .map(
      (problem) =>
        `[${problem.severity}] ${problem.category}\n  Text: "${problem.excerpt}"\n  Problem: ${problem.problem}\n  Required fix: ${problem.fix}`,
    )
    .join("\n\n");

  const input = [
    `# CURRENT DRAFT\n${draft}`,
    `# CRITIC REPORT\nScore: ${report.score}/10. Verdict: ${report.verdict}.\n\n${problems || "(no problems listed)"}`,
    `# DETERMINISTIC LINTER FINDINGS\n${renderLintFindings(lint)}`,
    `# VOICE PROFILE\n${renderVoiceProfile(context.voiceProfile)}`,
    research ? renderVerifiedFacts(research) : "",
    distributionNotes ? `# LINKEDIN DISTRIBUTION CHECK\n${distributionNotes}` : "",
    "# TASK\nApply the fixes and return the revised post text only. Do not rewrite what was not raised. Do not introduce new claims while revising.",
  ].filter(Boolean);

  return generateText({
    role: "primary",
    system: REVISION_WRITER_PROMPT,
    input: input.join("\n\n"),
  });
}

function severityRank(severity: CriticReport["problems"][number]["severity"]): number {
  if (severity === "blocking") return 0;
  if (severity === "significant") return 1;
  return 2;
}
