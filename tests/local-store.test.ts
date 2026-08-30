/**
 * Local store tests.
 *
 * This is the zero-setup persistence path, so it carries the learning loop for
 * anyone who has not stood up Supabase. The write queue and the preference
 * ranking are the two parts worth holding down.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalStore } from "../src/store/local-store";
import { DEFAULT_VOICE_PROFILE } from "../src/schemas/voice";
import type { FeedbackExtraction } from "../src/schemas/feedback";
import type { GeneratePostResult } from "../src/pipeline/generate-post";

const USER = "00000000-0000-0000-0000-000000000001";

let dir: string;
let store: LocalStore;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "nexus-store-"));
  store = new LocalStore(dir);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const runResult = (overrides: Partial<GeneratePostResult> = {}): GeneratePostResult =>
  ({
    state: "ready_for_review",
    analysis: {
      topic: "AI governance",
      core_claim: "Governance belongs before deployment.",
      target_audience: "AI agencies",
      reader_stage: "awareness",
      content_pillars: ["problem"],
      primary_objective: "authority",
      primary_psychology: "loss_aversion",
      secondary_psychology: [],
      signals: {} as never,
      recommended_framework: "c2c_post_formula",
      backup_frameworks: [],
      recommended_hook_families: ["statement"],
      framework_rationale: "The idea names a cost.",
      proof_available: [],
      proof_missing: [],
      research_required: false,
      research_questions: [],
      risk_level: "medium",
      cta_type: "none",
      tone_notes: [],
    },
    strategyCorrections: [],
    hooks: [],
    selectedHook: { text: "A hook.", hook_family: "statement", promise: "explain" },
    draft: "The draft body.",
    revisionCount: 0,
    unresolvedLintErrors: [],
    frameworkWarnings: [],
    ...overrides,
  }) as GeneratePostResult;

const extraction = (tags: string[], summary: string): FeedbackExtraction => ({
  events: [
    {
      feedback_type: "replacement",
      original_text: "before",
      replacement_text: "after",
      reason_summary: summary,
      tags,
    },
  ],
  voice_profile_updates: {
    preferred_patterns: [],
    banned_patterns: [],
    banned_words: [],
    cta_preferences: [],
  },
  summary,
});

describe("empty state", () => {
  it("returns defaults before anything is written", async () => {
    expect(await store.loadVoiceProfile(USER)).toEqual(DEFAULT_VOICE_PROFILE);
    expect(await store.listPosts(USER)).toEqual([]);
    expect(await store.feedbackPreferences(USER)).toEqual([]);
    expect((await store.loadIdentity(USER)).beliefs).toEqual([]);
    expect(await store.loadOffer(USER)).toBeNull();
  });

  it("reports that semantic retrieval is unavailable rather than faking it", async () => {
    expect(store.supportsSemanticRetrieval).toBe(false);
    expect(await store.similarPosts(USER, "an idea")).toEqual([]);
    expect(await store.searchKnowledge(USER, "a query")).toEqual([]);
  });
});

describe("posts and versions", () => {
  it("saves a run and its first version", async () => {
    const id = await store.savePostRun(USER, runResult());

    const post = await store.getPost(USER, id);
    expect(post?.topic).toBe("AI governance");
    expect(post?.draftText).toBe("The draft body.");

    const versions = await store.getVersions(USER, id);
    expect(versions).toHaveLength(1);
    expect(versions[0]?.source).toBe("ai_draft");
  });

  it("marks a run that already revised as a revision", async () => {
    const id = await store.savePostRun(USER, runResult({ revisionCount: 2 }));
    const versions = await store.getVersions(USER, id);
    expect(versions[0]?.source).toBe("ai_revision");
  });

  it("appends versions in order", async () => {
    const id = await store.savePostRun(USER, runResult());
    await store.appendVersion(USER, id, "second", "ai_revision");
    await store.appendVersion(USER, id, "third", "user_edit");

    const versions = await store.getVersions(USER, id);
    expect(versions.map((v) => v.versionNumber)).toEqual([1, 2, 3]);
    expect(versions[2]?.text).toBe("third");
  });

  it("lists posts newest first, even when written in the same millisecond", async () => {
    await store.savePostRun(USER, runResult({ analysis: { ...runResult().analysis, topic: "first" } }));
    await store.savePostRun(USER, runResult({ analysis: { ...runResult().analysis, topic: "second" } }));

    const posts = await store.listPosts(USER);
    expect(posts).toHaveLength(2);
    expect(posts[0]?.topic).toBe("second");
  });

  it("surfaces recent posts with the fields framework variation needs", async () => {
    await store.savePostRun(USER, runResult());
    const recent = await store.recentPosts(USER);

    expect(recent[0]?.frameworkId).toBe("c2c_post_formula");
    expect(recent[0]?.hookFamily).toBe("statement");
  });

  it("throws when updating a post that does not exist", async () => {
    await expect(store.updatePost(USER, "missing", { finalText: "x" })).rejects.toThrow(
      /Unknown post/,
    );
  });
});

describe("the learning loop", () => {
  it("stores a user edit as a version and updates the profile", async () => {
    const id = await store.savePostRun(USER, runResult());

    await store.saveFeedback(
      USER,
      id,
      "The version I actually kept.",
      extraction(["prefer_specificity"], "Replaced a generic line with a specific one."),
      { ...DEFAULT_VOICE_PROFILE, banned_words: ["leverage"] },
    );

    const versions = await store.getVersions(USER, id);
    expect(versions.at(-1)?.source).toBe("user_edit");
    expect(versions.at(-1)?.text).toBe("The version I actually kept.");

    const post = await store.getPost(USER, id);
    expect(post?.finalText).toBe("The version I actually kept.");

    expect((await store.loadVoiceProfile(USER)).banned_words).toEqual(["leverage"]);
  });

  it("ranks a repeated preference above a one-off correction", async () => {
    const id = await store.savePostRun(USER, runResult());

    // One-off, written first so recency favours the others.
    await store.saveFeedback(USER, id, "v", extraction(["one_off"], "A single correction."), DEFAULT_VOICE_PROFILE);

    for (let i = 0; i < 3; i += 1) {
      await store.saveFeedback(
        USER,
        id,
        "v",
        extraction(["prefer_specificity"], "Cut a generic line."),
        DEFAULT_VOICE_PROFILE,
      );
    }

    const preferences = await store.feedbackPreferences(USER);
    expect(preferences[0]).toBe("Cut a generic line.");
    expect(preferences).toContain("A single correction.");
  });

  it("de-duplicates identical preference summaries", async () => {
    const id = await store.savePostRun(USER, runResult());
    for (let i = 0; i < 4; i += 1) {
      await store.saveFeedback(USER, id, "v", extraction(["t"], "Same summary."), DEFAULT_VOICE_PROFILE);
    }

    const preferences = await store.feedbackPreferences(USER);
    expect(preferences.filter((p) => p === "Same summary.")).toHaveLength(1);
  });
});

describe("durability", () => {
  it("persists across store instances", async () => {
    await store.saveIdentity(USER, {
      bio: "b",
      expertise: "AI governance",
      targetAudience: "agencies",
      positioning: "p",
      offers: "o",
      goals: "g",
      beliefs: ["Templates cannot know your data flows."],
    });

    const reopened = new LocalStore(dir);
    const identity = await reopened.loadIdentity(USER);
    expect(identity.expertise).toBe("AI governance");
    expect(identity.beliefs).toHaveLength(1);
  });

  it("does not lose writes issued concurrently", async () => {
    const id = await store.savePostRun(USER, runResult());

    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        store.appendVersion(USER, id, `version ${i}`, "ai_revision"),
      ),
    );

    const versions = await store.getVersions(USER, id);
    // One from the initial run, plus all eight concurrent appends.
    expect(versions).toHaveLength(9);
    expect(new Set(versions.map((v) => v.versionNumber)).size).toBe(9);
  });
});
