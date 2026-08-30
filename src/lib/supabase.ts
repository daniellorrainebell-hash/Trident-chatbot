/**
 * Supabase clients.
 *
 * getServiceClient() uses the service role key and bypasses row level security.
 * It is server only and must never be constructed in the browser.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicEnv, getServerEnv, isSupabaseConfigured } from "./env";

let cachedService: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "getServiceClient() was called in the browser. The service role key bypasses " +
        "row level security and must stay server-side.",
    );
  }
  if (cachedService) return cachedService;

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. The engine falls back to the local JSON store, " +
        "so this client should not have been constructed. Call getStore() instead.",
    );
  }

  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();

  cachedService = createClient(NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedService;
}

/** Anon client. Safe in the browser, subject to row level security. */
export function getAnonClient(): SupabaseClient {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getPublicEnv();
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured.");
  }
  return createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
