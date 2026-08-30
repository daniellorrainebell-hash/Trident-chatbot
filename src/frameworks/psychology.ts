/**
 * LinkedIn Psychological Trigger Framework.
 *
 * These are strategic mechanisms for improving relevance, tension and reader
 * motivation. The system does not claim they guarantee virality, and the copy
 * must never name them (writing rule 85: no "psychology says", rule 86: no
 * unsourced neuroscience).
 *
 * Psychology is selected before copy is written. The writing is downstream of
 * the psychological objective.
 */

import type { FrameworkDefinition, PsychologyTrigger } from "./types";

export const COGNITIVE_FLUENCY: PsychologyTrigger = {
  id: "cognitive_fluency",
  name: "Cognitive Fluency",
  category: "psychology",
  source: "LinkedIn Psychological Trigger Framework",
  sourceSummary:
    "People are more likely to process and trust information that is easy to understand.",
  appAdaptation:
    "Reduce load created by poor writing, not load created by the subject. Technical language stays where the audience needs it.",
  application: [
    "Short sentences.",
    "Plain language.",
    "White space between changes of thought.",
    "Avoid unnecessary jargon.",
    "One idea per paragraph where the material allows.",
  ],
  pairsWith: ["list", "command", "c2c_post_formula", "psych_slay_variant"],
  bestFor: ["Educational posts", "Technical explanation", "Tactical breakdowns"],
  allowedUse: ["education", "problem", "proof"],
  misuseRisks: [
    "Confusing fluency with writing down to the reader.",
    "Stripping technical detail a technical audience needs (writing rule 79).",
    "Producing a wall of one-line paragraphs (writing rule 35).",
  ],
  active: true,
};

export const INFORMATION_GAP: PsychologyTrigger = {
  id: "information_gap",
  name: "Information Gap and Curiosity Loop",
  category: "psychology",
  source: "LinkedIn Psychological Trigger Framework",
  sourceSummary:
    "Create a gap between what the reader knows and what they want to know.",
  appAdaptation:
    "Reveal enough to establish relevance, then delay the mechanism rather than the context. Curiosity has to come from substance, and the body must close the loop.",
  application: [
    "Reveal enough to create relevance.",
    "Delay the mechanism or the answer, never the basic context.",
    "Close the loop explicitly in the body.",
  ],
  pairsWith: ["statement", "story_opener", "exclamation"],
  bestFor: [
    "Counter-intuitive findings",
    "Research findings",
    "Before and after posts",
  ],
  allowedUse: ["problem", "belief", "proof", "education"],
  misuseRisks: [
    "Withholding basic information to force a \"see more\" click (writing rule 25).",
    "Opening a loop the body never closes.",
  ],
  active: true,
};

export const LOSS_AVERSION: PsychologyTrigger = {
  id: "loss_aversion",
  name: "Loss Aversion and Cost of Inaction",
  category: "psychology",
  source: "LinkedIn Psychological Trigger Framework",
  sourceSummary:
    "Show what the reader risks losing by failing to address a problem.",
  appAdaptation:
    "Name the cost the problem is already creating rather than only describing the win. The consequence must be real and stated without melodrama, and enforcement or disaster must never be presented as inevitable.",
  application: [
    "State what the unresolved problem is already costing.",
    "Explain the mechanism by which the cost occurs.",
    "Keep the consequence proportionate to the evidence.",
  ],
  pairsWith: ["statement", "conditional", "command", "c2c_post_formula"],
  bestFor: [
    "Governance",
    "Security",
    "Revenue leakage",
    "Missed leads",
    "Operational inefficiency",
    "Compliance",
    "Customer churn",
  ],
  allowedUse: ["problem", "conversion", "belief"],
  misuseRisks: [
    "Generic fear marketing with no real consequence (writing rule 51).",
    "Shaming the reader into action (writing rule 50).",
    "Implying enforcement is certain when it is not.",
  ],
  active: true,
};

export const STATUS_AND_IDENTITY: PsychologyTrigger = {
  id: "status_identity",
  name: "Status Signalling and Identity",
  category: "psychology",
  source: "LinkedIn Psychological Trigger Framework",
  sourceSummary:
    "People engage with and share ideas that reinforce how they want to be perceived.",
  appAdaptation:
    "Give the reader language worth adopting and framing worth repeating. Never manufacture superiority or imply the reader is behind.",
  application: [
    "Give readers language they can adopt.",
    "Frame the idea around professional identity.",
    "Allow the reader to signal competence or foresight.",
  ],
  pairsWith: ["label", "conditional", "lara_slay"],
  bestFor: ["Belief posts", "Opinion posts", "Positioning"],
  allowedUse: ["belief", "opinion", "conversion"],
  misuseRisks: [
    "Manufactured superiority.",
    "Status shaming (writing rule 50).",
    "Preaching (writing rule 49).",
  ],
  active: true,
};

export const RECIPROCITY: PsychologyTrigger = {
  id: "reciprocity",
  name: "Reciprocity",
  category: "psychology",
  source: "LinkedIn Psychological Trigger Framework",
  sourceSummary:
    "Give the reader genuine useful value before asking for an action.",
  appAdaptation:
    "The value has to stand alone. A framework, checklist, specific lesson or implementation step that would still be useful if the CTA were removed.",
  application: [
    "Give a framework, checklist, lesson, template or implementation step.",
    "Make the value complete rather than a teaser for the paid version.",
  ],
  pairsWith: ["list", "psych_slay_variant", "c2c_post_formula"],
  bestFor: ["Educational posts", "Lead generation", "Trust building"],
  allowedUse: ["education", "conversion", "proof"],
  misuseRisks: [
    "Deliberately incomplete value designed to force an enquiry.",
    "Announcing the value instead of delivering it (writing rule 105).",
  ],
  active: true,
};

export const CHOICE_REDUCTION: PsychologyTrigger = {
  id: "choice_reduction",
  name: "Choice Reduction",
  category: "psychology",
  source: "LinkedIn Psychological Trigger Framework",
  sourceSummary: "End with one clear action rather than several competing CTAs.",
  appAdaptation:
    "One CTA maximum by default. The CTA must match the post, and a post with nothing to ask for should end without one.",
  application: [
    "Select a single next step.",
    "Match the ask to the value delivered.",
    "Allow no CTA where none is earned.",
  ],
  pairsWith: ["conversion", "c2c_post_formula"],
  bestFor: ["Conversion posts", "Lead generation"],
  allowedUse: ["conversion", "education", "problem"],
  misuseRisks: [
    "Stacking comment, DM, follow, download, book and visit into one ending.",
    "Bolting a sales CTA onto a personal reflection (writing rule 23).",
  ],
  active: true,
};

export const PSYCHOLOGY_TRIGGERS: PsychologyTrigger[] = [
  COGNITIVE_FLUENCY,
  INFORMATION_GAP,
  LOSS_AVERSION,
  STATUS_AND_IDENTITY,
  RECIPROCITY,
  CHOICE_REDUCTION,
];

/**
 * Hormozi-style structural hook patterns from the uploaded psychology document.
 *
 * Stored as structural patterns only. The system must not imitate Alex Hormozi's
 * personal writing voice (spec section 9, section 53).
 */

export const HORMOZI_CALLOUT_HIGH_STAKES: FrameworkDefinition = {
  id: "hormozi_callout_high_stakes",
  name: "Call-Out and High Stakes",
  category: "hook_pattern",
  source: "Alex Hormozi (structural pattern, via uploaded psychology document)",
  sourceSummary:
    "Names an avatar in a specific situation and instructs them to stop a costly behaviour. Mechanisms: self-referencing, identity, loss aversion, urgency.",
  appAdaptation:
    "Used as a shape for a call-out opening. The avatar and the behaviour must both be real. Final prose sounds like the user, never like the source creator.",
  structure: ["Name the avatar", "Name the situation", "Name the costly behaviour"],
  bestFor: ["Conversion posts", "Problem posts", "Commercial education"],
  allowedUse: ["conversion", "problem"],
  misuseRisks: [
    "Imitating the source creator's voice rather than borrowing the structure.",
    "Manufacturing stakes that do not exist.",
  ],
  rules: [
    "Do not reproduce the source creator's distinctive phrasing.",
    "The avatar must be an audience the user genuinely serves.",
  ],
  active: true,
};

export const HORMOZI_UNPOPULAR_TRUTH: FrameworkDefinition = {
  id: "hormozi_unpopular_truth",
  name: "Unpopular Truth",
  category: "hook_pattern",
  source: "Alex Hormozi (structural pattern, via uploaded psychology document)",
  sourceSummary:
    "Names common advice, then explains why it hurts the outcome. Mechanisms: pattern interruption, contrarian tension, information gap.",
  appAdaptation:
    "Only available when a genuinely common belief exists and the user has a defensible argument against it. The engine does not manufacture an opposing consensus to make the user sound bold.",
  structure: ["Name the common advice", "Explain why it damages the outcome", "Give the better reasoning"],
  bestFor: ["Opinion posts", "Belief posts"],
  allowedUse: ["opinion", "belief"],
  misuseRisks: [
    "Fabricating a consensus nobody actually holds (writing rule 27).",
    "Contrarianism as a pose rather than a position.",
  ],
  rules: [
    "Requires evidence that the common advice is genuinely common.",
    "Do not open with \"Everyone says\" or \"The industry wants you to believe\" without support.",
  ],
  active: true,
};

export const HORMOZI_COUNTER_INTUITION: FrameworkDefinition = {
  id: "hormozi_counter_intuition",
  name: "Visual Counter-Intuition",
  category: "hook_pattern",
  source: "Alex Hormozi (structural pattern, via uploaded psychology document)",
  sourceSummary:
    "States the time, money or effort spent learning something, then compresses the lesson. Mechanisms: specificity, cost, curiosity, value compression.",
  appAdaptation:
    "Requires a real, user-supplied figure for the spend or the time. The engine never invents the cost that makes this pattern work, which means the pattern is simply unavailable without that input.",
  structure: ["State the real cost of learning", "Compress the lesson", "Make it usable"],
  bestFor: ["Proof posts", "Lessons from real work"],
  allowedUse: ["proof", "education"],
  misuseRisks: [
    "Inventing spend, time, numbers or experience.",
    "Implying a scale of experience the user does not have (writing rule 90).",
  ],
  rules: [
    "Never invent the spend, the time or the experience.",
    "Unavailable when the user has supplied no real figure.",
  ],
  active: true,
};

export const HORMOZI_HOOK_PATTERNS: FrameworkDefinition[] = [
  HORMOZI_CALLOUT_HIGH_STAKES,
  HORMOZI_UNPOPULAR_TRUTH,
  HORMOZI_COUNTER_INTUITION,
];
