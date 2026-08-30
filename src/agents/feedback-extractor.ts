/**
 * Feedback Extractor.
 *
 * Compares the AI draft with the user's edited version and extracts observable
 * editorial preferences.
 *
 * Spec section 30: the model may infer a short editorial summary from the change.
 * It must never store hidden chain-of-thought, only concise observable
 * preference summaries.
 *
 * Spec section 4.5 states the long-term objective: learn how this user decides
 * what good writing is, not merely what they have written before.
 */

import { generateStructured } from "../lib/responses";
import { FEEDBACK_EXTRACTOR_PROMPT } from "../prompts";
import {
  feedbackExtractionSchema,
  type FeedbackExtraction,
} from "../schemas/feedback";
import { mergeVoiceProfile, type VoiceProfile } from "../schemas/voice";

export interface FeedbackInput {
  aiDraft: string;
  userVersion: string;
  /** Optional explicit reason from the user. Never required. */
  userReason?: string;
  currentProfile: VoiceProfile;
}

export interface FeedbackResult {
  extraction: FeedbackExtraction;
  updatedProfile: VoiceProfile;
}

export async function runFeedbackExtractor({
  aiDraft,
  userVersion,
  userReason,
  currentProfile,
}: FeedbackInput): Promise<FeedbackResult> {
  if (aiDraft.trim() === userVersion.trim()) {
    return {
      extraction: {
        events: [
          {
            feedback_type: "approval",
            original_text: null,
            replacement_text: null,
            reason_summary: "The user approved the draft without edits.",
            tags: ["approved_unchanged"],
          },
        ],
        voice_profile_updates: {
          preferred_patterns: [],
          banned_patterns: [],
          banned_words: [],
          cta_preferences: [],
        },
        summary: "Approved without changes.",
      },
      updatedProfile: currentProfile,
    };
  }

  const input = [
    `# AI DRAFT\n${aiDraft}`,
    `# USER'S EDITED VERSION\n${userVersion}`,
    userReason ? `# REASON THE USER GAVE\n${userReason}` : "",
    "# TASK\nExtract the observable editorial preferences behind these changes. Return reusable tags and a one-sentence summary per change.",
  ].filter(Boolean);

  const extraction = await generateStructured({
    role: "fast",
    system: FEEDBACK_EXTRACTOR_PROMPT,
    input: input.join("\n\n"),
    schema: feedbackExtractionSchema,
    schemaName: "feedback_extraction",
  });

  return {
    extraction,
    updatedProfile: mergeVoiceProfile(currentProfile, extraction.voice_profile_updates),
  };
}
