import { createStore } from 'zustand/vanilla';
import { attachPersistence, type PersistedDocument } from './persistence';
import { createMemoryDocumentStore } from '@/services/storage/documentStore';
import { USER_DOCUMENT, useUserStore } from './userStore';
import { NUTRITION_DOCUMENT, useNutritionStore } from './nutritionStore';
import { SCANNER_DOCUMENT, useScannerStore } from './scannerStore';
import { CONTRACT_DOCUMENT, useContractStore } from './contractStore';

type Counter = { count: number; label: string; bump(): void };

function counterStore() {
  return createStore<Counter>((set, get) => ({
    count: 0,
    label: 'start',
    bump: () => set({ count: get().count + 1 }),
  }));
}

const COUNTER_DOC: PersistedDocument<Counter, Pick<Counter, 'count'>> = {
  key: 'counter',
  version: 1,
  select: (s) => ({ count: s.count }),
  merge: (data) => data,
};

// Zustand batches nothing here, but writes are fire-and-forget promises.
const settle = () => new Promise((resolve) => setImmediate(resolve));

describe('attachPersistence', () => {
  it('writes the selected slice when the store changes', async () => {
    const documents = createMemoryDocumentStore();
    const store = counterStore();
    await attachPersistence(store, documents, COUNTER_DOC);

    store.getState().bump();
    await settle();

    expect(await documents.read('counter')).toEqual({ version: 1, data: { count: 1 } });
  });

  it('does not write on attach, so hydration is not immediately echoed back', async () => {
    const documents = createMemoryDocumentStore();
    await documents.write('counter', { version: 1, data: { count: 7 } });

    const store = counterStore();
    await attachPersistence(store, documents, COUNTER_DOC);

    expect(store.getState().count).toBe(7);
    // Still the document that was there, not a rewrite of it.
    expect(await documents.read('counter')).toEqual({ version: 1, data: { count: 7 } });
  });

  it('ignores a document written by an older shape', async () => {
    const documents = createMemoryDocumentStore();
    await documents.write('counter', { version: 0, data: { count: 99 } });

    const store = counterStore();
    await attachPersistence(store, documents, COUNTER_DOC);

    // Defaults, not a half-loaded payload from a shape that no longer exists.
    expect(store.getState().count).toBe(0);
  });

  it('leaves fields outside the slice alone', async () => {
    const documents = createMemoryDocumentStore();
    await documents.write('counter', { version: 1, data: { count: 3 } });

    const store = counterStore();
    await attachPersistence(store, documents, COUNTER_DOC);

    expect(store.getState().label).toBe('start');
    expect(typeof store.getState().bump).toBe('function');
  });

  it('stops writing once detached', async () => {
    const documents = createMemoryDocumentStore();
    const store = counterStore();
    const handle = await attachPersistence(store, documents, COUNTER_DOC);

    handle.detach();
    store.getState().bump();
    await settle();

    expect(await documents.read('counter')).toBeNull();
  });

  it('does not write when a change misses the slice', async () => {
    const documents = createMemoryDocumentStore();
    const store = counterStore();
    await attachPersistence(store, documents, COUNTER_DOC);

    store.setState({ label: 'changed' });
    await settle();

    expect(await documents.read('counter')).toBeNull();
  });
});

describe('the app documents', () => {
  const specs = [
    ['user', USER_DOCUMENT, useUserStore],
    ['nutrition', NUTRITION_DOCUMENT, useNutritionStore],
    ['scanner', SCANNER_DOCUMENT, useScannerStore],
    ['contracts', CONTRACT_DOCUMENT, useContractStore],
  ] as const;

  it.each(specs)('%s selects a slice that round-trips through JSON', (_name, spec, store) => {
    const slice = spec.select(store.getState() as never) as unknown;
    const restored = JSON.parse(JSON.stringify(slice)) as unknown;

    expect(restored).toEqual(slice);
    // A function or class instance survives structurally as {} or vanishes —
    // either way the comparison above would fail. This is the guard against
    // someone adding `provider` or `resolver` to a slice later.
    expect(JSON.stringify(slice)).not.toContain('undefined');
  });

  it('never selects the live objects the stores hold', () => {
    const scanner = SCANNER_DOCUMENT.select(useScannerStore.getState());
    expect(scanner).not.toHaveProperty('resolver');

    const nutrition = NUTRITION_DOCUMENT.select(useNutritionStore.getState());
    expect(nutrition).not.toHaveProperty('provider');
    expect(nutrition).not.toHaveProperty('generating');
  });

  it('uses a distinct key per store', () => {
    const keys = specs.map(([, spec]) => spec.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
