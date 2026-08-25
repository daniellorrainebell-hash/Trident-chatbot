import type { AllergenGroup } from '@/engines/food/eligibility';
import type { NutrientBasis } from '@/engines/scanner/label';
import type { NutrientVector } from '@/engines/scanner/portions';

/**
 * Product lookup abstraction (Feed spec §22, §16).
 *
 * Screens talk to `ResolvedProduct`, never to Open Food Facts, USDA or a
 * commercial provider's response shape. Swapping or adding a provider is one
 * mapper, not a change that reaches the UI.
 *
 * Provider data is community-contributed or licensed third-party data. It is
 * treated as a starting point the user confirms, never as verified fact —
 * especially for allergens (§37).
 */

export type ProductVerificationStatus =
  | 'provider_unverified'
  | 'user_confirmed'
  | 'moderator_verified'
  | 'manufacturer_verified'
  | 'rejected';

export type ProviderName = 'open_food_facts' | 'usda_fdc' | 'rabid_cache' | 'user_custom';

export type ResolvedProduct = {
  gtin: string;
  productName: string;
  brand?: string;
  packQuantity?: number;
  packUnit?: 'g' | 'ml';
  servingQuantity?: number;
  servingUnit?: 'g' | 'ml';
  basis: NutrientBasis;
  nutrients: NutrientVector;
  /** Extra label fields, where the provider supplies them. */
  sugarsG?: number;
  saturatesG?: number;
  saltG?: number;
  ingredientsText?: string;
  /** Declared allergens. Information, never a safety guarantee. */
  declaredAllergens: AllergenGroup[];
  imageUrl?: string;
  provider: ProviderName;
  providerRecordId?: string;
  retrievedAt: string;
  lastModifiedAt?: string;
  verificationStatus: ProductVerificationStatus;
  /** Attribution the licence requires us to display. */
  attribution?: string;
};

export type ProductLookupFailure =
  | { code: 'PRODUCT_NOT_FOUND'; gtin: string }
  | { code: 'BARCODE_INVALID'; raw: string }
  | { code: 'PROVIDER_RATE_LIMITED'; retryAfterSeconds?: number }
  | { code: 'PROVIDER_UNAVAILABLE'; detail: string }
  | { code: 'OFFLINE_LOOKUP_UNAVAILABLE' };

export type ProductLookupResult =
  | { ok: true; product: ResolvedProduct; fromCache: boolean }
  | { ok: false; failure: ProductLookupFailure };

/** One external data source. */
export interface FoodProductProvider {
  readonly name: ProviderName;
  lookupBarcode(gtin: string): Promise<ResolvedProduct | null>;
}

/** The cache-first chain the app actually calls. */
export interface FoodProductResolver {
  resolve(rawBarcode: string, options?: { locale?: string }): Promise<ProductLookupResult>;
}

/** Local and remote caches implement this. */
export interface ProductCache {
  get(gtin: string): Promise<ResolvedProduct | null>;
  put(product: ResolvedProduct): Promise<void>;
}

/** User-facing copy for each failure, with a recovery route (§39). */
export const LOOKUP_MESSAGES: Record<ProductLookupFailure['code'], { title: string; detail: string; action: string }> = {
  PRODUCT_NOT_FOUND: {
    title: 'Product not found',
    detail: 'This barcode is not in the database yet. You can scan the nutrition label instead.',
    action: 'Scan the label',
  },
  BARCODE_INVALID: {
    title: 'That is not a product barcode',
    detail: 'The code scanned does not look like a food barcode. Try again, or enter the food manually.',
    action: 'Scan again',
  },
  PROVIDER_RATE_LIMITED: {
    title: 'Too many lookups',
    detail: 'The food database is busy. Wait a moment and try again, or scan the label instead.',
    action: 'Scan the label',
  },
  PROVIDER_UNAVAILABLE: {
    title: 'Food database unreachable',
    detail: 'We could not reach the food database. Scanning the label works without it.',
    action: 'Scan the label',
  },
  OFFLINE_LOOKUP_UNAVAILABLE: {
    title: 'No connection',
    detail: 'Barcode lookup needs a connection. Scanning the label works offline.',
    action: 'Scan the label',
  },
};
