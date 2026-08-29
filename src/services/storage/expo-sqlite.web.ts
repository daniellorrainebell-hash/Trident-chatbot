/**
 * Web stand-in for expo-sqlite.
 *
 * The real module pulls in a WASM build of SQLite through a web worker, which
 * Metro cannot bundle for a static web export. Web is not a shipping target —
 * it exists so the app can be driven in a browser for review — so the durable
 * store is swapped for this rather than the feature being removed.
 *
 * The contract is deliberately thin: only the calls this app actually makes.
 * Anything else should fail loudly rather than pretend.
 *
 * The `documents` table is implemented for real, against localStorage, because
 * the browser is the only place this app can currently be driven — and "does
 * my profile survive a restart" is not a question a stub that always returns
 * null can answer. Workout rows stay a no-op; they are covered by their own
 * tests and by the native build.
 */
type Row = Record<string, unknown>;

const tables = new Map<string, Row[]>();

const DOCUMENTS_KEY = 'kennel.documents';

type DocumentRow = { version: number; payload: string; saved_at: string };

function loadDocuments(): Record<string, DocumentRow> {
  try {
    const raw = globalThis.localStorage?.getItem(DOCUMENTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DocumentRow>) : {};
  } catch {
    // Private browsing, blocked site data, or a corrupt payload. An empty
    // store is a working app on defaults; a throw here is a blank screen.
    return {};
  }
}

function saveDocuments(rows: Record<string, DocumentRow>): void {
  try {
    globalThis.localStorage?.setItem(DOCUMENTS_KEY, JSON.stringify(rows));
  } catch {
    /* best effort — a failed write must never break the app */
  }
}

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

const isDocuments = (sql: string): boolean => /\bdocuments\b/i.test(sql);

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
      if (isDocuments(sql)) {
        const rows = loadDocuments();

        if (/^\s*delete/i.test(sql)) {
          delete rows[String(params[0])];
          saveDocuments(rows);
          return { changes: 1 };
        }

        // INSERT ... VALUES (key, version, payload, saved_at)
        const [key, version, payload, savedAt] = params;
        rows[String(key)] = {
          version: Number(version),
          payload: String(payload),
          saved_at: String(savedAt),
        };
        saveDocuments(rows);
        return { changes: 1 };
      }

      if (/^\s*insert/i.test(sql)) tableFor(sql).push({ params });
      return { changes: 1 };
    },

    async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
      if (isDocuments(sql)) {
        const row = loadDocuments()[String(params[0])];
        return (row as T | undefined) ?? null;
      }
      return null;
    },

    async getAllAsync<T>(): Promise<T[]> {
      return [];
    },
  };
}
