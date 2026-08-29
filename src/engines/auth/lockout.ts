/**
 * What happens when the PIN keeps being wrong.
 *
 * A six-digit PIN is a million guesses, which is nothing to a machine and a
 * lot to a person. Nothing here tries to make the PIN itself stronger — the
 * defence is that the attempts run out long before the space does.
 *
 * Pure, so the rule can be read and tested without a device. The consequence
 * of a lockout is defined in `quickUnlock`: the stored token is destroyed and
 * the full password is required. It is not a timer someone can wait out.
 */

/**
 * Five, matching the number of guesses a phone gives you at its own lock
 * screen. Enough that a cold morning and gloves do not lock you out; far too
 * few to walk a keyspace.
 */
export const MAX_PIN_ATTEMPTS = 5;

/** Below this the UI starts saying how many are left. Sooner is just alarming. */
export const WARN_FROM_ATTEMPTS_REMAINING = 3;

export type LockoutState = {
  failedAttempts: number;
};

export const FRESH_LOCKOUT: LockoutState = { failedAttempts: 0 };

export function remainingAttempts(state: LockoutState): number {
  return Math.max(0, MAX_PIN_ATTEMPTS - state.failedAttempts);
}

export function isLockedOut(state: LockoutState): boolean {
  return remainingAttempts(state) === 0;
}

export function recordFailure(state: LockoutState): LockoutState {
  return { failedAttempts: state.failedAttempts + 1 };
}

/** A correct PIN clears the count. Attempts do not accumulate across sessions. */
export function recordSuccess(): LockoutState {
  return FRESH_LOCKOUT;
}

export function shouldWarn(state: LockoutState): boolean {
  const left = remainingAttempts(state);
  return left > 0 && left <= WARN_FROM_ATTEMPTS_REMAINING;
}

/**
 * What to tell someone who just got it wrong.
 *
 * Counting down is the honest thing: silence until a sudden lockout feels like
 * the app broke, and people retry the same wrong PIN because nothing said not
 * to.
 */
export function describeAttempt(state: LockoutState): string {
  const left = remainingAttempts(state);
  if (left === 0) return 'Too many attempts. Sign in with your password to continue.';
  if (left === 1) return 'That PIN was wrong. One attempt left.';
  if (shouldWarn(state)) return `That PIN was wrong. ${left} attempts left.`;
  return 'That PIN was wrong.';
}
