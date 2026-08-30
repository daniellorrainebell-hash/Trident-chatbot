"use client";

import { useEffect, useState } from "react";

interface Status {
  openaiConfigured: boolean;
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

  if (!status.openaiConfigured) {
    return (
      <span className="chip chip-danger" title="Set OPENAI_API_KEY in .env.local">
        No OpenAI key
      </span>
    );
  }

  return (
    <span
      className="chip chip-neutral"
      title={
        status.storage === "local"
          ? "Saving to a local JSON file. Semantic retrieval over past posts is off until Supabase is configured."
          : "Saving to Supabase. Semantic retrieval is on."
      }
    >
      {status.storage === "local" ? "Local storage" : "Supabase"}
    </span>
  );
}
