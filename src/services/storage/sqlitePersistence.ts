import * as SQLite from 'expo-sqlite';
import type { Workout } from '@/types';
import type { WorkoutPersistence } from '@/store/workoutStore';

/**
 * Offline-first persistence (spec §13).
 *
 * Gym Wi-Fi cannot be trusted, so the active session is written to SQLite on
 * every mutation and completed sessions are queued locally until they sync. A
 * dropped connection, a backgrounded app or an OS kill mid-session must not cost
 * anyone their work.
 *
 * The workout JSON is stored whole rather than shredded across normalised tables.
 * The client only ever reads a session back as a unit, and a single row write is
 * both faster and atomic - which matters when it happens after every tapped set.
 * The normalised schema lives server-side, where it is actually queried.
 */

const DB_NAME = 'kennel.db';
const ACTIVE_KEY = 'active';

let database: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database;

  database = await SQLite.openDatabaseAsync(DB_NAME);
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS active_workout (
      key      TEXT PRIMARY KEY NOT NULL,
      json     TEXT NOT NULL,
      saved_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS queued_workouts (
      id         TEXT PRIMARY KEY NOT NULL,
      json       TEXT NOT NULL,
      sync_state TEXT NOT NULL,
      queued_at  TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_queued_sync_state
      ON queued_workouts (sync_state);
  `);

  return database;
}

export const sqlitePersistence: WorkoutPersistence = {
  async saveActive(workout) {
    const db = await getDatabase();

    if (!workout) {
      await db.runAsync('DELETE FROM active_workout WHERE key = ?', ACTIVE_KEY);
      return;
    }

    await db.runAsync(
      `INSERT INTO active_workout (key, json, saved_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET json = excluded.json, saved_at = excluded.saved_at`,
      ACTIVE_KEY,
      JSON.stringify(workout),
      new Date().toISOString(),
    );
  },

  async loadActive() {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ json: string }>(
      'SELECT json FROM active_workout WHERE key = ?',
      ACTIVE_KEY,
    );

    if (!row) return null;

    try {
      return JSON.parse(row.json) as Workout;
    } catch {
      // Corrupt row: drop it rather than crash on launch into the Train tab.
      await db.runAsync('DELETE FROM active_workout WHERE key = ?', ACTIVE_KEY);
      return null;
    }
  },

  async saveCompleted(workout) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO queued_workouts (id, json, sync_state, queued_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET json = excluded.json, sync_state = excluded.sync_state`,
      workout.id,
      JSON.stringify(workout),
      'queued',
      new Date().toISOString(),
    );
  },
};

/** Sessions waiting to reach the server. */
export async function listQueuedWorkouts(): Promise<Workout[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ json: string }>(
    "SELECT json FROM queued_workouts WHERE sync_state IN ('queued', 'failed') ORDER BY queued_at ASC",
  );

  return rows
    .map((row) => {
      try {
        return JSON.parse(row.json) as Workout;
      } catch {
        return null;
      }
    })
    .filter((w): w is Workout => w !== null);
}

export async function markSynced(workoutIds: string[]): Promise<void> {
  if (workoutIds.length === 0) return;

  const db = await getDatabase();
  const placeholders = workoutIds.map(() => '?').join(', ');
  await db.runAsync(
    `UPDATE queued_workouts SET sync_state = 'synced' WHERE id IN (${placeholders})`,
    ...workoutIds,
  );
}

export async function markSyncFailed(workoutIds: string[]): Promise<void> {
  if (workoutIds.length === 0) return;

  const db = await getDatabase();
  const placeholders = workoutIds.map(() => '?').join(', ');
  await db.runAsync(
    `UPDATE queued_workouts SET sync_state = 'failed' WHERE id IN (${placeholders})`,
    ...workoutIds,
  );
}

/** Count of unsynced sessions, for the sync indicator. */
export async function pendingSyncCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM queued_workouts WHERE sync_state IN ('queued', 'failed')",
  );
  return row?.count ?? 0;
}
