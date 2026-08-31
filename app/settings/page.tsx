"use client";

import { useEffect, useState } from "react";

interface Identity {
  bio: string;
  expertise: string;
  targetAudience: string;
  positioning: string;
  offers: string;
  goals: string;
  beliefs: string[];
}

interface VoiceProfile {
  language: string;
  sentence_length: string;
  paragraph_density: string;
  directness: string;
  technical_depth: string;
  humour: string;
  profanity: string;
  preferred_patterns: string[];
  banned_patterns: string[];
  banned_words: string[];
  cta_preferences: string[];
  format_preferences: string[];
  examples_positive: string[];
  examples_negative: string[];
}

const SELECTS: Array<{
  key: keyof VoiceProfile;
  label: string;
  options: string[];
}> = [
  {
    key: "sentence_length",
    label: "Sentence length",
    options: ["short", "short_to_medium", "medium", "varied"],
  },
  { key: "paragraph_density", label: "Paragraph density", options: ["low", "medium", "high"] },
  { key: "directness", label: "Directness", options: ["low", "medium", "high"] },
  {
    key: "technical_depth",
    label: "Technical depth",
    options: ["low", "medium", "high", "audience_dependent"],
  },
  { key: "humour", label: "Humour", options: ["none", "occasional", "frequent"] },
  {
    key: "profanity",
    label: "Profanity",
    options: ["never", "allowed_when_natural", "frequent"],
  },
];

const humanise = (value: string): string =>
  value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export default function Settings() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [voice, setVoice] = useState<VoiceProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) throw new Error(data.detail ?? data.error);
        setIdentity(data.identity);
        setVoice(data.voiceProfile);
      })
      .catch((caught: Error) => setError(caught.message));
  }, []);

  const save = async () => {
    if (!identity || !voice) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, voiceProfile: voice }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? data.error ?? "Failed");
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (error && !identity) {
    return (
      <main className="page page-narrow">
        <div className="notice notice-error">{error}</div>
      </main>
    );
  }

  if (!identity || !voice) {
    return (
      <main className="page page-narrow">
        <p className="muted">Loading...</p>
      </main>
    );
  }

  const textField = (
    key: keyof Identity,
    label: string,
    placeholder: string,
    rows = 2,
  ) => (
    <div className="field">
      <span className="section-label">{label}</span>
      <textarea
        rows={rows}
        value={identity[key] as string}
        placeholder={placeholder}
        onChange={(event) => setIdentity({ ...identity, [key]: event.target.value })}
      />
    </div>
  );

  const listField = (
    value: string[],
    label: string,
    hint: string,
    onChange: (next: string[]) => void,
  ) => (
    <div className="field">
      <span className="section-label">{label}</span>
      <textarea
        rows={3}
        value={value.join("\n")}
        placeholder={hint}
        onChange={(event) =>
          onChange(
            event.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          )
        }
      />
      <span className="field-hint">One per line.</span>
    </div>
  );

  return (
    <main className="page page-narrow">
      <div className="page-head" style={{ display: "flex", alignItems: "flex-start" }}>
        <div>
          <h1>Settings</h1>
          <p>What Socrates knows about you, instead of a blank prompt.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={save}
          disabled={saving}
          style={{ marginLeft: "auto" }}
        >
          {saving && <span className="spinner" />}
          Save
        </button>
      </div>

      {saved && <div className="notice notice-good">Saved.</div>}
      {error && <div className="notice notice-error">{error}</div>}

      <div className="card">
        <div className="card-head">
          <h2>Who you are</h2>
        </div>
        <p className="card-note">
          The more concrete this is, the less generic every draft will be. It is
          the single biggest lever on quality.
        </p>

        {textField("expertise", "Expertise", "What you actually know and do")}
        {textField("targetAudience", "Target audience", "Who you are writing for")}
        {textField("positioning", "Positioning", "What you do differently")}
        {textField("offers", "Offers", "What you sell")}
        {textField("goals", "Goals", "What the content is for")}
        {textField("bio", "Bio", "Short background", 3)}

        {listField(
          identity.beliefs,
          "Beliefs you genuinely hold",
          "What does your industry get wrong?\nWhat would you never recommend?",
          (beliefs) => setIdentity({ ...identity, beliefs }),
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>How you write</h2>
        </div>
        <p className="card-note">
          These update themselves as you edit drafts. Change them by hand if
          Socrates has read you wrong.
        </p>

        <div className="field-row">
          {SELECTS.map((select) => (
            <div className="field" key={select.key}>
              <span className="section-label">{select.label}</span>
              <select
                value={voice[select.key] as string}
                onChange={(event) =>
                  setVoice({ ...voice, [select.key]: event.target.value })
                }
              >
                {select.options.map((option) => (
                  <option key={option} value={option}>
                    {humanise(option)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {listField(
          voice.banned_words,
          "Words to never use",
          "On top of the built-in banned list",
          (banned_words) => setVoice({ ...voice, banned_words }),
        )}
        {listField(
          voice.banned_patterns,
          "Patterns you have rejected",
          "Learned from your edits. Add your own.",
          (banned_patterns) => setVoice({ ...voice, banned_patterns }),
        )}
        {listField(
          voice.preferred_patterns,
          "Patterns you prefer",
          "Learned from your edits. Add your own.",
          (preferred_patterns) => setVoice({ ...voice, preferred_patterns }),
        )}
        {listField(
          voice.cta_preferences,
          "CTA preferences",
          "How you like to end a post",
          (cta_preferences) => setVoice({ ...voice, cta_preferences }),
        )}
      </div>
    </main>
  );
}
