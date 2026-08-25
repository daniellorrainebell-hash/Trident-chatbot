import type { FoodState } from '@/types';

/**
 * Shopping-list aggregation (Feed spec §29).
 *
 * Two rules do most of the work here:
 *
 *   1. Aggregation identity is food + state + unit. Raw and cooked chicken are
 *      not the same line, dry and cooked rice are not the same line, and
 *      drained tuna is not undrained tuna. Merging them produces a list that
 *      buys the wrong amount of food.
 *   2. Recomputation preserves what the user did. Tick states, manual
 *      additions and attached products survive a meal swap — losing a ticked
 *      list because someone changed Tuesday's lunch is unforgivable.
 */

export type ShoppingGroup =
  | 'meat_fish' | 'dairy_chilled' | 'carbohydrates' | 'fruit_vegetables'
  | 'pantry' | 'frozen' | 'supplements' | 'other';

export const SHOPPING_GROUP_LABELS: Record<ShoppingGroup, string> = {
  meat_fish: 'Meat & fish',
  dairy_chilled: 'Dairy & chilled',
  carbohydrates: 'Carbohydrates',
  fruit_vegetables: 'Fruit & vegetables',
  pantry: 'Pantry',
  frozen: 'Frozen',
  supplements: 'Supplements',
  other: 'Other',
};

export const SHOPPING_GROUP_ORDER: ShoppingGroup[] = [
  'meat_fish', 'fruit_vegetables', 'carbohydrates', 'dairy_chilled',
  'frozen', 'pantry', 'supplements', 'other',
];

/** Five states, because "did you get it" has more than two answers in a shop. */
export type CheckedStatus =
  | 'unchecked'
  | 'partially_acquired'
  | 'acquired'
  | 'unavailable'
  | 'substituted';

export const CHECKED_STATUS_LABELS: Record<CheckedStatus, string> = {
  unchecked: 'To get',
  partially_acquired: 'Part got',
  acquired: 'Got it',
  unavailable: 'Not in stock',
  substituted: 'Swapped',
};

export type ShoppingListItem = {
  id: string;
  foodItemId?: string;
  brandedProductId?: string;
  displayName: string;
  group: ShoppingGroup;
  requiredQuantity: number;
  requiredUnit: 'g' | 'ml' | 'item';
  foodState?: FoodState;
  /** Pack size of the chosen product, when one is attached. */
  packQuantity?: number;
  packUnit?: 'g' | 'ml';
  packsRequired?: number;
  purchaseQuantity?: number;
  checkedStatus: CheckedStatus;
  manuallyAdded: boolean;
  /** True when the plan no longer needs an item the user already has. */
  noLongerRequired?: boolean;
  note?: string;
};

export type IngredientLine = {
  foodItemId: string;
  displayName: string;
  group: ShoppingGroup;
  quantity: number;
  unit: 'g' | 'ml' | 'item';
  state: FoodState;
};

/**
 * Aggregation key.
 *
 * State is part of the identity, not a display detail. 500g of dry rice and
 * 500g of cooked rice are different shopping quantities for the same food.
 *
 * A generic line keeps its generic identity even after the user attaches a
 * product to buy: the plan still needs dry rice, and the brand is *how* they
 * buy it rather than *what* is required. Keying on the brand instead would
 * change the line's identity mid-shop and lose the attachment — and the tick
 * state with it — the next time the plan recomputed.
 *
 * Only a line that is inherently a branded product, with no generic food
 * behind it, is keyed by product.
 */
export function aggregationKey(line: {
  foodItemId?: string;
  brandedProductId?: string;
  foodState?: FoodState;
  requiredUnit: string;
}): string {
  if (line.foodItemId) {
    return `food:${line.foodItemId}:${line.foodState ?? 'unspecified'}:${line.requiredUnit}`;
  }
  if (line.brandedProductId) return `product:${line.brandedProductId}`;
  return `unknown:${line.requiredUnit}`;
}

/** Packs needed, always rounded up — you cannot buy 0.4 of a bag. */
export function packsFor(requiredQuantity: number, packQuantity: number): number {
  if (packQuantity <= 0) return 0;
  return Math.ceil(requiredQuantity / packQuantity);
}

export function applyPackMath(item: ShoppingListItem): ShoppingListItem {
  if (!item.packQuantity || item.packQuantity <= 0) {
    // No pack data: show only what the plan needs, rather than inventing a pack.
    return { ...item, packsRequired: undefined, purchaseQuantity: undefined };
  }
  const packsRequired = packsFor(item.requiredQuantity, item.packQuantity);
  return {
    ...item,
    packsRequired,
    purchaseQuantity: packsRequired * item.packQuantity,
  };
}

export type BuildOptions = {
  makeId: () => string;
  /** The previous list, so user state survives recomputation. */
  previous?: ShoppingListItem[];
};

/**
 * Build a list from the ingredients of the *selected* meal options only.
 *
 * Aggregating all three A/B/C options would buy three weeks of food.
 */
export function buildShoppingList(
  lines: IngredientLine[],
  options: BuildOptions,
): ShoppingListItem[] {
  const aggregated = new Map<string, ShoppingListItem>();

  for (const line of lines) {
    const key = aggregationKey({
      foodItemId: line.foodItemId,
      foodState: line.state,
      requiredUnit: line.unit,
    });

    const existing = aggregated.get(key);
    if (existing) {
      existing.requiredQuantity = round(existing.requiredQuantity + line.quantity, 1);
      continue;
    }

    aggregated.set(key, {
      id: options.makeId(),
      foodItemId: line.foodItemId,
      displayName: line.displayName,
      group: line.group,
      requiredQuantity: round(line.quantity, 1),
      requiredUnit: line.unit,
      foodState: line.state,
      checkedStatus: 'unchecked',
      manuallyAdded: false,
    });
  }

  const rebuilt = [...aggregated.values()].map(applyPackMath);
  return options.previous ? mergeWithPrevious(rebuilt, options.previous) : sortList(rebuilt);
}

/**
 * Carry user state across a rebuild (§29).
 *
 * Manual additions are kept outright. Tick states and attached products carry
 * over where the item identity is unchanged. An item the user already acquired
 * but the plan no longer needs is *flagged*, never deleted — silently removing
 * something already in the trolley is how a list loses trust.
 */
export function mergeWithPrevious(
  rebuilt: ShoppingListItem[],
  previous: ShoppingListItem[],
): ShoppingListItem[] {
  const previousByKey = new Map(previous.map((item) => [aggregationKey(item), item]));
  const rebuiltKeys = new Set(rebuilt.map(aggregationKey));

  const merged = rebuilt.map((item) => {
    const before = previousByKey.get(aggregationKey(item));
    if (!before) return item;

    return applyPackMath({
      ...item,
      id: before.id,
      checkedStatus: before.checkedStatus,
      brandedProductId: before.brandedProductId,
      packQuantity: before.packQuantity ?? item.packQuantity,
      packUnit: before.packUnit ?? item.packUnit,
      note: before.note,
    });
  });

  // Manual items are the user's own, and never derived from the plan.
  const manual = previous.filter((item) => item.manuallyAdded);

  // Items dropped by a plan change but already acquired: keep and flag.
  const orphanedButAcquired = previous
    .filter(
      (item) =>
        !item.manuallyAdded &&
        !rebuiltKeys.has(aggregationKey(item)) &&
        item.checkedStatus !== 'unchecked',
    )
    .map((item) => ({ ...item, noLongerRequired: true }));

  return sortList([...merged, ...manual, ...orphanedButAcquired]);
}

export function sortList(items: ShoppingListItem[]): ShoppingListItem[] {
  return [...items].sort((a, b) => {
    const groupDiff =
      SHOPPING_GROUP_ORDER.indexOf(a.group) - SHOPPING_GROUP_ORDER.indexOf(b.group);
    if (groupDiff !== 0) return groupDiff;
    return a.displayName.localeCompare(b.displayName);
  });
}

export function groupItems(
  items: ShoppingListItem[],
): Array<{ group: ShoppingGroup; label: string; items: ShoppingListItem[] }> {
  const groups = new Map<ShoppingGroup, ShoppingListItem[]>();
  for (const item of items) {
    const bucket = groups.get(item.group) ?? [];
    bucket.push(item);
    groups.set(item.group, bucket);
  }

  return SHOPPING_GROUP_ORDER.filter((group) => groups.has(group)).map((group) => ({
    group,
    label: SHOPPING_GROUP_LABELS[group],
    items: groups.get(group)!,
  }));
}

export function setStatus(
  items: ShoppingListItem[],
  itemId: string,
  status: CheckedStatus,
): ShoppingListItem[] {
  return items.map((item) => (item.id === itemId ? { ...item, checkedStatus: status } : item));
}

/** Attach a scanned product to a planned line, and recompute the pack maths. */
export function attachProduct(
  items: ShoppingListItem[],
  itemId: string,
  product: { brandedProductId: string; displayName: string; packQuantity?: number; packUnit?: 'g' | 'ml' },
): ShoppingListItem[] {
  return items.map((item) =>
    item.id === itemId
      ? applyPackMath({
          ...item,
          brandedProductId: product.brandedProductId,
          note: `Buying ${product.displayName}`,
          packQuantity: product.packQuantity,
          packUnit: product.packUnit,
        })
      : item,
  );
}

export function addManualItem(
  items: ShoppingListItem[],
  item: Omit<ShoppingListItem, 'id' | 'manuallyAdded' | 'checkedStatus'>,
  makeId: () => string,
): ShoppingListItem[] {
  return sortList([
    ...items,
    applyPackMath({ ...item, id: makeId(), manuallyAdded: true, checkedStatus: 'unchecked' }),
  ]);
}

export function removeItem(items: ShoppingListItem[], itemId: string): ShoppingListItem[] {
  return items.filter((item) => item.id !== itemId);
}

export type ListProgress = { total: number; acquired: number; fraction: number };

export function listProgress(items: ShoppingListItem[]): ListProgress {
  const active = items.filter((item) => !item.noLongerRequired);
  const acquired = active.filter(
    (item) => item.checkedStatus === 'acquired' || item.checkedStatus === 'substituted',
  ).length;

  return {
    total: active.length,
    acquired,
    fraction: active.length === 0 ? 0 : acquired / active.length,
  };
}

/** "Required: 840g dry · Buy: 1 × 1kg" (§29). */
export function describeQuantity(item: ShoppingListItem): { required: string; purchase?: string } {
  const state = item.foodState && item.foodState !== 'as_sold' ? ` ${item.foodState}` : '';
  const required = `${formatQuantity(item.requiredQuantity, item.requiredUnit)}${state}`;

  if (!item.packsRequired || !item.packQuantity) return { required };

  return {
    required,
    purchase: `${item.packsRequired} × ${formatQuantity(item.packQuantity, item.packUnit ?? 'g')}`,
  };
}

export function formatQuantity(value: number, unit: 'g' | 'ml' | 'item'): string {
  if (unit === 'item') return `${Math.round(value)}`;
  if (value >= 1000) return `${round(value / 1000, 2)}${unit === 'g' ? 'kg' : 'l'}`;
  return `${Math.round(value)}${unit}`;
}

function round(value: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}
