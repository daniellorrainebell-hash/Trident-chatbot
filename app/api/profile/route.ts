/**
 * GET  /api/profile   identity, voice profile and offer
 * PUT  /api/profile   save any subset of them
 *
 * The engine's whole advantage over a blank prompt is what lives here.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "../../../src/store";
import { voiceProfileSchema } from "../../../src/schemas/voice";
import { offerSchema } from "../../../src/schemas/offer";
import { errorResponse, getCurrentUserId, parseBody } from "../../../src/lib/api";

export const runtime = "nodejs";

const identitySchema = z.object({
  bio: z.string().default(""),
  expertise: z.string().default(""),
  targetAudience: z.string().default(""),
  positioning: z.string().default(""),
  offers: z.string().default(""),
  goals: z.string().default(""),
  beliefs: z.array(z.string()).default([]),
  signOff: z.string().default(""),
});

const updateSchema = z.object({
  identity: identitySchema.optional(),
  voiceProfile: voiceProfileSchema.optional(),
  offer: offerSchema.nullable().optional(),
});

export async function GET(): Promise<NextResponse> {
  const store = getStore();
  const userId = getCurrentUserId();

  try {
    const [identity, voiceProfile, offer] = await Promise.all([
      store.loadIdentity(userId),
      store.loadVoiceProfile(userId),
      store.loadOffer(userId),
    ]);

    return NextResponse.json({ identity, voiceProfile, offer });
  } catch (error) {
    return errorResponse("Failed to load profile", error);
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  const parsed = await parseBody(request, updateSchema);
  if ("response" in parsed) return parsed.response;

  const store = getStore();
  const userId = getCurrentUserId();

  try {
    if (parsed.data.identity) await store.saveIdentity(userId, parsed.data.identity);
    if (parsed.data.voiceProfile) {
      await store.saveVoiceProfile(userId, parsed.data.voiceProfile);
    }
    if (parsed.data.offer !== undefined) {
      await store.saveOffer(userId, parsed.data.offer);
    }

    return NextResponse.json({ saved: true });
  } catch (error) {
    return errorResponse("Failed to save profile", error);
  }
}
