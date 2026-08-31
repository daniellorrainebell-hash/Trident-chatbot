# Working in this repository

The product is **Socrates**. Nexus IQ Systems is the company.

Read this before changing anything. The constraints below are not style preferences; several of them are the product.

## What this system is

A persistent content operating system for LinkedIn posts. A rough idea goes in. A strategically structured, psychologically informed, fact-aware first draft comes out, in the user's voice, having been checked against a set of hard writing rules.

The competitive value is not the base model. It is context, frameworks, retrieval, orchestration, editorial memory, feedback and evidence.

## Non-negotiable rules

These come from the master spec, section 65. Breaking one is a defect regardless of what else the change improves.

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

## Architectural rules

**Do not put content intelligence in a system prompt.** Frameworks are data in `src/frameworks/`. Adding a framework means adding a record, not editing a prompt. If you find yourself pasting framework content into a prompt string, the retrieval layer is the right place instead.

**Do not name a model outside `src/lib/openai.ts`.** Code asks for a role. `getModel("primary")`, never `"gpt-5.6-terra"`.

**Integrity constraints go in code, not in prose.** A prompt that says "never invent a guarantee" is a request. `isGuaranteeUsable()` returning false is a gate. Where both are possible, do both, and rely on the gate.

**Every agent boundary is a Zod schema.** No loose prose parsing between stages.

**The linter is the last word on the writing rules.** If a rule can be checked deterministically, it belongs in `src/writing-rules/rules.ts` rather than in a prompt paragraph asking the model to remember it.

## LinkedIn distribution logic

`src/frameworks/linkedin-distribution.ts` encodes
`docs/framework-sources/linkedin-distribution-logic.md`, which is authoritative
for LinkedIn distribution behaviour as of 31 August 2026.

Every rule carries an evidence label and the labels are load-bearing:

- `CONFIRMED` LinkedIn states it. May be enforced.
- `CONFIRMED_CATEGORY` LinkedIn confirms the category, not the mechanics.
- `IMPLEMENTATION_INFERENCE` our product decision. Never reported to the user as
  a LinkedIn rule.
- `UNSUPPORTED` never hardwire it.

Hard constraints when working in this area:

- **Never invent a weight, multiplier or threshold.** No "a comment is worth
  five likes", no dwell-time target, no posting-time formula. LinkedIn publishes
  none of these.
- **Never optimise for 360Brew.** It was an internal test, it was shut down, and
  it is not the current ranking system.
- **Never call the score a LinkedIn Algorithm Score.** It is the Nexus
  Distribution Score. LinkedIn publishes no creator-facing quality formula.
- **Never diagnose a shadow ban.** Use the approved wording in
  `VISIBILITY_LANGUAGE`.
- **Never let this module flatten the author.** Source section 55 is explicit.
  LinkedIn permits opinion, disagreement and humour. The threshold is
  evidence-based recommendation risk, not generic caution. A trade-off the user
  chose knowingly is `PASS_WITH_TRADEOFF`, not `REVISE`.

`MYTH_FIREWALL` catches folklore deterministically, so it holds whatever a model
believes. Add a claim there rather than to a prompt, and add a test.

When LinkedIn's published guidance materially changes: re-verify against primary
sources, bump `DISTRIBUTION_KNOWLEDGE_VERSION`, update the rules, and rerun the
tests.

## The two SLAY frameworks

There are two, they share an acronym, and they are not the same framework.

- `lara_slay` is Story, Lesson, Actionable Advice, You. Lara Acosta's.
- `psych_slay_variant` is Setup, Lead-In, Anticipation, Yield. From the uploaded psychology document, provenance uncertain beyond that document.

Never attribute the second to Lara Acosta. `tests/frameworks.test.ts` enforces this.

## Adding a framework

1. Add the record to the right file in `src/frameworks/`.
2. Fill `sourceSummary` (what the source establishes) and `appAdaptation` (how this system uses it) separately. Never blur them.
3. Fill `misuseRisks`. Every framework has failure modes and the critic reads them.
4. Add `rules` for anything the writer must not do with it.
5. Export it from the module's array so `registry.ts` picks it up.
6. If it needs a signal to be selectable, add the gate to `src/frameworks/selection.ts` and a test for it.
7. Run `npm run seed:frameworks` to push it to the database.

## Adding a writing rule

Phrase-based rules go in `PHRASE_RULES` or a phrase list in `src/writing-rules/rules.ts`. Structural rules that need sentence or paragraph reasoning go in `linter.ts`.

Severity guidance:
- `error` for the integrity rules and the explicit "never" rules. Errors block a final draft.
- `warning` for heuristics. Warnings go to the critic, which judges whether each is a real violation. Rule 120 is explicit that a factual list of three items must not be treated as a violation, so anything heuristic stays a warning.

Add a test with both a violating example and a legitimate example that must not trip it.

## The checklist and the character budget

`src/schemas/requirements.ts` is the pre-generation checklist. It is not only a
convenience: several ticks are the honest input to the integrity gates in
`frameworks/selection.ts`, and where a tick and a model inference disagree, the
tick wins. `hasPersonalStory` is the important one, because a model reading an
idea that sounds like a story is exactly where fabrication starts.

An unticked box is an instruction, not an absence. `renderRequirements` tells the
writer explicitly what to leave out, which is why a post with no CTA ends on
substance rather than drifting into one.

`src/lib/compose.ts` owns the character budget. The sign-off is appended by code,
never written by the model, for two reasons: a model asked to reproduce fixed
branding will eventually paraphrase it, and the budget has to be arithmetic
rather than an estimate. The writer is told its body ceiling up front; assembly
and verification happen afterwards. Keep both properties if you change it, and
keep `composePost` idempotent, because the user edits drafts by hand.

## Storage

Two backends behind one interface in `src/store/`. Supabase when all three of its
env values are set, a local JSON file otherwise. Write against `getStore()`, never
against Supabase directly.

The one honest difference is semantic retrieval, which needs pgvector. The local
store returns nothing from `similarPosts` and `searchKnowledge` rather than
faking a similarity score, and the header reports the active backend so the
downgrade is never silent.

If you add a store method, add it to both implementations and to
`tests/local-store.test.ts`.

## Testing

```bash
npm test          # 223 tests
npm run typecheck
npm run build
```

The tests that matter most are the ones holding the failure conditions closed: framework variation, the story-framework gate, the guarantee gate, and the SLAY attribution guard.

## What not to build yet

Spec section 59 is explicit. No social scheduling, auto comments, LinkedIn scraping, team accounts, billing, mobile apps, analytics dashboards or additional content types until the content engine is excellent.
