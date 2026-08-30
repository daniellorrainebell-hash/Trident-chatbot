"use client";

interface Analysis {
  topic: string;
  core_claim: string;
  target_audience: string;
  reader_stage: string;
  content_pillars: string[];
  primary_objective: string;
  primary_psychology: string;
  recommended_framework: string;
  framework_rationale: string;
  proof_available: string[];
  proof_missing: string[];
  research_required: boolean;
  risk_level: string;
  cta_type: string;
}

const humanise = (value: string): string =>
  value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/**
 * What the engine decided and why.
 *
 * The framework rationale is shown by default rather than hidden in an advanced
 * drawer. Being able to say why a structure was chosen is one of the spec's
 * success criteria, and it is also the fastest way to spot a wrong call.
 */
export function StrategyPanel({
  analysis,
  corrections,
}: {
  analysis: Analysis;
  corrections: string[];
}) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>Strategy</h3>
        <span className="spacer" />
        {analysis.research_required && <span className="chip chip-warn">Research ran</span>}
        <span
          className={`chip ${analysis.risk_level === "high" ? "chip-danger" : "chip-neutral"}`}
        >
          {humanise(analysis.risk_level)} risk
        </span>
      </div>

      <dl className="kv">
        <dt>Audience</dt>
        <dd>{analysis.target_audience}</dd>

        <dt>Core claim</dt>
        <dd>{analysis.core_claim}</dd>

        <dt>Pillar</dt>
        <dd>{analysis.content_pillars.map(humanise).join(", ")}</dd>

        <dt>Reader stage</dt>
        <dd>{humanise(analysis.reader_stage)}</dd>

        <dt>Objective</dt>
        <dd>{humanise(analysis.primary_objective)}</dd>

        <dt>Psychology</dt>
        <dd>{humanise(analysis.primary_psychology)}</dd>

        <dt>Framework</dt>
        <dd>
          <span className="chip">{analysis.recommended_framework}</span>
        </dd>

        <dt>Why</dt>
        <dd className="muted">{analysis.framework_rationale}</dd>

        <dt>CTA</dt>
        <dd>{analysis.cta_type === "none" ? "None" : analysis.cta_type}</dd>
      </dl>

      {analysis.proof_missing.length > 0 && (
        <div className="notice notice-warn" style={{ marginTop: "1rem", marginBottom: 0 }}>
          <strong>Proof this post does not have.</strong> The engine will not invent
          these. Add them in the idea box if you have them.
          <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem" }}>
            {analysis.proof_missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {corrections.length > 0 && (
        <div className="notice notice-info" style={{ marginTop: "1rem", marginBottom: 0 }}>
          <strong>Adjusted by the integrity gates.</strong>
          <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem" }}>
            {corrections.map((correction) => (
              <li key={correction}>{correction}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
