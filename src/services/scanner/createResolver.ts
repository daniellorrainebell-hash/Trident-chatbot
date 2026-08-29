import Constants from 'expo-constants';
import { CachedProductResolver, MemoryProductCache } from './resolver';
import { OpenFoodFactsProvider } from './openFoodFacts';
import { createTimeoutFetch } from './timeoutFetch';
import { sqliteProductCache } from '@/services/storage/productCache';
import { isOnline } from '@/services/network/connectivity';

/**
 * The lookup chain the app actually runs (Feed spec §22).
 *
 * Until this existed the store built a resolver with an empty provider list, so
 * a perfectly scanned barcode went: memory miss, no providers, "product not
 * found". The scanner was correct and could not succeed.
 *
 * Order matters. Memory answers a re-scan of the thing already in your hand;
 * SQLite answers yesterday's shop with no signal; only then does anything leave
 * the device. Each layer that answers is promoted into the ones in front of it.
 */

/**
 * Open Food Facts asks every client to identify itself, and rate-limits ones
 * that do not. The bundle identifier is used as the contact because it is true
 * — a support address should replace it before this sends production traffic.
 */
export function offUserAgent(): string {
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const bundleId =
    Constants.expoConfig?.ios?.bundleIdentifier ??
    Constants.expoConfig?.android?.package ??
    'com.rabidgymwear.kennel';
  return `RabidTheKennel/${version} (${bundleId})`;
}

export function createProductResolver(): CachedProductResolver {
  return new CachedProductResolver(
    [new MemoryProductCache(), sqliteProductCache],
    [new OpenFoodFactsProvider(createTimeoutFetch(), offUserAgent())],
    isOnline,
  );
}
