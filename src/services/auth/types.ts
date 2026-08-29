/**
 * Authentication abstraction (spec §8).
 *
 * Screens talk to `AuthProvider`, never to Supabase. That is the same shape as
 * `BackendClient` and `FoodProductProvider` elsewhere in this app, and for the
 * same reason: the provider is a transport decision, and a transport decision
 * should not reach the UI.
 *
 * Every call returns a typed result rather than throwing. "Wrong password",
 * "no signal" and "too many attempts" need three different screens, and an
 * exception collapses them into one.
 */

export type AuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  /** ISO timestamp. The access token is refreshed before this passes. */
  expiresAt: string;
};

export type AuthFailureCode =
  /**
   * Returned for a wrong password AND for an address with no account.
   *
   * Never distinguish the two. Doing so turns the sign-in form into a tool for
   * discovering who has an account here, which for a gym app means discovering
   * who trains where.
   */
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_TAKEN'
  | 'WEAK_PASSWORD'
  | 'MALFORMED_EMAIL'
  | 'EMAIL_NOT_VERIFIED'
  | 'RATE_LIMITED'
  | 'SESSION_EXPIRED'
  | 'OFFLINE'
  | 'PROVIDER_UNAVAILABLE';

export type AuthFailure = {
  code: AuthFailureCode;
  /** Diagnostic detail for logs. Never rendered verbatim. */
  detail?: string;
  retryAfterSeconds?: number;
};

export type AuthResult<T> = { ok: true; value: T } | { ok: false; failure: AuthFailure };

export interface AuthProvider {
  readonly name: 'local' | 'supabase';

  signUp(email: string, password: string): Promise<AuthResult<AuthSession>>;
  signIn(email: string, password: string): Promise<AuthResult<AuthSession>>;
  signOut(session: AuthSession): Promise<void>;

  /** Exchange a refresh token for a fresh session. */
  refresh(refreshToken: string): Promise<AuthResult<AuthSession>>;

  /**
   * Always resolves ok when the address is well-formed, whether or not an
   * account exists — for the same enumeration reason as INVALID_CREDENTIALS.
   */
  requestPasswordReset(email: string): Promise<AuthResult<void>>;

  /** Spec §8 requires this, and the UK GDPR requires it to be real. */
  deleteAccount(session: AuthSession): Promise<AuthResult<void>>;
}

/** User-facing copy. Says what to do next; never leaks which half was wrong. */
export const AUTH_MESSAGES: Record<AuthFailureCode, { title: string; detail: string }> = {
  INVALID_CREDENTIALS: {
    title: 'That did not match',
    detail: 'Check your email and password and try again.',
  },
  EMAIL_TAKEN: {
    title: 'That email is already registered',
    detail: 'Sign in instead, or reset your password if you have forgotten it.',
  },
  WEAK_PASSWORD: {
    title: 'Pick a stronger password',
    detail: 'Longer is what matters. Three random words beats one clever one.',
  },
  MALFORMED_EMAIL: {
    title: 'Check that address',
    detail: 'That does not look like an email address.',
  },
  EMAIL_NOT_VERIFIED: {
    title: 'Confirm your email',
    detail: 'We sent you a link. Open it, then come back and sign in.',
  },
  RATE_LIMITED: {
    title: 'Too many attempts',
    detail: 'Wait a moment before trying again.',
  },
  SESSION_EXPIRED: {
    title: 'Signed out',
    detail: 'You have been away a while. Sign in again to pick up where you left off.',
  },
  OFFLINE: {
    title: 'No connection',
    detail: 'Signing in needs a connection. Your logged work is safe on this phone.',
  },
  PROVIDER_UNAVAILABLE: {
    title: 'Cannot reach the server',
    detail: 'This is on us, not you. Try again in a moment.',
  },
};

export function describeAuthFailure(failure: AuthFailure): { title: string; detail: string } {
  return AUTH_MESSAGES[failure.code];
}
