# RABID: THE KENNEL
## Master Product, Technical Architecture & Build Specification

**Purpose**  
This document is the single build brief for **RABID: THE KENNEL**, a production-grade native mobile application for iOS and Android. It is intentionally detailed so the exact same brief can be given independently to **Claude Code, OpenAI Codex and Replit Agent** and their understanding, architecture, implementation quality and product judgement can be compared fairly.

The product must **not** be reduced to a responsive website, PWA, WebView wrapper or generic gym tracker. The consumer product must be a genuine native mobile app.

---

# 1. PRODUCT VISION

**RABID: THE KENNEL** is a training, accountability, competition and AI-assisted nutrition platform built around one core idea:

> **You do not get credit for intentions. Only the work counts.**

The app should become the user's permanent training record and daily accountability system.

It combines:

- premium workout logging
- personal records and performance history
- training Contracts
- Packs and group competition
- leaderboards
- challenge systems
- fight-camp tracking
- body metrics
- AI-assisted nutrition planning
- 7-day meal plans
- macro tracking and controlled adjustments
- meal-prep guidance
- downloadable Excel plans
- optional future wearable and GPS integrations

This is **not primarily an ecommerce app**. Rabid Gymwear / Rabid Fightwear merchandise can be introduced later, but the application must have standalone value even if a user never buys a product.

---

# 2. BRAND & PRODUCT POSITIONING

Rabid is hard-edged, underground, aggressive, gym/fight culture. The app itself must still feel premium and polished.

The interface should be:

- fast
- dark
- clean
- modern
- high contrast
- highly legible
- industrial without becoming messy
- premium rather than gimmicky

Visual direction:

- near-black backgrounds
- charcoal panels
- off-white / white text
- steel / gunmetal accents
- restrained deep red where useful
- strong large numerals
- subtle texture only where appropriate
- very limited gradients
- no cheap neon-SaaS look
- no cartoon dumbbells
- no generic fitness stock imagery
- no novelty horror fonts in the UI

The custom Rabid logo should be used for branding. The app UI itself should use a clean premium grotesk / condensed sans-serif type system.

Think:

**premium sports performance software x fight culture x high-end streetwear**

---

# 3. BRAND LANGUAGE

Where useful, replace generic app language with Rabid-specific terminology:

- **The Kennel** = home / central hub
- **Train** = start workout
- **The Record** = long-term training history
- **Contracts** = personal commitments
- **The Pack** = social groups / teams
- **Top Dogs** = leaderboards
- **The Yard** = community activity feed
- **Fight Camp** = combat-sport preparation tracker
- **PR Board** = personal records
- **The Feed** = nutrition and meal planning
- **Work Logged** = workout completion state

Potential brand lines:

- **Talk is cheap. Log the work.**
- **The Kennel is where you prove the work.**
- **You don't get credit for intentions. Only the work counts.**

Do not overuse slogans. The product must still feel like serious software.

---

# 4. NATIVE APP REQUIREMENT

The consumer product must be a **real native mobile app** for both iOS and Android.

## Preferred implementation

- **React Native**
- **Expo**
- **TypeScript**
- **Expo Router**
- **EAS Build**

The project must compile into installable native binaries.

Do not deliver:

- a responsive website
- a PWA
- a browser-first React app
- an iframe app
- a WebView shell around a site

Native capabilities required or anticipated:

- push notifications
- camera / photo library
- haptics
- secure storage
- local/offline storage
- native share sheet
- file export
- background-safe timers where platform rules allow
- Apple HealthKit later
- Android Health Connect later
- GPS later

---

# 5. RECOMMENDED TECH STACK

## Mobile client

Preferred:

- React Native
- Expo
- TypeScript
- Expo Router
- TanStack Query
- Zustand or another lightweight state store
- React Hook Form
- Zod
- Expo SecureStore
- Expo SQLite
- Expo Notifications
- Expo Image Picker / Camera
- Expo FileSystem
- Expo Sharing
- React Native Reanimated
- FlashList

Do not add libraries without a clear reason.

## Backend

Preferred:

# **Supabase**

Use:

- PostgreSQL
- Supabase Auth
- Row Level Security
- Supabase Storage
- Edge Functions
- Realtime where useful
- database functions / RPC where appropriate

### Why Supabase is preferred

The product is heavily relational:

- users
- workouts
- exercises
- sets
- personal records
- Contracts
- Packs
- Pack memberships
- challenges
- leaderboards
- nutrition profiles
- food preferences
- meal plans
- meal options
- weekly check-ins

PostgreSQL is a natural fit.

## Firebase alternative

Firebase / Firestore is acceptable if the implementation can clearly justify it, but it is **not the default recommendation**. Do not choose Firebase merely because it is familiar.

If Firebase is selected, the build should explain how it will handle:

- relational Pack / leaderboard queries
- meal-plan data structure
- complex filtering
- server-side validation
- security rules
- efficient analytics queries

---

# 6. SUPPORTING SERVICES

Recommended production services:

- **Supabase**: database, auth, storage
- **Expo EAS**: native build/release pipeline
- **Sentry**: crash/error monitoring
- **PostHog**: product analytics
- **RevenueCat**: subscriptions later
- **Resend** or equivalent: transactional emails if needed
- **AI provider abstraction**: OpenAI / Anthropic / Gemini / other

External providers must be wrapped behind internal service modules. Do not scatter vendor calls throughout screens/components.

---

# 7. REPOSITORY / PROJECT STRUCTURE

Suggested structure:

```text
/apps
  /mobile
/packages
  /ui
  /types
  /validation
  /nutrition-engine
  /scoring-engine
  /api-client
  /config
/supabase
  /migrations
  /functions
  /seed
/docs
```

A simpler repository is acceptable if separation of concerns remains clear.

---

# 8. AUTHENTICATION & ACCOUNT MANAGEMENT

Initial sign-in methods:

- email + password
- magic link optional
- Sign in with Apple
- Sign in with Google

Required:

- session refresh
- logout
- password reset
- account deletion
- age gate
- privacy acceptance
- Terms acceptance
- nutrition disclaimer acceptance

Store versioned consent records, e.g.:

```text
terms_version
privacy_version
nutrition_disclaimer_version
accepted_at
```

---

# 9. USER ONBOARDING

Onboarding should collect enough information to personalise the app without becoming tedious.

## Core profile

- display name
- DOB / age
- sex where needed for nutrition calculations
- height
- weight
- optional body-fat %
- country / region
- preferred units
  - kg / lb
  - cm / ft+in

## Training profile

Primary activity:

- bodybuilding
- strength
- powerlifting
- boxing
- MMA
- kickboxing / Muay Thai
- cross training
- running
- hybrid
- general fitness

Training experience:

- new to training
- 6–18 months
- 1.5–3 years
- 3–5 years
- 5+ years

Also collect:

- sessions/week
- average session length
- perceived intensity
- consistency
- day-to-day activity level

## Main goal

- lose body fat
- build muscle
- maintain / recomp
- improve strength
- improve conditioning
- improve sports performance
- fight preparation
- become more consistent

---

# 10. MAIN NAVIGATION

Recommended bottom tabs:

1. **KENNEL**
2. **TRAIN**
3. **PACK**
4. **RECORD**
5. **PROFILE**

The Feed can be a prominent card/entry from the Kennel initially and can become a dedicated tab later if usage justifies it.

---

# 11. THE KENNEL HOME SCREEN

The home screen must be immediately understandable.

Primary CTA:

# **ENTER THE KENNEL**

or

# **LOG THE WORK**

Suggested live information:

- current training streak
- today's planned workout
- active Contract progress
- workouts this week
- weekly volume
- latest PR
- Pack position
- nutrition target status
- next weekly nutrition check-in
- current challenge progress

Avoid dashboard overload.

---

# 12. WORKOUT LOGGING

Workout logging is mission critical. If it is slow or annoying, the app fails.

Required capabilities:

- create workout
- resume active workout
- repeat previous workout
- saved workout templates
- add/search exercises
- create custom exercise
- add/edit sets
- complete sets
- reorder exercises
- copy previous sets
- rest timer
- session timer
- notes
- optional RPE
- warm-up set flag
- bodyweight exercise support
- unilateral exercise support
- supersets later
- dropsets later
- circuits later

Example:

```text
Bench Press
100 kg x 10
110 kg x 8
120 kg x 5
```

Completion screen:

- duration
- number of exercises
- total working sets
- training volume
- PRs
- Contract progress
- streak update

---

# 13. OFFLINE-FIRST TRAINING

Gym Wi-Fi cannot be trusted.

Use local persistence such as **Expo SQLite**.

Need:

- offline active workout state
- queued server writes
- reconnect sync
- conflict-safe IDs
- sync status

An in-progress workout should survive temporary connectivity loss and, where practical, app restarts.

---

# 14. EXERCISE DATABASE

Create a canonical exercise library.

Fields:

- id
- name
- aliases
- primary muscle group
- secondary muscle groups optional
- equipment
- movement pattern
- unilateral flag
- bodyweight flag
- default unit
- active

Users may create custom exercises.

Do not use an LLM as the canonical exercise database.

---

# 15. PERSONAL RECORDS

Possible PR types:

- max weight
- rep PR at a given weight
- estimated 1RM
- max reps
- distance
- fastest time
- longest duration

PR detection should be deterministic.

Do not ask AI whether a set is a PR.

---

# 16. THE RECORD

The Record is the user's long-term history.

Display:

- lifetime workouts
- total sets
- total volume
- streaks
- PRs
- Contracts completed
- Contracts broken
- challenges completed
- Fight Camps completed
- weight history
- body measurements
- progress photos
- nutrition adherence
- member-since date

Views:

- weekly
- monthly
- yearly

Every training day should be tappable.

---

# 17. CONTRACTS

Contracts are a signature feature.

A Contract is a measurable promise the user makes.

Examples:

- 16 sessions in 30 days
- 20 sessions this month
- run 100 km
- move 250,000 kg total volume
- complete 24 conditioning sessions
- hit a target lift
- complete a Fight Camp schedule

Fields:

- type
- title
- start date
- end date
- target
- unit
- progress
- completed
- failed
- verification mode
- visibility

Important rule:

**Failed Contracts remain in history.**

Users should not be able to erase a failed Contract simply to clean their record.

---

# 18. PACKS

Users can:

- create Pack
- join Pack
- leave Pack
- invite users
- request membership
- assign admins

Pack stats:

- members
- workouts this week
- combined volume
- active streaks
- PRs
- challenge progress
- leaderboard
- recent activity

---

# 19. PACK WARS

Pack vs Pack competition.

Possible scoring:

- most workouts
- attendance percentage
- combined volume
- distance covered
- PR count
- challenge completion rate

Need:

- start/end date
- metric
- eligibility rules
- minimum active members
- anti-cheat logic
- final result
- archived results

Official competitions may later require verified activity.

---

# 20. TOP DOGS LEADERBOARDS

Filters:

- friends
- Pack
- gym
- town
- UK
- global

Categories:

- workouts
- total volume
- running distance
- PRs
- streaks
- Contract completion
- Rabid Score

Do not use one universal leaderboard for incompatible training types.

---

# 21. RABID SCORE

The Rabid Score is an accountability/performance score.

It should reward:

- consistency
- Contracts completed
- training frequency
- genuine progress
- PRs
- challenge completion
- adherence

Possible inactivity penalties.

It must **not** simply reward the strongest user or the person who logs the most junk volume.

The score engine should be deterministic and server-side.

Version the algorithm:

```text
rabid_score_version = 1
```

Store score history.

---

# 22. LEVELS / STATUS

Potential names, not final:

- Stray
- Mutt
- Hound
- Feral
- Rabid

Avoid cliché "Alpha" language unless deliberately chosen later.

---

# 23. THE YARD

The Yard is the community activity feed.

Do not turn it into Instagram.

Allowed activity types:

- workout completed
- PR
- Contract completed
- challenge completed
- Fight Camp milestone
- fight announcement
- fight result
- Pack result
- progress milestone

Features:

- reactions
- comments
- report
- block
- privacy controls

Follower counts should not dominate the experience.

---

# 24. FIGHT CAMP

For:

- boxing
- MMA
- kickboxing
- Muay Thai
- other combat sports

Inputs:

- fight date
- camp start date
- target weight
- current weight
- planned weekly sessions

Track:

- sparring rounds
- bag rounds
- pad rounds
- roadwork
- strength
- conditioning
- recovery
- bodyweight
- completed sessions

Example:

```text
Fight Camp
Day 31 / 56
Sessions: 42
Sparring rounds: 76
Roadwork: 84 km
Current weight: 80.2 kg
Target: 77 kg
```

Do not provide dangerous rapid weight-cut instructions.

---

# 25. TRAINING TIMERS

Native timers:

- rest timer
- stopwatch
- boxing rounds
- MMA rounds
- HIIT
- EMOM
- AMRAP

Need:

- audio alerts
- haptics
- background handling
- lock-screen resilience where APIs allow

---

# 26. BODY METRICS

Optional tracking:

- bodyweight
- body-fat %
- waist
- chest
- arms
- legs
- hips
- custom measurements

Progress photos:

- private by default
- secure storage
- explicit sharing only
- user-controlled deletion

---

# 27. THE FEED: AI NUTRITION SYSTEM

The Feed is a major product pillar, not a small chat feature.

The complete flow:

1. collect nutrition profile
2. choose goal
3. calculate maintenance calories
4. calculate goal calories
5. calculate macros
6. apply safety guardrails
7. collect food preferences
8. generate 7-day meal plan
9. provide 3 options per meal
10. validate macros deterministically
11. provide recipes
12. generate meal-prep plan
13. generate shopping list
14. generate downloadable Excel workbook
15. collect weekly check-in
16. suggest controlled adjustments when justified

---

# 28. NUTRITION GOALS

User chooses:

- **LOSE BODY FAT**
- **BUILD MUSCLE**
- **MAINTAIN / RECOMP**

Then enters:

- current weight
- target weight if applicable
- desired timeframe
- activity level
- training frequency
- training experience
- consistency
- preferred meals/day
- allergies
- intolerances
- dietary restrictions
- foods to exclude
- optional manual calorie/macro targets for advanced users

---

# 29. CRITICAL NUTRITION ARCHITECTURE RULE

# **THE LLM MUST NOT CALCULATE CALORIES OR MACROS.**

Calories and macros must come from a deterministic nutrition engine.

Correct architecture:

```text
User profile
    ↓
Deterministic nutrition engine
    ↓
Safety policy engine
    ↓
Approved calorie + macro targets
    ↓
Food preference engine
    ↓
AI meal composition
    ↓
Deterministic nutrient validation
    ↓
Final plan
```

Never:

```text
User asks AI how much to eat
    ↓
AI invents calorie target
```

---

# 30. ENERGY / BMR CALCULATION

Use a recognised, configurable equation isolated inside the nutrition engine.

A reasonable development starting point is **Mifflin-St Jeor** for adults.

The equation must be swappable/versioned.

Store:

- equation name
- equation version
- activity multiplier
- estimated maintenance calories
- target calories
- protein target
- carbohydrate target
- fat target

These are estimates, not medical measurements.

---

# 31. GOAL TIMEFRAME LOGIC

Example:

```text
Current: 100 kg
Target: 90 kg
Requested timeframe: 12 weeks
```

The system calculates the theoretical required rate and then checks it against configured policy.

If outside the supported range, reject it and offer a longer timeframe.

Example UI:

```text
Your requested timeframe requires a rate of loss outside
The Kennel's supported range.

Earliest supported target:
[calculated timeframe]
```

Same principle for gaining bodyweight.

Never promise that all gained bodyweight will be muscle.

---

# 32. NUTRITION SAFETY POLICY ENGINE

All thresholds must be centralised and configurable.

Example object:

```ts
NutritionSafetyPolicy {
  minAge
  supportedAgeMax
  maxDeficitPercent
  maxSurplusPercent
  minEnergyThresholds
  maxWeightLossRatePercentPerWeek
  maxWeightGainRatePercentPerWeek
  pregnancyExclusion
  breastfeedingExclusion
  eatingDisorderExclusion
  medicalReferralRules
}
```

Exact production values must be reviewed by an appropriately qualified nutrition professional before launch.

Do not scatter health/safety constants across UI components.

---

# 33. AUTOMATED NUTRITION EXCLUSIONS / REFERRAL

The automated planner should stop or route to professional advice where appropriate, including:

- under 18
- pregnancy
- breastfeeding
- active eating disorder
- disclosed history of disordered eating where dieting software may be inappropriate
- serious medical conditions affecting nutrition
- relevant medication concerns
- requested extreme calorie restriction
- requested extreme weight change

The app must not diagnose.

---

# 34. NUTRITION DISCLAIMER

Require explicit acceptance before the first automated plan.

Suggested product-draft wording:

> The Kennel nutrition and meal-planning features are provided for general fitness, educational and informational purposes only. They are not medical advice, diagnosis, treatment or a substitute for advice from a doctor, registered dietitian or other appropriately qualified healthcare professional.
>
> Calorie, macronutrient, weight-change and timeframe calculations are estimates based on the information you provide. Individual energy requirements, body composition changes and results vary and cannot be guaranteed.
>
> The Kennel applies limits to automated calorie and weight-change recommendations and will not intentionally generate plans outside its supported ranges. These safeguards do not mean that a particular plan is suitable or safe for every individual.
>
> Do not use the automated nutrition planner if you are under 18, pregnant or breastfeeding, have an eating disorder or history of disordered eating, or have a medical condition, medication or dietary requirement that may affect your nutritional needs without first obtaining advice from an appropriately qualified healthcare professional.
>
> Stop using the plan and seek appropriate professional advice if you experience concerning symptoms or believe the recommendations are unsuitable for you.
>
> By using the nutrition-planning features, you acknowledge that the results are estimates and that you remain responsible for deciding whether the recommendations are appropriate for your individual circumstances.

This is **draft product wording, not final legal advice**.

Before public release, review:

- Terms
- Privacy Policy
- nutrition disclaimer
- health-related wording
- marketing claims

with an appropriate UK solicitor and qualified nutrition professional.

---

# 35. FOOD PREFERENCE SYSTEM

The user must receive an extensive food catalogue and be able to choose what they like and dislike.

## Protein examples

- chicken breast
- chicken thighs
- turkey
- lean beef
- steak
- lean mince
- pork
- salmon
- tuna
- cod
- prawns
- eggs
- egg whites
- Greek yoghurt
- cottage cheese
- whey
- tofu
- tempeh
- beans
- lentils

## Carbohydrate examples

- rice
- potatoes
- sweet potatoes
- pasta
- oats
- bread
- bagels
- wraps
- couscous
- quinoa
- noodles
- cereal
- fruit

## Fat examples

- avocado
- olive oil
- peanut butter
- almonds
- cashews
- walnuts
- seeds
- whole eggs
- cheese
- oily fish
- dark chocolate

## Fruit & vegetables

Broad catalogue.

Preference states:

- **LOVE IT**
- **DON'T MIND IT**
- **KEEP IT OUT**

Also support:

- allergy
- intolerance
- dietary rule
- religious restriction
- manual exclusion

Exclusions override preferences.

---

# 36. FOOD DATA

Do not trust the LLM to invent nutrient values.

Maintain structured food data:

- food name
- canonical unit
- kcal / 100g
- protein / 100g
- carbs / 100g
- fat / 100g
- fibre / 100g
- source
- source version
- raw/cooked/as-sold state

Possible tables:

```text
food_items
food_nutrients
food_aliases
food_sources
```

If a third-party food API/database is used, verify licensing and commercial-use rights before launch.

---

# 37. RAW VS COOKED WEIGHTS

Every food entry must clearly specify state:

- raw
- cooked
- dry
- drained
- as sold

Example:

```text
Chicken breast: 180g raw
Basmati rice: 125g dry
Peppers: 100g
Olive oil: 10g
```

Never mix states invisibly.

---

# 38. MACRO TARGETS

Display clear daily targets.

Example:

```text
2,640 kcal
Protein: 190g
Carbohydrates: 305g
Fat: 73g
```

Optional:

- fibre
- water guidance

Advanced users can manually override targets, still subject to safety checks.

---

# 39. 7-DAY MEAL PLAN

Generate Monday through Sunday.

Each day includes:

- breakfast
- lunch
- dinner
- snacks

Every meal gets three choices:

- A: primary
- B: alternative
- C: alternative

All options should be approximately macro-equivalent within configured tolerance.

Example:

```text
BREAKFAST

A
Protein oats, banana, peanut butter
612 kcal
P 42 / C 71 / F 17

B
Eggs, toast, avocado, Greek yoghurt
605 kcal
P 41 / C 68 / F 18

C
Bagel, egg whites, whey shake
618 kcal
P 44 / C 73 / F 16
```

---

# 40. MEAL PLAN VALIDATION

AI output is not final until checked.

Required loop:

```text
AI proposes meal
    ↓
Nutrition engine calculates real nutrients
    ↓
Compare with meal budget
    ↓
Adjust portions
    ↓
Recalculate
    ↓
Accept only inside tolerance
```

Set configurable tolerances for:

- calories
- protein
- carbs
- fat

---

# 41. DAILY BALANCING

Daily plans should land near target without pretending single-calorie precision is meaningful.

Example:

```text
Target: 2,640 kcal
Plan: 2,637 kcal
Protein: 191 / 190g
Carbs: 303 / 305g
Fat: 74 / 73g
```

---

# 42. RECIPES

Each meal should provide:

- ingredients
- exact quantities
- prep time
- cooking time
- instructions
- calories
- protein
- carbs
- fat
- fibre where available

Recipe wording may be generated by AI.

Nutrition numbers must come from structured food data.

---

# 43. SWAP MEAL

A user can tap **SWAP MEAL**.

Replacement must:

- use approved foods
- respect allergies
- respect exclusions
- respect dietary rules
- meet similar macros
- be deterministically validated
- update shopping list if accepted

---

# 44. LIVE DAY REBALANCING

If the user changes lunch or logs an off-plan meal, remaining meals can be adjusted.

Example:

```text
You are approximately:
+25g carbs
-18g protein

Dinner and your evening snack can be adjusted.
```

The user must approve changes.

Never silently alter the plan.

---

# 45. TRAINING DAY VS REST DAY NUTRITION

Optional advanced mode:

- same macros every day
- training/rest split

Training days can carry more carbohydrates while weekly energy remains controlled.

Keep this optional for beginners.

---

# 46. MEAL PREP MODE

User chooses:

- 3 days
- 5 days
- 7 days

The system consolidates ingredients and portions.

Example:

```text
Prepare:
1.4kg chicken breast
900g lean beef mince
1.2kg rice
2.0kg potatoes
```

---

# 47. SHOPPING LIST

Automatically generate from the accepted meal plan.

Group by:

- meat & fish
- dairy
- carbohydrates
- fruit & veg
- pantry
- frozen
- supplements if deliberately selected

Allow:

- tick-off
- share
- copy
- export

---

# 48. EXCEL EXPORT

Required feature.

Generate a genuine `.xlsx` workbook.

Use a suitable library such as:

- ExcelJS
- SheetJS

Suggested sheets:

1. **Weekly Plan**
2. **Daily Macros**
3. **Meal Options**
4. **Recipes**
5. **Shopping List**
6. **Meal Prep**
7. **Targets & Profile**

Workbook should be professionally formatted and Rabid-branded, not a raw database dump.

Native flow:

```text
Generate workbook
    ↓
Save temporary file
    ↓
Native share / save sheet
```

Server-side generation with a signed URL is also acceptable.

---

# 49. WEEKLY NUTRITION CHECK-IN

Collect:

- current weight
- optional waist
- plan adherence %
- training adherence %
- hunger
- energy
- performance
- sleep quality optional
- notes

Prefer weight trend over a single weigh-in.

---

# 50. CALORIE ADJUSTMENT LOGIC

Do not change calories constantly.

Require:

- sufficient observation period
- meaningful trend deviation
- adequate adherence

Then suggest a modest change.

Example:

```text
Your three-week trend is below your target rate.

Based on 91% reported adherence, The Kennel recommends:
2,540 kcal → 2,420 kcal

[ACCEPT CHANGE]
[KEEP CURRENT TARGET]
```

The user must approve.

---

# 51. GOAL TIMELINE UI

Allow the user to adjust timeframe and see the impact on estimated target calories.

Show:

- requested target
- supported target
- estimated duration
- calorie adjustment
- disclaimer that results vary

If a timeframe is outside policy, block or clearly mark it unsupported.

---

# 52. TRAINING + NUTRITION CONNECTION

The product becomes powerful because it knows both sides:

- actual workouts
- training frequency
- performance trend
- bodyweight trend
- meal-plan adherence
- Contract adherence
- current goal

These signals should feed useful insights.

---

# 53. AI SYSTEM

AI should operate beneath the product rather than dominate it.

Avoid a giant generic **ASK RABID AI** button.

Contextual examples:

- bench progress has stalled
- weekly training volume is down
- legs have repeatedly been skipped
- user is behind Contract target
- meal choices show clear preferences
- weight trend is behind target
- training consistency is improving

---

# 54. AI PROVIDER ABSTRACTION

Create an internal interface such as:

```ts
interface AIProvider {
  generateMealPlan(...)
  generateMealSwap(...)
  generateRecipe(...)
  generateTrainingInsight(...)
  summarizeCheckIn(...)
}
```

Provider adapters:

- OpenAIProvider
- AnthropicProvider
- GeminiProvider

Do not hardwire the whole application to one AI vendor.

---

# 55. STRUCTURED AI OUTPUT

Any AI result that changes structured application state must use schema validation.

Use Zod / JSON Schema.

Example:

```ts
{
  mealName: string,
  mealType: "breakfast" | "lunch" | "dinner" | "snack",
  ingredients: [
    {
      foodId: string,
      grams: number
    }
  ],
  preparation: string[]
}
```

Use known `foodId` values rather than unconstrained free-text ingredients where macro accuracy matters.

---

# 56. AI FAILURE HANDLING

If AI:

- returns invalid JSON
- selects excluded food
- selects unknown food
- violates allergy rules
- misses macro tolerance
- times out

fail safely.

Retry only within defined limits.

Never show an unvalidated plan as final.

---

# 57. NOTIFICATIONS

Use native push notifications.

Examples:

- **You said four sessions this week. You've done two.**
- **Contract deadline: 4 days. Sessions remaining: 3.**
- **Your Pack just dropped to #2.**
- **Your streak is still alive.**
- **Weekly Feed check-in is ready.**

Users must control notification categories.

---

# 58. APP ICON

Do not squeeze the full **RABID THE KENNEL** wordmark into a tiny icon.

Use a dedicated mark, such as:

- stylised R
- Rabid dog/kennel mark
- separate app symbol

Full logo appears on splash and branding screens.

---

# 59. MEDIA / FILE STORAGE

Suggested Supabase Storage buckets:

- avatars
- progress-photos
- workout-proof
- challenge-proof
- pack-assets
- exported-plans

Private media must be private by default.

Use signed URLs where required.

---

# 60. PRIVACY & UK DATA PROTECTION

UK-first product.

Design for:

- UK GDPR principles
- data minimisation
- purpose limitation
- consent tracking
- deletion
- export
- privacy controls
- secure processing

Users should be able to:

- delete account
- export their data
- delete uploaded media
- control public/private profile fields

Do not collect health-related data simply because it may be useful later.

---

# 61. SECURITY

Required:

- Row Level Security
- server-side authorisation
- no service-role keys in mobile client
- server-only secrets
- input validation
- rate limiting
- signed uploads
- abuse prevention
- SQL migration history
- audit logs for admin actions

Never trust client-supplied:

- Rabid Score
- competition score
- Contract completion
- safety status
- nutrition policy decisions

Validate server-side.

---

# 62. DATABASE MODEL

Suggested core tables:

```text
profiles
user_settings
user_consents
training_profiles

exercises
exercise_aliases
workout_templates
workouts
workout_exercises
workout_sets
personal_records

contracts
contract_progress

packs
pack_members
pack_invites
pack_wars
pack_war_scores

challenges
challenge_participants
challenge_progress

rabid_score_history
levels

yard_posts
yard_comments
yard_reactions
user_blocks
reports

fight_camps
fight_camp_sessions

body_metrics
progress_photos

nutrition_profiles
nutrition_goals
nutrition_safety_decisions
food_items
food_aliases
food_preferences
meal_plans
meal_plan_days
meal_options
meal_ingredients
recipes
shopping_lists
weekly_checkins
nutrition_adjustment_suggestions

notification_preferences
device_push_tokens

subscriptions
entitlements

audit_logs
```

Use UUID primary keys and standard timestamps.

---

# 63. RLS / ACCESS CONTROL

Users should be able to:

- read/write own private profile
- read/write own workouts
- read/write own nutrition data
- read permitted public profile fields
- read Pack data according to membership/privacy
- read public leaderboard data

No user should be able to query another user's private:

- meal plans
- body metrics
- progress photos
- health-related data

unless explicitly shared.

---

# 64. ADMIN PANEL

The **consumer app must be native**.

A lightweight web admin panel is acceptable.

Admin capabilities:

- user lookup
- suspend users
- moderate reports
- manage official challenges
- manage Pack Wars
- manage exercise database
- manage food database
- manage nutrition policy configuration
- manage Rabid Score versions
- feature flags
- legal document versions
- push campaigns
- support tools

Use role-based access.

---

# 65. FEATURE FLAGS

Use feature flags for:

- The Yard
- Fight Camp
- AI insights
- meal rebalancing
- subscriptions
- HealthKit
- Health Connect
- GPS
- verified competitions

---

# 66. SUBSCRIPTIONS / RABID+

Core app should remain genuinely useful for free.

Potential RABID+ features:

- advanced training analytics
- deeper AI training insights
- advanced Feed functions
- unlimited plan regeneration
- deeper nutrition analysis
- Pack competition tools
- Fight Camp analytics
- custom challenges
- wearable integrations

Use **RevenueCat** when subscriptions launch.

Never put safety features behind a paywall.

---

# 67. HEALTH INTEGRATIONS: LATER

## Apple

- HealthKit

## Android

- Health Connect

Potential reads:

- workouts
- steps
- active energy
- bodyweight
- distance
- heart rate where permission exists

Permissions must be granular and requested only when needed.

---

# 68. GPS: LATER

For:

- running
- roadwork
- walking
- cycling

Track:

- distance
- duration
- pace
- route

Require explicit permission and careful background-location handling.

---

# 69. VERIFIED WORK

Possible future verification:

- photo
- video
- GPS
- wearable import
- gym check-in
- official event result

Normal workouts do not need verification.

High-value competitions may.

---

# 70. ANALYTICS

Useful events:

- onboarding_complete
- workout_started
- workout_completed
- contract_created
- contract_completed
- pack_joined
- challenge_joined
- meal_plan_generated
- meal_swapped
- plan_exported
- weekly_checkin_completed

Do not send sensitive raw health/nutrition data into analytics unnecessarily.

---

# 71. ERROR MONITORING

Use Sentry or equivalent.

Capture:

- JS crashes
- native crashes
- failed sync
- AI errors
- export failures
- auth failures
- Edge Function failures

Never log secrets or complete sensitive payloads.

---

# 72. PERFORMANCE TARGETS

- fast launch
- smooth scrolling
- workout screen works offline
- no unnecessary blocking spinners
- progressive loading
- image compression
- pagination
- local caching

Do not fetch entire user histories on every screen.

---

# 73. ACCESSIBILITY

Need:

- good contrast
- scalable text
- VoiceOver / TalkBack labels
- adequate tap areas
- motion reduction support where practical
- status not dependent on colour alone

---

# 74. TESTING

## Unit tests

- nutrition calculation engine
- safety policy engine
- Rabid Score
- PR detection
- Contract progress
- macro validation

## Integration tests

- auth
- workout sync
- Supabase RLS
- meal generation pipeline
- Excel export
- Pack membership
- leaderboard scoring

## E2E

Critical flows:

- sign up
- onboarding
- start workout
- finish workout
- create Contract
- join Pack
- generate meal plan
- export Excel
- delete account

---

# 75. SEED DATA

Development seed should include:

- exercises
- foods
- sample users
- sample workouts
- Packs
- Contracts
- sample meal plan
- sample challenge

Never ship fake production users.

---

# 76. CI / CD

Suggested:

- GitHub
- pull requests
- lint
- typecheck
- tests
- migration validation
- Expo EAS builds

Environments:

- development
- staging
- production

Prefer separate Supabase projects or clearly isolated environments.

---

# 77. CODE QUALITY EXPECTATIONS

The build should:

- use strict TypeScript
- avoid `any`
- validate server payloads
- centralise constants
- centralise design tokens
- use database migrations
- keep business logic out of screens
- create reusable services
- test calculation engines
- avoid giant components
- avoid placeholder features disguised as complete

---

# 78. DESIGN SYSTEM

Central tokens:

```text
colour
spacing
radius
typography
shadow
motion
border
```

Visual tone:

- near-black
- white
- charcoal
- steel
- muted grey
- restrained deep red
- very limited glow

Use the custom Rabid mark for branding only. UI typography must remain clean and legible.

---

# 79. SPLASH / LAUNCH

Possible:

```text
Black screen
Rabid mark
RABID: THE KENNEL
quick transition
home
```

Keep it fast. Do not force a long brand animation on every launch.

---

# 80. V1 REQUIRED SCOPE

V1 should include:

- native iOS and Android
- auth
- onboarding
- profile
- workout logging
- workout history
- exercise database
- PR tracking
- Contracts
- Packs
- basic leaderboards
- Rabid Score V1
- notifications
- The Feed
- nutrition profile
- calorie/macros engine
- safety policy
- food preferences
- 7-day meal plan
- 3 choices per meal
- recipe view
- shopping list
- Excel export
- weekly check-in
- account deletion
- legal/disclaimer acceptance
- analytics
- crash reporting

---

# 81. V1.5

- Pack Wars
- official challenges
- Fight Camp
- The Yard
- progress photos
- meal-prep mode
- live meal swap
- live daily rebalancing
- advanced training analytics
- shareable PR / Contract cards

---

# 82. V2

- AI training insights
- Apple HealthKit
- Android Health Connect
- GPS running / roadwork
- verified competitions
- advanced Pack systems
- gym accounts
- RABID+
- RevenueCat
- deeper nutrition adaptation
- wearable integrations

---

# 83. DO NOT BUILD FIRST

Avoid V1 scope explosion.

Do not initially build:

- massive barcode food database
- full social network
- DMs
- marketplace
- ecommerce store
- coaching marketplace
- video streaming
- live classes
- complex wearables
- endless badges
- excessive subscription tiers

---

# 84. NATIVE ACCEPTANCE CRITERIA

The build is not acceptable unless it:

- installs on real iPhone
- installs on real Android
- runs without browser chrome
- supports native push notifications
- can access camera/photos
- can generate/share Excel
- can log training offline
- uses native-quality navigation
- does not depend on WebView for core screens

---

# 85. WORKOUT ACCEPTANCE CRITERIA

User can:

1. sign in
2. start workout
3. add exercises
4. log sets
5. use timer
6. complete session
7. see totals
8. see detected PR
9. see Contract progress
10. reopen history later

---

# 86. CONTRACT ACCEPTANCE CRITERIA

User can:

1. create measurable Contract
2. activate it
3. see automatic progress
4. complete it
5. fail it after deadline
6. see permanent history

---

# 87. PACK ACCEPTANCE CRITERIA

User can:

1. create/join Pack
2. view members
3. see Pack activity
4. see leaderboard
5. leave Pack
6. manage privacy

---

# 88. THE FEED ACCEPTANCE CRITERIA

User can:

1. enter nutrition profile
2. choose lose fat / build muscle / maintain
3. enter timeframe
4. receive supported calorie/macro target
5. choose foods they like/dislike
6. generate full 7-day plan
7. receive breakfast/lunch/dinner/snacks daily
8. receive 3 choices per meal
9. see macro totals
10. open recipes
11. see shopping list
12. export professional `.xlsx`
13. complete weekly check-in
14. receive adjustment suggestion where justified

---

# 89. SAFETY ACCEPTANCE CRITERIA

The system must:

- reject unsupported extreme timeframes
- prevent plans for excluded profiles
- never let LLM override safety policy
- never trust LLM nutrient calculations
- log policy version used
- require disclaimer acceptance
- label estimates as estimates
- avoid guaranteed fat/muscle/weight claims

---

# 90. AGENT BUILD INSTRUCTIONS

Any coding agent receiving this specification should begin by producing:

1. architecture summary
2. assumptions
3. proposed database schema
4. screen map
5. implementation plan
6. milestone order
7. identified risks
8. open decisions

Then implement.

Do not ask unnecessary questions where a safe sensible default exists.

Surface any decision that materially affects:

- cost
- security
- nutrition safety
- app-store viability
- architecture
- privacy

---

# 91. MILESTONE 1: FOUNDATION

- Expo native project
- TypeScript
- routing
- design tokens
- Supabase integration
- auth
- onboarding
- profile
- migrations
- RLS
- analytics shell
- error monitoring
- local storage architecture

---

# 92. MILESTONE 2: TRAINING CORE

- exercise library
- workout creation
- set logging
- offline persistence
- sync
- workout completion
- history
- PR detection
- rest timer

---

# 93. MILESTONE 3: ACCOUNTABILITY & PACKS

- Contracts
- Packs
- basic leaderboards
- Rabid Score V1
- push notifications

---

# 94. MILESTONE 4: THE FEED

- nutrition profile
- deterministic calorie engine
- macro engine
- safety policy engine
- food database
- food preference UI
- AI provider abstraction
- plan generation
- deterministic validation
- recipes
- shopping list
- Excel export
- weekly check-in

---

# 95. MILESTONE 5: POLISH & RELEASE

- real-device testing
- accessibility
- performance
- crash fixes
- privacy flows
- account deletion
- app icons
- App Store / Play Store screenshots
- metadata
- staged beta
- production release

---

# 96. PRODUCT SUCCESS METRICS

Track early metrics such as:

- onboarding completion
- first workout logged
- workouts per active user
- D7 retention
- D30 retention
- Contracts created
- Contracts completed
- Pack participation
- meal plans generated
- meal plans exported
- weekly check-ins completed

The product succeeds if users repeatedly return because The Kennel becomes their record and accountability system.

---

# 97. PRINCIPLES TO PROTECT

1. **Native first**
2. **Fast workout logging**
3. **Deterministic calculations**
4. **AI assists rather than invents**
5. **Safety lives outside the LLM**
6. **User approves important changes**
7. **No generic fitness-app aesthetic**
8. **Brand language matters**
9. **Training history creates permanent value**
10. **Do not overbuild V1**
11. **No fake precision**
12. **No guaranteed body-composition claims**
13. **No hidden data sharing**
14. **No web app presented as native**
15. **No placeholder features passed off as production**

---

# 98. ONE-SENTENCE PRODUCT DEFINITION

**RABID: THE KENNEL is a native training, accountability, competition and AI-assisted nutrition platform where users log the work, build a permanent record, complete Contracts, train with their Pack and follow nutrition plans built around validated targets and their own food preferences.**

---

# 99. FINAL BUILD DIRECTIVE

Build **RABID: THE KENNEL** as a serious production-grade native mobile application.

Do not simplify it into a generic workout tracker.

Do not replace native functionality with a web app.

Do not allow an LLM to perform safety-critical calculations.

Use deterministic engines for:

- calorie targets
- macros
- goal safety
- PR detection
- Contract progress
- Rabid Score
- leaderboard scoring

Use AI for:

- meal composition
- recipe generation
- meal alternatives
- contextual explanations
- training insights
- check-in summaries

All AI outputs that affect structured application data must be validated before acceptance.

The final product should feel like a **premium Rabid training ecosystem**, not an AI demo.
