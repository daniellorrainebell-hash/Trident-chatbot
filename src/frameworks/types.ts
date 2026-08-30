/**
 * Framework library types.
 *
 * Every framework is data, not prose baked into a system prompt. The strategist
 * selects framework IDs first, then only the selected definitions are loaded into
 * the writer's context. That keeps prompts small and keeps frameworks
 * independently editable (spec section 33, section 67).
 *
 * Each record separates what the source says from how this application adapts it
 * (spec section 110). Without that split the system eventually presents its own
 * adaptations as somebody else's source material.
 */

export type FrameworkCategory =
  /** A full hook family from the Nexus library: purpose, mechanism, formula, examples. */
  | "hook"
  /**
   * A structural hook shape borrowed from a named creator. Stored as a shape
   * only, with no formula or example set, because the mechanism is what carries
   * over and the wording is theirs.
   */
  | "hook_pattern"
  | "narrative"
  | "psychology"
  | "journey"
  | "pillar"
  | "commercial"
  | "quality";

export interface FrameworkDefinition {
  /** Stable internal ID. Referenced by the strategist and stored on posts. */
  id: string;
  name: string;
  category: FrameworkCategory;

  /** Attribution. "Nexus IQ" for original material. */
  source: string;
  /** Optional grouping within a source, e.g. "$100M Offers". */
  sourceFamily?: string;
  /** What the source itself establishes. */
  sourceSummary: string;
  /** How this application uses it. Nexus IQ interpretation, not source wording. */
  appAdaptation: string;

  /** Ordered stages, where the framework defines a structure. */
  structure?: string[];
  /** Where this framework genuinely fits. */
  bestFor: string[];
  /** Contexts in which the engine may apply it. */
  allowedUse: string[];
  /** Known failure modes. Surfaced to the critic. */
  misuseRisks: string[];
  /** Hard constraints the writer must honour when this framework is selected. */
  rules?: string[];

  active: boolean;
}

export type HookPurpose =
  | "Challenge"
  | "Identity"
  | "Qualify"
  | "Action"
  | "Structure"
  | "Tension"
  | "Emotion"
  | "Pattern";

export interface HookFamilyDefinition extends FrameworkDefinition {
  category: "hook";
  /** The single word describing what this hook does to the reader. */
  purpose: HookPurpose;
  /** How the hook works on the reader. */
  mechanism: string;
  /** The structural formula. Machinery, never shown to the reader. */
  formula: string;
  /** Source examples. Reference for shape, never for copying. */
  examples: string[];
}

export interface PsychologyTrigger extends FrameworkDefinition {
  category: "psychology";
  /** Concrete instructions for applying the trigger in copy. */
  application: string[];
  /** Hook families and frameworks this trigger tends to pair with. */
  pairsWith: string[];
}

export function isHookFamily(
  definition: FrameworkDefinition,
): definition is HookFamilyDefinition {
  return definition.category === "hook";
}

export function isPsychologyTrigger(
  definition: FrameworkDefinition,
): definition is PsychologyTrigger {
  return definition.category === "psychology";
}
