/**
 * Deterministic framework selection.
 *
 * Spec section 25 and section 95 define explicit preference orders for six idea
 * shapes. Those are encoded here as pure, testable functions rather than left to
 * the strategist model to remember.
 *
 * The strategist receives this ranking as guidance and may override it with a
 * stated reason. What it may not do is select a framework this module has
 * blocked, because blocks encode integrity constraints: no fabricated personal
 * story, no unapproved guarantee, no invented tiers.
 *
 * Two failure conditions from spec section 64 shape the design:
 *   "Every post uses SLAY"      -> recency penalties, not just fit scores.
 *   "Every post sounds the same" -> deliberate variation when fit is close.
 */

import {
  HOOK_FAMILIES_REQUIRING_REAL_EXPERIENCE,
  OFFER_DATA_GATED_FRAMEWORKS,
} from "./registry";
import type { ContentPillarId } from "./c2c";

/**
 * Signals describing the shape of an idea.
 *
 * These are produced by the strategist's first pass over the raw idea and the
 * user's stored context. They are facts about the idea and the available
 * evidence, never preferences.
 */
export interface IdeaSignals {
  /** The user supplied a real event they experienced. Never inferred. */
  hasTruePersonalEvent: boolean;
  /** The idea names a problem with a real cost attached. */
  identifiesExpensiveProblem: boolean;
  /** The idea is a position the user genuinely holds. */
  isStrongOpinion: boolean;
  /** The idea teaches something the reader can apply. */
  isTacticalOrEducational: boolean;
  /** Real evidence is available: a result, build, screenshot, test or example. */
  isProofLed: boolean;
  /** The idea exists to sell or position an offer. */
  isDirectlyCommercial: boolean;

  /** The user genuinely felt the reaction the idea carries. */
  hasGenuineEmotionalReaction?: boolean;
  /** A genuinely common belief exists that the idea contradicts. */
  hasEvidencedCommonBelief?: boolean;
  /** A real, user-supplied figure for time, money or effort spent. */
  hasRealCostFigure?: boolean;

  /** Commercial gates, read from the stored offer record. */
  hasApprovedGuarantee?: boolean;
  hasTieredOffer?: boolean;
  hasVerifiedScarcityOrUrgency?: boolean;
  /** A single dominant objection blocks the sale. */
  hasDominantObjection?: boolean;

  /** Framework IDs used by the user's recent posts, most recent first. */
  recentFrameworkIds?: readonly string[];
  /** Hook family IDs used by the user's recent posts, most recent first. */
  recentHookFamilyIds?: readonly string[];
}

export interface BlockedFramework {
  id: string;
  reason: string;
}

export interface FrameworkRecommendation {
  /** Narrative frameworks, best fit first. */
  frameworkIds: string[];
  /** Hook families to generate from, best fit first. Two to four. */
  hookFamilyIds: string[];
  /** Psychology triggers, primary first. */
  psychologyIds: string[];
  /** Content pillars this idea serves. */
  pillarIds: ContentPillarId[];
  /** Frameworks excluded, with the integrity reason. */
  blocked: BlockedFramework[];
  /** Human-readable reasoning. Surfaced in the Advanced drawer. */
  rationale: string[];
}

/** How many recent posts count towards the repetition penalty. */
export const RECENCY_WINDOW = 5;

/** Score deducted for each appearance inside the recency window. */
const RECENCY_PENALTY = 1.5;

/** Frameworks that cannot be used without a user-supplied true personal event. */
const REQUIRES_REAL_EXPERIENCE = new Set<string>([
  "lara_slay",
  "story_opener",
  "hormozi_counter_intuition",
]);

type ScoreMap = Map<string, number>;

function add(scores: ScoreMap, id: string, points: number): void {
  scores.set(id, (scores.get(id) ?? 0) + points);
}

/**
 * Apply the repetition penalty from writing rule 65.
 *
 * Something used in each of the last five posts loses enough score to fall
 * behind a close alternative, without being removed outright. If it is still
 * the only structure that fits the idea, it still wins.
 */
function applyRecency(scores: ScoreMap, recent: readonly string[] | undefined): void {
  if (!recent?.length) return;
  const window = recent.slice(0, RECENCY_WINDOW);
  for (const id of window) {
    if (scores.has(id)) {
      add(scores, id, -RECENCY_PENALTY);
    }
  }
}

function ranked(scores: ScoreMap): string[] {
  return [...scores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => id);
}

/**
 * Rank narrative frameworks, hook families, psychology and pillars for an idea.
 *
 * Pure. No I/O, no model call. This is the function the framework-selection
 * tests exercise.
 */
export function recommendFrameworks(
  signals: IdeaSignals,
): FrameworkRecommendation {
  const frameworks: ScoreMap = new Map();
  const hooks: ScoreMap = new Map();
  const psychology: ScoreMap = new Map();
  const pillars = new Set<ContentPillarId>();
  const blocked: BlockedFramework[] = [];
  const rationale: string[] = [];

  // --- Spec 25.1: the idea contains a true personal event -------------------
  if (signals.hasTruePersonalEvent) {
    add(frameworks, "lara_slay", 5);
    add(frameworks, "c2c_content_engine", 3);
    add(frameworks, "c2c_post_formula", 2);
    add(hooks, "story_opener", 5);
    add(psychology, "information_gap", 2);
    pillars.add("behind_the_scenes");
    rationale.push(
      "The idea carries a real personal event, so story-led structures are available.",
    );
  } else {
    for (const id of REQUIRES_REAL_EXPERIENCE) {
      blocked.push({
        id,
        reason:
          "Requires a user-supplied true personal event. The engine never fabricates an anecdote to unlock a framework.",
      });
    }
  }

  // --- Spec 25.2: the idea identifies an expensive problem -------------------
  if (signals.identifiesExpensiveProblem) {
    add(frameworks, "c2c_post_formula", 5);
    add(frameworks, "c2c_content_engine", 4);
    add(hooks, "statement", 5);
    add(hooks, "conditional", 4);
    add(psychology, "loss_aversion", 5);
    pillars.add("problem");
    rationale.push(
      "The idea names a problem with a real cost, so loss aversion leads and the structure runs through tension to proof.",
    );
  }

  // --- Spec 25.3: the idea is a strong opinion -------------------------------
  if (signals.isStrongOpinion) {
    add(frameworks, "c2c_story_elements", 3);
    add(frameworks, "c2c_post_formula", 2);
    add(hooks, "statement", 4);
    add(psychology, "status_identity", 3);
    pillars.add("opinion");
    pillars.add("belief");
    rationale.push("The idea is a position the user holds, so it runs as an opinion or belief post.");

    if (signals.hasGenuineEmotionalReaction) {
      add(hooks, "exclamation", 4);
    } else {
      blocked.push({
        id: "exclamation",
        reason:
          "Requires a reaction the user genuinely had. The engine does not perform emotion it cannot source.",
      });
    }

    if (signals.hasEvidencedCommonBelief) {
      add(frameworks, "hormozi_unpopular_truth", 4);
      rationale.push(
        "A genuinely common belief exists to argue against, so the unpopular-truth shape is available.",
      );
    } else {
      blocked.push({
        id: "hormozi_unpopular_truth",
        reason:
          "Requires evidence that the opposing belief is genuinely common. Manufacturing a consensus to argue against is banned by writing rule 27.",
      });
    }
  } else if (!signals.hasGenuineEmotionalReaction) {
    blocked.push({
      id: "exclamation",
      reason: "Requires a genuine reaction from the user.",
    });
  }

  // --- Spec 25.4: the idea is tactical or educational ------------------------
  if (signals.isTacticalOrEducational) {
    add(frameworks, "psych_slay_variant", 4);
    add(frameworks, "c2c_post_formula", 3);
    add(hooks, "list", 4);
    add(hooks, "command", 3);
    add(psychology, "cognitive_fluency", 4);
    add(psychology, "reciprocity", 3);
    pillars.add("problem");
    rationale.push(
      "The idea teaches something applicable, so the value is the payload and the structure stays legible.",
    );
  }

  // --- Spec 25.5: the idea is proof-led --------------------------------------
  if (signals.isProofLed) {
    add(frameworks, "c2c_content_engine", 4);
    add(hooks, "story_opener", 3);
    add(psychology, "information_gap", 2);
    pillars.add("proof");
    rationale.push("Real evidence is available, so the post leads with proof rather than authority language.");

    if (signals.hasTruePersonalEvent) {
      add(frameworks, "lara_slay", 3);
    }
  }

  // --- Spec 25.6: the idea is directly commercial ----------------------------
  if (signals.isDirectlyCommercial) {
    add(hooks, "label", 5);
    add(hooks, "conditional", 4);
    add(psychology, "loss_aversion", 3);
    add(psychology, "choice_reduction", 5);
    pillars.add("conversion");
    rationale.push(
      "The idea is commercial, so it runs through offer diagnostics and ends on a single CTA.",
    );

    // Spec section 95: Hormozi selection logic for commercial content.
    add(frameworks, "hormozi_post_value_equation", 3);
    add(frameworks, "hormozi_post_outcome_vs_mechanism", 2);
    add(frameworks, "hormozi_post_time_effort_flip", 2);

    if (signals.hasDominantObjection) {
      add(frameworks, "hormozi_post_objection_collapse", 5);
      rationale.push(
        "One objection dominates, so the post collapses that objection by teaching rather than arguing.",
      );
    }

    if (signals.hasApprovedGuarantee) {
      add(frameworks, "hormozi_post_risk_reversal", 4);
    } else {
      blocked.push({
        id: "hormozi_post_risk_reversal",
        reason:
          "Requires a guarantee marked approved in the offer record. The engine never creates a guarantee on the business's behalf.",
      });
    }

    if (signals.hasTieredOffer) {
      add(frameworks, "hormozi_post_delivery_choice", 3);
    } else {
      blocked.push({
        id: "hormozi_post_delivery_choice",
        reason: "Requires delivery tiers present in the stored offer record.",
      });
    }

    if (!signals.hasVerifiedScarcityOrUrgency) {
      blocked.push({
        id: "hormozi_scarcity_urgency",
        reason:
          "Requires an active, verified scarcity or urgency record. Unverified constraints are manufactured pressure.",
      });
    }
  } else {
    // Spec section 96: do not force Hormozi frameworks where they do not fit.
    for (const id of OFFER_DATA_GATED_FRAMEWORKS) {
      if (!blocked.some((b) => b.id === id)) {
        blocked.push({
          id,
          reason: "The idea is not commercial. Offer frameworks are not forced onto non-commercial ideas.",
        });
      }
    }
  }

  // --- Fallback --------------------------------------------------------------
  // An idea that matched no shape still needs a structure. The general post
  // formula is the most broadly applicable framework in the library.
  if (frameworks.size === 0) {
    add(frameworks, "c2c_post_formula", 1);
    add(hooks, "statement", 1);
    add(psychology, "cognitive_fluency", 1);
    pillars.add("belief");
    rationale.push(
      "No strong shape signal was detected, so the idea falls back to the general post formula. Consider whether the idea needs sharpening before drafting.",
    );
  }

  // --- Integrity gates -------------------------------------------------------
  if (!signals.hasTruePersonalEvent) {
    for (const id of REQUIRES_REAL_EXPERIENCE) {
      frameworks.delete(id);
      hooks.delete(id);
    }
  }
  if (!signals.hasGenuineEmotionalReaction) {
    hooks.delete("exclamation");
  }
  if (!signals.hasEvidencedCommonBelief) {
    frameworks.delete("hormozi_unpopular_truth");
  }
  if (!signals.hasRealCostFigure) {
    frameworks.delete("hormozi_counter_intuition");
    hooks.delete("hormozi_counter_intuition");
    if (!blocked.some((b) => b.id === "hormozi_counter_intuition")) {
      blocked.push({
        id: "hormozi_counter_intuition",
        reason:
          "Requires a real, user-supplied figure for the time, money or effort spent. The engine never invents the cost that makes the pattern work.",
      });
    }
  }
  if (!signals.hasApprovedGuarantee) {
    frameworks.delete("hormozi_post_risk_reversal");
  }
  if (!signals.hasTieredOffer) {
    frameworks.delete("hormozi_post_delivery_choice");
  }
  for (const familyId of HOOK_FAMILIES_REQUIRING_REAL_EXPERIENCE) {
    if (familyId === "story_opener" && !signals.hasTruePersonalEvent) {
      hooks.delete(familyId);
    }
  }

  // --- Variation -------------------------------------------------------------
  applyRecency(frameworks, signals.recentFrameworkIds);
  applyRecency(hooks, signals.recentHookFamilyIds);

  const rankedFrameworks = ranked(frameworks);
  const rankedHooks = ranked(hooks);

  if (
    signals.recentHookFamilyIds?.length &&
    rankedHooks.length > 1 &&
    signals.recentHookFamilyIds.slice(0, RECENCY_WINDOW).includes(rankedHooks[0]!)
  ) {
    rationale.push(
      "The leading hook family has appeared in recent posts. Alternatives are ranked close behind so the hook engine can vary without leaving the idea's best fit.",
    );
  }

  return {
    // Guard against every candidate being penalised below zero by recency.
    frameworkIds: rankedFrameworks.length ? rankedFrameworks : ["c2c_post_formula"],
    // Spec section 27: select two to four hook families to generate from.
    hookFamilyIds: (rankedHooks.length ? rankedHooks : ["statement"]).slice(0, 4),
    psychologyIds: ranked(psychology),
    pillarIds: [...pillars],
    blocked,
    rationale,
  };
}

/** Is a framework permitted for this idea? Used to validate strategist overrides. */
export function isFrameworkPermitted(
  frameworkId: string,
  recommendation: FrameworkRecommendation,
): { permitted: boolean; reason?: string } {
  const block = recommendation.blocked.find((b) => b.id === frameworkId);
  if (block) return { permitted: false, reason: block.reason };
  return { permitted: true };
}
