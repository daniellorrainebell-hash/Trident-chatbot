import type { IsoDate, IsoDateTime, Uuid } from './units';

/**
 * What kind of training a session was.
 *
 * This is not a label. It decides what the logger asks for, what counts as a
 * record, and what a summary is allowed to claim. A round on the mat is not a
 * set, and a sled push is not a rep — flattening them into one shape is how
 * multi-discipline trackers end up with numbers that mean nothing to anyone.
 */
export type Discipline = 'gym' | 'bjj' | 'mma' | 'hyrox';

export const DISCIPLINES: Discipline[] = ['gym', 'bjj', 'mma', 'hyrox'];

/** How a discipline's work is counted. Drives the summary line and the record types. */
export type DisciplineUnit = 'sets' | 'mat_time' | 'rounds' | 'race_time';

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

// ── HYROX ───────────────────────────────────────────────────────────────────

export type HyroxDivision = 'open' | 'pro' | 'doubles' | 'relay';
export type HyroxCategory = 'mens' | 'womens' | 'mixed';

export type HyroxStationId =
  | 'ski_erg'
  | 'sled_push'
  | 'sled_pull'
  | 'burpee_broad_jump'
  | 'row'
  | 'farmers_carry'
  | 'sandbag_lunges'
  | 'wall_balls';

export type HyroxLoad = {
  /** Kilograms, or null where the station carries no external load. */
  openMen: number | null;
  openWomen: number | null;
  proMen: number | null;
  proWomen: number | null;
};

export type HyroxStationDefinition = {
  id: HyroxStationId;
  /** 1-8, the fixed order every race runs in. */
  order: number;
  name: string;
  measure: 'metres' | 'reps';
  amount: number;
  load: HyroxLoad;
  /** What the load means, since it is not the same thing at every station. */
  loadNote: string;
  coachingNote: string;
};

export type HyroxSessionFormat =
  | 'race'
  | 'full_simulation'
  | 'half_simulation'
  | 'station_work'
  | 'compromised_running'
  | 'running';

export type HyroxRunSplit = {
  index: number;
  metres: number;
  seconds: number;
};

export type HyroxStationSplit = {
  stationId: HyroxStationId;
  seconds: number;
  /** Reps completed, where the station is scored in reps rather than distance. */
  reps?: number;
  notes?: string;
};

export type HyroxLog = {
  kind: 'hyrox';
  format: HyroxSessionFormat;
  division: HyroxDivision;
  category: HyroxCategory;
  runs: HyroxRunSplit[];
  stations: HyroxStationSplit[];
  /** Wall-clock total. Roxzone is derived from this, never entered by hand. */
  totalSeconds: number;
  eventName?: string;
  eventDate?: IsoDate;
};

// ── The union carried on a session ──────────────────────────────────────────

/**
 * A gym session carries no log: its record is the exercise and set list that
 * already existed. The other three each need their own shape.
 */
export type DisciplineLog = BjjLog | MmaLog | HyroxLog;

export type DisciplineRecordType =
  // Mat
  | 'most_mat_minutes'
  | 'most_submissions'
  | 'first_submission'
  | 'longest_roll'
  // Rounds
  | 'most_rounds'
  | 'most_round_minutes'
  // Race
  | 'fastest_station'
  | 'fastest_run_split'
  | 'fastest_simulation';

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
