import * as SQLite from 'expo-sqlite';
import type { ProgrammePersistence } from '@/store/programmeStore';
import type { SavedProgramme } from '@/engines/training/programme';

/**
 * Programme storage.
 *
 * A single row, because there is a single active programme. Stored as JSON
 * rather than shredded across tables: the shape is versioned by the generator
 * that produced it and is read back whole every time, so normalising it would
 * buy nothing and cost a migration every time the coaching rules move.
 */
const DB_NAME = 'kennel.db';
const TABLE = 'programme';

let database: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database;
  database = await SQLite.openDatabaseAsync(DB_NAME);
  await database.execAsync(
    `CREATE TABLE IF NOT EXISTS ${TABLE} (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL);`,
  );
  return database;
}

export const programmePersistence: ProgrammePersistence = {
  async save(programme) {
    const db = await getDatabase();
    if (programme === null) {
      await db.runAsync(`DELETE FROM ${TABLE} WHERE id = 1;`);
      return;
    }
    await db.runAsync(
      `INSERT INTO ${TABLE} (id, payload) VALUES (1, ?)
         ON CONFLICT(id) DO UPDATE SET payload = excluded.payload;`,
      JSON.stringify(programme),
    );
  },

  async load() {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ payload: string }>(`SELECT payload FROM ${TABLE} WHERE id = 1;`);
    if (!row) return null;

    try {
      return JSON.parse(row.payload) as SavedProgramme;
    } catch {
      // A payload we cannot read is worse than none: returning null puts the
      // user back on "no programme" rather than crashing them out of the app.
      return null;
    }
  },
};
