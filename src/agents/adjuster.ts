/**
 * Draft adjuster.
 *
 * Powers the one-click actions on the draft screen: shorter, more direct, more
 * technical, stronger opening, add or remove the CTA.
 *
 * Spec section 47: every change becomes feedback data. The instruction the user
 * picked is itself a signal about how they want to be written for, so each
 * adjustment is recorded as a feedback event rather than being treated as a
 * throwaway rewrite.
 */

import { generateText } from "../lib/responses";
import { WRITING_RULES_PROMPT_BLOCK } from "../writing-rules/prompt-block";
import { renderVoiceProfile } from "../schemas/voice";
import { lintPost, renderLintFindings, type LintOptions } from "../writing-rules/linter";
import type { VoiceProfile } from "../schemas/voice";

export const ADJUSTMENTS = {
  shorter: {
    label: "Shorter",
    instruction:
      "Cut this to its strongest form. Remove any paragraph that only restates another. Do not remove evidence or specificity to hit a length.",
    tag: "prefers_shorter",
  },
  longer: {
    label: "More depth",
    instruction:
      "Add depth only where the argument is genuinely thin: an explained mechanism, a consequence, or a concrete detail already available in the material. Do not pad and do not invent new evidence.",
    tag: "prefers_more_depth",
  },
  more_direct: {
    label: "More direct",
    instruction:
      "Make this more direct. Remove hedging, soft qualifiers and defensive caveats that do not change whether a claim is true. Keep every claim as accurate as it is now.",
    tag: "prefers_direct",
  },
  more_conversational: {
    label: "More conversational",
    instruction:
      "Make this read more like the user talking. Loosen formal constructions and report transitions. Do not add filler openers or manufactured conversational tics.",
    tag: "prefers_conversational",
  },
  more_technical: {
    label: "More technical",
    instruction:
      "Increase technical precision for a technical reader. Use exact terms where they clarify. Do not add model names, acronyms or benchmarks purely to sound knowledgeable.",
    tag: "prefers_technical",
  },
  stronger_opening: {
    label: "Stronger opening",
    instruction:
      "Rewrite the opening so it stops the intended reader faster. The body must still fulfil whatever promise the new opening makes, and you may not add a claim the material does not support.",
    tag: "prefers_stronger_opening",
  },
  add_cta: {
    label: "Add a CTA",
    instruction:
      "Add one clear next step at the end, matched to what the post actually earned. One CTA only. Do not use engagement bait.",
    tag: "wants_cta",
  },
  remove_cta: {
    label: "Remove the CTA",
    instruction:
      "Remove the call to action. End on substance rather than on a summary line or an empty sign-off.",
    tag: "prefers_no_cta",
  },
} as const;

export type AdjustmentId = keyof typeof ADJUSTMENTS;

export const ADJUSTMENT_LIST = Object.entries(ADJUSTMENTS).map(([id, value]) => ({
  id: id as AdjustmentId,
  label: value.label,
}));

const ADJUSTER_PROMPT = `
You are adjusting an existing LinkedIn draft on a specific instruction.

Change what the instruction asks for and leave the rest alone. This is an edit,
not a rewrite: the argument, the evidence and the user's voice all stay.

Hard limits:
- Do not introduce a claim, number, experience or reaction that is not already in the draft.
- Do not soften a true statement to make it feel safer.
- Do not restore anything the linter flags below.

Return the adjusted post text only. No preamble and no notes.

${WRITING_RULES_PROMPT_BLOCK}
`.trim();

export interface AdjustInput {
  draft: string;
  adjustment: AdjustmentId;
  voiceProfile: VoiceProfile;
  /** Free-text instruction, used when the user types their own. */
  customInstruction?: string;
  lintOptions?: LintOptions;
}

export interface AdjustResult {
  text: string;
  /** Recorded as feedback so the preference is retrieved on future posts. */
  tag: string;
  instruction: string;
}

export async function runAdjuster({
  draft,
  adjustment,
  voiceProfile,
  customInstruction,
  lintOptions,
}: AdjustInput): Promise<AdjustResult> {
  const preset = ADJUSTMENTS[adjustment];
  const instruction = customInstruction?.trim() || preset.instruction;
  const lint = lintPost(draft, lintOptions);

  const text = await generateText({
    role: "primary",
    system: ADJUSTER_PROMPT,
    input: [
      `# CURRENT DRAFT\n${draft}`,
      `# INSTRUCTION\n${instruction}`,
      `# VOICE PROFILE\n${renderVoiceProfile(voiceProfile)}`,
      `# EXISTING LINTER FINDINGS (do not reintroduce these)\n${renderLintFindings(lint)}`,
    ].join("\n\n"),
  });

  return {
    text,
    tag: customInstruction?.trim() ? "custom_adjustment" : preset.tag,
    instruction,
  };
}
