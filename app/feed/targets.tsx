import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, MacroRow, Pill, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { colors, space as sp } from '@/design';
import { useNutritionStore } from '@/store/nutritionStore';
import { assessTimeframe, projectTargetForTimeframe } from '@/engines/nutrition/energy';
import { DEFAULT_NUTRITION_POLICY } from '@/engines/nutrition/safetyPolicy';

const TIMEFRAME_OPTIONS = [4, 6, 8, 10, 12, 16, 20, 24, 30, 36];

/**
 * Targets and the goal timeline (spec §30, §31, §38, §51).
 *
 * The timeline is the screen where the safety policy becomes visible rather than
 * silent. Unsupported timeframes are shown and clearly marked as unsupported —
 * not hidden, and not quietly clamped behind the user's back. Seeing *why* a
 * 4-week target is refused, and what the earliest supported one is, is far more
 * useful than an error.
 */
export default function TargetsScreen() {
  const profile = useNutritionStore((s) => s.profile);
  const energy = useNutritionStore((s) => s.energy);
  const safetyDecision = useNutritionStore((s) => s.safetyDecision);

  // The timeline below is a read-only comparison: it marks the timeframe the
  // plan was built around. Held in state it could only ever go stale against
  // the profile, because nothing on this screen sets it.
  const selectedWeeks = profile?.requestedTimeframeWeeks ?? null;

  const timeframe = useMemo(
    () => (profile ? assessTimeframe(profile) : null),
    [profile],
  );

  const projections = useMemo(() => {
    if (!profile || profile.goal === 'maintain_recomp') return [];
    return TIMEFRAME_OPTIONS.map((weeks) => ({
      weeks,
      ...(projectTargetForTimeframe(profile, weeks) ?? {
        calories: 0,
        supported: false,
        weeklyRateKg: 0,
      }),
    }));
  }, [profile]);

  if (!energy || !profile) {
    return (
      <Screen>
        <Text variant="h2">No targets calculated</Text>
        <Button
          label="Set up nutrition"
          onPress={() => router.replace('/feed/profile')}
          style={styles.setup}
        />
      </Screen>
    );
  }

  const timeframeUnsupported =
    timeframe != null && timeframe.requestedWeeks != null && !timeframe.withinPolicy;

  return (
    <Screen
      footer={
        <Button
          label="Choose your food"
          onPress={() => router.push('/feed/preferences')}
        />
      }
    >
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Your targets</Text>
      </View>

      <Card>
        <MacroRow
          nutrients={{
            calories: energy.macros.calories,
            proteinG: energy.macros.proteinG,
            carbsG: energy.macros.carbsG,
            fatG: energy.macros.fatG,
            fibreG: energy.macros.fibreG,
          }}
          showFibre
        />
      </Card>

      <SectionHeader title="How this was worked out" />
      <Card>
        <View style={styles.statRow}>
          <StatBlock
            label="BMR"
            value={energy.bmr.toLocaleString('en-GB')}
            unit="kcal"
            size="medium"
          />
          <StatBlock
            label="Maintenance"
            value={energy.maintenanceCalories.toLocaleString('en-GB')}
            unit="kcal"
            size="medium"
          />
          <StatBlock
            label="Target"
            value={energy.targetCalories.toLocaleString('en-GB')}
            unit="kcal"
            size="medium"
          />
        </View>

        <View style={styles.derivation}>
          <Text variant="bodySmall" tone="tertiary">
            {energy.equation === 'mifflin_st_jeor' ? 'Mifflin-St Jeor' : 'Katch-McArdle'} equation
            (v{energy.equationVersion}), activity multiplier ×{energy.activityMultiplier}, then a{' '}
            {energy.calorieAdjustment === 0
              ? 'maintenance target'
              : `${Math.abs(energy.calorieAdjustment)} kcal ${energy.calorieAdjustment < 0 ? 'deficit' : 'surplus'}`}
            . Safety policy v{energy.policyVersion}.
          </Text>
        </View>
      </Card>

      {timeframeUnsupported && timeframe ? (
        <>
          <SectionHeader title="Your requested timeframe" />
          <Card marker="warning">
            <Text variant="body" tone="secondary">
              Your requested timeframe requires a rate of{' '}
              {timeframe.requestedWeeklyRateKg.toFixed(2)} kg per week, which is outside
              The Kennel's supported range of up to{' '}
              {timeframe.supportedWeeklyRateKg.toFixed(2)} kg per week.
            </Text>
            <View style={styles.earliest}>
              <StatBlock
                label="Earliest supported"
                value={String(timeframe.earliestSupportedWeeks)}
                unit="weeks"
                size="large"
              />
            </View>
            <Text variant="caption" tone="tertiary">
              Your targets have been set to the supported rate.
            </Text>
          </Card>
        </>
      ) : null}

      {projections.length > 0 ? (
        <>
          <SectionHeader
            title="Goal timeline"
            subtitle="Longer timeframes allow more calories. Unsupported ranges are marked."
          />
          <Card padded={false} style={styles.timeline}>
            {projections.map((projection) => {
              const selected = selectedWeeks === projection.weeks;

              return (
                <View
                  key={projection.weeks}
                  style={[
                    styles.timelineRow,
                    selected && styles.timelineRowSelected,
                    !projection.supported && styles.timelineRowUnsupported,
                  ]}
                >
                  <View style={styles.timelineLabel}>
                    <Text variant="bodyStrong" tone={projection.supported ? 'primary' : 'tertiary'}>
                      {projection.weeks} weeks
                    </Text>
                    <Text variant="caption" tone="tertiary">
                      {Math.abs(projection.weeklyRateKg).toFixed(2)} kg/week
                    </Text>
                  </View>

                  {projection.supported ? (
                    <View style={styles.timelineValue}>
                      <Text variant="metricS">
                        {projection.calories.toLocaleString('en-GB')}
                      </Text>
                      <Text variant="caption" tone="tertiary">kcal</Text>
                    </View>
                  ) : (
                    <Pill label="Not supported" tone="danger" />
                  )}
                </View>
              );
            })}
          </Card>
          <Text variant="legal" tone="tertiary" style={styles.timelineNote}>
            The Kennel supports up to{' '}
            {(DEFAULT_NUTRITION_POLICY.maxWeightLossRatePercentPerWeek * 100).toFixed(1)}% of
            bodyweight per week for loss and{' '}
            {(DEFAULT_NUTRITION_POLICY.maxWeightGainRatePercentPerWeek * 100).toFixed(1)}% for
            gain. Results vary and cannot be guaranteed, and gained bodyweight is not all
            muscle.
          </Text>
        </>
      ) : null}

      {safetyDecision?.referralSuggested ? (
        <Card marker="warning" style={styles.referral}>
          <Text variant="bodySmall" tone="secondary">
            Based on what you told us, it is worth checking these targets with an
            appropriately qualified healthcare professional before you follow them.
          </Text>
        </Card>
      ) : null}

      <Text variant="legal" tone="tertiary" style={styles.footer}>
        These are estimates based on the information you provided, not measurements.
        They are not medical advice.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  setup: { marginTop: sp.xl },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  derivation: { marginTop: sp.xl },
  earliest: { marginVertical: sp.xl },
  timeline: { paddingHorizontal: sp.lg },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sp.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  timelineRowSelected: { backgroundColor: colors.bg.panel },
  timelineRowUnsupported: { opacity: 0.6 },
  timelineLabel: { gap: sp.xxs },
  timelineValue: { flexDirection: 'row', alignItems: 'baseline', gap: sp.xs },
  timelineNote: { marginTop: sp.lg },
  referral: { marginTop: sp.xl },
  footer: { marginTop: sp.xxl },
});
