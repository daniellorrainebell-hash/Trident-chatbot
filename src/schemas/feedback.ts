/**
 * Feedback extractor boundary schema.
 *
 * Spec section 30 and section 58. The system compares the AI draft with the
 * user's edited version and extracts observable editorial preferences.
 *
 * It must not infer private psychology or hidden motivations, and it must never
 * store chain-of-thought. Only concise observable preference summaries.
 */

import { z } from "zod";

export const feedbackTypeSchema = z.enum([
  "replacement",
  "deletion",
  "addition",
  "reordering",
  "tone_shift",
  "cta_change",
  "approval",
  "rejection",
]);

export const feedbackEventSchema = z.object({
  feedback_type: feedbackTypeSchema,
  original_text: z.string().nullable(),
  replacement_text: z.string().nullable(),
  /** One sentence describing the observable editorial preference. */
  reason_summary: z.string(),
  /** Reusable tags retrieved on similar future posts. */
  tags: z.array(z.string()),
});

export const feedbackExtractionSchema = z.object({
  events: z.array(feedbackEventSchema),
  /**
   * Durable preferences to merge into the voice profile.
   * Only include a preference visible in the edit itself.
   */
  voice_profile_updates: z.object({
    preferred_patterns: z.array(z.string()),
    banned_patterns: z.array(z.string()),
    banned_words: z.array(z.string()),
    cta_preferences: z.array(z.string()),
  }),
  /** One sentence covering the whole edit. */
  summary: z.string(),
});

export type FeedbackEvent = z.infer<typeof feedbackEventSchema>;
export type FeedbackExtraction = z.infer<typeof feedbackExtractionSchema>;
