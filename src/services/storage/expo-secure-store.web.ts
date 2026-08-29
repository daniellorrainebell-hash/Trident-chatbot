/**
 * Web stand-in for expo-secure-store.
 *
 * The real module has no web implementation — it exports an empty object, so
 * every call fails. That is correct for a shipping app (a browser has no
 * keychain) but it makes the whole sign-in and quick-unlock flow impossible to
 * demonstrate in the only place this app can currently be driven.
 *
 * So: localStorage, and no pretence. THERE IS NO SECURITY HERE. Values are
 * readable by anything with access to the page. `requireAuthentication` cannot
 * be honoured because there is nothing to authenticate against, so this
 * reports that gated storage is unavailable and the app offers the PIN path
 * instead — the same thing it does on a phone with no biometrics enrolled.
 *
 * Metro swaps this in for `platform === 'web'` only. Native keeps the keychain.
 */
import { deleteWebValue, readWebValue, writeWebValue } from './webStorage';

const PREFIX = 'kennel.securestore.';

export const AFTER_FIRST_UNLOCK = 0;
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 1;
export const ALWAYS = 2;
export const ALWAYS_THIS_DEVICE_ONLY = 3;
export const WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = 4;
export const WHEN_UNLOCKED = 5;
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = 6;

export type SecureStoreOptions = {
  requireAuthentication?: boolean;
  authenticationPrompt?: string;
  keychainAccessible?: number;
};

export async function isAvailableAsync(): Promise<boolean> {
  return true;
}

/**
 * False, and truthfully so. Claiming otherwise would let the app store a
 * session behind a check that does not exist.
 */
export async function canUseBiometricAuthentication(): Promise<boolean> {
  return false;
}

export async function getItemAsync(
  key: string,
  options?: SecureStoreOptions,
): Promise<string | null> {
  if (options?.requireAuthentication) {
    throw new Error('Authentication-gated storage is not available on web.');
  }
  return getItem(key);
}

export async function setItemAsync(
  key: string,
  value: string,
  options?: SecureStoreOptions,
): Promise<void> {
  if (options?.requireAuthentication) {
    throw new Error('Authentication-gated storage is not available on web.');
  }
  setItem(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  deleteWebValue(PREFIX + key);
}

export function getItem(key: string): string | null {
  return readWebValue(PREFIX + key);
}

export function setItem(key: string, value: string): void {
  writeWebValue(PREFIX + key, value);
}
