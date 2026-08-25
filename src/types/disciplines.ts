import type { IsoDate, IsoDateTime, Uuid } from './units';

/**
 * What kind of training a session was.
 *
 * This is not a label. It decides what the logger asks for, what counts as a
 * record, and what a summary is allowed to claim. A round on the mat is not a
 * set, and a sled push is not a rep — flattening them into one shape is how
 * multi-discipline trackers end up with numbers that mean nothing to anyone.
 */
export type Discipline = 'gym' | 'bjj' | 'mma' | 'boxing' | 'strongman';

export const DISCIPLINES: Discipline[] = ['gym', 'bjj', 'mma', 'boxing', 'strongman'];

/** How a discipline's work is counted. Drives the summary line and the record types. */
export type DisciplineUnit = 'sets' | 'mat_time' | 'rounds' | 'events';

// ── Brazilian jiu-jitsu ─────────────────────────────────────────────────────

export type BjjBelt = 'white' | 'blue' | 'purple' | 'brown' | 'black';

export type BjjSessionType =
  | 'gi'
  | 'nogi'
  | 'open_mat'
  | 'drilling'
  | 'competition_class'
  | 'private'
  | 'competition';

export type SubmissionFamily = 'choke' | 'arm_lock' | 'leg_lock' | 'neck_crank';

/**
 * Where a submission is legal under IBJJF adult rules.
 *
 * Carried because it is the one piece of reference data in here that can get
 * somebody hurt if it is wrong or absent — a white belt does not need the app
 * quietly suggesting a heel hook. `gi` and `nogi` differ, so both are stated.
 * A null means legal at every adult belt.
 */
export type SubmissionLegality = {
  giFromBelt: BjjBelt | null;
  nogiFromBelt: BjjBelt | null;
  /** Banned outright in that ruleset at every adult belt. */
  giBanned: boolean;
};

export type SubmissionDefinition = {
  id: string;
  name: string;
  aliases: string[];
  family: SubmissionFamily;
  /** Positions this is most often finished from, by position id. */
  commonlyFrom: string[];
  legality: SubmissionLegality;
};

export type BjjPositionCategory =
  | 'standing'
  | 'guard_top'
  | 'guard_bottom'
  | 'dominant'
  | 'inferior'
  | 'neutral';

export type BjjPositionDefinition = {
  id: string;
  name: string;
  aliases: string[];
  category: BjjPositionCategory;
  /** IBJJF points awarded for arriving here, where the position scores. */
  points: number | null;
};

export type BjjTakedownDefinition = {
  id: string;
  name: string;
  aliases: string[];
  origin: 'wrestling' | 'judo' | 'jiu_jitsu';
};

export type SubmissionEvent = {
  submissionId: string;
  submissionName: string;
  fromPositionId?: string;
};

export type RollIntensity = 'flow' | 'situational' | 'hard' | 'competition';

export type BjjRound = {
  id: Uuid;
  index: number;
  minutes: number;
  intensity: RollIntensity;
  partnerName?: string;
  partnerBelt?: BjjBelt;
  submissionsLanded: SubmissionEvent[];
  submissionsConceded: SubmissionEvent[];
  sweeps: number;
  sweepsConceded: number;
  passes: number;
  passesConceded: number;
  takedowns: number;
  takedownsConceded: number;
  /** Position ids reached during the round, for the position breakdown. */
  positionsReached: string[];
  notes?: string;
};

export type BjjLog = {
  kind: 'bjj';
  sessionType: BjjSessionType;
  gi: boolean;
  /** Everything from stepping on to stepping off: warm-up, drilling and rolling. */
  matMinutes: number;
  rounds: BjjRound[];
  /** Technique ids or free text drilled this session. */
  techniquesDrilled: string[];
  beltAtSession: BjjBelt;
  stripesAtSession: number;
};

// ── Mixed martial arts ──────────────────────────────────────────────────────

export type MmaSessionType =
  | 'pads'
  | 'bag'
  | 'sparring'
  | 'technical_sparring'
  | 'wrestling'
  | 'grappling'
  | 'clinch'
  | 'drilling'
  | 'strength'
  | 'roadwork'
  | 'competition';

export type MmaRange = 'striking' | 'clinch' | 'wrestling' | 'ground' | 'cage';

/**
 * How hard a round was taken.
 *
 * `hard` is the one that matters beyond curiosity: repeated hard sparring is
 * the load a fighter is worst at self-auditing, so it is stored per round and
 * counted honestly rather than folded into a single "intensity" average.
 */
export type SparIntensity = 'technical' | 'light' | 'medium' | 'hard';

export type MmaTechniqueCategory =
  | 'punch'
  | 'kick'
  | 'knee'
  | 'elbow'
  | 'clinch'
  | 'takedown'
  | 'takedown_defence'
  | 'ground'
  | 'cage';

export type MmaTechniqueDefinition = {
  id: string;
  name: string;
  aliases: string[];
  category: MmaTechniqueCategory;
  range: MmaRange;
};

export type MmaRound = {
  id: Uuid;
  index: number;
  minutes: number;
  range: MmaRange;
  intensity: SparIntensity;
  partnerName?: string;
  /** Live-round outcomes. Left at zero for pads, bag and drilling. */
  takedownsFor: number;
  takedownsAgainst: number;
  submissionsFor: number;
  submissionsAgainst: number;
  knockdownsFor: number;
  knockdownsAgainst: number;
  notes?: string;
};

export type MmaLog = {
  kind: 'mma';
  sessionType: MmaSessionType;
  rounds: MmaRound[];
  restSeconds: number;
  techniquesDrilled: string[];
};

// ── Boxing ──────────────────────────────────────────────────────────────────

export type BoxingSessionType =
  | 'pads'
  | 'heavy_bag'
  | 'speed_bag'
  | 'double_end_bag'
  | 'shadow'
  | 'sparring'
  | 'body_sparring'
  | 'technical_sparring'
  | 'ring_work'
  | 'skipping'
  | 'roadwork'
  | 'strength'
  | 'bout';

export type BoxingStance = 'orthodox' | 'southpaw' | 'switch';

export type PunchTarget = 'head' | 'body';

/**
 * A punch, in the numbering coaches actually shout.
 *
 * The numbers are the whole point of this table. A gym calls out "one-two-three"
 * and nobody says "jab, cross, lead hook" mid-round — so a catalogue that only
 * knows the long names is a catalogue nobody can log from between rounds.
 * Numbers are given for the orthodox stance, which is the convention; a southpaw
 * throws the same numbers off the other side.
 */
export type PunchDefinition = {
  id: string;
  /** 1-6 for head shots, with a b suffix for the body version. */
  number: string;
  name: string;
  aliases: string[];
  hand: 'lead' | 'rear';
  target: PunchTarget;
};

export type BoxingDefenceCategory = 'head_movement' | 'guard' | 'hands' | 'footwork';

export type BoxingSkillDefinition = {
  id: string;
  name: string;
  aliases: string[];
  category: BoxingDefenceCategory;
  note: string;
};

export type BoxingCombination = {
  id: string;
  /** The numbers as called, e.g. "1-2-3b". */
  numbers: string;
  name: string;
  punchIds: string[];
  note: string;
};

/**
 * A weight class, in both units.
 *
 * Boxing is the one sport in the app where the class *is* an identity — people
 * describe themselves as a welterweight — so the limit is carried in pounds and
 * kilograms rather than converted on the fly and rounded into something nobody
 * recognises.
 */
export type BoxingWeightClass = {
  id: string;
  name: string;
  limitPounds: number;
  limitKg: number;
};

export type BoxingRound = {
  id: Uuid;
  index: number;
  minutes: number;
  intensity: SparIntensity;
  partnerName?: string;
  /**
   * Punch counts, where somebody was counting. Optional throughout: most
   * sessions are not scored, and a zero would be a lie about a round nobody
   * watched with a clicker.
   */
  punchesThrown: number | null;
  punchesLanded: number | null;
  bodyPunchesThrown: number | null;
  knockdownsFor: number;
  knockdownsAgainst: number;
  notes?: string;
};

export type BoxingLog = {
  kind: 'boxing';
  sessionType: BoxingSessionType;
  stance: BoxingStance;
  rounds: BoxingRound[];
  restSeconds: number;
  /** Punch ids and combinations worked this session. */
  worked: string[];
  opponentName?: string;
  weightClassId?: string;
};

// ── Strongman ───────────────────────────────────────────────────────────────

/**
 * How an event is scored.
 *
 * Strongman's awkwardness for a tracker is that the same implement is a
 * different event depending on the scoring. A yoke can be a fastest-20m, a
 * max-distance-in-60s or a heaviest-carry, and those three numbers are not
 * comparable to each other — so the style travels with every attempt and every
 * record, and a personal best is always a best *at a style*.
 */
export type StrongmanEventStyle =
  | 'max_load'
  | 'reps_in_time'
  | 'time_for_reps'
  | 'distance_in_time'
  | 'time_for_distance'
  | 'hold_time'
  | 'medley';

export type StrongmanEventCategory =
  | 'overhead'
  | 'deadlift'
  | 'squat'
  | 'carry'
  | 'load'
  | 'drag'
  | 'grip'
  | 'medley';

export type StrongmanEventDefinition = {
  id: string;
  name: string;
  aliases: string[];
  category: StrongmanEventCategory;
  /** The ways this event is actually run. A best is only ever a best at one of them. */
  styles: StrongmanEventStyle[];
  implement: string;
  typicalDistanceMetres: number | null;
  typicalTimeCapSeconds: number | null;
  /** What the load figure refers to, since it is rarely just "the weight". */
  loadNote: string;
  coachingNote: string;
};

export type StrongmanSessionType =
  | 'event_day'
  | 'max_effort'
  | 'medley'
  | 'competition'
  | 'accessory';

export type StrongmanAttempt = {
  id: Uuid;
  eventId: string;
  eventName: string;
  style: StrongmanEventStyle;
  loadKg: number | null;
  reps: number | null;
  distanceMetres: number | null;
  seconds: number | null;
  /**
   * Whether it counted.
   *
   * A missed attempt is data here in a way a missed gym set is not: opener,
   * second, third is the shape of the sport, and a log that only kept the
   * makes would hide the fact that you have failed 150 kg three weeks running.
   */
  successful: boolean;
  notes?: string;
};

export type StrongmanLog = {
  kind: 'strongman';
  sessionType: StrongmanSessionType;
  attempts: StrongmanAttempt[];
  competitionName?: string;
  weightClass?: string;
};

// ── The union carried on a session ──────────────────────────────────────────

/**
 * A gym session carries no log: its record is the exercise and set list that
 * already existed. The other three each need their own shape.
 */
export type DisciplineLog = BjjLog | MmaLog | BoxingLog | StrongmanLog;

export type DisciplineRecordType =
  // Mat
  | 'most_mat_minutes'
  | 'most_submissions'
  | 'first_submission'
  | 'longest_roll'
  // Rounds
  | 'most_rounds'
  | 'most_round_minutes'
  // Events
  | 'heaviest_load'
  | 'most_reps_in_time'
  | 'furthest_in_time'
  | 'fastest_over_distance'
  | 'longest_hold';

export type DisciplineRecord = {
  id: Uuid;
  userId: Uuid;
  discipline: Discipline;
  type: DisciplineRecordType;
  /** Station id, submission id, or similar — what the record is *of*. */
  subjectId: string | null;
  subjectName: string;
  /** Minutes, seconds or a count, depending on the type. */
  value: number;
  previousValue: number | null;
  achievedAt: IsoDateTime;
  workoutId: Uuid;
};
