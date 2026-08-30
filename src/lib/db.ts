/**
 * Persistence helpers.
 *
 * Version history is append-only. Every draft, revision and user edit becomes a
 * row, and the accepted text is a pointer rather than the only copy
 * (non-negotiable rule 15).
 */

import { getServiceClient } from "./supabase";
import type { PostState } from "../pipeline/state-machine";
import { assertTransition } from "../pipeline/state-machine";
import type { GeneratePostResult } from "../pipeline/generate-post";
import type { FeedbackExtraction } from "../schemas/feedback";
import { voiceProfileSchema, type VoiceProfile } from "../schemas/voice";

export type VersionSource = "ai_draft" | "ai_revision" | "user_edit" | "final";

/** Persist a completed generation run. Returns the post ID. */
export async function savePostRun(
  userId: string,
  result: GeneratePostResult,
  ideaId?: string,
): Promise<string> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      idea_id: ideaId ?? null,
      topic: result.analysis.topic,
      content_pillar: result.analysis.content_pillars[0] ?? null,
      framework_id: result.analysis.recommended_framework,
      psychology_json: {
        primary: result.analysis.primary_psychology,
        secondary: result.analysis.secondary_psychology,
      },
      hook_family: result.selectedHook?.hook_family ?? null,
      selected_hook: result.selectedHook?.text ?? null,
      hook_candidates_json: result.hooks.map((ranked) => ({
        text: ranked.candidate.text,
        family: ranked.candidate.hook_family,
        score: ranked.weighted,
      })),
      outline_json: result.outline ?? null,
      draft_text: result.draft ?? null,
      status: result.state,
      research_required: result.analysis.research_required,
      research_json: result.research ?? null,
      critic_json: result.criticReport ?? null,
      lint_json: result.lint
        ? { errors: result.lint.errors, warnings: result.lint.warnings }
        : null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save post: ${error.message}`);

  const postId = data.id as string;

  if (result.draft) {
    await appendVersion(
      postId,
      result.draft,
      result.revisionCount > 0 ? "ai_revision" : "ai_draft",
    );
  }

  return postId;
}

/** Append a version. Version numbers are assigned server-side, sequentially. */
export async function appendVersion(
  postId: string,
  text: string,
  source: VersionSource,
): Promise<number> {
  const supabase = getServiceClient();

  const { data: latest, error: readError } = await supabase
    .from("post_versions")
    .select("version_number")
    .eq("post_id", postId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readError) throw new Error(`Failed to read version history: ${readError.message}`);

  const versionNumber = ((latest?.version_number as number | undefined) ?? 0) + 1;

  const { error } = await supabase.from("post_versions").insert({
    post_id: postId,
    version_number: versionNumber,
    text,
    source,
  });

  if (error) throw new Error(`Failed to append version: ${error.message}`);
  return versionNumber;
}

export async function updatePostState(
  postId: string,
  from: PostState,
  to: PostState,
): Promise<void> {
  assertTransition(from, to);

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("posts")
    .update({ status: to, updated_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) throw new Error(`Failed to update post state: ${error.message}`);
}

/**
 * Record a user edit and everything learned from it.
 *
 * This is the learning loop's write path (spec section 50): the user's version is
 * stored, each observable preference becomes a feedback event, and the voice
 * profile is updated so the next relevant post retrieves it.
 */
export async function saveFeedback(
  userId: string,
  postId: string,
  userVersion: string,
  extraction: FeedbackExtraction,
  updatedProfile: VoiceProfile,
): Promise<void> {
  const supabase = getServiceClient();

  await appendVersion(postId, userVersion, "user_edit");

  if (extraction.events.length) {
    const { error } = await supabase.from("feedback_events").insert(
      extraction.events.map((event) => ({
        user_id: userId,
        post_id: postId,
        feedback_type: event.feedback_type,
        original_text: event.original_text,
        replacement_text: event.replacement_text,
        reason_summary: event.reason_summary,
        tags_json: event.tags,
      })),
    );
    if (error) throw new Error(`Failed to save feedback events: ${error.message}`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      voice_profile_json: updatedProfile,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (profileError) {
    throw new Error(`Failed to update voice profile: ${profileError.message}`);
  }
}

export async function loadVoiceProfile(userId: string): Promise<VoiceProfile> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("voice_profile_json")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load voice profile: ${error.message}`);

  // An empty or partial stored profile parses to the defaults rather than
  // throwing, so a user who has not completed onboarding can still generate.
  return voiceProfileSchema.parse(data?.voice_profile_json ?? {});
}
