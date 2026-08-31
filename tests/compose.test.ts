/**
 * Composition and character budget tests.
 *
 * The sign-off is branding, so it has to come out byte-identical every time,
 * and the finished post has to clear LinkedIn's limit by arithmetic rather than
 * by a model's estimate. Both are pure functions, so both are pinned here.
 */

import { describe, expect, it } from "vitest";
import {
  LINKEDIN_LIMIT,
  SIGN_OFF_SEPARATOR,
  characterBudget,
  composePost,
  hasSignOff,
  renderBudgetInstruction,
} from "../src/lib/compose";
import {
  DEFAULT_REQUIREMENTS,
  REQUIREMENT_OPTIONS,
  postRequirementsSchema,
  renderRequirements,
} from "../src/schemas/requirements";

const SIGN_OFF = `For daily AI insights or to work with me at Nexus IQ/ Nexus Academy connect with the AI Architect.

Daniel - Nexus IQ - The AI Architect.`;

describe("the character budget", () => {
  it("gives the body the whole limit when there is no sign-off", () => {
    const budget = characterBudget(null);
    expect(budget.limit).toBe(LINKEDIN_LIMIT);
    expect(budget.signOffCost).toBe(0);
    expect(budget.bodyLimit).toBe(LINKEDIN_LIMIT);
  });

  it("charges the sign-off and its separator against the body", () => {
    const budget = characterBudget(SIGN_OFF);
    expect(budget.signOffCost).toBe(SIGN_OFF.length + SIGN_OFF_SEPARATOR.length);
    expect(budget.bodyLimit).toBe(LINKEDIN_LIMIT - budget.signOffCost);
  });

  it("leaves the writer headroom below the hard limit", () => {
    const budget = characterBudget(SIGN_OFF);
    expect(budget.bodyTarget).toBeLessThan(budget.bodyLimit);
  });

  it("ignores an empty or whitespace-only sign-off", () => {
    expect(characterBudget("   ").signOffCost).toBe(0);
    expect(characterBudget(undefined).signOffCost).toBe(0);
  });

  it("tells the writer not to write the sign-off itself", () => {
    const instruction = renderBudgetInstruction(characterBudget(SIGN_OFF));
    expect(instruction).toContain("Do not write it yourself");
  });

  it("says nothing about a sign-off when there is none", () => {
    const instruction = renderBudgetInstruction(characterBudget(null));
    expect(instruction).not.toContain("sign-off");
  });
});

describe("composing the post", () => {
  it("returns the body unchanged when no sign-off applies", () => {
    const composed = composePost("The body of the post.", null);
    expect(composed.text).toBe("The body of the post.");
    expect(composed.signOff).toBeNull();
  });

  it("appends the sign-off after a blank line", () => {
    const composed = composePost("The body.", SIGN_OFF);
    expect(composed.text).toBe(`The body.${SIGN_OFF_SEPARATOR}${SIGN_OFF}`);
    expect(composed.signOff).toBe(SIGN_OFF);
  });

  it("reproduces the sign-off byte for byte", () => {
    const composed = composePost("The body.", SIGN_OFF);
    expect(composed.text.endsWith(SIGN_OFF)).toBe(true);
  });

  it("normalises trailing whitespace before appending", () => {
    const composed = composePost("The body.\n\n\n   ", SIGN_OFF);
    expect(composed.text).toBe(`The body.${SIGN_OFF_SEPARATOR}${SIGN_OFF}`);
  });

  it("does not append the sign-off twice", () => {
    const once = composePost("The body.", SIGN_OFF);
    const twice = composePost(once.text, SIGN_OFF);
    expect(twice.text).toBe(once.text);
  });

  it("does not double-append after the user reflows the sign-off", () => {
    // The user edits by hand, so the stored sign-off and the one in the draft
    // can differ by whitespace and must still count as the same sign-off.
    const reflowed = `The body.\n\n${SIGN_OFF.replace(/\n\n/g, "\n")}`;
    const composed = composePost(reflowed, SIGN_OFF);
    const signature = /Daniel - Nexus IQ - The AI Architect\./g;
    expect(composed.text.match(signature)).toHaveLength(1);
  });

  it("counts the length of the finished post, not the body", () => {
    const body = "x".repeat(100);
    const composed = composePost(body, SIGN_OFF);
    expect(composed.length).toBe(100 + SIGN_OFF_SEPARATOR.length + SIGN_OFF.length);
  });
});

describe("the limit", () => {
  it("passes a post that fits", () => {
    const budget = characterBudget(SIGN_OFF);
    const composed = composePost("x".repeat(budget.bodyTarget), SIGN_OFF);
    expect(composed.withinLimit).toBe(true);
    expect(composed.overBy).toBe(0);
    expect(composed.length).toBeLessThanOrEqual(LINKEDIN_LIMIT);
  });

  it("catches a body that only fits without the sign-off", () => {
    // Exactly at the limit alone, so the sign-off is what pushes it over.
    const composed = composePost("x".repeat(LINKEDIN_LIMIT), SIGN_OFF);
    expect(composed.withinLimit).toBe(false);
    expect(composed.overBy).toBe(SIGN_OFF_SEPARATOR.length + SIGN_OFF.length);
  });

  it("reports exactly how far over it is", () => {
    const composed = composePost("x".repeat(LINKEDIN_LIMIT + 25), null);
    expect(composed.overBy).toBe(25);
  });

  it("accepts a post sitting exactly on the limit", () => {
    const composed = composePost("x".repeat(LINKEDIN_LIMIT), null);
    expect(composed.withinLimit).toBe(true);
    expect(composed.overBy).toBe(0);
  });
});

describe("sign-off detection", () => {
  it("recognises the sign-off at the end", () => {
    expect(hasSignOff(`Body.\n\n${SIGN_OFF}`, SIGN_OFF)).toBe(true);
  });

  it("ignores whitespace differences", () => {
    expect(hasSignOff(`Body.\n${SIGN_OFF.replace(/\n+/g, " ")}`, SIGN_OFF)).toBe(true);
  });

  it("does not match when the sign-off is only mentioned mid-post", () => {
    expect(hasSignOff(`${SIGN_OFF}\n\nAnd then more body text follows.`, SIGN_OFF)).toBe(false);
  });

  it("never matches an empty sign-off", () => {
    expect(hasSignOff("Any body at all.", "")).toBe(false);
  });
});

describe("the requirements checklist", () => {
  it("defaults every box to unticked", () => {
    for (const [key, value] of Object.entries(DEFAULT_REQUIREMENTS)) {
      expect(value, key).toBe(false);
    }
  });

  it("lists every schema field as an option", () => {
    const keys = Object.keys(postRequirementsSchema.shape).sort();
    expect(REQUIREMENT_OPTIONS.map((option) => option.key).sort()).toEqual(keys);
  });

  it("tells the writer plainly when there is to be no CTA", () => {
    const rendered = renderRequirements(DEFAULT_REQUIREMENTS);
    expect(rendered).toContain("No call to action");
    expect(rendered).toContain("End on substance");
  });

  it("forbids implying experience when no story is available", () => {
    const rendered = renderRequirements(DEFAULT_REQUIREMENTS);
    expect(rendered).toContain("Do not write one");
  });

  it("uses the story when the author says they have one", () => {
    const rendered = renderRequirements({ ...DEFAULT_REQUIREMENTS, hasPersonalStory: true });
    expect(rendered).toContain("real personal event");
    expect(rendered).toContain("invent nothing");
  });

  it("stops the writer signing off when a sign-off will be appended", () => {
    const rendered = renderRequirements(
      { ...DEFAULT_REQUIREMENTS, includeSignOff: true },
      { signOff: SIGN_OFF },
    );
    expect(rendered).toContain("Do not write it");
  });

  it("refuses to invent an offer that is not stored", () => {
    const rendered = renderRequirements(
      { ...DEFAULT_REQUIREMENTS, includeOffer: true },
      { hasOffer: false },
    );
    expect(rendered).toContain("Do not invent one");
  });

  it("marks which options need something saved first", () => {
    const gated = REQUIREMENT_OPTIONS.filter((option) => option.requires);
    expect(gated.map((option) => option.key).sort()).toEqual(["includeOffer", "includeSignOff"]);
  });
});
