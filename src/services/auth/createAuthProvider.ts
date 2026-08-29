import * as Crypto from 'expo-crypto';
import { LocalAuthProvider } from './localAuthProvider';
import { sqliteDocumentStore } from '@/services/storage/sqliteDocumentStore';
import type { AuthProvider } from './types';

/**
 * The authentication provider this build runs on.
 *
 * Local accounts today, because there is no Supabase project yet. The moment
 * one exists this returns a SupabaseAuthProvider instead and nothing above it
 * changes — screens and the store only ever see the `AuthProvider` interface.
 *
 * Deliberately a function rather than a constant: it reads configuration, and
 * a constant would bind that at import time, before the environment is known.
 */
export function createAuthProvider(): AuthProvider {
  return new LocalAuthProvider(
    sqliteDocumentStore,
    (input) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, input),
    async (bytes) => bytesToHex(Crypto.getRandomBytes(bytes)),
  );
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
