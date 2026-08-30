/**
 * GET /api/posts
 *
 * Post history, newest first.
 */

import { NextResponse } from "next/server";
import { getStore } from "../../../src/store";
import { errorResponse, getCurrentUserId } from "../../../src/lib/api";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    const posts = await getStore().listPosts(getCurrentUserId());
    return NextResponse.json({ posts });
  } catch (error) {
    return errorResponse("Failed to load posts", error);
  }
}
