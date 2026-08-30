"use client";

interface Finding {
  ruleId: string;
  severity: "error" | "warning";
  ruleRef: string;
  message: string;
  excerpt: string;
  suggestion?: string;
}

export interface LintResult {
  findings: Finding[];
  errors: Finding[];
  warnings: Finding[];
  passed: boolean;
}

/**
 * Writing rule findings.
 *
 * Errors are hard rule breaks. Warnings are heuristics that need a human call,
 * which is why they are shown rather than auto-applied: a factual list of three
 * items trips the rule-of-three check and is perfectly fine.
 */
export function LintPanel({ lint }: { lint: LintResult | null }) {
  if (!lint) return null;

  if (lint.findings.length === 0) {
    return (
      <div className="card">
        <div className="card-head">
          <h3>Writing rules</h3>
          <span className="spacer" />
          <span className="chip chip-good">Clean</span>
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          No violations found.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <h3>Writing rules</h3>
        <span className="spacer" />
        {lint.errors.length > 0 && (
          <span className="chip chip-danger">{lint.errors.length} to fix</span>
        )}
        {lint.warnings.length > 0 && (
          <span className="chip chip-warn">{lint.warnings.length} to check</span>
        )}
      </div>

      {lint.findings.map((finding, index) => (
        <div key={`${finding.ruleId}-${index}`} className={`finding ${finding.severity}`}>
          <span className="finding-excerpt">{finding.excerpt}</span>
          <div className="finding-msg">
            {finding.message}
            {finding.suggestion ? ` ${finding.suggestion}` : ""}
          </div>
          <div className="small muted" style={{ marginTop: "0.15rem" }}>
            {finding.ruleId} · rules section {finding.ruleRef}
          </div>
        </div>
      ))}
    </div>
  );
}
