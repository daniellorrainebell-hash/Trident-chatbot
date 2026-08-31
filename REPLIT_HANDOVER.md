# Socrates: complete handover

**The LinkedIn content engine for Nexus IQ. Read this before touching anything.**

This is the single source of truth for taking Socrates from a finished codebase
to a hosted product on a Nexus IQ subdomain.

**The application is complete.** Nothing in the engine needs writing. There is no
scaffolding to fill in, no TODOs, no stubs. What remains is configuration, a
model key, optionally a database, and a deployment.

**Do not rebuild any of it.** If you find yourself writing agents, prompts,
schemas or UI, you have gone off track. Everything described below already
exists and is tested.

---

## Contents

1. [What the product is](#1-what-the-product-is)
2. [State: what is proven and what is not](#2-state-what-is-proven-and-what-is-not)
3. [Getting it running](#3-getting-it-running)
4. [Secrets](#4-secrets)
5. [Model providers](#5-model-providers)
6. [Storage, including Firebase](#6-storage-including-firebase)
7. [The first real API call: what will break and how to fix it](#7-the-first-real-api-call-what-will-break-and-how-to-fix-it)
8. [Deployment](#8-deployment)
9. [The subdomain](#9-the-subdomain)
10. [Acceptance checklist](#10-acceptance-checklist)
11. [Every module and what it is for](#11-every-module-and-what-it-is-for)
12. [The pipeline, stage by stage](#12-the-pipeline-stage-by-stage)
13. [Rules that must not be broken](#13-rules-that-must-not-be-broken)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. What the product is

Socrates turns a rough idea into a LinkedIn first draft, in the owner's voice,
checked against a set of hard writing rules and LinkedIn's published
distribution guidance.

It is a **single-user tool**. One person uses it, behind one password. There are
no accounts, no roles, no teams, no billing. **Do not build multi-tenancy,
sign-up flows, onboarding wizards or user management.**

The value is not the model. It is context, frameworks, retrieval, orchestration,
editorial memory, feedback and evidence. Several parts of the system exist
specifically to stop the model fabricating, and those parts are load-bearing.

| Fact | Value |
|---|---|
| Stack | Next.js 15 App Router, TypeScript, React 19 |
| Model providers | OpenAI, Anthropic or Google. One key is enough. |
| Storage | Local JSON file, or Supabase/Postgres with pgvector |
| Node | 22 |
| Tests | 223, all passing |
| Package manager | npm |
| Auth | One master password |

---

## 2. State: what is proven and what is not

### Proven

Everything below is built, typechecked, covered by tests, and was exercised in a
real browser.

- Eleven agents: strategist, hook generator, hook critic, outline builder,
  writer, editorial critic, revision writer, fact checker, feedback extractor,
  offer strategist, distribution critic, plus a draft adjuster.
- A framework library of 30 frameworks, all data rather than prompt text.
- Deterministic framework selection with integrity gates.
- A deterministic writing-rules linter, no model call.
- LinkedIn distribution logic with an evidence label on every rule.
- Zod schemas at every agent boundary.
- The full interface: composer, checklist, brief, hook picker, draft editor with
  live linting, history, settings.
- Master-password access control with signed session cookies.
- Deterministic sign-off assembly and character budgeting.
- Two storage backends behind one interface.
- Three model providers behind one interface.

Verify all of it in one command:

```bash
npm ci
npm run verify      # typecheck + 223 tests
npm run build
```

**If `npm run verify` fails, stop and report it. Do not work around it.**

### Not proven

**No part of this has ever made a real model API call.** Every stage is
exercised by tests with fixtures. The prompts have never met a live model.

This is the single most important fact in this document. Section 7 covers
exactly what is likely to break and how to fix each case, so you are not
debugging it cold.

Also unproven: the Supabase path has been written and typechecked but never run
against a live Postgres instance. The local JSON store has been run.

---

## 3. Getting it running

Import from GitHub:

```
https://github.com/daniellorrainebell-hash/Trident-chatbot
Branch: claude/new-session-m673y4
```

The repository already contains a `.replit` that pins Node 22, binds `0.0.0.0`,
maps port 3000 to 80 and declares the deployment. **Do not replace it with a
generated one.**

```bash
npm ci      # not npm install, so the lockfile is honoured exactly
npm run dev
```

That is the whole setup. With no secrets at all it will serve on localhost and
refuse remote traffic, which is deliberate (section 4).

---

## 4. Secrets

Set these in Replit Secrets. Never in a file, never committed.

### Required

| Secret | What it is |
|---|---|
| `NEXUS_ACCESS_PASSKEY` | The master password. Daniel will give you the value. |
| One model key | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` or `GOOGLE_API_KEY` |

There is one password and one user. **Do not build accounts, password reset or
email verification on top of it.**

The password is not in this repository and must not be added to it. Ask Daniel
and put it straight into Secrets.

**Why the password is required for a deployment:** with no password set, the app
serves localhost and refuses every remote host with a 503 explaining why. An
unauthenticated deployment would spend the owner's money on every request, so it
fails closed rather than open.

### Optional

| Secret | Default | Notes |
|---|---|---|
| `MODEL_PROVIDER` | first key found | `openai`, `anthropic` or `google`. Only needed if several keys are set. |
| `NEXT_PUBLIC_SUPABASE_URL` | none | All three Supabase values are needed together |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | none | |
| `SUPABASE_SERVICE_ROLE_KEY` | none | Secret. Bypasses row level security. |
| `DATABASE_URL` | none | For applying the schema |
| `APP_ENV` | `development` | Set to `production` on the deployment |
| Model IDs | see below | One block per provider |

---

## 5. Model providers

Set one key. The engine is provider-neutral above `src/lib/providers`: no agent,
prompt or schema names a vendor.

| Provider | Structured output | Web search | Embeddings |
|---|---|---|---|
| OpenAI | Responses API, native schema enforcement | Yes | Yes |
| Anthropic | Messages API, native schema enforcement | Yes | **No** |
| Google Gemini | JSON mode plus schema validation | Not wired up | Yes |

### Model IDs

Application code never names a model. It asks for a role, and the role resolves
from the environment.

| Role | Used by |
|---|---|
| `primary` | strategist, hook engine, outline, writer, critic, distribution |
| `deep` | research and fact checking |
| `fast` | hook scoring, feedback extraction |

```
OPENAI_MODEL_PRIMARY=gpt-5.6-terra
OPENAI_MODEL_DEEP=gpt-5.6-sol
OPENAI_MODEL_FAST=gpt-5.6-luna
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

ANTHROPIC_MODEL_PRIMARY=claude-opus-5
ANTHROPIC_MODEL_DEEP=claude-opus-5
ANTHROPIC_MODEL_FAST=claude-haiku-4-5

GOOGLE_MODEL_PRIMARY=gemini-2.5-pro
GOOGLE_MODEL_DEEP=gemini-2.5-pro
GOOGLE_MODEL_FAST=gemini-2.5-flash
GOOGLE_EMBEDDING_MODEL=text-embedding-004
```

> **The three `gpt-5.6-*` IDs come from the product specification and have not
> been checked against the live OpenAI catalogue.** They are the most likely
> cause of a first-run failure. If a call returns an unknown-model error, change
> the environment variable. **Never hard-code a model ID in the source.**

### Anthropic has no embeddings endpoint

If you run Anthropic alone, semantic retrieval over previous posts is off. It
degrades cleanly and is reported by `/api/status`; it does not error.

To have both: set `ANTHROPIC_API_KEY` and `OPENAI_API_KEY`, plus
`MODEL_PROVIDER=anthropic`. Writing runs on Anthropic, embeddings on OpenAI.

### Which to choose

If Daniel has no preference, use **OpenAI**: it is what the engine was built
against, and its model IDs are the only unverified part. Anthropic is fully
implemented and its model IDs are current. Google is implemented but is the
least exercised adapter of the three.

---

## 6. Storage, including Firebase

Two backends behind one interface (`src/store/`). The active one is reported by
`/api/status` and shown in the header, so it is never a guess.

### Local JSON, the default

Everything in `.data/nexus.json`. Zero setup. Back it up by copying it, read it
by opening it.

Enough for one user, but **not for a deployment**: it depends on a persistent
disk and a single writer. It also cannot do semantic retrieval.

### Supabase, recommended for hosting

```bash
npm run db:push            # applies supabase/migrations/0001_init.sql
npm run seed:frameworks    # loads the framework library
```

If `psql` is absent, `db:push` says so and tells you to paste the migration into
the Supabase SQL editor rather than pretending to have run.

Then create the owner row:

```sql
insert into users (id, email, name)
values ('00000000-0000-0000-0000-000000000001', 'daniellorrainebell@gmail.com', 'Daniel Bell')
on conflict (id) do nothing;

insert into profiles (user_id) values ('00000000-0000-0000-0000-000000000001')
on conflict (user_id) do nothing;
```

### On Firebase

**Firebase is not implemented, and I would not add it.** Daniel asked whether it
was needed, so here is the reasoning rather than a silent omission:

- The two things storage must do here are persist a handful of records and
  search previous posts by meaning. Postgres with pgvector does both. Firestore
  does the first well and the second only through a separate vector extension,
  which is more moving parts for a worse result.
- Supabase is already written, typechecked and documented, with a migration, RLS
  policies and two retrieval functions. Firestore would be a third backend to
  maintain with no capability the other two lack.
- The store interface is small and clean, so if Daniel specifically wants
  Firebase later, implementing `EngineStore` against Firestore is a contained
  job. **Do not do it as part of this handover.**

If Daniel already has Firebase and no Supabase: use the local JSON store on a
Reserved VM to start, and move to Supabase when semantic retrieval matters.

---

## 7. The first real API call: what will break and how to fix it

**Read this section before you run a generation.** The pipeline has never met a
live model, and these are the failures worth expecting, most likely first.

### 7.1 Unknown model

**Symptom:** the first generation fails immediately; the error names a model.

**Cause:** the `gpt-5.6-*` IDs are unverified.

**Fix:** set the three OpenAI model variables to current IDs, or switch provider.
No code change. `/api/status` shows exactly which IDs are in use.

### 7.2 A structured stage returns nothing parseable

**Symptom:** `The <provider> response did not match the "<name>" schema`, or
`returned no parsed output`. The message names the stage.

**Cause:** every agent boundary is a Zod schema, and providers enforce schemas
differently. OpenAI and Anthropic constrain the reply natively; Google is asked
for JSON and validated afterwards, so it is the most likely to trip here.

**Fix, in order:**
1. Check `/api/status` for which provider and models are live.
2. If Google, try OpenAI or Anthropic for the same idea. If it succeeds, the
   problem is the schema conversion in `src/lib/providers/google.ts`, not the
   engine.
3. The named schema is in `src/schemas/`. Loosening a field is acceptable;
   removing the schema is not.

### 7.3 The whole run is slow

**Symptom:** a generation takes one to three minutes.

**Cause:** this is not one call. A full run is roughly nine to twelve sequential
model calls: strategy, offer diagnosis if commercial, around sixteen hooks,
scoring, outline, draft, critic, distribution check, revision, plus research
when required.

**This is expected.** Do not "optimise" it by removing stages; the stages are
the product.

**What to check:** the deployment must be **Reserved VM**, not Autoscale
(section 8). The generate route already sets `maxDuration = 300`.

### 7.4 Cost per post is higher than expected

Nine to twelve calls per post, several with large prompts. Expect a real but
modest per-post cost on a frontier model.

**To reduce it without touching the engine:** point `fast` at a cheaper model
(that role already handles hook scoring and feedback extraction), and leave
"Verify the facts first" unticked unless the post needs it, since research runs
on the `deep` model with web search.

### 7.5 Web search is unavailable

**Symptom:** research fails, or the fact checker returns nothing verified.

**Cause:** the hosted web-search tool is not available on the configured model.
Google is not wired for search at all.

**Fix:** the fact checker records what it could not verify rather than asserting
it, so the correct outcome is a weaker verdict, not a false one. If research
matters, use OpenAI or Anthropic for the `deep` role. **Never "fix" this by
letting unverified claims through.**

### 7.6 Retrieval is empty on Supabase

**Symptom:** logs show `[retrieval] knowledge search unavailable, continuing
without it`.

**Cause:** usually the migration has not been applied, so the
`match_knowledge_documents` and `match_user_posts` functions do not exist.

**Fix:** run the migration (section 6). **Note the generation still completed.**
Retrieval failures are deliberately non-fatal: they cost the run its context,
not the run itself.

### 7.7 The first post is generic

**Symptom:** it works, but it reads like anyone could have written it.

**Cause:** almost always empty Settings. The engine's whole advantage is
context. With no positioning, no beliefs and no past posts, it has nothing to be
specific with.

**Fix:** fill in Settings properly before judging output quality. This is the
single biggest lever on draft quality and it is not a code problem.

### 7.8 The draft exceeds 3,000 characters

It should not: the sign-off is subtracted from the budget before writing, and
one shortening pass runs if the finished post is still over. If it happens
anyway, `result.composed` reports `withinLimit` and `overBy`. Check that the
writer received the budget instruction rather than raising the limit.

---

## 8. Deployment

Use **Reserved VM**, not Autoscale.

- Generation is a chain of model calls taking a minute or more. Autoscale's
  request model is a poor fit.
- The local JSON store needs a persistent disk and a single writer. Autoscale
  gives neither.

Already declared in `.replit`:

```toml
[deployment]
deploymentTarget = "vm"
build = ["sh", "-c", "npm ci && npm run verify && npm run build"]
run = ["sh", "-c", "npm run start"]
```

The build runs the test suite, so a regression fails at deploy time rather than
in front of the owner. `npm run start` binds `0.0.0.0` and reads `$PORT`. **Do
not change it to a fixed port.**

Set `APP_ENV=production` on the deployment.

---

## 9. The subdomain

Target shape:

```
socrates.nexus-iq.co.uk
```

Add the custom domain in the deployment's settings. Replit will show the exact
DNS records. **Use the values Replit shows you**, not values from any
documentation including this file: they are per-deployment.

Add those records at whichever DNS provider hosts `nexus-iq.co.uk`, then wait
for verification.

Once it resolves, add a link from the Nexus IQ site. It is a plain link to a
separate application: no CORS, no API wiring, no shared session. Daniel types
the URL on any device, enters the password, and uses the tool.

---

## 10. Acceptance checklist

Work through this in order. Stop at the first failure and report it.

**Configuration**

- [ ] `GET /api/health` returns `status: "ok"` and names a model provider.
- [ ] Any page while signed out redirects to `/login`.
- [ ] `GET /api/posts` while signed out returns 401, not a redirect.
- [ ] The wrong password is rejected; the right one signs you in.
- [ ] The header shows the provider and the storage backend.

**Set up the owner**

- [ ] Settings: expertise, audience, positioning, at least one genuine belief,
      and the sign-off. Save, reload, confirm it persisted.
- [ ] Tick "Add my sign-off" on Write and confirm the preview shows the exact
      text and the remaining character budget.

**The first real generation**

- [ ] Idea: *People are vibe coding AI products and selling them without
      understanding governance.*
- [ ] Tick "I have proof to include", "Teach something practical", "End with a
      call to action", "Add my sign-off". Leave "I have a real story to tell"
      **unticked** and confirm the draft contains no invented anecdote.
- [ ] Press Build post. **This is the moment the pipeline first meets a live
      model.** If it fails, go to section 7.
- [ ] Hooks appear with families and scores. Pick one.
- [ ] A draft appears with a critic score, a clean writing-rules panel and a
      distribution panel.
- [ ] The sign-off is at the end, exactly as saved, and the character count is
      under 3,000.
- [ ] Edit a sentence and watch the linter re-run as you type.
- [ ] Approve and save. History shows the post with its version chain.

**The learning loop**

- [ ] Generate a second post and confirm it is not structurally identical: a
      different framework or hook family where the idea allows.

---

## 11. Every module and what it is for

This section is the "what does this do and why" reference. Read it before
changing anything under `src/`.

### `src/lib/` infrastructure

| File | Intention |
|---|---|
| `env.ts` | Validates configuration. Two schemas: server secrets and public values. Throws if server env is read in the browser. Model keys are optional here and checked at the point of use, so Settings and History work without one. |
| `providers/types.ts` | The provider interface. Everything above it is vendor-neutral. `extractJson` and `validate` are shared by adapters whose enforcement is weaker. |
| `providers/openai.ts` | OpenAI via the Responses API with native structured outputs. |
| `providers/anthropic.ts` | Anthropic via the Messages API with `output_config.format`. Handles the `refusal` stop reason explicitly, because reading content without checking looks like a parse bug. Returns null from `embed`: Anthropic has no embeddings endpoint. |
| `providers/google.ts` | Gemini over REST rather than an SDK, so there are no bindings to drift. Converts Zod to the JSON Schema subset Gemini accepts, then validates the reply. |
| `providers/index.ts` | Picks a provider from whichever key is present; `MODEL_PROVIDER` breaks ties. Falls back to a second provider for embeddings when the active one cannot embed. |
| `responses.ts` | The two functions every agent calls. Delegates to the active provider. |
| `auth.ts` | Master password and HMAC-signed session cookies. Edge-safe, Web Crypto only. Keyed on the password, so changing it invalidates every session. Constant-time comparison. |
| `compose.ts` | The character budget and sign-off assembly. Pure. The sign-off is appended by code, never written by a model: branding must be byte-identical and the budget must be arithmetic, not an estimate. Idempotent, because the user edits by hand. |
| `api.ts` | Route helpers. Resolves the single user server-side, so no route accepts a user ID from the client. `buildContext` treats retrieval as optional and degrades rather than failing a run. |
| `supabase.ts`, `db.ts` | Supabase clients and persistence. Service client throws if constructed in the browser. |

### `src/frameworks/` the content intelligence

Frameworks are **data, not prompt text**. Adding one is a record, not a prompt
edit. Every record separates `sourceSummary` (what the source establishes) from
`appAdaptation` (how this system uses it), so the engine cannot present its own
adaptations as somebody else's material.

| File | Intention |
|---|---|
| `types.ts` | The framework record shape, including the source/adaptation split. |
| `nexus-hooks.ts` | The seven Nexus hook families with formulas and all 42 source examples. |
| `psychology.ts` | Six psychological triggers, plus three structural hook patterns stored as shapes only. |
| `lara-slay.ts` | Story, Lesson, Actionable Advice, You. Lara Acosta's. |
| `psych-slay-variant.ts` | Setup, Lead-In, Anticipation, Yield. A **different** framework sharing an acronym. **Never attribute it to Lara Acosta.** Tests enforce this. |
| `c2c.ts` | The C2C content engine, post formula, audience journey, six pillars, story principles, quality checklist. |
| `hormozi.ts` | Commercial diagnostics: value equation, objection preemption, MAGIC naming, delivery cube, guarantees, scarcity and urgency, six offer post structures. |
| `linkedin-distribution.ts` | LinkedIn distribution logic, verified through 31 August 2026. Every rule carries an evidence label. Contains the myth firewall. |
| `registry.ts` | One lookup surface. Renders selected frameworks compactly for prompts. |
| `selection.ts` | **Deterministic framework selection.** The model reports facts about the idea; this code decides what those facts permit. Integrity gates live here. |

### `src/writing-rules/`

| File | Intention |
|---|---|
| `rules.ts` | The writing rules as lint data: banned words, banned structures, generic openers, engagement bait, US spellings. |
| `linter.ts` | The deterministic linter. No model call. Errors block a final draft; heuristics stay warnings and go to the critic, because a factual list of three items is not a rule-of-three violation. |
| `prompt-block.ts` | The rules condensed for injection, so the writer does not produce the violation in the first place. |

### `src/schemas/` the agent boundaries

Every agent boundary is a Zod schema. No loose prose parsing between stages.

| File | Intention |
|---|---|
| `strategy.ts` | The idea analysis: audience, pillar, psychology, framework, proof gaps, research need, distribution goal, professional relevance, original angle. |
| `hooks.ts` | Hook candidates, scores, weights and penalties. |
| `outline.ts` | The post's movement, section by section. |
| `critic.ts` | Scores, problems and exact fixes. |
| `factcheck.ts` | Claims classified and given a verdict and a recommended action. |
| `distribution.ts` | The distribution check and the Nexus Distribution Score. |
| `requirements.ts` | The pre-generation checklist. Several ticks are the honest input to the integrity gates. |
| `feedback.ts` | Observable editorial preferences extracted from an edit. Never chain-of-thought. |
| `voice.ts` | The structured voice profile, merged additively from feedback. |
| `offer.ts` | The offer record, with the gates that decide whether a guarantee, scarcity or urgency may appear in copy. |

### `src/agents/`

| File | Intention |
|---|---|
| `strategist.ts` | Understands the idea and classifies it. Reports signals; does not choose the framework. Applies checklist overrides and user overrides. |
| `hook-generator.ts` | Around sixteen candidates across two to four families, de-duplicated on content words, linted before scoring. |
| `hook-critic.ts` | The model scores nine dimensions; code computes the weighted ranking. A false personal claim costs the full scale, so integrity is not tradeable against curiosity. |
| `outline-builder.ts` | The post's movement, from the selected hook and framework. |
| `writer.ts` | The first draft. Receives the requirements, the character budget and only verified research. Unsupported claims arrive as explicit prohibitions rather than being omitted, because a writer that cannot see a claim may rebuild it from the idea. |
| `critic.ts` | Editorial critique, with the linter's findings attached. Errors are not the critic's to dismiss. |
| `distribution-critic.ts` | LinkedIn recommendation risk. Confirmed risks and inferences are reported separately. Deterministic folklore detection runs alongside. |
| `revision-writer.ts` | Applies the fixes. Does not rewrite what was not raised. |
| `fact-checker.ts` | Extracts and classifies claims, researches where required. Runs only when needed. |
| `feedback-extractor.ts` | Compares the AI draft with the user's version and extracts reusable preferences. |
| `offer-strategist.ts` | Commercial diagnosis. Gates are enforced in code afterwards, so compliance is not left to the model. |
| `adjuster.ts` | The one-click draft adjustments. Each records a preference. |

### `src/pipeline/`, `src/store/`, `src/retrieval/`

| File | Intention |
|---|---|
| `pipeline/generate-post.ts` | The orchestrator. Runs the stages, the revision loop, then deterministic assembly and the character limit. |
| `pipeline/state-machine.ts` | Post states and which transitions are legal. |
| `store/types.ts` | The storage interface both backends implement. |
| `store/local-store.ts` | The zero-setup JSON backend. Serialised writes, atomic rename. |
| `store/supabase-store.ts` | The full backend, adding semantic retrieval. |
| `retrieval/embeddings.ts` | Vectors, with a clear failure when no provider can embed. |
| `retrieval/framework-retrieval.ts` | Frameworks resolve **by ID, not by similarity**, because selection has rules behind it that embedding search would make unenforceable. |
| `retrieval/post-memory.ts` | Feedback preferences ranked by repetition first, recency second. |

### `app/` the interface

| Path | Intention |
|---|---|
| `page.tsx` | The composer: idea, brief, checklist, advanced overrides, then the four-step flow. |
| `components/RequirementsChecklist.tsx` | The pre-generation ticks, with the sign-off preview and budget. |
| `components/HookPicker.tsx` | The strongest openings with scores and the promise each commits the body to. |
| `components/DraftView.tsx` | The editable draft, live linting, one-click adjustments, approve. |
| `components/DistributionPanel.tsx` | The distribution check. Confirmed risks and our own inferences kept visibly separate. |
| `components/LintPanel.tsx` | Writing rule findings. |
| `settings/page.tsx` | Identity, beliefs, voice profile, sign-off. |
| `history/page.tsx` | Every post with its version chain. |
| `api/*` | The trust boundary. Every model call and secret lives on this side. |
| `middleware.ts` | The access gate on every route. |

---

## 12. The pipeline, stage by stage

```
idea + brief + checklist
   |
[1] Strategist            classifies the idea, reports signals
   |
    deterministic selection    ranks frameworks, applies integrity gates
   |
[2] Retriever             frameworks by ID, memory and knowledge by embedding
   |
[3] Offer strategist      only when the post is commercial
   |
[4] Hook engine           ~16 candidates across 2 to 4 families
   |
[5] Hook critic           model scores, code ranks
   |
[6] Fact checker          before drafting, for high-risk or current claims
   |
[7] Outline builder       the post's movement
   |
[8] Writer                first draft, inside the character budget
   |
[9] Critic + linter       scores, problems, exact fixes
   |
[10] Distribution critic  LinkedIn recommendation risk
   |
[11] Revision writer      applies the fixes; loops up to twice
   |
    composition           sign-off appended, limit enforced
   |
    ready for review
   |
    user edits and approves
   |
[12] Feedback extractor   observable preferences into the voice profile
```

The learning loop closes at the bottom: what the user keeps, versus what the
engine wrote, becomes retrievable editorial memory for the next post.

---

## 13. Rules that must not be broken

Several of these are the product, not preferences.

**Never hard-code a model ID.** Models resolve in `src/lib/providers` only.
Application code asks for a role. A wrong model is an environment change.

**Never name a vendor above `src/lib/providers`.** No agent, prompt or schema
should know which company answers.

**Never expose a secret to the browser.** Model keys, the service role key and
the database URL are server-only. `getServerEnv()` and `getServiceClient()`
throw if reached from client code. Do not "fix" that by removing the guard.

**Never weaken the writing rules or the integrity gates.** The linter, the
blocked-framework logic and the offer gates exist to stop the model fabricating
personal stories, client results, statistics, guarantees and scarcity. If
something is blocked, that is the system declining to invent. It is not a bug.

**Never invent LinkedIn ranking mechanics.** No weights, no multipliers, no
dwell thresholds, no posting-time formulas. LinkedIn publishes none of them. Do
not optimise for 360Brew: it was an internal test and was shut down.

**Never remove the access gate.** An unauthenticated deployment spends the
owner's money on every request.

**Never let the model write the sign-off.** It is appended by code so the
branding is exact and the budget is arithmetic.

**Do not put framework content into a prompt string.** Frameworks are data.

**Do not add:** social scheduling, auto-commenting, LinkedIn scraping, team
accounts, billing, analytics dashboards, sign-up flows. Explicitly out of scope.

**Do not upgrade** Next, React or the provider SDKs as part of this work. If a
version genuinely blocks deployment, say so and stop.

---

## 14. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| 503 "NEXUS_ACCESS_PASSKEY is not set" | Failing closed on a public host | Set the password secret and redeploy |
| Redirect loop to `/login` | Cookie not being set | Confirm the deployment is served over HTTPS |
| Header shows "No model key" | No provider key set | Set one of the three |
| "MODEL_PROVIDER is set to X but no key" | Mismatch | Set the matching key or remove the override |
| Unknown model error | Unverified model IDs | Change the env var. Section 7.1 |
| "did not match the schema" | Provider returned off-schema JSON | Section 7.2 |
| Header shows "Local storage" unexpectedly | One of three Supabase values missing | All three are required together |
| Semantic retrieval off with Supabase set | No configured provider can embed | Anthropic cannot. Add an OpenAI or Google key |
| `[retrieval] ... unavailable` in logs | Migration not applied | Run it. The generation still completed |
| Generation takes minutes | Nine to twelve sequential model calls | Expected. Use Reserved VM |
| Build fails on `npm run verify` | A genuine regression | Report it. Do not skip the step |
| Draft reads generic | Empty Settings | Fill in identity, beliefs and the sign-off |

---

## Summary

**Done:** the entire application. 223 tests. Eleven agents, 30 frameworks, the
writing-rules linter, LinkedIn distribution logic, the full interface, the
access gate, the checklist, the sign-off and character budget, three model
providers, two storage backends.

**To do:** import, set the password and one model key, optionally set up
Supabase, deploy as a Reserved VM, attach the subdomain, work the acceptance
checklist.

**Expect:** the first real generation to be where the unknowns surface. Section
7 covers each one. The most likely is a model ID, and that is an environment
change rather than a code change.

**Do not:** rebuild the engine, hard-code model IDs, name a vendor above the
provider layer, expose secrets, weaken the writing rules or integrity gates,
invent LinkedIn ranking mechanics, or remove the access gate.
