# Socrates: Replit handover

**Read this before changing anything.**

This document is the complete brief for taking Socrates from a working local
build to a hosted product on a Nexus IQ subdomain. It tells you what the product
is, what is already finished, exactly what remains, and the constraints that must
not be broken along the way.

The application is **complete and tested**. Nothing in the engine needs writing.
What remains is configuration, a database, and a deployment.

---

## 1. What this is

Socrates is a LinkedIn content engine. A rough sentence goes in. A strategically
structured first draft comes out, in the owner's voice, checked against a set of
hard writing rules.

It is a **single-user tool**. There are no accounts, no roles, no user table to
manage. One person uses it. Do not build multi-tenancy, sign-up flows, teams,
billing or onboarding wizards.

The value is not the model. It is context, frameworks, retrieval, orchestration,
editorial memory, feedback and evidence. Several parts of the system exist
specifically to stop the model fabricating, and those parts are load-bearing.

| Fact | Value |
|---|---|
| Stack | Next.js 15 (App Router), TypeScript, React 19 |
| AI provider | OpenAI, Responses API |
| Database | Supabase / Postgres with pgvector (optional, see section 6) |
| Node | 22 |
| Tests | 195, all passing |
| Package manager | npm |

---

## 2. Current state

Everything below is built, typechecked and covered by tests.

- Nine agents: strategist, hook generator, hook critic, outline builder, writer,
  critic, revision writer, fact checker, feedback extractor, plus an offer
  strategist and a draft adjuster.
- A data-driven framework library of 30 frameworks.
- Deterministic framework selection with integrity gates.
- LinkedIn distribution logic, evidence-labelled and verified through 31 August
  2026, with a distribution check stage and a deterministic myth firewall.
- A deterministic writing-rules linter (no model call).
- Zod schemas at every agent boundary.
- Full web interface: composer, hook picker, draft editor, history, settings.
- Two storage backends behind one interface: Supabase, or a local JSON file.
- Master-password access control with a signed session cookie.
- API routes for generate, adjust, approve, profile, posts, lint, frameworks,
  status, health and auth.

Verify all of it in one command:

```bash
npm ci
npm run verify      # typecheck + 195 tests
npm run build
```

**If `npm run verify` fails, stop and report it. Do not work around it.**

### The one thing that has never run

No part of this has made a real OpenAI API call. Every stage is exercised by
tests with fixtures, and the whole pipeline is unproven against the live API.

The first real generation is the moment of truth, and it is the first thing you
should do after configuring secrets. See section 9.

---

## 3. What you need to do

In order:

1. Import the repository into Replit (section 4).
2. Set the secrets (section 5).
3. Create the Supabase project and apply the schema (section 6).
4. Deploy as a Reserved VM (section 7).
5. Attach the subdomain (section 8).
6. Run the acceptance checklist (section 9).

Nothing else. If you find yourself writing application logic, you have gone off
track: re-read section 11.

---

## 4. Importing into Replit

Import from GitHub:

```
https://github.com/daniellorrainebell-hash/Trident-chatbot
Branch: claude/new-session-m673y4
```

The repository already contains a `.replit` file that sets Node 22, binds the
dev server to `0.0.0.0`, maps port 3000 to public port 80, and defines the
deployment build and run commands. **Do not replace it with a generated one.**

First run:

```bash
npm ci
```

`npm ci` rather than `npm install`, so the lockfile is honoured exactly.

---

## 5. Secrets

Set these in Replit's Secrets panel. Do not put them in a file, do not commit
them, and do not prefix any of them with `NEXT_PUBLIC_` except the two that
already carry that prefix.

### Required

| Secret | What it is |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key. Server-side only. |
| `NEXUS_ACCESS_PASSKEY` | The master password that unlocks the app. Daniel will give you the value. |

There is one password and one user. Do not build accounts, roles, password
reset or email verification on top of it.

The value is not in this repository and must not be added to it. Ask Daniel for
it and put it straight into Replit Secrets.

### Required once Supabase exists

| Secret | Where to find it in Supabase |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings, API, Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings, API, anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings, API, service_role key. **Secret.** |
| `DATABASE_URL` | Project Settings, Database, Connection string, URI |

### Optional

| Secret | Default | Notes |
|---|---|---|
| `OPENAI_MODEL_PRIMARY` | `gpt-5.6-terra` | Strategist and writer |
| `OPENAI_MODEL_DEEP` | `gpt-5.6-sol` | Research and fact checking |
| `OPENAI_MODEL_FAST` | `gpt-5.6-luna` | Classification and hook scoring |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Retrieval vectors |
| `APP_ENV` | `development` | Set to `production` on the deployment |

> **Check the model IDs before the first run.** The three `gpt-5.6-*` IDs come
> from the product specification and have not been verified against the live
> OpenAI model catalogue. If a call fails with an unknown-model error, that is
> the cause. Fix it by changing the environment variable to a current model ID.
> **Do not hard-code a model ID anywhere in the source.** Section 11 explains why.

---

## 6. Database

### Do you need Supabase?

Without it the app stores everything in `.data/nexus.json` and still works. For a
hosted deployment, **yes, you need it**, for two reasons:

1. **Persistence.** On Replit, a deployment's filesystem is not a safe home for
   the only copy of your data. A Reserved VM has a persistent disk, but a rebuild
   or a move still puts that single file at risk, and Autoscale would lose it
   outright.
2. **Semantic retrieval.** Searching previous posts and the knowledge base needs
   pgvector. The local store returns nothing for those queries rather than faking
   a similarity score, so the product runs with one of its main advantages off.

### Setting it up

1. Create a Supabase project. Note the database password.
2. Enable the `vector` extension. The migration does this itself with
   `create extension if not exists "vector"`, so this usually needs no action.
3. Apply the schema:

```bash
npm run db:push
```

If `psql` is not available in the container, that command tells you so and prints
what to do instead: open the Supabase SQL Editor and run
`supabase/migrations/0001_init.sql`.

4. Seed the framework library:

```bash
npm run seed:frameworks
```

5. Create the owner row. The app resolves a single user from `NEXUS_USER_ID`,
   which defaults to `00000000-0000-0000-0000-000000000001`. Run this in the SQL
   editor:

```sql
insert into users (id, email, name)
values ('00000000-0000-0000-0000-000000000001', 'daniellorrainebell@gmail.com', 'Daniel Bell')
on conflict (id) do nothing;

insert into profiles (user_id) values ('00000000-0000-0000-0000-000000000001')
on conflict (user_id) do nothing;
```

The schema enables row level security on every user table and the app reaches it
with the service role key from server code only. The service role key must never
appear in a client bundle.

### Checking which backend is live

`GET /api/status` reports it, and the header shows a "Supabase" or "Local
storage" chip. If it says local storage after you have set the Supabase secrets,
one of the three is missing: the app requires all three together.

---

## 7. Deployment

Use **Reserved VM**, not Autoscale.

Reserved VM keeps one long-lived instance. That matters here because:

- Generation is a chain of model calls and can take a minute. Autoscale's request
  model is a poor fit.
- If Supabase is ever not configured, the local JSON store needs a persistent
  disk and a single writer. Autoscale gives neither.

The `.replit` file already declares this:

```toml
[deployment]
deploymentTarget = "vm"
build = ["sh", "-c", "npm ci && npm run verify && npm run build"]
run = ["sh", "-c", "npm run start"]
```

The build runs the test suite, so a broken build fails at deploy time rather than
in front of the owner.

`npm run start` binds `0.0.0.0` and reads `$PORT`. Do not change it to a fixed
port.

Set `APP_ENV=production` on the deployment.

---

## 8. Subdomain

The owner wants this on the Nexus IQ domain. A subdomain is the right shape:

```
socrates.nexus-iq.co.uk
```

In Replit, open the deployment's settings and add the custom domain. Replit will
show you the exact DNS records to create. **Use the values Replit shows you**,
not values from any documentation, including this file: they are per-deployment.

Add those records at whichever DNS provider hosts `nexus-iq.co.uk`, then wait for
verification. DNS propagation is usually minutes but can take longer.

Once it resolves, add a link from the Nexus IQ site to the subdomain. It is a
plain link to a separate application, so there is no CORS or API wiring to do.
The two do not share a session and do not need to.

---

## 9. Acceptance checklist

Work through this in order. Stop at the first failure and report it.

**Configuration**

- [ ] `GET /api/health` returns `status: "ok"` with all three checks true.
- [ ] Visiting any page while signed out redirects to `/login`.
- [ ] `GET /api/posts` while signed out returns 401, not a redirect.
- [ ] The wrong password is rejected. The right one signs you in.
- [ ] The header shows the "Supabase" chip, not "Local storage".

**The first real generation**

- [ ] Open Settings. Fill in expertise, audience, positioning, at least one
      genuine belief and the sign-off. Save. Reload and confirm it persisted.
- [ ] On Write, tick "Add my sign-off" and confirm the preview shows the exact
      text and the remaining character budget.
- [ ] On Write, enter: *People are vibe coding AI products and selling them
      without understanding governance.* Tick "let me pick the opening". Press
      Build post.
- [ ] Hooks appear with families and scores. **This is the moment the pipeline
      is first proven against the live API.**
- [ ] Pick one. A draft appears with a critic score and a clean linter panel.
- [ ] Edit a sentence. The linter re-runs as you type.
- [ ] Press Approve and save.
- [ ] History shows the post with its version chain.

**The learning loop**

- [ ] Generate a second post. Confirm it is not structurally identical to the
      first: a different framework or hook family where the idea allows.

**If a generation fails**, the response body names the failing stage. The most
likely cause by far is an unknown model ID. See the note in section 5.

---

## 10. Where things live

```
app/                     Next.js App Router
  api/                   Route handlers. The trust boundary.
  components/            UI components
  login/                 Access gate
middleware.ts            Enforces the gate on every route
src/
  agents/                The nine agents
  frameworks/            Framework library and selection logic
  writing-rules/         Rule data, linter, prompt block
  schemas/               Zod schemas at every agent boundary
  prompts/               Agent system prompts
  retrieval/             Embeddings, post memory, knowledge search
  pipeline/              Orchestrator and post state machine
  store/                 Supabase and local JSON backends
  lib/                   env, OpenAI, Supabase, auth, persistence
supabase/migrations/     Database schema
docs/                    Architecture and the original source documents
tests/                   131 tests
```

Read `AGENTS.md` before editing anything under `src/`. Read
`docs/architecture.md` for why the stages are arranged as they are.

---

## 11. Rules you must not break

These are not style preferences. Several of them are the product.

**Never hard-code a model ID.** Models are resolved in exactly one place,
`src/lib/openai.ts`. Application code asks for a role: `getModel("primary")`.
If a model ID is wrong, change the environment variable.

**Never expose a secret to the browser.** `OPENAI_API_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are server-only. `getServerEnv()`
and `getServiceClient()` both throw if reached from client code. Do not
"fix" that by removing the guard.

**Never invent LinkedIn ranking mechanics.** No weights, no multipliers, no dwell
thresholds, no posting-time formulas. LinkedIn publishes none of them, and
`src/frameworks/linkedin-distribution.ts` documents what is actually confirmed.
Do not optimise for 360Brew: it was an internal test and was shut down.

**Never weaken the writing rules or the integrity gates.** The linter, the
blocked-framework logic and the offer gates exist to stop the model fabricating
personal stories, client results, statistics, guarantees and scarcity. If
something is blocked, that is the system declining to invent. It is not a bug.

**Never remove the access gate.** An unauthenticated deployment spends the
owner's money on every request.

**Do not put framework content into a prompt string.** Frameworks are data in
`src/frameworks/`. Adding one is a record, not a prompt edit.

**Do not add these**, however tempting: social scheduling, auto-commenting,
LinkedIn scraping, team accounts, billing, analytics dashboards, sign-up flows.
They are explicitly out of scope.

**Do not upgrade Next, React or the OpenAI SDK** as part of this work. If a
version genuinely blocks deployment, say so and stop.

---

## 12. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| 503 with "NEXUS_ACCESS_PASSKEY is not set" | Failing closed on a public host | Set the password secret and redeploy |
| Every page redirects to `/login` in a loop | Cookie not being set | Confirm the deployment is served over HTTPS |
| Header says "Local storage" | One of the three Supabase values missing | All three are required together |
| Generation fails with an unknown model | The `gpt-5.6-*` IDs are unverified | Set the model env vars to current IDs |
| `Structured call ... returned no parsed output` | Model returned nothing schema-valid | Usually the same model-ID problem |
| Similar-post retrieval returns nothing | Running on the local store | Configure Supabase |
| Build fails on `npm run verify` | A genuine regression | Report it. Do not skip the step |
| Slow first generation | Normal: it is a chain of model calls | Use Reserved VM, not Autoscale |

---

## 13. Handover summary

**Done:** the entire application, 195 tests, the interface, the access gate, both
storage backends, the database schema.

**To do:** import, set secrets, create Supabase and apply the schema, deploy as a
Reserved VM, attach `socrates.nexus-iq.co.uk`, run the acceptance checklist.

**Watch for:** the three OpenAI model IDs, which are unverified. That is the most
likely cause of a first-run failure, and it is an environment variable change,
not a code change.

**Do not:** hard-code model IDs, expose secrets to the browser, weaken the
writing rules or integrity gates, remove the access gate, or add features from
the out-of-scope list.
