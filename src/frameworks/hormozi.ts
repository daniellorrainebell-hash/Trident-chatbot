/**
 * Hormozi commercial framework library.
 *
 * Source basis: publicly documented Acquisition.com frameworks from $100M Offers,
 * $100M Leads, $100M Money Models and the CLOSER sales framework.
 *
 * These are mechanisms, not a writing style. The system must never try to write
 * like Alex Hormozi (spec section 53, writing rule 63). Correct use of this
 * module makes the output clearer, not louder.
 */

import type { FrameworkDefinition } from "./types";

const HORMOZI_SOURCE = "Alex Hormozi / Acquisition.com";

export const HORMOZI_VALUE_EQUATION: FrameworkDefinition = {
  id: "hormozi_value_equation",
  name: "Value Equation",
  category: "commercial",
  source: HORMOZI_SOURCE,
  sourceFamily: "$100M Offers",
  sourceSummary:
    "Value is the dream outcome multiplied by the perceived likelihood of achievement, divided by the time delay multiplied by effort and sacrifice. Four levers: raise the dream outcome, raise perceived likelihood, reduce time delay, reduce effort and sacrifice.",
  appAdaptation:
    "Used as a diagnostic on commercial ideas, never as literal maths and never named in the copy. The engine asks which lever the post can honestly strengthen, then writes to that lever. Time-to-value and effort-reduction claims must come from stored offer data rather than from the model.",
  structure: [
    "Dream outcome",
    "Perceived likelihood of achievement",
    "Time delay",
    "Effort and sacrifice",
  ],
  bestFor: [
    "Offer posts",
    "Pricing posts",
    "Service positioning",
    "Technical founders describing features instead of results",
  ],
  allowedUse: ["conversion", "belief", "education"],
  misuseRisks: [
    "Inventing turnaround times to reduce apparent time delay.",
    "Claiming effort reduction the delivery model does not provide.",
    "Naming the framework in the post (writing rule 64).",
  ],
  rules: [
    "Time-to-value and effort claims must be sourced from the stored offer record.",
    "Prefer claim plus mechanism plus proof over claim plus assertion.",
  ],
  active: true,
};

export const HORMOZI_HRR: FrameworkDefinition = {
  id: "hormozi_hrr",
  name: "Hook, Retain, Reward",
  category: "quality",
  source: HORMOZI_SOURCE,
  sourceFamily: "$100M Leads",
  sourceSummary:
    "Give the audience a reason to start, keep them consuming, then deliver the value the hook promised. The reward must satisfy the hook. A longer piece can carry several hook, retain, reward units so the middle does not go flat.",
  appAdaptation:
    "Runs as a universal quality layer underneath whichever narrative framework was selected, rather than as a structure of its own. The critic checks all three: a reason to read, movement with no dead middle, and a payoff that answers the opening.",
  structure: ["Hook", "Retain", "Reward"],
  bestFor: ["Every post, as a quality check"],
  allowedUse: ["quality"],
  misuseRisks: [
    "Treating it as a post template rather than a quality layer.",
    "A hook the reward cannot satisfy.",
  ],
  active: true,
};

export const HORMOZI_OBJECTION_PREEMPTION: FrameworkDefinition = {
  id: "hormozi_objection_preemption",
  name: "Objection Preemption",
  category: "commercial",
  source: HORMOZI_SOURCE,
  sourceFamily: "$100M Offers",
  sourceSummary:
    "Eliminate objections before they are raised. Typical objections: too expensive, too complicated, too slow, lack of trust, no current need, an existing solution, no time, no internal skills, legal uncertainty, implementation risk.",
  appAdaptation:
    "The strategist names the single strongest objection and the post addresses it by teaching rather than by arguing. One to three objections maximum, and a post that tries to answer all ten becomes a brochure.",
  structure: [
    "Identify why the reader would not act",
    "Choose one to three objections",
    "Address them inside the argument",
  ],
  bestFor: ["Conversion posts", "Commercial education", "Service positioning"],
  allowedUse: ["conversion", "problem", "education"],
  misuseRisks: [
    "Inventing an objection nobody holds so it can be knocked down.",
    "Quoting the objection as spoken dialogue from a client who does not exist (writing rule 14).",
  ],
  rules: [
    "Frame a common objection as an objection, never as a quoted conversation.",
  ],
  active: true,
};

export const HORMOZI_STARVING_CROWD: FrameworkDefinition = {
  id: "hormozi_starving_crowd",
  name: "Market Selection (Starving Crowd)",
  category: "commercial",
  source: HORMOZI_SOURCE,
  sourceFamily: "$100M Offers",
  sourceSummary:
    "Four market indicators: massive pain, purchasing power, ease of targeting, and whether the market is growing. Market demand outranks offer strength, which outranks persuasion.",
  appAdaptation:
    "Used before hook work. If the idea is not attached to something the target buyer cares about, a better hook will not rescue it. Claims that a market is growing require research and are never inferred from a topic being popular.",
  structure: ["Massive pain", "Purchasing power", "Easy to target", "Growing"],
  bestFor: ["Commercial idea triage", "Audience selection"],
  allowedUse: ["conversion", "strategy"],
  misuseRisks: [
    "Asserting market growth without research.",
    "Writing for an audience that enjoys the topic but cannot buy.",
  ],
  rules: ["Market growth claims require verification before they appear in copy."],
  active: true,
};

export const HORMOZI_MAGIC_NAMING: FrameworkDefinition = {
  id: "hormozi_magic_naming",
  name: "MAGIC Naming Formula",
  category: "commercial",
  source: HORMOZI_SOURCE,
  sourceFamily: "$100M Offers",
  sourceSummary:
    "Magnet, Avatar, Goal, Interval, Container. A reason to pay attention now, who it is for, the desired outcome, the timeframe and the package word. Not every name needs all five.",
  appAdaptation:
    "Used to name an offer or asset when the user asks for one. The structure is borrowed; the wording must be original. An interval only appears in a name when that timeframe is genuinely true of the delivery.",
  structure: ["Magnet", "Avatar", "Goal", "Interval", "Container"],
  bestFor: ["Offer naming", "Lead magnet naming", "Service announcements"],
  allowedUse: ["conversion"],
  misuseRisks: [
    "Imitating the source creator's naming wording.",
    "Putting a timeframe in a name that delivery cannot meet.",
    "Using a false promotional magnet.",
  ],
  rules: [
    "Interval may only be used when the timeframe is genuinely true.",
    "Keep the name short enough to understand at a glance.",
  ],
  active: true,
};

export const HORMOZI_DELIVERY_CUBE: FrameworkDefinition = {
  id: "hormozi_delivery_cube",
  name: "Delivery Cube",
  category: "commercial",
  source: HORMOZI_SOURCE,
  sourceFamily: "$100M Offers",
  sourceSummary:
    "Six dimensions for generating alternative ways to fulfil value: personal attention, client effort (DIY, done with you, done for you), live delivery medium, recorded consumption, speed and support, and the 10x / one-tenth test.",
  appAdaptation:
    "Used for delivery and tiering posts, and as an ideation engine. The 10x question (what would this include at ten times the price) and the one-tenth question (what would still be useful at a tenth) each generate genuine content topics. Service levels must match what the business actually offers.",
  structure: [
    "Personal attention",
    "Client effort",
    "Live delivery medium",
    "Recorded consumption",
    "Speed, convenience and support",
    "10x and one-tenth test",
  ],
  bestFor: ["Delivery posts", "Tiered offer posts", "Idea generation"],
  allowedUse: ["conversion", "education"],
  misuseRisks: [
    "Promising response times or service levels that are not operationally true.",
    "Describing tiers the business does not sell.",
  ],
  rules: ["Never state an SLA in content unless it is operationally true."],
  active: true,
};

export const HORMOZI_TRIM_AND_STACK: FrameworkDefinition = {
  id: "hormozi_trim_and_stack",
  name: "Trim and Stack",
  category: "commercial",
  source: HORMOZI_SOURCE,
  sourceFamily: "$100M Offers",
  sourceSummary:
    "Assess perceived value against cost to deliver. Remove low-value components, prioritise high-value and low-cost assets, keep high-value and high-cost components selectively, then stack what remains.",
  appAdaptation:
    "Applied to content as an editing rule. Pick the three to five strongest components, name them clearly, connect each to an objection or outcome, and cut the rest. Never list seventeen weak features.",
  structure: ["Assess value", "Assess delivery cost", "Trim", "Stack"],
  bestFor: ["Offer posts", "Feature explanation"],
  allowedUse: ["conversion"],
  misuseRisks: [
    "Attaching fabricated monetary values to stack components.",
    "Listing every deliverable rather than the strongest few.",
  ],
  rules: [
    "Monetary values may only appear where defensible from stored offer data.",
  ],
  active: true,
};

export const HORMOZI_GUARANTEES: FrameworkDefinition = {
  id: "hormozi_guarantees",
  name: "Four Guarantee Types",
  category: "commercial",
  source: HORMOZI_SOURCE,
  sourceFamily: "$100M Offers",
  sourceSummary:
    "Unconditional, conditional, anti-guarantee and implied or performance-based. Each places risk differently between buyer and seller.",
  appAdaptation:
    "The engine may explain or present a guarantee that already exists and is marked approved in the offer record. It must never create one on the business's behalf. An unapproved guarantee is not a drafting decision.",
  structure: ["Unconditional", "Conditional", "Anti-guarantee", "Implied or performance-based"],
  bestFor: ["Risk reversal posts", "Conversion posts"],
  allowedUse: ["conversion"],
  misuseRisks: ["Inventing a guarantee.", "Restating approved terms inaccurately."],
  rules: [
    "Only a guarantee with approved set to true may appear in a post.",
    "Terms must be reproduced from the offer record, not paraphrased into something stronger.",
  ],
  active: true,
};

export const HORMOZI_SCARCITY_URGENCY: FrameworkDefinition = {
  id: "hormozi_scarcity_urgency",
  name: "Scarcity and Urgency",
  category: "commercial",
  source: HORMOZI_SOURCE,
  sourceFamily: "$100M Offers",
  sourceSummary:
    "Scarcity is a quantity constraint. Urgency is a time constraint. The distinction matters and should be preserved.",
  appAdaptation:
    "Both are gated behind verified data. The generator may only reference scarcity or urgency when the stored record is marked active and carries a verification timestamp. Everything else is manufactured pressure.",
  structure: ["Scarcity: quantity constraint", "Urgency: time constraint"],
  bestFor: ["Conversion posts with a genuine constraint"],
  allowedUse: ["conversion"],
  misuseRisks: [
    "Fake countdowns, fake deadlines, fake expiring bonuses, fake spot counts.",
  ],
  rules: [
    "Requires an active, verified scarcity or urgency record.",
    "Never generate a spot count the system cannot evidence.",
  ],
  active: true,
};

export const HORMOZI_MORE_BETTER_NEW: FrameworkDefinition = {
  id: "hormozi_more_better_new",
  name: "More, Better, New",
  category: "commercial",
  source: HORMOZI_SOURCE,
  sourceFamily: "$100M Leads",
  sourceSummary:
    "Do more of what works, improve what works, and only then try something new. Guards against novelty addiction.",
  appAdaptation:
    "Drives the future performance recommendation engine. If a topic performs, recommend more. If volume is high but conversion weak, recommend better. If both have plateaued, recommend new. Every recommendation carries its sample size.",
  structure: ["More", "Better", "New"],
  bestFor: ["Performance analysis", "Content planning"],
  allowedUse: ["strategy"],
  misuseRisks: [
    "Concluding a topic is exhausted from one post.",
    "Presenting a small sample as certainty (spec section 64).",
  ],
  rules: ["Every recommendation must state its sample size."],
  active: true,
};

export const HORMOZI_GIVE_UNTIL_THEY_ASK: FrameworkDefinition = {
  id: "hormozi_give_until_they_ask",
  name: "Give Until They Ask / Give in Public, Ask in Private",
  category: "commercial",
  source: HORMOZI_SOURCE,
  sourceFamily: "$100M Leads",
  sourceSummary:
    "Build goodwill by giving more value than is extracted. Build reputation in public and handle commercial discussion in private once interest exists.",
  appAdaptation:
    "Governs the content mix. The user picks growth bias, balanced or conversion bias, and the engine still prevents every post becoming a pitch. Integrated asks (a small CTA inside a valuable piece) and intermittent asks (occasional dedicated offer posts) are both available.",
  structure: ["Public value", "Private commercial conversation"],
  bestFor: ["Content mix planning"],
  allowedUse: ["strategy", "conversion"],
  misuseRisks: ["Reading it as a ban on public CTAs."],
  active: true,
};

export const HORMOZI_CLOSER: FrameworkDefinition = {
  id: "hormozi_closer",
  name: "CLOSER",
  category: "commercial",
  source: HORMOZI_SOURCE,
  sourceFamily: "Sales",
  sourceSummary:
    "Clarify why they are here, Label the problem, Overview past experience and pain, Sell the destination, Explain concerns, Reinforce the decision.",
  appAdaptation:
    "A sales conversation framework, not a post framework. Used as commercial reasoning behind a conversion post rather than as six visible sections. A post that walks all six reads like a script.",
  structure: ["Clarify", "Label", "Overview", "Sell", "Explain", "Reinforce"],
  bestFor: ["Conversion posts", "Commercial reasoning"],
  allowedUse: ["conversion"],
  misuseRisks: ["Mechanically running all six stages in a post."],
  rules: ["Never structure a post as six labelled CLOSER stages."],
  active: true,
};

/** Offer post structures. Selected only for genuinely commercial ideas. */
export const HORMOZI_POST_FRAMEWORKS: FrameworkDefinition[] = [
  {
    id: "hormozi_post_value_equation",
    name: "Offer Post: Value Equation",
    category: "narrative",
    source: HORMOZI_SOURCE,
    sourceFamily: "$100M Offers",
    sourceSummary:
      "Hook, dream outcome, what makes success more likely, what makes it faster, what effort is removed, proof, CTA.",
    appAdaptation:
      "Used when the audience misunderstands the value of an offer. Each lever needs support from the stored offer record.",
    structure: [
      "Hook",
      "Dream outcome",
      "What makes success more likely",
      "What makes it faster",
      "What effort is removed",
      "Proof",
      "CTA",
    ],
    bestFor: ["Offer posts where value is misunderstood"],
    allowedUse: ["conversion"],
    misuseRisks: ["Filling the speed and effort stages with unsupported claims."],
    active: true,
  },
  {
    id: "hormozi_post_objection_collapse",
    name: "Offer Post: Objection Collapse",
    category: "narrative",
    source: HORMOZI_SOURCE,
    sourceFamily: "$100M Offers",
    sourceSummary:
      "Hook the objection, why it exists, why the old approach creates it, what the offer changes, proof, CTA.",
    appAdaptation:
      "The strongest commercial structure in this library because it teaches rather than argues. Preferred when a single dominant objection blocks the sale.",
    structure: [
      "Hook the objection",
      "Why it exists",
      "Why the old approach creates it",
      "What the offer changes",
      "Proof",
      "CTA",
    ],
    bestFor: ["Conversion posts with one dominant objection"],
    allowedUse: ["conversion", "education"],
    misuseRisks: ["Straw-manning the objection instead of taking it seriously."],
    active: true,
  },
  {
    id: "hormozi_post_outcome_vs_mechanism",
    name: "Offer Post: Dream Outcome vs Mechanism",
    category: "narrative",
    source: HORMOZI_SOURCE,
    sourceFamily: "$100M Offers",
    sourceSummary:
      "Stop selling the mechanism, name the outcome, show the mechanism, show why it is believable, CTA.",
    appAdaptation:
      "Useful for technical founders who describe features instead of results. The mechanism still appears, after the outcome, as the reason to believe it.",
    structure: [
      "Name the outcome",
      "Show the mechanism",
      "Show why it is believable",
      "CTA",
    ],
    bestFor: ["Technical products", "Feature-led positioning"],
    allowedUse: ["conversion", "education"],
    misuseRisks: ["Dropping the mechanism entirely and leaving an unsupported promise."],
    active: true,
  },
  {
    id: "hormozi_post_time_effort_flip",
    name: "Offer Post: Time and Effort Flip",
    category: "narrative",
    source: HORMOZI_SOURCE,
    sourceFamily: "$100M Offers",
    sourceSummary:
      "Hook, the current process is slow or hard, identify the friction, show how it is removed, show the result, CTA.",
    appAdaptation:
      "Strong for automation content, where the friction is concrete and observable. The result stage needs real evidence.",
    structure: [
      "Hook",
      "Current process is slow or hard",
      "Identify the friction",
      "Show how it is removed",
      "Show the result",
      "CTA",
    ],
    bestFor: ["Automation content", "Process improvement"],
    allowedUse: ["conversion", "proof", "education"],
    misuseRisks: ["Quantifying time saved without data."],
    active: true,
  },
  {
    id: "hormozi_post_delivery_choice",
    name: "Offer Post: Done-For-You vs DIY",
    category: "narrative",
    source: HORMOZI_SOURCE,
    sourceFamily: "$100M Offers",
    sourceSummary:
      "Problem, DIY option, done-with-you option, done-for-you option, who each is for, CTA.",
    appAdaptation:
      "Only available where the business genuinely offers tiers. The strategist checks the stored offer record before selecting it.",
    structure: [
      "Problem",
      "DIY option",
      "Done-with-you option",
      "Done-for-you option",
      "Who each is for",
      "CTA",
    ],
    bestFor: ["Tiered service businesses"],
    allowedUse: ["conversion"],
    misuseRisks: ["Describing tiers that do not exist."],
    rules: ["Requires tiers present in the stored offer record."],
    active: true,
  },
  {
    id: "hormozi_post_risk_reversal",
    name: "Offer Post: Risk Reversal",
    category: "narrative",
    source: HORMOZI_SOURCE,
    sourceFamily: "$100M Offers",
    sourceSummary:
      "Buyer risk, why it matters, how the offer shares or removes risk, terms, proof, CTA.",
    appAdaptation:
      "Gated behind an approved guarantee. Without one, the strategist selects a different structure rather than softening the terms into something vague.",
    structure: [
      "Buyer risk",
      "Why it matters",
      "How the offer shares or removes risk",
      "Terms",
      "Proof",
      "CTA",
    ],
    bestFor: ["Conversion posts with an approved guarantee"],
    allowedUse: ["conversion"],
    misuseRisks: ["Presenting an unapproved or invented guarantee."],
    rules: ["Requires an approved guarantee in the offer record."],
    active: true,
  },
];

export const HORMOZI_FRAMEWORKS: FrameworkDefinition[] = [
  HORMOZI_VALUE_EQUATION,
  HORMOZI_HRR,
  HORMOZI_OBJECTION_PREEMPTION,
  HORMOZI_STARVING_CROWD,
  HORMOZI_MAGIC_NAMING,
  HORMOZI_DELIVERY_CUBE,
  HORMOZI_TRIM_AND_STACK,
  HORMOZI_GUARANTEES,
  HORMOZI_SCARCITY_URGENCY,
  HORMOZI_MORE_BETTER_NEW,
  HORMOZI_GIVE_UNTIL_THEY_ASK,
  HORMOZI_CLOSER,
  ...HORMOZI_POST_FRAMEWORKS,
];

/** Frameworks gated behind stored, approved commercial data. */
export const OFFER_DATA_GATED_FRAMEWORKS = new Set<string>([
  "hormozi_post_risk_reversal",
  "hormozi_post_delivery_choice",
  "hormozi_guarantees",
  "hormozi_scarcity_urgency",
]);

/** The anti-hype guardrail. Passed to the critic whenever this module is active. */
export const HORMOZI_ANTI_HYPE_GUARDRAIL =
  "These frameworks should make the writing clearer, not louder. Correct use produces a specific problem, a clear cost and an implied solution. Incorrect use produces volume and unsupported claims.";
