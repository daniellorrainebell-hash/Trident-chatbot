/**
 * Post composition and the character budget.
 *
 * The sign-off is appended by code, never written by the model. Two reasons:
 * a model asked to reproduce a fixed block of branding will eventually
 * paraphrase it, and the character budget has to be exact rather than
 * estimated.
 *
 * So the flow is: work out how many characters the body may use, tell the
 * writer that number, then assemble and verify deterministically afterwards.
 */

/** LinkedIn truncates a post past this length. */
export const LINKEDIN_LIMIT = 3000;

/** Blank line between the body and the sign-off. */
export const SIGN_OFF_SEPARATOR = "\n\n";

/**
 * Headroom left below the limit.
 *
 * A model asked for "at most 2,847 characters" will not hit it exactly, so the
 * budget it is given is slightly under the real ceiling. That turns a near miss
 * into a pass rather than into a shortening pass.
 */
export const BUDGET_HEADROOM = 60;

export interface CharacterBudget {
  /** The platform ceiling. */
  limit: number;
  /** Characters the sign-off will consume, including its separator. */
  signOffCost: number;
  /** Hard maximum for the body. */
  bodyLimit: number;
  /** What the writer is told to aim under. */
  bodyTarget: number;
}

/**
 * Work out how much room the body actually has.
 *
 * Called before drafting, so the writer knows its ceiling rather than being
 * told to cut afterwards.
 */
export function characterBudget(signOff?: string | null): CharacterBudget {
  const trimmed = signOff?.trim() ?? "";
  const signOffCost = trimmed ? trimmed.length + SIGN_OFF_SEPARATOR.length : 0;
  const bodyLimit = LINKEDIN_LIMIT - signOffCost;

  return {
    limit: LINKEDIN_LIMIT,
    signOffCost,
    bodyLimit,
    bodyTarget: Math.max(0, bodyLimit - BUDGET_HEADROOM),
  };
}

/** Normalise trailing whitespace without touching internal spacing. */
function trimEnd(text: string): string {
  return text.replace(/\s+$/, "");
}

/**
 * Is the sign-off already at the end of this body?
 *
 * The user edits drafts by hand, and a re-assembly after an edit must not stack
 * a second copy of the sign-off. Compared on collapsed whitespace so that a
 * reflowed line break does not read as a different sign-off.
 */
export function hasSignOff(body: string, signOff: string): boolean {
  const collapse = (text: string): string => text.replace(/\s+/g, " ").trim().toLowerCase();
  const target = collapse(signOff);
  if (!target) return false;
  return collapse(body).endsWith(target);
}

export interface ComposedPost {
  /** The finished post, sign-off included where one applies. */
  text: string;
  /** The body alone. */
  body: string;
  /** The sign-off that was appended, if any. */
  signOff: string | null;
  length: number;
  withinLimit: boolean;
  /** Characters over the limit. Zero when within it. */
  overBy: number;
}

/**
 * Assemble the final post.
 *
 * Idempotent: assembling an already-assembled post returns it unchanged.
 */
export function composePost(body: string, signOff?: string | null): ComposedPost {
  const cleanBody = trimEnd(body);
  const cleanSignOff = signOff?.trim() ?? "";

  if (!cleanSignOff) {
    const length = cleanBody.length;
    return {
      text: cleanBody,
      body: cleanBody,
      signOff: null,
      length,
      withinLimit: length <= LINKEDIN_LIMIT,
      overBy: Math.max(0, length - LINKEDIN_LIMIT),
    };
  }

  const alreadyPresent = hasSignOff(cleanBody, cleanSignOff);
  const text = alreadyPresent
    ? cleanBody
    : `${cleanBody}${SIGN_OFF_SEPARATOR}${cleanSignOff}`;

  // When the sign-off was already in the body, the body alone is what precedes it.
  const bodyOnly = alreadyPresent
    ? trimEnd(cleanBody.slice(0, cleanBody.toLowerCase().lastIndexOf(cleanSignOff.slice(0, 24).toLowerCase())))
    : cleanBody;

  return {
    text,
    body: bodyOnly || cleanBody,
    signOff: cleanSignOff,
    length: text.length,
    withinLimit: text.length <= LINKEDIN_LIMIT,
    overBy: Math.max(0, text.length - LINKEDIN_LIMIT),
  };
}

/** Render the budget as an instruction for the writer. */
export function renderBudgetInstruction(budget: CharacterBudget): string {
  if (budget.signOffCost === 0) {
    return `Hard limit: ${budget.limit.toLocaleString("en-GB")} characters, which LinkedIn truncates past. Aim comfortably under it. Length follows the material; do not pad to fill the space.`;
  }

  return [
    `A fixed sign-off of ${budget.signOffCost} characters will be appended after you finish.`,
    `Do not write it yourself and do not sign off in any other way.`,
    `Your body must therefore stay under ${budget.bodyTarget.toLocaleString("en-GB")} characters so the finished post clears LinkedIn's ${budget.limit.toLocaleString("en-GB")} character limit.`,
    `Length follows the material. Do not pad to fill the space.`,
  ].join(" ");
}
