/**
 * Post state machine.
 *
 * Spec section 46. States may be skipped where they do not apply: a low-risk
 * opinion post never enters research_pending, and Quick Draft mode moves through
 * hook selection without a user decision.
 */

export const POST_STATES = [
  "idea_captured",
  "analysed",
  "research_pending",
  "researched",
  "hooks_generated",
  "hook_selected",
  "outlined",
  "drafted",
  "critiqued",
  "ready_for_review",
  "user_edited",
  "approved",
  "published",
  "performance_recorded",
] as const;

export type PostState = (typeof POST_STATES)[number];

const ORDER = new Map<PostState, number>(
  POST_STATES.map((state, index) => [state, index]),
);

/**
 * Forward transitions only, with skipping allowed.
 *
 * The two backward transitions that are legitimate: a draft sent back for
 * revision returns to `drafted`, and an approved post being edited again returns
 * to `user_edited`.
 */
export function canTransition(from: PostState, to: PostState): boolean {
  const fromIndex = ORDER.get(from);
  const toIndex = ORDER.get(to);
  if (fromIndex === undefined || toIndex === undefined) return false;

  if (toIndex > fromIndex) return true;
  if (from === "critiqued" && to === "drafted") return true;
  if (from === "approved" && to === "user_edited") return true;

  return false;
}

export function assertTransition(from: PostState, to: PostState): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid post state transition: ${from} -> ${to}.`);
  }
}
