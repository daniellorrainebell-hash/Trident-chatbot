import type { StoreApi } from 'zustand';
import type { DocumentStore } from '@/services/storage/documentStore';

/**
 * Store persistence by subscription rather than by hand.
 *
 * The alternative is a `void save()` at the end of every action, which is how
 * an action gets added later without one and a user's data quietly stops being
 * written. Subscribing means the store cannot mutate without the write
 * happening, no matter who adds what.
 *
 * Only the slice named by `select` is stored. That matters: these stores also
 * hold things that must never be serialised — an AI provider, a resolver with
 * an open cache, transient `generating` flags — and a blanket dump of state
 * would either fail to stringify or restore a dead object over a live one.
 */
export type PersistedDocument<S, D> = {
  /** Row key in the document store. */
  key: string;
  /**
   * Bumped when the persisted shape changes. A document written by an older
   * version is ignored rather than merged, so a renamed field cannot half-load.
   */
  version: number;
  /** The durable slice. Must be JSON-serialisable. */
  select(state: S): D;
  /** How that slice goes back into the store. */
  merge(data: D): Partial<S>;
};

export type PersistenceHandle = { detach(): void };

export async function attachPersistence<S, D>(
  store: StoreApi<S>,
  documents: DocumentStore,
  spec: PersistedDocument<S, D>,
): Promise<PersistenceHandle> {
  const stored = await documents.read(spec.key);
  if (stored && stored.version === spec.version) {
    store.setState(spec.merge(stored.data as D) as Partial<S> & S);
  }

  // Seeded from the post-hydration state, so attaching does not immediately
  // rewrite what was just read back.
  let last = serialise(spec.select(store.getState()));

  const unsubscribe = store.subscribe((state) => {
    const next = serialise(spec.select(state));
    if (next === last) return;
    last = next;
    void documents.write(spec.key, { version: spec.version, data: JSON.parse(next) as unknown });
  });

  return { detach: unsubscribe };
}

function serialise(slice: unknown): string {
  return JSON.stringify(slice ?? null);
}
