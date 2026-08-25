import {
  OpenFoodFactsProvider,
  ProviderRateLimited,
  ProviderUnavailable,
  buildOffUrl,
  mapAllergenTags,
  mapOffProduct,
  parseQuantity,
  type OffProductResponse,
} from './openFoodFacts';
import { CachedProductResolver, MemoryProductCache } from './resolver';
import type { FoodProductProvider, ResolvedProduct } from './types';

/** A realistic OFF payload for a UK product. */
const OFF_RESPONSE: OffProductResponse = {
  status: 1,
  code: '5000108453703',
  product: {
    code: '5000108453703',
    product_name: 'Porridge Oats',
    brands: 'Quaker, PepsiCo',
    quantity: '1kg',
    serving_size: '40 g',
    nutrition_data_per: '100g',
    nutriments: {
      'energy-kcal_100g': 372,
      proteins_100g: 11,
      carbohydrates_100g: 60,
      fat_100g: 8,
      fiber_100g: 9,
      sugars_100g: 1.1,
      'saturated-fat_100g': 1.6,
      salt_100g: 0.02,
    },
    allergens_tags: ['en:gluten'],
    ingredients_text: 'Wholegrain rolled oats',
    image_front_url: 'https://images.example/front.jpg',
    last_modified_t: 1_700_000_000,
  },
};

describe('buildOffUrl', () => {
  it('requests only the fields we map', () => {
    const url = buildOffUrl('5000108453703');
    expect(url).toContain('/api/v2/product/5000108453703.json');
    expect(url).toContain('nutriments');
    expect(url).toContain('allergens_tags');
  });

  it('encodes the barcode', () => {
    expect(buildOffUrl('50001 08453705')).toContain('50001%2008453705');
  });
});

describe('parseQuantity', () => {
  it('normalises kilograms and litres to grams and millilitres', () => {
    expect(parseQuantity('1kg')).toEqual({ value: 1000, unit: 'g' });
    expect(parseQuantity('1.5 L')).toEqual({ value: 1500, unit: 'ml' });
    expect(parseQuantity('33cl')).toEqual({ value: 330, unit: 'ml' });
  });

  it('reads plain grams and millilitres', () => {
    expect(parseQuantity('500 g')).toEqual({ value: 500, unit: 'g' });
    expect(parseQuantity('330ml')).toEqual({ value: 330, unit: 'ml' });
  });

  it('returns undefined for something unparseable', () => {
    expect(parseQuantity('family pack')).toBeUndefined();
    expect(parseQuantity(undefined)).toBeUndefined();
  });
});

describe('mapAllergenTags', () => {
  it('maps locale-prefixed tags onto the formal UK groups', () => {
    expect(mapAllergenTags(['en:gluten', 'en:milk'])).toEqual(
      expect.arrayContaining(['cereals_containing_gluten', 'milk']),
    );
  });

  it('folds synonyms onto one group', () => {
    expect(mapAllergenTags(['en:soy', 'en:soybeans'])).toEqual(['soybeans']);
  });

  it('ignores tags it does not recognise', () => {
    expect(mapAllergenTags(['en:unicorn'])).toEqual([]);
  });

  it('handles a missing tag list', () => {
    expect(mapAllergenTags(undefined)).toEqual([]);
  });
});

describe('mapOffProduct', () => {
  it('maps a complete product into the internal shape', () => {
    const product = mapOffProduct(OFF_RESPONSE, '5000108453703')!;

    expect(product.productName).toBe('Porridge Oats');
    expect(product.brand).toBe('Quaker');
    expect(product.packQuantity).toBe(1000);
    expect(product.servingQuantity).toBe(40);
    expect(product.basis).toBe('per_100g');
    expect(product.nutrients).toMatchObject({ kcal: 372, protein: 11, carbs: 60, fat: 8 });
    expect(product.declaredAllergens).toEqual(['cereals_containing_gluten']);
  });

  it('always arrives unverified, whatever the provider says', () => {
    expect(mapOffProduct(OFF_RESPONSE, '5000108453703')!.verificationStatus).toBe('provider_unverified');
  });

  it('carries the licence attribution', () => {
    expect(mapOffProduct(OFF_RESPONSE, '5000108453703')!.attribution).toMatch(/ODbL/);
  });

  it('rejects a record missing any of the four figures a plan needs', () => {
    const incomplete: OffProductResponse = {
      status: 1,
      product: { ...OFF_RESPONSE.product, nutriments: { 'energy-kcal_100g': 372, proteins_100g: 11 } },
    };
    // Half a product is worse than none — it looks usable until totals go wrong.
    expect(mapOffProduct(incomplete, '5000108453703')).toBeNull();
  });

  it('does not read a missing nutrient as zero', () => {
    const noFibre: OffProductResponse = {
      status: 1,
      product: {
        ...OFF_RESPONSE.product,
        nutriments: { 'energy-kcal_100g': 372, proteins_100g: 11, carbohydrates_100g: 60, fat_100g: 8 },
      },
    };
    expect(mapOffProduct(noFibre, '5000108453703')!.nutrients.fibre).toBeUndefined();
  });

  it('returns null when the product does not exist', () => {
    expect(mapOffProduct({ status: 0 }, '0000000000000')).toBeNull();
  });

  it('detects a per-serving basis', () => {
    const perServing: OffProductResponse = {
      status: 1,
      product: { ...OFF_RESPONSE.product, nutrition_data_per: 'serving' },
    };
    expect(mapOffProduct(perServing, '5000108453703')!.basis).toBe('per_serving');
  });

  it('detects a millilitre product', () => {
    const drink: OffProductResponse = {
      status: 1,
      product: { ...OFF_RESPONSE.product, quantity: '330ml' },
    };
    expect(mapOffProduct(drink, '5000108453703')!.basis).toBe('per_100ml');
  });
});

describe('OpenFoodFactsProvider', () => {
  const ok = async () => ({ ok: true, status: 200, json: async () => OFF_RESPONSE });

  it('sends the required User-Agent', async () => {
    let seen: Record<string, string> | undefined;
    const provider = new OpenFoodFactsProvider(
      async (_url, init) => { seen = init?.headers; return { ok: true, status: 200, json: async () => OFF_RESPONSE }; },
      'RabidTheKennel/1.0 (contact@example.com)',
    );

    await provider.lookupBarcode('5000108453703');
    expect(seen?.['User-Agent']).toMatch(/RabidTheKennel/);
  });

  it('returns a mapped product', async () => {
    const provider = new OpenFoodFactsProvider(ok, 'ua');
    expect((await provider.lookupBarcode('5000108453703'))?.productName).toBe('Porridge Oats');
  });

  it('returns null on 404 rather than throwing', async () => {
    const provider = new OpenFoodFactsProvider(
      async () => ({ ok: false, status: 404, json: async () => ({}) }), 'ua',
    );
    expect(await provider.lookupBarcode('0000000000000')).toBeNull();
  });

  it('throws a typed error when rate limited', async () => {
    const provider = new OpenFoodFactsProvider(
      async () => ({ ok: false, status: 429, json: async () => ({}) }), 'ua',
    );
    await expect(provider.lookupBarcode('5000108453703')).rejects.toBeInstanceOf(ProviderRateLimited);
  });

  it('throws a typed error when the service is down', async () => {
    const provider = new OpenFoodFactsProvider(
      async () => ({ ok: false, status: 503, json: async () => ({}) }), 'ua',
    );
    await expect(provider.lookupBarcode('5000108453703')).rejects.toBeInstanceOf(ProviderUnavailable);
  });
});

describe('CachedProductResolver', () => {
  const product = mapOffProduct(OFF_RESPONSE, '5000108453703')!;
  const VALID = '5000108453703';

  function stubProvider(result: ResolvedProduct | null, calls = { count: 0 }): FoodProductProvider {
    return {
      name: 'open_food_facts',
      async lookupBarcode() { calls.count += 1; return result; },
    };
  }

  it('rejects a non-product barcode before any network call', async () => {
    const calls = { count: 0 };
    const resolver = new CachedProductResolver([], [stubProvider(product, calls)]);

    const result = await resolver.resolve('https://example.com');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.code).toBe('BARCODE_INVALID');
    expect(calls.count).toBe(0);
  });

  it('serves a cache hit without calling the provider', async () => {
    const cache = new MemoryProductCache();
    await cache.put(product);
    const calls = { count: 0 };

    const result = await new CachedProductResolver([cache], [stubProvider(product, calls)]).resolve(VALID);

    expect(result).toMatchObject({ ok: true, fromCache: true });
    expect(calls.count).toBe(0);
  });

  it('writes a provider result into the cache', async () => {
    const cache = new MemoryProductCache();
    const resolver = new CachedProductResolver([cache], [stubProvider(product)]);

    await resolver.resolve(VALID);
    expect(cache.size).toBe(1);
    expect((await resolver.resolve(VALID)) as { fromCache: boolean }).toMatchObject({ fromCache: true });
  });

  it('promotes a slower cache hit into the faster cache in front of it', async () => {
    const fast = new MemoryProductCache();
    const slow = new MemoryProductCache();
    await slow.put(product);

    await new CachedProductResolver([fast, slow], []).resolve(VALID);
    expect(fast.size).toBe(1);
  });

  it('reports product-not-found when no provider has it', async () => {
    const result = await new CachedProductResolver([], [stubProvider(null)]).resolve(VALID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('falls through to the next provider when the first is rate limited', async () => {
    const failing: FoodProductProvider = {
      name: 'open_food_facts',
      async lookupBarcode() { throw new ProviderRateLimited('busy'); },
    };
    const result = await new CachedProductResolver([], [failing, stubProvider(product)]).resolve(VALID);
    expect(result.ok).toBe(true);
  });

  it('reports rate limiting when every provider is limited', async () => {
    const failing: FoodProductProvider = {
      name: 'open_food_facts',
      async lookupBarcode() { throw new ProviderRateLimited('busy'); },
    };
    const result = await new CachedProductResolver([], [failing]).resolve(VALID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.code).toBe('PROVIDER_RATE_LIMITED');
  });

  it('reports offline rather than pretending the product does not exist', async () => {
    const calls = { count: 0 };
    const resolver = new CachedProductResolver([], [stubProvider(product, calls)], () => false);

    const result = await resolver.resolve(VALID);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure.code).toBe('OFFLINE_LOOKUP_UNAVAILABLE');
    expect(calls.count).toBe(0);
  });

  it('still serves a cached product while offline', async () => {
    const cache = new MemoryProductCache();
    await cache.put(product);
    const result = await new CachedProductResolver([cache], [], () => false).resolve(VALID);
    expect(result.ok).toBe(true);
  });

  it('never lets a cache write failure break the lookup', async () => {
    const broken: import('./types').ProductCache = {
      async get() { return null; },
      async put() { throw new Error('disk full'); },
    };
    const result = await new CachedProductResolver([broken], [stubProvider(product)]).resolve(VALID);
    expect(result.ok).toBe(true);
  });
});
