import { makeContract, makeExercise, makeSet, makeWorkout, workoutOn } from '../__fixtures__/builders';
import {
  MAX_SCORE,
  RABID_SCORE_VERSION,
  SCORE_WEIGHTS,
  calculateRabidScore,
  levelForScore,
  nextLevel,
  weakestComponent,
  type ScoreInput,
} from './rabidScore';

const TODAY = '2026-03-06';

function baseInput(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    userId: 'user-1',
    workouts: [],
    contracts: [],
    personalRecords: [],
    challengesCompleted: 0,
    challengesJoined: 0,
    weeklyTarget: 3,
    today: TODAY,
    ...overrides,
  };
}

/** `weeks` consecutive weeks of `perWeek` sessions, ending in the week of TODAY. */
function consistentHistory(weeks: number, perWeek = 3, volumePerSet = 100) {
  const workouts = [];
  const monday = new Date('2026-03-02T00:00:00.000Z');

  for (let w = 0; w < weeks; w += 1) {
    for (let d = 0; d < perWeek; d += 1) {
      const day = new Date(monday);
      day.setUTCDate(day.getUTCDate() - w * 7 + d);
      const date = day.toISOString().slice(0, 10);
      workouts.push(
        makeWorkout({
          completedAt: `${date}T18:00:00.000Z`,
          exercises: [
            makeExercise({
              sets: [makeSet({ weightKg: volumePerSet, reps: 10, completedAt: `${date}T18:00:00.000Z` })],
            }),
          ],
        }),
      );
    }
  }
  return workouts;
}

describe('levelForScore', () => {
  it('maps scores onto the level ladder', () => {
    expect(levelForScore(0)).toBe('stray');
    expect(levelForScore(250)).toBe('mutt');
    expect(levelForScore(500)).toBe('hound');
    expect(levelForScore(700)).toBe('feral');
    expect(levelForScore(900)).toBe('rabid');
  });

  it('reports the next rung and the gap to it', () => {
    expect(nextLevel(300)).toEqual({ level: 'hound', pointsAway: 120 });
  });

  it('returns null at the top of the ladder', () => {
    expect(nextLevel(900)).toBeNull();
  });
});

describe('calculateRabidScore', () => {
  it('gives a brand-new user a floor score, not a punishment', () => {
    const score = calculateRabidScore(baseInput());
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.level).toBe('stray');
  });

  it('stamps the algorithm version onto every result', () => {
    expect(calculateRabidScore(baseInput()).version).toBe(RABID_SCORE_VERSION);
  });

  it('rewards consistent attendance above everything else', () => {
    const consistent = calculateRabidScore(baseInput({ workouts: consistentHistory(12) }));
    expect(consistent.breakdown.consistency).toBe(SCORE_WEIGHTS.consistency);
  });

  it('does not reward raw tonnage on its own', () => {
    // Same number of sessions, wildly different loads.
    const light = calculateRabidScore(baseInput({ workouts: consistentHistory(12, 3, 40) }));
    const heavy = calculateRabidScore(baseInput({ workouts: consistentHistory(12, 3, 300) }));

    expect(heavy.breakdown.consistency).toBe(light.breakdown.consistency);
    expect(heavy.breakdown.frequency).toBe(light.breakdown.frequency);
    expect(heavy.total).toBe(light.total);
  });

  it('caps frequency so training far beyond target does not run away with the score', () => {
    const atTarget = calculateRabidScore(baseInput({ workouts: consistentHistory(12, 3) }));
    const double = calculateRabidScore(baseInput({ workouts: consistentHistory(12, 6) }));

    expect(double.breakdown.frequency).toBe(atTarget.breakdown.frequency);
    expect(double.breakdown.frequency).toBe(SCORE_WEIGHTS.frequency);
  });

  it('rewards completed contracts and penalises broken ones', () => {
    const workouts = consistentHistory(12);
    const kept = calculateRabidScore(
      baseInput({
        workouts,
        contracts: Array.from({ length: 8 }, () => makeContract({ status: 'completed' })),
      }),
    );
    const broken = calculateRabidScore(
      baseInput({
        workouts,
        contracts: Array.from({ length: 8 }, () => makeContract({ status: 'failed' })),
      }),
    );

    expect(kept.breakdown.contracts).toBe(SCORE_WEIGHTS.contracts);
    expect(broken.breakdown.contracts).toBe(0);
    expect(kept.total).toBeGreaterThan(broken.total);
  });

  it('ignores contracts that are still running', () => {
    const active = calculateRabidScore(
      baseInput({ contracts: [makeContract({ status: 'active' })] }),
    );
    expect(active.breakdown.contracts).toBe(0);
  });

  it('penalises a long lay-off after the grace period', () => {
    const recent = calculateRabidScore(baseInput({ workouts: consistentHistory(12) }));
    const lapsed = calculateRabidScore(
      baseInput({ workouts: consistentHistory(12), today: '2026-05-01' }),
    );

    expect(lapsed.breakdown.inactivityPenalty).toBeLessThan(0);
    expect(lapsed.total).toBeLessThan(recent.total);
  });

  it('does not penalise a normal rest gap inside the grace period', () => {
    const score = calculateRabidScore(baseInput({ workouts: [workoutOn('2026-03-02')] }));
    expect(score.breakdown.inactivityPenalty).toBe(0);
  });

  it('caps the inactivity penalty so a return is never hopeless', () => {
    const score = calculateRabidScore(
      baseInput({ workouts: consistentHistory(12), today: '2029-01-01' }),
    );
    expect(score.breakdown.inactivityPenalty).toBeGreaterThanOrEqual(-400);
    expect(score.total).toBeGreaterThanOrEqual(0);
  });

  it('never exceeds the maximum or falls below zero', () => {
    const maxed = calculateRabidScore(
      baseInput({
        workouts: consistentHistory(12, 6),
        contracts: Array.from({ length: 12 }, () => makeContract({ status: 'completed' })),
        personalRecords: Array.from({ length: 20 }, (_, i) => ({
          id: `pr-${i}`, userId: 'user-1', exerciseId: 'ex-bench', exerciseName: 'Bench Press',
          type: 'max_weight' as const, value: 100 + i, atWeightKg: null, reps: 3,
          achievedAt: '2026-03-01T10:00:00.000Z', workoutId: 'wo-1', previousValue: null,
        })),
        challengesCompleted: 10,
        challengesJoined: 10,
      }),
    );

    expect(maxed.total).toBeLessThanOrEqual(MAX_SCORE);
    expect(maxed.total).toBeGreaterThan(0);
  });

  it('is deterministic for identical input', () => {
    const input = baseInput({ workouts: consistentHistory(8) });
    expect(calculateRabidScore(input).total).toBe(calculateRabidScore(input).total);
  });

  it('gives a user with no trend the neutral progression score, not zero', () => {
    const score = calculateRabidScore(baseInput({ workouts: consistentHistory(1) }));
    expect(score.breakdown.progression).toBe(Math.round(SCORE_WEIGHTS.progression * 0.5));
  });
});

describe('weakestComponent', () => {
  it('points at the component furthest from its cap', () => {
    const score = calculateRabidScore(baseInput({ workouts: consistentHistory(12) }));
    expect(weakestComponent(score.breakdown)).toBe('contracts');
  });
});
