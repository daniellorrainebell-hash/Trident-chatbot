import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, EmptyState, MacroRow, Screen, SectionHeader, Text } from '@/components';
import { colors, space as sp } from '@/design';
import { useNutritionStore } from '@/store/nutritionStore';
import { formatPortion, findFood } from '@/data/foods';

/**
 * Recipe view (spec §42).
 *
 * The wording of the method may be AI-written. Every number on this screen is
 * not: quantities come from the fitted plan and nutrients are computed from the
 * food table. That split is the whole architecture in one screen.
 */
export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = useNutritionStore((s) => s.plan);

  const found = plan?.days
    .flatMap((day) => day.meals.map((meal) => ({ day, meal })))
    .flatMap(({ day, meal }) => meal.options.map((option) => ({ day, meal, option })))
    .find(({ option }) => option.id === id);

  if (!found) {
    return (
      <Screen>
        <EmptyState
          title="Recipe not found"
          message="This meal is not in your current plan."
          action={{ label: 'Back to plan', onPress: () => router.replace('/feed/plan') }}
        />
      </Screen>
    );
  }

  const { option } = found;
  const totalMinutes = option.recipe.prepMinutes + option.recipe.cookMinutes;

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">{option.name}</Text>
        <Text variant="bodySmall" tone="tertiary">
          {option.recipe.prepMinutes} min prep · {option.recipe.cookMinutes} min cook ·{' '}
          {totalMinutes} min total
        </Text>
      </View>

      <Card>
        <MacroRow nutrients={option.nutrients} showFibre />
      </Card>

      <SectionHeader title="Ingredients" />
      <Card>
        {option.ingredients.map((ingredient, i) => {
          const food = findFood(ingredient.foodId);
          const scale = ingredient.grams / 100;

          return (
            <View
              key={ingredient.foodId}
              style={[styles.ingredient, i > 0 && styles.ingredientDivider]}
            >
              <View style={styles.ingredientMain}>
                <Text variant="bodyStrong">{ingredient.foodName}</Text>
                <Text variant="metricS" tone="secondary">
                  {formatPortion(ingredient.grams, ingredient.state)}
                </Text>
              </View>
              {food ? (
                <Text variant="caption" tone="tertiary">
                  {Math.round(food.kcalPer100g * scale)} kcal · P
                  {Math.round(food.proteinPer100g * scale)} C
                  {Math.round(food.carbsPer100g * scale)} F
                  {Math.round(food.fatPer100g * scale)}
                </Text>
              ) : null}
            </View>
          );
        })}
      </Card>

      <SectionHeader title="Method" />
      <Card>
        {option.recipe.steps.map((step, i) => (
          <View key={i} style={[styles.step, i > 0 && styles.stepSpacing]}>
            <Text variant="metricS" tone="tertiary" style={styles.stepNumber}>
              {i + 1}
            </Text>
            <Text variant="body" tone="secondary" style={styles.stepText}>
              {step}
            </Text>
          </View>
        ))}
      </Card>

      <Text variant="legal" tone="tertiary" style={styles.footer}>
        Weigh ingredients in the state shown. Nutrient figures are calculated from
        structured food data, not estimated from the recipe text.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  ingredient: { paddingVertical: sp.md, gap: sp.xxs },
  ingredientDivider: { borderTopWidth: 1, borderTopColor: colors.border.subtle },
  ingredientMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: sp.md },
  step: { flexDirection: 'row', gap: sp.md },
  stepSpacing: { marginTop: sp.lg },
  stepNumber: { width: 24 },
  stepText: { flex: 1 },
  footer: { marginTop: sp.xxl },
});
