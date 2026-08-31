/**
 * Post requirements. The checklist ticked before generating.
 *
 * This is more than a convenience. Several of these ticks are the honest input
 * to the integrity gates in frameworks/selection.ts.
 *
 * Before this existed, the strategist model inferred whether a real personal
 * event was available by reading the idea text, which is exactly where
 * fabrication creeps in: an idea that sounds like a story invites the model to
 * report one. The author ticking "I have a true story to tell" is better
 * evidence than any inference, so where a tick and an inference disagree, the
 * tick wins.
 */

import { z } from "zod";

export const postRequirementsSchema = z.object({
  /** End with one call to action. Off means the post ends on substance. */
  includeCta: z.boolean().default(false),
  /** Draw on the stored offer record. Requires an offer to be saved. */
  includeOffer: z.boolean().default(false),
  /** Append the saved sign-off. Counted into the character budget. */
  includeSignOff: z.boolean().default(false),

  /**
   * The author has a real personal event to tell.
   * Unlocks the story frameworks. Never inferred from the idea alone.
   */
  hasPersonalStory: z.boolean().default(false),
  /** Real evidence is available: a result, build, test, screenshot or example. */
  includeProof: z.boolean().default(false),
  /** End on a genuine question. Not engagement bait. */
  askQuestion: z.boolean().default(false),
  /** Run the fact checker before drafting. */
  verifyFacts: z.boolean().default(false),
  /** Teach something the reader can apply. */
  teachSomething: z.boolean().default(false),
  /** State a position the author genuinely holds. */
  statePosition: z.boolean().default(false),
});

export type PostRequirements = z.infer<typeof postRequirementsSchema>;

export const DEFAULT_REQUIREMENTS: PostRequirements = postRequirementsSchema.parse({});

export interface RequirementOption {
  key: keyof PostRequirements;
  label: string;
  hint: string;
  /** Shown as unavailable when this precondition is missing. */
  requires?: "offer" | "signOff";
}

/**
 * The checklist, in the order it is shown.
 *
 * Shape first, then what to include. The shape ticks change which frameworks
 * are available; the inclusion ticks change what goes in the post.
 */
export const REQUIREMENT_OPTIONS: RequirementOption[] = [
  {
    key: "hasPersonalStory",
    label: "I have a real story to tell",
    hint: "Unlocks the story frameworks. Only tick this if the event actually happened, because the engine will not invent one.",
  },
  {
    key: "includeProof",
    label: "I have proof to include",
    hint: "A result, a build, a test, a screenshot, a client example. Put the detail in the brief.",
  },
  {
    key: "teachSomething",
    label: "Teach something practical",
    hint: "The reader should be able to apply it.",
  },
  {
    key: "statePosition",
    label: "State my position",
    hint: "A view you genuinely hold, argued directly.",
  },
  {
    key: "includeCta",
    label: "End with a call to action",
    hint: "One ask, matched to the post. Leave this off and the post ends on substance.",
  },
  {
    key: "includeOffer",
    label: "Bring in my offer",
    hint: "Uses the offer saved in Settings.",
    requires: "offer",
  },
  {
    key: "askQuestion",
    label: "End on a real question",
    hint: "A genuine question, not engagement bait.",
  },
  {
    key: "verifyFacts",
    label: "Verify the facts first",
    hint: "Runs research before drafting. Slower.",
  },
  {
    key: "includeSignOff",
    label: "Add my sign-off",
    hint: "Appended automatically and counted in the character limit.",
    requires: "signOff",
  },
];

/** Render the ticked requirements as an instruction block. */
export function renderRequirements(
  requirements: PostRequirements,
  context: { signOff?: string | null; hasOffer?: boolean } = {},
): string {
  const on: string[] = [];
  const off: string[] = [];

  if (requirements.hasPersonalStory) {
    on.push("The author has a real personal event for this post. Use it. Every detail must come from the brief; invent nothing.");
  } else {
    off.push("No personal story is available. Do not write one, and do not imply lived experience the brief does not contain.");
  }

  if (requirements.includeProof) {
    on.push("Real evidence is available. Use the proof in the brief and make it specific.");
  }
  if (requirements.teachSomething) {
    on.push("The reader should finish able to apply something.");
  }
  if (requirements.statePosition) {
    on.push("State the author's position directly. Argue it rather than hedging it.");
  }

  if (requirements.includeCta) {
    on.push("End with one call to action, matched to what the post earned.");
  } else {
    off.push("No call to action. End on substance. Do not add an ask, a sign-off line or an invitation to get in touch.");
  }

  if (requirements.includeOffer) {
    on.push(
      context.hasOffer
        ? "Bring in the stored offer, using only what the offer record contains."
        : "The author asked to include the offer, but no offer record is stored. Do not invent one.",
    );
  } else {
    off.push("Do not mention or describe a commercial offer.");
  }

  if (requirements.askQuestion) {
    on.push("End on a genuine question that a reader could actually answer. Not engagement bait.");
  }

  if (requirements.includeSignOff && context.signOff) {
    off.push(
      "A fixed sign-off is appended after you finish. Do not write it, and do not close with any other sign-off, name or company line.",
    );
  }

  const lines: string[] = [];
  if (on.length) lines.push(`Include:\n${on.map((item) => `- ${item}`).join("\n")}`);
  if (off.length) lines.push(`Do not include:\n${off.map((item) => `- ${item}`).join("\n")}`);

  return lines.join("\n\n") || "No specific requirements were set.";
}
