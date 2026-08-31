/**
 * Access gate tests.
 *
 * This is the only thing standing between a public URL and an endpoint that
 * spends money on every request, so its edges are worth pinning down.
 */

import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  isLocalHost,
  passkeyMatches,
  safeEqual,
  verifySessionToken,
  SESSION_DAYS,
} from "../src/lib/auth";

const SECRET = "a-long-enough-passkey";

describe("session tokens", () => {
  it("accepts a token it just issued", async () => {
    const token = await createSessionToken(SECRET);
    expect(await verifySessionToken(SECRET, token)).toBe(true);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createSessionToken(SECRET);
    expect(await verifySessionToken("a-different-passkey", token)).toBe(false);
  });

  it("rejects a tampered payload", async () => {
    const token = await createSessionToken(SECRET);
    const [payload, signature] = token.split(".");
    const forged = `${payload}x.${signature}`;
    expect(await verifySessionToken(SECRET, forged)).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const token = await createSessionToken(SECRET);
    const [payload, signature] = token.split(".");
    expect(await verifySessionToken(SECRET, `${payload}.${signature}x`)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const issued = Date.now();
    const token = await createSessionToken(SECRET, issued);
    const afterExpiry = issued + (SESSION_DAYS + 1) * 86_400_000;
    expect(await verifySessionToken(SECRET, token, afterExpiry)).toBe(false);
  });

  it("accepts a token that has not expired yet", async () => {
    const issued = Date.now();
    const token = await createSessionToken(SECRET, issued);
    const beforeExpiry = issued + (SESSION_DAYS - 1) * 86_400_000;
    expect(await verifySessionToken(SECRET, token, beforeExpiry)).toBe(true);
  });

  it("rejects missing and malformed tokens", async () => {
    expect(await verifySessionToken(SECRET, undefined)).toBe(false);
    expect(await verifySessionToken(SECRET, "")).toBe(false);
    expect(await verifySessionToken(SECRET, "nodot")).toBe(false);
    expect(await verifySessionToken(SECRET, ".onlysignature")).toBe(false);
  });

  it("rotating the passkey invalidates existing sessions", async () => {
    const token = await createSessionToken("old-passkey");
    expect(await verifySessionToken("new-passkey", token)).toBe(false);
  });
});

describe("passkey comparison", () => {
  it("matches an identical passkey", () => {
    expect(passkeyMatches("correct-horse", "correct-horse")).toBe(true);
  });

  it("rejects a wrong passkey", () => {
    expect(passkeyMatches("correct-horse", "correct-hors")).toBe(false);
    expect(passkeyMatches("correct-horse", "CORRECT-HORSE")).toBe(false);
  });

  it("never matches when no passkey is configured", () => {
    expect(passkeyMatches("", "")).toBe(false);
    expect(passkeyMatches("", "anything")).toBe(false);
  });

  it("compares in constant time regardless of length", () => {
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("abc", "abc")).toBe(true);
  });
});

describe("local host detection", () => {
  it("recognises local development hosts", () => {
    expect(isLocalHost("localhost:3000")).toBe(true);
    expect(isLocalHost("127.0.0.1:3000")).toBe(true);
    expect(isLocalHost("0.0.0.0:3000")).toBe(true);
  });

  it("treats every deployed host as remote", () => {
    expect(isLocalHost("socrates.nexus-iq.co.uk")).toBe(false);
    expect(isLocalHost("something.replit.app")).toBe(false);
    expect(isLocalHost(null)).toBe(false);
    // A host that merely contains "localhost" is not local.
    expect(isLocalHost("localhost.attacker.com")).toBe(false);
  });
});
