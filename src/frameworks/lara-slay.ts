/**
 * Lara Acosta SLAY framework.
 *
 * Internal ID: lara_slay
 * Story, Lesson, Actionable Advice, You.
 *
 * ATTRIBUTION GUARD
 * This is the framework shown in the user-supplied Lara Acosta image. It is NOT
 * the Setup / Lead-In / Anticipation / Yield structure that appears in the
 * uploaded psychology document. That one is a separate framework stored as
 * `psych_slay_variant` and must never be attributed to Lara Acosta.
 *
 * See src/frameworks/psych-slay-variant.ts and the attribution test in
 * tests/frameworks.test.ts.
 */

import type { FrameworkDefinition } from "./types";

export interface SlayStage {
  letter: string;
  name: string;
  purpose: string;
  /** How this application interprets the stage when building an outline. */
  interpretation: string[];
}

export const LARA_SLAY_STAGES: SlayStage[] = [
  {
    letter: "S",
    name: "Story",
    purpose: "Start with one line of story.",
    interpretation: [
      "Begin with a specific event, observation or experience.",
      "Avoid long scene-setting. Start close to the useful part.",
      "Introduce movement immediately.",
      "The story must be true when framed as personal experience.",
    ],
  },
  {
    letter: "L",
    name: "Lesson",
    purpose: "Bring in a quick key lesson.",
    interpretation: [
      "State the core insight clearly.",
      "Explain why the lesson matters.",
      "Move from what happened to what it means.",
    ],
  },
  {
    letter: "A",
    name: "Actionable Advice",
    purpose: "Turn the lesson into useful action.",
    interpretation: [
      "Show the reader how to apply the lesson.",
      "Give steps, implementation detail or a checklist where the subject supports it.",
      "Make the advice immediately usable.",
    ],
  },
  {
    letter: "Y",
    name: "You",
    purpose: "Bring the post back to the reader.",
    interpretation: [
      "Connect the lesson to the reader's situation.",
      "Speak directly to them.",
      "Give one next action.",
      "Avoid generic inspirational endings.",
    ],
  },
];

export const LARA_SLAY: FrameworkDefinition = {
  id: "lara_slay",
  name: "SLAY (Story, Lesson, Actionable Advice, You)",
  category: "narrative",
  source: "Lara Acosta",
  sourceSummary:
    "Story, Lesson, Actionable Advice, You. The opening hooks through a story, a quick lesson follows, expertise is demonstrated by turning the lesson into action, and the post returns to the reader.",
  appAdaptation:
    "Selected when the user has supplied a genuine personal event. The four stages shape the outline and never appear as labels in the post. If no true story exists, the strategist chooses a non-personal structure rather than fabricating an anecdote to fit this framework.",
  structure: LARA_SLAY_STAGES.map((stage) => `${stage.letter} - ${stage.name}`),
  bestFor: [
    "Personal experience",
    "Lessons from builds",
    "Mistakes",
    "Client observations",
    "Books and learning",
    "Behind the scenes",
    "Transformation stories",
    "Educational posts with a personal opening",
  ],
  allowedUse: ["proof", "behind_the_scenes", "belief", "education"],
  misuseRisks: [
    "Forcing every idea through SLAY. Spec section 64 lists \"every post uses SLAY\" as a failure condition.",
    "Fabricating the story to unlock the framework.",
    "Letting the four stages become visible as scaffolding.",
    "Attributing the Setup / Lead-In / Anticipation / Yield variant to Lara Acosta.",
  ],
  rules: [
    "Requires a user-supplied true personal event.",
    "Never label the stages in the post.",
    "The You stage gives one next action, not an inspirational sign-off.",
  ],
  active: true,
};
