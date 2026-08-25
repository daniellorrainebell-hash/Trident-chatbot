import type {
  BoxingCombination,
  BoxingDefenceCategory,
  BoxingSessionType,
  BoxingSkillDefinition,
  BoxingStance,
  BoxingWeightClass,
  PunchDefinition,
} from '@/types';

/**
 * Boxing reference data.
 *
 * Organised around the numbering system, because that is how the sport actually
 * talks. A coach shouts "one-two-three-b" across a gym; nobody says "jab,
 * cross, lead hook, rear hook to the body" mid-round. A catalogue that only
 * knows the long names is one nobody can log from between rounds.
 *
 * Numbers are given orthodox, which is the convention. A southpaw throws the
 * same numbers off the other side — the stance is stored on the session so the
 * app never has to guess which hand a 2 came from.
 */

function punch(
  id: string,
  number: string,
  name: string,
  hand: PunchDefinition['hand'],
  target: PunchDefinition['target'],
  aliases: string[] = [],
): PunchDefinition {
  return { id, number, name, aliases, hand, target };
}

export const PUNCHES: PunchDefinition[] = [
  punch('jab', '1', 'Jab', 'lead', 'head', ['one']),
  punch('cross', '2', 'Cross', 'rear', 'head', ['two', 'straight right', 'straight left']),
  punch('lead_hook', '3', 'Lead hook', 'lead', 'head', ['three', 'left hook']),
  punch('rear_hook', '4', 'Rear hook', 'rear', 'head', ['four', 'right hook']),
  punch('lead_uppercut', '5', 'Lead uppercut', 'lead', 'head', ['five']),
  punch('rear_uppercut', '6', 'Rear uppercut', 'rear', 'head', ['six']),

  punch('jab_body', '1b', 'Jab to the body', 'lead', 'body', ['one to the body']),
  punch('cross_body', '2b', 'Cross to the body', 'rear', 'body', ['two to the body']),
  punch('lead_hook_body', '3b', 'Lead hook to the body', 'lead', 'body', ['liver shot', 'three to the body']),
  punch('rear_hook_body', '4b', 'Rear hook to the body', 'rear', 'body', ['four to the body']),
  punch('lead_uppercut_body', '5b', 'Lead uppercut to the body', 'lead', 'body', ['solar plexus']),
  punch('rear_uppercut_body', '6b', 'Rear uppercut to the body', 'rear', 'body', []),

  punch('overhand', '2h', 'Overhand', 'rear', 'head', ['overhand right', 'overhand left']),
  punch('check_hook', '3c', 'Check hook', 'lead', 'head', []),
  punch('shovel_hook', '5s', 'Shovel hook', 'lead', 'body', ['shovel']),
  punch('lead_straight', '1s', 'Lead straight', 'lead', 'head', ['long jab', 'power jab']),
  punch('pivot_hook', '3p', 'Pivot hook', 'lead', 'head', []),
];

const skill = (
  id: string,
  name: string,
  category: BoxingDefenceCategory,
  note: string,
  aliases: string[] = [],
): BoxingSkillDefinition => ({ id, name, aliases, category, note });

/**
 * Defence and movement.
 *
 * Given the same weight as the punches on purpose. Every gym has a heavy bag
 * and a queue for it, and almost nobody logs the half of the sport that keeps
 * them able to train next week.
 */
export const BOXING_SKILLS: BoxingSkillDefinition[] = [
  skill('slip', 'Slip', 'head_movement', 'Move the head off the centre line without moving the feet. The cheapest defence there is, and the first one to disappear when you are tired.', ['slipping']),
  skill('roll', 'Roll', 'head_movement', 'Under and through a hook, coming up on the other side already loaded.', ['bob and weave', 'bob']),
  skill('pull', 'Pull', 'head_movement', 'Take the head straight back off a jab. Works until somebody times you, then it is the worst habit you own.', ['lean back']),
  skill('duck', 'Duck', 'head_movement', 'Drop under a straight shot. Level change, not a bow — folding at the waist puts your head where the knee would be.', []),
  skill('sway', 'Sway', 'head_movement', 'Shift the weight back off the shot without breaking stance.', []),

  skill('high_guard', 'High guard', 'guard', 'Hands up, elbows in. Absorbs work and buys thinking time, but it wins nothing on its own.', ['earmuffs', 'peekaboo']),
  skill('shoulder_roll', 'Shoulder roll', 'guard', 'Lead shoulder high, rear hand home. Deflects the cross and leaves the rear hand cocked.', ['philly shell']),
  skill('cross_arm', 'Cross-arm guard', 'guard', 'Arms crossed high. Old-fashioned, very hard to get through, very hard to see out of.', []),

  skill('parry', 'Parry', 'hands', 'Redirect the shot rather than absorbing it. Small movement — a big parry opens you as wide as the punch would have.', []),
  skill('catch', 'Catch', 'hands', 'Take the jab on the glove. Simple, safe, and it tells you nothing about where the next one is going.', []),
  skill('block', 'Block', 'hands', 'Elbow to the body shot, glove to the head shot. Blocking is not defending — you still took it.', []),
  skill('frame', 'Frame', 'hands', 'Forearm into the chest to make space when they get inside.', []),

  skill('step_drag', 'Step and drag', 'footwork', 'Lead foot steps, rear foot follows. Stance never breaks, so you can punch at any point in it.', []),
  skill('pivot', 'Pivot', 'footwork', 'Turn off the lead foot to change the angle without giving ground.', []),
  skill('angle_out', 'Angle out', 'footwork', 'Leave the line you came in on. The difference between moving and escaping.', []),
  skill('cut_the_ring', 'Cutting the ring', 'footwork', 'Take away the space they want rather than chasing them into it.', ['ring generalship']),
  skill('in_and_out', 'In and out', 'footwork', 'Enter behind something, leave before the answer. The hardest rhythm in the sport to hold for twelve.', []),
  skill('lateral', 'Lateral movement', 'footwork', 'Circle away from the power hand. Circling into it is how short nights happen.', []),
  skill('off_the_ropes', 'Working off the ropes', 'footwork', 'Get the head off the line first, then the feet. Feet first and you walk into the next one.', []),
];

export const BOXING_COMBINATIONS: BoxingCombination[] = [
  { id: 'one_two', numbers: '1-2', name: 'One-two', punchIds: ['jab', 'cross'], note: 'The whole sport in two punches. If it is not landing, nothing behind it will.' },
  { id: 'one_one_two', numbers: '1-1-2', name: 'Double jab, cross', punchIds: ['jab', 'jab', 'cross'], note: 'The second jab is the one that gets you in range for the cross.' },
  { id: 'one_two_three', numbers: '1-2-3', name: 'One-two-hook', punchIds: ['jab', 'cross', 'lead_hook'], note: 'Turn the hips on the three or it is an arm punch.' },
  { id: 'one_two_three_two', numbers: '1-2-3-2', name: 'Four-piece', punchIds: ['jab', 'cross', 'lead_hook', 'cross'], note: 'Standard four-piece. The last two are where people stop moving their feet.' },
  { id: 'one_two_body', numbers: '1-2b', name: 'Jab, cross to the body', punchIds: ['jab', 'cross_body'], note: 'Sell the head, land the body. Requires an actual level change.' },
  { id: 'three_body_three', numbers: '3b-3', name: 'Body-head hook', punchIds: ['lead_hook_body', 'lead_hook'], note: 'Same hand, two levels. Their elbow drops and the head is open.' },
  { id: 'two_three_two', numbers: '2-3-2', name: 'Cross-hook-cross', punchIds: ['cross', 'lead_hook', 'cross'], note: 'Works best coming off a slip rather than led with.' },
  { id: 'one_six_three', numbers: '1-6-3', name: 'Jab, uppercut, hook', punchIds: ['jab', 'rear_uppercut', 'lead_hook'], note: 'For a high guard. The uppercut splits it, the hook goes round it.' },
  { id: 'five_two', numbers: '5-2', name: 'Uppercut, cross', punchIds: ['lead_uppercut', 'cross'], note: 'Inside work. Lifts the chin for the straight behind it.' },
  { id: 'one_two_five_two', numbers: '1-2-5-2', name: 'Long to short', punchIds: ['jab', 'cross', 'lead_uppercut', 'cross'], note: 'Closes distance as it goes. Finish on the rear hand or do not throw it.' },
  { id: 'three_two_three', numbers: '3-2-3', name: 'Hook-cross-hook', punchIds: ['lead_hook', 'cross', 'lead_hook'], note: 'A pressure combination. Feet have to be under you the whole way.' },
  { id: 'one_two_slip_two', numbers: '1-2, slip, 2', name: 'Two, slip, two', punchIds: ['jab', 'cross', 'cross'], note: 'Throw, expect the answer, come back over the top of it.' },
];

/**
 * Professional weight classes.
 *
 * Both units, because the pound figure is the one the sport uses and the kilo
 * figure is the one a scale in a British gym shows. Converting on the fly gives
 * numbers nobody recognises: a welterweight is 147, not 66.7.
 */
export const BOXING_WEIGHT_CLASSES: BoxingWeightClass[] = [
  { id: 'minimum', name: 'Minimumweight', limitPounds: 105, limitKg: 47.6 },
  { id: 'light_fly', name: 'Light flyweight', limitPounds: 108, limitKg: 48.9 },
  { id: 'fly', name: 'Flyweight', limitPounds: 112, limitKg: 50.8 },
  { id: 'super_fly', name: 'Super flyweight', limitPounds: 115, limitKg: 52.2 },
  { id: 'bantam', name: 'Bantamweight', limitPounds: 118, limitKg: 53.5 },
  { id: 'super_bantam', name: 'Super bantamweight', limitPounds: 122, limitKg: 55.3 },
  { id: 'feather', name: 'Featherweight', limitPounds: 126, limitKg: 57.2 },
  { id: 'super_feather', name: 'Super featherweight', limitPounds: 130, limitKg: 59.0 },
  { id: 'light', name: 'Lightweight', limitPounds: 135, limitKg: 61.2 },
  { id: 'super_light', name: 'Super lightweight', limitPounds: 140, limitKg: 63.5 },
  { id: 'welter', name: 'Welterweight', limitPounds: 147, limitKg: 66.7 },
  { id: 'super_welter', name: 'Super welterweight', limitPounds: 154, limitKg: 69.9 },
  { id: 'middle', name: 'Middleweight', limitPounds: 160, limitKg: 72.6 },
  { id: 'super_middle', name: 'Super middleweight', limitPounds: 168, limitKg: 76.2 },
  { id: 'light_heavy', name: 'Light heavyweight', limitPounds: 175, limitKg: 79.4 },
  { id: 'cruiser', name: 'Cruiserweight', limitPounds: 200, limitKg: 90.7 },
  { id: 'heavy', name: 'Heavyweight', limitPounds: Number.POSITIVE_INFINITY, limitKg: Number.POSITIVE_INFINITY },
];

export const BOXING_ROUND_FORMATS = [
  { id: 'amateur', label: 'Amateur', rounds: 3, minutes: 3, restSeconds: 60 },
  { id: 'novice', label: 'Novice / white collar', rounds: 3, minutes: 2, restSeconds: 60 },
  { id: 'pro_short', label: 'Professional, four', rounds: 4, minutes: 3, restSeconds: 60 },
  { id: 'pro_ten', label: 'Professional, ten', rounds: 10, minutes: 3, restSeconds: 60 },
  { id: 'championship', label: 'Championship', rounds: 12, minutes: 3, restSeconds: 60 },
  { id: 'gym', label: 'Gym rounds', rounds: 8, minutes: 3, restSeconds: 60 },
] as const;

export const BOXING_SESSION_TYPE_LABELS: Record<BoxingSessionType, string> = {
  pads: 'Pads',
  heavy_bag: 'Heavy bag',
  speed_bag: 'Speed bag',
  double_end_bag: 'Double-end bag',
  shadow: 'Shadow boxing',
  sparring: 'Sparring',
  body_sparring: 'Body sparring',
  technical_sparring: 'Technical sparring',
  ring_work: 'Ring work',
  skipping: 'Skipping',
  roadwork: 'Roadwork',
  strength: 'Strength and conditioning',
  bout: 'Bout',
};

export const BOXING_SKILL_CATEGORY_LABELS: Record<BoxingDefenceCategory, string> = {
  head_movement: 'Head movement',
  guard: 'Guard',
  hands: 'Hands',
  footwork: 'Footwork',
};

export const BOXING_STANCE_LABELS: Record<BoxingStance, string> = {
  orthodox: 'Orthodox',
  southpaw: 'Southpaw',
  switch: 'Switch',
};

/** Sessions where somebody is punching back, and the count therefore matters. */
export const LIVE_SESSION_TYPES: BoxingSessionType[] = [
  'sparring', 'body_sparring', 'technical_sparring', 'bout',
];

const PUNCH_INDEX = new Map(PUNCHES.map((p) => [p.id, p]));
const NUMBER_INDEX = new Map(PUNCHES.map((p) => [p.number, p]));

export function findPunch(id: string): PunchDefinition | undefined {
  return PUNCH_INDEX.get(id);
}

export function punchByNumber(number: string): PunchDefinition | undefined {
  return NUMBER_INDEX.get(number);
}

export function weightClassForKg(kg: number): BoxingWeightClass | undefined {
  return BOXING_WEIGHT_CLASSES.find((c) => kg <= c.limitKg);
}
