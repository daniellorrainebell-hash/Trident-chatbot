/**
 * Shared agent context.
 *
 * Every agent receives the same retrieved context object. What differs is which
 * parts each one is allowed to act on. Keeping one shape means a new retrieval
 * source becomes available to every stage at once.
 */

import type { Offer, VoiceProfile } from "../schemas";
import type { FrameworkDefinition } from "../frameworks/types";
import { renderFrameworksForPrompt } from "../frameworks/registry";

export interface RetrievedItem {
  id: string;
  /** Which namespace this came from. Spec section 32. */
  namespace: "frameworks" | "identity" | "writing" | "knowledge" | "performance";
  title: string;
  content: string;
  /** Cosine similarity, where the item came from semantic retrieval. */
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface PastPostSummary {
  id: string;
  topic: string;
  frameworkId: string;
  hookFamily: string;
  hook: string;
  contentPillar: string;
  ctaType: string;
  publishedAt?: string;
}

export interface GenerationContext {
  /** The user's raw idea, unedited. */
  idea: string;
  /** Rendered identity and positioning. Namespace B. */
  identity: string;
  voiceProfile: VoiceProfile;
  /** Retrieved knowledge, previous writing and feedback memory. */
  retrieved: RetrievedItem[];
  /** Recent posts, most recent first. Drives framework and hook variation. */
  recentPosts: PastPostSummary[];
  /** Editorial preferences retrieved from feedback memory. */
  feedbackPreferences: string[];
  /** Stored offer record. Gates guarantees, scarcity, urgency and tiers. */
  offer?: Offer | null;
  /** User overrides from the Strategy screen. */
  overrides?: {
    audience?: string;
    objective?: string;
    ctaType?: string;
    tone?: string;
    frameworkId?: string;
    hookFamilies?: string[];
    forceResearch?: boolean;
  };
}

/** Render retrieved items as prompt context, bounded so one source cannot dominate. */
export function renderRetrieved(
  items: readonly RetrievedItem[],
  maxPerNamespace = 4,
): string {
  if (items.length === 0) return "(no retrieved material)";

  const grouped = new Map<string, RetrievedItem[]>();
  for (const item of items) {
    const bucket = grouped.get(item.namespace) ?? [];
    if (bucket.length < maxPerNamespace) {
      bucket.push(item);
      grouped.set(item.namespace, bucket);
    }
  }

  return [...grouped.entries()]
    .map(([namespace, bucket]) => {
      const rendered = bucket
        .map((item) => `- ${item.title}\n  ${item.content.replace(/\s+/g, " ").slice(0, 600)}`)
        .join("\n");
      return `## ${namespace}\n${rendered}`;
    })
    .join("\n\n");
}

export function renderContextBlock(
  context: GenerationContext,
  frameworks: readonly FrameworkDefinition[] = [],
): string {
  const sections: string[] = [
    `# RAW IDEA\n${context.idea}`,
    `# USER IDENTITY AND POSITIONING\n${context.identity || "(not supplied)"}`,
  ];

  if (context.feedbackPreferences.length) {
    sections.push(
      `# EDITORIAL PREFERENCES LEARNED FROM THIS USER'S EDITS\n${context.feedbackPreferences
        .map((preference) => `- ${preference}`)
        .join("\n")}`,
    );
  }

  if (context.recentPosts.length) {
    sections.push(
      `# RECENT POSTS (for variation, not for reuse)\n${context.recentPosts
        .slice(0, 8)
        .map(
          (post) =>
            `- ${post.topic} | framework: ${post.frameworkId} | hook family: ${post.hookFamily} | pillar: ${post.contentPillar}`,
        )
        .join("\n")}\nDo not copy an old post because it is similar. Vary the structure and hook family where the idea allows.`,
    );
  }

  sections.push(`# RETRIEVED MATERIAL\n${renderRetrieved(context.retrieved)}`);

  if (frameworks.length) {
    sections.push(`# SELECTED FRAMEWORKS\n${renderFrameworksForPrompt(frameworks)}`);
  }

  if (context.offer) {
    sections.push(
      `# STORED OFFER RECORD\n${JSON.stringify(context.offer, null, 2)}\n` +
        "Only guarantees marked approved, and scarcity or urgency marked active with a verification date, may appear in copy.",
    );
  }

  if (context.overrides && Object.keys(context.overrides).length) {
    sections.push(
      `# USER OVERRIDES (these outrank your own selection)\n${JSON.stringify(
        context.overrides,
        null,
        2,
      )}`,
    );
  }

  return sections.join("\n\n");
}
