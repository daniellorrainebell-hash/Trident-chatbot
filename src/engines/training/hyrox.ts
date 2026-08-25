import type {
  HyroxLog,
  HyroxRunSplit,
  HyroxStationId,
  HyroxStationSplit,
  Workout,
} from '@/types';
import { HYROX_RUN_COUNT, HYROX_RUN_METRES, HYROX_STATIONS, findStation } from '@/data/disciplines';

/**
 * Race engine.
 *
 * HYROX is the same eight runs and eight stations everywhere, which is what
 * makes the numbers comparable at all — so the arithmetic here is about
 * accounting for every second of the clock, not about scoring effort.
 *
 * The number nobody tracks and everybody loses time to is the roxzone: the
 * walking, the queueing, the picking up and putting down between the run mat
 * and the station. It is never entered by hand. It is whatever the total clock
 * has left once the runs and the stations are accounted for, which means it
 * cannot be flattered.
 */

export type RaceSummary = {
  totalSeconds: number;
  runSeconds: number;
  stationSeconds: number;
  /** Total minus runs minus stations. The transitions, whether you like them or not. */
  roxzoneSeconds: number;
  roxzoneShare: number;
  runsLogged: number;
  stationsLogged: number;
  /** True only when all eight runs and all eight stations are present. */
  complete: boolean;
  averageRunSeconds: number | null;
  /** Seconds per kilometre across the logged runs. */
  averageRunPace: number | null;
  fastestRun: HyroxRunSplit | null;
  slowestRun: HyroxRunSplit | null;
  /** How much slower the last logged run was than the first, in seconds. */
  runFade: number | null;
};

export function summariseRace(log: HyroxLog): RaceSummary {
  const runSeconds = log.runs.reduce((sum, r) => sum + r.seconds, 0);
  const stationSeconds = log.stations.reduce((sum, s) => sum + s.seconds, 0);

  // Never allow a negative roxzone. A total that is smaller than its own parts
  // is a data-entry problem, and reporting "-90s of transitions" would send
  // somebody hunting for a bug in their own race instead of a typo.
  const roxzoneSeconds = Math.max(0, log.totalSeconds - runSeconds - stationSeconds);

  const sortedRuns = [...log.runs].sort((a, b) => a.seconds - b.seconds);
  const byIndex = [...log.runs].sort((a, b) => a.index - b.index);
  const first = byIndex[0];
  const last = byIndex[byIndex.length - 1];
  const runMetres = log.runs.reduce((sum, r) => sum + r.metres, 0);

  return {
    totalSeconds: log.totalSeconds,
    runSeconds,
    stationSeconds,
    roxzoneSeconds,
    roxzoneShare: log.totalSeconds === 0 ? 0 : roxzoneSeconds / log.totalSeconds,
    runsLogged: log.runs.length,
    stationsLogged: log.stations.length,
    complete: log.runs.length === HYROX_RUN_COUNT && log.stations.length === HYROX_STATIONS.length,
    averageRunSeconds: log.runs.length === 0 ? null : runSeconds / log.runs.length,
    averageRunPace: runMetres === 0 ? null : runSeconds / (runMetres / 1000),
    fastestRun: sortedRuns[0] ?? null,
    slowestRun: sortedRuns[sortedRuns.length - 1] ?? null,
    runFade: first && last && first.index !== last.index ? last.seconds - first.seconds : null,
  };
}

export type StationSplit = {
  stationId: HyroxStationId;
  name: string;
  order: number;
  seconds: number | null;
  /** Share of the total station time, for seeing where the race actually went. */
  share: number | null;
};

/** Every station in race order, including the ones not logged, so gaps are visible. */
export function stationSplits(log: HyroxLog): StationSplit[] {
  const logged = new Map(log.stations.map((s) => [s.stationId, s]));
  const totalStationSeconds = log.stations.reduce((sum, s) => sum + s.seconds, 0);

  return HYROX_STATIONS.map((station) => {
    const split = logged.get(station.id);
    return {
      stationId: station.id,
      name: station.name,
      order: station.order,
      seconds: split?.seconds ?? null,
      share: split && totalStationSeconds > 0 ? split.seconds / totalStationSeconds : null,
    };
  });
}

/**
 * The best time recorded at each station across a history.
 *
 * Station bests are the useful record in this sport, more than the finish time:
 * a race is one day and eight chances, and knowing your sled push has come down
 * forty seconds since February is what tells you the training worked.
 */
export function stationBests(logs: HyroxLog[]): Map<HyroxStationId, number> {
  const best = new Map<HyroxStationId, number>();

  for (const log of logs) {
    for (const split of log.stations) {
      const current = best.get(split.stationId);
      if (current === undefined || split.seconds < current) best.set(split.stationId, split.seconds);
    }
  }

  return best;
}

/**
 * Project a finish from a partial race.
 *
 * Only from a genuinely partial one: with everything logged there is nothing to
 * project, and with nothing logged there is nothing to project from. The
 * remaining work is priced at the athlete's own average so far rather than at
 * some notional target, and the roxzone carries forward at the rate they have
 * actually been transitioning at, because that is the part that slips.
 */
export function projectFinish(log: HyroxLog): number | null {
  const summary = summariseRace(log);
  if (summary.complete) return log.totalSeconds;
  if (log.runs.length === 0 || log.stations.length === 0) return null;

  const runsLeft = HYROX_RUN_COUNT - log.runs.length;
  const stationsLeft = HYROX_STATIONS.length - log.stations.length;
  const averageRun = summary.runSeconds / log.runs.length;
  const averageStation = summary.stationSeconds / log.stations.length;
  const averageRoxzone = summary.roxzoneSeconds / (log.runs.length + log.stations.length);

  const remaining =
    runsLeft * averageRun + stationsLeft * averageStation + (runsLeft + stationsLeft) * averageRoxzone;

  return Math.round(log.totalSeconds + remaining);
}

/** A full simulation with all sixteen legs present, ready to be treated as a result. */
export function isCompleteRace(log: HyroxLog): boolean {
  return summariseRace(log).complete;
}

export function emptyRunSplits(): HyroxRunSplit[] {
  return Array.from({ length: HYROX_RUN_COUNT }, (_, i) => ({
    index: i + 1,
    metres: HYROX_RUN_METRES,
    seconds: 0,
  }));
}

export function emptyStationSplits(): HyroxStationSplit[] {
  return HYROX_STATIONS.map((station) => ({
    stationId: station.id,
    seconds: 0,
    reps: station.measure === 'reps' ? 0 : undefined,
  }));
}

export function stationName(id: HyroxStationId): string {
  return findStation(id)?.name ?? id;
}

/** Pull the race logs out of a mixed session history. */
export function hyroxLogs(workouts: Workout[]): HyroxLog[] {
  return workouts.flatMap((w) => (w.log?.kind === 'hyrox' ? [w.log] : []));
}
