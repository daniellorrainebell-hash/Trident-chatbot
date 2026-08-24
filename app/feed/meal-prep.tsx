import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, EmptyState, Pill, Screen, SectionHeader, Text } from '@/components';
import { colors, space as sp } from '@/design';
import { useNutritionStore } from '@/store/nutritionStore';
import { buildMealPrep } from '@/services/nutrition/planBuilder';
import type { MealPrepDays } from '@/types';

const DAY_OPTIONS: MealPrepDays[] = [3, 5, 7];

/**
 * Meal prep mode (spec §46).
 *
 * Consolidates the plan's portions into batch quantities, so a Sunday cook-up is
 * one list of weights rather than twenty-one separate meals to work out. States
 * are carried through: 1.4 kg of raw chicken is not 1.4 kg of cooked chicken.
 */
export default function MealPrepScreen() {
  const plan = useNutritionStore((s) => s.plan);
  const [days, setDays] = useState<MealPrepDays>(5);

  const items = useMemo(() => (plan ? buildMealPrep(plan, days) : []), [plan, days]);

  if (!plan) {
    return (
      <Screen>
        <EmptyState
          title="No plan to prep"
          message="Generate a meal plan and the prep list builds from it."
          action={{ label: 'Build a plan', onPress: () => router.replace('/feed/plan') }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Meal prep</Text>
        <Text variant="body" tone="tertiary">
          Everything you need to cook, totalled up.
        </Text>
      </View>

      <View style={styles.dayPicker}>
        {DAY_OPTIONS.map((option) => (
          <Pill
            key={option}
            label={`${option} days`}
            selected={days === option}
            onPress={() => setDays(option)}
          />
        ))}
      </View>

      <SectionHeader title="Prepare" subtitle={`Covers the first ${days} days of your plan.`} />
      {items.length > 0 ? (
        <Card>
          {items.map((item, i) => (
            <View key={`${item.foodName}-${item.state}`} style={[styles.item, i > 0 && styles.divider]}>
              <View style={styles.itemHeader}>
                <Text variant="h3">{item.foodName}</Text>
                <Text variant="metricM">
                  {item.totalGrams >= 1000
                    ? `${(item.totalGrams / 1000).toFixed(1)} kg`
                    : `${item.totalGrams} g`}
                </Text>
              </View>
              {item.state !== 'as_sold' ? (
                <Text variant="caption" tone="tertiary">
                  {item.state} weight
                </Text>
              ) : null}
              <Text variant="bodySmall" tone="tertiary" style={styles.usedIn}>
                {item.usedIn.slice(0, 3).join(' · ')}
                {item.usedIn.length > 3 ? ` · +${item.usedIn.length - 3} more` : ''}
              </Text>
            </View>
          ))}
        </Card>
      ) : (
        <EmptyState
          title="Nothing worth batching"
          message="Your plan does not use enough of any single ingredient to make prep worthwhile."
        />
      )}

      <Text variant="legal" tone="tertiary" style={styles.footer}>
        Weights are given in the state your plan specifies. Cooked weights differ
        substantially from raw, so weigh before cooking where the plan says raw.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  dayPicker: { flexDirection: 'row', gap: sp.sm },
  item: { paddingVertical: sp.md, gap: sp.xxs },
  divider: { borderTopWidth: 1, borderTopColor: colors.border.subtle },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: sp.md },
  usedIn: { marginTop: sp.xs },
  footer: { marginTop: sp.xxl },
});
