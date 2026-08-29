import {
  FRESH_LOCKOUT,
  MAX_PIN_ATTEMPTS,
  describeAttempt,
  isLockedOut,
  recordFailure,
  recordSuccess,
  remainingAttempts,
  shouldWarn,
} from './lockout';

function afterFailures(count: number) {
  let state = FRESH_LOCKOUT;
  for (let i = 0; i < count; i += 1) state = recordFailure(state);
  return state;
}

describe('lockout', () => {
  it('starts with every attempt available', () => {
    expect(remainingAttempts(FRESH_LOCKOUT)).toBe(MAX_PIN_ATTEMPTS);
    expect(isLockedOut(FRESH_LOCKOUT)).toBe(false);
  });

  it('counts down one attempt at a time', () => {
    expect(remainingAttempts(afterFailures(1))).toBe(MAX_PIN_ATTEMPTS - 1);
    expect(remainingAttempts(afterFailures(3))).toBe(MAX_PIN_ATTEMPTS - 3);
  });

  it('locks out on the last attempt, not after it', () => {
    expect(isLockedOut(afterFailures(MAX_PIN_ATTEMPTS - 1))).toBe(false);
    expect(isLockedOut(afterFailures(MAX_PIN_ATTEMPTS))).toBe(true);
  });

  it('never reports a negative number of attempts', () => {
    // Extra failures after a lockout must not wrap the counter back around.
    expect(remainingAttempts(afterFailures(MAX_PIN_ATTEMPTS + 20))).toBe(0);
    expect(isLockedOut(afterFailures(MAX_PIN_ATTEMPTS + 20))).toBe(true);
  });

  it('clears the count on a correct PIN', () => {
    expect(recordSuccess()).toEqual(FRESH_LOCKOUT);
    expect(remainingAttempts(recordSuccess())).toBe(MAX_PIN_ATTEMPTS);
  });

  it('is immutable, so a caller cannot lose a failure by reusing state', () => {
    const state = afterFailures(2);
    const next = recordFailure(state);
    expect(state.failedAttempts).toBe(2);
    expect(next.failedAttempts).toBe(3);
  });
});

describe('what the screen says', () => {
  it('stays quiet on the first wrong PIN', () => {
    expect(shouldWarn(afterFailures(1))).toBe(false);
    expect(describeAttempt(afterFailures(1))).toBe('That PIN was wrong.');
  });

  it('starts counting down as it gets close', () => {
    expect(describeAttempt(afterFailures(2))).toMatch(/3 attempts left/);
    expect(describeAttempt(afterFailures(3))).toMatch(/2 attempts left/);
  });

  it('says "one attempt", not "1 attempts"', () => {
    expect(describeAttempt(afterFailures(MAX_PIN_ATTEMPTS - 1))).toBe(
      'That PIN was wrong. One attempt left.',
    );
  });

  it('tells you the way back in once locked out', () => {
    // A dead end here means an uninstall, so the message names the escape.
    expect(describeAttempt(afterFailures(MAX_PIN_ATTEMPTS))).toMatch(/password/);
  });

  it('never warns once there is nothing left to warn about', () => {
    expect(shouldWarn(afterFailures(MAX_PIN_ATTEMPTS))).toBe(false);
  });
});
