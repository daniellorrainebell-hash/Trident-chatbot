import type { BjjLog, BjjRound, MmaLog, MmaRound, Workout } from '@/types';
import { beltStanding, matHours, submissionBreakdown, summariseSession as summariseMat } from './bjj';
import { hardSparringLoad, rangeBalance, summariseSession as summariseRounds } from './mma';
import { submissionLegality, findSubmission } from '@/data/disciplines';
import { makeWorkout } from '../__fixtures__/builders';

// ── Mat ─────────────────────────────────────────────────────────────────────

function round(overrides: Partial<BjjRound> = {}): BjjRound {
  return {
    id: 'r1',
    index: 1,
    minutes: 5,
    intensity: 'hard',
    submissionsLanded: [],
    submissionsConceded: [],
    sweeps: 0,
    sweepsConceded: 0,
    passes: 0,
    passesConceded: 0,
    takedowns: 0,
    takedownsConceded: 0,
    positionsReached: [],
    ...overrides,
  };
}

function matLog(rounds: BjjRound[], matMinutes = 90): BjjLog {
  return {
    kind: 'bjj',
    sessionType: 'nogi',
    gi: false,
    matMinutes,
    rounds,
    techniquesDrilled: [],
    beltAtSession: 'blue',
    stripesAtSession: 2,
  };
}

describe('mat summary', () => {
  it('separates rolling minutes from total mat time', () => {
    const summary = summariseMat(matLog([round({ minutes: 6 }), round({ minutes: 6 })], 90));

    // Warm-up and drilling are mat time but not rolling. Conflating them would
    // overstate hard mileage by more than half on a normal class.
    expect(summary.matMinutes).toBe(90);
    expect(summary.rollingMinutes).toBe(12);
  });

  it('reports the submission rate as a share of all taps in the session', () => {
    const summary = summariseMat(
      matLog([
        round({ submissionsLanded: [{ submissionId: 'armbar', submissionName: 'Armbar' }] }),
        round({ submissionsConceded: [{ submissionId: 'triangle', submissionName: 'Triangle choke' }] }),
        round({ submissionsLanded: [{ submissionId: 'kimura', submissionName: 'Kimura' }] }),
      ]),
    );

    expect(summary.submissionsLanded).toBe(2);
    expect(summary.submissionsConceded).toBe(1);
    expect(summary.submissionRate).toBeCloseTo(2 / 3);
  });

  it('returns a null submission rate rather than zero when nobody tapped', () => {
    // Zero would read as "you got submitted every time", which is the opposite
    // of what an untapped session means.
    expect(summariseMat(matLog([round()])).submissionRate).toBeNull();
  });

  it('scores a position once per round however many times it was reached', () => {
    const summary = summariseMat(
      matLog([round({ positionsReached: ['mount', 'mount', 'back_control'] })]),
    );

    // Mount 4 + back control 4, not 4 + 4 + 4.
    expect(summary.pointsFor).toBe(8);
  });

  it('scores sweeps, passes and takedowns at IBJJF values', () => {
    const summary = summariseMat(matLog([round({ sweeps: 2, passes: 1, takedowns: 1 })]));

    // 2 sweeps x2, 1 pass x3, 1 takedown x2.
    expect(summary.pointsFor).toBe(4 + 3 + 2);
  });

  it('counts points conceded from what the other person did', () => {
    const summary = summariseMat(matLog([round({ passesConceded: 2, takedownsConceded: 1 })]));
    expect(summary.pointsAgainst).toBe(6 + 2);
  });

  it('tallies a submission both ways and sorts by total involvement', () => {
    const logs = [
      matLog([
        round({ submissionsConceded: [{ submissionId: 'triangle', submissionName: 'Triangle choke' }] }),
        round({ submissionsConceded: [{ submissionId: 'triangle', submissionName: 'Triangle choke' }] }),
        round({ submissionsConceded: [{ submissionId: 'triangle', submissionName: 'Triangle choke' }] }),
        round({ submissionsLanded: [{ submissionId: 'armbar', submissionName: 'Armbar' }] }),
      ]),
    ];

    const [first] = submissionBreakdown(logs);

    // The thing catching you three times a week outranks the one you landed once.
    expect(first).toMatchObject({ submissionId: 'triangle', landed: 0, conceded: 3 });
  });

  it('totals mat time in hours across sessions', () => {
    expect(matHours([matLog([], 90), matLog([], 90), matLog([], 60)])).toBe(4);
  });
});

describe('belt standing', () => {
  it('reports months held and whether the IBJJF minimum has passed', () => {
    const standing = beltStanding('blue', 3, '2023-01-15', '2026-03-06');

    expect(standing.monthsAtBelt).toBe(37);
    expect(standing.minimumMonths).toBe(24);
    expect(standing.minimumServed).toBe(true);
    expect(standing.nextBelt).toBe('purple');
  });

  it('does not count a part month', () => {
    // Promoted on the 20th, checked on the 15th: that month is not served.
    expect(beltStanding('blue', 0, '2025-01-20', '2026-01-15').monthsAtBelt).toBe(11);
  });

  it('has no minimum to serve at black belt', () => {
    const standing = beltStanding('black', 1, '2020-01-01', '2026-03-06');
    expect(standing.minimumMonths).toBeNull();
    expect(standing.minimumServed).toBe(false);
    expect(standing.nextBelt).toBeNull();
  });
});

describe('submission legality', () => {
  it('bans heel hooks in the gi at every belt', () => {
    const heelHook = findSubmission('heel_hook_inside')!;

    expect(submissionLegality(heelHook, 'black', true).allowed).toBe(false);
    expect(submissionLegality(heelHook, 'black', true).reason).toMatch(/gi at any belt/i);
  });

  it('allows heel hooks in no-gi from brown', () => {
    const heelHook = findSubmission('heel_hook_inside')!;

    expect(submissionLegality(heelHook, 'purple', false).allowed).toBe(false);
    expect(submissionLegality(heelHook, 'brown', false).allowed).toBe(true);
    expect(submissionLegality(heelHook, 'black', false).allowed).toBe(true);
  });

  it('allows an armbar at white belt in both rulesets', () => {
    const armbar = findSubmission('armbar')!;
    expect(submissionLegality(armbar, 'white', true).allowed).toBe(true);
    expect(submissionLegality(armbar, 'white', false).allowed).toBe(true);
  });

  it('holds wrist locks back until blue', () => {
    const wristLock = findSubmission('wrist_lock')!;
    expect(submissionLegality(wristLock, 'white', true).allowed).toBe(false);
    expect(submissionLegality(wristLock, 'blue', true).allowed).toBe(true);
  });
});

// ── Rounds ──────────────────────────────────────────────────────────────────

function mmaRound(overrides: Partial<MmaRound> = {}): MmaRound {
  return {
    id: 'r1',
    index: 1,
    minutes: 5,
    range: 'striking',
    intensity: 'medium',
    takedownsFor: 0,
    takedownsAgainst: 0,
    submissionsFor: 0,
    submissionsAgainst: 0,
    knockdownsFor: 0,
    knockdownsAgainst: 0,
    ...overrides,
  };
}

function fightLog(rounds: MmaRound[]): MmaLog {
  return { kind: 'mma', sessionType: 'sparring', rounds, restSeconds: 60, techniquesDrilled: [] };
}

describe('round summary', () => {
  it('keeps range and intensity attached to the count', () => {
    const summary = summariseRounds(
      fightLog([
        mmaRound({ range: 'striking', intensity: 'hard' }),
        mmaRound({ range: 'wrestling', intensity: 'light' }),
        mmaRound({ range: 'striking', intensity: 'hard' }),
      ]),
    );

    expect(summary.rounds).toBe(3);
    expect(summary.roundMinutes).toBe(15);
    expect(summary.byRange.striking).toBe(2);
    expect(summary.byRange.wrestling).toBe(1);
    expect(summary.hardRounds).toBe(2);
  });

  it('reports the range balance as shares of all rounds', () => {
    const balance = rangeBalance([
      fightLog([mmaRound({ range: 'striking' }), mmaRound({ range: 'striking' }), mmaRound({ range: 'striking' })]),
      fightLog([mmaRound({ range: 'wrestling' })]),
    ]);

    expect(balance[0]).toMatchObject({ range: 'striking', rounds: 3 });
    expect(balance[0]!.share).toBeCloseTo(0.75);
    expect(balance.find((b) => b.range === 'wrestling')!.share).toBeCloseTo(0.25);
  });
});

describe('hard sparring load', () => {
  const session = (date: string, rounds: MmaRound[]): Workout =>
    makeWorkout({
      discipline: 'mma',
      log: fightLog(rounds),
      completedAt: `${date}T19:00:00.000Z`,
    });

  it('counts only hard rounds, and only inside the window', () => {
    const load = hardSparringLoad(
      [
        session('2026-03-04', [mmaRound({ intensity: 'hard' }), mmaRound({ intensity: 'light' })]),
        session('2026-02-20', [mmaRound({ intensity: 'hard' }), mmaRound({ intensity: 'hard' })]),
        // Outside a 28-day window looking back from 6 March.
        session('2026-01-02', [mmaRound({ intensity: 'hard' })]),
      ],
      '2026-03-06',
    );

    expect(load.hardRounds).toBe(3);
    expect(load.sessions).toBe(2);
    expect(load.hardRoundMinutes).toBe(15);
    expect(load.lastHardDate).toBe('2026-03-04');
  });

  it('ignores sessions with no hard rounds at all', () => {
    const load = hardSparringLoad([session('2026-03-04', [mmaRound({ intensity: 'technical' })])], '2026-03-06');

    expect(load.hardRounds).toBe(0);
    expect(load.sessions).toBe(0);
    expect(load.lastHardDate).toBeNull();
  });

  it('ignores sessions from other disciplines', () => {
    const gym = makeWorkout({ discipline: 'gym', completedAt: '2026-03-05T19:00:00.000Z' });
    expect(hardSparringLoad([gym], '2026-03-06').hardRounds).toBe(0);
  });
});
