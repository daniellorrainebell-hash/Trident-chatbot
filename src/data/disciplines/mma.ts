import type {
  MmaRange,
  MmaSessionType,
  MmaTechniqueCategory,
  MmaTechniqueDefinition,
  SparIntensity,
} from '@/types';

/**
 * Mixed martial arts reference data.
 *
 * The organising idea is *range*, not style. A fighter does not think "now I am
 * doing the boxing part" — they think about the distance they are in and what
 * is available there. Logging by range is also the only way the summary can say
 * something useful, because "four rounds" tells you nothing if three of them
 * were wall wrestling.
 */

function tech(
  id: string,
  name: string,
  category: MmaTechniqueCategory,
  range: MmaRange,
  aliases: string[] = [],
): MmaTechniqueDefinition {
  return { id, name, aliases, category, range };
}

export const MMA_TECHNIQUES: MmaTechniqueDefinition[] = [
  // ── Punches ──────────────────────────────────────────────────────────────
  tech('jab', 'Jab', 'punch', 'striking'),
  tech('cross', 'Cross', 'punch', 'striking', ['straight right', 'straight left']),
  tech('lead_hook', 'Lead hook', 'punch', 'striking'),
  tech('rear_hook', 'Rear hook', 'punch', 'striking'),
  tech('lead_uppercut', 'Lead uppercut', 'punch', 'striking'),
  tech('rear_uppercut', 'Rear uppercut', 'punch', 'striking'),
  tech('overhand', 'Overhand', 'punch', 'striking'),
  tech('body_hook', 'Body hook', 'punch', 'striking', ['liver shot']),
  tech('superman_punch', 'Superman punch', 'punch', 'striking'),
  tech('spinning_backfist', 'Spinning backfist', 'punch', 'striking'),
  tech('check_hook', 'Check hook', 'punch', 'striking'),

  // ── Kicks ────────────────────────────────────────────────────────────────
  tech('low_kick', 'Low kick', 'kick', 'striking', ['leg kick', 'calf kick']),
  tech('body_kick', 'Body kick', 'kick', 'striking', ['round kick']),
  tech('head_kick', 'Head kick', 'kick', 'striking', ['high kick']),
  tech('teep', 'Teep', 'kick', 'striking', ['push kick', 'front kick']),
  tech('oblique_kick', 'Oblique kick', 'kick', 'striking'),
  tech('question_mark_kick', 'Question mark kick', 'kick', 'striking'),
  tech('spinning_back_kick', 'Spinning back kick', 'kick', 'striking'),
  tech('wheel_kick', 'Wheel kick', 'kick', 'striking', ['spinning hook kick']),
  tech('switch_kick', 'Switch kick', 'kick', 'striking'),

  // ── Knees and elbows ─────────────────────────────────────────────────────
  tech('straight_knee', 'Straight knee', 'knee', 'clinch'),
  tech('curved_knee', 'Curved knee', 'knee', 'clinch'),
  tech('flying_knee', 'Flying knee', 'knee', 'striking'),
  tech('horizontal_elbow', 'Horizontal elbow', 'elbow', 'clinch'),
  tech('downward_elbow', 'Downward elbow', 'elbow', 'ground', ['12-6 elbow']),
  tech('spinning_elbow', 'Spinning elbow', 'elbow', 'striking'),
  tech('upward_elbow', 'Upward elbow', 'elbow', 'clinch'),

  // ── Clinch ───────────────────────────────────────────────────────────────
  tech('thai_plum', 'Thai plum', 'clinch', 'clinch', ['double collar tie']),
  tech('underhooks', 'Underhooks', 'clinch', 'clinch'),
  tech('over_under', 'Over-under', 'clinch', 'clinch'),
  tech('body_lock_clinch', 'Body lock', 'clinch', 'clinch'),
  tech('collar_tie', 'Collar tie', 'clinch', 'clinch'),
  tech('pummelling', 'Pummelling', 'clinch', 'clinch', ['pummeling', 'swimming']),
  tech('dirty_boxing', 'Dirty boxing', 'clinch', 'clinch'),

  // ── Takedowns ────────────────────────────────────────────────────────────
  tech('double_leg', 'Double leg', 'takedown', 'wrestling'),
  tech('single_leg', 'Single leg', 'takedown', 'wrestling'),
  tech('high_crotch', 'High crotch', 'takedown', 'wrestling'),
  tech('body_lock_takedown', 'Body lock takedown', 'takedown', 'wrestling'),
  tech('trip', 'Trip', 'takedown', 'clinch', ['inside trip', 'outside trip']),
  tech('throw', 'Throw', 'takedown', 'clinch', ['hip toss', 'suplex']),
  tech('cage_takedown', 'Takedown on the cage', 'takedown', 'cage'),

  // ── Takedown defence ─────────────────────────────────────────────────────
  tech('sprawl', 'Sprawl', 'takedown_defence', 'wrestling'),
  tech('whizzer', 'Whizzer', 'takedown_defence', 'wrestling', ['overhook']),
  tech('underhook_defence', 'Underhook and pummel out', 'takedown_defence', 'clinch'),
  tech('wall_walk', 'Wall walk', 'takedown_defence', 'cage', ['cage get-up']),
  tech('technical_standup', 'Technical stand-up', 'takedown_defence', 'ground'),
  tech('kimura_trap', 'Kimura trap', 'takedown_defence', 'ground'),

  // ── Ground ───────────────────────────────────────────────────────────────
  tech('ground_and_pound', 'Ground and pound', 'ground', 'ground'),
  tech('postured_guard_passing', 'Guard passing', 'ground', 'ground'),
  tech('back_take', 'Back take', 'ground', 'ground'),
  tech('submission_chain', 'Submission chain', 'ground', 'ground'),
  tech('guard_retention', 'Guard retention', 'ground', 'ground'),
  tech('getting_up', 'Getting up', 'ground', 'ground', ['stand up in base']),

  // ── Cage ─────────────────────────────────────────────────────────────────
  tech('cage_cutting', 'Cage cutting', 'cage', 'cage', ['ring generalship']),
  tech('circling_off', 'Circling off the cage', 'cage', 'cage'),
  tech('cage_pin', 'Cage pin', 'cage', 'cage'),
];

export const MMA_RANGE_LABELS: Record<MmaRange, string> = {
  striking: 'Striking',
  clinch: 'Clinch',
  wrestling: 'Wrestling',
  ground: 'Ground',
  cage: 'Cage',
};

export const MMA_SESSION_TYPE_LABELS: Record<MmaSessionType, string> = {
  pads: 'Pads',
  bag: 'Bag work',
  sparring: 'Sparring',
  technical_sparring: 'Technical sparring',
  wrestling: 'Wrestling',
  grappling: 'Grappling',
  clinch: 'Clinch',
  drilling: 'Drilling',
  strength: 'Strength and conditioning',
  roadwork: 'Roadwork',
  competition: 'Fight',
};

export const SPAR_INTENSITY_LABELS: Record<SparIntensity, string> = {
  technical: 'Technical',
  light: 'Light',
  medium: 'Medium',
  hard: 'Hard',
};

/**
 * Standard round formats, so a logger can offer them rather than asking a
 * fighter to type 5 and 60 every time.
 */
export const MMA_ROUND_FORMATS = [
  { id: 'amateur', label: 'Amateur', rounds: 3, minutes: 3, restSeconds: 60 },
  { id: 'pro', label: 'Professional', rounds: 3, minutes: 5, restSeconds: 60 },
  { id: 'championship', label: 'Championship', rounds: 5, minutes: 5, restSeconds: 60 },
  { id: 'gym', label: 'Gym rounds', rounds: 6, minutes: 3, restSeconds: 60 },
] as const;

/**
 * Hard sparring, counted over a rolling window.
 *
 * This is reported, never prescribed. The app has no business telling anyone
 * how much contact their head can take — but a fighter who genuinely cannot say
 * how many hard rounds they did this month is the person most likely to do too
 * many, and a plain count is the honest half of that problem the app can solve.
 * Anything past the count is a conversation with a coach.
 */
export const HARD_SPARRING_WINDOW_DAYS = 28;

const TECHNIQUE_INDEX = new Map(MMA_TECHNIQUES.map((t) => [t.id, t]));

export function findTechnique(id: string): MmaTechniqueDefinition | undefined {
  return TECHNIQUE_INDEX.get(id);
}

export function techniquesForRange(range: MmaRange): MmaTechniqueDefinition[] {
  return MMA_TECHNIQUES.filter((t) => t.range === range);
}
