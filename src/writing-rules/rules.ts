/**
 * Nexus IQ LinkedIn writing rules, expressed as lint data.
 *
 * Source: NEXUS_IQ_LINKEDIN_WRITING_RULES.md.
 *
 * That document is explicit about precedence: frameworks influence structure and
 * strategy, and they do not override these rules. Rule 123 sets the hierarchy as
 * truth first, then the current user instruction, then this rules file, then the
 * voice profile, then strategy, then the framework library.
 *
 * Everything phrase-based lives here as data. Structural checks that need to
 * reason about sentences and paragraphs live in linter.ts.
 */

export type LintSeverity = "error" | "warning";

export interface PhraseRule {
  id: string;
  severity: LintSeverity;
  /** Section of the writing rules document this enforces. */
  ruleRef: string;
  message: string;
  /** Phrases matched case-insensitively at word boundaries. */
  phrases: string[];
  /** Restrict matching to the opening of the post. */
  scope?: "full" | "opening";
  /**
   * May be suppressed by an allowlisted term, for genuinely literal use.
   * Rule 117 requires this for the trope words.
   */
  allowlistable?: boolean;
  /** Suppressed when the named lint option is enabled. */
  requiresOption?:
    | "permitHashtags"
    | "permitEmoji"
    | "permitEngagementCta"
    | "verifiedScarcityOrUrgency"
    | "isCarouselCopy"
    | "subjectIsTheFramework";
  /** Replacement guidance shown with the finding. */
  suggestion?: string;
}

export interface RegexRule {
  id: string;
  severity: LintSeverity;
  ruleRef: string;
  message: string;
  pattern: RegExp;
  scope?: "full" | "opening";
  requiresOption?: PhraseRule["requiresOption"];
  suggestion?: string;
}

/** How many characters count as "the opening" for opener rules (rule 118). */
export const OPENING_WINDOW = 120;

// ---------------------------------------------------------------------------
// Hard errors
// ---------------------------------------------------------------------------

export const HARD_BANNED_WORDS: string[] = [
  "leverage",
  "leveraging",
  "leveraged",
  "synergy",
  "synergies",
  "synergise",
  "synergize",
  "synergistic",
];

/**
 * Trope words banned by default (rule 117), suppressible for literal use.
 * "noise" is genuinely literal in an audio context; "quietly" is genuinely
 * literal when something was actually done without announcement.
 */
export const TROPE_BANNED_WORDS: string[] = ["hype", "fluff", "noise", "quietly"];

export const GENERIC_OPENERS_HARD: string[] = [
  "most businesses",
  "most founders",
];

export const GENERIC_OPENERS_SOFT: string[] = [
  "most entrepreneurs",
  "most people",
  "most companies",
  "every business owner",
  "every founder",
  "everyone is",
  "nobody is talking about",
  "nobody tells you",
  "here's what nobody tells you",
  "here's the truth",
  "the truth is",
  "let's be honest",
  "real talk",
  "hot take",
  "unpopular opinion",
  "in today's world",
  "in today's fast-paced world",
  "in the rapidly evolving world of",
  "ai is changing everything",
  "ai is transforming",
  "the future is here",
  "we are entering a new era",
  "we're entering a new era",
  "the game has changed",
  "everything has changed",
  "this changes everything",
  "you need to hear this",
];

export const FAKE_SCARCITY_PHRASES: string[] = [
  "only 3 places left",
  "only 3 spots left",
  "last chance",
  "ends tonight",
  "closing soon",
  "final spots",
  "limited time",
  "don't miss out",
  "act now",
  "spots are filling fast",
];

export const BUZZWORDS: string[] = [
  "game-changer",
  "game changer",
  "game changing",
  "revolutionary",
  "revolutionise",
  "revolutionize",
  "disrupt",
  "disruptive",
  "unlock the power of",
  "unlock value",
  "harness",
  "empower",
  "elevate",
  "supercharge",
  "turbocharge",
  "seamlessly",
  "seamless",
  "cutting-edge",
  "next-generation",
  "future-proof",
  "robust",
  "holistic",
  "ecosystem",
  "landscape",
  "paradigm",
  "transformative",
  "transformation journey",
  "at scale",
  "scalable solution",
  "drive innovation",
  "streamline",
  "value-driven",
  "solution-oriented",
  "best-in-class",
  "mission-critical",
  "world-class",
  "end-to-end",
  "frictionless",
  "groundbreaking",
  "unprecedented",
  "state-of-the-art",
  "actionable insights",
  "deep dive",
  "dive into",
  "delve",
  "ever-evolving",
  "fast-paced",
  "rapidly changing",
  "digital transformation",
  "thought leadership",
  "thought leader",
  "key takeaway",
  "key learnings",
  "meaningful impact",
];

export const CLICHE_SUCCESS_LANGUAGE: string[] = [
  "move the needle",
  "crush it",
  "smash your goals",
  "level up",
  "step up your game",
  "take it to the next level",
  "dominate",
  "skyrocket",
  "explode your growth",
  "10x your life",
  "scale to the moon",
  "win the game",
  "secret sauce",
];

export const EMPTY_ASPIRATION: string[] = [
  "build the business of your dreams",
  "take your business to the next level",
  "reach your full potential",
  "become unstoppable",
  "change your life",
  "scale without limits",
  "the future belongs to",
];

export const AI_TELL_TRANSITIONS: string[] = [
  "here's the thing",
  "here's the catch",
  "here's the problem",
  "here's the kicker",
  "here's the reality",
  "here's where it gets interesting",
  "here's the interesting part",
  "and here's why",
  "which brings me to",
  "and that's the point",
  "and that's what matters",
  "that's the difference",
  "that's the real difference",
  "that's the lesson",
  "that's the takeaway",
  "that's what people miss",
  "that's what nobody understands",
  "this is the bit that matters",
  "this is where it gets interesting",
  "this is the important part",
  "this is exactly why",
];

export const ARTICLE_VOICE_TRANSITIONS: string[] = [
  "furthermore",
  "moreover",
  "in addition,",
  "consequently",
  "in conclusion",
  "it is worth noting that",
  "it should also be considered that",
];

export const HEDGE_AND_FILLER_OPENERS: string[] = [
  "to be clear",
  "to clarify",
  "for avoidance of doubt",
  "just to be clear",
  "in simple terms",
  "put simply",
  "simply put",
  "in other words",
  "at its core",
  "fundamentally,",
  "ultimately,",
  "at the end of the day",
];

export const CONVERSATIONAL_FILLERS: string[] = [
  "hear me out",
  "stay with me",
  "bear with me",
  "picture this",
  "now imagine",
  "guess what",
  "spoiler:",
  "plot twist:",
];

export const MIC_DROP_ENDINGS: string[] = [
  "let that sink in",
  "read that again",
  "i said what i said",
  "think about that",
  "your move",
  "choose wisely",
  "the choice is yours",
  "enough said",
  "period.",
  "full stop.",
  "end of story",
  "no debate",
];

export const CTA_BAIT: string[] = [
  "save this for later",
  "bookmark this",
  "share this with someone who needs it",
  "agree?",
  "thoughts?",
  "what do you think?",
  "let me know in the comments",
  "who else needs to hear this",
  "follow me for more",
  "follow for more",
  "repost if this helped",
  "drop a yes below",
  "does this resonate",
  "sound familiar?",
  "agree or disagree",
  "wrong answers only",
  "tag someone",
  "finish this sentence",
  "comment yes",
];

export const QUESTION_HOOKS: string[] = [
  "did you know",
  "have you ever wondered",
  "what if i told you",
  "want to know the secret",
  "are you making this mistake",
];

export const CLICKBAIT_WORDS: string[] = [
  "shocking",
  "insane",
  "unbelievable",
  "nobody knows",
  "they don't want you to know",
  "this will change everything",
  "you won't believe",
];

export const FAKE_REVELATION: string[] = [
  "what happened next surprised me",
  "i couldn't believe it",
  "this blew my mind",
  "i realised something",
  "i realized something",
  "then everything changed",
  "that's when it hit me",
  "i stared at the screen",
  "my jaw dropped",
];

export const FAKE_HUMILITY: string[] = [
  "i'm no expert, but",
  "maybe i'm wrong, but",
  "just my two cents",
  "i don't claim to know everything",
];

export const FAKE_SOCIAL_PROOF: string[] = [
  "thousands of businesses",
  "everyone i speak to",
  "clients keep telling me",
  "people are constantly asking me",
  "i get asked this all the time",
  "after working with hundreds of",
  "after working with dozens of",
  "i can't name the client, but",
];

export const GENERIC_AUTHORITY: string[] = [
  "as an ai expert",
  "as someone who works in ai",
  "with years of experience",
  "as a thought leader",
  "as an industry professional",
];

export const PHONY_PRECISION: string[] = [
  "10x better",
  "3x more effective",
  "dramatically improves",
  "dramatically increases",
  "significantly increases",
  "significantly improves",
];

export const UNSOURCED_SCIENCE: string[] = [
  "psychology proves",
  "psychology says",
  "neuroscience shows",
  "the brain is wired to",
  "dopamine",
];

export const ALGORITHM_CLAIMS: string[] = [
  "linkedin rewards",
  "the algorithm hates",
  "the algorithm loves",
  "linkedin suppresses",
];

export const FILLER_ADJECTIVES: string[] = [
  "incredible",
  "amazing",
  "exciting",
  "powerful",
  "impressive",
  "remarkable",
  "brilliant",
  "extraordinary",
  "sophisticated",
  "innovative",
  "dynamic",
];

export const FILLER_ADVERBS: string[] = [
  "really",
  "very",
  "incredibly",
  "extremely",
  "massively",
  "absolutely",
  "literally",
];

export const UNNECESSARY_SUPERLATIVES: string[] = [
  "the best",
  "the biggest",
  "the worst",
  "the greatest",
  "the fastest",
  "the smartest",
  "the most powerful",
  "the most important",
];

export const VALUE_BOMB_LANGUAGE: string[] = [
  "value bomb",
  "massive value",
  "packed with value",
  "insane value",
  "tons of value",
];

export const OVERSATURATED_AI_TAKES: string[] = [
  "ai won't replace you",
  "ai will not replace you",
  "ai is just a tool",
  "humans using ai will win",
  "ai is coming for your job",
  "prompt engineering is dead",
  "agents are the future",
];

export const FRAMEWORK_NAME_DROPS: string[] = [
  "hormozi's value equation",
  "the value equation",
  "according to the slay framework",
  "the slay framework",
  "using the c2c formula",
  "hook, retain, reward",
];

export const PROVEN_CLAIMS: string[] = [
  "proven framework",
  "proven system",
  "proven strategy",
  "proven method",
];

export const AMERICANISMS: Array<{ american: string; british: string }> = [
  { american: "organization", british: "organisation" },
  { american: "organizations", british: "organisations" },
  { american: "behavior", british: "behaviour" },
  { american: "analyze", british: "analyse" },
  { american: "analyzed", british: "analysed" },
  { american: "personalized", british: "personalised" },
  { american: "personalize", british: "personalise" },
  { american: "optimized", british: "optimised" },
  { american: "prioritize", british: "prioritise" },
  { american: "recognize", british: "recognise" },
  { american: "realize", british: "realise" },
  { american: "specialized", british: "specialised" },
  { american: "customization", british: "customisation" },
  { american: "center", british: "centre" },
  { american: "favorite", british: "favourite" },
  { american: "color", british: "colour" },
];

export const CAROUSEL_LANGUAGE: string[] = [
  "swipe to see",
  "swipe right",
  "slide 2",
  "in this carousel",
];

export const DEFAULT_EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

// ---------------------------------------------------------------------------
// Rule table
// ---------------------------------------------------------------------------

export const PHRASE_RULES: PhraseRule[] = [
  {
    id: "banned_words_hard",
    severity: "error",
    ruleRef: "5, 112, 113, 117",
    message: "Hard-banned word.",
    phrases: HARD_BANNED_WORDS,
    suggestion: "Use a concrete verb: use, apply, build with, connect, turn into.",
  },
  {
    id: "banned_words_trope",
    severity: "error",
    ruleRef: "110, 111, 117",
    message:
      "Banned content trope word. Allowed only where literally factual, via the allowlist.",
    phrases: TROPE_BANNED_WORDS,
    allowlistable: true,
    suggestion: "Remove it, or say the specific thing it is standing in for.",
  },
  {
    id: "generic_opener_hard",
    severity: "error",
    ruleRef: "4",
    message: "A post may never begin with this opener.",
    phrases: GENERIC_OPENERS_HARD,
    scope: "opening",
    suggestion: "Open with the specific situation, not an audience-wide generalisation.",
  },
  {
    id: "generic_opener",
    severity: "warning",
    ruleRef: "4, 118",
    message: "Generic content-trope opener. The hook should emerge from the subject.",
    phrases: GENERIC_OPENERS_SOFT,
    scope: "opening",
  },
  {
    id: "fake_scarcity",
    severity: "error",
    ruleRef: "30",
    message:
      "Scarcity or urgency language. Permitted only when the constraint is real and verified.",
    phrases: FAKE_SCARCITY_PHRASES,
    requiresOption: "verifiedScarcityOrUrgency",
  },
  {
    id: "cliche_success_language",
    severity: "error",
    ruleRef: "82, 83",
    message: "Cliche success language.",
    phrases: CLICHE_SUCCESS_LANGUAGE,
    suggestion: "State the actual operational or commercial outcome.",
  },
  {
    id: "buzzwords",
    severity: "warning",
    ruleRef: "5",
    message: "Corporate or AI buzzword. If a more concrete word exists, use it.",
    phrases: BUZZWORDS,
  },
  {
    id: "empty_aspiration",
    severity: "warning",
    ruleRef: "52, 94",
    message: "Empty aspiration. Use a concrete outcome.",
    phrases: EMPTY_ASPIRATION,
  },
  {
    id: "ai_tell_transition",
    severity: "warning",
    ruleRef: "11, 42, 121",
    message:
      "AI-tell transition. If the next sentence is genuinely interesting, write it directly.",
    phrases: AI_TELL_TRANSITIONS,
  },
  {
    id: "article_voice",
    severity: "warning",
    ruleRef: "19",
    message: "Report or essay transition. LinkedIn is conversational.",
    phrases: ARTICLE_VOICE_TRANSITIONS,
  },
  {
    id: "hedge_filler",
    severity: "warning",
    ruleRef: "41, 57, 58",
    message: "Filler transition. Write the clear version of the sentence instead.",
    phrases: HEDGE_AND_FILLER_OPENERS,
  },
  {
    id: "conversational_filler",
    severity: "warning",
    ruleRef: "43",
    message: "Manufactured conversational filler.",
    phrases: CONVERSATIONAL_FILLERS,
  },
  {
    id: "mic_drop_ending",
    severity: "warning",
    ruleRef: "95, 96",
    message: "Empty mic-drop line. End on substance.",
    phrases: MIC_DROP_ENDINGS,
  },
  {
    id: "cta_bait",
    severity: "warning",
    ruleRef: "22, 68, 122",
    message: "Engagement-bait CTA. Only permitted when the user asks for this CTA style.",
    phrases: CTA_BAIT,
    requiresOption: "permitEngagementCta",
  },
  {
    id: "question_hook",
    severity: "warning",
    ruleRef: "24",
    message: "Default question hook. Use a question only when it is genuinely the strongest opening.",
    phrases: QUESTION_HOOKS,
    scope: "opening",
  },
  {
    id: "clickbait",
    severity: "warning",
    ruleRef: "26",
    message: "Clickbait vocabulary. The body must genuinely support this language.",
    phrases: CLICKBAIT_WORDS,
  },
  {
    id: "fake_revelation",
    severity: "warning",
    ruleRef: "12, 36",
    message:
      "Revelation or drama language. Permitted only if the user genuinely reported this reaction.",
    phrases: FAKE_REVELATION,
  },
  {
    id: "fake_humility",
    severity: "warning",
    ruleRef: "39",
    message: "Fake humility. If the user knows the subject, write with confidence.",
    phrases: FAKE_HUMILITY,
  },
  {
    id: "fake_social_proof",
    severity: "error",
    ruleRef: "88, 89, 90, 92",
    message:
      "Social-proof or scale claim. Requires user-supplied evidence before it can appear.",
    phrases: FAKE_SOCIAL_PROOF,
  },
  {
    id: "generic_authority",
    severity: "warning",
    ruleRef: "21",
    message: "Announced expertise. Demonstrate it instead.",
    phrases: GENERIC_AUTHORITY,
  },
  {
    id: "phony_precision",
    severity: "error",
    ruleRef: "61",
    message: "Precise-sounding claim without evidence.",
    phrases: PHONY_PRECISION,
  },
  {
    id: "unsourced_science",
    severity: "warning",
    ruleRef: "85, 86",
    message:
      "Pop-science claim. Behavioural concepts may inform strategy without appearing as claims in the copy.",
    phrases: UNSOURCED_SCIENCE,
  },
  {
    id: "algorithm_claim",
    severity: "warning",
    ruleRef: "87",
    message: "Platform-behaviour claim. Requires current evidence.",
    phrases: ALGORITHM_CLAIMS,
  },
  {
    id: "filler_adjective",
    severity: "warning",
    ruleRef: "106",
    message: "Filler adjective. Use evidence instead.",
    phrases: FILLER_ADJECTIVES,
  },
  {
    id: "filler_adverb",
    severity: "warning",
    ruleRef: "107",
    message: "Default intensifier. Remove unless it reflects the user's natural voice.",
    phrases: FILLER_ADVERBS,
  },
  {
    id: "unnecessary_superlative",
    severity: "warning",
    ruleRef: "28",
    message: "Superlative. Use precision unless the claim can be defended.",
    phrases: UNNECESSARY_SUPERLATIVES,
  },
  {
    id: "value_bomb",
    severity: "warning",
    ruleRef: "105",
    message: "Announced value. Let the value be evident.",
    phrases: VALUE_BOMB_LANGUAGE,
  },
  {
    id: "oversaturated_ai_take",
    severity: "warning",
    ruleRef: "93",
    message:
      "Oversaturated AI framing. Requires a specific argument beyond the cliche.",
    phrases: OVERSATURATED_AI_TAKES,
  },
  {
    id: "framework_name_drop",
    severity: "warning",
    ruleRef: "64",
    message: "Framework named in the copy. Frameworks are internal machinery.",
    phrases: FRAMEWORK_NAME_DROPS,
    requiresOption: "subjectIsTheFramework",
  },
  {
    id: "proven_claim",
    severity: "warning",
    ruleRef: "84",
    message: "\"Proven\" claim. Prefer framework, system or approach unless evidence supports it.",
    phrases: PROVEN_CLAIMS,
  },
  {
    id: "carousel_language",
    severity: "warning",
    ruleRef: "103, 104",
    message: "Carousel or thread language in a normal LinkedIn post.",
    phrases: [...CAROUSEL_LANGUAGE, "a thread:"],
    requiresOption: "isCarouselCopy",
  },
];

export const REGEX_RULES: RegexRule[] = [
  {
    id: "no_em_dash",
    severity: "error",
    ruleRef: "2, 116",
    message: "Em dashes are not allowed anywhere.",
    pattern: /—/g,
    suggestion: "Use a full stop, comma, colon, parentheses, or a new sentence.",
  },
  {
    id: "banned_contrast_isnt",
    severity: "error",
    ruleRef: "3, 119",
    message:
      "Banned contrast structure (\"it's not X, it's Y\"). Write the contrast naturally.",
    pattern:
      /\b(it|this|that|the problem|the answer|the issue|the point)\s+(isn't|is not)\b[^.!?]{0,100}\.\s*(it's|it is|they're|that's)\b/gi,
  },
  {
    id: "banned_contrast_dont_need",
    severity: "error",
    ruleRef: "3, 119",
    message: "Banned contrast structure (\"you don't need X, you need Y\").",
    // Matches the third-person form too ("businesses don't need X. They need Y"),
    // which is example A in the writing rules document.
    pattern:
      /(?:don't|do not|doesn't|does not)\s+need\b[^.!?]{0,80}[.,!?]\s*(?:\w+\s+){0,2}needs?\b/gi,
  },
  {
    id: "banned_contrast_stop_start",
    severity: "error",
    ruleRef: "3",
    message: "Banned contrast structure (\"stop doing X, start doing Y\").",
    pattern: /\bstop\s+(thinking about|doing|chasing|building)\b[^.!?]{0,80}[.,]\s*start\b/gi,
  },
  {
    id: "banned_contrast_not_but",
    severity: "warning",
    ruleRef: "3, 119",
    message:
      "Possible overused \"not X but Y\" pattern. The critic should judge whether this is the rhetorical construction or ordinary grammar.",
    pattern: /\bnot\b[^.!?]{0,80}\bbut\b/gi,
  },
  {
    id: "mechanical_heading",
    severity: "warning",
    ruleRef: "31, 32",
    message:
      "Mechanical framework heading. The reader should not see the scaffolding.",
    pattern:
      /^\s*(problem|solution|result|takeaway|cta|tension|proof|lesson|hook|why this matters|here's why this matters|what this means)\s*:\s*$/gim,
  },
  {
    id: "colon_led_mini_list",
    severity: "warning",
    ruleRef: "60",
    message: "Colon-led mini list. Use prose or a genuine list.",
    pattern: /^\s*(the result|the outcome|the answer|the reality|the problem)\s*:\s*$/gim,
  },
  {
    id: "auto_ps_line",
    severity: "warning",
    ruleRef: "74",
    message: "P.S. line. Use only for a genuine secondary note.",
    pattern: /^\s*P\.?\s?S\.?[:\s]/gim,
  },
  {
    id: "all_caps_emphasis",
    severity: "warning",
    ruleRef: "72",
    message: "All-caps emphasis. Use sparingly and only where the tone requires it.",
    pattern: /\b[A-Z]{4,}(?:\s+[A-Z]{2,}){1,}\b/g,
  },
  {
    id: "serialisation",
    severity: "warning",
    ruleRef: "102",
    message: "Part numbering. Use only when the subject genuinely needs a series.",
    pattern: /^\s*part\s+\d+\s*[:.]?\s*$/gim,
  },
  {
    id: "decorative_symbols",
    severity: "warning",
    ruleRef: "71",
    message: "Decorative symbol list. Plain text and standard bullets are preferable.",
    pattern: /^\s*[→➡✅❌⭐]/gm,
  },
  {
    id: "hashtags",
    severity: "warning",
    ruleRef: "69",
    message: "Hashtags are not added by default.",
    pattern: /(^|\s)#[A-Za-z][A-Za-z0-9_]{1,}/g,
    requiresOption: "permitHashtags",
  },
  {
    id: "emoji",
    severity: "warning",
    ruleRef: "70",
    message: "Emoji are not added by default for professional LinkedIn posts.",
    pattern: new RegExp(DEFAULT_EMOJI.source, "gu"),
    requiresOption: "permitEmoji",
  },
  {
    id: "monday_morning_cliche",
    severity: "warning",
    ruleRef: "47",
    message: "Monday morning as a generic business scene. Rotate harmless examples.",
    pattern: /\bmonday morning\b/gi,
  },
];
