import type { DocumentStore } from '@/services/storage/documentStore';
import { checkEmail, checkPassword, normaliseEmail } from '@/engines/auth/credentials';
import type { AuthFailureCode, AuthProvider, AuthResult, AuthSession, AuthUser } from './types';

/**
 * Accounts that live on this device.
 *
 * A real fallback, not a mock — the same posture as `LocalMealProvider`. It
 * genuinely stores an account, genuinely refuses the wrong password, and
 * genuinely issues and expires sessions, so the whole sign-up, unlock and
 * sign-out flow can be built and exercised before a Supabase project exists.
 *
 * It is NOT production authentication, and nothing here pretends otherwise:
 *
 *   - There is no server, so there is nothing to stop someone with the device
 *     and the patience to read SQLite from replacing the stored hash.
 *   - Password stretching is limited by what `expo-crypto` offers, which is a
 *     digest and no PBKDF2. Real hashing belongs server-side where argon2 can
 *     run; that is what SupabaseAuthProvider delegates to.
 *
 * Its job is to make the flow real today and to be deleted from the default
 * path the moment a backend exists.
 */

export type Digest = (input: string) => Promise<string>;
export type RandomHex = (bytes: number) => Promise<string>;

type LocalAccount = {
  id: string;
  email: string;
  salt: string;
  hash: string;
  createdAt: string;
};

type AccountsDocument = { accounts: LocalAccount[] };

const DOCUMENT_KEY = 'auth-accounts';
const DOCUMENT_VERSION = 1;

/**
 * Enough rounds to make a stolen hash annoying, few enough that a sign-in on a
 * mid-range Android is not a visible pause. Each round is a bridge call, which
 * is what caps this — see the note above about where real hashing belongs.
 */
export const HASH_ROUNDS = 250;

/** Sessions last a week; the refresh token is what survives, behind the unlock. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class LocalAuthProvider implements AuthProvider {
  readonly name = 'local' as const;

  constructor(
    private readonly documents: DocumentStore,
    private readonly digest: Digest,
    private readonly randomHex: RandomHex,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async signUp(email: string, password: string): Promise<AuthResult<AuthSession>> {
    const address = normaliseEmail(email);

    if (checkEmail(address)) return fail('MALFORMED_EMAIL');
    if (checkPassword(password, address)) return fail('WEAK_PASSWORD');

    const accounts = await this.load();
    if (accounts.some((a) => a.email === address)) return fail('EMAIL_TAKEN');

    const salt = await this.randomHex(16);
    const account: LocalAccount = {
      id: `user-${await this.randomHex(8)}`,
      email: address,
      salt,
      hash: await this.stretch(password, salt),
      createdAt: this.now().toISOString(),
    };

    await this.save([...accounts, account]);
    return { ok: true, value: await this.issue(account) };
  }

  async signIn(email: string, password: string): Promise<AuthResult<AuthSession>> {
    const address = normaliseEmail(email);
    const account = (await this.load()).find((a) => a.email === address);

    // Hash even when there is no account, so the response time does not say
    // whether the address is registered.
    const candidate = await this.stretch(password, account?.salt ?? 'absent');
    if (!account || !timingSafeEqual(candidate, account.hash)) {
      return fail('INVALID_CREDENTIALS');
    }

    return { ok: true, value: await this.issue(account) };
  }

  async signOut(): Promise<void> {
    // Nothing to revoke without a server. The caller clears the stored session,
    // which is what actually ends it here.
  }

  async refresh(refreshToken: string): Promise<AuthResult<AuthSession>> {
    const account = (await this.load()).find((a) => refreshToken.startsWith(`${a.id}.`));
    if (!account) return fail('SESSION_EXPIRED');
    return { ok: true, value: await this.issue(account) };
  }

  async requestPasswordReset(email: string): Promise<AuthResult<void>> {
    // Deliberately indistinguishable from the registered case: no email exists
    // to send, and reporting "no such account" would leak the account list.
    if (checkEmail(email)) return fail('MALFORMED_EMAIL');
    return { ok: true, value: undefined };
  }

  async deleteAccount(session: AuthSession): Promise<AuthResult<void>> {
    const remaining = (await this.load()).filter((a) => a.id !== session.user.id);
    await this.save(remaining);
    return { ok: true, value: undefined };
  }

  private async issue(account: LocalAccount): Promise<AuthSession> {
    const user: AuthUser = {
      id: account.id,
      email: account.email,
      // No mail server, so nothing to confirm. Supabase decides this properly.
      emailVerified: true,
      createdAt: account.createdAt,
    };
    return {
      user,
      accessToken: `${account.id}.${await this.randomHex(16)}`,
      refreshToken: `${account.id}.${await this.randomHex(24)}`,
      expiresAt: new Date(this.now().getTime() + SESSION_TTL_MS).toISOString(),
    };
  }

  private async stretch(password: string, salt: string): Promise<string> {
    let value = `${salt}:${password}`;
    for (let i = 0; i < HASH_ROUNDS; i += 1) {
      value = await this.digest(value);
    }
    return value;
  }

  private async load(): Promise<LocalAccount[]> {
    const stored = await this.documents.read(DOCUMENT_KEY);
    if (!stored || stored.version !== DOCUMENT_VERSION) return [];
    return (stored.data as AccountsDocument).accounts ?? [];
  }

  private async save(accounts: LocalAccount[]): Promise<void> {
    await this.documents.write(DOCUMENT_KEY, {
      version: DOCUMENT_VERSION,
      data: { accounts } satisfies AccountsDocument,
    });
  }
}

function fail(code: AuthFailureCode): AuthResult<never> {
  return { ok: false, failure: { code } };
}

/**
 * Compare without returning early on the first differing character.
 *
 * A comparison that bails early leaks how much of the hash matched, one byte
 * at a time, to anyone able to measure it.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}
