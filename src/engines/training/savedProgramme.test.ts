import {
  type SavedProgramme, generateDisciplineWeek, generateProgramme, markComplete,
  clearComplete, mondayOf, rollToCurrentWeek, sessionOnDay, sessionToday,
  weekProgress, weekdayIndex,
} from './programme';

const programme = generateProgramme({ daysPerWeek: 5, experience: 'intermediate', goal: 'hypertrophy' });

function saved(overrides: Partial<SavedProgramme> = {}): SavedProgramme {
  return {
    id: 'p1',
    name: 'My week',
    discipline: 'gym',
    source: 'generated',
    createdAt: '2026-03-02T09:00:00.000Z',
    programme,
    week: null,
    completed: [],
    weekOf: '2026-03-02',
    ...overrides,
  };
}

describe('weekdays', () => {
  it('treats Monday as the start of the week', () => {
    expect(weekdayIndex('2026-03-02')).toBe(0); // Monday
    expect(weekdayIndex('2026-03-06')).toBe(4); // Friday
    // Sunday is the end of the week, not the start of one.
    expect(weekdayIndex('2026-03-08')).toBe(6);
  });

  it('finds the Monday of any day in the week, Sunday included', () => {
    expect(mondayOf('2026-03-02')).toBe('2026-03-02');
    expect(mondayOf('2026-03-06')).toBe('2026-03-02');
    expect(mondayOf('2026-03-08')).toBe('2026-03-02');
    expect(mondayOf('2026-03-09')).toBe('2026-03-09');
  });
});

describe('rolling into a new week', () => {
  it('leaves the programme alone inside the same week', () => {
    const current = saved({ completed: [0, 1] });
    // Identity, so a caller can use it to decide whether to write.
    expect(rollToCurrentWeek(current, '2026-03-06')).toBe(current);
  });

  it('clears the ticks when the week turns over', () => {
    // Last week's Wednesday is not this week's Wednesday, and a programme that
    // says otherwise is lying to somebody about their own training.
    const rolled = rollToCurrentWeek(saved({ completed: [0, 1, 2] }), '2026-03-09');

    expect(rolled.weekOf).toBe('2026-03-09');
    expect(rolled.completed).toEqual([]);
  });

  it('clears them however many weeks have been skipped', () => {
    const rolled = rollToCurrentWeek(saved({ completed: [0, 1] }), '2026-04-20');
    expect(rolled.completed).toEqual([]);
    expect(rolled.weekOf).toBe('2026-04-20');
  });
});

describe('what is on today', () => {
  it('returns the session for the weekday', () => {
    const monday = sessionToday(saved(), '2026-03-02')!;
    expect(monday.name).toBe('Push');
    expect(monday.isRest).toBe(false);
    expect(monday.exercises!.length).toBeGreaterThan(0);
  });

  it('reports a rest day as planned rather than as nothing', () => {
    const rest = saved().programme!.days.find((d) => d.slotId === null)!;
    const session = sessionOnDay(saved(), rest.dayIndex)!;

    expect(session.isRest).toBe(true);
    expect(session.name).toBe('Rest');
    expect(session.exercises).toBeNull();
  });

  it('carries the focus and length for a fight week instead of exercises', () => {
    const week = generateDisciplineWeek('boxing', 5);
    const trainingDay = week.days.find((d) => d.name !== null)!;
    const session = sessionOnDay(
      saved({ discipline: 'boxing', programme: null, week }),
      trainingDay.dayIndex,
    )!;

    expect(session.exercises).toBeNull();
    expect(session.focus).toBe(trainingDay.focus);
    expect(session.minutes).toBe(trainingDay.minutes);
  });

  it('marks the day complete when it has been ticked', () => {
    expect(sessionOnDay(saved({ completed: [0] }), 0)!.isComplete).toBe(true);
    expect(sessionOnDay(saved({ completed: [0] }), 1)!.isComplete).toBe(false);
  });
});

describe('ticking days off', () => {
  it('adds and removes, and keeps the list sorted', () => {
    let current = saved();
    current = markComplete(current, 2);
    current = markComplete(current, 0);
    expect(current.completed).toEqual([0, 2]);

    current = clearComplete(current, 0);
    expect(current.completed).toEqual([2]);
  });

  it('does not double up on a day already ticked', () => {
    const once = markComplete(saved(), 1);
    expect(markComplete(once, 1)).toBe(once);
  });

  it('is a no-op clearing a day that was never ticked', () => {
    const current = saved();
    expect(clearComplete(current, 3)).toBe(current);
  });
});

describe('week progress', () => {
  it('counts only training days as planned', () => {
    const progress = weekProgress(saved(), '2026-03-02');
    expect(progress.planned).toBe(5);
    expect(progress.done).toBe(0);
  });

  it('separates missed days from days still ahead of you', () => {
    // Three left on a Monday is a week in front of you. Three left on a
    // Saturday is a week that got away, and the app should not read the same.
    const monday = weekProgress(saved({ completed: [] }), '2026-03-02');
    expect(monday.missed).toBe(0);

    const saturday = weekProgress(saved({ completed: [] }), '2026-03-07');
    expect(saturday.missed).toBeGreaterThan(0);
  });

  it('does not count today as missed while there is still time', () => {
    const wednesday = weekProgress(saved({ completed: [0, 1] }), '2026-03-04');
    expect(wednesday.done).toBe(2);
    expect(wednesday.missed).toBe(0);
  });

  it('reports a fraction of the week done', () => {
    const progress = weekProgress(saved({ completed: [0, 1] }), '2026-03-06');
    expect(progress.fraction).toBeCloseTo(2 / 5);
  });

  it('counts a fight week the same way', () => {
    const week = generateDisciplineWeek('bjj', 4);
    const progress = weekProgress(
      saved({ discipline: 'bjj', programme: null, week, completed: [] }),
      '2026-03-02',
    );

    expect(progress.planned).toBe(4);
  });
});
