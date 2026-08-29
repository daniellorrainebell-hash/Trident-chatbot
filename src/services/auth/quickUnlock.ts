import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import {
  FRESH_LOCKOUT,
  isLockedOut,
  recordFailure,
  recordSuccess,
  remainingAttempts,
  type LockoutState,
} from '@/engines/auth/lockout';

/**
 * Getting back in without typing a password (spec §8).
 *
 * The password is typed once, at registration. After that the refresh token
 * lives in the device keychain and the way to it is a thumb print, a face, or
 * a PIN.
 *
 * The biometric path is enforced by the operating system, not by this app. The
 * token is written with `requireAuthentication`, so iOS Keychain and Android
 * Keystore refuse to return the value at all until the user authenticates.
 * There is no screen to bypass, because the check is not in a screen.
 *
 * The PIN path is weaker and this file does not pretend otherwise. `expo-crypto`
 * offers a digest and no PBKDF2, so six digits cannot be stretched into
 * something expensive to guess. What protects it instead is that the attempts
 * run out after five, and running out destroys the stored token rather than
 * starting a timer someone can wait through.
 *
 * Neither path is server-side security. Both stop someone who picks up your
 * unlocked phone; neither stops someone who can read the device's storage.
 */

/** SecureStore keys accept letters, digits, dot, dash and underscore. */
const KEY_BIOMETRIC_TOKEN = 'kennel.unlock.biometric';
const KEY_PIN_TOKEN = 'kennel.unlock.pin_token';
const KEY_PIN_CREDENTIAL = 'kennel.unlock.pin_credential';
const KEY_LOCKOUT = 'kennel.unlock.lockout';
const KEY_MODE = 'kennel.unlock.mode';

export type UnlockMode = 'biometric' | 'pin' | 'none';

export type BiometricKind = 'face' | 'fingerprint' | 'iris';

export type UnlockCapability = {
  /** The device has the hardware AND the user has enrolled something in it. */
  biometricAvailable: boolean;
  kinds: BiometricKind[];
  /**
   * Whether the keychain will accept an authentication-gated item. False on a
   * device with no secure lock screen, where the OS has nothing to gate with.
   */
  canStoreGated: boolean;
};

export type UnlockFailure =
  | 'CANCELLED'
  | 'NOT_ENROLLED'
  | 'WRONG_PIN'
  | 'LOCKED_OUT'
  | 'KEY_INVALIDATED'
  | 'NOTHING_STORED';

export type UnlockResult =
  | { ok: true; refreshToken: string }
  | { ok: false; failure: UnlockFailure; attemptsRemaining?: number };

export async function describeCapability(): Promise<UnlockCapability> {
  try {
    const [hasHardware, enrolled, types, canStoreGated] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
      SecureStore.canUseBiometricAuthentication(),
    ]);

    return {
      // Hardware alone is not an offer. A phone with a fingerprint reader and
      // no finger registered would show a button that can only fail.
      biometricAvailable: hasHardware && enrolled,
      kinds: types.map(toKind).filter((k): k is BiometricKind => k !== null),
      canStoreGated,
    };
  } catch {
    return { biometricAvailable: false, kinds: [], canStoreGated: false };
  }
}

function toKind(type: LocalAuthentication.AuthenticationType): BiometricKind | null {
  if (type === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) return 'face';
  if (type === LocalAuthentication.AuthenticationType.FINGERPRINT) return 'fingerprint';
  if (type === LocalAuthentication.AuthenticationType.IRIS) return 'iris';
  return null;
}

/** What to call it on screen. "Biometrics" is not a word anyone says. */
export function nameFor(kinds: BiometricKind[]): string {
  if (kinds.includes('face')) return 'Face ID';
  if (kinds.includes('fingerprint')) return 'your fingerprint';
  if (kinds.includes('iris')) return 'iris unlock';
  return 'biometric unlock';
}

export async function currentMode(): Promise<UnlockMode> {
  const stored = await safeGet(KEY_MODE);
  return stored === 'biometric' || stored === 'pin' ? stored : 'none';
}

/* ── Setting it up ────────────────────────────────────────────────────────── */

export async function enableBiometricUnlock(refreshToken: string): Promise<boolean> {
  const capability = await describeCapability();
  if (!capability.biometricAvailable || !capability.canStoreGated) return false;

  try {
    await SecureStore.setItemAsync(KEY_BIOMETRIC_TOKEN, refreshToken, {
      requireAuthentication: true,
      authenticationPrompt: 'Confirm it is you',
      // This device only: a keychain backup restored onto a new phone must not
      // carry a session with it.
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await SecureStore.setItemAsync(KEY_MODE, 'biometric');
    // One mode at a time. Leaving a PIN credential behind would keep a weaker
    // way in alongside the stronger one.
    await Promise.all([safeDelete(KEY_PIN_TOKEN), safeDelete(KEY_PIN_CREDENTIAL)]);
    return true;
  } catch {
    return false;
  }
}

export async function enablePinUnlock(refreshToken: string, pin: string): Promise<boolean> {
  try {
    const salt = bytesToHex(Crypto.getRandomBytes(16));
    const hash = await hashPin(pin, salt);

    await SecureStore.setItemAsync(KEY_PIN_CREDENTIAL, JSON.stringify({ salt, hash }), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await SecureStore.setItemAsync(KEY_PIN_TOKEN, refreshToken, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await writeLockout(FRESH_LOCKOUT);
    await SecureStore.setItemAsync(KEY_MODE, 'pin');
    await safeDelete(KEY_BIOMETRIC_TOKEN);
    return true;
  } catch {
    return false;
  }
}

/** Forget everything. Used on sign-out, on lockout, and on account deletion. */
export async function disableQuickUnlock(): Promise<void> {
  await Promise.all([
    safeDelete(KEY_BIOMETRIC_TOKEN),
    safeDelete(KEY_PIN_TOKEN),
    safeDelete(KEY_PIN_CREDENTIAL),
    safeDelete(KEY_LOCKOUT),
    safeDelete(KEY_MODE),
  ]);
}

/* ── Getting back in ──────────────────────────────────────────────────────── */

export async function unlockWithBiometrics(): Promise<UnlockResult> {
  try {
    // The OS prompt happens inside this call: without a successful
    // authentication it does not return the value.
    const token = await SecureStore.getItemAsync(KEY_BIOMETRIC_TOKEN, {
      requireAuthentication: true,
      authenticationPrompt: 'Unlock The Kennel',
    });
    if (!token) return { ok: false, failure: 'NOTHING_STORED' };
    return { ok: true, refreshToken: token };
  } catch (cause) {
    // Adding or removing a fingerprint invalidates the key, and the stored
    // value becomes permanently unreadable. That is the system working as
    // intended — but it must not read as a lockout, so the entry is cleared
    // and the caller falls back to the password.
    const message = cause instanceof Error ? cause.message : String(cause);
    if (/invalidat|key.*permanently|decrypt/i.test(message)) {
      await disableQuickUnlock();
      return { ok: false, failure: 'KEY_INVALIDATED' };
    }
    return { ok: false, failure: 'CANCELLED' };
  }
}

export async function unlockWithPin(pin: string): Promise<UnlockResult> {
  const lockout = await readLockout();
  if (isLockedOut(lockout)) {
    await disableQuickUnlock();
    return { ok: false, failure: 'LOCKED_OUT', attemptsRemaining: 0 };
  }

  const raw = await safeGet(KEY_PIN_CREDENTIAL);
  if (!raw) return { ok: false, failure: 'NOTHING_STORED' };

  let credential: { salt: string; hash: string };
  try {
    credential = JSON.parse(raw) as { salt: string; hash: string };
  } catch {
    await disableQuickUnlock();
    return { ok: false, failure: 'NOTHING_STORED' };
  }

  const candidate = await hashPin(pin, credential.salt);
  if (candidate !== credential.hash) {
    const next = recordFailure(lockout);
    await writeLockout(next);

    if (isLockedOut(next)) {
      // Destroy the token rather than start a timer. A timer is something to
      // wait out; this is not.
      await disableQuickUnlock();
      return { ok: false, failure: 'LOCKED_OUT', attemptsRemaining: 0 };
    }
    return { ok: false, failure: 'WRONG_PIN', attemptsRemaining: remainingAttempts(next) };
  }

  const token = await safeGet(KEY_PIN_TOKEN);
  if (!token) return { ok: false, failure: 'NOTHING_STORED' };

  await writeLockout(recordSuccess());
  return { ok: true, refreshToken: token };
}

/* ── Internals ────────────────────────────────────────────────────────────── */

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, `${salt}:${pin}`);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function readLockout(): Promise<LockoutState> {
  const raw = await safeGet(KEY_LOCKOUT);
  if (!raw) return FRESH_LOCKOUT;
  try {
    const parsed = JSON.parse(raw) as LockoutState;
    return typeof parsed.failedAttempts === 'number' ? parsed : FRESH_LOCKOUT;
  } catch {
    return FRESH_LOCKOUT;
  }
}

async function writeLockout(state: LockoutState): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY_LOCKOUT, JSON.stringify(state), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    /* best effort — a failed write must not grant an extra attempt */
  }
}

async function safeGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function safeDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* already gone, or a store that will not answer */
  }
}
