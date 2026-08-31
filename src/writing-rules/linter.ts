/**
 * Deterministic pre-publish linter.
 *
 * Writing rules section 115 asks for a deterministic text linter that runs
 * before the final draft is shown. This is that linter.
 *
 * It runs after the writer and again after the revision writer. Errors block the
 * draft from being returned as final; warnings are passed to the critic, which
 * decides whether each one is a genuine violation or a false positive on
 * legitimate copy.
 *
 * The linter is deliberately conservative about structural heuristics. Rule 120
 * is explicit that rule-of-three detection is heuristic and that factual lists of
 * exactly three items must not be flagged, so those checks emit warnings only.
 */

import { detectAlgorithmFolklore } from "../frameworks/linkedin-distribution";
import {
  OPENING_WINDOW,
  PHRASE_RULES,
  REGEX_RULES,
  AMERICANISMS,
  type LintSeverity,
  type PhraseRule,
  type RegexRule,
} from "./rules";

export interface LintOptions {
  /** Rule IDs the user has explicitly switched off for this post. */
  disabledRuleIds?: readonly string[];
  /**
   * Terms allowed despite matching an allowlistable rule, for literal factual
   * use. Example: a post genuinely about audio noise.
   */
  allowedTerms?: readonly string[];
  permitHashtags?: boolean;
  permitEmoji?: boolean;
  permitEngagementCta?: boolean;
  /** Only true when an active, verified scarcity or urgency record exists. */
  verifiedScarcityOrUrgency?: boolean;
  isCarouselCopy?: boolean;
  /** True when the post is genuinely about the framework being named. */
  subjectIsTheFramework?: boolean;
  /** Set when the day is factual rather than illustrative (rule 46). */
  dayReferencesAreFactual?: boolean;
}

export interface LintFinding {
  ruleId: string;
  severity: LintSeverity;
  /** Section reference in the writing rules document. */
  ruleRef: string;
  message: string;
  /** The offending text. */
  excerpt: string;
  /** Character offset in the linted text. */
  index: number;
  suggestion?: string;
}

export interface LintResult {
  findings: LintFinding[];
  errors: LintFinding[];
  warnings: LintFinding[];
  /** True when no errors were found. Warnings do not block. */
  passed: boolean;
}

/** Normalise typographic characters so phrase matching is reliable. */
function normalise(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a case-insensitive matcher for a phrase.
 *
 * Word boundaries are applied only where the phrase starts and ends with a word
 * character, so phrases containing punctuation ("spoiler:", "agree?") still match.
 */
function phrasePattern(phrase: string): RegExp {
  const escaped = escapeRegex(phrase);
  const leading = /^\w/.test(phrase) ? "\\b" : "";
  const trailing = /\w$/.test(phrase) ? "\\b" : "";
  return new RegExp(`${leading}${escaped}${trailing}`, "gi");
}

function optionEnabled(
  option: PhraseRule["requiresOption"],
  options: LintOptions,
): boolean {
  if (!option) return false;
  return Boolean(options[option]);
}

function isAllowlisted(
  matched: string,
  rule: PhraseRule,
  options: LintOptions,
): boolean {
  if (!rule.allowlistable) return false;
  const allowed = options.allowedTerms ?? [];
  return allowed.some(
    (term) => term.toLowerCase() === matched.toLowerCase(),
  );
}

function runPhraseRule(
  rule: PhraseRule,
  text: string,
  options: LintOptions,
): LintFinding[] {
  if (options.disabledRuleIds?.includes(rule.id)) return [];
  if (optionEnabled(rule.requiresOption, options)) return [];

  const haystack =
    rule.scope === "opening" ? text.slice(0, OPENING_WINDOW) : text;
  const findings: LintFinding[] = [];

  for (const phrase of rule.phrases) {
    const pattern = phrasePattern(phrase);
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(haystack)) !== null) {
      if (isAllowlisted(match[0], rule, options)) continue;
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        ruleRef: rule.ruleRef,
        message: rule.message,
        excerpt: match[0],
        index: match.index,
        ...(rule.suggestion ? { suggestion: rule.suggestion } : {}),
      });
      if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
    }
  }

  return findings;
}

function runRegexRule(
  rule: RegexRule,
  text: string,
  options: LintOptions,
): LintFinding[] {
  if (options.disabledRuleIds?.includes(rule.id)) return [];
  if (optionEnabled(rule.requiresOption, options)) return [];

  const haystack =
    rule.scope === "opening" ? text.slice(0, OPENING_WINDOW) : text;
  const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
  const findings: LintFinding[] = [];

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(haystack)) !== null) {
    findings.push({
      ruleId: rule.id,
      severity: rule.severity,
      ruleRef: rule.ruleRef,
      message: rule.message,
      excerpt: match[0].trim(),
      index: match.index,
      ...(rule.suggestion ? { suggestion: rule.suggestion } : {}),
    });
    if (match.index === pattern.lastIndex) pattern.lastIndex += 1;
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Structural checks
// ---------------------------------------------------------------------------

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function firstWord(sentence: string): string {
  const match = sentence.match(/^[A-Za-z']+/);
  return match ? match[0].toLowerCase() : "";
}

/**
 * Rule of three detection (rules 6, 7, 34, 120).
 *
 * Heuristic and warning-only. Three genuinely required factual items must not be
 * treated as a violation, so this looks for rhythm rather than for counts:
 * three short fragments in a row, or three consecutive sentences opening with the
 * same word.
 */
function checkRuleOfThree(text: string): LintFinding[] {
  const findings: LintFinding[] = [];
  const sentences = splitSentences(text);

  // Three consecutive short fragments: "Simple. Clean. Effective."
  for (let i = 0; i + 2 < sentences.length; i += 1) {
    const window = sentences.slice(i, i + 3);
    const allShort = window.every((sentence) => {
      const words = sentence.replace(/[.!?]$/, "").split(/\s+/).filter(Boolean);
      return words.length > 0 && words.length <= 4;
    });
    if (allShort) {
      findings.push({
        ruleId: "rule_of_three_fragments",
        severity: "warning",
        ruleRef: "6, 7, 8, 120",
        message:
          "Three consecutive short fragments. This is rule-of-three rhythm rather than content.",
        excerpt: window.join(" "),
        index: text.indexOf(window[0]!),
        suggestion: "Write the point in ordinary sentences, or keep only what carries meaning.",
      });
      i += 2;
    }
  }

  // Three consecutive sentences opening with the same word.
  for (let i = 0; i + 2 < sentences.length; i += 1) {
    const words = sentences.slice(i, i + 3).map(firstWord);
    if (words[0] && words[0] === words[1] && words[1] === words[2]) {
      findings.push({
        ruleId: "fake_parallelism",
        severity: "warning",
        ruleRef: "34, 120",
        message:
          "Three consecutive sentences opening with the same word. Repeated syntax for rhythm.",
        excerpt: sentences.slice(i, i + 3).join(" "),
        index: text.indexOf(sentences[i]!),
        suggestion: "Vary the construction so the repetition is not the point.",
      });
      i += 2;
    }
  }

  // Three comma-separated slogan elements: "Faster, smarter, better."
  // Three single-word items closing a sentence: "Faster, smarter, better."
  // Restricted to bare single words so a genuine list of three noun phrases
  // ("the use register, the data-flow map and the incident procedure") is not
  // caught by a rule that is meant to find slogans.
  const sloganPattern = /\b([A-Za-z]+),\s+([A-Za-z]+),\s+(?:and\s+)?([A-Za-z]+)\s*[.!?]/g;
  let match: RegExpExecArray | null;
  while ((match = sloganPattern.exec(text)) !== null) {
    findings.push({
      ruleId: "triadic_slogan",
      severity: "warning",
      ruleRef: "6, 120",
      message: "Three-item slogan list. Prefer the number of points the subject requires.",
      excerpt: match[0].trim(),
      index: match.index,
    });
  }

  return findings;
}

/**
 * Excessive one-line paragraphs (rule 35).
 *
 * White space helps. A vertical wall of one-line sentences is a format tic.
 */
function checkOneLineParagraphs(text: string): LintFinding[] {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length < 8) return [];

  const oneLiners = paragraphs.filter(
    (paragraph) => !paragraph.includes("\n") && splitSentences(paragraph).length <= 1,
  );

  const ratio = oneLiners.length / paragraphs.length;
  if (ratio < 0.75) return [];

  return [
    {
      ruleId: "excessive_one_line_paragraphs",
      severity: "warning",
      ruleRef: "35",
      message: `${oneLiners.length} of ${paragraphs.length} paragraphs are single sentences. This reads as LinkedIn format rather than as thought.`,
      excerpt: paragraphs.slice(0, 3).join(" / "),
      index: 0,
      suggestion:
        "Break paragraphs around a change of thought, emphasis, story beat, list or transition.",
    },
  ];
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "is", "are", "was", "were", "be",
  "been", "to", "of", "in", "on", "for", "with", "that", "this", "it", "as",
  "at", "by", "from", "you", "your", "they", "their", "not", "no", "so", "then",
  "than", "when", "what", "which", "who", "will", "can", "just", "still", "has",
  "have", "had", "do", "does", "did", "more", "most", "into", "about", "because",
]);

function contentWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !STOP_WORDS.has(word)),
  );
}

/**
 * Repeated premise detection (rule 10).
 *
 * The pattern the rule describes is: the hook states the point, the second
 * paragraph repeats it, the third restates it again in different words. This
 * measures content-word overlap between the opening paragraphs. High overlap
 * means the argument has not moved.
 */
function checkRepeatedPremise(text: string): LintFinding[] {
  const paragraphs = splitParagraphs(text).slice(0, 4);
  if (paragraphs.length < 2) return [];

  const findings: LintFinding[] = [];

  for (let i = 0; i + 1 < paragraphs.length; i += 1) {
    const first = contentWords(paragraphs[i]!);
    const second = contentWords(paragraphs[i + 1]!);
    if (first.size < 3 || second.size < 3) continue;

    let shared = 0;
    for (const word of second) {
      if (first.has(word)) shared += 1;
    }
    const overlap = shared / Math.min(first.size, second.size);

    if (overlap >= 0.6) {
      findings.push({
        ruleId: "repeated_premise",
        severity: "warning",
        ruleRef: "9, 10",
        message: `Paragraphs ${i + 1} and ${i + 2} share ${Math.round(overlap * 100)}% of their content words. The premise may be restated rather than advanced.`,
        excerpt: paragraphs[i + 1]!.slice(0, 120),
        index: text.indexOf(paragraphs[i + 1]!),
        suggestion:
          "Each paragraph should advance the argument, add evidence, add tension or explain a mechanism.",
      });
    }
  }

  return findings;
}

/** Illustrative-day rule (rule 46). Tuesday is reserved. */
function checkDayRule(text: string, options: LintOptions): LintFinding[] {
  if (options.dayReferencesAreFactual) return [];

  const pattern = /\bTuesday\b/g;
  const findings: LintFinding[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    findings.push({
      ruleId: "illustrative_day",
      severity: "warning",
      ruleRef: "46",
      message:
        "Tuesday is not used for invented illustrative days. If this day is factual, mark day references as factual and the rule will not apply.",
      excerpt: match[0],
      index: match.index,
      suggestion: "Use any other day. Do not alter a sourced fact to satisfy this rule.",
    });
  }

  return findings;
}

/**
 * Algorithm folklore (distribution logic sections 44 and 47).
 *
 * A post that asserts a LinkedIn ranking claim with no primary-source evidence
 * is making a factual error, so this is an error rather than a warning. The
 * 360Brew claim is the one case where a primary source establishes the claim is
 * outright false rather than merely unsupported.
 */
function checkAlgorithmFolklore(text: string): LintFinding[] {
  return detectAlgorithmFolklore(text).map((hit) => ({
    ruleId: "algorithm_folklore",
    severity: "error" as const,
    ruleRef: "distribution logic 44, 47",
    message: `Unsupported platform claim: ${hit.claim}. ${
      hit.note ?? "There is no primary-source evidence for it."
    }`,
    excerpt: hit.excerpt,
    index: text.indexOf(hit.excerpt),
    suggestion: "Remove the claim, or restate it as your own observation rather than as platform fact.",
  }));
}

/** UK English default (rule 45). */
function checkBritishEnglish(text: string): LintFinding[] {
  const findings: LintFinding[] = [];

  for (const { american, british } of AMERICANISMS) {
    const pattern = new RegExp(`\\b${american}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      findings.push({
        ruleId: "us_spelling",
        severity: "warning",
        ruleRef: "45",
        message: `US spelling. UK English is the default.`,
        excerpt: match[0],
        index: match.index,
        suggestion: `Use "${british}".`,
      });
    }
  }

  return findings;
}

/**
 * List hook count consistency.
 *
 * The list hook family promises a specific number. Rule: the number in the hook
 * must equal the number of items in the body, and the count is never padded.
 */
export function checkListCountConsistency(
  hook: string,
  body: string,
): LintFinding | null {
  const promised = hook.match(/\b(\d{1,2})\b/);
  if (!promised) return null;

  const expected = Number.parseInt(promised[1]!, 10);
  if (!Number.isFinite(expected) || expected < 2 || expected > 30) return null;

  const numbered = body.match(/^\s*\d+[.)]\s+/gm)?.length ?? 0;
  const bulleted = body.match(/^\s*[-*•]\s+/gm)?.length ?? 0;
  const actual = Math.max(numbered, bulleted);

  if (actual === 0 || actual === expected) return null;

  return {
    ruleId: "list_count_mismatch",
    severity: "error",
    ruleRef: "Nexus hook library, list hook rules",
    message: `The hook promises ${expected} items and the body contains ${actual}.`,
    excerpt: hook,
    index: 0,
    suggestion:
      "Correct the hook to the real count. Never pad the list to match the promise.",
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * Lint a draft post.
 *
 * `passed` is false when any error-severity finding is present. That blocks the
 * draft from being returned as final and sends it back to the revision writer
 * with the findings attached.
 */
export function lintPost(text: string, options: LintOptions = {}): LintResult {
  const normalised = normalise(text);

  const findings: LintFinding[] = [
    ...PHRASE_RULES.flatMap((rule) => runPhraseRule(rule, normalised, options)),
    ...REGEX_RULES.flatMap((rule) => runRegexRule(rule, normalised, options)),
    ...checkRuleOfThree(normalised),
    ...checkOneLineParagraphs(normalised),
    ...checkRepeatedPremise(normalised),
    ...checkDayRule(normalised, options),
    ...checkBritishEnglish(normalised),
    ...checkAlgorithmFolklore(normalised),
  ].sort((a, b) => a.index - b.index);

  const errors = findings.filter((finding) => finding.severity === "error");
  const warnings = findings.filter((finding) => finding.severity === "warning");

  return { findings, errors, warnings, passed: errors.length === 0 };
}

/** Render a lint result as prompt context for the revision writer. */
export function renderLintFindings(result: LintResult): string {
  if (result.findings.length === 0) {
    return "The deterministic linter found no violations.";
  }

  const lines = result.findings.map((finding) => {
    const parts = [
      `[${finding.severity}] ${finding.ruleId} (writing rules section ${finding.ruleRef})`,
      `  Found: "${finding.excerpt}"`,
      `  ${finding.message}`,
    ];
    if (finding.suggestion) parts.push(`  Fix: ${finding.suggestion}`);
    return parts.join("\n");
  });

  return [
    `${result.errors.length} error(s), ${result.warnings.length} warning(s).`,
    "",
    ...lines,
  ].join("\n");
}
