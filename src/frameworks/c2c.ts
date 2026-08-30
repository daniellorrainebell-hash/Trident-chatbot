/**
 * The Content Formula / C2C framework.
 *
 * Source: The Content Formula C2C interactive workbook.
 *
 * Core principles carried into the engine:
 *   Connection beats polish.
 *   The brand is exposed and organised, never invented.
 *   Content needs movement: problem, friction, proof, shift in thinking, next step.
 */

import type { FrameworkDefinition } from "./types";

export const C2C_CONTENT_ENGINE: FrameworkDefinition = {
  id: "c2c_content_engine",
  name: "C2C Content Engine",
  category: "narrative",
  source: "The Content Formula / C2C workbook",
  sourceSummary:
    "Observation, Problem, Tension, Proof, Lesson, Action. The observation is what happened, changed, annoyed or became noticeable. The problem is what the observation reveals. Tension is the consequence, cost, conflict or pressure. Proof makes the argument believable. The lesson is a better way to think. The action is the next step.",
  appAdaptation:
    "Chosen when the idea starts from something the user noticed rather than from a claim they want to make. The observation stage keeps the post anchored to a real trigger, which is why this framework is preferred for behind-the-scenes and proof-led material.",
  structure: ["Observation", "Problem", "Tension", "Proof", "Lesson", "Action"],
  bestFor: [
    "Observation-led ideas",
    "Behind the scenes",
    "Proof posts",
    "Problem posts",
  ],
  allowedUse: ["problem", "proof", "behind_the_scenes", "belief"],
  misuseRisks: [
    "Running the six stages as six visible paragraphs.",
    "Filling the proof stage with authority language because no real proof exists.",
  ],
  rules: [
    "The proof stage requires real evidence. If none exists, record a proof gap rather than writing around it.",
    "Stages must not appear as headings.",
  ],
  active: true,
};

export const C2C_POST_FORMULA: FrameworkDefinition = {
  id: "c2c_post_formula",
  name: "C2C General Post Formula",
  category: "narrative",
  source: "The Content Formula / C2C workbook",
  sourceSummary:
    "Hook, Problem, Tension, Proof, Lesson, CTA. Say something specific that makes the right person stop, describe the issue in plain language, explain what it is costing, give evidence, provide the better way to think, give one next step.",
  appAdaptation:
    "The engine's default narrative structure for problem-led and commercial ideas. It is the most broadly applicable framework in the library, which makes it the one most at risk of becoming the house template. The strategist tracks recent framework use and varies deliberately.",
  structure: ["Hook", "Problem", "Tension", "Proof", "Lesson", "CTA"],
  bestFor: [
    "Expensive problems",
    "Commercial posts",
    "Educational posts",
    "Belief posts with a practical payload",
  ],
  allowedUse: ["problem", "conversion", "education", "belief", "proof"],
  misuseRisks: [
    "Becoming the default for every idea until output stops varying.",
    "Adding a CTA because the structure ends with one rather than because the post earned it.",
  ],
  rules: [
    "The CTA stage may be empty. One CTA maximum, and none where none is earned.",
    "The body must fulfil the hook.",
  ],
  active: true,
};

export interface AudienceStage {
  id: "awareness" | "connection" | "trust" | "intent" | "action";
  readerState: string;
  mechanisms: string[];
}

export const C2C_AUDIENCE_JOURNEY_STAGES: AudienceStage[] = [
  {
    id: "awareness",
    readerState: "They notice you.",
    mechanisms: ["Strong hook", "Clear problem", "Relevant label", "Pattern interruption"],
  },
  {
    id: "connection",
    readerState: "They relate to you.",
    mechanisms: ["Story", "Shared worldview", "Honest experience", "Behind the scenes"],
  },
  {
    id: "trust",
    readerState: "They believe you.",
    mechanisms: ["Proof", "Examples", "Results", "Specific detail", "Reasoning"],
  },
  {
    id: "intent",
    readerState: "They want help or want the outcome.",
    mechanisms: [
      "Cost of inaction",
      "Better future",
      "Clear solution",
      "Demonstrated competence",
    ],
  },
  {
    id: "action",
    readerState: "They enquire or take the next step.",
    mechanisms: ["One CTA", "DM", "Link", "Call", "Download", "Specific instruction"],
  },
];

export const C2C_AUDIENCE_JOURNEY: FrameworkDefinition = {
  id: "c2c_audience_journey",
  name: "C2C Audience Journey",
  category: "journey",
  source: "The Content Formula / C2C workbook",
  sourceSummary:
    "Awareness, Connection, Trust, Intent, Action. Each stage describes a different reader state and responds to different mechanisms.",
  appAdaptation:
    "The strategist identifies which single stage a post primarily serves, and that choice constrains the CTA. An awareness post that ends with a booking link is asking for a decision the reader has not reached.",
  structure: C2C_AUDIENCE_JOURNEY_STAGES.map((stage) => stage.id),
  bestFor: ["Every post. Used as a classifier rather than a structure."],
  allowedUse: ["strategy"],
  misuseRisks: [
    "Treating every post as a conversion post.",
    "Matching an action-stage CTA to an awareness-stage reader.",
  ],
  active: true,
};

export type ContentPillarId =
  | "problem"
  | "proof"
  | "belief"
  | "behind_the_scenes"
  | "conversion"
  | "opinion";

export interface ContentPillar {
  id: ContentPillarId;
  name: string;
  purpose: string;
  guidance: string[];
}

export const C2C_CONTENT_PILLARS: ContentPillar[] = [
  {
    id: "problem",
    name: "Problem Posts",
    purpose: "Attention and pain recognition",
    guidance: [
      "Call out expensive or meaningful problems the audience may not have noticed.",
      "Angles: hidden cost, broken assumption, revenue leakage, operational problem.",
    ],
  },
  {
    id: "proof",
    name: "Proof Posts",
    purpose: "Trust and evidence",
    guidance: [
      "Use results, before and after, screenshots, lessons, reviews, client outcomes.",
      "Requires real evidence. Never synthesise a result to fill the pillar.",
    ],
  },
  {
    id: "belief",
    name: "Belief Posts",
    purpose: "Positioning and authority",
    guidance: [
      "Explain what the user genuinely believes about their subject.",
      "The belief must come from the user's stored positioning, not from the model.",
    ],
  },
  {
    id: "behind_the_scenes",
    name: "Behind-the-Scenes Posts",
    purpose: "Connection and reality",
    guidance: [
      "Show process, decisions, work, failed attempts, changes, reasoning, testing.",
      "Show the thinking, not only the finished output.",
    ],
  },
  {
    id: "conversion",
    name: "Conversion Posts",
    purpose: "Sales and action",
    guidance: [
      "Direct offers, audits, calls, demos, lead magnets, announcements, availability.",
      "Requires a stored, approved offer. Never assemble an offer from old posts.",
    ],
  },
  {
    id: "opinion",
    name: "Opinion Posts",
    purpose: "Differentiation and voice",
    guidance: [
      "Say something useful that competitors avoid saying.",
      "Be useful, but do not be beige. Do not force controversy for attention.",
    ],
  },
];

export const C2C_STORY_ELEMENTS: FrameworkDefinition = {
  id: "c2c_story_elements",
  name: "C2C Story Principles",
  category: "narrative",
  source: "The Content Formula / C2C workbook",
  sourceSummary:
    "Villain, Hero, Proof, Payoff. The villain need not be a person: it can be a bad belief, a broken system, a lazy industry habit, an outdated assumption or an inefficient process. The hero is the better idea, process, behaviour, system or principle. Proof is what was built, tested, seen, changed or learned. The payoff is what the reader should do with the lesson.",
  appAdaptation:
    "Used to give a post a spine when the idea is an argument rather than an event. Naming the villain as a habit or assumption keeps the post from becoming an attack on a competitor.",
  structure: ["Villain", "Hero", "Proof", "Payoff"],
  bestFor: ["Opinion posts", "Belief posts", "Positioning"],
  allowedUse: ["opinion", "belief", "problem"],
  misuseRisks: [
    "Making a named company or person the villain.",
    "Casting the user's own service as the hero in every post.",
  ],
  active: true,
};

export const C2C_INSPIRATION_RULE: string[] = [
  "Take inspiration from outside the user's niche: films, sport, customer service, restaurants, fashion, technology, other industries, culture.",
  "Do not copy the wording. Copy the mechanism.",
  "Adapt it to the audience and make it sound like the user.",
];

/**
 * Relative priority scores from the workbook.
 *
 * These are source heuristics, not scientific constants. They weight the
 * critic's quality assessment and remain editable.
 */
export const C2C_PRIORITY_HEURISTICS: Record<string, number> = {
  story_and_tension: 96,
  human_connection: 93,
  proof_and_examples: 91,
  clear_opinion: 88,
  visual_polish: 64,
  posting_frequency: 58,
};

/** Old habit to better approach rules from the workbook. */
export const C2C_HABIT_CORRECTIONS: Array<{
  habit: string;
  better: string;
}> = [
  {
    habit: "Post a generic piece of advice.",
    better: "Turn it into a story with a problem and a consequence.",
  },
  {
    habit: "Sound corporate for credibility.",
    better: "Use plain language, human detail and a clear opinion.",
  },
  {
    habit: "Show only the finished work.",
    better:
      "Show the thinking, the failed attempts, the decisions, the reasoning and why something changed.",
  },
  {
    habit: "Copy the niche.",
    better: "Borrow structure from elsewhere and translate it.",
  },
  {
    habit: "End without direction.",
    better: "Give one clear action.",
  },
];

/** Quality control checklist. Consumed by the critic agent. */
export const C2C_QUALITY_CHECKLIST: string[] = [
  "Does it have a clear point?",
  "Does it sound like a real person wrote it?",
  "Does it contain a problem, example or opinion?",
  "Does it move the reader closer to trust or action?",
  "Is it just information with no story or movement?",
  "Does it sound like generic AI filler?",
  "Did the body fulfil the hook?",
  "Is there unnecessary repetition?",
  "Is the insight obvious?",
  "Is the CTA appropriate?",
  "Are any claims unsupported?",
  "Does the post contain fake personal experience?",
  "Has a framework become too visible?",
  "Does it feel mechanically templated?",
  "Is there enough specificity?",
];

export const C2C_FRAMEWORKS: FrameworkDefinition[] = [
  C2C_CONTENT_ENGINE,
  C2C_POST_FORMULA,
  C2C_AUDIENCE_JOURNEY,
  C2C_STORY_ELEMENTS,
];
