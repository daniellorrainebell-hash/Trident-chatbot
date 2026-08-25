import { isPlausibleProductBarcode, normaliseBarcode } from '@/engines/scanner/barcode';
import { ProviderRateLimited, ProviderUnavailable } from './openFoodFacts';
import type {
  FoodProductProvider,
  FoodProductResolver,
  ProductCache,
  ProductLookupResult,
} from './types';

/**
 * Cache-first barcode resolution (Feed spec §22).
 *
 * Lookup order: device cache, then the shared RABID cache, then providers in
 * configured order. Each layer that answers writes back to the ones in front of
 * it, so a product looked up once is free afterwards.
 *
 * The chain never throws. Every outcome is a typed result, because "the food
 * database is busy" and "this product does not exist" need different screens.
 */
export class CachedProductResolver implements FoodProductResolver {
  constructor(
    private readonly caches: ProductCache[],
    private readonly providers: FoodProductProvider[],
    private readonly isOnline: () => boolean = () => true,
  ) {}

  async resolve(rawBarcode: string): Promise<ProductLookupResult> {
    const normalised = normaliseBarcode(rawBarcode);

    // Reject before spending a network call on something that is not a product.
    if (!isPlausibleProductBarcode(normalised)) {
      return { ok: false, failure: { code: 'BARCODE_INVALID', raw: rawBarcode } };
    }

    const { gtin } = normalised;

    for (let i = 0; i < this.caches.length; i += 1) {
      const hit = await this.caches[i]!.get(gtin);
      if (hit) {
        // Promote into the faster caches ahead of this one.
        await this.writeTo(this.caches.slice(0, i), hit);
        return { ok: true, product: hit, fromCache: true };
      }
    }

    if (!this.isOnline()) {
      return { ok: false, failure: { code: 'OFFLINE_LOOKUP_UNAVAILABLE' } };
    }

    let lastFailure: ProductLookupResult | null = null;

    for (const provider of this.providers) {
      try {
        const product = await provider.lookupBarcode(gtin);
        if (product) {
          await this.writeTo(this.caches, product);
          return { ok: true, product, fromCache: false };
        }
      } catch (error) {
        // A provider being rate-limited or down is not a dead end — try the
        // next one, and only report the problem if none of them answer.
        if (error instanceof ProviderRateLimited) {
          lastFailure = {
            ok: false,
            failure: { code: 'PROVIDER_RATE_LIMITED', retryAfterSeconds: error.retryAfterSeconds },
          };
        } else if (error instanceof ProviderUnavailable) {
          lastFailure = { ok: false, failure: { code: 'PROVIDER_UNAVAILABLE', detail: error.message } };
        } else {
          lastFailure = {
            ok: false,
            failure: { code: 'PROVIDER_UNAVAILABLE', detail: 'Unexpected provider error.' },
          };
        }
      }
    }

    return lastFailure ?? { ok: false, failure: { code: 'PRODUCT_NOT_FOUND', gtin } };
  }

  private async writeTo(caches: ProductCache[], product: ResolvedProductLike): Promise<void> {
    // A cache write failing must never fail the lookup the user is waiting on.
    await Promise.all(
      caches.map(async (cache) => {
        try {
          await cache.put(product);
        } catch {
          /* best effort */
        }
      }),
    );
  }
}

type ResolvedProductLike = Parameters<ProductCache['put']>[0];

/** Simple in-memory cache, used on device in front of SQLite. */
export class MemoryProductCache implements ProductCache {
  private readonly store = new Map<string, ResolvedProductLike>();

  async get(gtin: string) {
    return this.store.get(gtin) ?? null;
  }

  async put(product: ResolvedProductLike) {
    this.store.set(product.gtin, product);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
