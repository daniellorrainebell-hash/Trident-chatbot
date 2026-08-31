# LINKEDIN DISTRIBUTION LOGIC
## Evidence-Grounded Feed and Recommendation Rules for the Nexus IQ Content Engine

**Status:** Production knowledge and logic file  
**Verified through:** 31 August 2026  
**Purpose:** Hardwire currently supported LinkedIn Feed, recommendation, distribution and enforcement logic into the content engine  
**Primary evidence standard:** LinkedIn first-party engineering, Help Centre, Corporate Communications and senior Feed engineering statements  
**Maintenance rule:** Re-verify material changes against primary sources before changing hardcoded logic.

---

# 1. PURPOSE

The content engine has two separate jobs:

1. Create strong LinkedIn content.
2. Avoid writing and distribution patterns LinkedIn has publicly said may reduce recommendation, visibility or authenticity.

Do not build this system around creator rumours, folklore or "algorithm hacks".

Only hardwire a LinkedIn behaviour when primary evidence supports it.

Where a practical writing recommendation is inferred from LinkedIn's published system design, label it internally as an **IMPLEMENTATION_INFERENCE**, not a LinkedIn-confirmed ranking rule.

---

# 2. EVIDENCE LABELS

Every algorithm or distribution rule should use one of these labels:

```text
CONFIRMED
LinkedIn explicitly states the behaviour or ranking signal.

CONFIRMED_CATEGORY
LinkedIn confirms the category matters, but does not publish exact weights, thresholds or mechanics.

IMPLEMENTATION_INFERENCE
A reasonable product decision derived from confirmed LinkedIn behaviour, but not stated by LinkedIn as a direct ranking rule.

UNSUPPORTED
A common claim with no sufficient primary-source evidence. Do not hardwire it.
```

---

# 3. CURRENT FEED ARCHITECTURE AS OF AUGUST 2026

LinkedIn publicly announced a next-generation Feed ranking architecture in March 2026.

The disclosed architecture includes:

- larger sequence models called Generative Recommenders
- LLM-based retrieval that creates richer representations of members and content
- semantic understanding of what posts are about
- personalised ranking based on professional profile signals
- ranking informed by historical content interactions
- out-of-network recommendation
- freshness balanced with relevance
- sequential modelling of long-term member interests

LinkedIn says its Generative Recommender can process more than 1,000 historical interactions when modelling a member's evolving professional interests.

**Evidence:** CONFIRMED

## Implementation consequence

The writing engine should prioritise:

- a clear professional subject
- a clearly identifiable intended reader
- enough context for a stranger to understand the post
- one coherent central argument
- meaningful expertise, evidence or insight
- subject consistency inside each post

Do not keyword-stuff posts.

This is an **IMPLEMENTATION_INFERENCE** based on LinkedIn's confirmed semantic retrieval system.

---

# 4. 360BREW MUST NOT BE USED

## Hard rule

Do not optimise for 360Brew.

Do not mention 360Brew in ranking logic except to reject it as a current production assumption.

LinkedIn VP of Engineering Tim Jurka publicly stated in April 2026 that:

- 360Brew was tested internally
- it was tested with a small group
- LinkedIn decided it was not the right fit
- the test was shut down
- it is not part of the current Feed ranking system

**Evidence:** CONFIRMED

```json
{
  "360brew": {
    "active_model": false,
    "use_for_optimisation": false,
    "status": "rejected_internal_test",
    "confidence": "confirmed"
  }
}
```

Any imported framework claiming 360Brew is LinkedIn's current production ranking model must be ignored unless LinkedIn later publishes a contradictory primary-source update.

---

# 5. LINKEDIN USES HUNDREDS OF SIGNALS

LinkedIn states that its AI systems and algorithms consider hundreds of signals to determine what appears in each member's Feed.

Examples LinkedIn explicitly identifies include:

- post context
- profile information
- network
- activity
- industry
- experience
- skills
- geography
- what a member has read
- likes
- comments
- content the member returned to
- content the member scrolled past
- previous interactions
- time spent
- likelihood of engagement
- freshness
- professional relevance

**Evidence:** CONFIRMED

## Do not create fake weights

LinkedIn does not publish current numeric weights for these signals.

Never assume:

```text
1 comment = X likes
1 save = X comments
1 repost = X likes
dwell time = X percent of ranking
```

**Exact weights:** UNSUPPORTED

---

# 6. PROFESSIONAL RELEVANCE

LinkedIn says it values and recommends professionally relevant content.

Examples it explicitly names include:

- professional news
- industry insights
- career advice
- business advice
- professional growth
- professional development
- education
- professional products and services when useful context is included
- education on professional topics such as economics or technology

**Evidence:** CONFIRMED

## Hardwired strategy object

```json
{
  "professional_relevance": {
    "primary_topic": "",
    "professional_context": "",
    "target_professional_audience": "",
    "why_this_matters_to_them": ""
  }
}
```

If the post is personal, humorous or lifestyle-oriented, the strategist should assess whether a genuine professional context exists.

Do not fabricate a business lesson solely to game recommendation.

---

# 7. OUT-OF-NETWORK DISTRIBUTION

LinkedIn explicitly recommends posts from people outside a member's immediate network.

LinkedIn says Suggested content should be:

- professionally relevant
- high quality
- understandable outside the author's network
- sufficiently contextual
- not overly promotional
- coherent across text, image and video

**Evidence:** CONFIRMED

## Broad recommendation context check

A broader-discovery post should make sense to someone who:

- has never met the author
- has never read a previous post
- does not know the backstory
- does not know internal product names
- may not recognise internal acronyms

Check:

```text
Can a stranger understand:
- who this is relevant to?
- what happened or what is being argued?
- why it matters?
- the minimum context needed to follow it?
```

Do not add filler. Add only the context needed.

---

# 8. SEMANTIC TOPICAL RELEVANCE

LinkedIn's March 2026 engineering disclosure says LLM-generated representations allow Feed retrieval to understand deeper professional interests beyond exact keyword matching.

**Evidence:** CONFIRMED

## Hardwired content rule

Do not optimise around keyword density.

Instead:

- use accurate subject language
- name the subject clearly
- use relevant terminology naturally
- maintain one coherent semantic subject
- avoid mixing unrelated primary themes unless there is a real connection

## Topic dilution check

```json
{
  "topic_clarity": {
    "primary_topic": "",
    "secondary_topics": [],
    "coherent": true,
    "reason": ""
  }
}
```

This is an **IMPLEMENTATION_INFERENCE**.

---

# 9. AUTHOR PROFILE SIGNALS MATTER

LinkedIn says Feed personalisation uses profile information including:

- industry
- experience
- skills
- geography

Profile, network and activity signals influence what content appears.

**Evidence:** CONFIRMED

## Product implication

Maintain a canonical author profile containing:

- role
- industry
- expertise
- core subjects
- experience
- business focus
- target audience

Use these to keep content aligned with the author's real professional identity.

Do not claim that generic "profile optimisation" automatically boosts every post.

**Exact profile-optimisation boost:** UNSUPPORTED

---

# 10. MEMBER INTEREST HISTORY

LinkedIn states that ranking looks at behaviour over time including:

- content read
- content liked
- content commented on
- content revisited
- content scrolled past
- changing engagement patterns

**Evidence:** CONFIRMED

The tool cannot know how every viewer's personal ranking model will behave.

It can improve relevance by making the intended reader and subject clear.

Never promise universal reach.

---

# 11. FRESHNESS AND RELEVANCE

LinkedIn says it balances freshness with relevance.

**Evidence:** CONFIRMED

Freshness alone does not guarantee distribution.

Time-sensitive topics should trigger current research.

```json
{
  "freshness": {
    "time_sensitive": true,
    "current_research_required": true
  }
}
```

Examples:

- product releases
- legal updates
- LinkedIn changes
- market news
- current AI models
- current regulation
- event reactions

---

# 12. DWELL TIME IS A REAL RANKING SIGNAL

LinkedIn Engineering has repeatedly documented dwell-time modelling.

Confirmed points:

- passive reading behaviour is useful ranking information
- predicted short dwell / skip behaviour has been used as a negative ranking signal
- LinkedIn has modelled long dwell as a positive feedback signal
- dwell behaviour matters even when people do not like, comment or repost
- LinkedIn normalises dwell behaviour because content types and contexts differ
- long-dwell thresholds are dynamic rather than one universal creator-facing number

**Evidence:** CONFIRMED

## Hard rule

Never hardcode claims such as:

> Make them read for 8 seconds.

LinkedIn has not published a current universal magic dwell threshold for creators.

**Exact dwell threshold:** UNSUPPORTED

---

# 13. WRITE FOR GENUINE READ-THROUGH

The content engine should optimise for real consumption.

That means:

- the hook creates relevant interest
- the next sentence advances the idea
- the body keeps moving
- information is not stretched to increase read time
- the post closes the promise made by the opening
- useful specifics appear before attention collapses
- every paragraph adds meaning

LinkedIn's dwell engineering work says its systems aim to limit clickbait or dwell-bait content.

**Evidence:** CONFIRMED_CATEGORY

## Dwell quality object

```json
{
  "dwell_quality": {
    "hook_has_relevance": true,
    "second_line_advances": true,
    "middle_has_new_information": true,
    "repetition_detected": false,
    "artificial_withholding": false,
    "payoff_delivered": true
  }
}
```

This object is a product heuristic, not a LinkedIn-published schema.

---

# 14. ENGAGEMENT SIGNALS EXIST

LinkedIn has documented reactions, comments, shares/reposts and clicks as Feed engagement behaviours.

Suggested content documentation also lists prior interactions and likelihood of engagement.

**Evidence:** CONFIRMED_CATEGORY

## Important limitation

LinkedIn does not publish current weighting.

Do not write content around invented engagement multipliers.

---

# 15. SAVES, SENDS AND LINK CLICKS

LinkedIn exposes these in post analytics:

- saves
- sends on LinkedIn
- external-link visits

**Evidence:** CONFIRMED

LinkedIn does not publicly disclose exact Feed weighting for any of them.

Do not hardwire:

```text
save = 5 likes
send = strongest signal
external link = fixed 40% penalty
external link = fixed 60% penalty
```

**Exact multipliers / fixed penalties:** UNSUPPORTED

Track these as user-performance data, not universal algorithm laws.

---

# 16. PROMOTIONAL-ONLY CONTENT CAN LOSE BROADER RECOMMENDATION

LinkedIn says content that only attempts to sell products, services or events without useful insight, news or advice may not be shared broadly beyond connections/followers.

**Evidence:** CONFIRMED

## Hardwired commercial writing rule

A broader-discovery commercial post should usually contain:

```text
COMMERCIAL SUBJECT
+
USEFUL PROFESSIONAL INFORMATION
+
CONTEXT / MECHANISM / EXPERIENCE
```

Do not add fake educational filler merely to disguise an advert.

## Promotion check

```json
{
  "promotion_check": {
    "is_commercial": true,
    "contains_professional_value": true,
    "contains_specific_insight": true,
    "pure_advert": false
  }
}
```

A direct sales post may still be valid when the objective is conversion.

Do not force every post to optimise for broad reach.

---

# 17. ENGAGEMENT BAIT IS A CONFIRMED NEGATIVE CATEGORY

LinkedIn explicitly discourages content that directly asks for engagement purely to increase visibility.

Examples LinkedIn identifies include:

- "Like if you agree"
- direct asks for likes
- direct asks for shares
- direct asks for comments
- direct asks for follows
- reaction-vote polls
- tagging for attention
- unrelated sharing requests
- exaggerated information
- irrelevant hashtags

LinkedIn's March 2026 Feed update says it is improving systems to filter engagement bait.

**Evidence:** CONFIRMED

## Blocklist

Unless genuinely necessary for a meaningful conversation, flag:

```text
Comment YES if you agree
Like if you agree
Repost if you agree
Share this with your network
Tag someone who needs this
Follow for more
Save this for later
Bookmark this
Drop a YES below
Comment [keyword] and I will send it
```

LinkedIn says asking for genuine thoughts and feedback can be acceptable.

Distinguish:

```text
MEANINGFUL CONVERSATION QUESTION
```

from:

```text
ENGAGEMENT MANIPULATION
```

---

# 18. GENERIC AND RECYCLED CONTENT IS BEING REDUCED

In March 2026, LinkedIn said it was improving systems to show less:

- generic content
- repetitive content
- click-driven posts
- engagement bait
- recycled thought leadership lacking substance or insight

**Evidence:** CONFIRMED

## Hardwired generic-content checks

Flag posts that:

- repeat common slogans without a new angle
- could have been written for any professional
- recycle an old post with superficial word changes
- repeat the same argument with no new evidence
- use generic motivational conclusions
- contain no specific observation, mechanism, example, proof or useful opinion

```json
{
  "generic_content": {
    "specific_subject": true,
    "specific_reader": true,
    "original_observation": true,
    "useful_mechanism": true,
    "proof_or_example": true,
    "template_language_score": 0,
    "recycled_similarity_score": 0
  }
}
```

This scoring object is a Nexus implementation heuristic.

---

# 19. ORIGINALITY MATTERS FOR BROADER RECOMMENDATION

LinkedIn says copying someone else's content without added insight is discouraged.

Adding personal insight or a unique perspective makes a reshare more useful.

**Evidence:** CONFIRMED

## Hard rule

Do not turn a source article into a paraphrased LinkedIn post without adding the author's:

- view
- analysis
- application
- criticism
- experience
- consequence for their audience

Use attribution where appropriate.

---

# 20. MEDIA AND TEXT SHOULD MATCH

LinkedIn's March 2026 update explicitly says it intends to show less content where a video has nothing to do with the associated text and is used to drive inauthentic distribution.

Suggested-content guidance also says all elements of a post should relate to one another.

**Evidence:** CONFIRMED

```json
{
  "media_alignment": {
    "media_topic": "",
    "text_topic": "",
    "aligned": true
  }
}
```

If false, warn before publication.

Do not attach unrelated viral media for distribution manipulation.

---

# 21. INAUTHENTIC ENGAGEMENT IS ACTIVELY SUPPRESSED

LinkedIn Corporate Communications stated in March 2026 that it actively limits the reach of inauthentic activity.

LinkedIn specifically names:

- engagement pods
- automated comments
- coordinated engagement intended to boost visibility
- suspicious artificially boosted posts

LinkedIn says this can affect content distribution and can lead to account restrictions.

**Evidence:** CONFIRMED

---

# 22. ENGAGEMENT PODS

LinkedIn describes engagement pods as coordinated groups that like, comment and share posts to boost visibility and virality.

LinkedIn says this activity is not allowed.

It has taken actions including:

- removing groups showing engagement-pod behaviour
- contacting members showing signs of participation
- warning of possible account restrictions
- possible removal from LinkedIn programs including Top Voices

**Evidence:** CONFIRMED

## Product rule

Never recommend engagement pods as a growth tactic.

---

# 23. AUTOMATED COMMENTS

LinkedIn says automated comments produced through browser extensions, scripts or third-party tools without normal human interaction are not allowed.

LinkedIn says detected automated comments may:

- not appear in Most Relevant comments
- sometimes not appear outside the commenter's network
- contribute to account restrictions

**Evidence:** CONFIRMED

## Product boundary

The tool may draft a comment for a human to review and manually post.

Do not implement unauthorised automated LinkedIn commenting.

---

# 24. PROHIBITED AUTOMATION

LinkedIn Help says it does not permit third-party tools that:

- scrape LinkedIn
- automate activity
- automate messages
- automate contacts
- automatically create comments
- automatically like
- automatically share/re-share
- drive inauthentic engagement
- manipulate content algorithms

**Evidence:** CONFIRMED

## Architecture rule

If future versions connect to LinkedIn, use only:

- officially supported LinkedIn APIs
- permitted integration pathways
- explicit user actions where required

Do not build browser automation that violates LinkedIn's User Agreement.

---

# 25. HIGH-VOLUME INAUTHENTIC ACTIVITY

LinkedIn says high volumes of messages, comments, posts or other activity in a short period can indicate automation or inauthentic behaviour.

LinkedIn may:

- limit content visibility
- restrict the account
- permanently restrict repeated offenders

**Evidence:** CONFIRMED

Do not build a volume-blasting growth feature.

---

# 26. SPAM CAN HAVE DISTRIBUTION LIMITED

LinkedIn says it may remove or limit distribution of content designed to artificially increase engagement through misuse or misrepresentation.

Examples include:

- reaction polls designed to boost engagement
- posts that misrepresent LinkedIn functionality
- chain-letter content asking for likes/reactions/shares
- excessive repetitive comments/messages
- misleading or malicious articles designed to manipulate search engines

**Evidence:** CONFIRMED

---

# 27. UNCONSTRUCTIVE CONTENT CAN LOSE BROADER RECOMMENDATION

LinkedIn says content that erodes the professional nature of the platform may not be shared beyond connections and followers.

LinkedIn names categories including:

- dismissive
- derisive
- unconstructive

Examples include:

- mocking people or groups
- talking down to others
- shouting
- swear words
- provoking arguments
- exaggerating to create fear or upset
- jokes at others' expense

**Evidence:** CONFIRMED

---

# 28. PROFANITY HAS A DOCUMENTED DISTRIBUTION RISK

LinkedIn includes swear words in examples of unconstructive content that may not receive broader recommendation.

**Evidence:** CONFIRMED_CATEGORY

LinkedIn does not publish a fixed penalty per swear word.

## Product handling

Do not ban profanity globally.

Use separate controls:

```json
{
  "voice": {
    "profanity_allowed": true
  },
  "distribution": {
    "broad_recommendation_priority": true,
    "profanity_risk_warning": true
  }
}
```

If broad distribution is a priority and profanity exists, flag the trade-off internally.

Do not automatically sanitise the author's voice unless configured to do so.

---

# 29. CONSTRUCTIVE DISAGREEMENT IS ALLOWED

LinkedIn says members value diverse opinions and healthy debate.

The negative category is unconstructive behaviour.

**Evidence:** CONFIRMED

## Writing rule

Strong opinions are allowed.

Disagreement can be direct.

Prefer criticising:

- ideas
- systems
- processes
- claims
- practices

before turning the post into personal mockery.

---

# 30. FEAR EXAGGERATION IS A RISK

LinkedIn's recommendation guidance includes exaggerating to create fear or upset others as unconstructive.

**Evidence:** CONFIRMED

For governance, security, legal and commercial-risk posts:

- state the actual risk
- explain the mechanism
- use verified consequences
- do not inflate enforcement certainty
- do not invent worst-case outcomes

Loss aversion can be used without fear fabrication.

---

# 31. USER FEEDBACK AFFECTS RECOMMENDATION

LinkedIn says Suggested content selection takes member feedback into account, including disinterest signals and reports.

**Evidence:** CONFIRMED

Do not optimise solely for positive engagement.

A post that gets clicks while causing hides, reports or disinterest may be counterproductive.

LinkedIn does not publish exact negative-feedback weights.

---

# 32. CLICKBAIT AND DWELL BAIT

LinkedIn Engineering says its dwell-time work aims to improve relevance while limiting clickbait or dwell-bait content.

**Evidence:** CONFIRMED_CATEGORY

## Writing rule

Do not artificially delay the answer just to increase read time.

Bad pattern:

```text
I discovered something.
It surprised me.
And after three days...
I finally understood it.
But first...
```

when the idea can be stated directly.

Use curiosity when it arises naturally from the substance.

---

# 33. POST CONTEXT MATTERS

LinkedIn says Feed systems consider the context of a post, including examples such as helpful insight, job opportunity and career milestone.

**Evidence:** CONFIRMED

## Engine logic

Classify intent:

```text
insight
education
opinion
proof
story
career
company update
offer
news
discussion
```

Use the classification to select structure.

Do not assume every LinkedIn post should use the same engagement strategy.

---

# 34. HIGH QUALITY IS A CATEGORY, NOT A PUBLIC FORMULA

LinkedIn repeatedly refers to content being:

- high quality
- useful
- relevant
- professional
- authentic
- constructive

**Evidence:** CONFIRMED_CATEGORY

LinkedIn does not publish an exact creator-facing quality formula.

The Nexus tool may calculate its own quality score.

Label it:

> Nexus Content Quality Score

Do not call it:

> LinkedIn Algorithm Score

---

# 35. RECOMMENDED NEXUS DISTRIBUTION SCORE

The tool may use an internal score based on LinkedIn-confirmed categories.

Example dimensions:

```text
Professional relevance          0-10
Topic clarity                   0-10
Out-of-network context          0-10
Original insight                0-10
Useful professional value       0-10
Hook/body alignment             0-10
Read-through quality            0-10
Media/text alignment            0-10
Constructive professionalism    0-10
Promotion balance               0-10
```

Potential Nexus-defined penalties:

```text
Engagement bait
Generic/recycled language
Unrelated media
Fake scarcity
Unconstructive hostility
Profanity distribution risk
Unsupported fear
Pure promotion
```

These are **Nexus implementation weights**.

They are not LinkedIn's ranking weights.

---

# 36. DISTRIBUTION CHECK STAGE

Add this after factual verification and editorial critique.

```text
STRATEGY
↓
HOOK
↓
DRAFT
↓
EDITORIAL CRITIC
↓
FACT CHECK
↓
LINKEDIN DISTRIBUTION CHECK
↓
FINAL REVISION
↓
USER
```

The Distribution Check should identify trade-offs without flattening the author's voice.

---

# 37. DISTRIBUTION CHECK SCHEMA

```json
{
  "linkedin_distribution_check": {
    "professional_relevance": {
      "score": 0,
      "reason": ""
    },
    "topic_clarity": {
      "score": 0,
      "reason": ""
    },
    "out_of_network_context": {
      "score": 0,
      "reason": ""
    },
    "originality": {
      "score": 0,
      "reason": ""
    },
    "useful_insight": {
      "score": 0,
      "reason": ""
    },
    "dwell_quality": {
      "score": 0,
      "reason": ""
    },
    "engagement_bait": {
      "detected": false,
      "severity": "none|low|medium|high"
    },
    "generic_recycled": {
      "detected": false,
      "severity": "none|low|medium|high"
    },
    "promotion_only": {
      "detected": false,
      "severity": "none|low|medium|high"
    },
    "media_alignment": {
      "applicable": false,
      "aligned": true
    },
    "unconstructive_risk": {
      "detected": false,
      "severity": "none|low|medium|high"
    },
    "profanity": {
      "detected": false,
      "broad_recommendation_tradeoff": false
    },
    "unsupported_algorithm_hack": {
      "detected": false,
      "details": []
    },
    "recommendation": "publish|revise|publish_with_tradeoff",
    "revision_actions": []
  }
}
```

---

# 38. BROAD-RECOMMENDATION GATE

When the objective is broad discovery, check:

```text
1. Professional relevance present?
2. Stranger can understand it?
3. Useful insight or professional value present?
4. Not purely promotional?
5. Original perspective present?
6. No engagement bait?
7. No inauthentic distribution trick?
8. Text/media aligned?
9. Constructive tone?
10. Hook delivers its promise?
```

A failure does not always mean do not publish.

It means the engine should understand the trade-off.

---

# 39. NETWORK-FIRST POSTS

LinkedIn notes that some posts can be relevant to the author's network without being broadly useful outside it.

**Evidence:** CONFIRMED

Examples:

- personal milestones
- personal updates
- community context
- direct announcements

Do not force every post into broad-discovery formatting.

```text
distribution_goal:
- network
- broad
- commercial
- hybrid
```

---

# 40. COMMERCIAL VS DISTRIBUTION TRADE-OFF

A direct sales post may intentionally sacrifice broad recommendation for conversion.

Do not rewrite every commercial post into educational content.

Possible internal decision:

```text
Objective: conversion
Broad recommendation priority: secondary
Pure promotion risk: accepted
```

The user controls the objective.

---

# 41. COMMENTS SHOULD CREATE REAL CONVERSATION

LinkedIn's 2026 public position strongly emphasises real people, unique perspectives, experiences and insights.

Automated comments are being actively reduced.

**Evidence:** CONFIRMED

If the tool suggests replies, replies should:

- respond to what the person actually said
- add a real thought
- ask a relevant question only if useful
- avoid generic praise
- avoid templated agreement

Bad:

> Great insights. Thanks for sharing.

Better:

> The handoff point is the bit I keep seeing fail. Teams automate the first response, then drop the qualified lead back into a manual queue.

A human should review/post unless an official permitted API supports the action.

---

# 42. AI-GENERATED TEXT IS NOT PUBLICLY CONFIRMED AS AN AUTOMATIC PENALTY

There is no sufficient first-party LinkedIn evidence that text receives a direct ranking penalty simply because AI helped create it.

**Direct AI-text penalty:** UNSUPPORTED

LinkedIn does say it is reducing:

- generic posts
- recycled thought leadership
- low-substance content
- automated/inauthentic conversations

**Evidence:** CONFIRMED

The tool should solve the quality problems associated with weak AI writing.

Do not claim LinkedIn automatically punishes all AI-assisted copy.

---

# 43. AUTHENTICITY DOES NOT MEAN AI ASSISTANCE IS FORBIDDEN

LinkedIn's documented concern centres on authentic people, useful professional ideas and inauthentic automated behaviour.

Do not interpret "authentic" as:

```text
AI assistance forbidden
```

That exceeds the evidence.

Focus on:

- real experiences
- real positions
- real opinions
- real proof
- accurate claims
- human-controlled publication

---

# 44. UNSUPPORTED ALGORITHM CLAIMS: DO NOT HARDWIRE

The following should not be treated as platform facts unless LinkedIn later confirms them.

## Posting-time formulas

Unsupported examples:

- post at 8:07 AM
- first hour determines everything
- 90-minute golden window
- morning always wins
- wait X hours after another post

Use user-specific performance data if available.

---

## First-hour velocity formulas

Do not hardwire exact 30, 60 or 90-minute engagement thresholds.

**Evidence:** UNSUPPORTED

---

## Comment multipliers

Do not claim:

```text
comment = 2 likes
comment from a large account = X boost
reply within X minutes doubles reach
```

**Evidence:** UNSUPPORTED

---

## Save multipliers

Do not claim:

```text
save = 5 likes
save extends distribution for X days
```

**Evidence:** UNSUPPORTED

---

## Hashtag magic numbers

Do not hardwire:

- exactly 3 hashtags
- 3 to 5 hashtags
- zero hashtags always best
- hashtags automatically reduce reach

**Universal ranking rule:** UNSUPPORTED

The separate writing-rules file may still ban hashtags for voice reasons.

---

## Editing penalty

Do not warn:

> Editing your post kills reach.

**Evidence:** UNSUPPORTED

---

## Link-in-comments hack

Do not hardwire:

> Put links in the first comment to avoid the algorithm.

**Evidence:** UNSUPPORTED

---

## Fixed external-link penalty

Do not claim a universal fixed reduction percentage.

**Evidence:** UNSUPPORTED

---

## Format boost claims

Do not state that LinkedIn automatically boosts:

- carousels
- text-only posts
- images
- video
- polls
- newsletters

unless current first-party evidence supports the specific claim.

Third-party empirical data can be stored separately.

---

# 45. SHADOW BAN LANGUAGE

LinkedIn does not publicly describe a general creator mechanism called "shadow banning".

LinkedIn does explicitly confirm several forms of reduced visibility:

- limiting content distribution
- reducing reach of inauthentic activity
- limiting visibility for high-volume automated activity
- not showing automated comments in Most Relevant
- sometimes not showing automated comments outside the commenter's network
- restricting accounts

**Evidence:** CONFIRMED

## Product language

Use:

- distribution limited
- recommendation reduced
- visibility limited
- account restricted
- may not be eligible for broad recommendation

Do not diagnose:

> You are shadow banned.

from low impressions alone.

---

# 46. VISIBILITY DROP DIAGNOSTIC

If analytics detect a large drop in impressions, check:

```text
1. Topic relevance
2. Audience mismatch
3. Recent post quality
4. Recycled content
5. Direct promotion
6. Engagement bait
7. Inauthentic activity
8. Automation/account warnings
9. Changed audience behaviour
10. Normal performance variance
```

Return:

> Cause cannot be established from impressions alone.

---

# 47. ALGORITHM MYTH FIREWALL

```json
[
  {
    "claim": "360Brew is LinkedIn's current algorithm",
    "status": "false",
    "evidence": "primary_source"
  },
  {
    "claim": "external links receive a fixed reach penalty",
    "status": "unsupported"
  },
  {
    "claim": "editing kills reach",
    "status": "unsupported"
  },
  {
    "claim": "three hashtags is the optimal universal number",
    "status": "unsupported"
  },
  {
    "claim": "one comment equals multiple likes",
    "status": "unsupported"
  },
  {
    "claim": "saves have a known ranking multiplier",
    "status": "unsupported"
  },
  {
    "claim": "the first 90 minutes determine the full post lifecycle",
    "status": "unsupported"
  },
  {
    "claim": "putting the link in the first comment avoids a confirmed penalty",
    "status": "unsupported"
  },
  {
    "claim": "AI-assisted writing automatically receives an algorithm penalty",
    "status": "unsupported"
  }
]
```

Any new external content ingested into the system should be checked against this registry.

---

# 48. SOURCE PRIORITY

When researching a new LinkedIn algorithm claim, use this order:

```text
1. LinkedIn Engineering
2. LinkedIn Help Centre
3. LinkedIn Corporate Communications / Newsroom
4. LinkedIn senior Feed / engineering leadership
5. LinkedIn official creator guidance
6. Independent large-scale empirical datasets
7. Credible practitioner observation
8. Creator opinion
```

Levels 6 to 8 must not overwrite levels 1 to 5.

---

# 49. FACT VS THIRD-PARTY OBSERVATION

Third-party research can be useful.

Store it like:

```json
{
  "claim": "",
  "source_type": "third_party_empirical",
  "sample_size": null,
  "date_range": "",
  "finding": "",
  "limitations": "",
  "conflicts_with_linkedin": false
}
```

Do not call a correlation an algorithm rule.

---

# 50. CURRENT CLAIM RESEARCH AGENT

If the user asks:

> Does LinkedIn currently punish X?

The research agent should:

1. Search current LinkedIn primary sources.
2. Search LinkedIn Engineering.
3. Search LinkedIn Help.
4. Search current senior Feed engineering statements.
5. Determine whether the claim is confirmed.
6. Separate platform fact from third-party observation.
7. Store the result with a verification date.
8. Update this rules module only when primary evidence materially changes.

---

# 51. VERSIONING

```json
{
  "linkedin_distribution_knowledge": {
    "version": "2026-08-31",
    "last_verified": "2026-08-31",
    "source_standard": "primary_first"
  }
}
```

When the monitoring agent finds a meaningful change:

- create a new version
- preserve the old version
- record what changed
- update relevant rules
- rerun tests

---

# 52. PRE-DRAFT STRATEGY QUESTIONS

Before writing:

```text
What is the professional subject?
Who is the intended reader?
Is this primarily network or broad distribution?
Is the objective authority, education, conversation, proof or conversion?
What makes the post original?
What proof or experience exists?
Is the post current enough to require research?
Is media attached?
```

---

# 53. POST-DRAFT DISTRIBUTION QUESTIONS

Before output:

```text
Is the subject professionally clear?
Could an out-of-network reader understand it?
Is there useful professional value?
Does the post contain an original perspective?
Is it generic or recycled?
Is the CTA engagement bait?
Is it purely promotional?
Is text/media alignment coherent?
Is the tone constructive enough for broad recommendation?
Is profanity creating an intentional trade-off?
Is the hook honest?
Does the body deliver the hook?
Does any algorithm claim rely on folklore?
```

---

# 54. DISTRIBUTION MODE SETTINGS

```json
{
  "distribution_mode": "balanced"
}
```

Allowed modes:

```text
broad_reach
balanced
voice_first
conversion_first
network_first
```

## broad_reach

Prioritise broad recommendation eligibility.

Flag:

- profanity
- unconstructive language
- pure promotion
- engagement bait
- context gaps
- media mismatch

## balanced

Preserve voice while removing clear recommendation negatives.

## voice_first

Allow stronger personality and profanity trade-offs.

Still block:

- fake engagement
- fake facts
- spam tactics
- automation tactics

## conversion_first

Direct commercial copy allowed.

Do not force broad-discovery optimisation.

## network_first

Allow more personal context and less universal framing.

---

# 55. DO NOT TURN THIS INTO SAFE CORPORATE WRITING

This module must not become an excuse to make posts bland.

LinkedIn permits:

- opinion
- disagreement
- humour
- strong professional perspectives
- debate

The system should remove confirmed distribution problems.

It should not remove personality because a sentence might theoretically offend someone.

The threshold is evidence-based recommendation risk, not generic caution.

---

# 56. DISTRIBUTION CRITIC PROMPT

```text
You are the LinkedIn Distribution Critic.

Evaluate the draft using the LinkedIn Distribution Logic knowledge file.

Use only LinkedIn-confirmed categories and explicitly labelled Nexus implementation inferences.

Do not invent algorithm weights.

Do not optimise for 360Brew.

Do not apply unsupported rules about:
- posting time
- first-hour velocity
- hashtag count
- external-link penalties
- editing penalties
- save multipliers
- comment multipliers
- link-in-comments hacks
- format boosts

Evaluate:
- professional relevance
- topic clarity
- out-of-network context
- original insight
- useful professional value
- genuine read-through quality
- engagement bait
- recycled/generic content
- promotional-only content
- media/text mismatch
- unconstructive tone
- profanity distribution trade-off
- unsupported fear
- inauthentic engagement tactics

Return:
1. distribution status
2. confirmed risks
3. implementation-inference concerns
4. exact revision actions

Do not rewrite a strong voice into corporate language.

If there is no meaningful issue, return PASS.
```

---

# 57. DISTRIBUTION STATUS

```text
PASS
Strong fit with current published LinkedIn recommendation guidance.

PASS_WITH_TRADEOFF
Post contains an intentional characteristic such as profanity or direct promotion that may reduce broad recommendation but may serve voice or conversion.

REVISE
Contains a correctable recommendation problem such as engagement bait, generic recycled language, weak context or media mismatch.

BLOCK_PLATFORM_RISK
Contains prohibited automation strategy, spam manipulation, fake engagement or another clear platform-policy problem.
```

---

# 58. HARD FAIL CONDITIONS

Hard fail before publication suggestion if the system creates:

- engagement-pod instructions
- automated comment instructions
- unauthorised LinkedIn automation
- fake reaction polls
- chain-letter engagement requests
- deliberate LinkedIn-feature misrepresentation
- known spam manipulation
- fake engagement
- deliberately unrelated media to game distribution

These are grounded in current LinkedIn policy or public authenticity enforcement.

---

# 59. SOFT DISTRIBUTION WARNINGS

Warn rather than automatically block:

- profanity
- direct selling
- strong confrontational language
- personal content with weak professional context
- narrow network-specific context
- potentially unsettling media

These can be legitimate depending on the post objective.

---

# 60. USER-SPECIFIC PERFORMANCE DATA

LinkedIn's public rules describe general platform behaviour.

The user's own history describes what their audience responds to.

Track:

- topic
- hook family
- framework
- content pillar
- length
- media
- CTA
- profanity
- impressions
- reactions
- comments
- reposts
- saves
- sends
- external-link visits
- leads where recorded

Use this to generate user-specific observations.

Allowed:

> Across your last 14 governance posts, direct risk hooks produced higher median impressions.

Do not convert that into:

> LinkedIn rewards risk hooks.

---

# 61. SAMPLE SIZE RULE

Do not make strong recommendations from tiny samples.

```json
{
  "sample_size": 4,
  "confidence": "low"
}
```

Prefer repeated patterns, medians and larger samples over one viral post.

---

# 62. PRIMARY SOURCES USED

## LinkedIn Engineering

### Engineering the next generation of LinkedIn's Feed
Published: 12 March 2026

Supports:
- LLM-based unified retrieval
- Generative Recommenders
- semantic post understanding
- professional profile signals
- historical interaction sequences
- 1,000+ historical interactions
- freshness + relevance
- out-of-network content

Source:
https://www.linkedin.com/blog/engineering/feed/engineering-the-next-generation-of-linkedins-feed

### Leveraging Dwell Time to Improve Member Experiences on the LinkedIn Feed
Published: 1 October 2024

Supports:
- short dwell / skip as negative signal
- passive consumption
- long dwell modelling
- dynamic normalisation
- limiting clickbait / dwell bait

Source:
https://www.linkedin.com/blog/engineering/feed/leveraging-dwell-time-to-improve-member-experiences-on-the-linkedin-feed

### Understanding dwell time to improve LinkedIn feed ranking
Published: 12 May 2020

Supports:
- dwell-time signal development
- skip probability
- clicks, reactions, comments and shares as modelled actions

Source:
https://www.linkedin.com/blog/engineering/feed/understanding-feed-dwell-time

---

# 63. PRIMARY SOURCES: FEED LEADERSHIP

### Updates to The LinkedIn Feed Focusing on Authentic, Relevant Conversations
Published: 12 March 2026
Author: Tim Jurka, LinkedIn VP of Engineering

Supports:
- Generative Recommenders
- LLM understanding of posts
- profile and engagement signals
- out-of-network relevance
- engagement pod suppression
- comment automation enforcement
- less generic content
- less engagement bait
- less irrelevant video/text pairing
- less recycled thought leadership

Source:
https://www.linkedin.com/pulse/updates-linkedin-feed-focusing-authentic-relevant-tim-jurka-umwnc/

### Tim Jurka statement on 360Brew
Published: April 2026

Supports:
- 360Brew is not the current Feed ranking system
- it was a small internal test
- it was shut down

Source:
https://www.linkedin.com/posts/timjurka_updates-to-the-linkedin-feed-focusing-on-activity-7449929754679545857-HyFG

---

# 64. PRIMARY SOURCES: LINKEDIN HELP

### How the Feed ranks content
Supports:
- hundreds of ranking signals
- post context
- profile
- network
- activity
- demographic attributes such as age, race and gender not used as Feed visibility signals

Source:
https://www.linkedin.com/help/linkedin/answer/a9554004

### Suggested posts in feed
Supports:
- professionally relevant Suggested content
- out-of-network recommendation
- sufficient context
- not overly promotional
- media/text relation
- member feedback
- past interactions
- time spent
- profile information
- likelihood of engagement

Source:
https://www.linkedin.com/help/linkedin/answer/a1499047/suggested-posts-in-feed

### Spam
Supports:
- distribution may be limited
- reaction polls
- platform-feature manipulation
- chain-letter engagement requests
- excessive repetitive comments/messages

Source:
https://www.linkedin.com/help/linkedin/answer/a1338787

### High volume of content shared
Supports:
- automated/inauthentic high-volume activity can limit visibility
- account restrictions
- repeated restrictions can become permanent

Source:
https://www.linkedin.com/help/linkedin/answer/a1339697

### Prohibited software and extensions
Supports:
- third-party scraping and automation prohibited
- automated likes/comments/shares/messages prohibited
- fake engagement / algorithm manipulation prohibited

Source:
https://www.linkedin.com/help/linkedin/answer/a1341387/prohibited-software-and-extensions

### Automated activity on LinkedIn
Supports:
- third-party automation restrictions
- account restrictions

Source:
https://www.linkedin.com/help/linkedin/answer/a1340567/automated-activity-on-linkedin

### Post analytics for your content
Supports:
- reactions
- comments
- reposts
- saves
- sends
- external-link visits

Source:
https://www.linkedin.com/help/linkedin/answer/a516971/post-analytics-for-your-content

---

# 65. PRIMARY SOURCES: CORPORATE AND RECOMMENDATION GUIDANCE

### What We're Doing to Support Authentic Content and Conversations on LinkedIn
Published: 13 March 2026

Supports:
- reach limitation for inauthentic activity
- engagement pods
- suspicious artificially boosted posts
- automated comment reduction
- Most Relevant comment suppression
- possible out-of-network comment suppression
- account restrictions

Source:
https://news.linkedin.com/2026/authentic-content-and-conversations

### LinkedIn Content Recommendations: What to Avoid

Supports:
- professional content more likely to be shared broadly
- pure promotion discouraged
- off-topic promotion discouraged
- engagement bait discouraged
- unoriginal content discouraged
- dismissive, derisive and unconstructive content may lose broad distribution
- swear words listed under unconstructive content
- fear exaggeration discouraged
- sensitive content can affect broad recommendation

Source:
https://www.linkedin.com/blog/content-recommendations-avoid

---

# 66. FINAL HARDWIRED PRINCIPLE

The content engine should behave as though LinkedIn's current Feed is trying to match:

```text
RIGHT PROFESSIONAL CONTENT
→
RIGHT PERSON
→
REAL INTEREST
→
USEFUL CONSUMPTION
→
AUTHENTIC INTERACTION
```

Do not translate this into simplistic hacks.

The disclosed system is personalised, semantic and multi-signal.

Optimise the content for:

- relevance
- clarity
- substance
- context
- originality
- honest hooks
- genuine read-through
- professional usefulness

Avoid LinkedIn-confirmed negatives:

- engagement bait
- generic recycled thought leadership
- inauthentic engagement
- engagement pods
- automated comments
- spam tactics
- unrelated media
- pure promotion without professional value
- unconstructive hostility
- fear exaggeration
- unauthorised automation

The objective is to create content LinkedIn can understand, the intended professional audience wants to consume, and the author would genuinely stand behind.

No folklore.

No fake algorithm maths.

No 360Brew.

No guru mythology.
