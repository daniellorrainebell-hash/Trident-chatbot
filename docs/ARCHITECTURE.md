# RABID: THE KENNEL — Architecture

The deliverables spec §90 asks any coding agent to produce before implementing:
architecture summary, assumptions, schema, screen map, implementation plan,
milestone order, risks, and open decisions.

---

## 1. Architecture summary

A native Expo / React Native app in TypeScript, built around one organising
principle taken from the spec: **anything that must be correct is computed by a
deterministic engine, and the LLM never touches it.**

```
┌──────────────────────────────────────────────────────────────┐
│  app/            Expo Router screens. Presentation only.     │
│                  No business logic, no thresholds, no maths. │
├──────────────────────────────────────────────────────────────┤
│  src/components  Design-system primitives.                   │
│  src/design      Tokens. The only place a colour or font     │
│                  value is written down.                      │
├──────────────────────────────────────────────────────────────┤
│  src/store       Zustand. Orchestration and UI state.        │
├──────────────────────────────────────────────────────────────┤
│  src/engines     Pure TypeScript. No React, no I/O, no       │
│                  vendor imports. Fully unit tested.          │
│    training/     volume · PR detection · contracts · streaks │
│    scoring/      Rabid Score (versioned)                     │
│    nutrition/    energy · safety policy · validation ·       │
│                  adjustment                                  │
├──────────────────────────────────────────────────────────────┤
│  src/services    Vendor boundaries. Every external system is │
│                  behind an interface defined here.           │
│    ai/           AIProvider + LocalMealProvider              │
│    backend/      BackendClient + LocalBackend                │
│    nutrition/    plan pipeline · Excel export                │
│    storage/      SQLite offline persistence                  │
├──────────────────────────────────────────────────────────────┤
│  src/data        Exercise library · food table · seed data   │
│  src/types       Domain model                                │
└──────────────────────────────────────────────────────────────┘
```

### Why the engines are a separate layer

The spec's hardest requirements are all correctness requirements: a PR must be
detected the same way every time, a Contract must not be completable by a client
assertion, a calorie target must never come out of a language model. Isolating
those in pure functions with no dependencies makes them (a) testable without
mocking anything, (b) runnable identically on the server, and (c) impossible to
accidentally couple to a screen.

The 233-test suite runs in ~7 seconds because nothing in the engine layer touches
React Native.

### The nutrition pipeline

This is the architecture spec §29 is most insistent about, so it is worth showing
literally:

```
  NutritionProfile
        │
        ▼
  checkEligibility()          ← blocks before anything is calculated
        │  approved
        ▼
  calculateEnergyTargets()    ← Mifflin-St Jeor / Katch-McArdle, versioned
        │
        ▼
  clampCalories()             ← safety policy: deficit cap, surplus cap, floor
        │
        ▼
  approved MacroTargets
        │
        ▼
  allowedFoodIds()            ← allergies, intolerances, dietary rules applied
        │
        ▼
  AIProvider.generateMealOptions()   ← food ids + grams ONLY
        │
        ▼
  ProposedMealSchema.safeParse()     ← malformed output discarded
        │
        ▼
  findExclusionViolations()          ← model is re-checked, not trusted
        │                              (allergen groups fail closed)
        │
        ▼
  calculateMealNutrients()           ← computed from the food table
        │
        ▼
  fitMealToBudget()                  ← portions scaled, bounded, re-validated
        │
        ▼
  accepted only inside tolerance
```

A meal that fails any step is dropped, and the failure is surfaced to the user.
There is no path that shows an unvalidated plan as final.

**Allergen groups fail closed.** Selecting "nuts" excludes every food that does
not *positively* carry a `nut_free` tag, rather than excluding a list of known
nuts. An untagged or newly added food is therefore treated as unsafe by default.
Per-food allergy selection alone was not safe enough: someone with a nut allergy
should not have to remember to tick almonds, cashews, walnuts and peanut butter
individually, and a food added to the table next month would silently reach them.

Because the check is inverted, food tags are composed from a base of "free of
everything" with only what a food *contains* named explicitly — a missing tag
over-excludes rather than under-protects, and the composition makes an omission
visible in a short list rather than hidden in a long one.

**What the AI interface deliberately does not expose:** there is no
`calculateCalories`, no `setMacros`, no `isThisSafe`. Those methods do not exist
on `AIProvider`, which is what stops them drifting into a prompt in six months.

---

## 2. Assumptions

Stated because they shaped the build, and each is cheap to revisit.

| # | Assumption | Why | If wrong |
|---|---|---|---|
| 1 | Metric storage, display-time conversion | A unit switch must never rewrite history | Low cost — conversion is in `src/utils/format.ts` |
| 2 | Streaks count **weeks meeting a target**, not consecutive days | A daily streak punishes a normal 4-day split | Change `calculateStreak`; tests cover the semantics |
| 3 | Raw tonnage contributes **nothing** to the Rabid Score | Spec §21 forbids rewarding the strongest user or junk volume | Add a component and bump `RABID_SCORE_VERSION` |
| 4 | Active workout stored as one JSON row, not normalised | The client only reads it whole; one atomic write per tapped set | Normalise if partial reads are ever needed |
| 5 | Development food data, not a licensed source | Spec §36 requires commercial rights verified first | Replace row by row; `source`/`sourceVersion` make it traceable |
| 6 | The local meal provider is a real fallback, not a mock | Spec §56 requires failing safe, and a blank plan is not safe | None — it stays as the offline path |
| 7 | Seed data is a development fixture only | Spec §75 forbids shipping fake production users | Gate behind `APP_ENV` before release |
| 8 | Estimated 1RM is capped at 12 reps | Beyond that Epley is badly optimistic; reporting it would be fake precision | Adjust `ESTIMATED_1RM_MAX_REPS` |

---

## 3. Database schema

Postgres via Supabase. Every table carries `id uuid primary key default gen_random_uuid()`,
`created_at timestamptz not null default now()`, and RLS enabled.

### Identity and consent

```sql
profiles            id → auth.users, display_name, handle unique, avatar_url,
                    date_of_birth, country_code, gym, town, units jsonb,
                    is_private boolean
training_profiles   user_id, primary_activity, experience, goal,
                    sessions_per_week, average_session_minutes,
                    perceived_intensity, daily_activity_level
user_consents       user_id, terms_version, privacy_version,
                    nutrition_disclaimer_version, age_confirmed, accepted_at
                    -- versioned, not boolean, so a revision re-prompts precisely
user_settings       user_id, settings jsonb
```

### Training

```sql
exercises           name, aliases text[], primary_muscle, secondary_muscles[],
                    equipment, pattern, metric, unilateral, bodyweight,
                    active, created_by nullable
                    -- created_by null = canonical library entry
exercise_aliases    exercise_id, alias                     -- trigram index for search
workout_templates   user_id, name, exercises jsonb, last_used_at
workouts            user_id, title, status, started_at, completed_at,
                    duration_seconds, notes, template_id, client_id unique
                    -- client_id is the offline-minted uuid; makes sync idempotent
workout_exercises   workout_id, exercise_id, exercise_name, metric, position
workout_sets        workout_exercise_id, index, weight_kg, reps,
                    duration_seconds, distance_meters, rounds, rpe,
                    is_warmup, completed, completed_at
personal_records    user_id, exercise_id, type, value, at_weight_kg, reps,
                    achieved_at, workout_id, previous_value
                    -- written by a trigger on workout completion, never by the client
```

`personal_records` being server-written is the point: spec §61 lists PR and
score as things a client must not be able to assert.

### Accountability

```sql
contracts           user_id, title, metric, target, unit, start_date, end_date,
                    status, visibility, verification, exercise_id,
                    completed_at, failed_at
                    -- no delete policy exists for this table (spec §17)
contract_progress   contract_id, computed_value, computed_at
                    -- materialised by a scheduled function from logged work

packs               name, handle unique, description, is_private, location
pack_members        pack_id, user_id, role, joined_at
pack_invites        pack_id, invited_user_id, invited_by, status, expires_at
pack_wars           challenger_pack_id, defender_pack_id, metric,
                    start_date, end_date, min_active_members, result jsonb
pack_war_scores     pack_war_id, pack_id, score, computed_at

challenges          name, description, metric, target, start_date, end_date,
                    is_official, created_by
challenge_participants  challenge_id, user_id, joined_at
challenge_progress      challenge_id, user_id, value, computed_at

rabid_score_history user_id, total, breakdown jsonb, version, calculated_at
                    -- version stored so old scores stay explainable
levels              name, min_score, ordinal
```

### The Yard

```sql
yard_posts          user_id, type, headline, detail, visibility, created_at
yard_comments       post_id, user_id, body, created_at
yard_reactions      post_id, user_id                       -- unique (post_id, user_id)
user_blocks         user_id, blocked_user_id
reports             reporter_id, subject_type, subject_id, reason, status
```

### Body and combat

```sql
fight_camps         user_id, opponent, discipline, fight_date, camp_start_date,
                    target_weight_kg, current_weight_kg, planned_weekly_sessions
fight_camp_sessions fight_camp_id, workout_id, session_type,
                    sparring_rounds, bag_rounds, pad_rounds, roadwork_km
body_metrics        user_id, kind, label, value, recorded_on, note
progress_photos     user_id, storage_path, taken_on, is_private default true
                    -- private bucket, signed URLs only
```

### Nutrition

```sql
nutrition_profiles  user_id, sex, age_years, height_cm, current_weight_kg,
                    body_fat_percent, activity_level, goal, target_weight_kg,
                    requested_timeframe_weeks, meals_per_day,
                    is_pregnant, is_breastfeeding,
                    has_eating_disorder_history, has_medical_condition
nutrition_goals     user_id, equation, equation_version, policy_version,
                    bmr, activity_multiplier, maintenance_calories,
                    target_calories, protein_g, carbs_g, fat_g, fibre_g
                    -- every target is reproducible from its stored inputs
nutrition_safety_decisions
                    user_id, kind, approved, message, adjustment jsonb,
                    referral_suggested, policy_version, decided_at
                    -- an audit trail of every block and clamp

food_items          name, aliases text[], category, aisle, state,
                    kcal_per_100g, protein_per_100g, carbs_per_100g,
                    fat_per_100g, fibre_per_100g, typical_portion_g,
                    source, source_version, tags text[]
food_aliases        food_item_id, alias
food_preferences    user_id, states jsonb, allergies text[], intolerances text[],
                    dietary_rules text[], manual_exclusions text[]

meal_plans          user_id, week_starting, targets jsonb,
                    nutrition_goal_id, split_training_days
meal_plan_days      meal_plan_id, day_of_week, date, is_training_day,
                    targets jsonb, totals jsonb
meals               meal_plan_day_id, type, budget jsonb, selected_option_id
meal_options        meal_id, slot, name, nutrients jsonb, recipe jsonb
meal_ingredients    meal_option_id, food_item_id, grams, state
shopping_lists      meal_plan_id, items jsonb, generated_at
weekly_checkins     user_id, week_starting, weight_kg, waist_cm,
                    plan_adherence, training_adherence, hunger, energy,
                    performance, sleep_quality, notes
nutrition_adjustment_suggestions
                    user_id, current_calories, suggested_calories,
                    current_macros jsonb, suggested_macros jsonb, reason,
                    weeks_observed, observed_rate, target_rate, status
                    -- status stays 'pending' until the user accepts (spec §50)
```

### Operational

```sql
notification_preferences  user_id, enabled jsonb, quiet_hours_start, quiet_hours_end
device_push_tokens        user_id, token unique, platform, last_seen_at
subscriptions             user_id, revenuecat_id, status, expires_at
entitlements              user_id, entitlement, granted_at, expires_at
feature_flags             key, enabled, rollout_percent, updated_by
audit_logs                actor_id, action, subject_type, subject_id,
                          metadata jsonb, created_at
```

### RLS shape

| Table group | Policy |
|---|---|
| `profiles` | Read own row fully; read others' public columns only when `is_private = false` |
| Workouts, sets, PRs, contracts | `user_id = auth.uid()` for all operations |
| `contracts` | **No delete policy.** Insert and update only, and status transitions are server-side |
| Nutrition, body metrics, progress photos | `user_id = auth.uid()`, no exceptions. Never readable by a Pack |
| `pack_members` | Readable by members of the same pack |
| Leaderboards | Read from a view exposing only display name, rank and the ranked metric |
| `rabid_score_history` | Read own; **insert only by a security-definer function** |
| `food_items`, `exercises` | Read for all authenticated users; write for admin role only |

Nothing on the client holds a service-role key. Anything needing elevated rights
goes through an Edge Function.

---

## 4. Screen map

```
(onboarding)
  welcome ─────────► consent ─────────► profile ─────────► training ──► (tabs)
                     age gate,          name, units       activity,
                     versioned                            experience,
                     acceptance                           sessions/week

(tabs)
  KENNEL ── active Contract ──► contracts/[id]
         ├─ Rabid Score ──────► profile
         ├─ Pack position ────► pack
         └─ The Feed ─────────► feed

  TRAIN  ── start / repeat / template ──► workout/active
         ├─ Tools ──► timers · fight-camp · contracts
         └─ recent ──► workout/[id]

  PACK   ── Top Dogs (scope × category) · members · The Yard

  RECORD ── range filter · PR Board · Contracts · bodyweight · sessions
         └─ workout/[id]

  PROFILE ─ score breakdown · training · units · notifications ·
            legal versions · export data · delete account

workout/
  active ──► exercise-picker (modal)
         └─► complete ──► (tabs)
  [id]   ── past session, repeatable

contracts/
  index ──► new ──► [id]
        └─► [id]   (contributing sessions listed; no delete action)

feed/
  index ─┬─► disclaimer ──► profile ──► targets ──► preferences ──► plan
         │                              (goal timeline)
         ├─► plan ──► day/[id] ──► recipe/[id]
         ├─► shopping-list
         ├─► meal-prep
         ├─► check-in  (adjustment approval)
         └─► export    (.xlsx → native share sheet)
```

---

## 5. Implementation plan and status

| Milestone | Scope | Status |
|---|---|---|
| **M1 Foundation** | Expo + TS + Router, design tokens, component library, offline storage architecture, analytics and error-monitoring seams | **Done** |
| **M2 Training core** | Exercise library, workout logging, set logging, PR detection, rest timer, history, SQLite persistence + sync queue | **Done** (client); server sync pending |
| **M3 Accountability** | Contracts, Packs, leaderboards, Rabid Score v1 | **Done** (client + engines); push notifications pending |
| **M4 The Feed** | Nutrition profile, energy engine, safety policy, food DB, preferences, AI abstraction, plan generation, validation, recipes, shopping list, Excel export, weekly check-in | **Done** |
| **M5 Polish & release** | Supabase wiring, real-device testing, accessibility audit, App Store assets, staged beta | **Not started** |

### What is real vs. what is stubbed

**Real and working:** every deterministic engine, the complete meal-plan pipeline
including validation and exclusion enforcement, Excel export (verified by
asserting the ZIP container signature and reading the sheets back), offline
SQLite persistence for every store, barcode lookup against Open Food Facts
behind a two-layer cache, all navigation and screens, the design system.

**Nothing has yet run on a device or a simulator.** Every verification to date
is a unit test, a typecheck, or the app driven through its web export in a
headless browser. That covers layout, navigation, state and all engine logic.
It does not cover the camera, haptics, notifications, the share sheet, or
SQLite itself — those are exercised only by their native modules, and this build
has never loaded one.

**Interface-only, backed by `LocalBackend`:** Supabase. The `BackendClient`
interface is complete and `LocalBackend` implements it against seed data using
the same engines the server will run, so swapping in Supabase is a change of
transport rather than behaviour.

**Not built:** auth (screens exist, no provider wired), push delivery,
Sentry/PostHog adapters (the seams exist), Pack Wars, challenges, progress photo
upload, HealthKit / Health Connect, GPS, RevenueCat, on-device OCR for the
nutrition-label scanner (the recogniser is an injection point and the screen
routes to manual entry rather than pretending to read anything).

---

## 6. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Food data licensing.** The bundled table is development data. Shipping a licensed source without verified commercial rights is a legal problem, not a technical one | **High** | Spec §36 requires this checked before launch. `source`/`sourceVersion` per row make a swap traceable |
| **Nutrition policy values are not clinically reviewed.** They are conservative starting points | **High** | Spec §32 requires sign-off by a qualified nutrition professional. Every threshold is in one object for exactly this reason |
| **Legal wording is draft.** Terms, privacy and the disclaimer need a UK solicitor | **High** | Spec §34. Versions are already recorded so a revision re-prompts precisely |
| **Meal generation cost at scale.** A 7-day plan is ~28 provider calls | Medium | Cache option sets by (budget, preference hash); `LocalMealProvider` costs nothing and is the fallback |
| **App Store health-claims review.** Nutrition apps draw scrutiny | Medium | No guaranteed outcomes anywhere in the copy, estimates labelled as estimates, exclusions enforced before calculation |
| **Rabid Score gaming.** Users will find the cheapest path to points | Medium | Volume contributes nothing; frequency is capped. Server-side computation means the input is logged work, not a client claim |
| **Offline sync conflicts.** Same workout edited on two devices | Medium | Client-minted UUIDs make sync idempotent. Last-write-wins per workout is acceptable; a set-level merge is not worth the complexity |
| **Bundle size.** Already caught once — the font packages shipped 7.9 MB | Low | Fixed by vendoring 7 faces (1.7 MB). Worth re-checking `expo export` output before each release |

---

### One nutrition engine, not two

A second energy engine (`energyV2.ts`, `policy.ts`, `safetyDecision.ts`) was
carried alongside the live one for a while and has been removed. It was a
closed island — nothing outside those three files ever imported it — and it
disagreed with the shipping engine in ways that would have been silent if
anyone had picked up the wrong import: four activity levels at 1.35–1.78
against the live five at 1.2–1.85, protein 1.4–2.2 g/kg against 1.6–2.8, and a
12% surplus cap against 15%.

The live engine won because the app is built on it end to end: the shared
`ActivityLevel` type, the onboarding screen, the seed profiles and the stores
all speak its five levels, and its policy object carries the pregnancy,
breastfeeding, eating-disorder and medical-referral exclusions directly.

Three ideas in the draft are worth revisiting rather than losing: a *preferred*
rate of change distinct from the maximum, explicit bounds on fat as a fraction
of intake, and a minimum carbohydrate floor before automation is allowed. None
are in the shipping policy today.

---

## 7. Open decisions

Flagged rather than decided, because each materially affects cost, safety or
architecture (spec §90).

1. **Food data source.** Which licensed database, and at what cost? This gates
   launch and is the single largest external dependency.
2. **AI provider and cost ceiling.** The abstraction is in place, but no provider
   is chosen. Meal generation is the only high-volume call path.
3. **Nutrition policy sign-off.** Who reviews the thresholds, and does the review
   change the values or only ratify them?
4. **Auth providers at launch.** Apple and Google are near-mandatory on iOS.
   Email + password adds password-reset and support burden — is it needed for v1?
5. **Progress photo storage.** Private bucket with signed URLs is assumed. Is
   client-side encryption wanted given these are body photos?
6. **Leaderboard eligibility.** What stops someone logging 100 fake sets to top
   the volume board? Verified activity is spec'd for later (§69), but the board
   ships before it.
7. **Streak semantics.** Weekly-target streaks are implemented and defended above,
   but this is a product decision worth confirming — daily streaks are more
   familiar to users even though they punish sane programming.
8. **Web admin panel.** Spec §64 permits one. Not built, and not in this repo.

---

## 8. Testing

```
src/engines/training/volume.test.ts             13 tests
src/engines/training/personalRecords.test.ts    14
src/engines/training/contracts.test.ts          17
src/engines/training/streaks.test.ts             9
src/engines/scoring/rabidScore.test.ts          17
src/engines/nutrition/safetyPolicy.test.ts      17
src/engines/nutrition/energy.test.ts            25
src/engines/nutrition/validation.test.ts        21
src/engines/nutrition/adjustment.test.ts        18
src/services/nutrition/planBuilder.test.ts      26
src/services/nutrition/excelExport.test.ts       8
src/store/workoutStore.test.ts                  15
src/store/nutritionStore.test.ts                14
src/data/seed.test.ts                           26
                                               ───
                                               247
```

Seed data is asserted against the production engines, so a fixture that drifts
into something the engines reject fails the build rather than silently misleading
every screen built on it.

Two defects the tests caught during development, both worth recording:

- **PR detection fired three max-weight records for one ascending ramp.** The
  baseline was being updated mid-session, so each set "beat" the one before it.
  Fixed to emit the session's best per record type, compared against the baseline
  as it stood before the session.
- **Calorie adjustment judged progress against the policy maximum rate** rather
  than the rate the user's plan was actually built around, so someone losing
  exactly the 0.5 kg/week they signed up for read as "behind target" against a
  0.9 kg/week ceiling they never chose.
- **Allergen groups initially emptied the plan.** Fail-closed exclusion is
  correct, but the meal provider offered exactly as many candidates as the caller
  needed, so a couple of validation rejections left a meal slot with nothing in
  it. The provider now over-generates, which is what spec §40's propose-and-check
  loop assumes anyway.

Not covered: component rendering (needs `jest-expo`), navigation flows, and
anything touching a real backend.

---

## 9. Principles this build protects

Mapped to spec §97, with where each is enforced.

| Principle | Where it lives |
|---|---|
| Deterministic calculations | `src/engines/**` — pure, tested, no vendor imports |
| AI assists rather than invents | `AIProvider` has no calorie, macro or safety method |
| Safety lives outside the LLM | `checkEligibility` runs before any calculation; `NutritionSafetyPolicy` is one reviewable object |
| User approves important changes | `suggestAdjustment` returns a proposal; `acceptAdjustment` is the only writer |
| No fake precision | 1RM capped at 12 reps; days land near target, not on it; adjustments round to 20 kcal |
| No guaranteed body-composition claims | Enforced in copy on every nutrition screen and in the export |
| Training history creates permanent value | The Record; failed Contracts have no delete path anywhere |
| Fast workout logging | `SetRow` is memoised, the tick is the largest target, last session's numbers pre-fill |
| Native first | Real Expo project; iOS and Android bundles verified building |
| No web app presented as native | SQLite, haptics, native share sheet, push, camera — no WebView in any core screen |
