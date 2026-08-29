import { createHash, randomBytes } from 'node:crypto';
import { LocalAuthProvider, timingSafeEqual } from './localAuthProvider';
import { createMemoryDocumentStore } from '@/services/storage/documentStore';

const digest = async (input: string) => createHash('sha512').update(input).digest('hex');
const randomHex = async (bytes: number) => randomBytes(bytes).toString('hex');

const EMAIL = 'danny@example.com';
const PASSWORD = 'correct horse battery staple';

function provider(now = () => new Date('2026-08-29T09:00:00.000Z')) {
  const documents = createMemoryDocumentStore();
  return { documents, auth: new LocalAuthProvider(documents, digest, randomHex, now) };
}

describe('signing up', () => {
  it('creates an account and returns a session', async () => {
    const { auth } = provider();
    const result = await auth.signUp(EMAIL, PASSWORD);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.user.email).toBe(EMAIL);
    expect(result.value.accessToken).toBeTruthy();
    expect(result.value.refreshToken).toBeTruthy();
    expect(new Date(result.value.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('treats addresses as case-insensitive, so one person is one account', async () => {
    const { auth } = provider();
    await auth.signUp('Danny@Example.COM', PASSWORD);

    const again = await auth.signUp('  danny@example.com ', PASSWORD);
    expect(again).toMatchObject({ ok: false, failure: { code: 'EMAIL_TAKEN' } });
  });

  it('refuses a weak password before writing anything', async () => {
    const { auth, documents } = provider();
    const result = await auth.signUp(EMAIL, 'short');

    expect(result).toMatchObject({ ok: false, failure: { code: 'WEAK_PASSWORD' } });
    expect(documents.size()).toBe(0);
  });

  it('refuses a malformed address', async () => {
    const { auth } = provider();
    expect(await auth.signUp('danny', PASSWORD)).toMatchObject({
      ok: false,
      failure: { code: 'MALFORMED_EMAIL' },
    });
  });

  it('never stores the password itself', async () => {
    const { auth, documents } = provider();
    await auth.signUp(EMAIL, PASSWORD);

    const stored = JSON.stringify(await documents.read('auth-accounts'));
    expect(stored).not.toContain(PASSWORD);
    expect(stored).not.toContain('battery');
  });

  it('salts per account, so two people with one password differ on disk', async () => {
    const { auth, documents } = provider();
    await auth.signUp('a@example.com', PASSWORD);
    await auth.signUp('b@example.com', PASSWORD);

    const doc = await documents.read('auth-accounts');
    const accounts = (doc?.data as { accounts: { hash: string; salt: string }[] }).accounts;
    expect(accounts).toHaveLength(2);
    expect(accounts[0]!.salt).not.toBe(accounts[1]!.salt);
    expect(accounts[0]!.hash).not.toBe(accounts[1]!.hash);
  });
});

describe('signing in', () => {
  it('accepts the right password', async () => {
    const { auth } = provider();
    await auth.signUp(EMAIL, PASSWORD);

    const result = await auth.signIn(EMAIL, PASSWORD);
    expect(result.ok).toBe(true);
  });

  it('refuses the wrong password', async () => {
    const { auth } = provider();
    await auth.signUp(EMAIL, PASSWORD);

    expect(await auth.signIn(EMAIL, 'wrong horse battery staple')).toMatchObject({
      ok: false,
      failure: { code: 'INVALID_CREDENTIALS' },
    });
  });

  it('gives the same answer for a wrong password and an unknown address', async () => {
    // The sign-in form must not become a way to discover who has an account.
    const { auth } = provider();
    await auth.signUp(EMAIL, PASSWORD);

    const wrongPassword = await auth.signIn(EMAIL, 'not the right one at all');
    const noSuchUser = await auth.signIn('stranger@example.com', PASSWORD);

    expect(wrongPassword).toEqual(noSuchUser);
  });

  it('issues a different token each time', async () => {
    const { auth } = provider();
    await auth.signUp(EMAIL, PASSWORD);

    const first = await auth.signIn(EMAIL, PASSWORD);
    const second = await auth.signIn(EMAIL, PASSWORD);
    if (!first.ok || !second.ok) throw new Error('expected both to succeed');

    expect(first.value.accessToken).not.toBe(second.value.accessToken);
    expect(first.value.refreshToken).not.toBe(second.value.refreshToken);
  });
});

describe('refresh', () => {
  it('exchanges a refresh token for a fresh session', async () => {
    const { auth } = provider();
    const created = await auth.signUp(EMAIL, PASSWORD);
    if (!created.ok) throw new Error('expected sign-up to succeed');

    const refreshed = await auth.refresh(created.value.refreshToken);
    expect(refreshed.ok).toBe(true);
    if (!refreshed.ok) return;
    expect(refreshed.value.user.id).toBe(created.value.user.id);
    expect(refreshed.value.accessToken).not.toBe(created.value.accessToken);
  });

  it('reports an unknown token as an expired session, not a crash', async () => {
    const { auth } = provider();
    expect(await auth.refresh('nonsense')).toMatchObject({
      ok: false,
      failure: { code: 'SESSION_EXPIRED' },
    });
  });

  it('stops working once the account is deleted', async () => {
    const { auth } = provider();
    const created = await auth.signUp(EMAIL, PASSWORD);
    if (!created.ok) throw new Error('expected sign-up to succeed');

    await auth.deleteAccount(created.value);
    expect(await auth.refresh(created.value.refreshToken)).toMatchObject({
      ok: false,
      failure: { code: 'SESSION_EXPIRED' },
    });
  });
});

describe('password reset', () => {
  it('answers the same whether or not the address is registered', async () => {
    // Anything else turns "forgot password" into an account-existence oracle.
    const { auth } = provider();
    await auth.signUp(EMAIL, PASSWORD);

    expect(await auth.requestPasswordReset(EMAIL)).toEqual(
      await auth.requestPasswordReset('stranger@example.com'),
    );
  });

  it('still rejects an address that is not an address', async () => {
    const { auth } = provider();
    expect(await auth.requestPasswordReset('danny')).toMatchObject({
      ok: false,
      failure: { code: 'MALFORMED_EMAIL' },
    });
  });
});

describe('deleting an account', () => {
  it('removes it, and frees the address for reuse', async () => {
    const { auth } = provider();
    const created = await auth.signUp(EMAIL, PASSWORD);
    if (!created.ok) throw new Error('expected sign-up to succeed');

    await auth.deleteAccount(created.value);

    expect(await auth.signIn(EMAIL, PASSWORD)).toMatchObject({
      ok: false,
      failure: { code: 'INVALID_CREDENTIALS' },
    });
    expect((await auth.signUp(EMAIL, PASSWORD)).ok).toBe(true);
  });

  it('leaves other accounts alone', async () => {
    const { auth } = provider();
    const mine = await auth.signUp(EMAIL, PASSWORD);
    await auth.signUp('other@example.com', PASSWORD);
    if (!mine.ok) throw new Error('expected sign-up to succeed');

    await auth.deleteAccount(mine.value);
    expect((await auth.signIn('other@example.com', PASSWORD)).ok).toBe(true);
  });
});

describe('timingSafeEqual', () => {
  it('matches identical strings and rejects differences', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
    expect(timingSafeEqual('', '')).toBe(true);
  });

  it('examines the whole string even when the first character differs', () => {
    // A short-circuiting compare leaks the hash one character at a time.
    const long = 'x'.repeat(2000);
    expect(timingSafeEqual(`a${long}`, `b${long}`)).toBe(false);
  });
});
