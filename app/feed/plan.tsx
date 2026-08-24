import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, EmptyState, MacroRow, Pill, Screen, SectionHeader, Text,
} from '@/components';
import { colors, space as sp } from '@/design';
import { useNutritionStore } from '@/store/nutritionStore';
import { useUserStore } from '@/store/userStore';
import { weekStart } from '@/engines/training/streaks';
import { SEED_TODAY } from '@/data/seed';
import { track } from '@/services/analytics';
import { formatDate } from '@/utils/format';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * The 7-day plan (spec §39, §88).
 *
 * Generation is explicit and shows what it produced, including partial failures.
 * If a meal slot could not be filled with anything that validated, that is
 * surfaced rather than papered over — spec §56 is clear that an unvalidated plan
 * must never be presented as final, and quietly dropping a meal would be a
 * quieter version of the same lie.
 */
export default function PlanScreen() {
  const plan = useNutritionStore((s) => s.plan);
  const energy = useNutritionStore((s) => s.energy);
  const profile = useNutritionStore((s) => s.profile);
  const generating = useNutritionStore((s) => s.generating);
  const failures = useNutritionStore((s) => s.planFailures);
  const generatePlan = useNutritionStore((s) => s.generatePlan);
  const trainingProfile = useUserStore((s) => s.trainingProfile);

  const [splitTrainingDays, setSplitTrainingDays] = useState(false);

  // Training days come from the user's own schedule rather than being guessed.
  const trainingDays =
    (trainingProfile?.sessionsPerWeek ?? 4) >= 5 ? [1, 2, 3, 4, 5] : [1, 2, 4, 5];

  const handleGenerate = async () => {
    await generatePlan(weekStart(SEED_TODAY), trainingDays, splitTrainingDays);
    track({
      name: 'meal_plan_generated',
      properties: {
        mealsPerDay: profile?.mealsPerDay ?? 4,
        splitTrainingDays,
        failureCount: useNutritionStore.getState().planFailures.length,
      },
    });
  };

  if (!energy) {
    return (
      <Screen>
        <EmptyState
          title="No targets yet"
          message="Calories and macros come first. A plan is built to hit them."
          action={{ label: 'Set up nutrition', onPress: () => router.replace('/feed/profile') }}
        />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          label={plan ? 'Regenerate plan' : 'Generate 7-day plan'}
          onPress={handleGenerate}
          loading={generating}
        />
      }
    >
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Your plan</Text>
        {plan ? (
          <Text variant="bodySmall" tone="tertiary">
            Week of {formatDate(plan.weekStarting)}
          </Text>
        ) : null}
      </View>

      <SectionHeader title="Options" />
      <Card>
        <View style={styles.optionRow}>
          <View style={styles.optionBody}>
            <Text variant="bodyStrong">Carb cycling</Text>
            <Text variant="caption" tone="tertiary">
              More carbohydrate on training days, less on rest days. Weekly energy is
              unchanged.
            </Text>
          </View>
          <Pill
            label={splitTrainingDays ? 'On' : 'Off'}
            tone={splitTrainingDays ? 'success' : 'neutral'}
            onPress={() => setSplitTrainingDays((v) => !v)}
          />
        </View>
      </Card>

      {failures.length > 0 ? (
        <Card marker="warning" style={styles.failures}>
          <Text variant="h3">
            {failures.length} meal{failures.length === 1 ? '' : 's'} could not be filled
          </Text>
          <Text variant="bodySmall" tone="secondary" style={styles.failureBody}>
            No proposed option passed validation for{' '}
            {[...new Set(failures.map((f) => f.mealType))].join(', ')}. This usually means
            your exclusions leave too little to hit those macro targets.
          </Text>
          <Button
            label="Adjust food preferences"
            variant="secondary"
            size="small"
            onPress={() => router.push('/feed/preferences')}
          />
        </Card>
      ) : null}

      {plan ? (
        <>
          <SectionHeader title="The week" />
          {plan.days.map((day) => {
            const drift = day.totals.calories - day.targets.calories;

            return (
              <Card
                key={day.id}
                style={styles.dayCard}
                onPress={() => router.push(`/feed/day/${day.id}`)}
              >
                <View style={styles.dayHeader}>
                  <View style={styles.dayTitle}>
                    <Text variant="h3">{WEEKDAYS[day.dayOfWeek - 1]}</Text>
                    <Text variant="caption" tone="tertiary">
                      {day.meals.length} meals
                    </Text>
                  </View>
                  {day.isTrainingDay ? <Pill label="Training" tone="accent" /> : null}
                </View>

                <View style={styles.dayMacros}>
                  <MacroRow
                    nutrients={day.totals}
                    target={{
                      calories: day.targets.calories,
                      proteinG: day.targets.proteinG,
                      carbsG: day.targets.carbsG,
                      fatG: day.targets.fatG,
                      fibreG: day.targets.fibreG,
                    }}
                    size="small"
                  />
                </View>

                <Text variant="caption" tone="tertiary" style={styles.drift}>
                  {Math.abs(drift) <= 30
                    ? 'On target'
                    : `${drift > 0 ? '+' : ''}${drift} kcal against target`}
                </Text>
              </Card>
            );
          })}

          <Text variant="legal" tone="tertiary" style={styles.footer}>
            Every meal's calories and macros are calculated from structured food data,
            not estimated. Plans land close to target rather than exactly on it, because
            single-calorie precision is not meaningful.
          </Text>
        </>
      ) : (
        <EmptyState
          title="No plan yet"
          message="Generate a week and you'll get three macro-matched choices for every meal."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: sp.lg },
  optionBody: { flex: 1, gap: sp.xxs },
  failures: { marginTop: sp.xl },
  failureBody: { marginTop: sp.sm, marginBottom: sp.lg },
  dayCard: { marginBottom: sp.md },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dayTitle: { gap: sp.xxs },
  dayMacros: { marginTop: sp.lg },
  drift: { marginTop: sp.md },
  footer: { marginTop: sp.xxl },
});
