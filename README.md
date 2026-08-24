# RABID: THE KENNEL

A native training, accountability, competition and AI-assisted nutrition app for
iOS and Android.

> You do not get credit for intentions. Only the work counts.

Built to the spec in `RABID_THE_KENNEL_MASTER_BUILD_SPEC.md`. The architecture,
schema, screen map, risks and open decisions are in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Running it

```bash
npm install
npx expo start        # then press i / a, or scan with Expo Go
```

Native builds go through EAS:

```bash
npx eas build --profile development --platform ios
npx eas build --profile production --platform all
```

## Checks

```bash
npm run typecheck     # tsc --noEmit, strict
npm test              # 247 unit tests
npx expo export --platform ios       # verifies the bundle builds
```

---

## What's here

**Working end to end**

- Workout logging with offline SQLite persistence and a sync queue
- Deterministic PR detection, Contract progress, streaks and Rabid Score v1
- The Feed: nutrition profile → safety check → calculated targets → food
  preferences → validated 7-day plan → recipes → shopping list → meal prep →
  weekly check-in → calorie adjustment
- Genuine seven-sheet `.xlsx` export via the native share sheet
- Design system, component library, and every V1 screen

**Interface-only, backed by an in-memory implementation**

- Supabase. `BackendClient` is complete; `LocalBackend` implements it against
  seed data using the same engines the server will run.

**Not built yet**

Auth providers, push delivery, Sentry/PostHog adapters, Pack Wars, challenges,
progress photo upload, HealthKit, Health Connect, GPS, RevenueCat.

---

## The rule that shapes the codebase

Anything that must be correct is computed by a deterministic engine, and the LLM
never touches it.

```
src/engines/     pure TypeScript, no React, no I/O, fully tested
                 ↑ calories, macros, safety, PRs, contracts, score

src/services/ai  AIProvider — meal composition and wording only
                 ↑ no calculateCalories, no setMacros, no isThisSafe
```

An AI-proposed meal supplies food ids and grams. Nutrients are computed from the
structured food table, the model is re-checked against the user's allergies and
exclusions rather than trusted, and anything failing validation is dropped and
reported instead of shown.

Allergen exclusions fail closed: choosing "nuts" removes every food not
positively marked nut-free, so a food added to the table later is treated as
unsafe until it is tagged, rather than reaching someone who is allergic to it.

---

## Before this ships

Three items are blocking and none of them are code:

1. **Food data licensing.** `src/data/foods.ts` is development data. A licensed
   source needs commercial rights verified first (spec §36).
2. **Nutrition policy review.** The thresholds in
   `src/engines/nutrition/safetyPolicy.ts` are conservative development defaults
   and require sign-off by a qualified nutrition professional (spec §32).
3. **Legal wording.** Terms, privacy policy and the nutrition disclaimer are
   draft product copy and need a UK solicitor (spec §34).

Also: seed data must be gated behind `APP_ENV` before release (spec §75), and the
app icon is a developer placeholder that should be replaced from vector source.

---

## Licences

Barlow Condensed and Inter are SIL Open Font Licence; the licences ship in
`assets/fonts/`. Rabid brand artwork in `assets/brand/` is the client's own.
