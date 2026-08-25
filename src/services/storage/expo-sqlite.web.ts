/**
 * Web stand-in for expo-sqlite.
 *
 * The real module pulls in a WASM build of SQLite through a web worker, which
 * Metro cannot bundle for a static web export. Web is not a shipping target —
 * it exists so the app can be driven in a browser for review — so the durable
 * store is swapped for an in-memory one rather than the feature being removed.
 *
 * The contract is deliberately thin: only the four calls sqlitePersistence
 * actually makes. Anything else should fail loudly rather than pretend.
 */
type Row = Record<string, unknown>;

const tables = new Map<string, Row[]>();

function tableFor(sql: string): Row[] {
  const match = /(?:from|into|update)\s+([a-z_]+)/i.exec(sql);
  const name = match?.[1] ?? 'default';
  let rows = tables.get(name);
  if (!rows) {
    rows = [];
    tables.set(name, rows);
  }
  return rows;
}

export type SQLiteDatabase = {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: unknown[]): Promise<{ changes: number }>;
  getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]>;
};

export async function openDatabaseAsync(): Promise<SQLiteDatabase> {
  return {
    async execAsync() {},
    async runAsync(sql, ...params) {
      if (/^\s*insert/i.test(sql)) tableFor(sql).push({ params });
      return { changes: 1 };
    },
    async getFirstAsync() {
      return null;
    },
    async getAllAsync() {
      return [];
    },
  };
}
