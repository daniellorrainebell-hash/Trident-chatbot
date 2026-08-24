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
