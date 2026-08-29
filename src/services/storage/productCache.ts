import * as SQLite from 'expo-sqlite';
import type { ProductCache, ResolvedProduct } from '@/services/scanner/types';

/**
 * On-device product cache (Feed spec §22).
 *
 * A product looked up once should be free forever after, including on the
 * shop floor with no signal. The memory cache in front of this one only lives
 * as long as the process; this is the layer that means yesterday's scan still
 * resolves today.
 *
 * Rows are never evicted on a timer. Barcodes a user actually scans are the
 * ones they keep buying, and a few hundred JSON blobs is nothing next to being
 * unable to read the thing in your hand. `retrievedAt` travels inside the
 * record, so staleness can be judged later without throwing the data away now.
 */
const DB_NAME = 'kennel.db';
const TABLE = 'product_cache';

let database: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database;

  database = await SQLite.openDatabaseAsync(DB_NAME);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      gtin      TEXT PRIMARY KEY NOT NULL,
      payload   TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );
  `);
  return database;
}

export const sqliteProductCache: ProductCache = {
  async get(gtin) {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ payload: string }>(
      `SELECT payload FROM ${TABLE} WHERE gtin = ?;`,
      gtin,
    );
    if (!row) return null;

    try {
      return JSON.parse(row.payload) as ResolvedProduct;
    } catch {
      // Treat an unreadable row as a miss. The lookup falls through to the
      // provider and overwrites it.
      return null;
    }
  },

  async put(product) {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO ${TABLE} (gtin, payload, cached_at) VALUES (?, ?, ?)
         ON CONFLICT(gtin) DO UPDATE SET
           payload   = excluded.payload,
           cached_at = excluded.cached_at;`,
      product.gtin,
      JSON.stringify(product),
      new Date().toISOString(),
    );
  },
};
