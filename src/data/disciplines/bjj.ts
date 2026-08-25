import type {
  BjjBelt,
  BjjPositionDefinition,
  BjjSessionType,
  BjjTakedownDefinition,
  SubmissionDefinition,
  SubmissionFamily,
  SubmissionLegality,
} from '@/types';

/**
 * Brazilian jiu-jitsu reference data.
 *
 * Two things here are worth stating plainly.
 *
 * The legality flags follow IBJJF adult rules. They exist because this is the
 * one table in the app that can get somebody hurt by omission: an app that
 * offers a white belt a heel hook with no comment is not neutral. Rules differ
 * by federation and change between seasons, so the ruleset is versioned and the
 * UI is expected to say which one it is quoting rather than presenting it as
 * the law of the land.
 *
 * The rest is a search index. People type "RNC", "mata leao" and "rear naked"
 * for the same finish, and a logger that misses on the name is a logger nobody
 * uses twice.
 */
export const BJJ_RULESET = 'IBJJF adult, 2024 ruleset' as const;

/** Legal at every adult belt, in both rulesets. */
const ALL: SubmissionLegality = { giFromBelt: null, nogiFromBelt: null, giBanned: false };

/** Brown and black only, both rulesets — the joint locks with no tap warning. */
const BROWN: SubmissionLegality = { giFromBelt: 'brown', nogiFromBelt: 'brown', giBanned: false };

/** Banned in the gi at every belt; brown and up in no-gi. */
const NOGI_BROWN: SubmissionLegality = { giFromBelt: null, nogiFromBelt: 'brown', giBanned: true };

function sub(
  id: string,
  name: string,
  family: SubmissionFamily,
  commonlyFrom: string[],
  aliases: string[] = [],
  legality: SubmissionLegality = ALL,
): SubmissionDefinition {
  return { id, name, aliases, family, commonlyFrom, legality };
}

export const SUBMISSIONS: SubmissionDefinition[] = [
  // ── Chokes and strangles ─────────────────────────────────────────────────
  sub('rear_naked_choke', 'Rear naked choke', 'choke', ['back_control'], ['rnc', 'mata leao', 'mata leão', 'strangle']),
  sub('bow_and_arrow', 'Bow and arrow choke', 'choke', ['back_control'], ['bow arrow']),
  sub('cross_collar', 'Cross collar choke', 'choke', ['mount', 'closed_guard'], ['x choke', 'cross choke']),
  sub('loop_choke', 'Loop choke', 'choke', ['closed_guard', 'front_headlock'], []),
  sub('baseball_bat_choke', 'Baseball bat choke', 'choke', ['knee_on_belly', 'side_control'], ['baseball choke']),
  sub('clock_choke', 'Clock choke', 'choke', ['turtle_top'], []),
  sub('paper_cutter', 'Paper cutter choke', 'choke', ['side_control'], ['bread cutter']),
  sub('brabo_choke', 'Brabo choke', 'choke', ['side_control'], ['lapel darce']),
  sub('ezekiel', 'Ezekiel choke', 'choke', ['mount', 'closed_guard'], ['sode guruma jime', 'sleeve choke']),
  sub('triangle', 'Triangle choke', 'choke', ['closed_guard', 'open_guard'], ['sankaku', 'sankaku jime']),
  sub('arm_triangle', 'Arm triangle', 'choke', ['mount', 'side_control'], ['head and arm', 'kata gatame']),
  sub('darce', "D'arce choke", 'choke', ['side_control', 'turtle_top'], ['darce', 'brabo']),
  sub('anaconda', 'Anaconda choke', 'choke', ['front_headlock'], ['gator roll']),
  sub('north_south_choke', 'North-south choke', 'choke', ['north_south'], []),
  sub('guillotine', 'Guillotine', 'choke', ['front_headlock', 'closed_guard'], ['high elbow guillotine', 'arm in guillotine']),
  sub('peruvian_necktie', 'Peruvian necktie', 'choke', ['front_headlock'], []),
  sub('japanese_necktie', 'Japanese necktie', 'choke', ['front_headlock'], []),
  sub('gogoplata', 'Gogoplata', 'choke', ['rubber_guard', 'closed_guard'], ['shin choke']),
  sub('buggy_choke', 'Buggy choke', 'choke', ['bottom_side'], []),
  sub('bulldog_choke', 'Bulldog choke', 'choke', ['turtle_top'], ['headlock choke']),
  sub('crucifix_choke', 'Crucifix choke', 'choke', ['crucifix'], []),

  // ── Arm locks ────────────────────────────────────────────────────────────
  sub('armbar', 'Armbar', 'arm_lock', ['mount', 'closed_guard', 'side_control'], ['juji gatame', 'straight arm bar']),
  sub('kimura', 'Kimura', 'arm_lock', ['side_control', 'closed_guard', 'half_guard'], ['reverse ude garami', 'double wrist lock']),
  sub('americana', 'Americana', 'arm_lock', ['mount', 'side_control'], ['keylock', 'ude garami', 'figure four']),
  sub('omoplata', 'Omoplata', 'arm_lock', ['closed_guard', 'spider_guard'], ['shoulder lock']),
  sub('wrist_lock', 'Wrist lock', 'arm_lock', ['closed_guard', 'mount', 'side_control'], ['mao de vaca'], {
    // No wrist locks at white belt under IBJJF, in either ruleset.
    giFromBelt: 'blue', nogiFromBelt: 'blue', giBanned: false,
  }),
  sub('bicep_slicer', 'Bicep slicer', 'arm_lock', ['closed_guard', 'back_control'], ['bicep crusher'], BROWN),

  // ── Leg locks ────────────────────────────────────────────────────────────
  sub('straight_ankle_lock', 'Straight ankle lock', 'leg_lock', ['single_leg_x', 'ashi_garami'], ['footlock', 'achilles lock']),
  sub('kneebar', 'Kneebar', 'leg_lock', ['single_leg_x', 'fifty_fifty'], [], BROWN),
  sub('toe_hold', 'Toe hold', 'leg_lock', ['fifty_fifty', 'single_leg_x'], [], BROWN),
  sub('heel_hook_inside', 'Inside heel hook', 'leg_lock', ['fifty_fifty', 'single_leg_x'], ['inside sankaku'], NOGI_BROWN),
  sub('heel_hook_outside', 'Outside heel hook', 'leg_lock', ['single_leg_x', 'ashi_garami'], [], NOGI_BROWN),
  sub('calf_slicer', 'Calf slicer', 'leg_lock', ['truck', 'half_guard'], ['calf crusher'], BROWN),
  sub('estima_lock', 'Estima lock', 'leg_lock', ['single_leg_x'], [], BROWN),

  // ── Neck cranks ──────────────────────────────────────────────────────────
  sub('can_opener', 'Can opener', 'neck_crank', ['closed_guard'], [], {
    giFromBelt: null, nogiFromBelt: 'brown', giBanned: true,
  }),
  sub('twister', 'Twister', 'neck_crank', ['truck', 'back_control'], ['guillotine spine lock'], BROWN),
];

export const SUBMISSION_FAMILY_LABELS: Record<SubmissionFamily, string> = {
  choke: 'Chokes and strangles',
  arm_lock: 'Arm locks',
  leg_lock: 'Leg locks',
  neck_crank: 'Neck cranks',
};

function pos(
  id: string,
  name: string,
  category: BjjPositionDefinition['category'],
  points: number | null = null,
  aliases: string[] = [],
): BjjPositionDefinition {
  return { id, name, aliases, category, points };
}

/**
 * Positions, with the IBJJF points that arriving there scores.
 *
 * Points are the reason this table is not just a picker list: a session where
 * you reached mount four times reads differently from one where you reached
 * knee on belly four times, and only the scoring rules know that.
 */
export const BJJ_POSITIONS: BjjPositionDefinition[] = [
  pos('standing', 'Standing', 'standing'),
  pos('front_headlock', 'Front headlock', 'standing', null, ['snap down']),
  pos('turtle_top', 'Turtle (top)', 'neutral'),

  // Guard, from the bottom.
  pos('closed_guard', 'Closed guard', 'guard_bottom', null, ['full guard']),
  pos('open_guard', 'Open guard', 'guard_bottom'),
  pos('half_guard', 'Half guard', 'guard_bottom'),
  pos('deep_half', 'Deep half guard', 'guard_bottom'),
  pos('butterfly', 'Butterfly guard', 'guard_bottom'),
  pos('de_la_riva', 'De la Riva', 'guard_bottom', null, ['dlr']),
  pos('reverse_de_la_riva', 'Reverse de la Riva', 'guard_bottom', null, ['rdlr']),
  pos('spider_guard', 'Spider guard', 'guard_bottom'),
  pos('lasso_guard', 'Lasso guard', 'guard_bottom'),
  pos('x_guard', 'X guard', 'guard_bottom'),
  pos('single_leg_x', 'Single leg X', 'guard_bottom', null, ['slx', 'ashi garami']),
  pos('ashi_garami', 'Ashi garami', 'guard_bottom', null, ['leg entanglement']),
  pos('fifty_fifty', '50/50', 'guard_bottom', null, ['50 50']),
  pos('z_guard', 'Z guard', 'guard_bottom', null, ['knee shield']),
  pos('rubber_guard', 'Rubber guard', 'guard_bottom'),
  pos('k_guard', 'K guard', 'guard_bottom'),
  pos('shin_to_shin', 'Shin to shin', 'guard_bottom'),
  pos('worm_guard', 'Worm guard', 'guard_bottom', null, ['lapel guard']),

  // Guard, from the top.
  pos('inside_guard', 'Inside their guard', 'guard_top'),
  pos('combat_base', 'Combat base', 'guard_top'),
  pos('headquarters', 'Headquarters', 'guard_top', null, ['hq']),
  pos('leg_drag', 'Leg drag', 'guard_top'),
  pos('knee_slice', 'Knee slice', 'guard_top', null, ['knee cut', 'knee slide']),
  pos('torreando', 'Torreando', 'guard_top', null, ['bullfighter pass']),

  // Dominant. These are where the points live.
  pos('mount', 'Mount', 'dominant', 4),
  pos('technical_mount', 'Technical mount', 'dominant', 4),
  pos('s_mount', 'S-mount', 'dominant', 4),
  pos('back_control', 'Back control', 'dominant', 4, ['back mount', 'hooks in']),
  pos('side_control', 'Side control', 'dominant', null, ['side mount', 'cross side']),
  pos('north_south', 'North-south', 'dominant', null),
  pos('knee_on_belly', 'Knee on belly', 'dominant', 2, ['kob']),
  pos('crucifix', 'Crucifix', 'dominant', null),
  pos('truck', 'The truck', 'dominant', null),

  // Inferior.
  pos('bottom_mount', 'Mounted', 'inferior'),
  pos('bottom_side', 'Under side control', 'inferior'),
  pos('bottom_back', 'Back taken', 'inferior'),
  pos('turtle_bottom', 'Turtle (bottom)', 'inferior'),
];

/** IBJJF scoring, kept apart from the position table because it also covers actions. */
export const BJJ_POINTS = {
  takedown: 2,
  sweep: 2,
  kneeOnBelly: 2,
  guardPass: 3,
  mount: 4,
  backControl: 4,
} as const;

function td(
  id: string,
  name: string,
  origin: BjjTakedownDefinition['origin'],
  aliases: string[] = [],
): BjjTakedownDefinition {
  return { id, name, aliases, origin };
}

export const BJJ_TAKEDOWNS: BjjTakedownDefinition[] = [
  td('double_leg', 'Double leg', 'wrestling', ['blast double']),
  td('single_leg', 'Single leg', 'wrestling'),
  td('low_single', 'Low single', 'wrestling'),
  td('high_crotch', 'High crotch', 'wrestling'),
  td('ankle_pick', 'Ankle pick', 'wrestling'),
  td('arm_drag', 'Arm drag', 'wrestling'),
  td('duck_under', 'Duck under', 'wrestling'),
  td('body_lock', 'Body lock takedown', 'wrestling'),
  td('fireman_carry', "Fireman's carry", 'wrestling', ['kata guruma']),
  td('snap_down', 'Snap down', 'wrestling'),
  td('osoto_gari', 'Osoto gari', 'judo', ['major outer reap']),
  td('ouchi_gari', 'Ouchi gari', 'judo', ['major inner reap']),
  td('kouchi_gari', 'Kouchi gari', 'judo', ['minor inner reap']),
  td('kosoto_gari', 'Kosoto gari', 'judo', ['minor outer reap']),
  td('seoi_nage', 'Seoi nage', 'judo', ['shoulder throw']),
  td('ippon_seoi_nage', 'Ippon seoi nage', 'judo'),
  td('uchi_mata', 'Uchi mata', 'judo', ['inner thigh throw']),
  td('harai_goshi', 'Harai goshi', 'judo', ['sweeping hip throw']),
  td('tai_otoshi', 'Tai otoshi', 'judo', ['body drop']),
  td('tomoe_nage', 'Tomoe nage', 'judo', ['circle throw']),
  td('sumi_gaeshi', 'Sumi gaeshi', 'judo', ['corner reversal']),
  td('tani_otoshi', 'Tani otoshi', 'judo', ['valley drop']),
  td('de_ashi_barai', 'De ashi barai', 'judo', ['foot sweep']),
  td('sasae_tsurikomi_ashi', 'Sasae tsurikomi ashi', 'judo', ['propping foot sweep']),
  td('collar_drag', 'Collar drag', 'jiu_jitsu'),
  td('guard_pull', 'Guard pull', 'jiu_jitsu'),
];

export const BJJ_BELT_ORDER: BjjBelt[] = ['white', 'blue', 'purple', 'brown', 'black'];

/**
 * IBJJF adult grading requirements.
 *
 * Minimum *time in grade* before the next belt, and the minimum age to hold one.
 * A minimum is not a schedule: nobody is owed a belt for waiting, and the app
 * says how long you have held this one, never when you are due the next.
 */
export const BJJ_BELT_REQUIREMENTS: Record<
  BjjBelt,
  { minimumAge: number; minimumMonthsBeforeNext: number | null; stripes: number }
> = {
  white: { minimumAge: 0, minimumMonthsBeforeNext: null, stripes: 4 },
  blue: { minimumAge: 16, minimumMonthsBeforeNext: 24, stripes: 4 },
  purple: { minimumAge: 16, minimumMonthsBeforeNext: 18, stripes: 4 },
  brown: { minimumAge: 18, minimumMonthsBeforeNext: 12, stripes: 4 },
  black: { minimumAge: 19, minimumMonthsBeforeNext: null, stripes: 6 },
};

export const BJJ_SESSION_TYPE_LABELS: Record<BjjSessionType, string> = {
  gi: 'Gi class',
  nogi: 'No-gi class',
  open_mat: 'Open mat',
  drilling: 'Drilling',
  competition_class: 'Competition class',
  private: 'Private lesson',
  competition: 'Competition',
};

const byId = <T extends { id: string }>(rows: T[]) => new Map(rows.map((r) => [r.id, r]));

const SUBMISSION_INDEX = byId(SUBMISSIONS);
const POSITION_INDEX = byId(BJJ_POSITIONS);

export function findSubmission(id: string): SubmissionDefinition | undefined {
  return SUBMISSION_INDEX.get(id);
}

export function findPosition(id: string): BjjPositionDefinition | undefined {
  return POSITION_INDEX.get(id);
}

/**
 * Whether a submission is allowed for a belt under the stated ruleset.
 *
 * Returns a reason rather than a bare boolean, because "not at your belt" and
 * "not in the gi at all" are different things to tell somebody.
 */
export function submissionLegality(
  submission: SubmissionDefinition,
  belt: BjjBelt,
  gi: boolean,
): { allowed: boolean; reason: string | null } {
  const { legality } = submission;

  if (gi && legality.giBanned) {
    return { allowed: false, reason: 'Not permitted in the gi at any belt' };
  }

  const from = gi ? legality.giFromBelt : legality.nogiFromBelt;
  if (from === null) return { allowed: true, reason: null };

  const held = BJJ_BELT_ORDER.indexOf(belt);
  const required = BJJ_BELT_ORDER.indexOf(from);
  if (held >= required) return { allowed: true, reason: null };

  return { allowed: false, reason: `${gi ? 'Gi' : 'No-gi'}: ${from} belt and above` };
}
