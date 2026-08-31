"use client";

import { useEffect, useState } from "react";
import { Stepper, type StepId } from "./components/Stepper";
import { StrategyPanel } from "./components/StrategyPanel";
import { HookPicker, type RankedHook } from "./components/HookPicker";
import { DraftView } from "./components/DraftView";
import type { LintResult } from "./components/LintPanel";
import type { DistributionResult } from "./components/DistributionPanel";
import { RequirementsChecklist } from "./components/RequirementsChecklist";

interface GenerateResponse {
  postId: string | null;
  result: {
    analysis: Parameters<typeof StrategyPanel>[0]["analysis"];
    strategyCorrections: string[];
    hooks: RankedHook[];
    draft?: string;
    criticReport?: Parameters<typeof DraftView>[0]["criticReport"];
    lint?: LintResult;
    distribution?: DistributionResult;
    revisionCount: number;
    unresolvedLintErrors: string[];
    frameworkWarnings: string[];
  };
}

const PLACEHOLDER =
  "People are vibe coding AI products and selling them without understanding governance.";

export default function Composer() {
  const [idea, setIdea] = useState("");
  const [step, setStep] = useState<StepId>("idea");
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<GenerateResponse | null>(null);
  const [selectedHook, setSelectedHook] = useState<string | null>(null);

  // Advanced overrides. Left empty, the strategist decides everything.
  const [audience, setAudience] = useState("");
  const [ctaType, setCtaType] = useState("");
  const [tone, setTone] = useState("");
  const [forceResearch, setForceResearch] = useState(false);
  const [pickHook, setPickHook] = useState(true);
  // Which trade-offs this post is willing to make. Balanced keeps the voice
  // while removing clear recommendation negatives.
  const [distributionMode, setDistributionMode] = useState("balanced");

  // Supporting material. Everything factual in the draft must trace back to
  // here, to retrieval, or to verified research.
  const [brief, setBrief] = useState("");

  // The checklist. Several of these are the honest input to the integrity
  // gates: the engine will not write a story unless you say you have one.
  const [requirements, setRequirements] = useState<Record<string, boolean>>({});
  const [profile, setProfile] = useState<{ signOff: string; hasOffer: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((response) => response.json())
      .then((data) =>
        setProfile({
          signOff: data?.identity?.signOff ?? "",
          hasOffer: Boolean(data?.offer),
        }),
      )
      .catch(() => setProfile({ signOff: "", hasOffer: false }));
  }, []);

  const toggle = (key: string) =>
    setRequirements((current) => ({ ...current, [key]: !current[key] }));

  const overrides = () => {
    const value: Record<string, unknown> = {};
    if (audience.trim()) value.audience = audience.trim();
    if (ctaType.trim()) value.ctaType = ctaType.trim();
    if (tone.trim()) value.tone = tone.trim();
    if (forceResearch) value.forceResearch = true;
    return Object.keys(value).length ? value : undefined;
  };

  const call = async (body: Record<string, unknown>, label: string) => {
    setWorking(label);
    setError(null);
    try {
      const httpResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await httpResponse.json();
      if (!httpResponse.ok) throw new Error(data.detail ?? data.error ?? "Failed");
      return data as GenerateResponse;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something failed.");
      return null;
    } finally {
      setWorking(null);
    }
  };

  const build = async () => {
    const data = await call(
      {
        idea,
        mode: "quick_draft",
        pauseForHookSelection: pickHook,
        distributionMode,
        brief,
        requirements,
        overrides: overrides(),
      },
      pickHook ? "Working out the strategy and writing hooks" : "Building the post",
    );
    if (!data) return;

    setResponse(data);
    setStep(data.result.draft ? "draft" : "hook");
  };

  const chooseHook = async (hook: RankedHook) => {
    setSelectedHook(hook.candidate.text);

    const data = await call(
      {
        idea,
        mode: "quick_draft",
        selectedHook: hook.candidate,
        distributionMode,
        brief,
        requirements,
        overrides: overrides(),
      },
      "Writing and critiquing the post",
    );
    if (!data) return;

    setResponse(data);
    setStep("draft");
  };

  const startOver = () => {
    setResponse(null);
    setSelectedHook(null);
    setStep("idea");
    setError(null);
  };

  const result = response?.result;

  return (
    <main className="page">
      <Stepper current={step} />

      {error && (
        <div className="notice notice-error">
          <strong>That did not work.</strong> {error}
        </div>
      )}

      {step === "idea" && (
        <div className="page-narrow" style={{ margin: "0 auto" }}>
          <div className="card card-lg">
            <div className="card-head">
              <h1>What&rsquo;s the idea?</h1>
            </div>
            <p className="card-note">
              A rough sentence is enough. Socrates works out the audience,
              structure and hook from your positioning and past writing.
            </p>

            <textarea
              className="idea-input"
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder={PLACEHOLDER}
              aria-label="Your idea"
            />

            <div className="field" style={{ marginTop: "1.1rem" }}>
              <span className="section-label">Brief (optional)</span>
              <textarea
                rows={5}
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                placeholder={
                  "Anything the post should draw on. Notes, the story, numbers you have, links, what you want to land, who it is for, what to avoid. Paste as much as you like."
                }
                aria-label="Brief"
              />
              <span className="field-hint">
                Everything factual in the draft has to trace back to here, your saved
                knowledge, or verified research.
              </span>
            </div>

            <RequirementsChecklist
              values={requirements}
              onToggle={toggle}
              hasSignOff={Boolean(profile?.signOff)}
              hasOffer={Boolean(profile?.hasOffer)}
              signOff={profile?.signOff ?? ""}
            />

            <div className="btn-row" style={{ marginTop: "1.25rem", alignItems: "center" }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={build}
                disabled={idea.trim().length < 3 || working !== null}
              >
                {working && <span className="spinner" />}
                Build post
              </button>
              <label className="check">
                <input
                  type="checkbox"
                  checked={pickHook}
                  onChange={(event) => setPickHook(event.target.checked)}
                />
                Let me pick the opening
              </label>
            </div>

            <details className="advanced">
              <summary>Advanced</summary>
              <div>
                <p className="card-note" style={{ margin: "0 0 1.1rem" }}>
                  All optional. Anything left blank is decided by the strategist.
                </p>
                <div className="field">
                  <span className="section-label">Distribution</span>
                  <select
                    value={distributionMode}
                    onChange={(event) => setDistributionMode(event.target.value)}
                  >
                    <option value="balanced">Balanced. Keep my voice, remove clear negatives</option>
                    <option value="broad_reach">Broad reach. Prioritise reaching strangers</option>
                    <option value="voice_first">Voice first. Personality over reach</option>
                    <option value="conversion_first">Conversion first. Selling matters more than reach</option>
                    <option value="network_first">Network first. For people who already know me</option>
                  </select>
                  <span className="field-hint">
                    Changes which trade-offs the distribution check accepts rather than flags.
                  </span>
                </div>

                <div className="field-row">
                  <div className="field">
                    <span className="section-label">Audience</span>
                    <input
                      type="text"
                      value={audience}
                      onChange={(event) => setAudience(event.target.value)}
                      placeholder="Recruitment agency founders"
                    />
                  </div>
                  <div className="field">
                    <span className="section-label">CTA</span>
                    <input
                      type="text"
                      value={ctaType}
                      onChange={(event) => setCtaType(event.target.value)}
                      placeholder="none, or: message me about a governance build"
                    />
                  </div>
                  <div className="field">
                    <span className="section-label">Tone note</span>
                    <input
                      type="text"
                      value={tone}
                      onChange={(event) => setTone(event.target.value)}
                      placeholder="Blunter than usual"
                    />
                  </div>
                </div>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={forceResearch}
                    onChange={(event) => setForceResearch(event.target.checked)}
                  />
                  Verify the facts before writing (slower)
                </label>
              </div>
            </details>
          </div>
        </div>
      )}

      {working && step !== "idea" && (
        <div className="working" style={{ marginBottom: "1rem" }}>
          <span className="spinner" />
          {working}...
        </div>
      )}

      {step === "hook" && result && (
        <div className="split">
          <HookPicker
            hooks={result.hooks}
            selected={selectedHook}
            onSelect={chooseHook}
            disabled={working !== null}
          />
          <div className="stack">
            <StrategyPanel
              analysis={result.analysis}
              corrections={result.strategyCorrections}
            />
            <button className="btn btn-ghost" onClick={startOver}>
              Start over
            </button>
          </div>
        </div>
      )}

      {step === "draft" && result?.draft && (
        <div className="stack">
          <DraftView
            postId={response?.postId ?? null}
            aiDraft={result.draft}
            criticReport={result.criticReport ?? null}
            initialLint={result.lint ?? null}
            distribution={result.distribution ?? null}
            revisionCount={result.revisionCount}
            unresolvedErrors={result.unresolvedLintErrors}
          />
          <div className="split">
            <StrategyPanel
              analysis={result.analysis}
              corrections={result.strategyCorrections}
            />
            <button className="btn btn-ghost" onClick={startOver}>
              Write another
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
