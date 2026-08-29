import { ProviderUnavailable } from './openFoodFacts';
import type { OffFetch } from './openFoodFacts';

/**
 * A fetch that gives up.
 *
 * Without this a hung request leaves the scanner on "Looking it up…" with the
 * camera locked and no way forward — the worst possible failure, because it
 * looks like the app is still working. The gym car park and the back of a
 * supermarket are exactly where this happens.
 *
 * Ten seconds is generous for a single JSON document and short enough that
 * someone holding a tin of beans has not given up first.
 */
export const LOOKUP_TIMEOUT_MS = 10_000;

function describeSeconds(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
}

export function createTimeoutFetch(
  underlying: typeof fetch = fetch,
  timeoutMs: number = LOOKUP_TIMEOUT_MS,
): OffFetch {
  return async (url, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await underlying(url, { headers: init?.headers, signal: controller.signal });
    } catch (cause) {
      // A timeout and a dead network arrive here the same way. Both are "the
      // database could not answer", which is a typed failure the UI already
      // knows how to show — not an exception to leak upwards.
      const aborted = cause instanceof Error && cause.name === 'AbortError';
      if (aborted) {
        throw new ProviderUnavailable(
          `The food database did not answer within ${describeSeconds(timeoutMs)}.`,
        );
      }

      // Carry the underlying reason. "Could not be reached" on its own is
      // undiagnosable in a bug report from a phone on a gym network.
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new ProviderUnavailable(`The food database could not be reached: ${reason}`);
    } finally {
      clearTimeout(timer);
    }
  };
}
