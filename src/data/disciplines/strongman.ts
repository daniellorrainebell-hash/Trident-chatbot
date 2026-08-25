import type {
  StrongmanEventCategory,
  StrongmanEventDefinition,
  StrongmanEventStyle,
  StrongmanSessionType,
} from '@/types';

/**
 * Strongman reference data.
 *
 * One thing to be honest about up front: strongman has no single governing body
 * setting universal loads. They move between federations, between shows, and
 * with whatever implements the venue owns. So nothing here is presented as a
 * standard — the figures are indicative competition loading for an open
 * amateur, offered so a number on a screen has some context, and the app says
 * so rather than implying an authority that does not exist.
 *
 * The structural problem strongman poses a tracker is that the implement is not
 * the event. A yoke can be a fastest-20 m, a max-distance-in-60 s or a
 * heaviest-carry, and those three numbers cannot be compared. So the *style*
 * travels with every attempt, and a best is only ever a best at one style.
 */
export const STRONGMAN_LOADING_NOTE =
  'Indicative open amateur loading. Strongman has no universal standard — loads vary by federation, show and whatever the venue owns.';

function event(
  id: string,
  name: string,
  category: StrongmanEventCategory,
  styles: StrongmanEventStyle[],
  implement: string,
  loadNote: string,
  coachingNote: string,
  options: { aliases?: string[]; distance?: number | null; timeCap?: number | null } = {},
): StrongmanEventDefinition {
  return {
    id,
    name,
    aliases: options.aliases ?? [],
    category,
    styles,
    implement,
    typicalDistanceMetres: options.distance ?? null,
    typicalTimeCapSeconds: options.timeCap ?? null,
    loadNote,
    coachingNote,
  };
}

export const STRONGMAN_EVENTS: StrongmanEventDefinition[] = [
  // ── Overhead ─────────────────────────────────────────────────────────────
  event('log_press', 'Log press', 'overhead', ['max_load', 'reps_in_time'], 'Log',
    'Total log weight. Clean each rep from the floor unless the show says from the rack.',
    'The log rolls, so the clean is half the event. Get it high on the chest and hold the elbows up — a low rack turns a press into a grind you will not win.',
    { aliases: ['log lift', 'log clean and press'], timeCap: 60 }),
  event('axle_press', 'Axle press', 'overhead', ['max_load', 'reps_in_time'], 'Axle',
    'Total axle weight. Thick bar, so continental cleans are usually allowed.',
    'Grip decides this one before the shoulders do. Learn the continental clean — trying to power clean an axle you cannot hold is how good pressers lose to worse ones.',
    { aliases: ['fat bar press'], timeCap: 60 }),
  event('circus_dumbbell', 'Circus dumbbell', 'overhead', ['max_load', 'reps_in_time'], 'Circus dumbbell',
    'Total dumbbell weight, pressed one arm at a time.',
    'A balance event wearing a strength event’s clothes. The lockout is won with the wrist and the hips, not the shoulder.',
    { aliases: ['circus db', 'one arm dumbbell'], timeCap: 60 }),
  event('viking_press', 'Viking press', 'overhead', ['reps_in_time'], 'Viking press machine',
    'Weight loaded on the arms, not what you feel — leverage makes the effective load lighter than the plates suggest.',
    'A pure conditioning event. Set a rhythm you can hold for the whole cap rather than sprinting the first fifteen.',
    { timeCap: 75 }),
  event('block_press', 'Block press', 'overhead', ['max_load'], 'Loading block',
    'Total block weight, taken from a stand or the floor.',
    'Awkward on purpose. The hands are wide and low, so the press starts from a worse position than a barbell ever does.',
    {}),

  // ── Deadlift ─────────────────────────────────────────────────────────────
  event('deadlift_max', 'Deadlift', 'deadlift', ['max_load', 'reps_in_time'], 'Bar or elephant bar',
    'Bar weight. An elephant bar bends and changes the pull height, so the same number is a different lift.',
    'Whip on a deadlift bar is free range of motion if you know how to use it and a missed lift if you do not. Pull the slack out and go when the plates move.',
    { aliases: ['elephant bar deadlift'], timeCap: 60 }),
  event('axle_deadlift', 'Axle deadlift', 'deadlift', ['max_load', 'reps_in_time'], 'Axle',
    'Axle weight. No whip and a thick bar, so it will read heavier than a barbell at the same number.',
    'Straps if the show allows them, hook grip if not. The bar does not bend, so there is no free height — every kilo is real.',
    { timeCap: 60 }),
  event('silver_dollar', 'Silver dollar deadlift', 'deadlift', ['max_load', 'reps_in_time'], 'Bar on 18-inch blocks',
    'Bar weight from an 18 in pick height.',
    'Short range, big numbers, brutal on the back. The bar starts above the knee, so it is all lockout and grip.',
    { aliases: ['18 inch deadlift'], timeCap: 60 }),
  event('car_deadlift', 'Car deadlift', 'deadlift', ['reps_in_time'], 'Car deadlift frame',
    'Frame plus vehicle. The load at the handles is far lighter than the vehicle weight because of the pivot.',
    'A leverage lift. Stay tall, drive the hips through, and do not chase the first rep so hard that you cannot cycle.',
    { timeCap: 60 }),

  // ── Squat ────────────────────────────────────────────────────────────────
  event('frame_squat', 'Frame squat', 'squat', ['max_load', 'reps_in_time'], 'Squat frame',
    'Total frame weight, loaded low so the bar path sits behind a barbell squat.',
    'Sits between a squat and a good morning. Brace against the frame rather than under it.',
    { timeCap: 60 }),
  event('yoke_squat', 'Yoke squat', 'squat', ['max_load', 'reps_in_time'], 'Yoke',
    'Total yoke weight across the back.',
    'The yoke sits high and wide, so it punishes a lazy upper back long before the legs give up.',
    { timeCap: 60 }),

  // ── Carries ──────────────────────────────────────────────────────────────
  event('yoke_walk', 'Yoke walk', 'carry', ['time_for_distance', 'distance_in_time', 'max_load'], 'Yoke',
    'Total yoke weight, carried across the back.',
    'Short, fast, choppy steps. Long strides let the yoke oscillate, and once it is swinging you are carrying it and fighting it.',
    { aliases: ['yoke carry'], distance: 20, timeCap: 60 }),
  event('farmers_walk', 'Farmers walk', 'carry', ['time_for_distance', 'distance_in_time', 'max_load'], 'Farmers handles',
    'Per hand — two handles. A 120 kg farmers is 120 kg in each hand.',
    'Pick up tall, not with a rounded back, and get moving before the grip starts talking. Turns cost more time than the walking does.',
    { aliases: ['farmers carry'], distance: 20, timeCap: 60 }),
  event('frame_carry', 'Frame carry', 'carry', ['time_for_distance', 'distance_in_time'], 'Carry frame',
    'Total frame weight. Handles are fixed, so it steers like a shopping trolley with a bad wheel.',
    'Somewhere between a yoke and farmers. Keep it level — a frame that tips takes the load onto one side and stops you dead.',
    { aliases: ['duck walk'], distance: 20, timeCap: 60 }),
  event('sandbag_carry', 'Sandbag carry', 'carry', ['time_for_distance', 'distance_in_time'], 'Sandbag',
    'Bag weight, carried at the chest.',
    'The bag crushes your breathing before it beats your legs. Get it high, cinch the arms, and breathe shallow rather than not at all.',
    { distance: 20, timeCap: 60 }),
  event('husafell', 'Husafell carry', 'carry', ['distance_in_time', 'time_for_distance'], 'Husafell stone or board',
    'Stone or board weight, carried against the chest.',
    'Goes until you drop it, which means pacing is a decision you make before you start, not halfway down the floor.',
    { aliases: ['husafell stone'], timeCap: 90 }),
  event('keg_carry', 'Keg carry', 'carry', ['time_for_distance', 'distance_in_time'], 'Keg',
    'Keg weight. The water inside moves, so the load shifts as you walk.',
    'A live load. Squeeze it into the chest and accept that it will fight you the whole way.',
    { distance: 20, timeCap: 60 }),
  event('conans_wheel', "Conan's wheel", 'carry', ['distance_in_time'], "Conan's wheel",
    'Weight at the end of the arm. Measured in metres travelled or degrees turned.',
    'Lean back into it and walk a circle. Everyone goes too fast on the first lap.',
    { timeCap: 90 }),

  // ── Loading ──────────────────────────────────────────────────────────────
  event('atlas_stones', 'Atlas stones', 'load', ['time_for_reps', 'max_load'], 'Atlas stones',
    'Stone weight. A series runs ascending, each to a higher platform.',
    'Tacky, lap, extend. The lap is the event — a stone that never sits on the hips never goes over the bar.',
    { aliases: ['stones', 'stone over bar'], timeCap: 60 }),
  event('stone_to_shoulder', 'Stone to shoulder', 'load', ['reps_in_time', 'max_load'], 'Atlas stone',
    'Stone weight, taken to the shoulder rather than over a bar.',
    'Different lap position from stone-over-bar and a different finish. Train it as its own event.',
    { timeCap: 60 }),
  event('sandbag_load', 'Sandbag loading', 'load', ['time_for_reps'], 'Sandbags',
    'Bag weights, usually ascending across a series of bags to a platform.',
    'A conditioning event dressed as a strength one. The last bag is won by whoever is still breathing.',
    { timeCap: 75 }),
  event('keg_toss', 'Keg toss', 'load', ['time_for_reps', 'max_load'], 'Kegs',
    'Keg weight, thrown over a bar at height.',
    'All hips and timing. Height comes from the throw, not from how hard you pull.',
    { timeCap: 60 }),

  // ── Drags and pulls ──────────────────────────────────────────────────────
  event('truck_pull', 'Truck pull', 'drag', ['time_for_distance', 'distance_in_time'], 'Harness and rope',
    'Vehicle weight. The rolling load is a fraction of it once it is moving — the start is the event.',
    'Get it rolling and it almost pulls itself. Everything is in the first three steps, so drop your hips and drive.',
    { aliases: ['vehicle pull'], distance: 20, timeCap: 90 }),
  event('sled_drag', 'Sled drag', 'drag', ['time_for_distance', 'distance_in_time'], 'Sled and harness',
    'Total sled weight including the sled.',
    'Low angle, short steps, constant tension. Letting the rope go slack means starting the drag again from a standstill.',
    { distance: 20, timeCap: 60 }),
  event('tyre_flip', 'Tyre flip', 'drag', ['time_for_reps', 'distance_in_time'], 'Tyre',
    'Tyre weight. A tall tyre flips easier than a short one at the same weight.',
    'Chest against the rubber, hips low, drive through and switch the hands. Deadlifting it is how backs get hurt.',
    { aliases: ['tire flip'], timeCap: 60 }),

  // ── Grip and holds ───────────────────────────────────────────────────────
  event('hercules_hold', 'Hercules hold', 'grip', ['hold_time'], 'Hercules pillars',
    'Weight per hand, held out to the sides until you let go.',
    'A pain tolerance event. Set the shoulders before they take the load, and pick a number in your head to get past.',
    { timeCap: 120 }),
  event('crucifix_hold', 'Crucifix hold', 'grip', ['hold_time'], 'Dumbbells or plates',
    'Weight per hand, held out straight at shoulder height.',
    'Shoulders fail first, not grip. Arms locked and level — the moment they drop the clock stops.',
    { timeCap: 90 }),
  event('grip_medley', 'Grip medley', 'grip', ['medley', 'hold_time'], 'Mixed implements',
    'Varies by show: thick bar, blockweights, pinch grip, holds.',
    'Order matters more than strength. Do the pinch work before the thick bar and you will finish the medley.',
    { timeCap: 120 }),

  // ── Medley ───────────────────────────────────────────────────────────────
  event('moving_medley', 'Moving medley', 'medley', ['medley'], 'Mixed implements',
    'A run of carries back to back — yoke, farmers, frame, sandbag in some order.',
    'The transitions are the event. Know exactly where the next implement is before you set the last one down.',
    { distance: 20, timeCap: 90 }),
  event('overhead_medley', 'Overhead medley', 'medley', ['medley'], 'Log, axle, dumbbell, block',
    'Ascending implements, each pressed once, lightest to heaviest.',
    'Fastest at the light end, patient at the heavy end. Most people blow the medley by rushing the implement they were always going to miss.',
    { timeCap: 90 }),
];

export const STRONGMAN_CATEGORY_LABELS: Record<StrongmanEventCategory, string> = {
  overhead: 'Overhead',
  deadlift: 'Deadlift',
  squat: 'Squat',
  carry: 'Carries',
  load: 'Loading',
  drag: 'Drags and pulls',
  grip: 'Grip and holds',
  medley: 'Medley',
};

export const STRONGMAN_STYLE_LABELS: Record<StrongmanEventStyle, string> = {
  max_load: 'Max load',
  reps_in_time: 'Reps in time',
  time_for_reps: 'Time for reps',
  distance_in_time: 'Distance in time',
  time_for_distance: 'Time for distance',
  hold_time: 'Hold for time',
  medley: 'Medley',
};

export const STRONGMAN_SESSION_TYPE_LABELS: Record<StrongmanSessionType, string> = {
  event_day: 'Event day',
  max_effort: 'Max effort',
  medley: 'Medley',
  competition: 'Competition',
  accessory: 'Accessory',
};

/**
 * Weight classes as most amateur federations run them.
 *
 * Listed to give a result somewhere to sit, not because any two federations
 * agree on the boundaries — they do not, and the app should say which show a
 * class came from rather than treat these as the classes.
 */
export const STRONGMAN_WEIGHT_CLASSES = {
  mens: ['u80', 'u90', 'u105', 'u120', 'open'],
  womens: ['u64', 'u73', 'u82', 'open'],
} as const;

const EVENT_INDEX = new Map(STRONGMAN_EVENTS.map((e) => [e.id, e]));

export function findEvent(id: string): StrongmanEventDefinition | undefined {
  return EVENT_INDEX.get(id);
}

export function eventsInCategory(category: StrongmanEventCategory): StrongmanEventDefinition[] {
  return STRONGMAN_EVENTS.filter((e) => e.category === category);
}

/** Whether a bigger number is a better one, which depends entirely on the style. */
export function higherIsBetter(style: StrongmanEventStyle): boolean {
  return style === 'max_load' || style === 'reps_in_time' || style === 'distance_in_time' || style === 'hold_time';
}
