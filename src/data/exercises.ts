import type { Exercise } from '@/types';

/**
 * Canonical exercise library (spec §14).
 *
 * A real, structured table — not something an LLM is asked to recall. Users can
 * add their own on top; those carry a `createdBy` and never overwrite these.
 *
 * `aliases` matter more than they look: people search for "OHP", "military
 * press" and "shoulder press" for the same movement, and a search that misses
 * makes logging slow, which the spec calls out as the failure mode that sinks
 * the app (spec §12).
 */

function ex(
  id: string,
  name: string,
  primaryMuscle: Exercise['primaryMuscle'],
  equipment: Exercise['equipment'],
  pattern: Exercise['pattern'],
  options: Partial<Exercise> = {},
): Exercise {
  return {
    id,
    name,
    aliases: [],
    primaryMuscle,
    secondaryMuscles: [],
    equipment,
    pattern,
    metric: 'weight_reps',
    unilateral: false,
    bodyweight: false,
    active: true,
    ...options,
  };
}

export const EXERCISES: Exercise[] = [
  // ── Chest ────────────────────────────────────────────────────────────────
  ex('ex-bench-press', 'Bench Press', 'chest', 'barbell', 'horizontal_push', {
    aliases: ['flat bench', 'barbell bench', 'bb bench'],
    secondaryMuscles: ['triceps', 'shoulders'],
  }),
  ex('ex-incline-bench', 'Incline Bench Press', 'chest', 'barbell', 'horizontal_push', {
    aliases: ['incline barbell press'],
    secondaryMuscles: ['shoulders', 'triceps'],
  }),
  ex('ex-db-bench', 'Dumbbell Bench Press', 'chest', 'dumbbell', 'horizontal_push', {
    aliases: ['db press', 'dumbbell press'],
    secondaryMuscles: ['triceps', 'shoulders'],
  }),
  ex('ex-incline-db', 'Incline Dumbbell Press', 'chest', 'dumbbell', 'horizontal_push', {
    aliases: ['incline db press'],
    secondaryMuscles: ['shoulders', 'triceps'],
  }),
  ex('ex-cable-fly', 'Cable Fly', 'chest', 'cable', 'isolation', {
    aliases: ['cable crossover', 'pec fly'],
  }),
  ex('ex-dip', 'Dip', 'chest', 'bodyweight', 'horizontal_push', {
    aliases: ['chest dip', 'parallel bar dip'],
    secondaryMuscles: ['triceps'],
    bodyweight: true,
    metric: 'weighted_reps',
  }),
  ex('ex-press-up', 'Press-Up', 'chest', 'bodyweight', 'horizontal_push', {
    aliases: ['push-up', 'pushup', 'press up'],
    secondaryMuscles: ['triceps', 'core'],
    bodyweight: true,
    metric: 'reps',
  }),

  // ── Back ─────────────────────────────────────────────────────────────────
  ex('ex-deadlift', 'Deadlift', 'back', 'barbell', 'hinge', {
    aliases: ['conventional deadlift', 'dl'],
    secondaryMuscles: ['hamstrings', 'glutes', 'forearms'],
  }),
  ex('ex-romanian-dl', 'Romanian Deadlift', 'hamstrings', 'barbell', 'hinge', {
    aliases: ['rdl', 'romanian'],
    secondaryMuscles: ['glutes', 'back'],
  }),
  ex('ex-pull-up', 'Pull-Up', 'back', 'bodyweight', 'vertical_pull', {
    aliases: ['pullup', 'chin up', 'chin-up'],
    secondaryMuscles: ['biceps'],
    bodyweight: true,
    metric: 'weighted_reps',
  }),
  ex('ex-lat-pulldown', 'Lat Pulldown', 'back', 'cable', 'vertical_pull', {
    aliases: ['pulldown', 'lat pull'],
    secondaryMuscles: ['biceps'],
  }),
  ex('ex-barbell-row', 'Barbell Row', 'back', 'barbell', 'horizontal_pull', {
    aliases: ['bent over row', 'bb row', 'pendlay row'],
    secondaryMuscles: ['biceps'],
  }),
  ex('ex-db-row', 'Dumbbell Row', 'back', 'dumbbell', 'horizontal_pull', {
    aliases: ['single arm row', 'db row'],
    secondaryMuscles: ['biceps'],
    unilateral: true,
  }),
  ex('ex-seated-row', 'Seated Cable Row', 'back', 'cable', 'horizontal_pull', {
    aliases: ['cable row'],
    secondaryMuscles: ['biceps'],
  }),
  ex('ex-face-pull', 'Face Pull', 'shoulders', 'cable', 'horizontal_pull', {
    aliases: ['rope face pull'],
    secondaryMuscles: ['back'],
  }),

  // ── Legs ─────────────────────────────────────────────────────────────────
  ex('ex-back-squat', 'Back Squat', 'quads', 'barbell', 'squat', {
    aliases: ['squat', 'barbell squat', 'bb squat'],
    secondaryMuscles: ['glutes', 'hamstrings', 'core'],
  }),
  ex('ex-front-squat', 'Front Squat', 'quads', 'barbell', 'squat', {
    aliases: ['fs'],
    secondaryMuscles: ['core', 'glutes'],
  }),
  ex('ex-leg-press', 'Leg Press', 'quads', 'machine', 'squat', {
    aliases: ['45 degree leg press'],
    secondaryMuscles: ['glutes'],
  }),
  ex('ex-bulgarian-split', 'Bulgarian Split Squat', 'quads', 'dumbbell', 'lunge', {
    aliases: ['bss', 'rear foot elevated split squat', 'rfess'],
    secondaryMuscles: ['glutes'],
    unilateral: true,
  }),
  ex('ex-walking-lunge', 'Walking Lunge', 'quads', 'dumbbell', 'lunge', {
    aliases: ['lunge'],
    secondaryMuscles: ['glutes'],
    unilateral: true,
  }),
  ex('ex-leg-curl', 'Lying Leg Curl', 'hamstrings', 'machine', 'isolation', {
    aliases: ['hamstring curl', 'leg curl'],
  }),
  ex('ex-leg-extension', 'Leg Extension', 'quads', 'machine', 'isolation', {
    aliases: ['quad extension'],
  }),
  ex('ex-hip-thrust', 'Hip Thrust', 'glutes', 'barbell', 'hinge', {
    aliases: ['barbell hip thrust', 'glute bridge'],
    secondaryMuscles: ['hamstrings'],
  }),
  ex('ex-calf-raise', 'Standing Calf Raise', 'calves', 'machine', 'isolation', {
    aliases: ['calf raise'],
  }),

  // ── Shoulders & arms ─────────────────────────────────────────────────────
  ex('ex-ohp', 'Overhead Press', 'shoulders', 'barbell', 'vertical_push', {
    aliases: ['ohp', 'military press', 'strict press', 'shoulder press'],
    secondaryMuscles: ['triceps', 'core'],
  }),
  ex('ex-db-shoulder-press', 'Dumbbell Shoulder Press', 'shoulders', 'dumbbell', 'vertical_push', {
    aliases: ['db shoulder press', 'seated db press'],
    secondaryMuscles: ['triceps'],
  }),
  ex('ex-lateral-raise', 'Lateral Raise', 'shoulders', 'dumbbell', 'isolation', {
    aliases: ['side raise', 'lat raise'],
  }),
  ex('ex-rear-delt-fly', 'Rear Delt Fly', 'shoulders', 'dumbbell', 'isolation', {
    aliases: ['reverse fly', 'rear fly'],
  }),
  ex('ex-barbell-curl', 'Barbell Curl', 'biceps', 'barbell', 'isolation', {
    aliases: ['bb curl', 'bicep curl'],
  }),
  ex('ex-db-curl', 'Dumbbell Curl', 'biceps', 'dumbbell', 'isolation', {
    aliases: ['db curl', 'alternating curl'],
  }),
  ex('ex-hammer-curl', 'Hammer Curl', 'biceps', 'dumbbell', 'isolation', {
    aliases: ['neutral curl'],
    secondaryMuscles: ['forearms'],
  }),
  ex('ex-tricep-pushdown', 'Tricep Pushdown', 'triceps', 'cable', 'isolation', {
    aliases: ['rope pushdown', 'cable pushdown', 'tricep extension'],
  }),
  ex('ex-skullcrusher', 'Skullcrusher', 'triceps', 'ez_bar', 'isolation', {
    aliases: ['lying tricep extension', 'skull crusher'],
  }),
  ex('ex-close-grip-bench', 'Close-Grip Bench Press', 'triceps', 'barbell', 'horizontal_push', {
    aliases: ['cgbp', 'close grip bench'],
    secondaryMuscles: ['chest'],
  }),

  // ── Core & carries ───────────────────────────────────────────────────────
  ex('ex-plank', 'Plank', 'core', 'bodyweight', 'isolation', {
    aliases: ['front plank'],
    bodyweight: true,
    metric: 'duration',
  }),
  ex('ex-hanging-leg-raise', 'Hanging Leg Raise', 'core', 'bodyweight', 'isolation', {
    aliases: ['leg raise', 'hanging knee raise'],
    bodyweight: true,
    metric: 'reps',
  }),
  ex('ex-cable-crunch', 'Cable Crunch', 'core', 'cable', 'isolation', {
    aliases: ['kneeling cable crunch'],
  }),
  ex('ex-farmers-carry', "Farmer's Carry", 'forearms', 'dumbbell', 'carry', {
    aliases: ['farmers walk', 'loaded carry'],
    secondaryMuscles: ['core'],
    metric: 'distance',
  }),

  // ── Combat sports (spec §24) ─────────────────────────────────────────────
  ex('ex-sparring', 'Sparring', 'full_body', 'none', 'skill', {
    aliases: ['spar', 'rolls'],
    metric: 'rounds',
  }),
  ex('ex-bag-work', 'Bag Work', 'full_body', 'bag', 'conditioning', {
    aliases: ['heavy bag', 'bagwork'],
    metric: 'rounds',
  }),
  ex('ex-pad-work', 'Pad Work', 'full_body', 'pads', 'skill', {
    aliases: ['pads', 'mitts', 'focus mitts'],
    metric: 'rounds',
  }),
  ex('ex-shadow-boxing', 'Shadow Boxing', 'full_body', 'none', 'skill', {
    aliases: ['shadowboxing', 'shadow'],
    metric: 'rounds',
  }),
  ex('ex-skipping', 'Skipping', 'cardio', 'rope', 'conditioning', {
    aliases: ['jump rope', 'rope work'],
    metric: 'duration',
  }),
  ex('ex-clinch-work', 'Clinch Work', 'full_body', 'none', 'skill', {
    aliases: ['clinch'],
    metric: 'rounds',
  }),
  ex('ex-drilling', 'Technical Drilling', 'full_body', 'none', 'skill', {
    aliases: ['drills', 'technique'],
    metric: 'duration',
  }),


  // ── Machines and variants ────────────────────────────────────────────────
  //
  // Everything above is the free-weight core. What follows is the rest of a
  // real gym floor, and it matters more than it looks: most people build a
  // week around what is actually in front of them, and a library that only
  // knows barbells forces them to log "bench press" for a machine press and
  // lose the distinction forever.
  //
  // Machines are also how a session survives a busy gym. If the rack is taken,
  // the substitute needs to exist as its own row, not as a note.

  // Chest
  ex('ex-decline-bench', 'Decline Bench Press', 'chest', 'barbell', 'horizontal_push', {
    aliases: ['decline barbell press'], secondaryMuscles: ['triceps'],
  }),
  ex('ex-decline-db', 'Decline Dumbbell Press', 'chest', 'dumbbell', 'horizontal_push', {
    secondaryMuscles: ['triceps'],
  }),
  ex('ex-smith-bench', 'Smith Machine Bench Press', 'chest', 'smith', 'horizontal_push', {
    aliases: ['smith bench'], secondaryMuscles: ['triceps', 'shoulders'],
  }),
  ex('ex-smith-incline', 'Smith Machine Incline Press', 'chest', 'smith', 'horizontal_push', {
    secondaryMuscles: ['shoulders', 'triceps'],
  }),
  ex('ex-chest-press-machine', 'Chest Press Machine', 'chest', 'machine', 'horizontal_push', {
    aliases: ['seated chest press', 'machine press', 'hammer strength press'],
    secondaryMuscles: ['triceps', 'shoulders'],
  }),
  ex('ex-incline-press-machine', 'Incline Chest Press Machine', 'chest', 'machine', 'horizontal_push', {
    secondaryMuscles: ['shoulders', 'triceps'],
  }),
  ex('ex-pec-deck', 'Pec Deck', 'chest', 'machine', 'isolation', {
    aliases: ['fly machine', 'machine fly', 'butterfly'],
  }),
  ex('ex-low-cable-fly', 'Low to High Cable Fly', 'chest', 'cable', 'isolation', {
    aliases: ['low cable fly', 'incline cable fly'],
  }),
  ex('ex-high-cable-fly', 'High to Low Cable Fly', 'chest', 'cable', 'isolation', {
    aliases: ['high cable fly', 'decline cable fly'],
  }),
  ex('ex-db-fly', 'Dumbbell Fly', 'chest', 'dumbbell', 'isolation', {
    aliases: ['flat fly'],
  }),
  ex('ex-landmine-press', 'Landmine Press', 'chest', 'barbell', 'horizontal_push', {
    secondaryMuscles: ['shoulders', 'triceps'], unilateral: true,
  }),
  ex('ex-weighted-dip', 'Weighted Dip', 'chest', 'bodyweight', 'horizontal_push', {
    metric: 'weighted_reps', secondaryMuscles: ['triceps', 'shoulders'],
  }),

  // Back and lats
  ex('ex-chin-up', 'Chin-Up', 'back', 'bodyweight', 'vertical_pull', {
    aliases: ['underhand pull up'], secondaryMuscles: ['biceps'], bodyweight: true, metric: 'reps',
  }),
  ex('ex-neutral-pull-up', 'Neutral Grip Pull-Up', 'back', 'bodyweight', 'vertical_pull', {
    aliases: ['hammer grip pull up'], secondaryMuscles: ['biceps'], bodyweight: true, metric: 'reps',
  }),
  ex('ex-assisted-pull-up', 'Assisted Pull-Up Machine', 'back', 'machine', 'vertical_pull', {
    aliases: ['pull up machine'], secondaryMuscles: ['biceps'],
  }),
  ex('ex-close-pulldown', 'Close Grip Lat Pulldown', 'back', 'cable', 'vertical_pull', {
    aliases: ['v bar pulldown'], secondaryMuscles: ['biceps'],
  }),
  ex('ex-single-pulldown', 'Single Arm Lat Pulldown', 'back', 'cable', 'vertical_pull', {
    unilateral: true, secondaryMuscles: ['biceps'],
  }),
  ex('ex-pullover', 'Straight Arm Pulldown', 'back', 'cable', 'isolation', {
    aliases: ['straight arm pullover', 'lat pullover'],
  }),
  ex('ex-pendlay-row', 'Pendlay Row', 'back', 'barbell', 'horizontal_pull', {
    aliases: ['dead stop row'], secondaryMuscles: ['biceps'],
  }),
  ex('ex-t-bar-row', 'T-Bar Row', 'back', 'machine', 'horizontal_pull', {
    aliases: ['landmine row'], secondaryMuscles: ['biceps'],
  }),
  ex('ex-chest-supported-row', 'Chest Supported Row', 'back', 'machine', 'horizontal_pull', {
    aliases: ['seal row', 'incline row'], secondaryMuscles: ['biceps'],
  }),
  ex('ex-machine-row', 'Machine Row', 'back', 'machine', 'horizontal_pull', {
    aliases: ['hammer strength row', 'plate loaded row'], secondaryMuscles: ['biceps'],
  }),
  ex('ex-high-row-machine', 'High Row Machine', 'back', 'machine', 'vertical_pull', {
    secondaryMuscles: ['biceps'],
  }),
  ex('ex-single-cable-row', 'Single Arm Cable Row', 'back', 'cable', 'horizontal_pull', {
    unilateral: true, secondaryMuscles: ['biceps'],
  }),
  ex('ex-smith-row', 'Smith Machine Row', 'back', 'smith', 'horizontal_pull', {
    secondaryMuscles: ['biceps'],
  }),
  ex('ex-rack-pull', 'Rack Pull', 'back', 'barbell', 'hinge', {
    aliases: ['block pull'], secondaryMuscles: ['hamstrings', 'glutes'],
  }),
  ex('ex-trap-bar-dl', 'Trap Bar Deadlift', 'back', 'trap_bar', 'hinge', {
    aliases: ['hex bar deadlift'], secondaryMuscles: ['quads', 'glutes'],
  }),
  ex('ex-sumo-deadlift', 'Sumo Deadlift', 'back', 'barbell', 'hinge', {
    secondaryMuscles: ['glutes', 'quads'],
  }),
  ex('ex-barbell-shrug', 'Barbell Shrug', 'back', 'barbell', 'isolation', {
    aliases: ['shrugs'], secondaryMuscles: ['forearms'],
  }),
  ex('ex-db-shrug', 'Dumbbell Shrug', 'back', 'dumbbell', 'isolation', {}),
  ex('ex-back-extension', 'Back Extension', 'back', 'bodyweight', 'hinge', {
    aliases: ['hyperextension', '45 degree back extension'],
    secondaryMuscles: ['hamstrings', 'glutes'], metric: 'reps',
  }),
  ex('ex-good-morning', 'Good Morning', 'hamstrings', 'barbell', 'hinge', {
    secondaryMuscles: ['glutes', 'back'],
  }),
  ex('ex-reverse-pec-deck', 'Reverse Pec Deck', 'shoulders', 'machine', 'isolation', {
    aliases: ['rear delt machine', 'reverse fly machine'],
  }),

  // Shoulders
  ex('ex-seated-db-press', 'Seated Dumbbell Press', 'shoulders', 'dumbbell', 'vertical_push', {
    secondaryMuscles: ['triceps'],
  }),
  ex('ex-arnold-press', 'Arnold Press', 'shoulders', 'dumbbell', 'vertical_push', {
    secondaryMuscles: ['triceps'],
  }),
  ex('ex-smith-shoulder-press', 'Smith Machine Shoulder Press', 'shoulders', 'smith', 'vertical_push', {
    secondaryMuscles: ['triceps'],
  }),
  ex('ex-shoulder-press-machine', 'Shoulder Press Machine', 'shoulders', 'machine', 'vertical_push', {
    aliases: ['machine overhead press'], secondaryMuscles: ['triceps'],
  }),
  ex('ex-cable-lateral', 'Cable Lateral Raise', 'shoulders', 'cable', 'isolation', {
    unilateral: true,
  }),
  ex('ex-lateral-machine', 'Lateral Raise Machine', 'shoulders', 'machine', 'isolation', {
    aliases: ['machine lateral raise'],
  }),
  ex('ex-front-raise', 'Front Raise', 'shoulders', 'dumbbell', 'isolation', {}),
  ex('ex-upright-row', 'Upright Row', 'shoulders', 'barbell', 'vertical_pull', {
    secondaryMuscles: ['biceps'],
  }),
  ex('ex-cable-rear-delt', 'Cable Rear Delt Fly', 'shoulders', 'cable', 'isolation', {
    aliases: ['reverse cable fly'],
  }),

  // Biceps
  ex('ex-ez-curl', 'EZ Bar Curl', 'biceps', 'ez_bar', 'isolation', {
    aliases: ['ez curl'],
  }),
  ex('ex-incline-curl', 'Incline Dumbbell Curl', 'biceps', 'dumbbell', 'isolation', {}),
  ex('ex-preacher-curl', 'Preacher Curl', 'biceps', 'ez_bar', 'isolation', {
    aliases: ['scott curl'],
  }),
  ex('ex-preacher-machine', 'Preacher Curl Machine', 'biceps', 'machine', 'isolation', {
    aliases: ['machine curl', 'bicep curl machine'],
  }),
  ex('ex-cable-curl', 'Cable Curl', 'biceps', 'cable', 'isolation', {}),
  ex('ex-rope-hammer-curl', 'Rope Hammer Curl', 'biceps', 'cable', 'isolation', {
    secondaryMuscles: ['forearms'],
  }),
  ex('ex-concentration-curl', 'Concentration Curl', 'biceps', 'dumbbell', 'isolation', {
    unilateral: true,
  }),
  ex('ex-spider-curl', 'Spider Curl', 'biceps', 'dumbbell', 'isolation', {}),
  ex('ex-reverse-curl', 'Reverse Curl', 'forearms', 'ez_bar', 'isolation', {
    secondaryMuscles: ['biceps'],
  }),

  // Triceps
  ex('ex-rope-pushdown', 'Rope Pushdown', 'triceps', 'cable', 'isolation', {
    aliases: ['rope tricep extension'],
  }),
  ex('ex-single-pushdown', 'Single Arm Pushdown', 'triceps', 'cable', 'isolation', {
    unilateral: true,
  }),
  ex('ex-overhead-extension', 'Overhead Tricep Extension', 'triceps', 'cable', 'isolation', {
    aliases: ['overhead rope extension'],
  }),
  ex('ex-db-overhead-extension', 'Dumbbell Overhead Extension', 'triceps', 'dumbbell', 'isolation', {
    aliases: ['french press'],
  }),
  ex('ex-tricep-machine', 'Tricep Extension Machine', 'triceps', 'machine', 'isolation', {
    aliases: ['machine tricep extension'],
  }),
  ex('ex-dip-machine', 'Dip Machine', 'triceps', 'machine', 'horizontal_push', {
    aliases: ['assisted dip', 'machine dip'], secondaryMuscles: ['chest'],
  }),
  ex('ex-kickback', 'Tricep Kickback', 'triceps', 'dumbbell', 'isolation', {
    unilateral: true,
  }),
  ex('ex-jm-press', 'JM Press', 'triceps', 'barbell', 'horizontal_push', {
    secondaryMuscles: ['chest'],
  }),

  // Quads
  ex('ex-hack-squat', 'Hack Squat', 'quads', 'machine', 'squat', {
    aliases: ['machine hack squat'], secondaryMuscles: ['glutes'],
  }),
  ex('ex-pendulum-squat', 'Pendulum Squat', 'quads', 'machine', 'squat', {
    secondaryMuscles: ['glutes'],
  }),
  ex('ex-smith-squat', 'Smith Machine Squat', 'quads', 'smith', 'squat', {
    secondaryMuscles: ['glutes'],
  }),
  ex('ex-belt-squat', 'Belt Squat', 'quads', 'machine', 'squat', {
    secondaryMuscles: ['glutes'],
  }),
  ex('ex-horizontal-leg-press', 'Seated Leg Press', 'quads', 'machine', 'squat', {
    aliases: ['horizontal leg press'], secondaryMuscles: ['glutes'],
  }),
  ex('ex-goblet-squat', 'Goblet Squat', 'quads', 'dumbbell', 'squat', {
    secondaryMuscles: ['glutes'],
  }),
  ex('ex-reverse-lunge', 'Reverse Lunge', 'quads', 'dumbbell', 'lunge', {
    unilateral: true, secondaryMuscles: ['glutes'],
  }),
  ex('ex-step-up', 'Step-Up', 'quads', 'dumbbell', 'lunge', {
    unilateral: true, secondaryMuscles: ['glutes'],
  }),
  ex('ex-sissy-squat', 'Sissy Squat', 'quads', 'bodyweight', 'squat', { metric: 'reps' }),
  ex('ex-leg-press-narrow', 'Leg Press (Narrow Stance)', 'quads', 'machine', 'squat', {}),

  // Hamstrings and glutes
  ex('ex-seated-leg-curl', 'Seated Leg Curl', 'hamstrings', 'machine', 'isolation', {
    aliases: ['seated hamstring curl'],
  }),
  ex('ex-standing-leg-curl', 'Standing Leg Curl', 'hamstrings', 'machine', 'isolation', {
    unilateral: true,
  }),
  ex('ex-stiff-leg-dl', 'Stiff Leg Deadlift', 'hamstrings', 'barbell', 'hinge', {
    aliases: ['sldl'], secondaryMuscles: ['glutes', 'back'],
  }),
  ex('ex-nordic-curl', 'Nordic Curl', 'hamstrings', 'bodyweight', 'isolation', {
    aliases: ['nordic hamstring curl'], metric: 'reps',
  }),
  ex('ex-ghr', 'Glute Ham Raise', 'hamstrings', 'machine', 'isolation', {
    aliases: ['ghr'], metric: 'reps', secondaryMuscles: ['glutes'],
  }),
  ex('ex-pull-through', 'Cable Pull-Through', 'glutes', 'cable', 'hinge', {
    secondaryMuscles: ['hamstrings'],
  }),
  ex('ex-hip-thrust-machine', 'Hip Thrust Machine', 'glutes', 'machine', 'hinge', {
    aliases: ['machine hip thrust'], secondaryMuscles: ['hamstrings'],
  }),
  ex('ex-glute-bridge', 'Glute Bridge', 'glutes', 'barbell', 'hinge', {
    secondaryMuscles: ['hamstrings'],
  }),
  ex('ex-cable-kickback', 'Cable Glute Kickback', 'glutes', 'cable', 'isolation', {
    unilateral: true,
  }),
  ex('ex-abduction-machine', 'Hip Abduction Machine', 'glutes', 'machine', 'isolation', {
    aliases: ['abductor machine'],
  }),
  ex('ex-adduction-machine', 'Hip Adduction Machine', 'quads', 'machine', 'isolation', {
    aliases: ['adductor machine'],
  }),

  // Calves
  ex('ex-seated-calf', 'Seated Calf Raise', 'calves', 'machine', 'isolation', {}),
  ex('ex-leg-press-calf', 'Leg Press Calf Raise', 'calves', 'machine', 'isolation', {}),
  ex('ex-donkey-calf', 'Donkey Calf Raise', 'calves', 'machine', 'isolation', {}),

  // Core
  ex('ex-side-plank', 'Side Plank', 'core', 'bodyweight', 'isolation', {
    metric: 'duration', unilateral: true,
  }),
  ex('ex-hanging-knee-raise', 'Hanging Knee Raise', 'core', 'bodyweight', 'isolation', {
    metric: 'reps',
  }),
  ex('ex-ab-wheel', 'Ab Wheel Rollout', 'core', 'bodyweight', 'isolation', { metric: 'reps' }),
  ex('ex-decline-situp', 'Decline Sit-Up', 'core', 'bodyweight', 'isolation', { metric: 'reps' }),
  ex('ex-russian-twist', 'Russian Twist', 'core', 'plate', 'rotation', { metric: 'reps' }),
  ex('ex-pallof-press', 'Pallof Press', 'core', 'cable', 'rotation', {}),
  ex('ex-woodchop', 'Cable Woodchop', 'core', 'cable', 'rotation', { unilateral: true }),
  ex('ex-ab-machine', 'Ab Crunch Machine', 'core', 'machine', 'isolation', {}),

  // Forearms
  ex('ex-wrist-curl', 'Wrist Curl', 'forearms', 'barbell', 'isolation', {}),
  ex('ex-reverse-wrist-curl', 'Reverse Wrist Curl', 'forearms', 'barbell', 'isolation', {}),
  ex('ex-plate-pinch', 'Plate Pinch', 'forearms', 'plate', 'carry', { metric: 'duration' }),

  // ── Conditioning ─────────────────────────────────────────────────────────
  ex('ex-run', 'Run', 'cardio', 'none', 'conditioning', {
    aliases: ['running', 'roadwork', 'jog'],
    metric: 'distance_time',
  }),
  ex('ex-row-erg', 'Rowing Machine', 'cardio', 'machine', 'conditioning', {
    aliases: ['erg', 'concept 2', 'rower'],
    metric: 'distance_time',
  }),
  ex('ex-assault-bike', 'Assault Bike', 'cardio', 'machine', 'conditioning', {
    aliases: ['air bike', 'echo bike'],
    metric: 'duration',
  }),
  ex('ex-sled-push', 'Sled Push', 'quads', 'sled', 'conditioning', {
    aliases: ['prowler push'],
    metric: 'distance',
  }),
  ex('ex-burpee', 'Burpee', 'full_body', 'bodyweight', 'conditioning', {
    aliases: ['burpees'],
    bodyweight: true,
    metric: 'reps',
  }),
  ex('ex-kb-swing', 'Kettlebell Swing', 'glutes', 'kettlebell', 'hinge', {
    aliases: ['kb swing', 'russian swing'],
    secondaryMuscles: ['hamstrings', 'core'],
  }),
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function findExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

/**
 * Search by name and alias.
 *
 * Ranks a name prefix above a name substring above an alias hit, so typing
 * "bench" surfaces Bench Press before Close-Grip Bench Press, and "ohp" still
 * finds Overhead Press.
 */
export function searchExercises(query: string, pool: Exercise[] = EXERCISES): Exercise[] {
  const q = query.trim().toLowerCase();
  if (!q) return pool.filter((e) => e.active);

  const scored: Array<{ exercise: Exercise; score: number }> = [];

  for (const exercise of pool) {
    if (!exercise.active) continue;
    const name = exercise.name.toLowerCase();

    let score = -1;
    if (name.startsWith(q)) score = 3;
    else if (name.includes(q)) score = 2;
    else if (exercise.aliases.some((a) => a.toLowerCase().includes(q))) score = 1;

    if (score >= 0) scored.push({ exercise, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name))
    .map((s) => s.exercise);
}

export function exercisesByMuscle(muscle: Exercise['primaryMuscle']): Exercise[] {
  return EXERCISES.filter((e) => e.active && e.primaryMuscle === muscle);
}

/** Muscle groups that actually have exercises, for the picker's filter row. */
export const MUSCLE_FILTERS: Array<{ id: Exercise['primaryMuscle']; label: string }> = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'quads', label: 'Quads' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'calves', label: 'Calves' },
  { id: 'core', label: 'Core' },
  { id: 'full_body', label: 'Combat' },
  { id: 'cardio', label: 'Conditioning' },
];
