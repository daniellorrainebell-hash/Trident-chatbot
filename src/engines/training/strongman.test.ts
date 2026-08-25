import type { StrongmanAttempt, StrongmanLog, Workout } from '@/types';
import { attemptHistory, eventBests, scoreOf, summariseAttempts } from './strongman';
import { STRONGMAN_EVENTS, findEvent, higherIsBetter } from '@/data/disciplines';
import { makeWorkout } from '../__fixtures__/builders';

let n = 0;
function attempt(overrides: Partial<StrongmanAttempt> = {}): StrongmanAttempt {
  n += 1;
  return {
    id: `a${n}`,
    eventId: 'log_press',
    eventName: 'Log press',
    style: 'max_load',
    loadKg: 100,
    reps: null,
    distanceMetres: null,
    seconds: null,
    successful: true,
    ...overrides,
  };
}

function eventLog(attempts: StrongmanAttempt[]): StrongmanLog {
  return { kind: 'strongman', sessionType: 'event_day', attempts };
}

function session(date: string, attempts: StrongmanAttempt[]): Workout {
  return makeWorkout({
    discipline: 'strongman',
    log: eventLog(attempts),
    completedAt: `${date}T18:00:00.000Z`,
  });
}

describe('event summary', () => {
  it('counts misses as attempts and makes separately', () => {
    // Opener, second, third is the shape of the sport. A log that kept only the
    // makes would hide a lift that has beaten you three weeks running.
    const summary = summariseAttempts([
      attempt({ loadKg: 120 }),
      attempt({ loadKg: 140 }),
      attempt({ loadKg: 150, successful: false }),
    ]);

    expect(summary.attempts).toBe(3);
    expect(summary.successful).toBe(2);
    expect(summary.successRate).toBeCloseTo(2 / 3);
  });

  it('returns a null success rate rather than zero when nothing was attempted', () => {
    expect(summariseAttempts([]).successRate).toBeNull();
  });

  it('takes the heaviest from makes only', () => {
    const summary = summariseAttempts([
      attempt({ loadKg: 140 }),
      attempt({ loadKg: 160, successful: false }),
    ]);

    expect(summary.heaviestKg).toBe(140);
  });

  it('adds up metres carried under load', () => {
    const summary = summariseAttempts([
      attempt({ eventId: 'yoke_walk', style: 'time_for_distance', distanceMetres: 20, seconds: 9 }),
      attempt({ eventId: 'farmers_walk', style: 'time_for_distance', distanceMetres: 20, seconds: 8 }),
      attempt({ eventId: 'yoke_walk', style: 'distance_in_time', distanceMetres: 34, seconds: 60 }),
    ]);

    expect(summary.loadedMetres).toBe(74);
    expect(summary.events).toBe(2);
  });

  it('does not count metres from a dropped carry', () => {
    const summary = summariseAttempts([
      attempt({ style: 'time_for_distance', distanceMetres: 20, successful: false }),
    ]);

    expect(summary.loadedMetres).toBe(0);
  });
});

describe('scoring by style', () => {
  it('reads the score from the field the style is actually judged on', () => {
    expect(scoreOf(attempt({ style: 'max_load', loadKg: 150 }))).toBe(150);
    expect(scoreOf(attempt({ style: 'reps_in_time', reps: 9 }))).toBe(9);
    expect(scoreOf(attempt({ style: 'distance_in_time', distanceMetres: 34 }))).toBe(34);
    expect(scoreOf(attempt({ style: 'time_for_distance', seconds: 9.4 }))).toBe(9.4);
    expect(scoreOf(attempt({ style: 'hold_time', seconds: 41 }))).toBe(41);
  });

  it('knows which direction is better for each style', () => {
    expect(higherIsBetter('max_load')).toBe(true);
    expect(higherIsBetter('reps_in_time')).toBe(true);
    expect(higherIsBetter('distance_in_time')).toBe(true);
    expect(higherIsBetter('hold_time')).toBe(true);
    // A fastest-time event is won by the smaller number.
    expect(higherIsBetter('time_for_distance')).toBe(false);
    expect(higherIsBetter('time_for_reps')).toBe(false);
    expect(higherIsBetter('medley')).toBe(false);
  });
});

describe('event bests', () => {
  it('keys a best on the event and the style together', () => {
    // The same yoke, scored two ways. Keying on the event alone would let the
    // carry overwrite the sprint and call it progress.
    const bests = eventBests([
      session('2026-01-10', [
        attempt({ eventId: 'yoke_walk', style: 'time_for_distance', loadKg: 300, distanceMetres: 20, seconds: 11 }),
        attempt({ eventId: 'yoke_walk', style: 'max_load', loadKg: 340 }),
      ]),
    ]);

    expect(bests.size).toBe(2);
    expect(bests.get('yoke_walk:time_for_distance')!.value).toBe(11);
    expect(bests.get('yoke_walk:max_load')!.value).toBe(340);
  });

  it('takes the larger number for a heavier-is-better style', () => {
    const bests = eventBests([
      session('2026-01-10', [attempt({ loadKg: 140 })]),
      session('2026-02-10', [attempt({ loadKg: 150 })]),
      session('2026-03-01', [attempt({ loadKg: 145 })]),
    ]);

    expect(bests.get('log_press:max_load')!.value).toBe(150);
  });

  it('takes the smaller number for a faster-is-better style', () => {
    const yoke = (seconds: number) =>
      attempt({ eventId: 'yoke_walk', style: 'time_for_distance', distanceMetres: 20, seconds, loadKg: 300 });

    const bests = eventBests([
      session('2026-01-10', [yoke(12)]),
      session('2026-02-10', [yoke(9.6)]),
      session('2026-03-01', [yoke(10.4)]),
    ]);

    expect(bests.get('yoke_walk:time_for_distance')!.value).toBe(9.6);
  });

  it('never lets a miss set a record', () => {
    const bests = eventBests([
      session('2026-01-10', [attempt({ loadKg: 140 })]),
      session('2026-02-10', [attempt({ loadKg: 170, successful: false })]),
    ]);

    expect(bests.get('log_press:max_load')!.value).toBe(140);
  });

  it('carries the load a timed carry was done at, since the time alone says nothing', () => {
    const bests = eventBests([
      session('2026-01-10', [
        attempt({ eventId: 'farmers_walk', style: 'time_for_distance', loadKg: 110, distanceMetres: 20, seconds: 8.2 }),
      ]),
    ]);

    const best = bests.get('farmers_walk:time_for_distance')!;
    expect(best.value).toBe(8.2);
    expect(best.atLoadKg).toBe(110);
  });

  it('ignores sessions from other disciplines', () => {
    expect(eventBests([makeWorkout({ discipline: 'gym' })]).size).toBe(0);
  });
});

describe('attempt history', () => {
  it('keeps the misses, in date order', () => {
    const history = attemptHistory(
      [
        session('2026-03-01', [attempt({ loadKg: 150, successful: false })]),
        session('2026-01-10', [attempt({ loadKg: 140 })]),
        session('2026-02-10', [attempt({ loadKg: 150, successful: false })]),
      ],
      'log_press',
      'max_load',
    );

    expect(history.map((a) => a.achievedAt.slice(0, 10))).toEqual([
      '2026-01-10',
      '2026-02-10',
      '2026-03-01',
    ]);
    // Three weeks of 150 refusing to move is the most useful thing on the screen.
    expect(history.filter((a) => !a.successful)).toHaveLength(2);
  });

  it('does not mix styles at the same event', () => {
    const history = attemptHistory(
      [
        session('2026-01-10', [
          attempt({ eventId: 'yoke_walk', style: 'max_load', loadKg: 340 }),
          attempt({ eventId: 'yoke_walk', style: 'time_for_distance', seconds: 11, distanceMetres: 20 }),
        ]),
      ],
      'yoke_walk',
      'max_load',
    );

    expect(history).toHaveLength(1);
    expect(history[0]!.loadKg).toBe(340);
  });
});

describe('event catalogue', () => {
  it('gives every event at least one way of being scored', () => {
    for (const event of STRONGMAN_EVENTS) {
      expect(event.styles.length).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    const ids = STRONGMAN_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('says what the load figure refers to at every event', () => {
    // A farmers number is per hand and a yoke number is the whole frame. One
    // undifferentiated column of kilograms would be wrong more often than right.
    for (const event of STRONGMAN_EVENTS) {
      expect(event.loadNote.length).toBeGreaterThan(10);
      expect(event.coachingNote.length).toBeGreaterThan(10);
    }
  });

  it('finds an event by id', () => {
    expect(findEvent('atlas_stones')?.name).toBe('Atlas stones');
    expect(findEvent('nope')).toBeUndefined();
  });
});
