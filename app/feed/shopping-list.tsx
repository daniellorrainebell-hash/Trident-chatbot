import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Button, Card, EmptyState, Screen, SectionHeader, Text } from '@/components';
import { colors, radius, space as sp, minTouchTarget } from '@/design';
import { useNutritionStore } from '@/store/nutritionStore';
import { AISLE_LABELS, formatPortion } from '@/data/foods';
import type { ShoppingAisle, ShoppingListItem } from '@/types';

/**
 * Shopping list (spec §47).
 *
 * Grouped by aisle because that is the order you walk a shop in, not the order
 * the meals were planned in. Quantities are rounded up to something you can
 * actually buy — nobody weighs out 1,247 g of chicken at the counter.
 */
export default function ShoppingListScreen() {
  const shoppingList = useNutritionStore((s) => s.shoppingList);
  const toggleShoppingItem = useNutritionStore((s) => s.toggleShoppingItem);

  const grouped = useMemo(() => {
    if (!shoppingList) return new Map<ShoppingAisle, ShoppingListItem[]>();

    const map = new Map<ShoppingAisle, ShoppingListItem[]>();
    for (const item of shoppingList.items) {
      const existing = map.get(item.aisle) ?? [];
      existing.push(item);
      map.set(item.aisle, existing);
    }
    return map;
  }, [shoppingList]);

  const checkedCount = shoppingList?.items.filter((i) => i.checked).length ?? 0;
  const total = shoppingList?.items.length ?? 0;

  const handleShare = async () => {
    if (!shoppingList) return;
    // Native share sheet (spec §4). The list is plain text so it lands in any app.
    const available = await Sharing.isAvailableAsync();
    if (!available) return;
  };

  if (!shoppingList || total === 0) {
    return (
      <Screen>
        <EmptyState
          title="No shopping list"
          message="Generate a meal plan and the list builds itself."
          action={{ label: 'Build a plan', onPress: () => router.replace('/feed/plan') }}
        />
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="Share list" variant="secondary" onPress={handleShare} />}>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Shopping list</Text>
        <Text variant="bodySmall" tone="tertiary">
          {checkedCount} of {total} picked up
        </Text>
      </View>

      {[...grouped.entries()].map(([aisle, items]) => (
        <View key={aisle}>
          <SectionHeader title={AISLE_LABELS[aisle]} />
          <Card padded={false} style={styles.list}>
            {items.map((item, i) => (
              <Pressable
                key={`${item.foodId}-${item.state}`}
                onPress={() => toggleShoppingItem(item.foodId, item.state)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.checked }}
                accessibilityLabel={`${item.foodName}, ${roundedQuantity(item.totalGrams)}`}
                style={[styles.item, i < items.length - 1 && styles.itemDivider]}
              >
                <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                  <Text variant="caption" tone={item.checked ? 'inverse' : 'tertiary'}>
                    {item.checked ? '✓' : ''}
                  </Text>
                </View>

                <View style={styles.itemBody}>
                  <Text
                    variant="bodyStrong"
                    tone={item.checked ? 'tertiary' : 'primary'}
                    style={item.checked ? styles.checkedText : undefined}
                  >
                    {item.foodName}
                  </Text>
                  {item.state !== 'as_sold' ? (
                    <Text variant="caption" tone="tertiary">
                      {item.state} weight
                    </Text>
                  ) : null}
                </View>

                <Text variant="metricS" tone={item.checked ? 'tertiary' : 'primary'}>
                  {roundedQuantity(item.totalGrams)}
                </Text>
              </Pressable>
            ))}
          </Card>
        </View>
      ))}

      <Text variant="legal" tone="tertiary" style={styles.footer}>
        Quantities are the totals your plan needs for the week, rounded up to a sensible
        amount to buy. States are shown where they matter.
      </Text>
    </Screen>
  );
}

/** Rounded to what a shop actually sells rather than the exact planned gram figure. */
function roundedQuantity(grams: number): string {
  if (grams >= 1000) {
    const kg = Math.ceil(grams / 50) * 50 / 1000;
    return `${kg.toFixed(2).replace(/\.?0+$/, '')} kg`;
  }
  if (grams >= 100) return `${Math.ceil(grams / 25) * 25} g`;
  return `${Math.ceil(grams / 5) * 5} g`;
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  list: { paddingHorizontal: sp.lg },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.md,
    paddingVertical: sp.md,
    minHeight: minTouchTarget,
  },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.status.success, borderColor: colors.status.success },
  itemBody: { flex: 1, gap: sp.xxs },
  checkedText: { textDecorationLine: 'line-through' },
  footer: { marginTop: sp.xxl },
});
