# Nexus IQ LinkedIn Content Engine

A specialist LinkedIn content intelligence system. It takes a rough idea, works out what the post is trying to achieve, chooses the psychology, hook and narrative framework that fit, retrieves the user's own knowledge and previous writing, generates and scores multiple openings, builds the post, critiques it, fact-checks claims where required, and returns a first draft that gets more aligned to the user over time.

This is not a generic AI writer. The value is not the base model. It is **context, frameworks, retrieval, orchestration, editorial memory, feedback and evidence**.

## Status

The content engine is built. The interface is not, deliberately: the build order in the master spec is architecture, schema, frameworks, agents, persistence, and only then the UI.

| Layer | State |
|---|---|
| Environment validation and model routing | Built |
| Database schema and migrations | Built |
| Framework library (data-driven, 30 frameworks) | Built |
| Deterministic writing-rules linter | Built, 38 tests |
| Zod schemas at every agent boundary | Built |
| Nine agents | Built |
| Pipeline orchestrator and state machine | Built |
| Retrieval (embeddings, memory, knowledge) | Built |
| API route handlers | Built |
| Web interface | Not started |

102 tests pass. `tsc --noEmit` is clean.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill it in
```

Apply the schema to your Supabase project:

```bash
psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
```

Seed the framework library into the database:

```bash
npm run seed:frameworks
```

## Commands

```bash
npm run dev            # Next.js dev server
npm test               # 102 tests
npm run typecheck      # tsc --noEmit
npm run lint:post -- draft.txt   # lint a post against the writing rules
```

## The linter is usable on its own

The writing rules are enforced by a deterministic linter with no model call, so it can be run over any draft:

```bash
echo "Most businesses don't need more AI. They need better systems." | npm run lint:post
```

```
ERROR   generic_opener_hard (section 4)
        "Most businesses"
        A post may never begin with this opener.
ERROR   banned_contrast_dont_need (section 3, 119)
        "don't need more AI. They need"
        Banned contrast structure ("you don't need X, you need Y").
```

## How a post gets made

```
idea
  -> strategist          reports what is true about the idea
  -> deterministic       ranks frameworks, applies integrity gates
  -> retriever           frameworks by ID, knowledge and memory by embedding
  -> hook engine         ~16 candidates across 2 to 4 families
  -> hook critic         model scores dimensions, code computes the ranking
  -> outline builder     the post's movement
  -> writer              first draft
  -> critic + linter     scores, problems, exact fixes
  -> fact checker        only when the claims require it
  -> revision writer     applies the fixes
  -> ready for review
```

The user edits it, and every edit becomes retrievable editorial memory.

## Architecture notes

**Framework choice is deterministic, not vibes.** The strategist model reports signals about the idea ("did the user supply a real event?"). Pure code in `src/frameworks/selection.ts` turns those signals into a ranking using the preference orders from the spec. The model can override with a reason, but it cannot select a framework the integrity gates have blocked.

**Integrity is enforced in code, not requested in prose.** A story framework is unavailable without a real event. A guarantee cannot be quoted unless the offer record marks it approved. Scarcity needs an active flag and a verification date. These are gates, so compliance is not left to the model's judgement.

**Frameworks are data.** Adding one means adding a record in `src/frameworks/`. No prompt changes, no agent changes.

**Every framework record separates source from adaptation.** What Lara Acosta's SLAY actually says lives in a different field from how this system applies it, so the engine cannot present its own adaptations as somebody else's material.

**The two SLAY frameworks are kept apart.** Story / Lesson / Actionable Advice / You is Lara Acosta's. Setup / Lead-In / Anticipation / Yield comes from the uploaded psychology document and is attributed to that document alone. Tests hold this closed.

## Repository layout

```
app/api/            route handlers, the server trust boundary
src/agents/         the nine agents
src/frameworks/     the framework library and selection logic
src/writing-rules/  rule data, linter, prompt block
src/schemas/        Zod schemas at every agent boundary
src/prompts/        agent system prompts
src/retrieval/      embeddings, post memory, knowledge search
src/pipeline/       orchestrator and post state machine
src/lib/            env, OpenAI, Supabase, persistence
supabase/migrations/
docs/               architecture and framework sources
tests/
```

## A note on the configured model IDs

`.env.example` carries the model IDs named in the master spec (`gpt-5.6-terra`, `gpt-5.6-sol`, `gpt-5.6-luna`). They are defaults only: model IDs are resolved in one place, `src/lib/openai.ts`, and are environment-configurable everywhere. Application code asks for a role (`primary`, `deep`, `fast`, `embedding`) and never names a model. Check the IDs against the current OpenAI model catalogue before deploying and change the environment values if they have moved.

## Security

`OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are server-only. `getServerEnv()` throws if it is ever reached from the browser, and `getServiceClient()` does the same. All model requests run in route handlers.
