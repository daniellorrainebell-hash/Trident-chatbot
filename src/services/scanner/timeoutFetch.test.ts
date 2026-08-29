import { createTimeoutFetch, LOOKUP_TIMEOUT_MS } from './timeoutFetch';
import { ProviderUnavailable } from './openFoodFacts';

function response(): Response {
  return { ok: true, status: 200, json: async () => ({}) } as unknown as Response;
}

describe('createTimeoutFetch', () => {
  it('passes a successful response straight through', async () => {
    const fetcher = createTimeoutFetch(async () => response());
    await expect(fetcher('https://example.test')).resolves.toMatchObject({ status: 200 });
  });

  it('forwards the headers the provider set', async () => {
    let seen: Record<string, string> | undefined;
    const fetcher = createTimeoutFetch(async (_url, init) => {
      seen = init?.headers as Record<string, string>;
      return response();
    });

    await fetcher('https://example.test', { headers: { 'User-Agent': 'test/1.0' } });
    expect(seen).toEqual({ 'User-Agent': 'test/1.0' });
  });

  it('aborts a request that never answers', async () => {
    // The failure this exists to prevent: the scanner sitting on
    // "Looking it up..." with the camera locked and no way forward.
    const hang: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });

    const fetcher = createTimeoutFetch(hang, 20);
    await expect(fetcher('https://example.test')).rejects.toBeInstanceOf(ProviderUnavailable);
  });

  it('says how long it waited, and counts in English', async () => {
    const hang: typeof fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });

    await expect(createTimeoutFetch(hang, 30)('https://example.test')).rejects.toThrow(
      // Never "within 0 seconds", and never "within 1 seconds".
      /within 1 second\./,
    );
  });

  it('reports a dead network as a typed provider failure, not a raw error', async () => {
    const dead: typeof fetch = async () => {
      throw new TypeError('Network request failed');
    };

    // The resolver only knows how to turn ProviderUnavailable into a screen.
    // A raw TypeError would fall into its unknown-error branch instead.
    await expect(createTimeoutFetch(dead)('https://example.test')).rejects.toBeInstanceOf(
      ProviderUnavailable,
    );
  });

  it('carries the underlying reason, so a field report is diagnosable', async () => {
    const dead: typeof fetch = async () => {
      throw new TypeError('Load failed: CORS');
    };
    await expect(createTimeoutFetch(dead)('https://example.test')).rejects.toThrow(/CORS/);
  });

  it('clears its timer once the request settles', async () => {
    // A leaked timer keeps the JS runtime awake; jest would warn on an open
    // handle. Resolving normally must not leave one behind.
    const fetcher = createTimeoutFetch(async () => response(), 50_000);
    await fetcher('https://example.test');
    expect(LOOKUP_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
