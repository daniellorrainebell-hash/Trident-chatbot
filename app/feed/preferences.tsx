import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Pill, Screen, SectionHeader, Text } from '@/components';
import { colors, radius, space as sp, minTouchTarget } from '@/design';
import { useNutritionStore } from '@/store/nutritionStore';
import { FOODS, FOOD_CATEGORY_ORDER, foodsByCategory, searchFoods } from '@/data/foods';
import { allowedFoodIds } from '@/services/nutrition/planBuilder';
import { ALLERGEN_GROUP_LABELS } from '@/engines/nutrition/validation';
import type { AllergenGroup, DietaryRule, FoodCategory, PreferenceState } from '@/types';

const STATES: Array<{ value: PreferenceState; label: string; short: string }> = [
  { value: 'love_it', label: 'Love it', short: '♥' },
  { value: 'dont_mind_it', label: "Don't mind it", short: '·' },
  { value: 'keep_it_out', label: 'Keep it out', short: '✕' },
];

const ALLERGEN_GROUPS: AllergenGroup[] = [
  'nuts', 'dairy', 'eggs', 'gluten', 'soy', 'shellfish', 'fish',
];

const DIETARY_RULES: Array<{ value: DietaryRule; label: string }> = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'gluten_free', label: 'Gluten free' },
  { value: 'dairy_free', label: 'Dairy free' },
];

/**
 * Food preferences (spec §35).
 *
 * Three states per food, plus hard exclusions that override everything. The
 * distinction matters: LOVE IT steers the planner, KEEP IT OUT and allergies bind
 * it. An allergen is never a preference that can be outweighed by a good macro fit.
 *
 * The count of usable foods is shown live, because a stack of exclusions can
 * quietly leave too little to build a varied week from — better to see that here
 * than to get a thin plan and not know why.
 */
export default function PreferencesScreen() {
  const preferences = useNutritionStore((s) => s.preferences);
  const setPreference = useNutritionStore((s) => s.setPreference);
  const setAllergies = useNutritionStore((s) => s.setAllergies);
  const setAllergenGroups = useNutritionStore((s) => s.setAllergenGroups);
  const setDietaryRules = useNutritionStore((s) => s.setDietaryRules);

  const [category, setCategory] = useState<FoodCategory>('protein');
  const [query, setQuery] = useState('');

  const visible = useMemo(
    () => (query ? searchFoods(query) : foodsByCategory(category)),
    [query, category],
  );

  const usableCount = useMemo(() => allowedFoodIds(preferences).length, [preferences]);
  const lowVariety = usableCount < 20;

  const toggleRule = (rule: DietaryRule) => {
    const current = preferences.dietaryRules;
    setDietaryRules(
      current.includes(rule) ? current.filter((r) => r !== rule) : [...current, rule],
    );
  };

  const toggleGroup = (group: AllergenGroup) => {
    const current = preferences.allergenGroups;
    setAllergenGroups(
      current.includes(group) ? current.filter((g) => g !== group) : [...current, group],
    );
  };

  const toggleAllergy = (foodId: string) => {
    const current = preferences.allergies;
    setAllergies(
      current.includes(foodId) ? current.filter((id) => id !== foodId) : [...current, foodId],
    );
  };

  return (
    <Screen
      footer={
        <Button
          label="Build my plan"
          onPress={() => router.push('/feed/plan')}
          disabled={usableCount < 8}
        />
      }
    >
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Your food</Text>
        <Text variant="body" tone="tertiary">
          A plan built from food you will not eat is a plan you will not follow.
        </Text>
      </View>

      <Card marker={lowVariety ? 'warning' : 'none'}>
        <Text variant="overline" tone="tertiary">
          Usable foods
        </Text>
        <Text variant="metricL">{usableCount}</Text>
        <Text variant="bodySmall" tone={lowVariety ? 'warning' : 'tertiary'}>
          {usableCount < 8
            ? 'Too few to build a varied week. Remove some exclusions.'
            : lowVariety
              ? 'Enough to build a plan, but the week will repeat itself.'
              : 'Plenty to work with.'}
        </Text>
      </Card>

      <SectionHeader title="Dietary rules" subtitle="Applied to every meal, without exception." />
      <View style={styles.rules}>
        {DIETARY_RULES.map((rule) => (
          <Pill
            key={rule.value}
            label={rule.label}
            selected={preferences.dietaryRules.includes(rule.value)}
            onPress={() => toggleRule(rule.value)}
          />
        ))}
      </View>

      <SectionHeader
        title="Allergies"
        subtitle="Hard blocks. These override every preference and every suggestion, including anything the planner proposes."
      />
      <View style={styles.rules}>
        {ALLERGEN_GROUPS.map((group) => (
          <Pill
            key={group}
            label={ALLERGEN_GROUP_LABELS[group]}
            tone={preferences.allergenGroups.includes(group) ? 'danger' : 'neutral'}
            selected={false}
            onPress={() => toggleGroup(group)}
          />
        ))}
      </View>
      <Text variant="caption" tone="tertiary" style={styles.allergenNote}>
        Selecting a group excludes every food not positively marked free of it —
        including foods added to The Kennel later. Safer than listing them one by one.
      </Text>

      <SectionHeader title="Individual foods" subtitle="For anything a group does not cover." />
      {preferences.allergies.length > 0 ? (
        <View style={styles.rules}>
          {preferences.allergies.map((foodId) => {
            const food = FOODS.find((f) => f.id === foodId);
            return (
              <Pill
                key={foodId}
                label={food?.name ?? foodId}
                tone="danger"
                onPress={() => toggleAllergy(foodId)}
              />
            );
          })}
        </View>
      ) : (
        <Text variant="bodySmall" tone="tertiary">
          None set. Long-press a food below to mark it as an allergy.
        </Text>
      )}

      <SectionHeader title="Rate the food" />
      <Field
        label="Search"
        value={query}
        onChangeText={setQuery}
        placeholder="Chicken, rice, oats…"
        autoCapitalize="none"
      />

      {!query ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {FOOD_CATEGORY_ORDER.map((c) => (
            <Pill
              key={c.id}
              label={c.label}
              selected={category === c.id}
              onPress={() => setCategory(c.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.foodList}>
        {visible.map((food) => {
          const state = preferences.states[food.id] ?? 'dont_mind_it';
          const isAllergen = preferences.allergies.includes(food.id);

          return (
            <Card key={food.id} style={styles.foodCard}>
              <Pressable
                onLongPress={() => toggleAllergy(food.id)}
                accessibilityHint="Long press to mark as an allergy"
              >
                <View style={styles.foodHeader}>
                  <View style={styles.foodName}>
                    <Text variant="bodyStrong">{food.name}</Text>
                    <Text variant="caption" tone="tertiary">
                      {food.kcalPer100g} kcal · P{food.proteinPer100g} C{food.carbsPer100g} F
                      {food.fatPer100g} per 100g
                      {food.state !== 'as_sold' ? ` (${food.state})` : ''}
                    </Text>
                  </View>
                  {isAllergen ? <Pill label="Allergy" tone="danger" /> : null}
                </View>
              </Pressable>

              {!isAllergen ? (
                <View style={styles.stateRow}>
                  {STATES.map((option) => {
                    const active = state === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setPreference(food.id, option.value)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`${food.name}: ${option.label}`}
                        style={[styles.stateButton, active && styles.stateButtonActive]}
                      >
                        <Text
                          variant="caption"
                          tone={active ? 'inverse' : 'tertiary'}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  rules: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.sm },
  allergenNote: { marginTop: sp.md },
  categories: { gap: sp.sm, paddingVertical: sp.md, paddingRight: sp.lg },
  foodList: { gap: sp.sm, marginTop: sp.md },
  foodCard: { gap: sp.md },
  foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  foodName: { flex: 1, gap: sp.xxs },
  stateRow: { flexDirection: 'row', gap: sp.xs },
  stateButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sp.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.elevated,
    minHeight: minTouchTarget,
  },
  stateButtonActive: { backgroundColor: colors.text.primary },
});
