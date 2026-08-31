/**
 * GET /api/status
 *
 * What is configured and what is not.
 *
 * The UI shows this so a missing key is visible before a generation fails, and
 * so the active storage backend is never a guess.
 */

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "../../../src/lib/env";
import { getStore } from "../../../src/store";
import { availableProviders, getProvider } from "../../../src/lib/providers";
import { embeddingsAvailable } from "../../../src/retrieval/embeddings";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const store = getStore();
  const providers = availableProviders();

  // Constructing the provider validates its configuration, so a broken setup
  // shows up here rather than three clicks later.
  let active: { id: string; label: string; models: Record<string, string> } | null = null;
  let providerError: string | null = null;

  if (providers.length > 0) {
    try {
      const provider = getProvider();
      active = {
        id: provider.id,
        label: provider.label,
        models: {
          primary: provider.modelFor("primary"),
          deep: provider.modelFor("deep"),
          fast: provider.modelFor("fast"),
        },
      };
    } catch (error) {
      providerError = error instanceof Error ? error.message : String(error);
    }
  }

  return NextResponse.json({
    modelProvider: active,
    availableProviders: providers,
    providerError,
    supabaseConfigured: isSupabaseConfigured(),
    storage: store.kind,
    // Needs both a vector store and a provider that can embed.
    semanticRetrieval: store.supportsSemanticRetrieval && embeddingsAvailable(),
  });
}
