import { create } from 'zustand';
import type { Discipline } from '@/types';
import {
  type DisciplineWeek, type Programme, type SavedProgramme,
  clearComplete, markComplete, mondayOf, rollToCurrentWeek,
} from '@/engines/training/programme';

/**
 * The programme somebody is actually on.
 *
 * One active programme at a time, deliberately. Two half-followed plans is the
 * state most people are already in when they download a training app, and
 * offering a list of them is offering to formalise the problem.
 *
 * Persistence is injected rather than imported, the same way the workout store
 * does it: the store stays testable without a database, and the app can decide
 * at startup whether there is one.
 */
export type ProgrammePersistence = {
  save(programme: SavedProgramme | null): Promise<void>;
  load(): Promise<SavedProgramme | null>;
};

type ProgrammeState = {
  active: SavedProgramme | null;
  persistence: ProgrammePersistence | null;

  setPersistence(adapter: ProgrammePersistence): void;
  hydrate(today: string): Promise<void>;

  saveGenerated(programme: Programme, name: string, today: string): void;
  saveDisciplineWeek(week: DisciplineWeek, name: string, today: string): void;
  toggleDay(dayIndex: number): void;
  clear(): void;
};

function newSaved(
  name: string,
  discipline: Discipline,
  today: string,
  parts: { programme?: Programme; week?: DisciplineWeek },
): SavedProgramme {
  return {
    id: `programme-${Date.now()}`,
    name,
    discipline,
    source: 'generated',
    createdAt: new Date().toISOString(),
    programme: parts.programme ?? null,
    week: parts.week ?? null,
    completed: [],
    weekOf: mondayOf(today),
  };
}

export const useProgrammeStore = create<ProgrammeState>((set, get) => ({
  active: null,
  persistence: null,

  setPersistence(adapter) {
    set({ persistence: adapter });
  },

  async hydrate(today) {
    const { persistence } = get();
    if (!persistence) return;

    const stored = await persistence.load();
    if (!stored) return;

    // Roll forward on the way in rather than on the way out, so nothing
    // downstream ever sees last week's ticks against this week's days.
    const rolled = rollToCurrentWeek(stored, today);
    set({ active: rolled });
    if (rolled !== stored) void persistence.save(rolled);
  },

  saveGenerated(programme, name, today) {
    const saved = newSaved(name, 'gym', today, { programme });
    set({ active: saved });
    void get().persistence?.save(saved);
  },

  saveDisciplineWeek(week, name, today) {
    const saved = newSaved(name, week.discipline, today, { week });
    set({ active: saved });
    void get().persistence?.save(saved);
  },

  toggleDay(dayIndex) {
    const { active } = get();
    if (!active) return;

    const next = active.completed.includes(dayIndex)
      ? clearComplete(active, dayIndex)
      : markComplete(active, dayIndex);

    set({ active: next });
    void get().persistence?.save(next);
  },

  clear() {
    set({ active: null });
    void get().persistence?.save(null);
  },
}));
