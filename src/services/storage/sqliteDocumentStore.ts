import * as SQLite from 'expo-sqlite';
import type { DocumentStore } from './documentStore';

/**
 * The on-device implementation of the document store, sharing the app's single
 * SQLite database with the workout and programme tables.
 */
const DB_NAME = 'kennel.db';
const TABLE = 'documents';

let database: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database;

  database = await SQLite.openDatabaseAsync(DB_NAME);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      key      TEXT PRIMARY KEY NOT NULL,
      version  INTEGER NOT NULL,
      payload  TEXT NOT NULL,
      saved_at TEXT NOT NULL
    );
  `);
  return database;
}

export const sqliteDocumentStore: DocumentStore = {
  async read(key) {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ version: number; payload: string }>(
      `SELECT version, payload FROM ${TABLE} WHERE key = ?;`,
      key,
    );
    if (!row) return null;

    try {
      return { version: row.version, data: JSON.parse(row.payload) as unknown };
    } catch {
      // A payload we cannot parse is worse than none. Returning null puts the
      // user back on defaults rather than crashing them out of the app.
      return null;
    }
  },

  async write(key, document) {
    const db = await getDatabase();

    if (document === null) {
      await db.runAsync(`DELETE FROM ${TABLE} WHERE key = ?;`, key);
      return;
    }

    await db.runAsync(
      `INSERT INTO ${TABLE} (key, version, payload, saved_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           version  = excluded.version,
           payload  = excluded.payload,
           saved_at = excluded.saved_at;`,
      key,
      document.version,
      JSON.stringify(document.data),
      new Date().toISOString(),
    );
  },
};
