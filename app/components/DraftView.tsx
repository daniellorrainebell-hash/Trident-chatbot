"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LintPanel, type LintResult } from "./LintPanel";

const ADJUSTMENTS = [
  { id: "shorter", label: "Shorter" },
  { id: "longer", label: "More depth" },
  { id: "more_direct", label: "More direct" },
  { id: "more_conversational", label: "More conversational" },
  { id: "more_technical", label: "More technical" },
  { id: "stronger_opening", label: "Stronger opening" },
  { id: "add_cta", label: "Add a CTA" },
  { id: "remove_cta", label: "Remove the CTA" },
] as const;

/**
 * LinkedIn truncates a post past this length.
 * Kept as a constant so it is one edit if the platform changes it.
 */
const LINKEDIN_LIMIT = 3000;

interface CriticReport {
  score: number;
  verdict: string;
  problems: Array<{ problem: string; excerpt: string; fix: string; severity: string }>;
  is_generic: boolean;
}

/**
 * The draft screen.
 *
 * The post is editable in place. Editing it is the point: the difference between
 * what the engine wrote and what the user keeps is the training signal, so the
 * approve action sends both versions.
 */
export function DraftView({
  postId,
  aiDraft,
  criticReport,
  initialLint,
  revisionCount,
  unresolvedErrors,
}: {
  postId: string | null;
  aiDraft: string;
  criticReport: CriticReport | null;
  initialLint: LintResult | null;
  revisionCount: number;
  unresolvedErrors: string[];
}) {
  const [text, setText] = useState(aiDraft);
  const [lint, setLint] = useState<LintResult | null>(initialLint);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Grow the editor to fit the post. Judging a draft is harder through a
  // scrollbar than it is on the page.
  const editor = useRef<HTMLTextAreaElement | null>(null);
  const resize = useCallback(() => {
    const element = editor.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, []);

  useEffect(resize, [text, resize]);

  // Re-lint as the user edits. Debounced, and no model call, so it is cheap.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch("/api/lint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
        .then((response) => response.json())
        .then(setLint)
        .catch(() => undefined);
    }, 500);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text]);

  const adjust = async (adjustment: string, label: string) => {
    setBusy(label);
    setError(null);
    try {
      const response = await fetch("/api/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, draft: text, adjustment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? data.error ?? "Failed");
      setText(data.text);
      setLint(data.lint);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Adjustment failed.");
    } finally {
      setBusy(null);
    }
  };

  const approve = async () => {
    if (!postId) return;
    setBusy("Saving");
    setError(null);
    try {
      const response = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, aiDraft, userVersion: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? data.error ?? "Failed");
      setSaved(data.summary ?? "Saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Save failed.");
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const edited = text.trim() !== aiDraft.trim();

  return (
    <div className="split">
      <div className="stack">
        {unresolvedErrors.length > 0 && (
          <div className="notice notice-error" style={{ marginBottom: 0 }}>
            <strong>The engine could not clear every rule.</strong> It stopped rather
            than presenting this as finished.
            <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem" }}>
              {unresolvedErrors.map((item) => (
                <li key={item} className="mono">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card">
          <div className="card-head">
            <h3>Draft</h3>
            <span className="spacer" />
            <span
              className={`small tnum ${text.length > LINKEDIN_LIMIT ? "count-over" : "muted"}`}
              title={`LinkedIn truncates past ${LINKEDIN_LIMIT.toLocaleString("en-GB")} characters`}
            >
              {text.length.toLocaleString("en-GB")} / {LINKEDIN_LIMIT.toLocaleString("en-GB")}
            </span>
            {edited && <span className="chip chip-neutral">Edited</span>}
          </div>

          <div className="draft-column">
            <textarea
              ref={editor}
              className="draft-editor"
              value={text}
              onChange={(event) => setText(event.target.value)}
              spellCheck
              aria-label="Post draft"
            />

            <div className="btn-row" style={{ marginTop: "0.9rem" }}>
            <button className="btn btn-primary" onClick={approve} disabled={!postId || busy !== null}>
              {busy === "Saving" && <span className="spinner" />}
              Approve and save
            </button>
              <button className="btn" onClick={copy}>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {saved && (
            <div className="notice notice-good" style={{ marginTop: "0.9rem", marginBottom: 0 }}>
              <strong>Saved.</strong> {saved}
            </div>
          )}
          {error && (
            <div className="notice notice-error" style={{ marginTop: "0.9rem", marginBottom: 0 }}>
              {error}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Adjust</h3>
            <span className="spacer" />
            {busy && busy !== "Saving" && (
              <span className="small muted">
                <span className="spinner" /> {busy}
              </span>
            )}
          </div>
          <div className="btn-row">
            {ADJUSTMENTS.map((adjustment) => (
              <button
                key={adjustment.id}
                className="btn btn-sm"
                onClick={() => adjust(adjustment.id, adjustment.label)}
                disabled={busy !== null}
              >
                {adjustment.label}
              </button>
            ))}
          </div>
          <p className="small muted" style={{ margin: "0.8rem 0 0" }}>
            Every adjustment is recorded, so repeated choices shape future drafts.
          </p>
        </div>
      </div>

      <div className="stack">
        <LintPanel lint={lint} />

        {criticReport && (
          <div className="card">
            <div className="card-head">
              <h3>Critic</h3>
              <span className="spacer" />
              <span
                className={`chip ${
                  criticReport.score >= 7 ? "chip-good" : "chip-warn"
                }`}
              >
                {criticReport.score.toFixed(1)} / 10
              </span>
            </div>

            {revisionCount > 0 && (
              <p className="small muted">
                {revisionCount} revision {revisionCount === 1 ? "pass" : "passes"} applied
                before you saw this.
              </p>
            )}

            {criticReport.is_generic && (
              <div className="notice notice-warn" style={{ marginBottom: "0.8rem" }}>
                The critic thinks this could have been written for anybody.
              </div>
            )}

            {criticReport.problems.length === 0 ? (
              <p className="small muted" style={{ margin: 0 }}>
                Nothing outstanding.
              </p>
            ) : (
              criticReport.problems.map((problem, index) => (
                <div
                  key={index}
                  className={`finding ${
                    problem.severity === "blocking" ? "error" : "warning"
                  }`}
                >
                  <div className="finding-msg" style={{ marginTop: 0 }}>
                    {problem.problem}
                  </div>
                  {problem.excerpt && (
                    <span className="finding-excerpt">{problem.excerpt}</span>
                  )}
                  <div className="small muted" style={{ marginTop: "0.3rem" }}>
                    Fix: {problem.fix}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
