import {
  addManualItem,
  aggregationKey,
  applyPackMath,
  attachProduct,
  buildShoppingList,
  describeQuantity,
  formatQuantity,
  groupItems,
  listProgress,
  packsFor,
  setStatus,
  type IngredientLine,
  type ShoppingListItem,
} from './shoppingList';

let counter = 0;
const makeId = () => `item-${(counter += 1)}`;
beforeEach(() => { counter = 0; });

function line(overrides: Partial<IngredientLine> = {}): IngredientLine {
  return {
    foodItemId: 'chicken',
    displayName: 'Chicken breast',
    group: 'meat_fish',
    quantity: 180,
    unit: 'g',
    state: 'raw',
    ...overrides,
  };
}

describe('aggregation', () => {
  it('sums the same food in the same state', () => {
    const items = buildShoppingList([line(), line({ quantity: 220 })], { makeId });
    expect(items).toHaveLength(1);
    expect(items[0]!.requiredQuantity).toBe(400);
  });

  it('keeps raw and cooked as separate lines', () => {
    const items = buildShoppingList(
      [line({ state: 'raw' }), line({ state: 'cooked' })],
      { makeId },
    );
    expect(items).toHaveLength(2);
  });

  it('keeps dry and cooked rice separate', () => {
    const items = buildShoppingList([
      line({ foodItemId: 'rice', displayName: 'Rice', group: 'carbohydrates', state: 'dry', quantity: 75 }),
      line({ foodItemId: 'rice', displayName: 'Rice', group: 'carbohydrates', state: 'cooked', quantity: 200 }),
    ], { makeId });
    expect(items).toHaveLength(2);
  });

  it('keeps drained and undrained tuna separate', () => {
    const items = buildShoppingList([
      line({ foodItemId: 'tuna', displayName: 'Tuna', state: 'drained', quantity: 110 }),
      line({ foodItemId: 'tuna', displayName: 'Tuna', state: 'as_sold', quantity: 145 }),
    ], { makeId });
    expect(items).toHaveLength(2);
  });

  it('does not merge grams and millilitres', () => {
    const items = buildShoppingList([
      line({ foodItemId: 'oil', displayName: 'Olive oil', group: 'pantry', unit: 'g', quantity: 30 }),
      line({ foodItemId: 'oil', displayName: 'Olive oil', group: 'pantry', unit: 'ml', quantity: 30 }),
    ], { makeId });
    expect(items).toHaveLength(2);
  });

  it('keys a branded-only line separately from a generic food', () => {
    expect(aggregationKey({ foodItemId: 'rice', foodState: 'dry', requiredUnit: 'g' }))
      .not.toBe(aggregationKey({ brandedProductId: 'brand-x', requiredUnit: 'g' }));
  });

  it('keeps a generic line\'s identity when a product is attached to it', () => {
    // The plan still needs dry rice; the brand is how it gets bought. Keying on
    // the brand would change the line's identity and lose the attachment on the
    // next rebuild.
    const generic = { foodItemId: 'rice', foodState: 'dry' as const, requiredUnit: 'g' };
    expect(aggregationKey({ ...generic, brandedProductId: 'brand-x' })).toBe(aggregationKey(generic));
  });
});

describe('pack maths', () => {
  it('rounds packs upward', () => {
    expect(packsFor(840, 1000)).toBe(1);
    expect(packsFor(1200, 1000)).toBe(2);
    expect(packsFor(2000, 1000)).toBe(2);
  });

  it('computes the purchase quantity from whole packs', () => {
    const item = applyPackMath({
      id: 'a', displayName: 'Basmati rice', group: 'carbohydrates',
      requiredQuantity: 840, requiredUnit: 'g', foodState: 'dry',
      packQuantity: 1000, packUnit: 'g', checkedStatus: 'unchecked', manuallyAdded: false,
    });
    expect(item.packsRequired).toBe(1);
    expect(item.purchaseQuantity).toBe(1000);
  });

  it('shows only the required quantity when there is no pack data', () => {
    const item = applyPackMath({
      id: 'a', displayName: 'Chicken breast', group: 'meat_fish',
      requiredQuantity: 1260, requiredUnit: 'g', foodState: 'raw',
      checkedStatus: 'unchecked', manuallyAdded: false,
    });
    expect(item.packsRequired).toBeUndefined();
    expect(describeQuantity(item).purchase).toBeUndefined();
  });

  it('describes required and purchase quantities the way the spec shows', () => {
    const item = applyPackMath({
      id: 'a', displayName: 'Basmati rice', group: 'carbohydrates',
      requiredQuantity: 840, requiredUnit: 'g', foodState: 'dry',
      packQuantity: 1000, packUnit: 'g', checkedStatus: 'unchecked', manuallyAdded: false,
    });
    const described = describeQuantity(item);
    expect(described.required).toBe('840g dry');
    expect(described.purchase).toBe('1 × 1kg');
  });
});

describe('formatQuantity', () => {
  it('switches to kilograms and litres above 1000', () => {
    expect(formatQuantity(1400, 'g')).toBe('1.4kg');
    expect(formatQuantity(1500, 'ml')).toBe('1.5l');
    expect(formatQuantity(900, 'g')).toBe('900g');
  });
});

describe('recomputation after a meal swap', () => {
  const before = buildShoppingList([
    line(),
    line({ foodItemId: 'rice', displayName: 'Rice', group: 'carbohydrates', state: 'dry', quantity: 75 }),
  ], { makeId });

  it('preserves tick state for items that survive', () => {
    const ticked = setStatus(before, before[0]!.id, 'acquired');
    const after = buildShoppingList([line(), line({ foodItemId: 'rice', displayName: 'Rice', group: 'carbohydrates', state: 'dry', quantity: 90 })], {
      makeId, previous: ticked,
    });

    const chicken = after.find((i) => i.foodItemId === 'chicken')!;
    expect(chicken.checkedStatus).toBe('acquired');
  });

  it('preserves the item id so the UI does not lose its place', () => {
    const after = buildShoppingList([line()], { makeId, previous: before });
    expect(after.find((i) => i.foodItemId === 'chicken')!.id).toBe(before[0]!.id);
  });

  it('keeps manually added items', () => {
    const withManual = addManualItem(before, {
      displayName: 'Coffee', group: 'pantry', requiredQuantity: 1, requiredUnit: 'item',
    }, makeId);

    const after = buildShoppingList([line()], { makeId, previous: withManual });
    expect(after.some((i) => i.displayName === 'Coffee' && i.manuallyAdded)).toBe(true);
  });

  it('flags an acquired item the plan no longer needs rather than deleting it', () => {
    const ticked = setStatus(before, before[1]!.id, 'acquired');
    // Rice drops out of the plan entirely.
    const after = buildShoppingList([line()], { makeId, previous: ticked });

    const rice = after.find((i) => i.foodItemId === 'rice');
    expect(rice).toBeDefined();
    expect(rice!.noLongerRequired).toBe(true);
  });

  it('quietly drops an unticked item the plan no longer needs', () => {
    const after = buildShoppingList([line()], { makeId, previous: before });
    expect(after.find((i) => i.foodItemId === 'rice')).toBeUndefined();
  });

  it('recomputes quantities rather than accumulating them', () => {
    const after = buildShoppingList([line({ quantity: 500 })], { makeId, previous: before });
    expect(after.find((i) => i.foodItemId === 'chicken')!.requiredQuantity).toBe(500);
  });

  it('keeps an attached product across a rebuild', () => {
    const attached = attachProduct(before, before[1]!.id, {
      brandedProductId: 'brand-rice', displayName: 'Brand X basmati', packQuantity: 1000, packUnit: 'g',
    });

    const after = buildShoppingList([
      line(),
      line({ foodItemId: 'rice', displayName: 'Rice', group: 'carbohydrates', state: 'dry', quantity: 90 }),
    ], { makeId, previous: attached });

    const rice = after.find((i) => i.foodItemId === 'rice')!;
    expect(rice.brandedProductId).toBe('brand-rice');
    expect(rice.packsRequired).toBe(1);
  });
});

describe('grouping and progress', () => {
  const items = buildShoppingList([
    line(),
    line({ foodItemId: 'rice', displayName: 'Rice', group: 'carbohydrates', state: 'dry', quantity: 75 }),
    line({ foodItemId: 'broccoli', displayName: 'Broccoli', group: 'fruit_vegetables', quantity: 300 }),
  ], { makeId });

  it('groups in aisle order', () => {
    const groups = groupItems(items).map((g) => g.group);
    expect(groups).toEqual(['meat_fish', 'fruit_vegetables', 'carbohydrates']);
  });

  it('omits groups with nothing in them', () => {
    expect(groupItems(items).some((g) => g.group === 'frozen')).toBe(false);
  });

  it('counts acquired and substituted toward progress', () => {
    let list = setStatus(items, items[0]!.id, 'acquired');
    list = setStatus(list, items[1]!.id, 'substituted');
    expect(listProgress(list)).toMatchObject({ total: 3, acquired: 2 });
  });

  it('does not count unavailable as acquired', () => {
    const list = setStatus(items, items[0]!.id, 'unavailable');
    expect(listProgress(list).acquired).toBe(0);
  });

  it('excludes no-longer-required items from progress', () => {
    const withOrphan: ShoppingListItem[] = [...items, { ...items[0]!, id: 'orphan', noLongerRequired: true }];
    expect(listProgress(withOrphan).total).toBe(3);
  });
});
