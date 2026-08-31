# Architecture

## The problem this shape solves

A normal LLM workflow starts from nothing every time. Asked to "write a LinkedIn post about AI governance", the model has to infer the audience, the objective, the post type, the psychology, the hook structure, the narrative framework, what the user already believes, how they write, which phrases they reject, which claims need research, what has already been posted, and what the CTA should be.

Every one of those inferences is a chance to drift, and the user pays for the drift by correcting the same things repeatedly.

This system moves those decisions out of the prompt and into persistent, inspectable places: a framework library, a voice profile, a knowledge base, editorial memory, and deterministic selection logic.

## Stage map

```
                    idea
                      |
              [1] Strategist                  reports signals, classifies the idea
                      |
        deterministic framework selection      ranks and gates. no model call.
                      |
              [2] Retriever                   frameworks by ID, memory by embedding
                      |
       [offer strategist, if commercial]      diagnoses the offer
                      |
              [3] Hook Engine                 ~16 candidates, 2 to 4 families
                      |
              [4] Hook Critic                 model scores, code ranks
                      |
              [5] Outline Builder             the post's movement
                      |
          [9] Fact Checker (conditional)      before drafting for high-risk claims
                      |
              [6] Writer                      first draft
                      |
        [7] Critic + deterministic linter     scores, problems, exact fixes
                      |
      [10] Distribution Critic               LinkedIn recommendation risk
                      |
              [8] Revision Writer             applies the fixes
                      |
                ready for review
                      |
                  user edits
                      |
           Feedback Extractor                 observable editorial preferences
                      |
              memory update
```

## Why framework selection is not a model call

Spec section 25 gives explicit preference orders for six idea shapes. Leaving those to a model to remember means framework choice varies with temperature, and the two failure conditions in section 64 ("every post uses SLAY", "every post sounds the same") become likely rather than avoidable.

So the division of labour is:

- **The model reports facts about the idea.** Did the user supply a real event? Is real evidence available? Is there a genuine emotional reaction behind this?
- **Code decides what those facts permit.** `recommendFrameworks()` in `src/frameworks/selection.ts` scores candidates against the spec's preference orders, applies recency penalties for variation, and blocks anything whose integrity precondition is missing.

The strategist may override the ranking with a stated reason. It may not select something the gates blocked, because a blocked framework is blocked precisely because using it would require fabricating something.

### The gates

| Framework or hook | Requires |
|---|---|
| `lara_slay`, `story_opener` | A user-supplied true personal event |
| `exclamation` | A reaction the user genuinely reported |
| `hormozi_unpopular_truth` | Evidence the opposing belief is genuinely common |
| `hormozi_counter_intuition` | A real user-supplied cost figure |
| `hormozi_post_risk_reversal` | A guarantee marked approved in the offer record |
| `hormozi_post_delivery_choice` | Delivery tiers present in the offer record |
| `hormozi_scarcity_urgency` | An active constraint with a verification timestamp |

A gate returning false is not a degraded outcome. It is the system declining to fabricate, and the strategist records the gap under `proof_missing` so the user can supply the real material if they have it.

## Why the hook critic splits model and code

The model judges nine dimensions per hook. `computeWeightedScore()` turns those judgements into a ranking using configurable weights.

This matters for one dimension in particular. A `false_personal_claim` penalty is 10 points against a 10-point scale, so a hook implying experience the material does not evidence scores zero no matter how relevant, specific and original it is. Integrity is not tradeable against curiosity, and expressing that as arithmetic rather than as a prompt instruction makes it not a judgement call.

## The deterministic linter

`src/writing-rules/` encodes the Nexus IQ writing rules as lint data and structural checks. It runs after the writer and again after each revision, with a final gate before the draft is returned.

Errors block. Warnings go to the critic, which decides whether each is a real violation. That split exists because some rules genuinely cannot be decided by pattern matching: rule 120 is explicit that a factual list of exactly three items must not be treated as a rule-of-three violation, so rule-of-three detection is heuristic and advisory.

The same linter backs `POST /api/lint` and `npm run lint:post`, so the editor, the CLI and the pipeline gate cannot drift apart.

## Retrieval

Two different mechanisms, deliberately:

**Frameworks resolve by ID.** The strategist names them; `resolveFrameworks()` looks them up. This is not a semantic search, because framework selection is a decision with rules behind it and resolving it by embedding similarity would make the gates unenforceable.

**Everything else resolves by embedding.** Knowledge documents, previous posts and feedback memory come back through pgvector similarity with metadata filters.

Feedback preferences are ranked by repetition first, recency second. A preference expressed five times outranks a one-off correction, which is the difference between "the user once cut a sentence" and "the user always cuts this kind of sentence".

Similar previous posts are returned labelled as context, with the instruction that they show what has already been said rather than what to say. Spec section 31: do not copy an old post merely because it is semantically similar.

## Research

Research runs before drafting when the strategist already knows the idea carries current or high-risk claims. Verifying afterwards means the writer has already committed to a claim the evidence may not support, and revising a committed claim is harder than never making it.

A second, post-draft check catches claims the draft introduced that the strategist did not anticipate.

Verified findings reach the writer as usable facts. Findings that were checked and could not be supported reach it as explicit prohibitions, rather than being omitted, because a writer that simply does not see a claim may reconstruct it from the raw idea.

## The distribution check

Runs after editorial critique and fact checking, so it judges the draft a reader
would actually get rather than an intermediate one.

Its discipline is evidence labelling. Confirmed LinkedIn guidance is enforced;
anything the critic inferred is returned separately and shown to the user under
"our judgement, not LinkedIn's rules". The score is the Nexus Distribution
Score, never presented as a prediction of LinkedIn's ranking, because LinkedIn
publishes no creator-facing quality formula.

Folklore detection is deterministic rather than delegated to the model. A post
claiming an optimal posting time, a comment-to-like multiplier or a shadow ban
is making a factual error, and `MYTH_FIREWALL` catches it regardless of what the
model believes.

The distribution mode decides which concerns are flagged and which are accepted.
Profanity in `voice_first` and direct selling in `conversion_first` return
`PASS_WITH_TRADEOFF` rather than `REVISE`: a trade-off the user chose is not a
defect. This matters, because the source file is explicit that the module must
not become an excuse for bland writing.

## Persistence

`post_versions` is append-only. Every AI draft, revision and user edit is a row. `posts.final_text` points at the accepted text rather than being the only copy of it.

`feedback_events` stores what changed and the observable editorial preference behind it. Never chain-of-thought, never inferred motivation.

## Trust boundary

Everything that touches a secret lives behind a route handler. `getServerEnv()` and `getServiceClient()` both throw if reached from the browser, so a server module accidentally pulled into the client graph fails loudly instead of shipping a key.
