/**
 * Store selection.
 *
 * Supabase when it is configured, the local JSON file otherwise. The choice is
 * made once and memoised, and reported to the UI so the active backend is never
 * a guess.
 */

import { isSupabaseConfigured } from "../lib/env";
import { LocalStore } from "./local-store";
import { SupabaseStore } from "./supabase-store";
import type { EngineStore } from "./types";

let cached: EngineStore | null = null;

export function getStore(): EngineStore {
  if (cached) return cached;
  cached = isSupabaseConfigured() ? new SupabaseStore() : new LocalStore();
  return cached;
}

/** Test seam. */
export function __setStoreForTests(store: EngineStore | null): void {
  cached = store;
}

export * from "./types";
export { LocalStore } from "./local-store";
export { SupabaseStore } from "./supabase-store";
