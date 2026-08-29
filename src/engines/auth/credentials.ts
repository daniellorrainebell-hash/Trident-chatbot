/**
 * Credential rules (spec §8).
 *
 * Pure and deterministic, like every other engine here: no platform, no
 * network, no storage. The sign-up screen, the change-password screen and the
 * server-side check should all be able to agree by calling the same function.
 */

export type CredentialProblem =
  | 'EMAIL_REQUIRED'
  | 'EMAIL_MALFORMED'
  | 'PASSWORD_REQUIRED'
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_TOO_LONG'
  | 'PASSWORD_TOO_COMMON'
  | 'PASSWORD_IS_EMAIL'
  | 'PIN_WRONG_LENGTH'
  | 'PIN_NOT_DIGITS'
  | 'PIN_TOO_OBVIOUS';

/**
 * Twelve, not eight.
 *
 * Length beats composition rules: "P@ssw0rd!" satisfies every symbol-and-digit
 * requirement ever written and is on the first page of every wordlist. Nothing
 * here demands a capital or a symbol, because those rules push people towards
 * exactly that password.
 */
export const MIN_PASSWORD_LENGTH = 12;

/** Long enough not to constrain a passphrase, short enough to bound hashing cost. */
export const MAX_PASSWORD_LENGTH = 128;

export const PIN_LENGTH = 6;

/**
 * A short deny-list of the passwords that a length rule alone still lets
 * through. Not a substitute for a breach corpus — that belongs server-side —
 * but it catches the ones a gym audience actually picks.
 */
const COMMON_PASSWORDS = new Set([
  'password1234',
  'passwordpassword',
  '123456789012',
  '111111111111',
  'qwertyqwerty',
  'letmeinletmein',
  'iloveyouiloveyou',
  'administrator',
  'rabidgymwear',
  'thekennel123',
]);

/**
 * A pragmatic email shape check, not RFC 5322.
 *
 * The only real proof an address exists is sending to it, so this rejects the
 * obviously broken and gets out of the way. Being stricter here mostly means
 * refusing valid addresses belonging to people trying to give you money.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function checkEmail(email: string): CredentialProblem | null {
  const value = normaliseEmail(email);
  if (!value) return 'EMAIL_REQUIRED';
  if (!EMAIL_PATTERN.test(value)) return 'EMAIL_MALFORMED';
  return null;
}

export function checkPassword(password: string, email?: string): CredentialProblem | null {
  if (!password) return 'PASSWORD_REQUIRED';
  if (password.length < MIN_PASSWORD_LENGTH) return 'PASSWORD_TOO_SHORT';
  if (password.length > MAX_PASSWORD_LENGTH) return 'PASSWORD_TOO_LONG';
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return 'PASSWORD_TOO_COMMON';

  // Your own email address is not a secret from anyone who has your email
  // address, which by then is whoever is looking at the login screen.
  if (email && normaliseEmail(email) && password.toLowerCase() === normaliseEmail(email)) {
    return 'PASSWORD_IS_EMAIL';
  }
  return null;
}

/**
 * Reject the PINs that make a six-digit space much smaller than a million.
 *
 * A run, a repeat or a date covers a large share of what people actually
 * choose, and those are the first things anyone guesses.
 */
export function checkPin(pin: string): CredentialProblem | null {
  if (pin.length !== PIN_LENGTH) return 'PIN_WRONG_LENGTH';
  if (!/^\d+$/.test(pin)) return 'PIN_NOT_DIGITS';

  if (new Set(pin).size === 1) return 'PIN_TOO_OBVIOUS';
  if (isSequential(pin)) return 'PIN_TOO_OBVIOUS';
  if (looksLikeADate(pin)) return 'PIN_TOO_OBVIOUS';

  return null;
}

function isSequential(pin: string): boolean {
  let ascending = true;
  let descending = true;
  for (let i = 1; i < pin.length; i += 1) {
    const step = Number(pin[i]) - Number(pin[i - 1]);
    if (step !== 1) ascending = false;
    if (step !== -1) descending = false;
  }
  return ascending || descending;
}

/** DDMMYY and MMDDYY both read as a birthday, and birthdays are public. */
function looksLikeADate(pin: string): boolean {
  const a = Number(pin.slice(0, 2));
  const b = Number(pin.slice(2, 4));
  const ddmmyy = a >= 1 && a <= 31 && b >= 1 && b <= 12;
  const mmddyy = a >= 1 && a <= 12 && b >= 1 && b <= 31;
  return ddmmyy || mmddyy;
}

/** User-facing copy. One sentence, says what to do, never blames. */
export const CREDENTIAL_MESSAGES: Record<CredentialProblem, string> = {
  EMAIL_REQUIRED: 'Enter your email address.',
  EMAIL_MALFORMED: 'That does not look like an email address.',
  PASSWORD_REQUIRED: 'Enter a password.',
  PASSWORD_TOO_SHORT: `Use at least ${MIN_PASSWORD_LENGTH} characters. Three random words beats one clever one.`,
  PASSWORD_TOO_LONG: `Keep it under ${MAX_PASSWORD_LENGTH} characters.`,
  PASSWORD_TOO_COMMON: 'That password is one of the first anyone guesses. Pick another.',
  PASSWORD_IS_EMAIL: 'Your password cannot be your email address.',
  PIN_WRONG_LENGTH: `Your PIN is ${PIN_LENGTH} digits.`,
  PIN_NOT_DIGITS: 'Digits only.',
  PIN_TOO_OBVIOUS: 'Avoid runs, repeats and dates — they are guessed first.',
};

export function describeProblem(problem: CredentialProblem): string {
  return CREDENTIAL_MESSAGES[problem];
}
