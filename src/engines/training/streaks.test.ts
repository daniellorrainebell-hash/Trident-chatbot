import { workoutOn } from '../__fixtures__/builders';
import { calculateStreak, sessionsPerWeek, weekStart } from './streaks';

describe('weekStart', () => {
  it('snaps to the preceding Monday', () => {
    expect(weekStart('2026-03-04')).toBe('2026-03-02'); // Wednesday -> Monday
    expect(weekStart('2026-03-02')).toBe('2026-03-02'); // Monday stays
  });

  it('treats Sunday as the end of the week, not the start', () => {
    expect(weekStart('2026-03-08')).toBe('2026-03-02');
  });
});

describe('sessionsPerWeek', () => {
  it('counts distinct training days per week', () => {
    const counts = sessionsPerWeek([
      workoutOn('2026-03-02'),
      workoutOn('2026-03-04'),
      workoutOn('2026-03-06'),
      workoutOn('2026-03-09'),
    ]);

    expect(counts.get('2026-03-02')).toBe(3);
    expect(counts.get('2026-03-09')).toBe(1);
  });

  it('counts two sessions on the same day once', () => {
    const counts = sessionsPerWeek([workoutOn('2026-03-02'), workoutOn('2026-03-02')]);
    expect(counts.get('2026-03-02')).toBe(1);
  });
});

describe('calculateStreak', () => {
  const target = 3;

  function weekOf(monday: string) {
    const d = new Date(`${monday}T00:00:00.000Z`);
    return [0, 2, 4].map((offset) => {
      const day = new Date(d);
      day.setUTCDate(day.getUTCDate() + offset);
      return workoutOn(day.toISOString().slice(0, 10));
    });
  }

  it('counts consecutive weeks that met the target', () => {
    const workouts = [
      ...weekOf('2026-02-16'),
      ...weekOf('2026-02-23'),
      ...weekOf('2026-03-02'),
    ];

    const streak = calculateStreak(workouts, '2026-03-06', target);
    expect(streak.current).toBe(3);
    expect(streak.weekSecured).toBe(true);
    expect(streak.sessionsThisWeek).toBe(3);
  });

  it('does not break the streak mid-week before the target is reached', () => {
    const workouts = [
      ...weekOf('2026-02-16'),
      ...weekOf('2026-02-23'),
      workoutOn('2026-03-03'), // only one session so far this week
    ];

    // Tuesday of the current week: the previous two weeks still stand.
    const streak = calculateStreak(workouts, '2026-03-03', target);
    expect(streak.current).toBe(2);
    expect(streak.weekSecured).toBe(false);
    expect(streak.sessionsThisWeek).toBe(1);
  });

  it('breaks the streak when a whole week is missed', () => {
    const workouts = [
      ...weekOf('2026-02-16'),
      // 2026-02-23 skipped entirely
      ...weekOf('2026-03-02'),
    ];

    expect(calculateStreak(workouts, '2026-03-06', target).current).toBe(1);
  });

  it('remembers the longest run even after it is broken', () => {
    const workouts = [
      ...weekOf('2026-01-05'),
      ...weekOf('2026-01-12'),
      ...weekOf('2026-01-19'),
      // gap
      ...weekOf('2026-03-02'),
    ];

    const streak = calculateStreak(workouts, '2026-03-06', target);
    expect(streak.current).toBe(1);
    expect(streak.longest).toBe(3);
  });

  it('reports zero for a user with no history', () => {
    const streak = calculateStreak([], '2026-03-06', target);
    expect(streak).toMatchObject({ current: 0, longest: 0, sessionsThisWeek: 0 });
  });
});
