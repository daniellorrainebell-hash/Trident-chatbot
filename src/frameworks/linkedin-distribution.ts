/**
 * LinkedIn distribution logic.
 *
 * Source: NEXUS_IQ_LINKEDIN_DISTRIBUTION_LOGIC_AUG_2026.md, verified through
 * 31 August 2026. That file is authoritative for this module.
 *
 * The governing discipline is evidence labelling. Every rule here carries one,
 * and the labels are load-bearing rather than decorative: a CONFIRMED rule may
 * be enforced, an IMPLEMENTATION_INFERENCE may be applied as a product decision
 * but never described to the user as a LinkedIn ranking rule, and an UNSUPPORTED
 * claim must never be hardwired at all.
 *
 * Two failure modes this module exists to prevent:
 *
 *   Inventing algorithm mechanics. No weights, no multipliers, no magic
 *   thresholds, no posting-time formulas. Section 44 of the source lists the
 *   folklore explicitly and MYTH_FIREWALL encodes it.
 *
 *   Flattening the author. Section 55 is explicit that this module must not
 *   become an excuse for bland corporate writing. It removes confirmed
 *   distribution problems; it does not remove personality.
 */

import type { FrameworkDefinition } from "./types";

/** Knowledge version. Bump when the source file is re-verified. */
export const DISTRIBUTION_KNOWLEDGE_VERSION = "2026-08-31";
export const DISTRIBUTION_LAST_VERIFIED = "2026-08-31";

/**
 * Evidence labels (source section 2).
 *
 * CONFIRMED               LinkedIn explicitly states the behaviour or signal.
 * CONFIRMED_CATEGORY      LinkedIn confirms the category matters, without
 *                         publishing weights, thresholds or mechanics.
 * IMPLEMENTATION_INFERENCE A Nexus product decision derived from confirmed
 *                         behaviour, not stated by LinkedIn as a ranking rule.
 * UNSUPPORTED             A common claim with no primary-source evidence.
 *                         Never hardwire.
 */
export type EvidenceLabel =
  | "CONFIRMED"
  | "CONFIRMED_CATEGORY"
  | "IMPLEMENTATION_INFERENCE"
  | "UNSUPPORTED";

export interface DistributionRule {
  id: string;
  /** Section number in the source file. */
  ref: number;
  evidence: EvidenceLabel;
  /** What LinkedIn states, or what Nexus infers. */
  statement: string;
  /** What the engine does about it. */
  application: string;
}

// ---------------------------------------------------------------------------
// Confirmed platform behaviour
// ---------------------------------------------------------------------------

export const DISTRIBUTION_RULES: DistributionRule[] = [
  {
    id: "feed_architecture",
    ref: 3,
    evidence: "CONFIRMED",
    statement:
      "LinkedIn's Feed uses Generative Recommenders with LLM-based retrieval, semantic understanding of posts, personalisation from profile signals, historical interaction sequences, out-of-network recommendation, and freshness balanced with relevance.",
    application:
      "Write a clear professional subject, a clearly identifiable intended reader, one coherent argument and enough context for a stranger. Do not keyword-stuff.",
  },
  {
    id: "hundreds_of_signals",
    ref: 5,
    evidence: "CONFIRMED",
    statement:
      "LinkedIn considers hundreds of signals including post context, profile, network, activity, industry, skills, geography, reading behaviour, dwell, freshness and professional relevance.",
    application:
      "Improve relevance and clarity. Never assert a numeric weight for any signal.",
  },
  {
    id: "professional_relevance",
    ref: 6,
    evidence: "CONFIRMED",
    statement:
      "LinkedIn values and recommends professionally relevant content: industry insight, career and business advice, professional development, education, and products or services presented with useful context.",
    application:
      "Every post states a professional subject, a professional audience and why it matters to them. Never fabricate a business lesson purely to qualify for recommendation.",
  },
  {
    id: "out_of_network_context",
    ref: 7,
    evidence: "CONFIRMED",
    statement:
      "LinkedIn recommends posts beyond a member's network when they are professionally relevant, high quality, understandable outside the author's network, sufficiently contextual, not overly promotional and coherent across text and media.",
    application:
      "For broad-distribution posts, check a stranger can tell who it is for, what is being argued and why it matters. Add only the context needed, never filler.",
  },
  {
    id: "semantic_relevance",
    ref: 8,
    evidence: "CONFIRMED",
    statement:
      "LLM-generated representations let retrieval understand professional interests beyond exact keyword matching.",
    application:
      "Name the subject clearly and use accurate terminology naturally. Hold one coherent semantic subject. Do not optimise for keyword density.",
  },
  {
    id: "dwell_time",
    ref: 12,
    evidence: "CONFIRMED",
    statement:
      "LinkedIn Engineering has documented dwell-time modelling: short dwell and skip behaviour as negative signal, long dwell as positive, normalised because content types differ, with dynamic rather than universal thresholds.",
    application:
      "Optimise for genuine read-through. Never state a target dwell time: no published creator-facing threshold exists.",
  },
  {
    id: "read_through_quality",
    ref: 13,
    evidence: "CONFIRMED_CATEGORY",
    statement:
      "LinkedIn says its dwell work aims to limit clickbait and dwell-bait content.",
    application:
      "The hook creates relevant interest, the next sentence advances it, the middle carries new information, and the payoff lands. Do not stretch material to increase read time.",
  },
  {
    id: "promotional_only",
    ref: 16,
    evidence: "CONFIRMED",
    statement:
      "Content that only sells, without useful insight, news or advice, may not be shared broadly beyond connections and followers.",
    application:
      "A broad-discovery commercial post pairs the commercial subject with real professional value. A direct sales post remains valid when conversion is the objective and the trade-off is accepted knowingly.",
  },
  {
    id: "engagement_bait",
    ref: 17,
    evidence: "CONFIRMED",
    statement:
      "LinkedIn explicitly discourages content that asks for engagement purely to increase visibility, and says it is improving systems to filter it.",
    application:
      "Block the bait list. Asking for genuine thoughts is acceptable, so distinguish a meaningful conversation question from engagement manipulation.",
  },
  {
    id: "generic_recycled",
    ref: 18,
    evidence: "CONFIRMED",
    statement:
      "LinkedIn is showing less generic content, repetitive content, click-driven posts, engagement bait and recycled thought leadership lacking substance.",
    application:
      "Flag posts that could have been written for any professional, recycle an old post with word changes, or contain no specific observation, mechanism, example or proof.",
  },
  {
    id: "originality",
    ref: 19,
    evidence: "CONFIRMED",
    statement:
      "Copying content without added insight is discouraged. Personal insight or a unique perspective makes a reshare useful.",
    application:
      "Never paraphrase a source into a post without the author's own view, analysis, application, criticism or experience. Attribute where appropriate.",
  },
  {
    id: "media_alignment",
    ref: 20,
    evidence: "CONFIRMED",
    statement:
      "LinkedIn intends to show less content where media has nothing to do with the text and is used to drive inauthentic distribution.",
    application:
      "Warn when attached media does not relate to the post's subject. Never suggest unrelated viral media.",
  },
  {
    id: "inauthentic_engagement",
    ref: 21,
    evidence: "CONFIRMED",
    statement:
      "LinkedIn actively limits the reach of inauthentic activity, naming engagement pods, automated comments and coordinated engagement, and says it can restrict accounts.",
    application:
      "Never recommend pods, coordinated engagement or automated commenting. These are hard fails.",
  },
  {
    id: "prohibited_automation",
    ref: 24,
    evidence: "CONFIRMED",
    statement:
      "LinkedIn does not permit third-party tools that scrape, automate activity, auto-comment, auto-like, auto-share or manipulate content algorithms.",
    application:
      "Any future LinkedIn integration uses officially supported APIs only. The tool may draft a comment for a human to post; it must not post one.",
  },
  {
    id: "unconstructive",
    ref: 27,
    evidence: "CONFIRMED",
    statement:
      "Content that erodes the professional nature of the platform, including mocking, talking down, shouting, swearing, provoking arguments and jokes at others' expense, may not be shared beyond connections and followers.",
    application:
      "Criticise ideas, systems, processes and claims. Flag personal mockery. Strong disagreement stays available.",
  },
  {
    id: "profanity_tradeoff",
    ref: 28,
    evidence: "CONFIRMED_CATEGORY",
    statement:
      "LinkedIn lists swear words among examples of unconstructive content that may not receive broader recommendation. No fixed penalty is published.",
    application:
      "Do not ban profanity globally and do not sanitise the author's voice automatically. When broad recommendation is the priority and profanity is present, surface the trade-off.",
  },
  {
    id: "constructive_disagreement",
    ref: 29,
    evidence: "CONFIRMED",
    statement:
      "LinkedIn says members value diverse opinions and healthy debate. The negative category is unconstructive behaviour, not disagreement.",
    application: "Strong opinions and direct disagreement are permitted and should survive review.",
  },
  {
    id: "fear_exaggeration",
    ref: 30,
    evidence: "CONFIRMED",
    statement:
      "Exaggerating to create fear or upset others is listed as unconstructive.",
    application:
      "For governance, security, legal and commercial risk: state the actual risk and mechanism, use verified consequences, and never inflate enforcement certainty. Loss aversion without fear fabrication.",
  },
  {
    id: "member_feedback",
    ref: 31,
    evidence: "CONFIRMED",
    statement:
      "Suggested content selection takes member feedback into account, including disinterest signals and reports.",
    application:
      "Do not optimise solely for positive engagement. A post that draws hides or reports can be counterproductive.",
  },
  {
    id: "post_context",
    ref: 33,
    evidence: "CONFIRMED",
    statement:
      "Feed systems consider the context of a post, with examples such as helpful insight, job opportunity and career milestone.",
    application:
      "Classify intent and choose structure from it. Not every post takes the same approach.",
  },
  {
    id: "network_first_posts",
    ref: 39,
    evidence: "CONFIRMED",
    statement:
      "Some posts are relevant to the author's network without being broadly useful outside it.",
    application:
      "Do not force personal milestones, announcements or community context into broad-discovery formatting.",
  },
  {
    id: "ai_text_not_penalised",
    ref: 42,
    evidence: "UNSUPPORTED",
    statement:
      "There is no first-party evidence that text is penalised simply because AI helped create it.",
    application:
      "Never claim LinkedIn penalises AI-assisted copy. Solve the quality problems associated with weak AI writing instead.",
  },
];

// ---------------------------------------------------------------------------
// Myth firewall (source sections 44 and 47)
// ---------------------------------------------------------------------------

export interface MythEntry {
  claim: string;
  status: "false" | "unsupported";
  /** Why, where a primary source settles it. */
  note?: string;
  /** Patterns that suggest the claim is being made. */
  patterns: RegExp[];
}

/**
 * Claims that must never be hardwired or repeated as platform fact.
 *
 * 360Brew is the one entry marked false rather than unsupported: LinkedIn's VP
 * of Engineering publicly confirmed the test was shut down and is not part of
 * the current ranking system.
 */
export const MYTH_FIREWALL: MythEntry[] = [
  {
    claim: "360Brew is LinkedIn's current ranking model",
    status: "false",
    note: "Publicly confirmed as a shut-down internal test, not the production Feed ranking system.",
    patterns: [/\b360\s?brew\b/i],
  },
  {
    claim: "External links receive a fixed reach penalty",
    status: "unsupported",
    patterns: [
      /\b(external )?links?\b[^.!?]{0,60}\b(kill|reduce|penalis|penaliz|hurt)[^.!?]{0,40}\b(reach|distribution)\b/i,
      /\b\d{1,3}\s?%\s+(reach\s+)?penalty\b/i,
    ],
  },
  {
    claim: "Putting the link in the first comment avoids a penalty",
    status: "unsupported",
    patterns: [/\blink\s+in\s+(the\s+)?(first\s+)?comments?\b/i],
  },
  {
    claim: "Editing a post kills reach",
    status: "unsupported",
    patterns: [/\bedit(ing)?\b[^.!?]{0,40}\b(kills?|destroys?|hurts?|tanks?)\b[^.!?]{0,20}\breach\b/i],
  },
  {
    claim: "A specific hashtag count is optimal",
    status: "unsupported",
    patterns: [
      /\b(three|3|five|5|3\s*(to|-)\s*5)\s+hashtags\b/i,
      /\bhashtags?\b[^.!?]{0,40}\b(reduce|hurt|kill)[^.!?]{0,20}\breach\b/i,
    ],
  },
  {
    claim: "Comments are worth a fixed multiple of likes",
    status: "unsupported",
    patterns: [
      /\b(one |1 )?comments?\s*(=|equals?|is worth)\s*\d+\s*(likes?|reactions?)/i,
      /\bcomments?\s+are\s+worth\s+\d+/i,
    ],
  },
  {
    claim: "Saves have a known ranking multiplier",
    status: "unsupported",
    patterns: [/\b(one |1 )?saves?\s*(=|equals?|is worth)\s*\d+\s*(likes?|comments?)/i],
  },
  {
    claim: "The first N minutes determine a post's lifecycle",
    status: "unsupported",
    patterns: [
      /\bfirst\s+(hour|30|60|90)\s*(minutes?)?\b[^.!?]{0,50}\b(determines?|decides?|makes or breaks)\b/i,
      /\bgolden\s+(hour|window)\b/i,
    ],
  },
  {
    claim: "There is an optimal posting time",
    status: "unsupported",
    patterns: [
      /\bpost\s+at\s+\d{1,2}[:.]\d{2}\s*(am|pm)?\b/i,
      /\b(best|optimal)\s+time\s+to\s+post\b/i,
    ],
  },
  {
    claim: "A specific format receives an automatic boost",
    status: "unsupported",
    patterns: [
      /\b(carousels?|polls?|videos?|text-only posts?|newsletters?)\b[^.!?]{0,40}\bget\s+(more|better)\s+reach\b/i,
      /\balgorithm\s+(favours?|favors?|boosts?|prefers?)\b/i,
    ],
  },
  {
    claim: "Low impressions mean you are shadow banned",
    status: "unsupported",
    note: "LinkedIn does not describe a general creator mechanism called shadow banning. Use 'distribution limited' or 'recommendation reduced'.",
    patterns: [/\bshadow[\s-]?ban(ned|ning)?\b/i],
  },
  {
    claim: "AI-assisted writing receives an automatic penalty",
    status: "unsupported",
    patterns: [/\bai[- ](written|generated|assisted)\b[^.!?]{0,50}\b(penalt|punish|downrank)/i],
  },
];

/** A folklore claim detected in text. */
export interface MythHit {
  claim: string;
  status: MythEntry["status"];
  excerpt: string;
  note?: string;
}

/**
 * Scan text for algorithm folklore.
 *
 * Deterministic, so it holds regardless of what any model believes about
 * LinkedIn. Used on generated drafts and on any advice the system offers.
 */
export function detectAlgorithmFolklore(text: string): MythHit[] {
  const hits: MythHit[] = [];

  for (const entry of MYTH_FIREWALL) {
    for (const pattern of entry.patterns) {
      const match = new RegExp(pattern.source, pattern.flags.replace("g", "")).exec(text);
      if (match) {
        hits.push({
          claim: entry.claim,
          status: entry.status,
          excerpt: match[0],
          ...(entry.note ? { note: entry.note } : {}),
        });
        break;
      }
    }
  }

  return hits;
}

// ---------------------------------------------------------------------------
// Engagement bait (source section 17)
// ---------------------------------------------------------------------------

/**
 * Phrases LinkedIn names as engagement bait.
 *
 * The writing rules already ban most of these for voice reasons. They are
 * repeated here because the justification differs: there it is "this sounds
 * like a template", here it is "LinkedIn says this reduces recommendation".
 */
export const ENGAGEMENT_BAIT_PHRASES: string[] = [
  "comment yes if you agree",
  "like if you agree",
  "repost if you agree",
  "share this with your network",
  "tag someone who needs this",
  "follow for more",
  "save this for later",
  "bookmark this",
  "drop a yes below",
  "double tap if",
  "smash that like",
];

// ---------------------------------------------------------------------------
// Distribution modes (source section 54)
// ---------------------------------------------------------------------------

export type DistributionMode =
  | "broad_reach"
  | "balanced"
  | "voice_first"
  | "conversion_first"
  | "network_first";

export interface DistributionModeDefinition {
  id: DistributionMode;
  label: string;
  description: string;
  /** Concerns raised in this mode. */
  flags: string[];
  /** Concerns deliberately accepted in this mode. */
  accepts: string[];
}

export const DISTRIBUTION_MODES: DistributionModeDefinition[] = [
  {
    id: "broad_reach",
    label: "Broad reach",
    description: "Prioritise eligibility for recommendation beyond your network.",
    flags: [
      "profanity",
      "unconstructive language",
      "pure promotion",
      "engagement bait",
      "context gaps for an out-of-network reader",
      "media mismatch",
    ],
    accepts: [],
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Preserve voice while removing clear recommendation negatives.",
    flags: ["engagement bait", "generic or recycled language", "pure promotion", "media mismatch"],
    accepts: ["occasional profanity where it is the author's natural register"],
  },
  {
    id: "voice_first",
    label: "Voice first",
    description: "Allow stronger personality and accept the trade-offs that come with it.",
    flags: ["fake engagement", "fabricated facts", "spam tactics", "automation tactics"],
    accepts: ["profanity", "confrontational language", "narrower framing"],
  },
  {
    id: "conversion_first",
    label: "Conversion first",
    description: "Direct commercial copy. Broad recommendation is secondary.",
    flags: ["fake scarcity", "fabricated proof", "engagement bait"],
    accepts: ["pure promotion risk", "reduced broad recommendation"],
  },
  {
    id: "network_first",
    label: "Network first",
    description: "For posts aimed at people who already know you.",
    flags: ["engagement bait", "fabricated facts"],
    accepts: ["personal context", "less universal framing", "narrow relevance"],
  },
];

export const DEFAULT_DISTRIBUTION_MODE: DistributionMode = "balanced";

export function getDistributionMode(id: DistributionMode): DistributionModeDefinition {
  return (
    DISTRIBUTION_MODES.find((mode) => mode.id === id) ??
    DISTRIBUTION_MODES.find((mode) => mode.id === DEFAULT_DISTRIBUTION_MODE)!
  );
}

// ---------------------------------------------------------------------------
// Gates and hard fails
// ---------------------------------------------------------------------------

/** The broad-recommendation gate (source section 38). */
export const BROAD_RECOMMENDATION_GATE: string[] = [
  "Professional relevance present?",
  "Can a stranger understand it?",
  "Useful insight or professional value present?",
  "Not purely promotional?",
  "Original perspective present?",
  "No engagement bait?",
  "No inauthentic distribution trick?",
  "Text and media aligned?",
  "Constructive tone?",
  "Does the hook deliver its promise?",
];

/**
 * Hard fails (source section 58).
 *
 * These are platform-policy problems rather than quality problems, so they
 * block rather than warn. Every one is grounded in LinkedIn policy or public
 * enforcement statements.
 */
export const HARD_FAIL_CONDITIONS: string[] = [
  "engagement-pod instructions",
  "automated comment instructions",
  "unauthorised LinkedIn automation",
  "fake reaction polls",
  "chain-letter engagement requests",
  "deliberate misrepresentation of a LinkedIn feature",
  "known spam manipulation",
  "fake engagement",
  "deliberately unrelated media to game distribution",
];

/** Soft warnings (source section 59). Legitimate depending on the objective. */
export const SOFT_WARNINGS: string[] = [
  "profanity",
  "direct selling",
  "strong confrontational language",
  "personal content with weak professional context",
  "narrow network-specific context",
  "potentially unsettling media",
];

/**
 * Approved vocabulary for reduced visibility (source section 45).
 *
 * LinkedIn confirms several forms of limited distribution. It does not describe
 * a general creator mechanism called shadow banning, and low impressions alone
 * never establish a cause.
 */
export const VISIBILITY_LANGUAGE = {
  use: [
    "distribution limited",
    "recommendation reduced",
    "visibility limited",
    "account restricted",
    "may not be eligible for broad recommendation",
  ],
  avoid: ["shadow banned", "the algorithm is hiding your posts"],
} as const;

/** The scoring dimensions from source section 35. Nexus weights, not LinkedIn's. */
export const NEXUS_DISTRIBUTION_DIMENSIONS = [
  "professional_relevance",
  "topic_clarity",
  "out_of_network_context",
  "originality",
  "useful_insight",
  "dwell_quality",
] as const;

/**
 * The score's name.
 *
 * Source section 34 is explicit: this may be called a Nexus Content Quality
 * Score and must not be called a LinkedIn Algorithm Score. LinkedIn publishes
 * no creator-facing quality formula.
 */
export const DISTRIBUTION_SCORE_LABEL = "Nexus Distribution Score";

export const LINKEDIN_DISTRIBUTION_FRAMEWORK: FrameworkDefinition = {
  id: "linkedin_distribution_logic",
  name: "LinkedIn Distribution Logic",
  category: "quality",
  source: "LinkedIn first-party engineering, Help Centre and corporate communications",
  sourceFamily: `Nexus IQ distribution knowledge ${DISTRIBUTION_KNOWLEDGE_VERSION}`,
  sourceSummary:
    "LinkedIn's Feed uses semantic retrieval and hundreds of personalisation signals, recommends professionally relevant content beyond a member's network when it is contextual and not overly promotional, models dwell time, and reduces the reach of engagement bait, generic or recycled content, unrelated media, pure promotion, unconstructive content and inauthentic engagement.",
  appAdaptation:
    "Runs as a distribution check after the editorial critic and fact checker. It reports confirmed risks, labels its own inferences as inferences, and never invents ranking weights. It reduces recommendation risk without flattening the author's voice.",
  structure: [
    "Professional relevance",
    "Topic clarity",
    "Out-of-network context",
    "Originality",
    "Useful insight",
    "Read-through quality",
    "Confirmed negatives",
  ],
  bestFor: ["Every post, as a distribution check before output"],
  allowedUse: ["quality", "strategy"],
  misuseRisks: [
    "Inventing ranking weights, multipliers or dwell thresholds.",
    "Optimising for 360Brew, which is not the current ranking system.",
    "Turning a strong voice into safe corporate writing.",
    "Treating an implementation inference as a LinkedIn-confirmed rule.",
    "Diagnosing a shadow ban from low impressions.",
  ],
  rules: [
    "Never state a numeric weight, multiplier or dwell threshold.",
    "Never optimise for 360Brew.",
    "Label every inference as an inference.",
    "Remove confirmed distribution problems, not personality.",
    "A trade-off knowingly accepted is not a failure.",
  ],
  active: true,
};
