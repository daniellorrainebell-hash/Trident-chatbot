/**
 * Static framework retrieval.
 *
 * Spec section 33 is explicit: do not place every framework document into every
 * prompt. The strategist selects framework IDs first, then only those definitions
 * are loaded.
 *
 * This is deliberately not a semantic search. Framework selection is a decision
 * with rules behind it, and resolving it by embedding similarity would make the
 * selection logic in frameworks/selection.ts unenforceable.
 */

import { resolveFrameworks } from "../frameworks/registry";
import type { FrameworkDefinition } from "../frameworks/types";
import type { IdeaAnalysis } from "../schemas/strategy";

export interface FrameworkRetrievalResult {
  frameworks: FrameworkDefinition[];
  unknownIds: string[];
}

export function retrieveFrameworksForPost(
  analysis: IdeaAnalysis,
  extraIds: readonly string[] = [],
): FrameworkRetrievalResult {
  const ids = [
    analysis.recommended_framework,
    ...analysis.recommended_hook_families,
    analysis.primary_psychology,
    ...analysis.secondary_psychology,
    ...extraIds,
  ].filter(Boolean);

  const { resolved, unknown } = resolveFrameworks([...new Set(ids)]);
  return { frameworks: resolved, unknownIds: unknown };
}
