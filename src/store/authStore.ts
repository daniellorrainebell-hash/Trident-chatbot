import { create } from 'zustand';
import type { AuthFailure, AuthProvider, AuthSession } from '@/services/auth/types';
import {
  currentMode,
  describeCapability,
  disableQuickUnlock,
  enableBiometricUnlock,
  enablePinUnlock,
  unlockWithBiometrics,
  unlockWithPin,
  type UnlockCapability,
  type UnlockMode,
  type UnlockResult,
} from '@/services/auth/quickUnlock';

/**
 * Who is signed in, and whether the app is open to them (spec §8).
 *
 * Three states rather than a boolean, because "not signed in" and "signed in
 * but the phone has been put down" are different situations with different
 * screens. Collapsing them is how an app either asks for a password every
 * morning or never asks at all.
 *
 *   signed_out  no session on this device. Password required.
 *   locked      a session exists in the keychain. Thumb print or PIN required.
 *   signed_in   open.
 *
 * The provider is injected, like persistence and the product resolver: the
 * store has no opinion about whether accounts live on this device or in
 * Supabase.
 */
export type AuthStatus = 'unknown' | 'signed_out' | 'locked' | 'signed_in';

type AuthState = {
  status: AuthStatus;
  session: AuthSession | null;
  unlockMode: UnlockMode;
  capability: UnlockCapability | null;
  failure: AuthFailure | null;
  busy: boolean;
  provider: AuthProvider | null;

  setProvider(provider: AuthProvider): void;
  bootstrap(): Promise<void>;

  signUp(email: string, password: string): Promise<boolean>;
  signIn(email: string, password: string): Promise<boolean>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<boolean>;
  requestPasswordReset(email: string): Promise<boolean>;

  enableBiometric(): Promise<boolean>;
  enablePin(pin: string): Promise<boolean>;
  skipQuickUnlock(): Promise<void>;

  unlockBiometric(): Promise<UnlockResult>;
  unlockPin(pin: string): Promise<UnlockResult>;
  /** Give up on the unlock and go back to the password. */
  abandonUnlock(): Promise<void>;

  clearFailure(): void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'unknown',
  session: null,
  unlockMode: 'none',
  capability: null,
  failure: null,
  busy: false,
  provider: null,

  setProvider(provider) {
    set({ provider });
  },

  async bootstrap() {
    const [mode, capability] = await Promise.all([currentMode(), describeCapability()]);
    // A stored unlock is the only evidence of a previous session. Without one
    // there is nothing to unlock into, whatever else is on the device.
    set({ unlockMode: mode, capability, status: mode === 'none' ? 'signed_out' : 'locked' });
  },

  async signUp(email, password) {
    const provider = get().provider;
    if (!provider) return false;

    set({ busy: true, failure: null });
    const result = await provider.signUp(email, password);
    set({ busy: false });

    if (!result.ok) {
      set({ failure: result.failure });
      return false;
    }
    set({ session: result.value, status: 'signed_in' });
    return true;
  },

  async signIn(email, password) {
    const provider = get().provider;
    if (!provider) return false;

    set({ busy: true, failure: null });
    const result = await provider.signIn(email, password);
    set({ busy: false });

    if (!result.ok) {
      set({ failure: result.failure });
      return false;
    }
    set({ session: result.value, status: 'signed_in' });
    return true;
  },

  async signOut() {
    const { provider, session } = get();
    if (provider && session) await provider.signOut(session);

    // Signing out has to take the keychain entry with it. Leaving it would
    // mean the next launch offered a thumb print into an account the user
    // believes they have left.
    await disableQuickUnlock();
    set({ session: null, status: 'signed_out', unlockMode: 'none', failure: null });
  },

  async deleteAccount() {
    const { provider, session } = get();
    if (!provider || !session) return false;

    const result = await provider.deleteAccount(session);
    if (!result.ok) {
      set({ failure: result.failure });
      return false;
    }
    await disableQuickUnlock();
    set({ session: null, status: 'signed_out', unlockMode: 'none' });
    return true;
  },

  async requestPasswordReset(email) {
    const provider = get().provider;
    if (!provider) return false;

    set({ busy: true, failure: null });
    const result = await provider.requestPasswordReset(email);
    set({ busy: false });

    if (!result.ok) {
      set({ failure: result.failure });
      return false;
    }
    return true;
  },

  async enableBiometric() {
    const { session } = get();
    if (!session) return false;

    const enabled = await enableBiometricUnlock(session.refreshToken);
    if (enabled) set({ unlockMode: 'biometric' });
    return enabled;
  },

  async enablePin(pin) {
    const { session } = get();
    if (!session) return false;

    const enabled = await enablePinUnlock(session.refreshToken, pin);
    if (enabled) set({ unlockMode: 'pin' });
    return enabled;
  },

  async skipQuickUnlock() {
    await disableQuickUnlock();
    set({ unlockMode: 'none' });
  },

  async unlockBiometric() {
    return finishUnlock(get, set, await unlockWithBiometrics());
  },

  async unlockPin(pin) {
    return finishUnlock(get, set, await unlockWithPin(pin));
  },

  async abandonUnlock() {
    await disableQuickUnlock();
    set({ status: 'signed_out', unlockMode: 'none', session: null });
  },

  clearFailure() {
    set({ failure: null });
  },
}));

/**
 * Turn an unlocked refresh token into a live session.
 *
 * The unlock proves the person, not the session — the token still has to be
 * exchanged, and the server is still entitled to refuse it. A revoked or
 * expired token lands back on the password screen rather than pretending the
 * thumb print was enough.
 */
async function finishUnlock(
  get: () => AuthState,
  set: (partial: Partial<AuthState>) => void,
  result: UnlockResult,
): Promise<UnlockResult> {
  if (!result.ok) {
    if (result.failure === 'LOCKED_OUT' || result.failure === 'KEY_INVALIDATED') {
      set({ status: 'signed_out', unlockMode: 'none', session: null });
    }
    return result;
  }

  const provider = get().provider;
  if (!provider) return result;

  set({ busy: true });
  const refreshed = await provider.refresh(result.refreshToken);
  set({ busy: false });

  if (!refreshed.ok) {
    await disableQuickUnlock();
    set({ status: 'signed_out', unlockMode: 'none', session: null, failure: refreshed.failure });
    return { ok: false, failure: 'NOTHING_STORED' };
  }

  set({ session: refreshed.value, status: 'signed_in', failure: null });
  return result;
}
