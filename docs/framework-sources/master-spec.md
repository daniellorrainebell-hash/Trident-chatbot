# NEXUS IQ LINKEDIN CONTENT ENGINE
## Master Product, Architecture, Framework and Build Specification

**Working title:** Nexus IQ LinkedIn Content Engine  
**Document purpose:** Master implementation specification for Claude Code, Codex or another coding agent  
**Primary platform:** Web application  
**Primary use case:** Turn a rough LinkedIn idea into a strategically structured, psychologically informed, fact-aware first draft using proven frameworks, the user's own writing history and persistent feedback memory  
**Primary AI provider:** OpenAI API  
**Recommended implementation language:** TypeScript  
**Recommended stack:** Next.js + Supabase/Postgres + OpenAI Responses API  
**Status:** Build specification v1

---

# 1. PRODUCT IN ONE SENTENCE

Build a specialist LinkedIn content intelligence system that takes a rough idea, understands what the post is trying to achieve, chooses the right psychology, hook and narrative framework, retrieves relevant personal knowledge and previous writing, generates and scores multiple openings, builds the post, critiques it, fact-checks claims where required, and returns a strong first draft that becomes more aligned to the user over time.

This is **not** a generic AI writer.

It is a persistent content operating system.

---

# 2. THE PROBLEM

A normal LLM workflow starts from almost nothing every time.

The user types:

> "Write me a LinkedIn post about AI governance."

The model then has to infer:

- Who is the audience?
- What is the business objective?
- Is this an authority post, story, opinion, proof post or sales post?
- What psychological trigger should be used?
- What hook structure fits?
- What narrative framework fits?
- What does the user already believe about the topic?
- How does the user normally write?
- Which phrases does the user reject?
- What claims need current research?
- What previous posts already covered similar ground?
- What commercial offer should the post support?
- What kind of CTA is appropriate?

That creates inconsistent drafts and forces the user to repeatedly correct the model.

The product solves this by moving those decisions into a persistent system.

---

# 3. PRODUCT AIM

The aim is to make the user responsible for the **idea and judgement**, while the application handles the repetitive strategic work between idea and first draft.

The ideal experience is:

### User input

> "People are vibe coding AI products and selling them without understanding governance."

### System output

The application silently determines:

- Audience: AI builders, small agencies and founders selling AI products
- Content pillar: Problem + Belief
- Reader stage: Awareness / Intent
- Objective: Authority + lead generation
- Primary psychology: Loss aversion
- Secondary psychology: Information gap
- Hook families: Statement, Conditional and Command
- Narrative framework: C2C Hook → Problem → Tension → Proof → Lesson → CTA
- Relevant source material: AI governance knowledge + previous Nexus IQ governance posts
- Risk level: Legal/current claims require verification
- CTA strength: Commercial but not hard sell

It generates multiple hook candidates, selects the strongest, creates a structured outline, writes the draft, critiques it and returns the first version.

The user should **not** need to manually specify all of those fields unless they want to override them.

---

# 4. PRODUCT PHILOSOPHY

## 4.1 Frameworks are tools, not templates

Never force every idea through one framework.

The system must first understand the content.

Then select the framework.

Bad:

> Every post must use SLAY.

Correct:

> SLAY is one available structure. Use it when the idea genuinely benefits from Story → Lesson → Actionable Advice → You.

---

## 4.2 Psychology is selected before copy is written

The system should determine what the reader needs to feel or realise before writing the final sentences.

Examples:

- Curiosity
- Recognition
- Concern
- Loss aversion
- Identification
- Status
- Authority
- Aspiration
- Surprise
- Urgency
- Trust
- Relief

The writing is downstream of the psychological objective.

---

## 4.3 The hook is part of the strategy

The hook is not decorative.

It creates a promise, question, tension or conflict that the rest of the post must fulfil.

The body must be written around the hook.

Never generate a sensational hook and then write an unrelated body.

---

## 4.4 Proof matters more than generic authority language

Prefer:

- Real examples
- Screenshots
- Results
- Mistakes
- Builds
- Client problems
- Observations
- Decisions
- Specific numbers when verified
- Actual experience

Avoid vague statements such as:

> "As an expert in AI..."

---

## 4.5 The system must learn editorial judgement

Saving finished posts is not enough.

The system must save:

- Initial draft
- User edits
- Rejected sentences
- Accepted replacements
- Rejection reasons
- Approval reasons
- Final post
- Framework used
- Hook used
- Psychology used
- Topic
- CTA
- Performance data when available

The long-term objective is to learn:

> How this user decides what good writing is.

Not merely:

> What this user has written before.

---

# 5. PRIMARY USER FLOW

```text
ROUGH IDEA
   ↓
IDEA ANALYSIS
   ↓
AUDIENCE + OBJECTIVE
   ↓
CONTENT PILLAR
   ↓
PSYCHOLOGICAL ANGLE
   ↓
KNOWLEDGE RETRIEVAL
   ↓
FRAMEWORK SELECTION
   ↓
HOOK FAMILY SELECTION
   ↓
HOOK GENERATION
   ↓
HOOK SCORING
   ↓
OUTLINE
   ↓
FIRST DRAFT
   ↓
CRITIC PASS
   ↓
FACT CHECK / RESEARCH IF REQUIRED
   ↓
REWRITE
   ↓
USER REVIEW
   ↓
USER EDITS
   ↓
MEMORY UPDATE
   ↓
FINAL POST
   ↓
OPTIONAL PERFORMANCE INGESTION
```

---

# 6. SOURCE FRAMEWORK LIBRARY

This specification incorporates the frameworks supplied in the following user-provided materials:

1. **Nexus IQ Systems Hook Library**
2. **LinkedIn Psychological Trigger Framework**
3. **The Content Formula / C2C Interactive Workbook**
4. **Lara Acosta SLAY framework supplied as an image**

Important source distinction:

The uploaded psychology document describes a framework called:

> Setup → Lead-In → Anticipation → Yield

The Lara Acosta image supplied separately defines SLAY as:

> Story → Lesson → Actionable Advice → You

These are **not the same framework**.

The application must preserve them as separate structures and must not falsely attribute the Setup / Lead-In / Anticipation / Yield version to Lara Acosta.

Use internal IDs:

- `lara_slay`
- `psych_slay_variant`

---

# 7. NEXUS IQ HOOK ENGINE

Source principle:

> Stop the scroll before you sell the message.

The hook's purpose is to:

- Pre-qualify the right audience
- Create curiosity
- Establish relevance
- Create a promise, tension or question
- Give the reader a reason to continue

Core rule:

> Write the hook first and build the rest of the content around the promise, tension or question created by it.

Never use a hook the body cannot deliver.

---

## 7.1 Hook Type 1: Statement Hook

**Internal ID:** `statement`

**Purpose:** Challenge

**Mechanism:**  
A direct observation aimed at a recognisable problem. It creates mild discomfort by accurately describing the reader's situation and implying that an explanation or solution follows.

**Formula:**

```text
Observation + Mild Discomfort + Implied Answer
```

**Best use cases:**

- Problem posts
- Belief posts
- Contrarian posts
- Commercial education
- Pain-aware audiences

**Source examples:**

- If your content gets views but no enquiries, you're attracting attention from the wrong people.
- If every sales call ends with "I'll think about it", your offer isn't clear enough.
- The reason your team feels busy but nothing moves is that nobody owns the outcome.
- If your marketing only works while you're posting, you haven't built a system.
- Most businesses don't need more leads. They need to stop wasting the ones they already have.
- If customers keep asking the same questions, your buying journey is doing too little work.

---

## 7.2 Hook Type 2: Label Hook

**Internal ID:** `label`

**Purpose:** Identity

**Mechanism:**  
Open with the exact role, industry or identity of the intended reader so they immediately recognise that the content is for them.

**Formula:**

```text
[Target Audience or Title] + Call to Action or Value Proposition
```

**Best use cases:**

- Narrow niche targeting
- Conversion posts
- Audience qualification
- Service-specific posts
- Lead generation

**Source examples:**

- Estate agents, this is how you stop losing valuation leads after 5pm.
- Gym owners, use this before spending another pound on ads.
- Recruitment agency founders, your slowest process is costing you placements.
- Coaches, here's a cleaner way to qualify leads before the sales call.
- Local business owners, save this response for your next negative review.
- Marketing agencies, this is the client-reporting workflow you're missing.

---

## 7.3 Hook Type 3: Conditional Hook

**Internal ID:** `conditional`

**Purpose:** Qualify

**Mechanism:**  
Describe a specific situation that the ideal reader recognises in themselves.

**Formula:**

```text
If you are [Specific Person] in [Specific Situation], [next action / implied payoff].
```

**Best use cases:**

- High relevance
- Pain-aware audiences
- Business process problems
- Commercial posts
- Technical advice

**Source examples:**

- If you're generating leads but taking more than five minutes to reply, watch this.
- If you're a service business with missed calls outside office hours, this is for you.
- If your team copies customer details between three systems, save this.
- If prospects visit your pricing page but don't book, try this.
- If you own an agency and client reporting eats up Fridays, watch this.
- If you have a strong offer but inconsistent follow-up, start here.

---

## 7.4 Hook Type 4: Command Hook

**Internal ID:** `command`

**Purpose:** Action

**Mechanism:**  
Give a short instruction tied to a clear risk, goal or outcome.

**Formula:**

```text
[Action Verb] + [Target Condition or Goal]
```

**Best use cases:**

- Urgency
- Warning
- Checklist
- Before-you-do-X content
- Risk reduction

**Source examples:**

- Stop sending traffic to a page that doesn't answer this question.
- Read this before hiring another salesperson.
- Check these three numbers before increasing your ad budget.
- Save this template for your next follow-up email.
- Fix your response time before buying more leads.
- Watch this before automating your entire workflow.

---

## 7.5 Hook Type 5: List Hook

**Internal ID:** `list`

**Purpose:** Structure

**Mechanism:**  
Promise a finite set of useful points, mistakes, ideas or steps.

**Formula:**

```text
[Specific Number] + [Desirable or Shocking Outcome]
```

**Best use cases:**

- Educational posts
- Tactical breakdowns
- Saveable content
- Practical advice

**Source examples:**

- 7 reasons your leads stop replying after the first message.
- 5 automations that save time without making your process worse.
- 9 website mistakes costing local businesses enquiries.
- 6 questions that expose a weak offer.
- 4 follow-up messages for prospects who said "not yet".
- 11 ways to improve conversions without increasing ad spend.

---

## 7.6 Hook Type 6: Story Opener

**Internal ID:** `story_opener`

**Purpose:** Tension

**Mechanism:**  
Start at the moment where pressure, conflict or consequence is already visible. Explain background afterwards.

**Formula:**

```text
Start at Maximum Tension or Conflict + Explain Context Later
```

**Best use cases:**

- Case studies
- Personal experience
- Client stories
- Behind-the-scenes content
- Failure / recovery
- Lessons from real work

**Source examples:**

- The client had spent £8,000 on ads and couldn't tell me where a single lead had gone.
- Ten minutes before launch, the booking form stopped sending enquiries.
- I was halfway through the sales call when the prospect showed me the exact proposal our competitor had sent.
- At 9:03 on Monday morning, 214 customer records disappeared from the CRM.
- The campaign looked like a success until we opened the sales pipeline.
- The phone rang for the seventh time while everyone in the office assumed somebody else would answer it.

---

## 7.7 Hook Type 7: Exclamation Hook

**Internal ID:** `exclamation`

**Purpose:** Emotion

**Mechanism:**  
Lead with a genuine strong reaction or surprise, then immediately explain why.

**Formula:**

```text
High Emotion or Reaction + Immediate Explanation
```

**Best use cases:**

- Strong opinion
- Surprise
- Industry criticism
- Counter-intuitive findings
- Significant result

**Source examples:**

- This is completely backwards. Businesses are buying more leads before fixing their follow-up.
- I cannot believe businesses are still doing this. They're making customers wait until Monday for a reply.
- This one change cut the response time from hours to seconds.
- We've been measuring the wrong thing. Views don't matter if nobody takes the next step.
- This might be the most expensive "free" tool I've ever seen.
- You need to see what happened after we removed half the workflow.

---

# 8. PSYCHOLOGICAL TRIGGER MODULE

The system does **not** claim that psychological triggers guarantee virality.

They are strategic mechanisms used to improve relevance, tension and reader motivation.

---

## 8.1 Cognitive Fluency

**Source description:**  
People are more likely to process and trust information that is easy to understand.

**Application:**

- Short sentences
- Plain language
- White space
- Avoid unnecessary jargon
- One idea per paragraph where possible
- Reduce cognitive load

**System instruction:**

Do not confuse cognitive fluency with making the writing childish. Technical language is acceptable where the audience requires it, but complexity should come from the subject, not poor writing.

---

## 8.2 Information Gap / Curiosity Loop

**Source description:**  
Create a gap between what the reader knows and what they want to know.

**Application:**

- Reveal enough to create relevance
- Delay the mechanism or answer
- Do not hide basic context purely for clickbait
- The body must close the loop

**Useful with:**

- Statement hooks
- Story openers
- Counter-intuitive hooks
- Research findings
- Before/after posts

---

## 8.3 Loss Aversion / Cost of Inaction

**Source description:**  
Show what the reader risks losing by failing to address a problem.

**Application:**

Instead of only:

> "Here is how to win."

Also consider:

> "Here is what this problem is already costing you."

**Useful with:**

- Governance
- Security
- Revenue leakage
- Missed leads
- Operational inefficiency
- Risk
- Compliance
- Customer churn

---

## 8.4 Status Signalling and Identity

**Source description:**  
People engage with and share ideas that reinforce how they want to be perceived.

**Application:**

- Give readers language they can adopt
- Create useful insights worth sharing
- Frame ideas around professional identity
- Allow the reader to signal competence or foresight

Do not manufacture fake superiority.

---

## 8.5 Reciprocity

**Application:**

Give the reader genuine useful value before asking for an action.

Examples:

- A framework
- A checklist
- A specific lesson
- A template
- A practical implementation step

---

## 8.6 Choice Reduction

**Application:**

End with one clear action rather than several competing CTAs.

Bad:

> Comment, DM, follow, download, book and visit the site.

Better:

> If you're selling an AI system and want the governance side mapped before deployment, message me.

---

# 9. HORMOZI-STYLE HOOK PATTERNS FROM THE UPLOADED PSYCHOLOGY DOCUMENT

These are stored as structural patterns.

The system must **not** attempt to imitate Alex Hormozi's personal writing voice.

Use the mechanisms, not a living creator's distinctive style.

---

## 9.1 Call-Out + High Stakes

**Internal ID:** `hormozi_callout_high_stakes`

**Formula:**

```text
If you are a [Avatar] making [X], stop doing [Y] immediately.
```

**Underlying mechanisms:**

- Self-referencing
- Identity
- Loss aversion
- Urgency

---

## 9.2 Unpopular Truth

**Internal ID:** `hormozi_unpopular_truth`

**Formula:**

```text
Everyone tells you to [Common Advice]. Here is why that is hurting the outcome.
```

**Underlying mechanisms:**

- Pattern interruption
- Contrarian tension
- Information gap

System rule:

Only use when there is a defensible argument. Do not manufacture a fake contrarian opinion.

---

## 9.3 Visual Counter-Intuition

**Internal ID:** `hormozi_counter_intuition`

**Formula:**

```text
I spent [X time / money / effort] learning [Y]. Here is the compressed lesson.
```

**Underlying mechanisms:**

- Specificity
- Cost
- Curiosity
- Value compression

System rule:

Never invent spend, time, numbers or experience.

---

# 10. LARA ACOSTA SLAY FRAMEWORK

**Internal ID:** `lara_slay`

This is the framework shown in the user-supplied Lara Acosta image.

## S — Story

**Purpose:** Start with one line of story.

The image guidance says the opening should hook the audience through a story and often work naturally with first-person or "how" phrasing.

**System interpretation:**

- Begin with a specific event, observation or experience
- Avoid long scene-setting
- Introduce movement immediately
- Prefer a true story when framed as personal experience

---

## L — Lesson

**Purpose:** Bring in a quick key lesson.

**System interpretation:**

- State the core insight clearly
- Remove unnecessary fluff
- Explain why the lesson matters
- Move from "what happened" to "what it means"

---

## A — Actionable Advice

**Purpose:** Demonstrate expertise by turning the lesson into useful action.

**System interpretation:**

- List steps
- Explain implementation
- Give a checklist
- Show the reader how to apply the lesson
- Make the advice immediately usable where possible

---

## Y — You

**Purpose:** Bring the post back to the reader.

**System interpretation:**

- Connect the lesson to the reader's situation
- Speak directly to them
- Give one next action
- Avoid generic inspirational endings

---

## Best use cases for Lara SLAY

- Personal experience
- Lessons from builds
- Mistakes
- Client observations
- Books / learning
- Behind the scenes
- Transformation stories
- Educational posts with a personal opening

---

# 11. PSYCHOLOGICALLY ENHANCED "SLAY" VARIANT FROM THE UPLOADED PSYCHOLOGY DOCUMENT

**Internal ID:** `psych_slay_variant`

**Important:** This framework appears in the uploaded psychology file and is separate from the Lara Acosta SLAY framework above.

It must not be attributed to Lara unless further source evidence establishes that attribution.

---

## S — Setup

**Objective:** Pattern interruption + information gap

**Action:**

- Choose an appropriate hook pattern
- Create relevance in the first lines
- Establish a reason to continue

---

## L — Lead-In

**Objective:** Authority + loss aversion

**Action:**

- Establish the stakes
- Explain why the topic matters
- Show the cost of leaving the problem unresolved
- Use credibility only when genuinely available

---

## A — Anticipation

**Objective:** Cognitive fluency + status signalling

**Action:**

- Deliver the core value
- Use short structured points when useful
- Make the content practical enough to save or share
- Avoid padding

---

## Y — Yield

**Objective:** Reciprocity + choice reduction

**Action:**

- Give the reader the best useful takeaway
- End with one clear next step
- Avoid CTA overload

---

# 12. C2C / THE CONTENT FORMULA FRAMEWORK

## 12.1 Core principles

### Connection beats polish

People do not only choose the technically most qualified option.

When options appear similar, familiarity, human connection and relatability can matter.

---

### The brand is not invented

The strongest personal brand should expose and organise:

- Genuine beliefs
- Opinions
- Standards
- Work
- Habits
- Interests
- Mistakes
- Processes
- Repeated observations

Do not create a fictional online persona.

---

### Content needs movement

Good content should move.

The source emphasises:

- Problem
- Friction
- Proof
- Shift in thinking
- Next step

---

# 13. C2C CONTENT ENGINE

**Internal ID:** `c2c_content_engine`

```text
Observation
   ↓
Problem
   ↓
Tension
   ↓
Proof
   ↓
Lesson
   ↓
Action
```

## Stage 1 — Observation

What happened, changed, annoyed the user, surprised them or became noticeable?

## Stage 2 — Problem

What underlying problem does the observation reveal?

## Stage 3 — Tension

Why does the problem matter?

What is the consequence, cost, conflict or pressure?

## Stage 4 — Proof

What evidence makes the argument believable?

Examples:

- Actual result
- Client example
- Screenshot
- Build
- Mistake
- Test
- Data
- Experience
- Specific observation

## Stage 5 — Lesson

What better way should the reader think about the issue?

## Stage 6 — Action

What should they do next?

---

# 14. C2C AUDIENCE JOURNEY

**Internal ID:** `c2c_audience_journey`

```text
Awareness
   ↓
Connection
   ↓
Trust
   ↓
Intent
   ↓
Action
```

## Awareness

**Reader state:** They notice you.

Useful mechanisms:

- Strong hook
- Clear problem
- Relevant label
- Pattern interruption

---

## Connection

**Reader state:** They relate to you.

Useful mechanisms:

- Story
- Shared worldview
- Honest experience
- Behind the scenes

---

## Trust

**Reader state:** They believe you.

Useful mechanisms:

- Proof
- Examples
- Results
- Specific detail
- Reasoning

---

## Intent

**Reader state:** They want help or want the outcome.

Useful mechanisms:

- Cost of inaction
- Better future
- Clear solution
- Demonstrated competence

---

## Action

**Reader state:** They enquire or perform the next step.

Useful mechanisms:

- One CTA
- DM
- Link
- Call
- Download
- Specific instruction

The system should identify which stage a post primarily serves.

Do not make every post an aggressive conversion post.

---

# 15. C2C SIX CONTENT PILLARS

## 15.1 Problem Posts

**Purpose:** Attention + pain recognition

Call out expensive or meaningful problems the audience may not have noticed.

Examples of angles:

- Hidden cost
- Broken assumption
- Revenue leakage
- Operational problem

---

## 15.2 Proof Posts

**Purpose:** Trust + evidence

Use:

- Results
- Before/after
- Screenshots
- Lessons
- Reviews
- Client outcomes
- Demonstrated improvements

---

## 15.3 Belief Posts

**Purpose:** Positioning + authority

Explain what the user genuinely believes about:

- AI
- Business
- Automation
- Service
- Standards
- Marketing
- Product building
- Governance
- Execution

---

## 15.4 Behind-the-Scenes Posts

**Purpose:** Connection + reality

Show:

- Process
- Decisions
- Work
- Failed attempts
- Changes
- Reasoning
- Building
- Testing

---

## 15.5 Conversion Posts

**Purpose:** Sales + action

Use for:

- Direct offers
- Audits
- Calls
- Demos
- Lead magnets
- Product/service announcements
- Specific availability

---

## 15.6 Opinion Posts

**Purpose:** Differentiation + voice

Say something useful that competitors avoid saying.

Rule:

> Be useful, but do not be beige.

Do not force controversy for attention.

---

# 16. C2C GENERAL POST FORMULA

**Internal ID:** `c2c_post_formula`

```text
Hook
  ↓
Problem
  ↓
Tension
  ↓
Proof
  ↓
Lesson
  ↓
CTA
```

## Hook

Say something specific that makes the right person stop.

## Problem

Describe the issue in plain language.

## Tension

Explain why it matters and what it is costing.

## Proof

Give evidence.

## Lesson

Provide the better way to think.

## CTA

Give one next step.

---

# 17. C2C STORY PRINCIPLES

The source recommends building stories rather than random disconnected posts.

Useful story elements:

## Villain

Not necessarily a person.

Can be:

- A bad belief
- Broken system
- Lazy industry habit
- Outdated assumption
- Inefficient process

## Hero

The better:

- Idea
- Process
- Behaviour
- System
- Principle

## Proof

What the user:

- Built
- Tested
- Saw
- Changed
- Learned

## Payoff

What the reader should do with the lesson.

---

# 18. C2C INSPIRATION RULE

Take inspiration from outside the user's niche.

Possible sources:

- Films
- Sport
- Customer service
- Restaurants
- Fashion
- Technology
- Other industries
- Culture

Core rule:

```text
Do not copy the wording.
Copy the mechanism.
Adapt it to the audience.
Make it sound like the user.
```

---

# 19. C2C CONTENT PRIORITY HEURISTICS

The workbook includes the following relative priority scores:

- Story and tension: 96
- Human connection: 93
- Proof and examples: 91
- Clear opinion: 88
- Visual polish: 64
- Posting frequency: 58

These scores are **source heuristics**, not scientific constants.

The application may use them as configurable defaults when evaluating content quality, but they must remain editable.

---

# 20. C2C OLD HABIT → BETTER APPROACH RULES

## Generic tip

Bad:

> Post a generic piece of advice.

Better:

Turn it into a story with a problem and consequence.

---

## Corporate voice

Bad:

Attempt to sound corporate for credibility.

Better:

Use plain language, human detail and clear opinion.

---

## Finished work only

Bad:

Only show final output.

Better:

Show:

- Thinking
- Failed attempts
- Decisions
- Reasoning
- Why something changed

This rule is especially important to the long-term memory design of the product.

---

## Copy competitors

Bad:

Copy the niche.

Better:

Borrow structure from elsewhere and translate it.

---

## No next step

Bad:

End without direction.

Better:

Give one clear action.

---

# 21. C2C QUALITY CONTROL CHECKLIST

Before approving a post, the critic must test:

- Does it have a clear point?
- Does it sound like a real person wrote it?
- Does it contain a problem, example or opinion?
- Does it move the reader closer to trust or action?
- Is it just information with no story or movement?
- Does it sound like generic AI filler?

The critic should also test:

- Did the body fulfil the hook?
- Is there unnecessary repetition?
- Is the insight obvious?
- Is the CTA appropriate?
- Are any claims unsupported?
- Does the post contain fake personal experience?
- Has a framework become too visible?
- Does it feel mechanically templated?
- Is there enough specificity?

---

# 22. C2C WORKSHOP PRINCIPLES

Store the following as strategic reminders:

## Connection

People may choose people they relate to even where expertise appears comparable.

## Story

Use:

- Behind the scenes
- Villains
- Tension
- Twists
- Payoff

## Authenticity

Use the user's actual:

- Beliefs
- Actions
- Interests
- Standards
- Habits

## Inspiration

Borrow mechanisms from outside the niche.

## Trust

Use:

- Good questions
- Proof
- Specificity

## Action

Content should move someone towards a next step, not merely entertain.

---

# 23. C2C 30-DAY CONTENT OPERATING PLAN

This is not required for the core drafting engine but should be retained for a future Planning module.

## Week 1 — Extract real angles

- Write 20 genuine beliefs
- List 10 industry frustrations
- Identify 5 stories from work, mistakes or client conversations
- Turn each into post ideas

## Week 2 — Build story-based posts

- Create posts using Hook → Problem → Tension → Proof → Lesson → CTA
- Include behind-the-scenes material
- Keep the writing human

## Week 3 — Add proof and conversion

- Teardown / analysis
- Before and after
- Direct offer
- Track useful reactions

## Week 4 — Double down

- Review what worked
- Repurpose strong ideas
- Remove weak generic formats
- Build a repeatable rhythm

---

# 24. C2C WEEKLY CONTENT RHYTHM

Optional planning default:

| Day | Type | Purpose |
|---|---|---|
| Monday | Problem | Create urgency |
| Tuesday | Behind the scenes | Build connection |
| Wednesday | Proof | Build trust |
| Thursday | Opinion | Differentiate |
| Friday | Conversion / CTA | Create enquiries |

Do not hard-code this schedule.

Allow the user to customise it.

---

# 25. FRAMEWORK SELECTION LOGIC

The system should never ask the user to choose a framework unless they explicitly want to.

The strategist selects it.

---

## 25.1 If the idea contains a true personal event

Prefer:

1. `lara_slay`
2. `story_opener`
3. `c2c_content_engine`
4. `c2c_post_formula`

---

## 25.2 If the idea identifies an expensive problem

Prefer:

1. `c2c_post_formula`
2. `c2c_content_engine`
3. `statement`
4. `conditional`
5. Loss aversion

---

## 25.3 If the idea is a strong opinion

Prefer:

1. Belief / Opinion pillar
2. Statement hook
3. Exclamation hook if emotion is genuine
4. Unpopular Truth pattern if there is a real common belief to challenge

---

## 25.4 If the idea is tactical / educational

Prefer:

1. List hook
2. C2C post formula
3. Psych SLAY variant
4. Actionable Advice section
5. Cognitive fluency

---

## 25.5 If the idea is proof-led

Prefer:

1. Proof pillar
2. Story opener
3. C2C content engine
4. Lara SLAY if a lesson follows
5. Specificity over abstract claims

---

## 25.6 If the idea is directly commercial

Prefer:

1. Conversion pillar
2. Label / Conditional hook
3. Loss aversion or better-future framing
4. Proof
5. One clear CTA

---

# 26. STRATEGY CLASSIFICATION

For every new idea, return the following structured fields internally:

```json
{
  "topic": "",
  "core_claim": "",
  "target_audience": "",
  "reader_stage": "awareness|connection|trust|intent|action",
  "content_pillars": [],
  "primary_objective": "authority|engagement|education|trust|lead_generation|conversion",
  "primary_psychology": "",
  "secondary_psychology": [],
  "recommended_framework": "",
  "backup_frameworks": [],
  "recommended_hook_families": [],
  "proof_available": [],
  "proof_missing": [],
  "research_required": false,
  "risk_level": "low|medium|high",
  "cta_type": "",
  "tone_notes": []
}
```

Do not show all of this by default.

Use it to power the generation.

Allow an "Advanced" UI drawer where the user can inspect or override it.

---

# 27. HOOK GENERATION PIPELINE

For each post:

1. Select 2–4 hook families
2. Generate multiple candidates per family
3. Reject duplicates
4. Reject generic openings
5. Score each
6. Pass top candidates to a second evaluator
7. Choose winner
8. Retain alternatives for the UI

Recommended generation target:

- 12–20 internal hook candidates
- Show user top 3–5

---

# 28. HOOK SCORING

Each hook receives 0–10 for:

- Audience relevance
- Specificity
- Curiosity
- Tension
- Credibility
- Originality
- Clarity
- Body fulfilment potential
- User voice fit

Penalties:

- Cliché
- Clickbait
- Unsupported number
- False personal claim
- Generic AI language
- Overly long
- Body cannot fulfil promise

Example weighted score:

```text
relevance             20%
specificity           15%
curiosity             10%
tension               10%
credibility           15%
originality           10%
clarity               10%
voice_fit             10%
```

These weights are a product implementation decision and should be configurable.

---

# 29. USER VOICE ENGINE

The voice engine must not be a single prose description.

Store structured preferences.

Example schema:

```json
{
  "language": "UK English",
  "sentence_length": "short_to_medium",
  "paragraph_density": "low",
  "directness": "high",
  "technical_depth": "audience_dependent",
  "humour": "occasional",
  "profanity": "allowed_when_natural",
  "preferred_patterns": [],
  "banned_patterns": [],
  "banned_words": [],
  "cta_preferences": [],
  "format_preferences": [],
  "examples_positive": [],
  "examples_negative": []
}
```

The system should update this profile from user feedback.

---

# 30. EDIT MEMORY

Every revision should produce an edit event.

Example:

```json
{
  "post_id": "uuid",
  "draft_version": 2,
  "original_text": "AI is transforming business faster than ever.",
  "replacement_text": "Vibe coded your AI? The law still applies to you.",
  "feedback_type": "replacement",
  "reason": "generic opening replaced with direct audience callout and consequence",
  "tags": [
    "avoid_generic_ai_opening",
    "prefer_specificity",
    "prefer_tension"
  ],
  "created_at": "timestamp"
}
```

Do not require the user to type a detailed reason every time.

The model may infer a short **editorial summary** from the change.

Never store hidden chain-of-thought.

Store only concise observable editorial preference summaries.

---

# 31. MEMORY RETRIEVAL

When generating a post, retrieve relevant memory based on:

- Topic similarity
- Content pillar
- Hook type
- Framework
- Feedback tag
- Audience
- CTA
- Tone
- Past performance
- User edits

Prioritise:

1. Recent explicit user preferences
2. Repeated preferences
3. Final approved posts
4. Strong-performing posts
5. Similar topic posts
6. General voice rules

Do not copy an old post merely because it is semantically similar.

---

# 32. KNOWLEDGE BASE DESIGN

Separate knowledge into namespaces.

## Namespace A — Frameworks

Contains:

- Nexus hook library
- Lara SLAY
- Psych SLAY variant
- C2C formula
- Psychology triggers
- Hook patterns
- Quality controls

## Namespace B — User identity

Contains:

- Expertise
- Positioning
- Business
- Offers
- Audience
- Opinions
- Beliefs
- Standards
- Experience
- Bio facts approved for content use

## Namespace C — User writing

Contains:

- Published posts
- Approved drafts
- Rejected drafts
- Editing history
- CTA history

## Namespace D — Subject knowledge

Contains:

- User docs
- Research
- Product knowledge
- AI governance documents
- Technical notes
- Case studies

## Namespace E — Performance

Contains:

- Impressions
- Reactions
- Comments
- Saves where available
- Reposts
- DMs / leads where user records them
- Profile visits if available

---

# 33. RETRIEVAL STRATEGY

Do **not** place every framework document into every prompt.

Recommended:

### Static framework retrieval

The strategist selects framework IDs first.

Then load only the relevant framework definitions.

### Semantic retrieval

Use embeddings for:

- Previous posts
- Personal knowledge
- Documents
- Edit memory
- Research notes

### Metadata filtering

Filter by:

- `knowledge_type`
- `topic`
- `framework`
- `content_pillar`
- `approved`
- `source`
- `date`
- `risk`

---

# 34. OPENAI API ARCHITECTURE

This section was added as implementation guidance and is not sourced from the uploaded writing frameworks.

OpenAI's current documentation recommends the **Responses API** for new projects.

Use the official OpenAI JavaScript SDK.

Recommended model routing:

```text
Primary strategist + writer:
gpt-5.6-terra

Complex/high-stakes analysis, legal/technical research:
gpt-5.6-sol

Fast classification, tagging, hook pre-scoring:
gpt-5.6-luna

Embeddings:
text-embedding-3-small
```

Model IDs must remain environment-configurable because API offerings change.

Do not hard-code model IDs throughout the codebase.

---

# 35. OPENAI ENVIRONMENT CONFIGURATION

Create:

```bash
# .env.local

OPENAI_API_KEY=

OPENAI_MODEL_PRIMARY=gpt-5.6-terra
OPENAI_MODEL_DEEP=gpt-5.6-sol
OPENAI_MODEL_FAST=gpt-5.6-luna
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Optional if using OpenAI hosted file search
OPENAI_VECTOR_STORE_ID=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

DATABASE_URL=

APP_ENV=development
```

Security rule:

**OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY must never be exposed to the browser.**

All model requests run server-side.

---

# 36. OPENAI CLIENT

Recommended:

```ts
// src/lib/openai.ts

import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const models = {
  primary: process.env.OPENAI_MODEL_PRIMARY || "gpt-5.6-terra",
  deep: process.env.OPENAI_MODEL_DEEP || "gpt-5.6-sol",
  fast: process.env.OPENAI_MODEL_FAST || "gpt-5.6-luna",
  embedding:
    process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
};
```

---

# 37. USE THE RESPONSES API

Basic pattern:

```ts
const response = await openai.responses.create({
  model: models.primary,
  instructions: systemInstructions,
  input: userInput,
});

const text = response.output_text;
```

Use structured outputs for orchestration stages.

Do not parse loosely formatted prose where a schema is more reliable.

---

# 38. STRUCTURED OUTPUTS

Use JSON Schema / Zod for:

- Idea analysis
- Framework selection
- Hook candidates
- Hook scores
- Outline
- Critic results
- Research flags
- Feedback tags

Example:

```ts
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const IdeaAnalysis = z.object({
  topic: z.string(),
  core_claim: z.string(),
  target_audience: z.string(),
  reader_stage: z.enum([
    "awareness",
    "connection",
    "trust",
    "intent",
    "action",
  ]),
  content_pillars: z.array(z.string()),
  primary_objective: z.string(),
  primary_psychology: z.string(),
  secondary_psychology: z.array(z.string()),
  recommended_framework: z.string(),
  backup_frameworks: z.array(z.string()),
  recommended_hook_families: z.array(z.string()),
  research_required: z.boolean(),
  risk_level: z.enum(["low", "medium", "high"]),
});

const response = await openai.responses.parse({
  model: models.primary,
  input: [
    {
      role: "system",
      content: strategistPrompt,
    },
    {
      role: "user",
      content: idea,
    },
  ],
  text: {
    format: zodTextFormat(IdeaAnalysis, "idea_analysis"),
  },
});

const analysis = response.output_parsed;
```

If SDK helper syntax changes, follow the installed SDK version and current OpenAI docs.

---

# 39. OPENAI FILE SEARCH OPTION

OpenAI currently supports hosted File Search through the Responses API.

Possible use:

- Upload framework documents
- Put them in an OpenAI vector store
- Retrieve relevant framework context dynamically

Example concept:

```ts
const response = await openai.responses.create({
  model: models.primary,
  input: userInput,
  tools: [
    {
      type: "file_search",
      vector_store_ids: [process.env.OPENAI_VECTOR_STORE_ID!],
      max_num_results: 6,
    },
  ],
});
```

## Recommendation for this product

Use:

- Supabase/Postgres as the canonical application database
- pgvector or OpenAI embeddings for user history and memory
- Optional OpenAI File Search for static documents if it simplifies V1

Do not make the entire product dependent on OpenAI's hosted file store.

The user's historical data should remain queryable in the application's own database.

---

# 40. EMBEDDINGS

Recommended model:

```text
text-embedding-3-small
```

Use embeddings for:

- Similar previous posts
- User notes
- Knowledge docs
- Feedback memory
- Final posts
- Topic clusters

Example:

```ts
const embedding = await openai.embeddings.create({
  model: models.embedding,
  input: text,
  encoding_format: "float",
});

const vector = embedding.data[0].embedding;
```

Store with pgvector.

---

# 41. WEB RESEARCH / FACT CHECK

The product must distinguish:

## No external research normally required

- Opinion
- Personal reflection
- User-supplied experience
- Creative framing
- Evergreen advice where no factual assertion is important

## Research normally required

- "Today"
- "Just released"
- Current model comparisons
- Pricing
- Legal requirements
- Regulation
- Statistics
- Security claims
- Current company information
- Product capabilities
- Research findings
- Named current events

OpenAI Responses API currently supports web search.

Concept:

```ts
const response = await openai.responses.create({
  model: models.deep,
  input: researchQuestion,
  tools: [{ type: "web_search" }],
});
```

The system must not turn uncertainty into confident prose.

If a claim cannot be verified:

- Remove it
- Qualify it
- Ask the user
- Or flag it

Never invent a product, feature, statistic, law or quote to improve a post.

---

# 42. RESEARCH RISK CLASSIFICATION

### Low risk

Examples:

- Personal opinion
- General writing advice
- Personal story

### Medium risk

Examples:

- Technical explanation
- Product capability
- Company comparison
- Historical factual claims

### High risk

Examples:

- Law
- Regulation
- Medical
- Finance
- Security vulnerabilities
- Statistics used as authority
- Current news

High-risk claims should receive a dedicated verification pass.

---

# 43. MULTI-STAGE AGENT DESIGN

Do not use one enormous prompt.

Use specialised stages.

## Agent 1 — Strategist

Responsibilities:

- Understand idea
- Identify audience
- Identify content pillar
- Select psychology
- Select framework
- Determine proof requirement
- Determine research requirement
- Determine CTA

Output:

Structured JSON only.

---

## Agent 2 — Retriever

Responsibilities:

Retrieve:

- Relevant frameworks
- User voice rules
- Similar approved posts
- Relevant knowledge
- Relevant feedback patterns

No drafting.

---

## Agent 3 — Hook Engine

Responsibilities:

- Generate candidates
- Vary hook families
- Avoid near-duplicates
- Use source framework rules
- Do not invent facts

Output:

Structured list.

---

## Agent 4 — Hook Critic

Responsibilities:

Score and rank hooks.

Reject:

- Generic hooks
- Fake controversy
- Unsupported facts
- Hooks body cannot fulfil
- Bad voice fit
- Clickbait

---

## Agent 5 — Outline Builder

Responsibilities:

Build the actual post movement.

Output example:

```json
{
  "hook": "",
  "framework": "c2c_post_formula",
  "sections": [
    {
      "role": "problem",
      "purpose": ""
    },
    {
      "role": "tension",
      "purpose": ""
    },
    {
      "role": "proof",
      "purpose": ""
    },
    {
      "role": "lesson",
      "purpose": ""
    },
    {
      "role": "cta",
      "purpose": ""
    }
  ]
}
```

---

## Agent 6 — Writer

Responsibilities:

- Write the first draft
- Follow the selected structure
- Preserve user voice
- Use retrieved knowledge
- Avoid generic AI prose
- Keep factual claims within evidence

The writer is not allowed to silently add invented personal experiences.

---

## Agent 7 — Critic

Responsibilities:

Evaluate:

- Hook fulfilment
- Clarity
- Specificity
- Movement
- Proof
- Repetition
- Voice
- AI-sounding language
- CTA
- Framework visibility
- Unsupported claims

Return:

- Scores
- Problems
- Specific fixes

---

## Agent 8 — Revision Writer

Receives:

- Original draft
- Critic report
- User voice profile
- Framework
- Research evidence

Returns improved first draft.

---

## Agent 9 — Fact Checker

Run only when necessary.

Responsibilities:

- Extract factual claims
- Mark each claim as verified / unsupported / opinion / user-provided experience
- Research current claims where tools are available
- Flag anything unsafe to publish as fact

Do not reveal private chain-of-thought.

Return concise evidence summaries.

---

# 44. MASTER GENERATION RULE

The application should optimise for:

```text
Relevant
+ Specific
+ Human
+ Credible
+ Useful
+ Strategically structured
+ Aligned to the user's actual voice
```

Not:

```text
Maximum hype
+ Maximum emotion
+ Maximum virality
```

The product should help create effective business content, not engagement bait.

---

# 45. DATABASE MODEL

Recommended Supabase/Postgres tables.

---

## users

```text
id
email
name
created_at
updated_at
```

---

## profiles

```text
id
user_id
bio
expertise
target_audience
positioning
offers
goals
voice_profile_json
created_at
updated_at
```

---

## ideas

```text
id
user_id
raw_idea
topic
status
analysis_json
created_at
updated_at
```

---

## posts

```text
id
user_id
idea_id
title_internal
topic
content_pillar
framework_id
psychology_json
hook_family
selected_hook
draft_text
final_text
status
research_required
created_at
updated_at
published_at
```

---

## post_versions

```text
id
post_id
version_number
text
source
created_at
```

Source enum:

```text
ai_draft
ai_revision
user_edit
final
```

---

## feedback_events

```text
id
user_id
post_id
version_id
feedback_type
original_text
replacement_text
reason_summary
tags_json
created_at
```

---

## framework_definitions

```text
id
name
source
category
description
rules_json
examples_json
active
created_at
updated_at
```

---

## knowledge_documents

```text
id
user_id
title
source
knowledge_type
raw_text
metadata_json
embedding
created_at
updated_at
```

---

## user_post_embeddings

```text
id
post_id
user_id
embedding
metadata_json
```

---

## performance_metrics

```text
id
post_id
impressions
reactions
comments
reposts
profile_views
leads
notes
captured_at
```

Use only metrics actually available.

Do not infer unavailable metrics.

---

# 46. POST STATE MACHINE

```text
idea_captured
→ analysed
→ research_pending
→ researched
→ hooks_generated
→ hook_selected
→ outlined
→ drafted
→ critiqued
→ ready_for_review
→ user_edited
→ approved
→ published
→ performance_recorded
```

Allow skipping irrelevant states.

---

# 47. UI: MVP

## Main screen

Large idea box:

> "What's the idea?"

Optional controls:

- Audience override
- Objective override
- Length
- CTA
- Tone
- Research toggle
- Advanced strategy

Primary action:

> Build post

---

## Strategy screen

Show:

- Detected audience
- Content pillar
- Psychology
- Framework
- Research status

Allow edit.

Do not force user to review strategy every time.

---

## Hook screen

Show 3–5 strongest hooks.

Each should display:

- Hook
- Hook family
- Optional score

Actions:

- Use this
- Generate more
- Edit
- Skip and let system choose

---

## Draft screen

Show:

- Final selected hook
- Full post
- Framework used
- Research indicator

Actions:

- Rewrite
- More aggressive
- More conversational
- More technical
- Shorter
- Stronger opening
- Remove CTA
- Add CTA
- Save
- Approve

Every change becomes feedback data.

---

# 48. PRODUCT MODES

## Quick Draft

User gives idea.

System handles everything.

Output:

- One draft
- Three hooks

---

## Strategy Mode

User sees and can alter:

- Audience
- Psychology
- Framework
- Content pillar
- CTA

---

## Research Mode

For current / factual / high-risk posts.

Runs research first.

---

## Rewrite Mode

User pastes an existing draft.

System:

- Diagnoses it
- Chooses framework if missing
- Improves hook
- Removes filler
- Preserves argument

---

## Idea Miner — Future

User uploads:

- Transcript
- Meeting notes
- Podcast
- Long document

System extracts:

- Observations
- Stories
- Beliefs
- Problems
- Proof
- Contrarian angles
- Potential posts

---

# 49. USER ONBOARDING

## Step 1 — Identity

Collect:

- Role
- Expertise
- Businesses
- Audience
- Offers
- Goals

---

## Step 2 — Beliefs

Ask:

- What do you believe that your industry often gets wrong?
- What annoys you?
- What standards matter?
- What would you never recommend?
- What are you known for?

---

## Step 3 — Voice

Upload:

- 10–30 approved posts
- Optional writing samples

Ask user to identify:

- Favourite posts
- Posts that sound most like them
- Phrases they hate

---

## Step 4 — Knowledge

Upload:

- Framework docs
- Business docs
- Product docs
- Case studies
- Notes
- Research

---

# 50. LEARNING LOOP

```text
GENERATE
  ↓
USER EDITS
  ↓
COMPARE AI VS USER VERSION
  ↓
EXTRACT EDITORIAL PREFERENCE
  ↓
STORE FEEDBACK TAG
  ↓
RETRIEVE ON SIMILAR FUTURE POST
  ↓
GENERATE BETTER
```

The product should become materially better for the individual user over time.

---

# 51. PERFORMANCE LOOP — V2

When LinkedIn data is available:

```text
POST
  ↓
PERFORMANCE
  ↓
CONTENT ATTRIBUTES
  ↓
PATTERN ANALYSIS
  ↓
FUTURE STRATEGY
```

Do not make simplistic conclusions from one post.

Example:

Bad:

> Statement hooks always perform best.

Better:

> Across the user's last 20 authority posts, Statement and Story Opener hooks produced better median impressions than List hooks. Sample size remains limited.

Store sample sizes.

---

# 52. CONTENT PERFORMANCE ATTRIBUTES

Track:

- Hook family
- Framework
- Topic
- Content pillar
- Primary psychology
- Length
- CTA type
- Story vs non-story
- Proof present
- Post time if available
- Performance

Future recommendation:

> Similar governance posts performed best when framed around loss aversion and a direct Statement Hook.

Recommendations must be evidence-based.

---

# 53. COPYRIGHT / CREATOR FRAMEWORK RULE

The system may learn and apply general:

- Frameworks
- Psychological principles
- Structural patterns
- Copywriting mechanisms

It should not be designed to reproduce the distinctive voice of a living creator.

Examples:

Correct:

> Use Lara SLAY structure.

Correct:

> Use the Call-Out + High Stakes pattern.

Incorrect:

> Write exactly like Lara Acosta.

Incorrect:

> Clone Alex Hormozi's voice.

The product should develop **the user's voice**.

---

# 54. SYSTEM PROMPT: STRATEGIST

Suggested initial prompt:

```text
You are the strategy layer of a specialist LinkedIn content system.

Your job is NOT to write the post.

Analyse the user's raw idea and determine the strongest content strategy.

You have access to:
- the user's identity and positioning
- their historical posts
- their editorial preferences
- a library of content frameworks
- psychology frameworks
- hook frameworks
- relevant knowledge

Select frameworks based on fit. Never force one framework onto every idea.

Separate personal opinion from factual claims.

Never invent personal experiences, client results, statistics, quotes or product capabilities.

Flag current, legal, regulatory, statistical, security or technical claims for research when appropriate.

Your structured output must include:
- audience
- reader stage
- objective
- content pillar
- psychology
- framework
- hook families
- available proof
- missing proof
- research requirement
- CTA strategy

Optimise for relevance, specificity, credibility and useful business content.
```

---

# 55. SYSTEM PROMPT: WRITER

```text
You are the writing layer of a specialist LinkedIn content system.

You receive an approved strategy, selected hook, framework, user voice profile, retrieved personal knowledge and verified research where applicable.

Write the post using those inputs.

Rules:
- Honour the selected hook.
- The body must fulfil the promise or tension created by the hook.
- Do not invent facts.
- Do not invent personal experience.
- Do not imitate another creator's distinctive writing voice.
- Use UK English when configured.
- Prefer specificity to generic claims.
- Prefer proof to authority language.
- Use natural paragraph rhythm.
- Do not mechanically label framework stages.
- Do not make the framework visible to the reader.
- Avoid generic AI filler.
- Avoid empty inspirational endings.
- Use one CTA at most unless explicitly requested otherwise.
```

---

# 56. SYSTEM PROMPT: CRITIC

```text
You are the editorial critic.

Your job is to make the post better, not to be polite.

Evaluate:
1. Does the hook stop the intended reader?
2. Does the body fulfil the hook?
3. Is there a clear point?
4. Is there real movement?
5. Is there enough specificity?
6. Is proof used where available?
7. Does anything sound generic or AI-generated?
8. Is any claim unsupported?
9. Is the selected framework serving the idea or making it formulaic?
10. Does the CTA fit the post?
11. Does it match the user's stored voice preferences?

Return:
- score
- problems
- exact changes required

Do not write a long essay.
```

---

# 57. SYSTEM PROMPT: FACT CHECKER

```text
You are the factual verification layer.

Extract every externally verifiable claim from the draft.

Classify each as:
- user-provided experience
- opinion
- evergreen factual claim
- current factual claim
- legal/regulatory claim
- statistic
- unsupported

Research where required.

Do not treat an LLM's prior output as evidence.

If a claim cannot be verified, mark it clearly.

Never improve the copy by inventing certainty.
```

---

# 58. SYSTEM PROMPT: FEEDBACK EXTRACTOR

```text
Compare the AI draft with the user's edited version.

Do not infer private psychology or hidden motivations.

Extract only observable editorial preferences.

Examples:
- removed generic opening
- preferred direct audience callout
- shortened explanation
- removed repeated premise
- replaced formal phrase with conversational wording
- removed aggressive CTA
- added technical specificity

Return concise reusable tags and a one-sentence preference summary.
```

---

# 59. FIRST VERSION: WHAT TO BUILD

V1 should do five things extremely well:

1. Store the user's identity and voice
2. Store the supplied frameworks
3. Accept a rough idea
4. Generate strategically selected hooks + a strong first draft
5. Learn from edits

Do **not** waste V1 time on:

- Social scheduling
- Auto comments
- LinkedIn scraping
- Team accounts
- Complex billing
- Mobile apps
- Analytics dashboards
- 50 content types

Make the content engine excellent first.

---

# 60. V1 BUILD PHASES

## Phase 1 — Foundation

- Next.js app
- Supabase
- Auth
- Database schema
- OpenAI API
- Framework seed data

## Phase 2 — Strategy engine

- Idea analysis
- Framework selector
- Psychology selector
- Content pillar classifier

## Phase 3 — Hook engine

- Hook generation
- Hook scoring
- Hook selection UI

## Phase 4 — Draft engine

- Retrieval
- Outline
- Writer
- Critic
- Revision

## Phase 5 — Memory

- Version history
- User edits
- Feedback extraction
- Preference retrieval

## Phase 6 — Research

- Claim classifier
- OpenAI web search
- Fact-check report

## Phase 7 — Polish

- UI
- History
- Search
- Settings
- Framework inspector

---

# 61. FUTURE VERSION 2

Potential additions:

- LinkedIn publishing
- Performance analytics
- Content calendar
- Transcript ingestion
- Voice notes
- Telegram / WhatsApp capture
- Image / carousel brief generator
- Content repurposing
- Team mode
- Multiple brands
- Client workspaces
- SaaS onboarding
- Framework marketplace
- Automatic weekly idea mining

---

# 62. FUTURE VERSION 3: CONTENT INTELLIGENCE

Long-term system:

```text
USER KNOWLEDGE
+
USER IDENTITY
+
USER WRITING HISTORY
+
EDITORIAL FEEDBACK
+
FRAMEWORK LIBRARY
+
PSYCHOLOGY
+
REAL POST PERFORMANCE
+
CURRENT RESEARCH
=
PERSISTENT CONTENT INTELLIGENCE SYSTEM
```

At that point the application should be able to answer:

- What should I talk about this week?
- Which angles have I overused?
- Which topics are generating actual leads?
- What did I say about this six months ago?
- Which framework best fits this idea?
- Which hooks work best for this audience?
- What opinion do I repeatedly express?
- Which posts should become carousels?
- Which client conversations contain content ideas?
- What should I stop posting?

---

# 63. SUCCESS CRITERIA

The product is successful if:

- The user provides less prompting over time
- First drafts require fewer edits
- The system stops repeating previously rejected patterns
- Posts remain recognisably the user's voice
- Framework choice varies naturally
- The user spends more time judging ideas and less time prompting
- Factual errors decrease
- The system can explain, briefly, why it chose a structure
- Previous writing and knowledge meaningfully improve new drafts

---

# 64. FAILURE CONDITIONS

The product has failed if:

- Every post sounds the same
- Every post uses SLAY
- Every hook is outrage bait
- The model invents personal stories
- The model invents statistics
- The model invents AI products or features
- Old posts are copied rather than used as context
- User edits are stored but never retrieved
- Performance metrics become fake certainty
- The framework becomes visible and robotic
- The app is just ChatGPT behind a new UI

---

# 65. NON-NEGOTIABLE RULES

1. Never hallucinate to make a draft sound stronger.
2. Never invent personal experience.
3. Never invent client results.
4. Never invent current product capabilities.
5. Never invent legal requirements.
6. Never invent quotes.
7. Never use a hook the body cannot deliver.
8. Never force one framework onto every idea.
9. Never prioritise "viral" over credible.
10. Never copy another creator's voice.
11. Always learn from explicit user edits.
12. Keep one canonical user profile.
13. Keep API keys server-side.
14. Make models configurable.
15. Preserve full post version history.

---

# 66. RECOMMENDED REPOSITORY STRUCTURE

```text
/
├── app/
│   ├── api/
│   │   ├── ideas/
│   │   ├── posts/
│   │   ├── hooks/
│   │   ├── feedback/
│   │   ├── research/
│   │   └── knowledge/
│   ├── dashboard/
│   ├── posts/
│   ├── knowledge/
│   └── settings/
│
├── src/
│   ├── agents/
│   │   ├── strategist.ts
│   │   ├── hook-generator.ts
│   │   ├── hook-critic.ts
│   │   ├── outline-builder.ts
│   │   ├── writer.ts
│   │   ├── critic.ts
│   │   ├── fact-checker.ts
│   │   └── feedback-extractor.ts
│   │
│   ├── frameworks/
│   │   ├── nexus-hooks.ts
│   │   ├── psychology.ts
│   │   ├── lara-slay.ts
│   │   ├── psych-slay-variant.ts
│   │   └── c2c.ts
│   │
│   ├── retrieval/
│   │   ├── embeddings.ts
│   │   ├── post-memory.ts
│   │   ├── knowledge-search.ts
│   │   └── framework-retrieval.ts
│   │
│   ├── lib/
│   │   ├── openai.ts
│   │   ├── supabase.ts
│   │   └── db.ts
│   │
│   ├── schemas/
│   └── prompts/
│
├── supabase/
│   └── migrations/
│
├── docs/
│   ├── product-spec.md
│   ├── framework-sources/
│   └── architecture.md
│
├── .env.example
├── AGENTS.md
└── README.md
```

---

# 67. RECOMMENDED FIRST CLAUDE CODE / CODEX TASK

```text
Read this entire specification before writing code.

Do not start by building the UI.

First:

1. Create the project architecture.
2. Define the database schema.
3. Seed the framework definitions.
4. Create TypeScript schemas for every agent boundary.
5. Create the OpenAI client and environment validation.
6. Implement the Strategist with structured output.
7. Write tests for framework selection.
8. Implement Hook Generator + Hook Critic.
9. Implement the Writer and Critic.
10. Add persistent post/version/feedback storage.
11. Only then build the basic interface.

Use a modular architecture.

Do not place all content intelligence inside one system prompt.

Framework definitions must be data-driven and independently editable.

All OpenAI model IDs must be environment-configurable.

Never expose secret API keys to client code.
```

---

# 68. BUILD DEFINITION OF DONE FOR V1

A V1 build is complete when the following works end-to-end:

1. User logs in.
2. User has a stored identity/voice profile.
3. Framework library is loaded.
4. User enters one rough idea.
5. Strategist returns structured analysis.
6. Relevant knowledge/history is retrieved.
7. Hook engine generates multiple hooks from appropriate families.
8. Hooks are scored.
9. Best hook is selected.
10. Outline is created.
11. First draft is written.
12. Critic evaluates it.
13. Revised draft is returned.
14. User edits it.
15. System saves both versions.
16. Feedback extractor stores reusable preference tags.
17. Next relevant post retrieves those preferences.
18. Research mode can verify high-risk/current claims.
19. User can inspect post history.
20. No secret keys are exposed in the browser.

---

# 69. SOURCE LINEAGE

## User-supplied sources incorporated

### Nexus IQ Systems Hook Library

Used for:

- Seven hook types
- Hook purpose
- Hook formulas
- Hook examples
- "Write the hook first" principle
- Body must fulfil hook principle

### LinkedIn Psychological Trigger Framework

Used for:

- Cognitive fluency
- Information gap
- Loss aversion
- Status signalling / identity
- Hormozi-style structural hook patterns
- Reciprocity
- Choice reduction
- Setup / Lead-In / Anticipation / Yield framework variant

### The Content Formula / C2C Interactive Workbook

Used for:

- Connection beats polish
- Authentic personal brand principle
- Content movement
- C2C content engine
- Audience journey
- Six content pillars
- Hook → Problem → Tension → Proof → Lesson → CTA
- Story devices
- Inspiration principle
- Content priority heuristics
- Old habit / better approach rules
- 30-day plan
- Weekly rhythm
- Quality control checklist
- Workshop principles

### Lara Acosta SLAY image

Used for:

- Story
- Lesson
- Actionable Advice
- You

---

# 70. OPENAI IMPLEMENTATION REFERENCES

Verified against current OpenAI developer documentation at the time this specification was prepared.

Relevant official documentation:

- Responses API / migration guide  
  https://developers.openai.com/api/docs/guides/migrate-to-responses

- Structured Outputs  
  https://developers.openai.com/api/docs/guides/structured-outputs

- File Search  
  https://developers.openai.com/api/docs/guides/tools-file-search

- Embeddings  
  https://developers.openai.com/api/docs/guides/embeddings

- Model catalogue  
  https://platform.openai.com/docs/models

OpenAI currently recommends the Responses API for new projects.

File Search can retrieve from uploaded knowledge bases through OpenAI vector stores.

Structured Outputs can constrain model responses to JSON Schema.

Embeddings can be stored in a vector database and used for semantic retrieval.

---

# 71. FINAL PRODUCT PRINCIPLE

The finished product should feel less like:

> "Ask AI to write a LinkedIn post."

And more like:

> "Give a specialist content strategist one rough idea. It already understands your positioning, your knowledge, your voice, your frameworks, your past writing, your corrections and what has worked before."

The system's competitive value is not the base model alone.

The value is:

**Context + frameworks + retrieval + orchestration + editorial memory + feedback + evidence.**

That is the product.

