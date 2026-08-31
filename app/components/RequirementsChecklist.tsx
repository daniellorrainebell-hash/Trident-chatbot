"use client";

import { REQUIREMENT_OPTIONS } from "../../src/schemas/requirements";
import { LINKEDIN_LIMIT, characterBudget } from "../../src/lib/compose";

/**
 * The pre-generation checklist.
 *
 * Not every post needs a CTA, an offer or a sign-off, so nothing is ticked by
 * default and an unticked box is an instruction rather than an absence: leaving
 * "end with a call to action" off tells the writer to end on substance.
 *
 * Two options are gated on something being saved first. Showing them disabled
 * with the reason is more useful than hiding them, because it says where to go.
 */
export function RequirementsChecklist({
  values,
  onToggle,
  hasSignOff,
  hasOffer,
  signOff,
}: {
  values: Record<string, boolean>;
  onToggle: (key: string) => void;
  hasSignOff: boolean;
  hasOffer: boolean;
  signOff: string;
}) {
  const available = (option: (typeof REQUIREMENT_OPTIONS)[number]): boolean => {
    if (option.requires === "signOff") return hasSignOff;
    if (option.requires === "offer") return hasOffer;
    return true;
  };

  const budget = characterBudget(values.includeSignOff ? signOff : null);

  return (
    <div className="checklist">
      <div className="checklist-head">
        <span className="section-label">Before writing</span>
        <span className="small muted">Tick what this post needs</span>
      </div>

      <div className="checklist-grid">
        {REQUIREMENT_OPTIONS.map((option) => {
          const enabled = available(option);
          const checked = Boolean(values[option.key]) && enabled;

          return (
            <label
              key={option.key}
              className={`check-item ${checked ? "checked" : ""} ${enabled ? "" : "unavailable"}`}
              title={
                enabled
                  ? option.hint
                  : option.requires === "signOff"
                    ? "Save a sign-off in Settings first."
                    : "Save an offer in Settings first."
              }
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!enabled}
                onChange={() => onToggle(option.key)}
              />
              <span className="check-item-body">
                <span className="check-item-label">{option.label}</span>
                <span className="check-item-hint">
                  {enabled
                    ? option.hint
                    : option.requires === "signOff"
                      ? "Save a sign-off in Settings first."
                      : "Save an offer in Settings first."}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {values.includeSignOff && hasSignOff && (
        <div className="signoff-preview">
          <div className="section-label" style={{ marginBottom: "0.4rem" }}>
            Appended, and counted in the limit
          </div>
          <pre className="signoff-text">{signOff}</pre>
          <span className="field-hint">
            {budget.signOffCost} characters, leaving {budget.bodyTarget.toLocaleString("en-GB")} for
            the post itself out of {LINKEDIN_LIMIT.toLocaleString("en-GB")}.
          </span>
        </div>
      )}
    </div>
  );
}
