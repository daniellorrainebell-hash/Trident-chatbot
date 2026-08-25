import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, ListRow, MacroRow, Pill, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { colors, space as sp } from '@/design';
import { useNutritionStore } from '@/store/nutritionStore';
import { useUserStore, hasAcceptedNutritionDisclaimer } from '@/store/userStore';
import { assessTimeframe } from '@/engines/nutrition/energy';
import { SEED_TODAY } from '@/data/seed';
import { formatDate } from '@/utils/format';

/**
 * THE FEED — nutrition hub (spec §27, §88).
 *
 * The order of this screen mirrors the architecture: targets exist before a plan
 * does, and a safety decision exists before targets do. Each stage is only
 * reachable once the previous one has produced something valid, so a user cannot
 * end up looking at meals built on an unapproved target.
 */
export default function FeedScreen() {
  const profile = useNutritionStore((s) => s.profile);
  const energy = useNutritionStore((s) => s.energy);
  const plan = useNutritionStore((s) => s.plan);
  const safetyDecision = useNutritionStore((s) => s.safetyDecision);
  const pendingAdjustment = useNutritionStore((s) => s.pendingAdjustment);
  const checkIns = useNutritionStore((s) => s.checkIns);
  const consent = useUserStore((s) => s.consent);

  const disclaimerAccepted = hasAcceptedNutritionDisclaimer(consent);
  const timeframe = profile ? assessTimeframe(profile) : null;
  const todayPlan = plan?.days.find((d) => d.date === SEED_TODAY);

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">The Feed</Text>
        <Text variant="body" tone="tertiary">
          Targets you can trust, built around food you actually eat.
        </Text>
      </View>

      {/* A blocked profile shows the decision and nothing else. */}
      {safetyDecision && !safetyDecision.approved ? (
        <Card marker="warning">
          <Text variant="h3">Automated planning is not available</Text>
          <Text variant="body" tone="secondary" style={styles.blockedMessage}>
            {safetyDecision.message}
          </Text>
          <Text variant="legal" tone="tertiary" style={styles.blockedNote}>
            Everything else in The Kennel remains available to you. Policy version{' '}
            {safetyDecision.policyVersion}.
          </Text>
        </Card>
      ) : null}

      {!disclaimerAccepted ? (
        <Card marker="warning">
          <Text variant="h3">Before you start</Text>
          <Text variant="bodySmall" tone="secondary" style={styles.blockedMessage}>
            The nutrition features need you to read and accept a short disclaimer first.
          </Text>
          <Button
            label="Read the disclaimer"
            variant="secondary"
            onPress={() => router.push('/feed/disclaimer')}
          />
        </Card>
      ) : null}

      <SectionHeader title="Your targets" />
      {energy ? (
        <Card onPress={() => router.push('/feed/targets')}>
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
          <View style={styles.targetMeta}>
            <Pill
              label={
                energy.calorieAdjustment < 0
                  ? `${energy.calorieAdjustment} kcal deficit`
                  : energy.calorieAdjustment > 0
                    ? `+${energy.calorieAdjustment} kcal surplus`
                    : 'Maintenance'
              }
              tone="accent"
            />
            {timeframe && timeframe.requestedWeeks && !timeframe.withinPolicy ? (
              <Pill label="Timeframe adjusted" tone="warning" />
            ) : null}
          </View>
          <Text variant="legal" tone="tertiary" style={styles.estimate}>
            Estimates from the {energy.equation.replace(/_/g, '-')} equation and the
            information you provided. Not medical advice.
          </Text>
        </Card>
      ) : (
        <Card>
          <Text variant="h3">No targets yet</Text>
          <Text variant="bodySmall" tone="tertiary" style={styles.blockedMessage}>
            Tell The Kennel about you and your goal. Calories and macros are calculated,
            not guessed.
          </Text>
          <Button
            label="Set up nutrition"
            onPress={() => router.push('/feed/profile')}
            disabled={!disclaimerAccepted}
          />
        </Card>
      )}

      {energy ? (
        <>
          <SectionHeader title="Today" />
          {todayPlan ? (
            <Card onPress={() => router.push(`/feed/day/${todayPlan.id}`)}>
              <View style={styles.dayHeader}>
                <Text variant="h3">
                  {new Date(`${todayPlan.date}T00:00:00Z`).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    timeZone: 'UTC',
                  })}
                </Text>
                {todayPlan.isTrainingDay ? <Pill label="Training day" tone="accent" /> : null}
              </View>
              <View style={styles.dayMacros}>
                <MacroRow
                  nutrients={todayPlan.totals}
                  target={{
                    calories: todayPlan.targets.calories,
                    proteinG: todayPlan.targets.proteinG,
                    carbsG: todayPlan.targets.carbsG,
                    fatG: todayPlan.targets.fatG,
                    fibreG: todayPlan.targets.fibreG,
                  }}
                />
              </View>
              <Text variant="caption" tone="tertiary" style={styles.mealCount}>
                {todayPlan.meals.length} meals planned
              </Text>
            </Card>
          ) : (
            <Card>
              <Text variant="h3">No plan for this week</Text>
              <Text variant="bodySmall" tone="tertiary" style={styles.blockedMessage}>
                Pick the food you like, then generate a 7-day plan with three choices
                per meal.
              </Text>
              <Button
                label="Build a plan"
                onPress={() => router.push('/feed/preferences')}
              />
            </Card>
          )}
        </>
      ) : null}

      {pendingAdjustment ? (
        <>
          <SectionHeader title="Suggested change" />
          <Card marker="warning" onPress={() => router.push('/feed/check-in')}>
            <Text variant="body" tone="secondary">
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
              />
            </View>
            <Text variant="caption" tone="tertiary">
              Nothing changes until you approve it.
            </Text>
          </Card>
        </>
      ) : null}

      <SectionHeader title="Food Scanner" />
      <Card onPress={() => router.push('/feed/scanner')}>
        <Text variant="h3">Scan a product</Text>
        <Text variant="bodySmall" tone="tertiary" style={styles.scannerBody}>
          See what it contains. Check how it fits. Add it to your plan.
        </Text>
        <View style={styles.scannerRow}>
          <Pill label="Barcode" tone="accent" />
          <Pill label="Nutrition label" tone="accent" />
          <Pill label="Manual" />
        </View>
      </Card>

      <SectionHeader title="Manage" />
      <Card padded={false} style={styles.list}>
        <ListRow
          title="Your plan"
          subtitle={plan ? `Week of ${formatDate(plan.weekStarting)}` : 'Not generated'}
          onPress={() => router.push('/feed/plan')}
        />
        <ListRow
          title="Food preferences"
          subtitle="Love it, don't mind it, keep it out, can't eat"
          onPress={() => router.push('/feed/preferences')}
        />
        <ListRow
          title="My Foods"
          subtitle="Everything you have scanned or entered"
          onPress={() => router.push('/feed/my-foods')}
        />
        <ListRow
          title="Shopping list"
          subtitle={plan ? 'Generated from your plan' : 'Needs a plan first'}
          onPress={() => router.push('/feed/shopping-list')}
        />
        <ListRow
          title="Meal prep"
          subtitle="Batch quantities for 3, 5 or 7 days"
          onPress={() => router.push('/feed/meal-prep')}
        />
        <ListRow
          title="Weekly check-in"
          subtitle={
            checkIns.length > 0
              ? `${checkIns.length} logged`
              : 'Weight, adherence and how you feel'
          }
          onPress={() => router.push('/feed/check-in')}
        />
        <ListRow
          title="Export to Excel"
          subtitle="A formatted .xlsx workbook"
          onPress={() => router.push('/feed/export')}
          last
        />
      </Card>

      <Text variant="legal" tone="tertiary" style={styles.footer}>
        The Kennel's nutrition features are for general fitness and educational purposes
        only and are not medical advice. Calorie and macronutrient figures are estimates
        based on the information you provide, and individual results vary.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  blockedMessage: { marginTop: sp.sm, marginBottom: sp.lg },
  blockedNote: { marginTop: sp.sm },
  targetMeta: { flexDirection: 'row', gap: sp.sm, marginTop: sp.lg, flexWrap: 'wrap' },
  estimate: { marginTop: sp.lg },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayMacros: { marginTop: sp.lg },
  mealCount: { marginTop: sp.md },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: sp.xl,
  },
  scannerBody: { marginTop: sp.xs, marginBottom: sp.lg },
  scannerRow: { flexDirection: 'row', gap: sp.sm, flexWrap: 'wrap' },
  list: { paddingHorizontal: sp.lg },
  footer: { marginTop: sp.xxxl },
});
