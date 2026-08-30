/**
 * Framework registry.
 *
 * One lookup surface over every framework in the library. The strategist emits
 * framework IDs; the retriever resolves them here and loads only those
 * definitions into the writer's context (spec section 33).
 *
 * Adding a framework means adding a data record. No agent prompt changes.
 */

import {
  NEXUS_HOOK_FAMILIES,
  HOOK_FAMILIES_REQUIRING_REAL_EXPERIENCE,
  HOOK_ENGINE_PRINCIPLES,
} from "./nexus-hooks";
import {
  PSYCHOLOGY_TRIGGERS,
  HORMOZI_HOOK_PATTERNS,
} from "./psychology";
import { LARA_SLAY } from "./lara-slay";
import { PSYCH_SLAY_VARIANT } from "./psych-slay-variant";
import { C2C_FRAMEWORKS, C2C_CONTENT_PILLARS } from "./c2c";
import { HORMOZI_FRAMEWORKS, OFFER_DATA_GATED_FRAMEWORKS } from "./hormozi";
import type {
  FrameworkCategory,
  FrameworkDefinition,
  HookFamilyDefinition,
  PsychologyTrigger,
} from "./types";
import { isHookFamily, isPsychologyTrigger } from "./types";

export const ALL_FRAMEWORKS: FrameworkDefinition[] = [
  ...NEXUS_HOOK_FAMILIES,
  ...HORMOZI_HOOK_PATTERNS,
  ...PSYCHOLOGY_TRIGGERS,
  LARA_SLAY,
  PSYCH_SLAY_VARIANT,
  ...C2C_FRAMEWORKS,
  ...HORMOZI_FRAMEWORKS,
];

const BY_ID = new Map<string, FrameworkDefinition>(
  ALL_FRAMEWORKS.map((framework) => [framework.id, framework]),
);

if (BY_ID.size !== ALL_FRAMEWORKS.length) {
  const seen = new Set<string>();
  const duplicates = ALL_FRAMEWORKS.map((f) => f.id).filter((id) => {
    if (seen.has(id)) return true;
    seen.add(id);
    return false;
  });
  throw new Error(
    `Duplicate framework IDs in the registry: ${[...new Set(duplicates)].join(", ")}`,
  );
}

export function getFramework(id: string): FrameworkDefinition | undefined {
  return BY_ID.get(id);
}

/**
 * Resolve a list of IDs, ignoring unknown ones.
 *
 * A model can emit an ID that does not exist. That is a retrieval miss rather
 * than a crash, so unknown IDs are returned separately for logging.
 */
export function resolveFrameworks(ids: readonly string[]): {
  resolved: FrameworkDefinition[];
  unknown: string[];
} {
  const resolved: FrameworkDefinition[] = [];
  const unknown: string[] = [];

  for (const id of ids) {
    const framework = BY_ID.get(id);
    if (framework && framework.active) {
      resolved.push(framework);
    } else {
      unknown.push(id);
    }
  }

  return { resolved, unknown };
}

export function getFrameworksByCategory(
  category: FrameworkCategory,
): FrameworkDefinition[] {
  return ALL_FRAMEWORKS.filter(
    (framework) => framework.category === category && framework.active,
  );
}

export function getHookFamilies(): HookFamilyDefinition[] {
  return ALL_FRAMEWORKS.filter(isHookFamily).filter((f) => f.active);
}

export function getHookFamily(id: string): HookFamilyDefinition | undefined {
  const framework = BY_ID.get(id);
  return framework && isHookFamily(framework) ? framework : undefined;
}

export function getPsychologyTriggers(): PsychologyTrigger[] {
  return ALL_FRAMEWORKS.filter(isPsychologyTrigger).filter((f) => f.active);
}

export function getNarrativeFrameworks(): FrameworkDefinition[] {
  return getFrameworksByCategory("narrative");
}

export const ALL_FRAMEWORK_IDS: string[] = ALL_FRAMEWORKS.map((f) => f.id);

export const CONTENT_PILLAR_IDS = C2C_CONTENT_PILLARS.map((p) => p.id);

export {
  HOOK_FAMILIES_REQUIRING_REAL_EXPERIENCE,
  HOOK_ENGINE_PRINCIPLES,
  OFFER_DATA_GATED_FRAMEWORKS,
  C2C_CONTENT_PILLARS,
};

/**
 * Render selected frameworks as prompt context.
 *
 * Deliberately compact. The writer needs the structure, the adaptation and the
 * hard rules, not the full record with every source example.
 */
export function renderFrameworksForPrompt(
  frameworks: readonly FrameworkDefinition[],
): string {
  if (frameworks.length === 0) return "(no frameworks selected)";

  return frameworks
    .map((framework) => {
      const lines: string[] = [
        `### ${framework.name} (id: ${framework.id})`,
        `Source: ${framework.source}${framework.sourceFamily ? `, ${framework.sourceFamily}` : ""}`,
        `What the source establishes: ${framework.sourceSummary}`,
        `How this system uses it: ${framework.appAdaptation}`,
      ];

      if (framework.structure?.length) {
        lines.push(`Structure: ${framework.structure.join(" > ")}`);
      }
      if (framework.rules?.length) {
        lines.push(
          `Hard rules:\n${framework.rules.map((r) => `  - ${r}`).join("\n")}`,
        );
      }
      if (framework.misuseRisks.length) {
        lines.push(
          `Known failure modes:\n${framework.misuseRisks.map((r) => `  - ${r}`).join("\n")}`,
        );
      }
      if (isHookFamily(framework)) {
        lines.push(`Formula: ${framework.formula}`);
        lines.push(
          `Shape reference (never copy this wording):\n${framework.examples
            .slice(0, 3)
            .map((e) => `  - ${e}`)
            .join("\n")}`,
        );
      }

      return lines.join("\n");
    })
    .join("\n\n");
}
