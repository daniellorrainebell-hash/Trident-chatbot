/**
 * Nexus IQ Systems Hook Library.
 *
 * Source: Nexus IQ Systems interactive Hook Library (7 hook types, 42 examples).
 *
 * Governing principle: stop the scroll before you sell the message. Write the
 * hook first and build the content around the promise, tension or question it
 * creates. Never use a hook the body cannot deliver.
 */

import type { HookFamilyDefinition } from "./types";

const SHARED_MISUSE: string[] = [
  "Generating a hook the body cannot fulfil.",
  "Copying a source example rather than borrowing its shape.",
  "Reaching for the same family on every post until the output has one register.",
];

export const STATEMENT_HOOK: HookFamilyDefinition = {
  id: "statement",
  name: "Statement Hook",
  category: "hook",
  purpose: "Challenge",
  source: "Nexus IQ Systems Hook Library",
  sourceSummary:
    "A direct, bold observation aimed at a recognisable problem. It creates mild discomfort by describing the reader's situation accurately, then implies the content holds the reason or the solution.",
  appAdaptation:
    "Default family for problem and belief posts aimed at a pain-aware audience. The observation must describe something the reader can verify about their own operation, otherwise it reads as a generic swipe.",
  mechanism: "Observation the reader recognises, mild discomfort, implied answer.",
  formula: "Observation + Mild Discomfort + Implied Answer",
  bestFor: [
    "Problem posts",
    "Belief posts",
    "Contrarian posts",
    "Commercial education",
    "Pain-aware audiences",
  ],
  allowedUse: ["problem", "belief", "opinion", "conversion", "proof"],
  misuseRisks: [
    ...SHARED_MISUSE,
    "Stating a problem so broad that every reader nods and nobody self-selects.",
    "Accusing the reader rather than describing the situation.",
  ],
  rules: [
    "The observation must be specific enough that a reader could disagree with it.",
    "The implied answer must actually appear in the body.",
  ],
  examples: [
    "If your content gets views but no enquiries, you're attracting attention from the wrong people.",
    "If every sales call ends with \"I'll think about it\", your offer isn't clear enough.",
    "The reason your team feels busy but nothing moves is that nobody owns the outcome.",
    "If your marketing only works while you're posting, you haven't built a system.",
    "Most businesses don't need more leads. They need to stop wasting the ones they already have.",
    "If customers keep asking the same questions, your buying journey is doing too little work.",
  ],
  active: true,
};

export const LABEL_HOOK: HookFamilyDefinition = {
  id: "label",
  name: "Label Hook",
  category: "hook",
  purpose: "Identity",
  source: "Nexus IQ Systems Hook Library",
  sourceSummary:
    "Opens with the exact role, industry or identity of the intended reader. The relevant label cuts through surrounding noise because the audience immediately recognises the message is for them.",
  appAdaptation:
    "Used when the post targets a nameable audience. LinkedIn suits this unusually well because job title, business type and industry can be called out directly. If the audience cannot be named precisely, choose another family rather than inventing a segment.",
  mechanism:
    "Names the reader's role so the right person self-selects and everyone else filters out.",
  formula: "[Target Audience or Title] + Call to Action or Value Proposition",
  bestFor: [
    "Narrow niche targeting",
    "Conversion posts",
    "Audience qualification",
    "Service-specific posts",
    "Lead generation",
  ],
  allowedUse: ["conversion", "problem", "proof"],
  misuseRisks: [
    ...SHARED_MISUSE,
    "Labelling an audience the user does not actually serve.",
    "Using a label so wide (\"business owners\") that it qualifies nobody.",
  ],
  rules: [
    "The label must match an audience the user genuinely sells to.",
    "The promise after the label must be delivered in full.",
  ],
  examples: [
    "Estate agents, this is how you stop losing valuation leads after 5pm.",
    "Gym owners, use this before spending another pound on ads.",
    "Recruitment agency founders, your slowest process is costing you placements.",
    "Coaches, here's a cleaner way to qualify leads before the sales call.",
    "Local business owners, save this response for your next negative review.",
    "Marketing agencies, this is the client-reporting workflow you're missing.",
  ],
  active: true,
};

export const CONDITIONAL_HOOK: HookFamilyDefinition = {
  id: "conditional",
  name: "Conditional Hook",
  category: "hook",
  purpose: "Qualify",
  source: "Nexus IQ Systems Hook Library",
  sourceSummary:
    "States a specific situation the reader must recognise in themselves. Everyone else is filtered out, while the ideal audience feels the content was made around their exact problem.",
  appAdaptation:
    "Strongest family when the qualifying detail is operational rather than demographic. \"If your team copies customer details between three systems\" qualifies harder than \"if you run a business\".",
  mechanism:
    "Describes a situation precisely enough that recognition is involuntary.",
  formula: "If you are [Specific Person] in [Specific Situation], [next action or implied payoff].",
  bestFor: [
    "High relevance",
    "Pain-aware audiences",
    "Business process problems",
    "Commercial posts",
    "Technical advice",
  ],
  allowedUse: ["problem", "conversion", "education", "proof"],
  misuseRisks: [
    ...SHARED_MISUSE,
    "A condition so common it filters nobody out.",
    "Stacking conditions until the sentence stops scanning.",
  ],
  rules: [
    "The condition must describe an observable situation, not a feeling.",
    "Do not open with \"If you're like most...\".",
  ],
  examples: [
    "If you're generating leads but taking more than five minutes to reply, watch this.",
    "If you're a service business with missed calls outside office hours, this is for you.",
    "If your team copies customer details between three systems, save this.",
    "If prospects visit your pricing page but don't book, try this.",
    "If you own an agency and client reporting eats up Fridays, watch this.",
    "If you have a strong offer but inconsistent follow-up, start here.",
  ],
  active: true,
};

export const COMMAND_HOOK: HookFamilyDefinition = {
  id: "command",
  name: "Command Hook",
  category: "hook",
  purpose: "Action",
  source: "Nexus IQ Systems Hook Library",
  sourceSummary:
    "Gives a short, direct instruction linked to a clear risk, goal or outcome. The reader instantly knows what action to take and why the next part matters.",
  appAdaptation:
    "Used for risk reduction and before-you-do-X content. The instruction has to be one the user would genuinely give, and the risk behind it has to be real. A command without a stated consequence is just a slogan.",
  mechanism: "A short instruction tied to a consequence the reader wants to avoid or reach.",
  formula: "[Action Verb] + [Target Condition or Goal]",
  bestFor: [
    "Urgency",
    "Warning",
    "Checklist",
    "Before-you-do-X content",
    "Risk reduction",
  ],
  allowedUse: ["problem", "education", "conversion"],
  misuseRisks: [
    ...SHARED_MISUSE,
    "Manufacturing urgency where no real deadline or risk exists.",
    "Commanding the reader without earning the standing to do so.",
  ],
  rules: [
    "The risk or goal behind the instruction must be stated in the body.",
    "Do not set the command in capitals for emphasis.",
  ],
  examples: [
    "Stop sending traffic to a page that doesn't answer this question.",
    "Read this before hiring another salesperson.",
    "Check these three numbers before increasing your ad budget.",
    "Save this template for your next follow-up email.",
    "Fix your response time before buying more leads.",
    "Watch this before automating your entire workflow.",
  ],
  active: true,
};

export const LIST_HOOK: HookFamilyDefinition = {
  id: "list",
  name: "List Hook",
  category: "hook",
  purpose: "Structure",
  source: "Nexus IQ Systems Hook Library",
  sourceSummary:
    "Promises a defined number of useful points, mistakes, ideas or steps. The number makes the content feel organised, finite and easier to consume.",
  appAdaptation:
    "Only selected when the subject genuinely contains a countable set. The count in the hook must match the count in the body exactly. The writing rules forbid manufacturing a third item to complete a pattern, so a list of two is preferable to a padded list of three.",
  mechanism: "A finite, countable promise that makes the read feel bounded.",
  formula: "[Specific Number] + [Desirable or Shocking Outcome]",
  bestFor: [
    "Educational posts",
    "Tactical breakdowns",
    "Saveable content",
    "Practical advice",
  ],
  allowedUse: ["education", "problem", "proof"],
  misuseRisks: [
    ...SHARED_MISUSE,
    "Inventing items to reach a rounder number.",
    "Defaulting to three items to satisfy a rhythm the writing rules ban.",
    "Turning every educational post into a list until the feed reads identically.",
  ],
  rules: [
    "The number in the hook must equal the number of items in the body.",
    "Never pad the list to hit a target count.",
  ],
  examples: [
    "7 reasons your leads stop replying after the first message.",
    "5 automations that save time without making your process worse.",
    "9 website mistakes costing local businesses enquiries.",
    "6 questions that expose a weak offer.",
    "4 follow-up messages for prospects who said \"not yet\".",
    "11 ways to improve conversions without increasing ad spend.",
  ],
  active: true,
};

export const STORY_OPENER_HOOK: HookFamilyDefinition = {
  id: "story_opener",
  name: "Story Opener Hook",
  category: "hook",
  purpose: "Tension",
  source: "Nexus IQ Systems Hook Library",
  sourceSummary:
    "Begins at the moment where pressure, conflict or consequence is already visible. Background is explained afterwards, so the reader stays to understand how the situation happened and what followed.",
  appAdaptation:
    "Only available when the user has supplied a real event. The engine never fabricates an anecdote to unlock this family. If no true story exists, the strategist falls back to a non-personal structure and records a proof gap.",
  mechanism: "Opens mid-consequence, so context becomes something the reader wants.",
  formula: "Start at Maximum Tension or Conflict + Explain Context Later",
  bestFor: [
    "Case studies",
    "Personal experience",
    "Client stories",
    "Behind-the-scenes content",
    "Failure and recovery",
    "Lessons from real work",
  ],
  allowedUse: ["proof", "behind_the_scenes", "belief"],
  misuseRisks: [
    ...SHARED_MISUSE,
    "Inventing the event, the numbers, the dialogue or the reaction.",
    "Dramatising an ordinary observation into a scene that did not happen.",
  ],
  rules: [
    "Requires a user-supplied true event. Never synthesise one.",
    "Every detail in the opening (figures, times, names) must come from the user.",
    "Do not add invented emotional reactions to sharpen the scene.",
  ],
  examples: [
    "The client had spent £8,000 on ads and couldn't tell me where a single lead had gone.",
    "Ten minutes before launch, the booking form stopped sending enquiries.",
    "I was halfway through the sales call when the prospect showed me the exact proposal our competitor had sent.",
    "At 9:03 on Monday morning, 214 customer records disappeared from the CRM.",
    "The campaign looked like a success until we opened the sales pipeline.",
    "The phone rang for the seventh time while everyone in the office assumed somebody else would answer it.",
  ],
  active: true,
};

export const EXCLAMATION_HOOK: HookFamilyDefinition = {
  id: "exclamation",
  name: "Exclamation Hook",
  category: "hook",
  purpose: "Emotion",
  source: "Nexus IQ Systems Hook Library",
  sourceSummary:
    "Leads with a strong reaction, surprise or sense of urgency. It should feel immediate and emotionally genuine, with the explanation arriving straight afterwards.",
  appAdaptation:
    "Requires a reaction the user actually had or a position they actually hold. The writing rules forbid manufactured emotion, so this family is unavailable when the idea carries no real feeling.",
  mechanism: "Genuine reaction first, immediate explanation second.",
  formula: "High Emotion or Reaction + Immediate Explanation",
  bestFor: [
    "Strong opinion",
    "Surprise",
    "Industry criticism",
    "Counter-intuitive findings",
    "Significant result",
  ],
  allowedUse: ["opinion", "belief", "problem"],
  misuseRisks: [
    ...SHARED_MISUSE,
    "Performing outrage the user does not feel.",
    "Escalating to clickbait vocabulary the body cannot support.",
  ],
  rules: [
    "The reaction must be one the user genuinely holds.",
    "The explanation must follow immediately, in the next sentence.",
    "No capitals, no exclamation stacking.",
  ],
  examples: [
    "This is completely backwards. Businesses are buying more leads before fixing their follow-up.",
    "I cannot believe businesses are still doing this. They're making customers wait until Monday for a reply.",
    "This one change cut the response time from hours to seconds.",
    "We've been measuring the wrong thing. Views don't matter if nobody takes the next step.",
    "This might be the most expensive \"free\" tool I've ever seen.",
    "You need to see what happened after we removed half the workflow.",
  ],
  active: true,
};

export const NEXUS_HOOK_FAMILIES: HookFamilyDefinition[] = [
  STATEMENT_HOOK,
  LABEL_HOOK,
  CONDITIONAL_HOOK,
  COMMAND_HOOK,
  LIST_HOOK,
  STORY_OPENER_HOOK,
  EXCLAMATION_HOOK,
];

/** Hook families that require user-supplied lived experience before selection. */
export const HOOK_FAMILIES_REQUIRING_REAL_EXPERIENCE = new Set<string>([
  "story_opener",
  "exclamation",
]);

export const HOOK_ENGINE_PRINCIPLES: string[] = [
  "Stop the scroll before you sell the message.",
  "Write the hook first and build the rest of the content around the promise, tension or question it creates.",
  "Never use a hook the body cannot deliver.",
  "The hook pre-qualifies the right audience rather than maximising total attention.",
];
