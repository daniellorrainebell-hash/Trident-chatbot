"use client";

interface Scored {
  score: number;
  reason: string;
}

interface Detected {
  detected: boolean;
  severity: "none" | "low" | "medium" | "high";
  reason: string;
}

export interface DistributionResult {
  check: {
    professional_relevance: Scored;
    topic_clarity: Scored;
    out_of_network_context: Scored;
    originality: Scored;
    useful_insight: Scored;
    dwell_quality: Scored;
    engagement_bait: Detected;
    generic_recycled: Detected;
    promotion_only: Detected;
    unconstructive_risk: Detected;
    profanity: { detected: boolean; broad_recommendation_tradeoff: boolean; reason: string };
    unsupported_algorithm_hack: { detected: boolean; details: string[] };
    implementation_inference_notes: string[];
    status: "PASS" | "PASS_WITH_TRADEOFF" | "REVISE" | "BLOCK_PLATFORM_RISK";
    revision_actions: string[];
    summary: string;
  };
  score: number;
}

const STATUS: Record<
  DistributionResult["check"]["status"],
  { label: string; chip: string }
> = {
  PASS: { label: "Pass", chip: "chip-good" },
  PASS_WITH_TRADEOFF: { label: "Trade-off accepted", chip: "chip" },
  REVISE: { label: "Revise", chip: "chip-warn" },
  BLOCK_PLATFORM_RISK: { label: "Platform risk", chip: "chip-danger" },
};

const DIMENSIONS: Array<[keyof DistributionResult["check"], string]> = [
  ["professional_relevance", "Professional relevance"],
  ["topic_clarity", "Topic clarity"],
  ["out_of_network_context", "Stranger context"],
  ["originality", "Originality"],
  ["useful_insight", "Useful insight"],
  ["dwell_quality", "Read-through"],
];

/**
 * The distribution check.
 *
 * The score is labelled as ours throughout. LinkedIn publishes no creator-facing
 * quality formula, so presenting this as a prediction of their ranking would be
 * inventing a number.
 */
export function DistributionPanel({ result }: { result: DistributionResult | null }) {
  if (!result) return null;

  const { check, score } = result;
  const status = STATUS[check.status];

  const negatives = (
    [
      ["Engagement bait", check.engagement_bait],
      ["Generic or recycled", check.generic_recycled],
      ["Promotion only", check.promotion_only],
      ["Unconstructive tone", check.unconstructive_risk],
    ] as Array<[string, Detected]>
  ).filter(([, entry]) => entry.detected);

  return (
    <div className="card">
      <div className="card-head">
        <h3>Distribution</h3>
        <span className="spacer" />
        <span className={`chip ${status.chip}`}>{status.label}</span>
      </div>

      <div className="dist-score">
        <span className="dist-score-value tnum">{score.toFixed(1)}</span>
        <span className="dist-score-label">
          Nexus Distribution Score
          <span className="dist-score-note">Our score, not LinkedIn&rsquo;s ranking.</span>
        </span>
      </div>

      {check.summary && <p className="small muted">{check.summary}</p>}

      <div className="dist-dims">
        {DIMENSIONS.map(([key, label]) => {
          const dimension = check[key] as Scored;
          return (
            <div className="dist-dim" key={key} title={dimension.reason}>
              <span className="dist-dim-label">{label}</span>
              <span className="score-bar">
                <span
                  className="score-fill"
                  style={{ width: `${Math.max(0, Math.min(100, dimension.score * 10))}%` }}
                />
              </span>
              <span className="score tnum">{dimension.score}</span>
            </div>
          );
        })}
      </div>

      {negatives.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: "1.1rem", marginBottom: "0.5rem" }}>
            Confirmed risks
          </div>
          {negatives.map(([label, entry]) => (
            <div key={label} className="finding warning">
              <div className="finding-msg" style={{ marginTop: 0 }}>
                <strong>{label}</strong> ({entry.severity}). {entry.reason}
              </div>
            </div>
          ))}
        </>
      )}

      {check.unsupported_algorithm_hack.detected && (
        <div className="notice notice-error" style={{ marginTop: "1rem" }}>
          <strong>Unsupported platform claim.</strong>
          <ul>
            {check.unsupported_algorithm_hack.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>
      )}

      {check.profanity.detected && check.profanity.broad_recommendation_tradeoff && (
        <div className="notice notice-warn" style={{ marginTop: "1rem" }}>
          <strong>Profanity trade-off.</strong> {check.profanity.reason}
        </div>
      )}

      {check.revision_actions.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: "1.1rem", marginBottom: "0.5rem" }}>
            Suggested changes
          </div>
          <ul className="dist-actions">
            {check.revision_actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </>
      )}

      {check.implementation_inference_notes.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: "1.1rem", marginBottom: "0.5rem" }}>
            Our judgement, not LinkedIn&rsquo;s rules
          </div>
          <ul className="dist-actions muted">
            {check.implementation_inference_notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
