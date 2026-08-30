/**
 * Framework registry and attribution tests.
 *
 * The attribution tests matter more than they look. The spec is explicit that the
 * Setup / Lead-In / Anticipation / Yield structure must not be attributed to Lara
 * Acosta, and an attribution error is exactly the kind of thing that survives a
 * refactor unnoticed.
 */

import { describe, expect, it } from "vitest";
import {
  ALL_FRAMEWORKS,
  getFramework,
  getHookFamilies,
  resolveFrameworks,
  renderFrameworksForPrompt,
} from "../src/frameworks/registry";
import { LARA_SLAY } from "../src/frameworks/lara-slay";
import { PSYCH_SLAY_VARIANT } from "../src/frameworks/psych-slay-variant";
import { NEXUS_HOOK_FAMILIES } from "../src/frameworks/nexus-hooks";

describe("registry integrity", () => {
  it("has unique IDs", () => {
    const ids = ALL_FRAMEWORKS.map((framework) => framework.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every framework a source and an app adaptation (spec section 110)", () => {
    for (const framework of ALL_FRAMEWORKS) {
      expect(framework.source, framework.id).toBeTruthy();
      expect(framework.sourceSummary, framework.id).toBeTruthy();
      expect(framework.appAdaptation, framework.id).toBeTruthy();
    }
  });

  it("records misuse risks for every framework", () => {
    for (const framework of ALL_FRAMEWORKS) {
      expect(framework.misuseRisks.length, framework.id).toBeGreaterThan(0);
    }
  });

  it("separates known IDs from unknown ones instead of throwing", () => {
    const { resolved, unknown } = resolveFrameworks(["lara_slay", "not_a_framework"]);
    expect(resolved.map((f) => f.id)).toEqual(["lara_slay"]);
    expect(unknown).toEqual(["not_a_framework"]);
  });
});

describe("SLAY attribution guard (spec section 6)", () => {
  it("keeps the two frameworks separate", () => {
    expect(LARA_SLAY.id).toBe("lara_slay");
    expect(PSYCH_SLAY_VARIANT.id).toBe("psych_slay_variant");
    expect(LARA_SLAY.structure).not.toEqual(PSYCH_SLAY_VARIANT.structure);
  });

  it("attributes Story, Lesson, Actionable Advice, You to Lara Acosta", () => {
    expect(LARA_SLAY.source).toBe("Lara Acosta");
    expect(LARA_SLAY.structure).toEqual([
      "S - Story",
      "L - Lesson",
      "A - Actionable Advice",
      "Y - You",
    ]);
  });

  it("never attributes the Setup variant to Lara Acosta", () => {
    expect(PSYCH_SLAY_VARIANT.source).not.toContain("Lara");
    expect(PSYCH_SLAY_VARIANT.appAdaptation).not.toContain("Lara Acosta");
    expect(PSYCH_SLAY_VARIANT.structure).toEqual([
      "S - Setup",
      "L - Lead-In",
      "A - Anticipation",
      "Y - Yield",
    ]);
  });

  it("states the attribution constraint in the variant's misuse risks", () => {
    expect(PSYCH_SLAY_VARIANT.misuseRisks.join(" ")).toContain("Lara Acosta");
    expect(PSYCH_SLAY_VARIANT.rules?.join(" ")).toContain("Never attribute");
  });
});

describe("Nexus hook library", () => {
  it("carries all seven hook types", () => {
    expect(NEXUS_HOOK_FAMILIES).toHaveLength(7);
    expect(NEXUS_HOOK_FAMILIES.map((family) => family.id)).toEqual([
      "statement",
      "label",
      "conditional",
      "command",
      "list",
      "story_opener",
      "exclamation",
    ]);
  });

  it("carries six source examples per family (42 in total)", () => {
    const total = NEXUS_HOOK_FAMILIES.reduce(
      (sum, family) => sum + family.examples.length,
      0,
    );
    expect(total).toBe(42);
    for (const family of NEXUS_HOOK_FAMILIES) {
      expect(family.examples.length, family.id).toBe(6);
    }
  });

  it("gives every family a formula and a purpose", () => {
    for (const family of getHookFamilies()) {
      expect(family.formula, family.id).toBeTruthy();
      expect(family.purpose, family.id).toBeTruthy();
    }
  });
});

describe("prompt rendering", () => {
  it("includes the adaptation and the hard rules but not the full example set", () => {
    const framework = getFramework("story_opener");
    expect(framework).toBeDefined();

    const rendered = renderFrameworksForPrompt([framework!]);
    expect(rendered).toContain("How this system uses it");
    expect(rendered).toContain("Never synthesise one");
    // Only the first three examples are rendered, to keep prompts small.
    expect(rendered).not.toContain("The phone rang for the seventh time");
  });

  it("handles an empty selection", () => {
    expect(renderFrameworksForPrompt([])).toBe("(no frameworks selected)");
  });
});
