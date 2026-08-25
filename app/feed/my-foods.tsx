import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, EmptyState, Field, Pill, Screen, SectionHeader, Text } from '@/components';
import { colors, space as sp } from '@/design';
import { useScannerStore, type SavedFood } from '@/store/scannerStore';
import { PREFERENCE_LABELS, type PreferenceLevel } from '@/engines/food/eligibility';
import { formatRelative } from '@/utils/format';

type Filter = 'all' | 'love' | 'dont_mind' | 'keep_out' | 'cant_eat' | 'unrated';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'love', label: 'Loved' },
  { id: 'dont_mind', label: 'OK' },
  { id: 'keep_out', label: 'Out' },
  { id: 'cant_eat', label: "Can't eat" },
  { id: 'unrated', label: 'Unrated' },
];

const CHOICES: Array<{ id: PreferenceLevel | 'cant_eat'; label: string; tone: 'success' | 'neutral' | 'danger' }> = [
  { id: 'love', label: PREFERENCE_LABELS.love, tone: 'success' },
  { id: 'dont_mind', label: PREFERENCE_LABELS.dont_mind, tone: 'neutral' },
  { id: 'keep_out', label: PREFERENCE_LABELS.keep_out, tone: 'neutral' },
  { id: 'cant_eat', label: PREFERENCE_LABELS.cant_eat, tone: 'danger' },
];

/**
 * MY FOODS (Feed spec §27).
 *
 * Everything scanned or entered by hand, with the same four-state preference
 * control the main catalogue uses. CAN'T EAT sits alongside KEEP IT OUT
 * because they are different things: one is a dislike, the other is a hard
 * exclusion the planner must never override.
 *
 * Saved foods are private. Nothing is published to a shared database without
 * moderation and licence-compatible consent (§24).
 */
export default function MyFoodsScreen() {
  const myFoods = useScannerStore((s) => s.myFoods);
  const setPreference = useScannerStore((s) => s.setPreference);
  const removeSavedFood = useScannerStore((s) => s.removeSavedFood);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return myFoods.filter((food) => {
      if (q && !food.name.toLowerCase().includes(q) && !food.brand?.toLowerCase().includes(q)) {
        return false;
      }
      if (filter === 'all') return true;
      if (filter === 'unrated') return !food.preference;
      return food.preference === filter;
    });
  }, [myFoods, query, filter]);

  const counts = useMemo(() => ({
    loved: myFoods.filter((f) => f.preference === 'love').length,
    out: myFoods.filter((f) => f.preference === 'keep_out' || f.preference === 'cant_eat').length,
  }), [myFoods]);

  return (
    <Screen>
      <View style={styles.head}>
        <Text variant="h1">My Foods</Text>
        <Text variant="bodySmall" tone="tertiary" style={styles.gap}>
          {myFoods.length} saved · {counts.loved} loved · {counts.out} out
        </Text>
      </View>

      <Button
        label="Scan something"
        onPress={() => router.push('/feed/scanner')}
      />

      {myFoods.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          message="Scan a barcode or a label and it lands here, ready to drop into a meal or your shopping list."
        />
      ) : (
        <>
          <View style={styles.search}>
            <Field label="Search" value={query} onChangeText={setQuery} placeholder="Oats, chicken…" autoCapitalize="none" />
          </View>

          <View style={styles.filters}>
            {FILTERS.map((f) => (
              <Pill key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
            ))}
          </View>

          {filtered.length === 0 ? (
            <EmptyState title="No matches" message="Nothing here matches that filter." />
          ) : (
            filtered.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                onChoose={(choice) => setPreference(food.id, choice)}
                onRemove={() => removeSavedFood(food.id)}
              />
            ))
          )}
        </>
      )}

      <Text variant="legal" tone="tertiary" style={styles.notice}>
        Saved foods are private to you. Nothing here is shared with a public food database.
      </Text>
    </Screen>
  );
}

function FoodCard({
  food,
  onChoose,
  onRemove,
}: {
  food: SavedFood;
  onChoose(choice: PreferenceLevel | 'cant_eat'): void;
  onRemove(): void;
}) {
  const excluded = food.preference === 'cant_eat';

  return (
    <Card style={styles.card} marker={excluded ? 'danger' : 'none'}>
      <View style={styles.cardHead}>
        <View style={styles.flex}>
          <Text variant="h3">{food.name}</Text>
          <Text variant="caption" tone="tertiary" style={styles.tight}>
            {[food.brand, food.source === 'barcode' ? 'Scanned' : food.source === 'label' ? 'Label' : 'Manual', formatRelative(food.savedAt)]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <Text variant="metricS">
          {Math.round(food.nutrients.kcal)}
          <Text variant="caption" tone="tertiary">
            {food.basis === 'per_serving' ? ' /serving' : ' /100'}
          </Text>
        </Text>
      </View>

      <View style={styles.macroRow}>
        <Text variant="caption" tone="tertiary">
          P {Math.round(food.nutrients.protein)} · C {Math.round(food.nutrients.carbs)} · F {Math.round(food.nutrients.fat)}
        </Text>
        {food.categoryTags.map((tag) => (
          <Pill key={tag} label={tag} />
        ))}
      </View>

      <View style={styles.choices}>
        {CHOICES.map((choice) => (
          <Pill
            key={choice.id}
            label={choice.label}
            selected={food.preference === choice.id}
            tone={choice.tone}
            onPress={() => onChoose(choice.id)}
          />
        ))}
      </View>

      {excluded ? (
        <Text variant="caption" tone="danger" style={styles.divider}>
          Kept out of every plan. A LOVE IT elsewhere cannot override this.
        </Text>
      ) : null}

      <Button label="Remove" variant="ghost" size="small" onPress={onRemove} style={styles.remove} />
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: sp.lg, marginBottom: sp.xl },
  gap: { marginTop: sp.sm },
  tight: { marginTop: sp.xxs },
  flex: { flex: 1 },
  search: { marginTop: sp.xxl },
  filters: { flexDirection: 'row', gap: sp.sm, flexWrap: 'wrap', marginTop: sp.lg },
  card: { marginTop: sp.md },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: sp.md },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: sp.sm, marginTop: sp.md, flexWrap: 'wrap' },
  choices: { flexDirection: 'row', gap: sp.sm, flexWrap: 'wrap', marginTop: sp.lg },
  divider: {
    marginTop: sp.md,
    paddingTop: sp.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  remove: { marginTop: sp.sm, alignSelf: 'flex-start' },
  notice: { marginTop: sp.xxxl },
});
