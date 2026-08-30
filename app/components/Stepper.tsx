"use client";

import { Fragment } from "react";

export type StepId = "idea" | "strategy" | "hook" | "draft";

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: "idea", label: "Idea" },
  { id: "strategy", label: "Strategy" },
  { id: "hook", label: "Hook" },
  { id: "draft", label: "Draft" },
];

export function Stepper({ current }: { current: StepId }) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <div className="stepper" aria-label="Progress">
      {STEPS.map((step, index) => (
        <Fragment key={step.id}>
          {index > 0 && <span className="step-sep" aria-hidden />}
          <span
            className={`step ${index < currentIndex ? "done" : ""} ${
              index === currentIndex ? "active" : ""
            }`}
            aria-current={index === currentIndex ? "step" : undefined}
          >
            <span className="step-dot">{index < currentIndex ? "✓" : index + 1}</span>
            {step.label}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
