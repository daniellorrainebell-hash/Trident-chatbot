import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, ChoiceGroup, Field, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { space as sp } from '@/design';
import { useNutritionStore } from '@/store/nutritionStore';
import { analyseTrend, explainNoAdjustment } from '@/engines/nutrition/adjustment';
import { weekStart } from '@/engines/training/streaks';
import { SEED_TODAY } from '@/data/seed';
import { track } from '@/services/analytics';

const SCALE = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
];

/**
 * Weekly check-in and calorie adjustment (spec §49, §50).
 *
 * The user approves every change. Where no change is warranted the screen says
 * so and explains why — most weeks that is the correct answer, and a planner
 * that adjusts constantly is one nobody can follow.
 */
export default function CheckInScreen() {
  const profile = useNutritionStore((s) => s.profile);
  const checkIns = useNutritionStore((s) => s.checkIns);
  const pendingAdjustment = useNutritionStore((s) => s.pendingAdjustment);
  const submitCheckIn = useNutritionStore((s) => s.submitCheckIn);
  const acceptAdjustment = useNutritionStore((s) => s.acceptAdjustment);
  const declineAdjustment = useNutritionStore((s) => s.declineAdjustment);

  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [planAdherence, setPlanAdherence] = useState('90');
  const [trainingAdherence, setTrainingAdherence] = useState('90');
  const [hunger, setHunger] = useState('3');
  const [energyLevel, setEnergyLevel] = useState('3');
  const [performance, setPerformance] = useState('3');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const trend = useMemo(
    () => (profile ? analyseTrend(profile, checkIns) : null),
    [profile, checkIns],
  );

  const weightNum = Number.parseFloat(weight);
  const valid = Number.isFinite(weightNum) && weightNum > 0;

  const handleSubmit = () => {
    if (!valid) return;

    submitCheckIn({
      weekStarting: weekStart(SEED_TODAY),
      weightKg: weightNum,
      waistCm: waist ? Number.parseFloat(waist) : null,
      planAdherence: Number.parseInt(planAdherence, 10) || 0,
      trainingAdherence: Number.parseInt(trainingAdherence, 10) || 0,
      hunger: Number.parseInt(hunger, 10) as 1 | 2 | 3 | 4 | 5,
      energy: Number.parseInt(energyLevel, 10) as 1 | 2 | 3 | 4 | 5,
      performance: Number.parseInt(performance, 10) as 1 | 2 | 3 | 4 | 5,
      sleepQuality: null,
      notes: notes || undefined,
    });

    track({
      name: 'weekly_checkin_completed',
      properties: { weeksObserved: checkIns.length + 1 },
    });
    setSubmitted(true);
  };

  return (
    <Screen
      footer={
        !submitted ? (
          <Button label="Submit check-in" onPress={handleSubmit} disabled={!valid} />
        ) : undefined
      }
    >
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Weekly check-in</Text>
        <Text variant="body" tone="tertiary">
          Trend over time beats any single weigh-in.
        </Text>
      </View>

      {/* Adjustment proposal — approval required before anything changes. */}
      {pendingAdjustment && pendingAdjustment.status === 'pending' ? (
        <Card marker="warning">
          <Text variant="h3">Suggested change</Text>
          <Text variant="body" tone="secondary" style={styles.reason}>
            {pendingAdjustment.reason}
          </Text>

          <View style={styles.adjustmentRow}>
            <StatBlock
              label="Current"
              value={pendingAdjustment.currentCalories.toLocaleString('en-GB')}
              unit="kcal"
              size="medium"
            />
            <Text variant="metricM" tone="tertiary">→</Text>
            <StatBlock
              label="Suggested"
              value={pendingAdjustment.suggestedCalories.toLocaleString('en-GB')}
              unit="kcal"
              size="medium"
              tone="accent"
            />
          </View>

          <View style={styles.adjustmentDetail}>
            <Text variant="caption" tone="tertiary">
              Observed: {pendingAdjustment.observedWeeklyRateKg.toFixed(2)} kg/week · Target:{' '}
              {pendingAdjustment.targetWeeklyRateKg.toFixed(2)} kg/week · Based on{' '}
              {pendingAdjustment.weeksObserved} weeks.
            </Text>
          </View>

          <View style={styles.adjustmentActions}>
            <Button
              label="Accept change"
              onPress={() => {
                acceptAdjustment();
                track({
                  name: 'adjustment_accepted',
                  properties: {
                    direction:
                      pendingAdjustment.suggestedCalories > pendingAdjustment.currentCalories
                        ? 'increase'
                        : 'decrease',
                  },
                });
                router.replace('/feed');
              }}
            />
            <Button
              label="Keep current target"
              variant="secondary"
              onPress={declineAdjustment}
            />
          </View>

          <Text variant="legal" tone="tertiary" style={styles.adjustmentNote}>
            Accepting replaces your calorie and macro targets. Your current meal plan was
            built for the old target, so it will need regenerating.
          </Text>
        </Card>
      ) : null}

      {submitted && !pendingAdjustment && trend ? (
        <Card>
          <Text variant="h3">No change needed</Text>
          <Text variant="body" tone="secondary" style={styles.reason}>
            {explainNoAdjustment(trend)}
          </Text>
          <Button
            label="Back to The Feed"
            variant="secondary"
            onPress={() => router.replace('/feed')}
          />
        </Card>
      ) : null}

      {trend && checkIns.length > 0 ? (
        <>
          <SectionHeader title="Your trend" />
          <Card>
            <View style={styles.statRow}>
              <StatBlock
                label="Weeks logged"
                value={String(trend.weeksObserved)}
                size="medium"
              />
              <StatBlock
                label="Observed rate"
                value={trend.observedWeeklyRateKg.toFixed(2)}
                unit="kg/wk"
                size="medium"
              />
              <StatBlock
                label="Target rate"
                value={trend.targetWeeklyRateKg.toFixed(2)}
                unit="kg/wk"
                size="medium"
              />
            </View>
            <Text variant="caption" tone="tertiary" style={styles.trendNote}>
              Calculated as a trend line across every check-in, so one heavy morning does
              not swing the conclusion.
            </Text>
          </Card>
        </>
      ) : null}

      {!submitted ? (
        <>
          <SectionHeader title="This week" />
          <View style={styles.fields}>
            <Field
              label="Weight"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              suffix="kg"
              hint="Weigh yourself at the same time of day, ideally first thing."
            />
            <Field
              label="Waist"
              value={waist}
              onChangeText={setWaist}
              keyboardType="decimal-pad"
              suffix="cm"
              hint="Optional, but often more useful than the scale."
            />
            <Field
              label="Plan adherence"
              value={planAdherence}
              onChangeText={setPlanAdherence}
              keyboardType="number-pad"
              suffix="%"
              hint="Be honest. The Kennel will not change your calories if the plan was not followed."
            />
            <Field
              label="Training adherence"
              value={trainingAdherence}
              onChangeText={setTrainingAdherence}
              keyboardType="number-pad"
              suffix="%"
            />
          </View>

          <SectionHeader title="How did it feel?" />
          <View style={styles.scales}>
            <ChoiceGroup
              label="Hunger (1 low, 5 high)"
              choices={SCALE}
              selected={hunger}
              onSelect={setHunger}
              layout="inline"
            />
            <ChoiceGroup
              label="Energy (1 low, 5 high)"
              choices={SCALE}
              selected={energyLevel}
              onSelect={setEnergyLevel}
              layout="inline"
            />
            <ChoiceGroup
              label="Training performance (1 poor, 5 strong)"
              choices={SCALE}
              selected={performance}
              onSelect={setPerformance}
              layout="inline"
            />
          </View>

          <SectionHeader title="Notes" />
          <Field
            label="Anything worth recording"
            value={notes}
            onChangeText={setNotes}
            placeholder="Travel, illness, a heavy week at work…"
            multiline
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  reason: { marginTop: sp.sm, marginBottom: sp.lg },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: sp.lg,
  },
  adjustmentDetail: { marginBottom: sp.lg },
  adjustmentActions: { gap: sp.sm },
  adjustmentNote: { marginTop: sp.lg },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  trendNote: { marginTop: sp.lg },
  fields: { gap: sp.xl },
  scales: { gap: sp.xxl },
});
