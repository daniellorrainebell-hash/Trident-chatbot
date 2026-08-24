import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, Pill, ProgressBar, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { colors, space as sp } from '@/design';
import { seedFightCamp, SEED_TODAY } from '@/data/seed';
import { daysBetween } from '@/engines/training/contracts';
import { formatDate } from '@/utils/format';

/**
 * FIGHT CAMP (spec §24).
 *
 * Tracks the work of a camp — rounds, roadwork, sessions — and shows bodyweight
 * against target as information, not as instruction.
 *
 * What this screen deliberately does not do is tell anyone how to make weight.
 * Spec §24 rules out dangerous rapid weight-cut guidance, so the weight panel
 * reports where you are and points at your coach for the rest. A tracker that
 * volunteered cutting advice would be the most harmful thing in the app.
 */
export default function FightCampScreen() {
  const camp = seedFightCamp;

  const totalDays = daysBetween(camp.campStartDate, camp.fightDate) + 1;
  const elapsedDays = daysBetween(camp.campStartDate, SEED_TODAY) + 1;
  const daysToFight = daysBetween(SEED_TODAY, camp.fightDate);
  const campFraction = Math.min(1, Math.max(0, elapsedDays / totalDays));

  const weightToLose = camp.currentWeightKg - camp.targetWeightKg;
  const weeksRemaining = Math.max(1, daysToFight / 7);
  const requiredWeeklyRate = weightToLose / weeksRemaining;

  const expectedSessions = Math.round((camp.plannedWeeklySessions * elapsedDays) / 7);
  const aheadOfPlan = camp.sessionsCompleted >= expectedSessions;

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <View style={styles.titleRow}>
          <Text variant="h1">Fight Camp</Text>
          <Pill label={camp.discipline.replace('_', ' ')} tone="accent" />
        </View>
        {camp.opponent ? (
          <Text variant="body" tone="tertiary">
            vs {camp.opponent} · {formatDate(camp.fightDate)}
          </Text>
        ) : null}
      </View>

      <Card marker="live">
        <Text variant="overline" tone="tertiary">
          Camp progress
        </Text>
        <View style={styles.dayRow}>
          <Text variant="metricXL">{elapsedDays}</Text>
          <Text variant="metricM" tone="tertiary">
            / {totalDays}
          </Text>
        </View>
        <ProgressBar
          fraction={campFraction}
          value={`${daysToFight} days to fight`}
          style={styles.campProgress}
        />
      </Card>

      <SectionHeader title="Work logged" />
      <Card>
        <View style={styles.statRow}>
          <StatBlock
            label="Sessions"
            value={String(camp.sessionsCompleted)}
            detail={aheadOfPlan ? 'On or ahead of plan' : `${expectedSessions} planned by now`}
            size="large"
            tone={aheadOfPlan ? 'success' : 'warning'}
          />
          <StatBlock
            label="Roadwork"
            value={String(camp.roadworkKm)}
            unit="km"
            size="large"
          />
        </View>

        <View style={[styles.statRow, styles.secondRow]}>
          <StatBlock label="Sparring" value={String(camp.sparringRounds)} unit="rds" size="medium" />
          <StatBlock label="Bag" value={String(camp.bagRounds)} unit="rds" size="medium" />
          <StatBlock label="Pads" value={String(camp.padRounds)} unit="rds" size="medium" />
        </View>

        <View style={[styles.statRow, styles.secondRow]}>
          <StatBlock label="Strength" value={String(camp.strengthSessions)} size="medium" />
          <StatBlock label="Conditioning" value={String(camp.conditioningSessions)} size="medium" />
          <StatBlock label="Recovery" value={String(camp.recoverySessions)} size="medium" />
        </View>
      </Card>

      <SectionHeader title="Weight" />
      <Card>
        <View style={styles.statRow}>
          <StatBlock
            label="Current"
            value={camp.currentWeightKg.toFixed(1)}
            unit="kg"
            size="large"
          />
          <StatBlock
            label="Target"
            value={camp.targetWeightKg.toFixed(1)}
            unit="kg"
            size="large"
          />
        </View>

        <View style={styles.weightGap}>
          <Text variant="bodySmall" tone="secondary">
            {weightToLose > 0
              ? `${weightToLose.toFixed(1)} kg above target with ${daysToFight} days to go — about ${requiredWeeklyRate.toFixed(2)} kg per week.`
              : 'At or under target weight.'}
          </Text>
        </View>

        {/* No cutting protocol, no schedule, no instruction. Deliberately. */}
        <View style={styles.weightNotice}>
          <Text variant="bodySmall" tone="warning">
            The Kennel tracks your weight. It does not tell you how to make it.
          </Text>
          <Text variant="legal" tone="tertiary" style={styles.weightNoticeBody}>
            Weight management for competition should be planned and supervised by your
            coach and an appropriately qualified professional, and follow your governing
            body's rules. Rapid weight cutting carries real risk.
          </Text>
        </View>
      </Card>

      <SectionHeader title="Weekly plan" />
      <Card>
        <View style={styles.planRow}>
          <Text variant="bodySmall" tone="tertiary">Planned sessions</Text>
          <Text variant="metricS">{camp.plannedWeeklySessions} / week</Text>
        </View>
        <View style={styles.planRow}>
          <Text variant="bodySmall" tone="tertiary">Camp started</Text>
          <Text variant="bodyStrong">{formatDate(camp.campStartDate)}</Text>
        </View>
        <View style={styles.planRow}>
          <Text variant="bodySmall" tone="tertiary">Fight date</Text>
          <Text variant="bodyStrong">{formatDate(camp.fightDate)}</Text>
        </View>
      </Card>

      <Button
        label="Log a camp session"
        onPress={() => router.push('/train')}
        style={styles.logButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.sm, alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: sp.md, flexWrap: 'wrap' },
  dayRow: { flexDirection: 'row', alignItems: 'baseline', gap: sp.sm, marginTop: sp.xs },
  campProgress: { marginTop: sp.lg },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  secondRow: { marginTop: sp.xl },
  weightGap: { marginTop: sp.xl },
  weightNotice: {
    marginTop: sp.xl,
    paddingTop: sp.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    gap: sp.sm,
  },
  weightNoticeBody: { marginTop: sp.xxs },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sp.sm,
  },
  logButton: { marginTop: sp.xxl },
});
