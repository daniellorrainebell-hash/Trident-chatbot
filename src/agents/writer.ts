/**
 * Agent 6: Writer.
 *
 * Writes the first draft from the approved strategy, hook, outline, voice profile,
 * retrieved knowledge and verified research.
 *
 * The writer is not allowed to add invented personal experience. Everything it
 * can legitimately say is in its input.
 */

import { generateText } from "../lib/responses";
import { WRITER_PROMPT } from "../prompts";
import { getFramework, renderFrameworksForPrompt } from "../frameworks/registry";
import { renderVoiceProfile } from "../schemas/voice";
import { renderContextBlock, type GenerationContext } from "./types";
import type { IdeaAnalysis } from "../schemas/strategy";
import type { Outline } from "../schemas/outline";
import type { FactCheckReport } from "../schemas/factcheck";
import { renderRequirements } from "../schemas/requirements";
import { characterBudget, renderBudgetInstruction } from "../lib/compose";

export interface WriterInput {
  context: GenerationContext;
  analysis: IdeaAnalysis;
  outline: Outline;
  /** Present only when research ran. */
  research?: FactCheckReport | null;
}

export async function runWriter({
  context,
  analysis,
  outline,
  research,
}: WriterInput): Promise<string> {
  const framework = getFramework(outline.framework);

  const sections = [
    renderContextBlock(context),
    `# VOICE PROFILE\n${renderVoiceProfile(context.voiceProfile)}`,
    framework ? `# FRAMEWORK\n${renderFrameworksForPrompt([framework])}` : "",
    `# OUTLINE\nHook: ${outline.hook}\nPromise to fulfil: ${outline.hook_promise}\n${outline.sections
      .map(
        (section, index) =>
          `${index + 1}. ${section.role}: ${section.purpose}${
            section.material.length
              ? `\n   Material: ${section.material.join("; ")}`
              : ""
          }`,
      )
      .join("\n")}\nCTA: ${outline.cta}`,
    `# STRATEGY NOTES\nCore claim: ${analysis.core_claim}\nTone notes: ${analysis.tone_notes.join("; ") || "none"}`,
    `# PROOF GAPS (do not fill these by invention)\n${analysis.proof_missing.join("\n") || "none"}`,
    context.requirements
      ? `# REQUIREMENTS FOR THIS POST\n${renderRequirements(context.requirements, {
          signOff: context.signOff,
          hasOffer: Boolean(context.offer),
        })}`
      : "",
    `# LENGTH\n${renderBudgetInstruction(
      characterBudget(context.requirements?.includeSignOff ? context.signOff : null),
    )}`,
    research ? renderVerifiedFacts(research) : "",
    "# TASK\nWrite the post. Open with the hook exactly as given. Close the promise it made. Return the post text only.",
  ].filter(Boolean);

  return generateText({
    role: "primary",
    system: WRITER_PROMPT,
    input: sections.join("\n\n"),
  });
}

/**
 * Render only what research established.
 *
 * Claims marked unverified or contradicted are passed through as prohibitions
 * rather than omitted, because a writer that simply does not see a claim may
 * reconstruct it from the idea.
 */
export function renderVerifiedFacts(report: FactCheckReport): string {
  const usable = report.claims.filter(
    (claim) => claim.verdict === "verified" || claim.verdict === "partially_verified",
  );
  const unusable = report.claims.filter(
    (claim) => claim.verdict === "unverified" || claim.verdict === "contradicted",
  );

  const lines: string[] = ["# VERIFIED RESEARCH"];

  lines.push(
    usable.length
      ? usable
          .map(
            (claim) =>
              `- ${claim.claim}\n  Verdict: ${claim.verdict}. ${claim.evidence}`,
          )
          .join("\n")
      : "(nothing verified)",
  );

  if (unusable.length) {
    lines.push(
      "\n# CLAIMS YOU MAY NOT MAKE\nThese were checked and could not be supported. Do not state them, do not imply them, and do not rebuild them from the raw idea.",
    );
    lines.push(
      unusable
        .map(
          (claim) =>
            `- ${claim.claim} (${claim.verdict})${
              claim.suggested_replacement
                ? `\n  Permitted alternative: ${claim.suggested_replacement}`
                : ""
            }`,
        )
        .join("\n"),
    );
  }

  return lines.join("\n");
}
