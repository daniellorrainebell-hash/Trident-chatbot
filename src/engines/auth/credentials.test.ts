import {
  MIN_PASSWORD_LENGTH,
  PIN_LENGTH,
  checkEmail,
  checkPassword,
  checkPin,
  describeProblem,
  normaliseEmail,
  CREDENTIAL_MESSAGES,
} from './credentials';

describe('email', () => {
  it('accepts ordinary addresses', () => {
    expect(checkEmail('danny@example.com')).toBeNull();
    expect(checkEmail('danny.bell+kennel@sub.example.co.uk')).toBeNull();
  });

  it('rejects an empty address before complaining about its shape', () => {
    expect(checkEmail('')).toBe('EMAIL_REQUIRED');
    expect(checkEmail('   ')).toBe('EMAIL_REQUIRED');
  });

  it('rejects the obviously broken', () => {
    expect(checkEmail('danny')).toBe('EMAIL_MALFORMED');
    expect(checkEmail('danny@example')).toBe('EMAIL_MALFORMED');
    expect(checkEmail('danny @example.com')).toBe('EMAIL_MALFORMED');
    expect(checkEmail('@example.com')).toBe('EMAIL_MALFORMED');
  });

  it('normalises case and spacing, so one person is one account', () => {
    expect(normaliseEmail('  Danny.Bell@Example.COM ')).toBe('danny.bell@example.com');
    expect(checkEmail('  Danny@Example.COM ')).toBeNull();
  });
});

describe('password', () => {
  it('accepts a long passphrase with no symbols in it', () => {
    // The rule is length, not punctuation. This must pass.
    expect(checkPassword('correct horse battery staple')).toBeNull();
  });

  it('rejects one shorter than the minimum', () => {
    expect(checkPassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe('PASSWORD_TOO_SHORT');
    expect(checkPassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });

  it('rejects a long one that is still on every wordlist', () => {
    expect(checkPassword('passwordpassword')).toBe('PASSWORD_TOO_COMMON');
    expect(checkPassword('PasswordPassword')).toBe('PASSWORD_TOO_COMMON');
  });

  it('rejects the user own email address', () => {
    expect(checkPassword('danny@example.com', 'DANNY@example.com')).toBe('PASSWORD_IS_EMAIL');
  });

  it('bounds the length, so hashing cost cannot be driven by input', () => {
    expect(checkPassword('a'.repeat(1000))).toBe('PASSWORD_TOO_LONG');
  });

  it('complains about an empty password before its length', () => {
    expect(checkPassword('')).toBe('PASSWORD_REQUIRED');
  });
});

describe('PIN', () => {
  it('accepts an unremarkable six digits', () => {
    expect(checkPin('487302')).toBeNull();
    expect(checkPin('905183')).toBeNull();
  });

  it('insists on exactly six digits', () => {
    expect(checkPin('4873')).toBe('PIN_WRONG_LENGTH');
    expect(checkPin('4873021')).toBe('PIN_WRONG_LENGTH');
    expect(checkPin('48730a')).toBe('PIN_NOT_DIGITS');
  });

  it('rejects repeats and runs', () => {
    expect(checkPin('111111')).toBe('PIN_TOO_OBVIOUS');
    expect(checkPin('123456')).toBe('PIN_TOO_OBVIOUS');
    expect(checkPin('654321')).toBe('PIN_TOO_OBVIOUS');
  });

  it('rejects anything that reads as a birthday', () => {
    // A date is public information about the person holding the phone.
    expect(checkPin('120389')).toBe('PIN_TOO_OBVIOUS');
    expect(checkPin('310175')).toBe('PIN_TOO_OBVIOUS');
  });

  it('does not reject digits that only look date-like', () => {
    // 48 is not a day and not a month, so this is fine.
    expect(checkPin('487302')).toBeNull();
  });

  it('is six digits, which is a million minus the obvious ones', () => {
    let accepted = 0;
    for (let n = 0; n < 1_000_000; n += 1) {
      if (checkPin(String(n).padStart(PIN_LENGTH, '0')) === null) accepted += 1;
    }
    // Comfortably most of the space survives — the rules trim the guessable
    // tail, they do not shrink the keyspace to something brute-forceable.
    expect(accepted).toBeGreaterThan(900_000);
  });
});

describe('messages', () => {
  it('has copy for every problem, and none of it blames the user', () => {
    for (const [problem, message] of Object.entries(CREDENTIAL_MESSAGES)) {
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toMatch(/invalid|error|failed/i);
      expect(describeProblem(problem as keyof typeof CREDENTIAL_MESSAGES)).toBe(message);
    }
  });
});
