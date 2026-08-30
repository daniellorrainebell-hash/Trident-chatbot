/**
 * GET /api/posts/[id]
 *
 * One post with its full version history. Every AI draft, revision and user edit
 * is kept, so the record of how a post got to its final form is readable.
 */

import { NextResponse } from "next/server";
import { getStore } from "../../../../src/store";
import { errorResponse, getCurrentUserId } from "../../../../src/lib/api";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const store = getStore();
  const userId = getCurrentUserId();

  try {
    const post = await store.getPost(userId, id);
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const versions = await store.getVersions(userId, id);
    return NextResponse.json({ post, versions });
  } catch (error) {
    return errorResponse("Failed to load post", error);
  }
}
