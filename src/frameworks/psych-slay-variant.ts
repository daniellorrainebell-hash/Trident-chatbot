/**
 * Psychologically enhanced SLAY variant.
 *
 * Internal ID: psych_slay_variant
 * Setup, Lead-In, Anticipation, Yield.
 *
 * ATTRIBUTION GUARD
 * This framework appears in the uploaded LinkedIn psychology document. It shares
 * an acronym with the Lara Acosta framework and nothing else. It must not be
 * attributed to Lara Acosta unless further source evidence establishes that
 * attribution.
 *
 * See src/frameworks/lara-slay.ts.
 */

import type { FrameworkDefinition } from "./types";

export interface PsychSlayStage {
  letter: string;
  name: string;
  /** The psychological objective this stage serves. */
  objective: string;
  action: string[];
}

export const PSYCH_SLAY_STAGES: PsychSlayStage[] = [
  {
    letter: "S",
    name: "Setup",
    objective: "Pattern interruption and information gap",
    action: [
      "Choose an appropriate hook pattern.",
      "Create relevance in the first lines.",
      "Establish a reason to continue.",
    ],
  },
  {
    letter: "L",
    name: "Lead-In",
    objective: "Authority and loss aversion",
    action: [
      "Establish the stakes.",
      "Explain why the topic matters.",
      "Show the cost of leaving the problem unresolved.",
      "Use credibility only where genuinely available.",
    ],
  },
  {
    letter: "A",
    name: "Anticipation",
    objective: "Cognitive fluency and status signalling",
    action: [
      "Deliver the core value.",
      "Use short structured points where they genuinely help.",
      "Make the content practical enough to be worth keeping.",
      "Avoid padding.",
    ],
  },
  {
    letter: "Y",
    name: "Yield",
    objective: "Reciprocity and choice reduction",
    action: [
      "Give the reader the best useful takeaway.",
      "End with one clear next step.",
      "Avoid CTA overload.",
    ],
  },
];

export const PSYCH_SLAY_VARIANT: FrameworkDefinition = {
  id: "psych_slay_variant",
  name: "Setup, Lead-In, Anticipation, Yield",
  category: "narrative",
  source: "Uploaded LinkedIn Psychological Trigger Framework document",
  sourceSummary:
    "A four-stage structure in which each stage carries an explicit psychological objective: pattern interruption and information gap, then authority and loss aversion, then cognitive fluency and status signalling, then reciprocity and choice reduction.",
  appAdaptation:
    "Selected for tactical and educational posts where the value is the payload and no personal story is available. Each stage's psychological objective is passed to the writer as intent, never as vocabulary. Provenance is uncertain beyond the uploaded document, so the engine attributes it to that document alone.",
  structure: PSYCH_SLAY_STAGES.map((stage) => `${stage.letter} - ${stage.name}`),
  bestFor: [
    "Tactical posts",
    "Educational posts",
    "Practical breakdowns",
    "Posts with no personal story available",
  ],
  allowedUse: ["education", "problem", "conversion"],
  misuseRisks: [
    "Attributing this structure to Lara Acosta.",
    "Naming the psychological objectives in the copy (writing rule 85).",
    "Letting the four stages read as visible scaffolding.",
  ],
  rules: [
    "Never attribute this framework to Lara Acosta.",
    "Never name the underlying triggers in the post.",
  ],
  active: true,
};
