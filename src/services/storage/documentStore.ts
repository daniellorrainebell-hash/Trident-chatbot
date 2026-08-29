/**
 * A keyed JSON document store.
 *
 * Most of what this app persists is one small object per concern: the user's
 * profile, their nutrition targets, their saved foods, their contracts. Each of
 * those was heading for its own near-identical persistence module, so this is
 * the one contract for putting a blob under a key and getting it back.
 *
 * Blobs rather than normalised tables, for the same reason the workout store
 * does it: the client only ever reads these back whole, so shredding them
 * across columns would buy nothing and cost a migration every time a shape
 * moves. The normalised schema lives server-side, where it is actually queried.
 *
 * This file deliberately imports nothing native. The SQLite implementation is
 * in `sqliteDocumentStore.ts`, so stores and engines stay testable in a plain
 * node environment.
 */
export type StoredDocument = {
  /** Bumped when the shape changes, so an older payload is ignored, not applied. */
  version: number;
  data: unknown;
};

export type DocumentStore = {
  read(key: string): Promise<StoredDocument | null>;
  write(key: string, document: StoredDocument | null): Promise<void>;
};

/** In-memory store for tests and for any surface without SQLite. */
export function createMemoryDocumentStore(): DocumentStore & { size(): number } {
  const rows = new Map<string, StoredDocument>();
  return {
    async read(key) {
      return rows.get(key) ?? null;
    },
    async write(key, document) {
      if (document === null) rows.delete(key);
      else rows.set(key, JSON.parse(JSON.stringify(document)) as StoredDocument);
    },
    size: () => rows.size,
  };
}
