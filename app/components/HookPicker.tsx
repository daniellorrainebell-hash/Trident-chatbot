"use client";

export interface RankedHook {
  candidate: { text: string; hook_family: string; promise: string };
  weighted: number;
}

/**
 * The hook screen.
 *
 * Scores are shown because they are comparative, not absolute: the useful signal
 * is that one hook beat another, and why.
 */
export function HookPicker({
  hooks,
  selected,
  onSelect,
  disabled,
}: {
  hooks: RankedHook[];
  selected: string | null;
  onSelect: (hook: RankedHook) => void;
  disabled: boolean;
}) {
  return (
    <div className="card">
      <div className="card-head">
        <h3>Pick the opening</h3>
        <span className="spacer" />
        <span className="chip chip-neutral">{hooks.length} strongest</span>
      </div>

      <div className="stack-tight">
        {hooks.map((hook) => (
          <button
            key={hook.candidate.text}
            type="button"
            className={`hook ${selected === hook.candidate.text ? "selected" : ""}`}
            onClick={() => onSelect(hook)}
            disabled={disabled}
          >
            <div className="hook-text">{hook.candidate.text}</div>
            <div className="hook-meta">
              <span className="chip chip-neutral">{hook.candidate.hook_family}</span>
              <span className="score">{hook.weighted.toFixed(1)}</span>
              <span className="score-bar">
                <span
                  className="score-fill"
                  style={{ width: `${Math.max(0, Math.min(100, hook.weighted * 10))}%` }}
                />
              </span>
            </div>
            <div className="hook-promise">Promises: {hook.candidate.promise}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
