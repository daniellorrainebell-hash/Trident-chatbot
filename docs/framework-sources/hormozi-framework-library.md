# ALEX HORMOZI FRAMEWORK LIBRARY FOR THE NEXUS IQ LINKEDIN CONTENT ENGINE
## Source-Grounded Offer, Lead, Content and Conversion Frameworks

**Purpose:** Knowledge module for a LinkedIn content intelligence system  
**Primary use:** Help the system choose stronger commercial angles, build clearer offers, create better hooks, structure conversion-oriented posts, frame value, surface objections, and create content that supports real business outcomes  
**Source basis:** Publicly available Acquisition.com materials, public Alex Hormozi podcast/transcript material, and public descriptions of the $100M Offers / $100M Leads / $100M Money Models frameworks  
**Important:** This document is a structured summary and implementation guide. It is not a reproduction of the books or paid course material.

---

# 1. HOW THIS MODULE SHOULD BE USED

This is **not** a style-cloning file.

The system must not try to "write like Alex Hormozi."

Instead, it should use the underlying mechanisms:

- Market selection
- Value creation
- Offer construction
- Risk reversal
- Scarcity
- Urgency
- Bonuses
- Naming
- Lead generation
- Content structure
- Audience goodwill
- Scaling logic
- Sales conversation logic

The app should combine these with:

- The user's own voice
- The Nexus IQ Hook Library
- C2C Content Formula
- Lara Acosta's SLAY framework
- Psychology module
- User post history
- User edit memory
- Research / fact-checking

---

# 2. SOURCE LINEAGE

The following named Hormozi frameworks are publicly documented by Acquisition.com or Hormozi's own public content:

## $100M Offers

- Grand Slam Offer
- Value Equation
- Starving Crowd / market selection
- Premium pricing / price-value discrepancy
- Delivery Cube
- 10x / 1/10th test
- Trim & Stack
- Offer Stacking
- Scarcity Stack
- Everyday Urgency
- Bonuses
- Four Guarantee Types
- MAGIC Naming Formula
- Objection elimination

## $100M Leads

- Core Four
- Hook → Retain → Reward
- Give Until They Ask
- Give in Public, Ask in Private
- Integrated vs Intermittent Offers
- Rule of 100
- More → Better → New
- Lead Magnets
- Lead Getters

## $100M Money Models

- Attraction Offers
- Upsell Offers
- Downsell Offers
- Continuity Offers
- Customer-Financed Acquisition
- Advanced Offer Stacking
- Lifetime Value Engineering

## Sales

- CLOSER Framework

---

# 3. CORE PRINCIPLE: AN OFFER IS MORE THAN THE PRODUCT

For this system, distinguish:

```text
PRODUCT
=
what is delivered

OFFER
=
product
+ outcome
+ positioning
+ price
+ delivery method
+ bonuses
+ guarantees
+ urgency
+ scarcity
+ naming
+ proof
+ risk reversal
```

A LinkedIn content system should therefore never treat a commercial post as:

> "Explain the service."

Instead, it should ask:

- What outcome is being sold?
- What problem is being solved?
- What makes this different?
- What makes success feel believable?
- How quickly can the buyer experience value?
- What effort is removed?
- What risk is reduced?
- What objections can be handled before the CTA?

---

# 4. THE GRAND SLAM OFFER

**Internal ID:** `hormozi_grand_slam_offer`

## Concept

The Grand Slam Offer is the core $100M Offers concept.

The objective is to create an offer that is difficult to compare directly with alternatives because the perceived value is significantly greater than the price.

For the LinkedIn engine, use this as a **commercial diagnostic**.

Do not blindly turn every post into a sales pitch.

Use it when the content objective is:

- Lead generation
- Conversion
- Product launch
- Service positioning
- Offer announcement
- Case study with CTA
- Commercial education

---

# 5. GRAND SLAM OFFER DIAGNOSTIC

Before writing a sales-oriented post, assess:

```json
{
  "market": {
    "pain": 0,
    "purchasing_power": 0,
    "targetability": 0,
    "growth": 0
  },
  "value_equation": {
    "dream_outcome": 0,
    "perceived_likelihood": 0,
    "time_delay": 0,
    "effort_and_sacrifice": 0
  },
  "offer": {
    "differentiation": 0,
    "risk_reversal": 0,
    "proof": 0,
    "bonuses": 0,
    "scarcity": 0,
    "urgency": 0,
    "name_strength": 0
  }
}
```

Use scores as internal heuristics only.

Do not tell the user that a score is scientifically validated.

---

# 6. MARKET SELECTION: THE "STARVING CROWD"

**Internal ID:** `hormozi_starving_crowd`

Hormozi's market-selection framework centres on four indicators.

## 6.1 Massive Pain

Ask:

- Is the problem expensive?
- Is it urgent?
- Is the person already aware of it?
- Does solving it materially improve their situation?
- Is the problem painful enough to trigger action?

LinkedIn application:

Prefer content around problems the audience already feels.

Bad:

> "AI agents are interesting."

Better:

> "Your AI receptionist is useless if every qualified caller still waits until Monday for a human response."

The second connects the subject to an existing business pain.

---

## 6.2 Purchasing Power

Ask:

- Can the target market afford the solution?
- Does the problem justify the likely spend?
- Is there an economic buyer?

LinkedIn application:

A post aimed at generating £2,000/month AI clients should speak to businesses where the value created can plausibly exceed £2,000/month.

Do not create content for an audience that likes the topic but cannot buy.

---

## 6.3 Easy to Target

Ask:

- Can the audience be identified?
- Do they share job titles?
- Industries?
- Communities?
- Platforms?
- Associations?
- Behaviours?
- Search intent?

LinkedIn is especially compatible with this lever because job title, business type and industry can often be called out directly.

Useful hooks:

> Recruitment agency owners...

> If you're selling AI systems to SMEs...

> Service businesses losing enquiries after 5pm...

---

## 6.4 Growing

Ask:

- Is demand expanding?
- Is the audience growing?
- Is regulation or technology creating urgency?
- Is this problem becoming more important?

For current market claims, research is required.

Do not infer that a market is growing simply because the topic is popular.

---

# 7. MARKET PRIORITY PRINCIPLE

A practical hierarchy derived from $100M Offers:

```text
MARKET DEMAND
    ↓
OFFER STRENGTH
    ↓
PERSUASION
```

Application to content:

Before trying to create a "better hook," ask whether the idea is attached to something the audience cares about.

A brilliant post cannot rescue a subject with no relevance to the target buyer.

---

# 8. THE VALUE EQUATION

**Internal ID:** `hormozi_value_equation`

The Value Equation is the most useful Hormozi framework for this LinkedIn system.

```text
VALUE
=
(Dream Outcome × Perceived Likelihood of Achievement)
÷
(Time Delay × Effort & Sacrifice)
```

The system should treat this as a **diagnostic**, not literal financial maths.

---

# 9. VALUE EQUATION LEVER 1: DREAM OUTCOME

## Definition

What does the buyer ultimately want?

Not the feature.

Not the tool.

Not the implementation.

The result.

Examples:

Feature:

> AI receptionist

Dream outcome:

> Every valuable call gets answered and qualified without adding another receptionist.

Feature:

> Governance document

Dream outcome:

> Sell and deploy AI systems with a governance framework built around the real deployment and ready for independent legal review.

Feature:

> Content tool

Dream outcome:

> Turn rough ideas into credible LinkedIn posts without spending an hour repeatedly correcting generic AI drafts.

---

# 10. DREAM OUTCOME QUESTIONS

The strategist should ask internally:

- What does the reader actually want?
- What becomes easier after success?
- What pain disappears?
- What financial result improves?
- What status or confidence improves?
- What business capability becomes possible?

For LinkedIn writing, translate technical products into operational outcomes.

---

# 11. VALUE EQUATION LEVER 2: PERCEIVED LIKELIHOOD OF ACHIEVEMENT

## Definition

How strongly does the buyer believe the promised outcome will happen?

Increase through:

- Proof
- Demonstrations
- Case studies
- Screenshots
- Specific methodology
- Clear process
- Credentials where relevant
- Guarantees where appropriate
- Testimonials
- Real examples

LinkedIn application:

A claim becomes more persuasive when supported.

Weak:

> "AI can save your business hours."

Stronger:

> "This workflow removed the manual handoff between the web form, CRM and follow-up sequence."

The second shows the mechanism.

---

# 12. PERCEIVED LIKELIHOOD RULE

The content engine should prefer:

```text
CLAIM + MECHANISM + PROOF
```

over:

```text
CLAIM + HYPE
```

Do not manufacture proof.

---

# 13. VALUE EQUATION LEVER 3: TIME DELAY

## Definition

How long does the buyer believe they must wait before receiving meaningful value?

Decrease perceived time delay through:

- Fast onboarding
- Immediate wins
- Pre-built assets
- Templates
- Automation
- Done-for-you implementation
- Clear milestones
- Faster response
- Shorter setup
- Visible early progress

LinkedIn application:

If the offer has a genuine fast result, include it.

Example:

> "We can map the governance requirements before the system reaches production."

Do not invent turnaround times.

---

# 14. VALUE EQUATION LEVER 4: EFFORT AND SACRIFICE

## Definition

What must the buyer do, learn, endure or give up to get the result?

Reduce:

- Complexity
- Meetings
- Manual work
- Technical setup
- Training
- Admin
- Risk
- Switching effort
- Cognitive load

This is extremely relevant to Nexus IQ positioning.

Example:

Weak:

> "We provide governance templates."

Stronger:

> "We map the deployment, build the governance pack around it and hand it over ready for legal review."

Same category.

Far less buyer effort.

---

# 15. VALUE EQUATION CONTENT DIAGNOSTIC

For any commercial post, ask:

```text
Can we strengthen the dream outcome?

Can we make success feel more believable?

Can we show a faster path to value?

Can we reduce the effort the buyer imagines?
```

If yes, use those levers in the post.

---

# 16. VALUE EQUATION CONTENT ANGLES

Possible LinkedIn angles:

## Dream Outcome angle

> Stop selling "AI automation." Sell the operational result.

## Likelihood angle

> Here's the exact control stack we build before deployment.

## Time angle

> The biggest AI implementation bottleneck isn't the model. It's the three-week handoff between systems.

## Effort angle

> The best automation removes decisions from the client, not just clicks from the process.

---

# 17. PROBLEM → SOLUTION OFFER BUILD

**Internal ID:** `hormozi_problem_solution_map`

A useful construction process:

```text
1. Identify dream outcome
2. List every obstacle
3. Turn every obstacle into a solution
4. Generate delivery methods
5. Select the highest-value combination
6. Stack into the offer
```

This is highly useful for:

- Product posts
- Service positioning
- Feature explanations
- Lead magnets
- Offer creation
- Sales pages

---

# 18. OBSTACLE MAPPING

For each buyer goal, list:

```text
Before starting:
- What stops them beginning?

During implementation:
- What makes it difficult?

After implementation:
- What creates risk?

Emotionally:
- What do they fear?

Operationally:
- What creates friction?

Financially:
- What makes the purchase feel risky?
```

Then turn each obstacle into:

- Core deliverable
- Bonus
- Guarantee
- Proof asset
- Onboarding step
- Content topic

---

# 19. CONTENT USE OF OBSTACLE MAPPING

A strong LinkedIn post can focus on **one obstacle**, not the entire offer.

Example:

Dream outcome:

> Deploy compliant AI systems.

Obstacle:

> Builder has no idea whether they're controller or processor.

Post:

> "If your AI product processes client customer data, 'we use Claude' isn't your data-processing structure."

This teaches one obstacle and naturally leads towards the offer.

---

# 20. THE DELIVERY CUBE

**Internal ID:** `hormozi_delivery_cube`

The Delivery Cube is used to generate alternative ways to fulfil value.

Public Hormozi material describes six dimensions.

---

# 21. DELIVERY CUBE DIMENSION 1: PERSONAL ATTENTION

Options include:

- One-to-one
- Small group
- One-to-many

Question:

> What degree of personal attention creates the best value-to-cost ratio?

---

# 22. DELIVERY CUBE DIMENSION 2: CLIENT EFFORT

Options:

- DIY
- Done With You
- Done For You

For Nexus IQ governance:

### DIY

Templates + implementation guide

### Done With You

Consultation + co-built framework

### Done For You

Nexus IQ maps deployment and produces the governance package

This can directly become a tiered offer.

---

# 23. DELIVERY CUBE DIMENSION 3: LIVE DELIVERY MEDIUM

Examples:

- In person
- Phone
- Email
- Video call
- Chat
- Messaging
- Support portal

---

# 24. DELIVERY CUBE DIMENSION 4: RECORDED CONSUMPTION

Examples:

- Written
- Audio
- Video
- Interactive
- Software

---

# 25. DELIVERY CUBE DIMENSION 5: SPEED / CONVENIENCE / SUPPORT

Questions:

- How quickly do they get help?
- What days?
- What hours?
- What response time?
- What can be automated?
- What can be self-service?

Do not promise SLAs in content unless operationally true.

---

# 26. DELIVERY CUBE DIMENSION 6: 10X / 1/10TH TEST

Ask both:

## 10X Test

> If this cost ten times more, what would we have to include?

This forces premium-value thinking.

## 1/10th Test

> If this cost one tenth as much, but still had to create excellent value, how would we deliver it?

This forces scalable delivery thinking.

---

# 27. 10X / 1/10TH CONTENT USE

This can become an ideation engine.

Example:

Topic:

> AI governance service

10X question:

> What would a £20,000 governance service include?

Possible content ideas:

- full deployment audit
- vendor/subprocessor map
- risk register
- policy pack
- incident playbook
- legal-review handover
- ongoing monitoring

1/10th question:

> What could still be useful at £200?

Possible content ideas:

- self-build policy framework
- risk questionnaire
- template pack
- governance checklist

The result is stronger offer differentiation and more content topics.

---

# 28. TRIM & STACK

**Internal ID:** `hormozi_trim_and_stack`

After generating many solutions:

1. Assess perceived value
2. Assess cost to deliver
3. Remove low-value components
4. Prefer high-value / low-cost assets
5. Retain selected high-value / high-cost components where they materially strengthen the offer
6. Stack the remaining components

---

# 29. TRIM & STACK MATRIX

```text
                    LOW DELIVERY COST    HIGH DELIVERY COST

HIGH VALUE          KEEP / PRIORITISE    SELECTIVELY KEEP

LOW VALUE           REMOVE               REMOVE FIRST
```

Use this for offer design.

---

# 30. LINKEDIN USE OF TRIM & STACK

Do not list 17 weak features in a post.

Instead:

- Pick the 3–5 strongest components
- Name them clearly
- Connect each to an objection or outcome
- Remove filler

---

# 31. OFFER STACKING

**Internal ID:** `hormozi_offer_stack`

An offer stack combines multiple value components so the buyer evaluates the total package rather than one isolated feature.

Possible stack structure:

```text
CORE OUTCOME
+
CORE DELIVERY
+
OBJECTION-SOLVING COMPONENTS
+
BONUSES
+
RISK REVERSAL
+
TIME / ACCESS ADVANTAGE
```

Content should never invent fake "£5,000 value" labels.

Only use monetary values where they are defensible.

---

# 32. BONUSES

**Internal ID:** `hormozi_bonuses`

Bonuses should solve additional buyer objections or accelerate the result.

Good bonus:

> AI Vendor Due-Diligence Checklist

because it solves a related governance obstacle.

Weak bonus:

> Random 30-page ebook

because it does not materially improve the outcome.

---

# 33. BONUS RULES FOR THE CONTENT ENGINE

When proposing a bonus:

- Link it to an obstacle
- Give it a clear name
- Explain the outcome
- Explain why it matters
- Prefer immediate utility
- Avoid filler
- Avoid fabricated value claims

---

# 34. SCARCITY

**Internal ID:** `hormozi_scarcity`

Hormozi distinguishes scarcity from urgency.

```text
SCARCITY = quantity constraint
URGENCY = time constraint
```

This distinction must be preserved.

---

# 35. SCARCITY RULE

Only use scarcity when real.

Examples:

- Five onboarding slots
- Capacity limited by legal review workload
- Limited number of done-for-you builds per month
- Physical stock

Never generate:

> "Only 3 spots left"

unless the system has evidence that only three spots remain.

---

# 36. URGENCY

**Internal ID:** `hormozi_urgency`

Urgency is a real time reason to act.

Examples:

- Regulation effective date
- Cohort start
- Price change date
- Event
- Deadline
- Seasonal window
- Implementation deadline

Research current dates where required.

---

# 37. ETHICAL URGENCY RULE

Never manufacture:

- Fake countdowns
- Fake deadlines
- Fake expiring bonuses
- Fake "today only" offers

The system should prefer:

> genuine reason why now

over:

> artificial pressure

---

# 38. FOUR GUARANTEE TYPES

**Internal ID:** `hormozi_guarantees`

Hormozi publicly describes four guarantee categories.

---

# 39. GUARANTEE TYPE 1: UNCONDITIONAL

A refund / reversal that does not require the buyer to satisfy performance conditions.

Strong risk reversal.

High seller exposure.

Use only if commercially appropriate.

The content engine may explain or present an existing unconditional guarantee.

It must never create one on behalf of the business without explicit user approval.

---

# 40. GUARANTEE TYPE 2: CONDITIONAL

The customer must satisfy defined conditions.

Example structure:

```text
If [measurable result] does not happen by [time]
and the client completes [defined required actions],
then [remedy].
```

This can align incentives because the conditions can represent the behaviours required for success.

---

# 41. GUARANTEE TYPE 3: ANTI-GUARANTEE

Explicitly state that the offer does not include a refund / guarantee.

This only works when there is a credible reason.

Never use it purely as macho positioning.

---

# 42. GUARANTEE TYPE 4: IMPLIED / PERFORMANCE-BASED

The commercial structure itself places risk on the seller.

Examples:

- Revenue share
- Profit share
- Pay per result
- Performance bonus
- Trigger payment

Use only where outcomes can be measured and the business truly offers this pricing model.

---

# 43. GUARANTEE CONTENT RULE

Never let AI invent guarantees.

Database field:

```json
{
  "guarantee": {
    "type": "",
    "terms": "",
    "approved": false
  }
}
```

Only approved guarantees can appear in generated posts.

---

# 44. MAGIC NAMING FORMULA

**Internal ID:** `hormozi_magic_naming`

Public Hormozi content defines MAGIC as:

```text
M = Magnet
A = Avatar
G = Goal
I = Interval
C = Container
```

Not every name needs all five.

The name should remain short enough to understand.

---

# 45. M — MAGNET

A reason to pay attention now.

Examples of categories:

- Free
- New
- Seasonal
- Event-based
- Launch
- Special condition

Do not use false promotions.

---

# 46. A — AVATAR

Identify who it is for.

Examples:

- AI agencies
- Estate agents
- Service businesses
- Recruitment founders
- Gym owners

Specificity helps self-selection.

---

# 47. G — GOAL

State the desired outcome.

Examples:

- Compliance Readiness
- Faster Lead Response
- More Booked Calls
- AI Governance
- Lower Admin Load

---

# 48. I — INTERVAL

Timeframe.

Examples:

- 30-Day
- 6-Week
- Quarterly
- Same-Day

Only use a result timeframe if true.

---

# 49. C — CONTAINER

Package word.

Examples:

- Blueprint
- Sprint
- System
- Audit
- Challenge
- Accelerator
- Playbook
- Framework
- Workshop
- Intensive

---

# 50. MAGIC EXAMPLE FOR THE CONTENT ENGINE

Generic:

> AI Governance Service

MAGIC-inspired options:

> AI Agency Governance Readiness Audit

> 30-Day AI Governance Implementation Sprint

> Service Business AI Compliance Blueprint

These are system-generated examples.

They are not Hormozi source examples.

---

# 51. NAMING RULE

The system may use the MAGIC structure.

It must not imitate Hormozi's wording.

Store only the framework mechanism.

---

# 52. OBJECTION PREEMPTION

**Internal ID:** `hormozi_objection_preemption`

Acquisition.com's current $100M Offers material explicitly teaches eliminating objections before they are raised.

For content, this is powerful.

Before writing a conversion post, identify:

```text
Why would the reader not buy?

Too expensive?
Too complicated?
Too slow?
Don't trust it?
Don't need it yet?
Already use another solution?
No time?
No internal skills?
Legal uncertainty?
Implementation risk?
```

Then choose 1–3 objections to address naturally in the post.

---

# 53. OBJECTION → CONTENT ANGLE

Example:

Offer:

> Done-for-you AI governance

Objection:

> "I'll just use a template."

Post angle:

> "A governance template cannot know what data your agent sends to which subprocessors."

The post educates instead of directly arguing.

---

# 54. $100M LEADS: CORE FOUR

**Internal ID:** `hormozi_core_four`

Hormozi's Core Four are the four basic ways one person makes another person aware of an offer.

For the content engine:

1. Warm outreach
2. Post free content
3. Cold outreach
4. Paid advertising

LinkedIn is directly relevant to:

- Free content
- Warm outreach
- Cold outreach
- Paid ads

---

# 55. CORE FOUR STRATEGIC USE

The LinkedIn tool can eventually support content beyond posting:

## Free Content

Current core product.

## Warm Outreach

Generate follow-up messages for people already connected to the user.

## Cold Outreach

Generate personalised outbound.

## Paid Ads

Repurpose strong organic angles into ad concepts.

V1 should remain focused on organic posts.

---

# 56. HOOK → RETAIN → REWARD

**Internal ID:** `hormozi_hrr`

This is one of the most useful Hormozi content frameworks for this product.

```text
HOOK
  ↓
RETAIN
  ↓
REWARD
```

---

# 57. HOOK

Give the audience a reason to start consuming.

For LinkedIn:

- First sentence
- First 2 lines
- Pattern interrupt
- Relevant problem
- Story tension
- Specific claim

Use the Nexus Hook Library to implement this stage.

---

# 58. RETAIN

Keep the reader consuming.

Mechanisms:

- Story movement
- Open loops
- Short paragraphs
- Specific examples
- Progressive reveals
- Lists
- Steps
- Tension
- Clear sequencing

Use C2C and SLAY for this layer.

---

# 59. REWARD

Deliver the value promised by the hook.

Examples:

- Insight
- Framework
- Explanation
- Answer
- Story payoff
- Practical advice
- Template
- Lesson

Critical rule:

```text
THE REWARD MUST SATISFY THE HOOK.
```

---

# 60. CONTENT UNIT

Hormozi describes the smallest useful content unit as enough material to:

```text
Hook
+
Retain
+
Reward
```

For LinkedIn, a post can contain multiple content units.

Example:

```text
HOOK
↓
REWARD 1
↓
NEW MINI HOOK
↓
REWARD 2
↓
NEW MINI HOOK
↓
REWARD 3
```

This prevents the middle of longer posts from going flat.

---

# 61. HRR QUALITY CHECK

For every post:

```json
{
  "hook": {
    "clear_reason_to_read": true,
    "relevant_to_audience": true
  },
  "retain": {
    "movement": true,
    "no_dead_middle": true
  },
  "reward": {
    "promise_fulfilled": true,
    "useful_payoff": true
  }
}
```

---

# 62. GIVE UNTIL THEY ASK

**Internal ID:** `hormozi_give_until_they_ask`

Hormozi's content strategy emphasises creating goodwill by giving significantly more value than is extracted from the audience.

Core idea:

```text
OVERGIVE VALUE
→ BUILD GOODWILL
→ AUDIENCE GROWS
→ PEOPLE ASK HOW TO BUY
```

---

# 63. GIVE IN PUBLIC, ASK IN PRIVATE

**Internal ID:** `hormozi_public_give_private_ask`

This is highly relevant to LinkedIn.

Strategic principle:

```text
PUBLIC CONTENT:
build reputation and goodwill

PRIVATE CONVERSATION:
handle commercial discussion when interest exists
```

This does not mean never using public CTAs.

It means the system should not make every post a pitch.

---

# 64. CONTENT MIX RULE

Allow users to choose:

```text
growth_bias
balanced
conversion_bias
```

### Growth bias

Few direct asks.

High teaching / proof / opinion.

### Balanced

Regular useful content with occasional CTAs.

### Conversion bias

More direct commercial posts.

The system should still prevent every post becoming a sales post.

---

# 65. INTEGRATED VS INTERMITTENT OFFERS

**Internal ID:** `hormozi_content_asks`

Hormozi publicly distinguishes:

## Integrated ask

A small CTA placed inside or at the end of a larger valuable piece.

Example:

> PS: If you're deploying an AI agent and need the governance mapped, message me.

## Intermittent ask

Most posts are pure value.

Occasionally publish a dedicated offer post.

The app can use either strategy.

---

# 66. RULE OF 100

**Internal ID:** `hormozi_rule_of_100`

The Rule of 100 is a volume framework from $100M Leads.

The public framework is:

```text
100 primary actions per day
for 100 days
```

For content, Hormozi's published material applies this as time spent making content rather than necessarily 100 posts.

The LinkedIn app should **not** recommend spam.

Instead, use the deeper principle:

> Sufficient repetitions create data, skill and opportunity.

---

# 67. RULE OF 100 ADAPTATION FOR LINKEDIN

Do not automatically tell the user to post 100 times.

Use:

```text
HIGH VOLUME OF MEANINGFUL REPETITIONS
+
CONSISTENCY
+
LEARNING
```

Possible application:

- 100 minutes per day writing / analysing content
- 100 hook iterations over a period
- 100 idea captures
- 100 meaningful comments / conversations where appropriate

Never automate abusive platform behaviour.

---

# 68. MORE → BETTER → NEW

**Internal ID:** `hormozi_more_better_new`

This is extremely useful for the content analytics module.

Order:

```text
MORE
  ↓
BETTER
  ↓
NEW
```

---

# 69. MORE

Do more of what already works.

Content examples:

- More posts on a proven topic
- More use of a proven framework
- More examples
- More proof-led content

Do not conclude a topic is exhausted from one post.

---

# 70. BETTER

Improve what works.

Test:

- Hook
- Story
- Length
- Specificity
- Proof
- CTA
- Format
- Angle

Change one meaningful variable where possible.

---

# 71. NEW

Only after existing execution has been pushed and improved:

- New topic
- New content pillar
- New platform
- New post format
- New audience
- New channel

This guards against novelty addiction.

---

# 72. ANALYTICS APPLICATION

Future recommendation engine:

```text
IF topic performs:
    recommend MORE

IF volume is high but conversion weak:
    recommend BETTER

IF more and better have plateaued:
    recommend NEW
```

Require enough data before making strong claims.

---

# 73. LEAD MAGNET PRINCIPLE

**Internal ID:** `hormozi_lead_magnet`

A lead magnet should solve a meaningful narrow problem rather than merely exist to collect an email address.

For LinkedIn:

Strong:

> AI Governance Pre-Deployment Checklist

Weak:

> Ultimate Guide to AI

Specificity improves relevance.

---

# 74. LEAD MAGNET CONTENT LOGIC

A useful free asset should:

1. Solve one problem
2. Demonstrate competence
3. Reveal the next meaningful problem
4. Connect naturally to the paid offer

Do not intentionally create incomplete junk.

The free item should genuinely help.

---

# 75. LEAD GETTERS

Hormozi's $100M Leads material describes other people who can perform lead-generation activity:

- Customers
- Employees
- Agencies
- Affiliates

Future SaaS use:

The content engine may eventually generate:

- Employee advocacy posts
- Referral posts
- Affiliate campaign content
- Partner content

Not required for V1.

---

# 76. CLOSER FRAMEWORK

**Internal ID:** `hormozi_closer`

CLOSER is primarily a sales framework, not a post framework.

However, its diagnostic logic is valuable for conversion content.

Public Hormozi descriptions define:

```text
C = Clarify
L = Label
O = Overview
S = Sell
E = Explain
R = Reinforce
```

More specifically:

- Clarify why they're here
- Label the problem
- Overview past experience / pain
- Sell the destination / desired result
- Explain concerns
- Reinforce the decision

---

# 77. CLOSER → LINKEDIN ADAPTATION

Do not mechanically use all six in a post.

Use as a commercial reasoning model.

Example:

### Clarify

Why does this reader care?

### Label

What is the real problem?

### Overview

What have they probably tried?

### Sell

What better outcome exists?

### Explain

What objection will stop them?

### Reinforce

Why is taking the next step rational?

---

# 78. CLOSER COMMERCIAL POST STRUCTURE

Possible adaptation:

```text
HOOK
↓
LABEL THE PROBLEM
↓
WHY CURRENT APPROACH FAILS
↓
BETTER OUTCOME
↓
OBJECTION HANDLING
↓
CTA
```

Use only when appropriate.

---

# 79. $100M MONEY MODELS: FOUR OFFER TYPES

**Internal ID:** `hormozi_money_models_offer_types`

Current Acquisition.com Money Models material groups offers into:

1. Attraction Offers
2. Upsell Offers
3. Downsell Offers
4. Continuity Offers

For a LinkedIn engine, these can improve commercial content planning.

---

# 80. ATTRACTION OFFERS

Purpose:

Get someone to begin the customer relationship.

Examples of categories in public Acquisition.com course navigation include:

- Giveaways
- Decoy offers
- Buy X Get Y
- Pay less now
- Free-with-consumption structures

The LinkedIn app should not generate discount mechanics automatically.

Use the broader idea:

> Create a low-friction reason to enter the relationship.

Examples for Nexus IQ:

- Audit
- Diagnostic
- Checklist
- Assessment
- Introductory consultation
- Mini implementation

---

# 81. UPSELL OFFERS

Purpose:

Increase customer value by offering a logical next improvement.

Content engine use:

After explaining a core offer, identify a natural advanced layer.

Example:

Core:

> Governance document pack

Upsell:

> Quarterly monitoring + document updates

---

# 82. DOWNSELL OFFERS

Purpose:

Give a lower-friction alternative when the primary offer is not suitable.

Nexus IQ example:

Primary:

> Fully built governance framework

Downsell:

> Tailored self-build documentation pack

This is directly relevant to the user's planned governance offer.

---

# 83. CONTINUITY OFFERS

Purpose:

Create recurring value and recurring revenue.

Nexus IQ example:

> Quarterly governance monitoring and updates

LinkedIn content can explain why the recurring component exists:

> Governance isn't finished the day the PDF is signed.

This makes the continuity model feel tied to actual value rather than a subscription for its own sake.

---

# 84. CUSTOMER-FINANCED ACQUISITION

**Internal ID:** `hormozi_customer_financed_acquisition`

Acquisition.com's public Money Models material describes structuring offers so customer cash helps fund acquisition.

For the LinkedIn engine, this is mostly **business strategy context**, not a writing framework.

Use only when the post is about:

- CAC
- payback period
- cash flow
- monetisation
- offer economics

Do not turn it into financial advice.

---

# 85. LIFETIME VALUE ENGINEERING

**Internal ID:** `hormozi_ltv_engineering`

Current Acquisition.com material emphasises increasing customer value over time.

Useful content angles:

- Retention
- Expansion
- Continuity
- Recurring service
- Upsell
- Cross-sell
- Churn reduction

The app can suggest posts about:

> What happens after the first sale?

---

# 86. HORMOZI COMMERCIAL CONTENT ENGINE

Combine the frameworks like this:

```text
IDEA
↓
IS THIS COMMERCIAL?
↓
MARKET PAIN
↓
VALUE EQUATION
↓
PRIMARY OBJECTION
↓
CONTENT PILLAR
↓
HOOK
↓
FRAMEWORK
↓
PROOF
↓
RISK REVERSAL IF APPROVED
↓
CTA
```

---

# 87. COMMERCIAL IDEA ANALYSIS SCHEMA

```json
{
  "is_commercial": true,
  "market_pain": "",
  "dream_outcome": "",
  "perceived_likelihood_levers": [],
  "time_delay_levers": [],
  "effort_reduction_levers": [],
  "primary_objection": "",
  "secondary_objections": [],
  "proof_available": [],
  "offer_components": [],
  "approved_guarantee": null,
  "real_scarcity": null,
  "real_urgency": null,
  "recommended_cta": ""
}
```

---

# 88. OFFER POST FRAMEWORK 1: VALUE EQUATION

**Internal ID:** `hormozi_post_value_equation`

Use when the audience misunderstands the value.

```text
HOOK
↓
DREAM OUTCOME
↓
WHAT MAKES SUCCESS MORE LIKELY
↓
WHAT MAKES IT FASTER
↓
WHAT EFFORT IS REMOVED
↓
PROOF
↓
CTA
```

---

# 89. OFFER POST FRAMEWORK 2: OBJECTION COLLAPSE

**Internal ID:** `hormozi_post_objection_collapse`

```text
HOOK THE OBJECTION
↓
WHY IT EXISTS
↓
WHY THE OLD APPROACH CREATES IT
↓
WHAT THE OFFER CHANGES
↓
PROOF
↓
CTA
```

Example:

> "I can just use a free governance template."

Then explain what templates cannot know about the actual deployment.

---

# 90. OFFER POST FRAMEWORK 3: DREAM OUTCOME VS MECHANISM

**Internal ID:** `hormozi_post_outcome_vs_mechanism`

```text
STOP SELLING THE MECHANISM
↓
NAME THE OUTCOME
↓
SHOW THE MECHANISM
↓
SHOW WHY IT IS BELIEVABLE
↓
CTA
```

Useful for technical founders who describe features instead of results.

---

# 91. OFFER POST FRAMEWORK 4: TIME / EFFORT FLIP

**Internal ID:** `hormozi_post_time_effort_flip`

```text
HOOK
↓
CURRENT PROCESS IS SLOW / HARD
↓
IDENTIFY THE FRICTION
↓
SHOW HOW IT IS REMOVED
↓
SHOW RESULT
↓
CTA
```

Excellent for automation content.

---

# 92. OFFER POST FRAMEWORK 5: DONE-FOR-YOU VS DIY

**Internal ID:** `hormozi_post_delivery_choice`

```text
PROBLEM
↓
DIY OPTION
↓
DONE-WITH-YOU OPTION
↓
DONE-FOR-YOU OPTION
↓
WHO EACH IS FOR
↓
CTA
```

Useful where the business genuinely offers tiers.

---

# 93. OFFER POST FRAMEWORK 6: RISK REVERSAL

**Internal ID:** `hormozi_post_risk_reversal`

Only use an approved guarantee.

```text
BUYER RISK
↓
WHY IT MATTERS
↓
HOW THE OFFER SHARES / REMOVES RISK
↓
TERMS
↓
PROOF
↓
CTA
```

---

# 94. CONTENT FRAMEWORK 7: HRR

```text
HOOK
↓
RETAIN
↓
REWARD
```

This should run as a universal quality layer even when another main narrative framework is used.

---

# 95. HORMOZI FRAMEWORK SELECTION LOGIC

## If content is about an offer

Use:

- Value Equation
- Objection Preemption
- Grand Slam Offer
- Proof

## If content is about product delivery

Use:

- Delivery Cube
- 10x / 1/10th
- Trim & Stack

## If content is about pricing

Use:

- Value Equation
- Market pain
- Perceived likelihood
- Premium-value framing

## If content is about audience growth

Use:

- HRR
- Give Until They Ask
- More Better New

## If content is about scaling content

Use:

- Rule of 100 principle
- More Better New

## If content is conversion oriented

Use:

- CLOSER logic
- Objection preemption
- Risk reversal
- One CTA

## If content announces a service

Use:

- MAGIC naming
- Value Equation
- Proof
- Clear audience

---

# 96. DO NOT FORCE HORMOZI FRAMEWORKS

The engine should reject Hormozi frameworks where they do not fit.

Examples:

A reflective personal story:

Prefer Lara SLAY or C2C.

A technical explainer:

Prefer C2C + HRR.

Breaking AI news:

Prefer Nexus hook + research + technical explanation.

A governance sales post:

Hormozi offer logic may be highly useful.

---

# 97. HORMOZI FRAMEWORK CRITIC

When a draft uses these mechanisms, ask:

- Is the pain real?
- Is the outcome specific?
- Does the audience have a reason to care?
- Is the value believable?
- Is proof present?
- Is time-to-value being stated truthfully?
- Is effort reduction real?
- Are bonuses actually useful?
- Is scarcity real?
- Is urgency real?
- Is the guarantee approved?
- Is the offer name clear?
- Is the post over-selling?
- Is the reader rewarded?
- Has the CTA earned the right to exist?

---

# 98. ANTI-HYPE GUARDRAIL

The Hormozi framework should **not** cause the model to become louder.

It should cause the model to become clearer.

Bad application:

> THIS INSANE AI SYSTEM WILL 10X YOUR BUSINESS TODAY.

Good application:

> If your voice agent answers the phone but still dumps every caller into the same CRM queue, you've automated the call, not the process.

Mechanism:

- Specific problem
- Clear pain
- Implied solution
- No unsupported hype

---

# 99. CLAIM INTEGRITY RULE

Hormozi frameworks often encourage specificity.

Specificity must come from facts.

Never fabricate:

- Revenue
- Percentages
- Client counts
- Results
- Timeframes
- Offer capacity
- Customer demand
- Refund rates
- Conversion rates
- Testimonials

If unavailable, use qualitative specificity instead.

---

# 100. SCARCITY / URGENCY DATA MODEL

```json
{
  "scarcity": {
    "active": false,
    "type": "",
    "quantity": null,
    "reason": "",
    "verified_at": null
  },
  "urgency": {
    "active": false,
    "deadline": null,
    "reason": "",
    "verified_at": null
  }
}
```

Generator may only use these fields if active and verified.

---

# 101. OFFER KNOWLEDGE MODEL

Store each offer as structured data.

```json
{
  "offer_name": "",
  "avatar": "",
  "problem": "",
  "dream_outcome": "",
  "core_deliverables": [],
  "delivery_mode": "DIY|DWY|DFY|mixed",
  "time_to_first_value": "",
  "client_effort": "",
  "proof": [],
  "bonuses": [],
  "guarantee": null,
  "scarcity": null,
  "urgency": null,
  "price": null,
  "cta": ""
}
```

This is better than forcing the LLM to reconstruct the offer from old posts every time.

---

# 102. HORMOZI CONTENT MEMORY TAGS

Possible tags:

```text
value_equation
dream_outcome
likelihood
time_delay
effort_reduction
market_pain
objection
proof
risk_reversal
scarcity
urgency
bonus
magic_name
hook_retain_reward
give_until_they_ask
more_better_new
rule_of_100
lead_magnet
conversion
closer
```

---

# 103. EXAMPLE: GOVERNANCE POST STRATEGY

Raw idea:

> Builders are selling Claude-built AI products without governance.

Possible Hormozi analysis:

```json
{
  "market_pain": "legal and operational exposure",
  "dream_outcome": "sell and deploy AI confidently with governance mapped",
  "perceived_likelihood": [
    "deployment-specific framework",
    "data-flow mapping",
    "legal-review handover"
  ],
  "time_delay": "governance handled before production",
  "effort_reduction": "done-for-you option",
  "primary_objection": "I can use a generic policy template",
  "content_framework": "objection_collapse",
  "hook_family": "statement",
  "cta": "message Nexus IQ about governance build"
}
```

---

# 104. EXAMPLE: GOVERNANCE SERVICE STACK

Illustrative structure:

```text
CORE:
Deployment-specific governance framework

STACK:
- AI use register
- data-flow mapping
- controller / processor mapping
- vendor / subprocessor review
- DPIA screening
- human oversight requirements
- incident procedures
- change control
- legal-review handover

DOWNSELL:
Self-build pack

CONTINUITY:
Quarterly monitoring + update service
```

Only include deliverables the business genuinely offers.

---

# 105. EXAMPLE: LINKEDIN CONTENT ENGINE OFFER

Dream outcome:

> Publish stronger LinkedIn posts from rough ideas with less prompting and fewer rewrites.

Likelihood:

- User voice memory
- Approved frameworks
- Previous post retrieval
- Fact checking
- Critic agent
- Edit memory

Time delay:

- Idea to draft in minutes

Effort:

- Rough idea instead of mega prompt

Possible offer content angle:

> "The problem with AI writing tools isn't the model. It's that they start every post without your judgement."

This uses Value Equation + problem positioning.

---

# 106. PRIORITY FOR THE NEXUS IQ LINKEDIN APP

The most valuable Hormozi components for V1 are:

## Tier 1 — Build immediately

1. Value Equation
2. Hook → Retain → Reward
3. Objection preemption
4. Market pain / audience relevance
5. Give Until They Ask
6. More Better New
7. MAGIC Naming Formula

## Tier 2 — Add to offer / commercial module

8. Delivery Cube
9. Trim & Stack
10. Bonuses
11. Guarantees
12. Scarcity / urgency

## Tier 3 — Future

13. Core Four outreach features
14. Rule of 100 tracker
15. Lead magnet builder
16. CLOSER sales assistant
17. Money Models offer sequence

---

# 107. AGENT PROMPT: HORMOZI OFFER STRATEGIST

```text
You are an offer-strategy module.

Use the supplied Hormozi framework library as strategic mechanisms, not as a writing style.

Your job is to diagnose the commercial idea.

Evaluate:
- market pain
- purchasing power relevance
- audience targetability
- dream outcome
- perceived likelihood
- time delay
- effort and sacrifice
- buyer objections
- proof
- risk
- offer delivery
- approved bonuses
- approved guarantees
- real scarcity
- real urgency

Never invent:
- client results
- proof
- numbers
- guarantees
- deadlines
- scarcity
- market growth

Return structured analysis.

Do not write the LinkedIn post.
```

---

# 108. AGENT PROMPT: HORMOZI CONTENT ADAPTER

```text
You receive:
- a rough idea
- the audience
- objective
- content pillar
- selected main framework
- Hormozi offer analysis
- user voice profile
- verified facts

Use only the Hormozi mechanisms that genuinely improve the idea.

Possible uses:
- sharpen the pain
- clarify dream outcome
- increase specificity
- add proof
- address one objection
- reduce perceived effort
- explain time to value
- improve naming
- ensure hook-retain-reward

Do not imitate Alex Hormozi's personal voice.

Do not turn every post into a sales pitch.

Do not add fake urgency, scarcity or guarantees.
```

---

# 109. AGENT PROMPT: OFFER CRITIC

```text
Critique this commercial post.

Check:

1. Does it target a meaningful problem?
2. Is the dream outcome clear?
3. Does the reader believe the outcome is possible?
4. Is there proof or mechanism?
5. Is the time-to-value claim supported?
6. Is effort reduction supported?
7. Does the post address the strongest objection?
8. Is any scarcity real?
9. Is any urgency real?
10. Is any guarantee approved?
11. Does the hook get fulfilled?
12. Is the CTA proportional to the value delivered?
13. Is the writing in the user's voice rather than Hormozi's voice?

Return specific fixes only.
```

---

# 110. PRODUCT RULE: FRAMEWORK SOURCE VS APP ADAPTATION

Every framework record should contain:

```json
{
  "id": "",
  "name": "",
  "source": "Alex Hormozi / Acquisition.com",
  "source_family": "$100M Offers|$100M Leads|$100M Money Models|Sales",
  "source_summary": "",
  "app_adaptation": "",
  "allowed_use": [],
  "misuse_risks": []
}
```

This prevents the system confusing source material with custom Nexus IQ adaptations.

---

# 111. COPYRIGHT / CREATOR RULE

Use:

- Ideas
- Framework names
- Equations
- General business principles
- Original Nexus IQ examples

Do not:

- Reproduce large passages from books
- Copy course worksheets verbatim
- Republish paid training
- Generate "Alex Hormozi clone" output
- Present Nexus adaptations as Alex's exact wording

---

# 112. RESEARCH RULE

Because Hormozi's public framework ecosystem continues to change:

When the app refers to:

- current Acquisition.com products
- current claims
- current portfolio figures
- current follower numbers
- current pricing
- current course availability

research first.

The framework itself can remain evergreen.

---

# 113. SOURCES USED FOR THIS KNOWLEDGE FILE

Primary / first-party sources prioritised:

## Acquisition.com — $100M Offers

https://www.acquisition.com/offers-oo

Confirms current Acquisition.com teaching around:

- Value Equation
- Offer Stacking
- Grand Slam Offer Framework
- Objection elimination
- Pricing psychology
- Risk reversal

## Acquisition.com — $100M Offers product description

https://shop.acquisition.com/products/100m-offers-hardcover

Publicly lists:

- market selection
- Value Equation
- Delivery Cube
- Trim & Stack
- Scarcity Stack
- Everyday Urgency
- Bonuses
- Guarantees
- MAGIC Naming Formula

## Acquisition.com — Pricing / Value checklist

Public Acquisition.com checklist confirms the Value Equation variables:

- Dream Outcome
- Perceived Likelihood of Achievement
- Time Delay
- Effort & Sacrifice

## Acquisition.com — Offer Creation checklist

Public checklist confirms Trim & Stack and the 10x / 1/10th test.

## Acquisition.com — $100M Leads

https://www.acquisition.com/leads-oo

Confirms:

- Four ways to get leads
- Lead magnets
- filtering
- lead getters
- one-page advertising plan

## Acquisition.com public course / $100M Leads material

Confirms modules including:

- Mozi Media Content Method
- Cold Outreach
- Paid Ads
- More Better New
- Referral
- Affiliates

## Alex Hormozi — The Game public transcript material

Public transcript material confirms:

- Hook → Retain → Reward
- Give Until They Ask
- Give in Public, Ask in Private
- Integrated / Intermittent offers
- More Better New
- Four guarantee types
- Delivery Cube
- MAGIC naming
- Rule of 100

## Acquisition.com — $100M Money Models

https://www.acquisition.com/mm-oo

Confirms:

- Money Model Framework
- Customer-Financed Acquisition
- Advanced Offer Stacking
- Pricing
- Lifetime Value Engineering

Public course navigation confirms:

- Attraction Offers
- Upsell Offers
- Downsell Offers
- Continuity Offers

---

# 114. FINAL IMPLEMENTATION PRINCIPLE

The system should use Hormozi's frameworks to improve:

```text
RELEVANCE
+
VALUE
+
CLARITY
+
PROOF
+
RISK REDUCTION
+
COMMERCIAL LOGIC
```

It should **not** use them to increase:

```text
HYPE
+
FAKE URGENCY
+
FAKE SCARCITY
+
UNSUPPORTED CLAIMS
+
CREATOR IMITATION
```

The strongest use of this framework inside the Nexus IQ LinkedIn engine is not:

> "Make this sound more Hormozi."

It is:

> "Diagnose the offer using market pain, the Value Equation, objection preemption, proof and risk. Then write it in the user's own voice using the best content framework for the idea."

That is the implementation target.
