/**
 * Outline builder boundary schema.
 *
 * The outline describes the post's movement. Section roles come from the selected
 * framework's structure, lower-cased and underscored, so the outline is checkable
 * against the framework the strategist chose.
 */

import { z } from "zod";

export const outlineSectionSchema = z.object({
  /** Stage role from the selected framework, e.g. "problem", "tension", "proof". */
  role: z.string(),
  /** What this section must accomplish. Intent, not copy. */
  purpose: z.string(),
  /** Facts, evidence or retrieved knowledge this section may use. */
  material: z.array(z.string()),
});

export const outlineSchema = z.object({
  hook: z.string(),
  framework: z.string(),
  /** The promise the hook created, restated so the writer can close it. */
  hook_promise: z.string(),
  sections: z.array(outlineSectionSchema).min(2),
  /** "none" is a valid CTA. */
  cta: z.string(),
});

export type Outline = z.infer<typeof outlineSchema>;
export type OutlineSection = z.infer<typeof outlineSectionSchema>;
