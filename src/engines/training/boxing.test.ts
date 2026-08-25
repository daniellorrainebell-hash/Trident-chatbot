import type { BoxingLog, BoxingRound, Workout } from '@/types';
import { boxingLogs, hardSparringLoad, liveRounds, sessionMix, summariseRounds } from './boxing';
import { BOXING_WEIGHT_CLASSES, PUNCHES, punchByNumber, weightClassForKg } from '@/data/disciplines';
import { makeWorkout } from '../__fixtures__/builders';

let n = 0;
function round(overrides: Partial<BoxingRound> = {}): BoxingRound {
  n += 1;
  return {
    id: `r${n}`,
    index: n,
    minutes: 3,
    intensity: 'medium',
    punchesThrown: null,
    punchesLanded: null,
    bodyPunchesThrown: null,
    knockdownsFor: 0,
    knockdownsAgainst: 0,
    ...overrides,
  };
}

function ringLog(rounds: BoxingRound[], overrides: Partial<BoxingLog> = {}): BoxingLog {
  return {
    kind: 'boxing',
    sessionType: 'sparring',
    stance: 'orthodox',
    rounds,
    restSeconds: 60,
    worked: [],
    ...overrides,
  };
}

describe('ring summary', () => {
  it('counts rounds and minutes with the intensity kept', () => {
    const summary = summariseRounds([
      round({ intensity: 'hard' }),
      round({ intensity: 'hard' }),
      round({ intensity: 'light' }),
    ]);

    expect(summary.rounds).toBe(3);
    expect(summary.roundMinutes).toBe(9);
    expect(summary.hardRounds).toBe(2);
    expect(summary.byIntensity.light).toBe(1);
  });

  it('reports nulls rather than zeroes when nobody was counting', () => {
    // A zero would be a lie about a round nobody watched with a clicker.
    const summary = summariseRounds([round(), round()]);

    expect(summary.countedRounds).toBe(0);
    expect(summary.punchesThrown).toBeNull();
    expect(summary.workRate).toBeNull();
    expect(summary.accuracy).toBeNull();
    expect(summary.bodyShare).toBeNull();
  });

  it('averages work rate over the counted rounds only', () => {
    const summary = summariseRounds([
      round({ punchesThrown: 60 }),
      round({ punchesThrown: 40 }),
      // Uncounted: must not drag the average down as if it were a zero round.
      round(),
    ]);

    expect(summary.countedRounds).toBe(2);
    expect(summary.punchesThrown).toBe(100);
    expect(summary.workRate).toBe(50);
  });

  it('computes accuracy only across rounds where landed was kept too', () => {
    const summary = summariseRounds([
      round({ punchesThrown: 60, punchesLanded: 24 }),
      // Thrown counted, landed not. Including its thrown in the denominator
      // would understate accuracy by a third.
      round({ punchesThrown: 40 }),
    ]);

    expect(summary.punchesThrown).toBe(100);
    expect(summary.accuracy).toBeCloseTo(24 / 60);
  });

  it('reports the body share of everything thrown', () => {
    const summary = summariseRounds([
      round({ punchesThrown: 60, bodyPunchesThrown: 12 }),
      round({ punchesThrown: 40, bodyPunchesThrown: 8 }),
    ]);

    expect(summary.bodyShare).toBeCloseTo(0.2);
  });

  it('adds up knockdowns in both directions', () => {
    const summary = summariseRounds([
      round({ knockdownsFor: 1 }),
      round({ knockdownsAgainst: 1 }),
    ]);

    expect(summary.knockdownsFor).toBe(1);
    expect(summary.knockdownsAgainst).toBe(1);
  });
});

describe('session mix', () => {
  it('ranks by rounds rather than by session count', () => {
    const mix = sessionMix([
      ringLog([round(), round(), round(), round(), round(), round()], { sessionType: 'heavy_bag' }),
      ringLog([round(), round()], { sessionType: 'sparring' }),
      ringLog([round()], { sessionType: 'pads' }),
      ringLog([round()], { sessionType: 'pads' }),
    ]);

    expect(mix[0]).toMatchObject({ sessionType: 'heavy_bag', rounds: 6, sessions: 1 });
    expect(mix.find((m) => m.sessionType === 'pads')).toMatchObject({ sessions: 2, rounds: 2 });
  });

  it('counts only rounds against a live opponent as live rounds', () => {
    const logs = [
      ringLog([round(), round()], { sessionType: 'sparring' }),
      ringLog([round()], { sessionType: 'technical_sparring' }),
      // Bag and pads do not hit back.
      ringLog([round(), round(), round()], { sessionType: 'heavy_bag' }),
      ringLog([round(), round()], { sessionType: 'pads' }),
    ];

    expect(liveRounds(logs)).toBe(3);
  });
});

describe('hard sparring load', () => {
  const session = (date: string, rounds: BoxingRound[]): Workout =>
    makeWorkout({ discipline: 'boxing', log: ringLog(rounds), completedAt: `${date}T19:00:00.000Z` });

  it('counts hard rounds inside the window only', () => {
    const load = hardSparringLoad(
      [
        session('2026-03-04', [round({ intensity: 'hard' }), round({ intensity: 'light' })]),
        session('2026-02-20', [round({ intensity: 'hard' }), round({ intensity: 'hard' })]),
        session('2026-01-02', [round({ intensity: 'hard' })]),
      ],
      '2026-03-06',
    );

    expect(load.hardRounds).toBe(3);
    expect(load.sessions).toBe(2);
    expect(load.hardRoundMinutes).toBe(9);
    expect(load.lastHardDate).toBe('2026-03-04');
  });

  it('ignores other disciplines', () => {
    expect(hardSparringLoad([makeWorkout({ discipline: 'mma' })], '2026-03-06').hardRounds).toBe(0);
  });

  it('pulls only ring logs out of a mixed history', () => {
    const mixed = [
      makeWorkout({ discipline: 'boxing', log: ringLog([round()]) }),
      makeWorkout({ discipline: 'gym' }),
    ];

    expect(boxingLogs(mixed)).toHaveLength(1);
  });
});

describe('punch catalogue', () => {
  it('resolves a punch from the number a coach shouts', () => {
    expect(punchByNumber('1')?.name).toBe('Jab');
    expect(punchByNumber('2')?.name).toBe('Cross');
    expect(punchByNumber('3b')?.name).toBe('Lead hook to the body');
    expect(punchByNumber('99')).toBeUndefined();
  });

  it('gives every punch a unique number and id', () => {
    const numbers = PUNCHES.map((p) => p.number);
    const ids = PUNCHES.map((p) => p.id);
    expect(new Set(numbers).size).toBe(numbers.length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a body version of each of the six', () => {
    for (const n of ['1', '2', '3', '4', '5', '6']) {
      expect(punchByNumber(`${n}b`)).toBeDefined();
    }
  });
});

describe('weight classes', () => {
  it('puts a weight into the class it would actually make', () => {
    expect(weightClassForKg(66.0)?.id).toBe('welter');
    expect(weightClassForKg(66.7)?.id).toBe('welter');
    // A gram over and it is the next class up.
    expect(weightClassForKg(66.8)?.id).toBe('super_welter');
    expect(weightClassForKg(72.6)?.id).toBe('middle');
  });

  it('puts anything above cruiser at heavyweight', () => {
    expect(weightClassForKg(120)?.id).toBe('heavy');
  });

  it('runs light to heavy with no gaps', () => {
    const limits = BOXING_WEIGHT_CLASSES.map((c) => c.limitKg);
    expect([...limits].sort((a, b) => a - b)).toEqual(limits);
  });
});
