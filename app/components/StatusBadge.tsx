"use client";

import { useEffect, useState } from "react";

interface Status {
  modelProvider: { id: string; label: string; models: Record<string, string> } | null;
  availableProviders: string[];
  providerError: string | null;
  supabaseConfigured: boolean;
  storage: "supabase" | "local";
  semanticRetrieval: boolean;
}

/**
 * Shows what is configured.
 *
 * A missing OpenAI key is the difference between "the app is broken" and "I have
 * not finished setting it up", so it is worth one line in the header rather than
 * a failed generation three clicks later.
 */
export function StatusBadge() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  if (!status.modelProvider) {
    return (
      <span
        className="chip chip-danger"
        title={
          status.providerError ??
          "Set OPENAI_API_KEY, ANTHROPIC_API_KEY or GOOGLE_API_KEY."
        }
      >
        No model key
      </span>
    );
  }

  return (
    <>
      <span
        className="chip chip-mono"
        title={`Primary: ${status.modelProvider.models.primary}. Fast: ${status.modelProvider.models.fast}.`}
      >
        {status.modelProvider.label}
      </span>
      <span
        className="chip chip-neutral chip-mono"
        title={
          status.storage === "local"
            ? "Saving to a local JSON file. Semantic retrieval over past posts is off until Supabase is configured."
            : status.semanticRetrieval
              ? "Saving to Supabase. Semantic retrieval is on."
              : "Saving to Supabase, but no configured provider can embed, so semantic retrieval is off."
        }
      >
        {status.storage === "local" ? "Local storage" : "Supabase"}
      </span>
    </>
  );
}
