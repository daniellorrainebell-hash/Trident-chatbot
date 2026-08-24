import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Button, Card, EmptyState, MacroRow, Pill, Screen, SectionHeader, Text,
} from '@/components';
import { colors, space as sp } from '@/design';
import { useNutritionStore } from '@/store/nutritionStore';
import { formatPortion } from '@/data/foods';
import { formatWeekday } from '@/utils/format';
import { track } from '@/services/analytics';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

/**
 * A single day's meals (spec §39, §43).
 *
 * Every meal shows all three options with their real macros, so swapping is a
 * visible, informed choice rather than a shuffle. Options are approximately
 * macro-equivalent by construction — they all passed the same budget check —
 * which is what makes picking B over A safe.
 */
export default function FeedDayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = useNutritionStore((s) => s.plan);
  const selectMealOption = useNutritionStore((s) => s.selectMealOption);

  const day = plan?.days.find((d) => d.id === id);

  if (!plan || !day) {
    return (
      <Screen>
        <EmptyState
          title="Day not found"
          message="This day is not in your current plan."
          action={{ label: 'Back to plan', onPress: () => router.replace('/feed/plan') }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <View style={styles.titleRow}>
          <Text variant="h1">{formatWeekday(day.date)}</Text>
          {day.isTrainingDay ? <Pill label="Training day" tone="accent" /> : null}
        </View>
      </View>

      <Card>
        <Text variant="overline" tone="tertiary">
          Day total against target
        </Text>
        <View style={styles.dayTotals}>
          <MacroRow
            nutrients={day.totals}
            target={{
              calories: day.targets.calories,
              proteinG: day.targets.proteinG,
              carbsG: day.targets.carbsG,
              fatG: day.targets.fatG,
              fibreG: day.targets.fibreG,
            }}
            showFibre
          />
        </View>
      </Card>

      {day.meals.map((meal) => (
        <View key={meal.id}>
          <SectionHeader
            title={MEAL_LABELS[meal.type] ?? meal.type}
            subtitle={`Budget: ${meal.budget.calories} kcal · P${meal.budget.proteinG} C${meal.budget.carbsG} F${meal.budget.fatG}`}
          />

          {meal.options.map((option) => {
            const selected = option.id === meal.selectedOptionId;

            return (
              <Card
                key={option.id}
                style={styles.optionCard}
                marker={selected ? 'success' : 'none'}
                onPress={() => {
                  if (!selected) {
                    selectMealOption(day.id, meal.id, option.id);
                    track({ name: 'meal_swapped', properties: { mealType: meal.type } });
                  }
                }}
              >
                <View style={styles.optionHeader}>
                  <View style={styles.optionTitle}>
                    <Text variant="overline" tone="tertiary">
                      Option {option.slot}
                    </Text>
                    <Text variant="h3">{option.name}</Text>
                  </View>
                  {selected ? <Pill label="Selected" tone="success" /> : null}
                </View>

                <View style={styles.optionMacros}>
                  <MacroRow nutrients={option.nutrients} size="small" />
                </View>

                <View style={styles.ingredients}>
                  {option.ingredients.map((ingredient) => (
                    <View key={`${option.id}-${ingredient.foodId}`} style={styles.ingredientRow}>
                      <Text variant="bodySmall" tone="secondary" style={styles.ingredientName}>
                        {ingredient.foodName}
                      </Text>
                      <Text variant="bodySmall" tone="tertiary">
                        {formatPortion(ingredient.grams, ingredient.state)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.recipeFooter}>
                  <Text variant="caption" tone="tertiary">
                    {option.recipe.prepMinutes} min prep · {option.recipe.cookMinutes} min cook
                  </Text>
                  <Button
                    label="Recipe"
                    size="small"
                    variant="ghost"
                    onPress={() => router.push(`/feed/recipe/${option.id}`)}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      ))}

      <Text variant="legal" tone="tertiary" style={styles.footer}>
        Portions are given in the state shown — raw, dry or as sold. Weigh them in that
        state, because cooked weights differ substantially.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.md, alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: sp.md, flexWrap: 'wrap' },
  dayTotals: { marginTop: sp.md },
  optionCard: { marginBottom: sp.md },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  optionTitle: { flex: 1, gap: sp.xxs },
  optionMacros: { marginTop: sp.lg },
  ingredients: {
    marginTop: sp.lg,
    paddingTop: sp.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    gap: sp.sm,
  },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', gap: sp.md },
  ingredientName: { flex: 1 },
  recipeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: sp.lg,
  },
  footer: { marginTop: sp.xxl },
});
