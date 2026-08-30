/**
 * User voice profile.
 *
 * Spec section 29 is explicit that the voice engine must not be a single prose
 * description. Structured preferences can be merged from feedback, queried and
 * diffed. A paragraph of prose cannot.
 */

import { z } from "zod";

export const voiceProfileSchema = z.object({
  language: z.string().default("UK English"),
  sentence_length: z
    .enum(["short", "short_to_medium", "medium", "varied"])
    .default("short_to_medium"),
  paragraph_density: z.enum(["low", "medium", "high"]).default("low"),
  directness: z.enum(["low", "medium", "high"]).default("high"),
  technical_depth: z
    .enum(["low", "medium", "high", "audience_dependent"])
    .default("audience_dependent"),
  humour: z.enum(["none", "occasional", "frequent"]).default("occasional"),
  profanity: z
    .enum(["never", "allowed_when_natural", "frequent"])
    .default("allowed_when_natural"),

  preferred_patterns: z.array(z.string()).default([]),
  banned_patterns: z.array(z.string()).default([]),
  banned_words: z.array(z.string()).default([]),
  cta_preferences: z.array(z.string()).default([]),
  format_preferences: z.array(z.string()).default([]),
  examples_positive: z.array(z.string()).default([]),
  examples_negative: z.array(z.string()).default([]),
});

export type VoiceProfile = z.infer<typeof voiceProfileSchema>;

export const DEFAULT_VOICE_PROFILE: VoiceProfile = voiceProfileSchema.parse({});

/**
 * Merge extracted preferences into a stored profile.
 *
 * Additive and de-duplicated. A preference expressed once is kept; a preference
 * expressed repeatedly simply appears earlier in retrieval ranking, which is
 * handled at retrieval rather than by weighting the list here.
 */
export function mergeVoiceProfile(
  current: VoiceProfile,
  updates: Partial<
    Pick<
      VoiceProfile,
      "preferred_patterns" | "banned_patterns" | "banned_words" | "cta_preferences"
    >
  >,
): VoiceProfile {
  const union = (a: string[], b: string[] | undefined): string[] => [
    ...new Set([...a, ...(b ?? [])].map((value) => value.trim()).filter(Boolean)),
  ];

  return {
    ...current,
    preferred_patterns: union(current.preferred_patterns, updates.preferred_patterns),
    banned_patterns: union(current.banned_patterns, updates.banned_patterns),
    banned_words: union(current.banned_words, updates.banned_words),
    cta_preferences: union(current.cta_preferences, updates.cta_preferences),
  };
}

/** Render the profile as prompt context. */
export function renderVoiceProfile(profile: VoiceProfile): string {
  const lines = [
    `Language: ${profile.language}`,
    `Sentence length: ${profile.sentence_length}`,
    `Paragraph density: ${profile.paragraph_density}`,
    `Directness: ${profile.directness}`,
    `Technical depth: ${profile.technical_depth}`,
    `Humour: ${profile.humour}`,
    `Profanity: ${profile.profanity}`,
  ];

  const list = (label: string, values: string[]): void => {
    if (values.length) {
      lines.push(`${label}:\n${values.map((v) => `  - ${v}`).join("\n")}`);
    }
  };

  list("Patterns this user prefers", profile.preferred_patterns);
  list("Patterns this user has rejected", profile.banned_patterns);
  list("Words this user has rejected", profile.banned_words);
  list("CTA preferences", profile.cta_preferences);
  list("Format preferences", profile.format_preferences);

  return lines.join("\n");
}
