import type {
  HyroxCategory,
  HyroxDivision,
  HyroxSessionFormat,
  HyroxStationDefinition,
  HyroxStationId,
} from '@/types';

/**
 * HYROX reference data.
 *
 * The race is fixed and identical everywhere, which is the whole point of it:
 * eight 1 km runs, each followed by one of eight stations, always in the same
 * order. That makes it the one endurance format where a split from Manchester
 * and a split from Hamburg mean the same thing — so the app can compare them,
 * and the station table below has to be right for any of it to hold up.
 *
 * Loads are quoted for the current season and are versioned for exactly that
 * reason: they have changed between seasons before and will again. Anything
 * shown to a user from this table names the season it came from rather than
 * presenting itself as permanent. Check the official rulebook before a race.
 */
export const HYROX_STANDARDS_VERSION = '2024/25 season' as const;

export const HYROX_RUN_COUNT = 8;
export const HYROX_RUN_METRES = 1000;

/**
 * The eight stations, in race order.
 *
 * `loadNote` exists because the number means something different at almost
 * every station — a sled figure is the total weight being moved, a farmers
 * carry figure is per hand, and a wall ball figure is the ball alone with the
 * target height carried separately. Presenting them as one column of
 * kilograms would be quietly wrong four times out of eight.
 */
export const HYROX_STATIONS: HyroxStationDefinition[] = [
  {
    id: 'ski_erg',
    order: 1,
    name: 'SkiErg',
    measure: 'metres',
    amount: 1000,
    load: { openMen: null, openWomen: null, proMen: null, proWomen: null },
    loadNote: 'No external load. Damper and drag factor are yours to set.',
    coachingNote: 'Comes first, off a fresh 1 km run. The commonest mistake in the whole race is going out too hard here and paying for it at the sled.',
  },
  {
    id: 'sled_push',
    order: 2,
    name: 'Sled Push',
    measure: 'metres',
    amount: 50,
    load: { openMen: 152, openWomen: 102, proMen: 202, proWomen: 152 },
    loadNote: 'Total sled weight including the sled itself. Four lengths of 12.5 m.',
    coachingNote: 'Low body angle, short steps, arms locked. The station that decides more races than any other.',
  },
  {
    id: 'sled_pull',
    order: 3,
    name: 'Sled Pull',
    measure: 'metres',
    amount: 50,
    load: { openMen: 103, openWomen: 78, proMen: 153, proWomen: 103 },
    loadNote: 'Total sled weight including the sled. Four lengths of 12.5 m, hand over hand from within the box.',
    coachingNote: 'Sit back into the rope and use your legs. Pulling with arms alone empties the grip you still need for the farmers carry.',
  },
  {
    id: 'burpee_broad_jump',
    order: 4,
    name: 'Burpee Broad Jumps',
    measure: 'metres',
    amount: 80,
    load: { openMen: null, openWomen: null, proMen: null, proWomen: null },
    loadNote: 'Bodyweight. Chest and thighs to the floor, jump from and land on two feet.',
    coachingNote: 'The one people blow up on. Small consistent jumps beat big ones, and the heart rate never comes back if you sprint it.',
  },
  {
    id: 'row',
    order: 5,
    name: 'Rowing',
    measure: 'metres',
    amount: 1000,
    load: { openMen: null, openWomen: null, proMen: null, proWomen: null },
    loadNote: 'No external load. Halfway point of the race.',
    coachingNote: 'A chance to bring the heart rate down without giving away time. Long, strong, unhurried.',
  },
  {
    id: 'farmers_carry',
    order: 6,
    name: 'Farmers Carry',
    measure: 'metres',
    amount: 200,
    load: { openMen: 24, openWomen: 16, proMen: 32, proWomen: 24 },
    loadNote: 'Per hand — two kettlebells. Any drop must be picked up where it fell.',
    coachingNote: 'Grip is the limiter and it was already taxed by the sled pull. Go unbroken if you can, and set down deliberately rather than dropping.',
  },
  {
    id: 'sandbag_lunges',
    order: 7,
    name: 'Sandbag Lunges',
    measure: 'metres',
    amount: 100,
    load: { openMen: 20, openWomen: 10, proMen: 30, proWomen: 20 },
    loadNote: 'Sandbag across the shoulders. Trailing knee must touch the floor each rep.',
    coachingNote: 'Legs are gone by now. Shorter lunges, upright torso, and count in blocks rather than watching the line.',
  },
  {
    id: 'wall_balls',
    order: 8,
    name: 'Wall Balls',
    measure: 'reps',
    amount: 100,
    load: { openMen: 6, openWomen: 4, proMen: 9, proWomen: 6 },
    loadNote: 'Ball weight. Target 3.0 m for men, 2.7 m for women. Hip crease below the knee, ball hits the target.',
    coachingNote: 'The last station and the one with no-reps. Break early into small sets rather than failing a big one — a no-rep at 90 costs more than a breath at 40.',
  },
];

export const HYROX_DIVISION_LABELS: Record<HyroxDivision, string> = {
  open: 'Open',
  pro: 'Pro',
  doubles: 'Doubles',
  relay: 'Relay',
};

export const HYROX_CATEGORY_LABELS: Record<HyroxCategory, string> = {
  mens: "Men's",
  womens: "Women's",
  mixed: 'Mixed',
};

export const HYROX_FORMAT_LABELS: Record<HyroxSessionFormat, string> = {
  race: 'Race',
  full_simulation: 'Full simulation',
  half_simulation: 'Half simulation',
  station_work: 'Station work',
  compromised_running: 'Compromised running',
  running: 'Running',
};

const STATION_INDEX = new Map(HYROX_STATIONS.map((s) => [s.id, s]));

export function findStation(id: HyroxStationId): HyroxStationDefinition | undefined {
  return STATION_INDEX.get(id);
}

/**
 * The load for a station in a given division and category.
 *
 * Doubles and relay run Open loads, so they resolve to the same figures rather
 * than being a gap in the table. Mixed has no single load and returns null —
 * the app should ask which athlete rather than guess.
 */
export function loadFor(
  station: HyroxStationDefinition,
  division: HyroxDivision,
  category: HyroxCategory,
): number | null {
  if (category === 'mixed') return null;
  const pro = division === 'pro';
  const men = category === 'mens';
  if (pro) return men ? station.load.proMen : station.load.proWomen;
  return men ? station.load.openMen : station.load.openWomen;
}

/**
 * Reference finishing times, for reading a result rather than setting a target.
 *
 * These are rough bands from published race data, not thresholds anyone has to
 * hit. They exist so a first-timer seeing 1:38 has some idea what they are
 * looking at.
 */
export const HYROX_TIME_BANDS: Array<{
  label: string;
  mensSeconds: [number, number];
  womensSeconds: [number, number];
}> = [
  { label: 'Elite', mensSeconds: [0, 3900], womensSeconds: [0, 4500] },
  { label: 'Competitive', mensSeconds: [3900, 4800], womensSeconds: [4500, 5400] },
  { label: 'Strong', mensSeconds: [4800, 5700], womensSeconds: [5400, 6300] },
  { label: 'Solid', mensSeconds: [5700, 6900], womensSeconds: [6300, 7500] },
  { label: 'Finisher', mensSeconds: [6900, Number.MAX_SAFE_INTEGER], womensSeconds: [7500, Number.MAX_SAFE_INTEGER] },
];

export function bandForFinish(totalSeconds: number, category: HyroxCategory): string | null {
  if (category === 'mixed') return null;
  const key = category === 'mens' ? 'mensSeconds' : 'womensSeconds';
  const band = HYROX_TIME_BANDS.find((b) => {
    const [from, to] = b[key];
    return totalSeconds >= from && totalSeconds < to;
  });
  return band?.label ?? null;
}
