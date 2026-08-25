import type { AllergenGroup } from '@/engines/food/eligibility';
import type { NutrientBasis } from '@/engines/scanner/label';
import type { FoodProductProvider, ResolvedProduct } from './types';

/**
 * Open Food Facts v2 mapper (Feed spec §16.4).
 *
 * Community-contributed data: frequently incomplete, occasionally wrong, and
 * governed by the Open Database Licence. Three consequences this file honours:
 *
 *   - Every product comes back `provider_unverified`. The user confirms it
 *     against the physical packaging before it can affect a plan.
 *   - Attribution travels with the record, because the licence requires it.
 *   - Missing fields stay missing. A product with no protein figure is not a
 *     product with zero protein.
 *
 * Whether OFF data can be redistributed inside a closed database needs legal
 * review before launch — the ODbL share-alike terms are not a formality.
 */

export const OFF_ATTRIBUTION = 'Product data from Open Food Facts, licensed under the ODbL.';

const OFF_FIELDS = [
  'code', 'product_name', 'brands', 'quantity', 'serving_size',
  'nutrition_data_per', 'nutriments', 'allergens_tags',
  'ingredients_text', 'categories_tags', 'image_front_url',
  'image_nutrition_url', 'last_modified_t',
].join(',');

export function buildOffUrl(gtin: string, baseUrl = 'https://world.openfoodfacts.org'): string {
  return `${baseUrl}/api/v2/product/${encodeURIComponent(gtin)}.json?fields=${OFF_FIELDS}`;
}

/** OFF allergen tags map onto the formal UK regulated groups. */
const ALLERGEN_MAP: Record<string, AllergenGroup> = {
  celery: 'celery',
  gluten: 'cereals_containing_gluten',
  crustaceans: 'crustaceans',
  eggs: 'eggs',
  fish: 'fish',
  lupin: 'lupin',
  milk: 'milk',
  molluscs: 'molluscs',
  mustard: 'mustard',
  peanuts: 'peanuts',
  sesame: 'sesame',
  'sesame-seeds': 'sesame',
  soybeans: 'soybeans',
  soy: 'soybeans',
  sulphur: 'sulphites',
  'sulphur-dioxide-and-sulphites': 'sulphites',
  nuts: 'tree_nuts',
  'tree-nuts': 'tree_nuts',
};

export function mapAllergenTags(tags: string[] | undefined): AllergenGroup[] {
  if (!tags) return [];
  const found = new Set<AllergenGroup>();
  for (const tag of tags) {
    // Tags arrive locale-prefixed, e.g. "en:milk".
    const bare = tag.includes(':') ? tag.split(':').slice(1).join(':') : tag;
    const mapped = ALLERGEN_MAP[bare.toLowerCase()];
    if (mapped) found.add(mapped);
  }
  return [...found];
}

export type OffNutriments = Record<string, number | string | undefined>;

export type OffProductResponse = {
  status?: number;
  code?: string;
  product?: {
    code?: string;
    product_name?: string;
    brands?: string;
    quantity?: string;
    serving_size?: string;
    nutrition_data_per?: string;
    nutriments?: OffNutriments;
    allergens_tags?: string[];
    ingredients_text?: string;
    categories_tags?: string[];
    image_front_url?: string;
    last_modified_t?: number;
  };
};

function num(value: number | string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** "500 g", "1.5kg", "330ml" → a quantity and unit in grams or millilitres. */
export function parseQuantity(text: string | undefined): { value: number; unit: 'g' | 'ml' } | undefined {
  if (!text) return undefined;
  const match = text.replace(/,/g, '.').match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|cl)\b/i);
  if (!match) return undefined;

  const value = Number.parseFloat(match[1]!);
  const unit = match[2]!.toLowerCase();

  switch (unit) {
    case 'kg': return { value: value * 1000, unit: 'g' };
    case 'g': return { value, unit: 'g' };
    case 'l': return { value: value * 1000, unit: 'ml' };
    case 'cl': return { value: value * 10, unit: 'ml' };
    case 'ml': return { value, unit: 'ml' };
    default: return undefined;
  }
}

function basisFrom(product: NonNullable<OffProductResponse['product']>): NutrientBasis {
  if (product.nutrition_data_per === 'serving') return 'per_serving';
  const quantity = parseQuantity(product.quantity);
  return quantity?.unit === 'ml' ? 'per_100ml' : 'per_100g';
}

/**
 * Map an OFF response into the internal shape.
 *
 * Returns null when the record lacks the four figures a plan cannot work
 * without. A half-populated product is worse than no product, because it looks
 * usable right up until the totals are wrong.
 */
export function mapOffProduct(response: OffProductResponse, gtin: string): ResolvedProduct | null {
  const product = response.product;
  if (!product || response.status === 0) return null;

  const n = product.nutriments ?? {};
  const kcal = num(n['energy-kcal_100g']) ?? num(n['energy-kcal_serving']) ?? num(n['energy-kcal']);
  const protein = num(n['proteins_100g']) ?? num(n['proteins_serving']) ?? num(n['proteins']);
  const carbs = num(n['carbohydrates_100g']) ?? num(n['carbohydrates_serving']) ?? num(n['carbohydrates']);
  const fat = num(n['fat_100g']) ?? num(n['fat_serving']) ?? num(n['fat']);

  if (kcal === undefined || protein === undefined || carbs === undefined || fat === undefined) {
    return null;
  }

  const pack = parseQuantity(product.quantity);
  const serving = parseQuantity(product.serving_size);

  return {
    gtin: product.code ?? gtin,
    productName: product.product_name?.trim() || 'Unnamed product',
    brand: product.brands?.split(',')[0]?.trim(),
    packQuantity: pack?.value,
    packUnit: pack?.unit,
    servingQuantity: serving?.value,
    servingUnit: serving?.unit,
    basis: basisFrom(product),
    nutrients: {
      kcal,
      protein,
      carbs,
      fat,
      fibre: num(n['fiber_100g']) ?? num(n['fiber']),
    },
    sugarsG: num(n['sugars_100g']) ?? num(n['sugars']),
    saturatesG: num(n['saturated-fat_100g']) ?? num(n['saturated-fat']),
    saltG: num(n['salt_100g']) ?? num(n['salt']),
    ingredientsText: product.ingredients_text?.trim() || undefined,
    declaredAllergens: mapAllergenTags(product.allergens_tags),
    imageUrl: product.image_front_url,
    provider: 'open_food_facts',
    providerRecordId: product.code,
    retrievedAt: new Date().toISOString(),
    lastModifiedAt: product.last_modified_t
      ? new Date(product.last_modified_t * 1000).toISOString()
      : undefined,
    // Never anything else on arrival. The user confirms it.
    verificationStatus: 'provider_unverified',
    attribution: OFF_ATTRIBUTION,
  };
}

export type OffFetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

/**
 * The provider.
 *
 * The User-Agent is required by Open Food Facts and must identify the app with
 * contact details. Calls should be proxied server-side in production so that
 * rate limits are managed centrally rather than discovered per device.
 */
export class OpenFoodFactsProvider implements FoodProductProvider {
  readonly name = 'open_food_facts' as const;

  constructor(
    private readonly fetcher: OffFetch,
    private readonly userAgent: string,
    private readonly baseUrl = 'https://world.openfoodfacts.org',
  ) {}

  async lookupBarcode(gtin: string): Promise<ResolvedProduct | null> {
    const response = await this.fetcher(buildOffUrl(gtin, this.baseUrl), {
      headers: { 'User-Agent': this.userAgent, Accept: 'application/json' },
    });

    if (response.status === 404) return null;
    if (response.status === 429) {
      throw new ProviderRateLimited('Open Food Facts rate limit reached.');
    }
    if (!response.ok) {
      throw new ProviderUnavailable(`Open Food Facts returned ${response.status}.`);
    }

    const body = (await response.json()) as OffProductResponse;
    return mapOffProduct(body, gtin);
  }
}

export class ProviderRateLimited extends Error {
  constructor(message: string, readonly retryAfterSeconds?: number) {
    super(message);
    this.name = 'ProviderRateLimited';
  }
}

export class ProviderUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderUnavailable';
  }
}
