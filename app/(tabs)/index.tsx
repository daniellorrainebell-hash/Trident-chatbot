import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, EmptyState, MacroRow, Pill, ProgressBar,
  Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { colors, space as sp } from '@/design';
import { useWorkoutStore } from '@/store/workoutStore';
import { useContractStore } from '@/store/contractStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useUserStore } from '@/store/userStore';
import { calculateStreak, weekStart } from '@/engines/training/streaks';
import { calculateProgress, describeProgress } from '@/engines/training/contracts';
import { workoutVolumeKg } from '@/engines/training/volume';
import { calculateRabidScore, levelLabel, nextLevel } from '@/engines/scoring/rabidScore';
import { describePR } from '@/engines/training/personalRecords';
import { SEED_TODAY, seedLeaderboard, seedTemplates } from '@/data/seed';
import { formatVolume, formatRank, formatRelative } from '@/utils/format';

/**
 * THE KENNEL — home (spec §11).
 *
 * The hierarchy is deliberate and the spec warns against dashboard overload, so
 * this screen answers three questions in order and stops:
 *
 *   1. What do I do right now?          → the CTA, first and loudest
 *   2. Am I keeping my promises?        → the active Contract
 *   3. How is it going?                 → streak, week, score, Pack
 *
 * Everything else is a tap away rather than on this screen.
 */
export default function KennelScreen() {
  const active = useWorkoutStore((s) => s.active);
  const history = useWorkoutStore((s) => s.history);
  const personalRecords = useWorkoutStore((s) => s.personalRecords);
  const contracts = useContractStore((s) => s.contracts);
  const energy = useNutritionStore((s) => s.energy);
  const plan = useNutritionStore((s) => s.plan);
  const profile = useUserStore((s) => s.profile);
  const trainingProfile = useUserStore((s) => s.trainingProfile);

  const weeklyTarget = trainingProfile?.sessionsPerWeek ?? 4;

  const streak = useMemo(
    () => calculateStreak(history, SEED_TODAY, weeklyTarget),
    [history, weeklyTarget],
  );

  const thisWeekVolume = useMemo(() => {
    const monday = weekStart(SEED_TODAY);
    return history
      .filter((w) => (w.completedAt ?? '').slice(0, 10) >= monday)
      .reduce((sum, w) => sum + workoutVolumeKg(w), 0);
  }, [history]);

  const activeContract = contracts.find((c) => c.status === 'active');
  const contractProgress = activeContract
    ? calculateProgress(activeContract, history, SEED_TODAY)
    : null;

  const score = useMemo(
    () =>
      calculateRabidScore({
        userId: profile?.id ?? 'user',
        workouts: history,
        contracts,
        personalRecords,
        challengesCompleted: 2,
        challengesJoined: 3,
        weeklyTarget,
        today: SEED_TODAY,
      }),
    [history, contracts, personalRecords, profile?.id, weeklyTarget],
  );

  const latestPR = personalRecords[personalRecords.length - 1];
  const packPosition = seedLeaderboard.find((e) => e.isCurrentUser);
  const nextRung = nextLevel(score.total);
  const nextSession = seedTemplates[0];

  const todayPlan = plan?.days.find((d) => d.date === SEED_TODAY);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="overline" tone="tertiary">
          The Kennel
        </Text>
        <Text variant="h1">{profile?.displayName ?? 'Athlete'}</Text>
      </View>

      {/* 1. What do I do right now? */}
      {active ? (
        <Card marker="live">
          <Text variant="overline" tone="danger">
            Session in progress
          </Text>
          <Text variant="h2" style={styles.cardTitle}>
            {active.title}
          </Text>
          <Text variant="bodySmall" tone="tertiary">
            {active.exercises.length} exercise{active.exercises.length === 1 ? '' : 's'} logged so far
          </Text>
          <Button
            label="Resume session"
            onPress={() => router.push('/workout/active')}
            style={styles.cta}
          />
        </Card>
      ) : (
        <Card>
          <Text variant="overline" tone="tertiary">
            Today
          </Text>
          <Text variant="h2" style={styles.cardTitle}>
            {nextSession?.name ?? 'Free session'}
          </Text>
          <Text variant="bodySmall" tone="tertiary">
            {nextSession
              ? `${nextSession.exercises.length} exercises. Last done ${
                  nextSession.lastUsedAt ? formatRelative(nextSession.lastUsedAt, new Date(`${SEED_TODAY}T20:00:00Z`)) : 'a while ago'
                }.`
              : 'Nothing planned. Log whatever you train.'}
          </Text>
          <Button label="Log the work" onPress={() => router.push('/train')} style={styles.cta} />
        </Card>
      )}

      {/* 2. Am I keeping my promises? */}
      {activeContract && contractProgress ? (
        <>
          <SectionHeader
            title="Active Contract"
            action={{ label: 'All', onPress: () => router.push('/contracts') }}
          />
          <Card
            marker={contractProgress.offPace ? 'warning' : 'none'}
            onPress={() => router.push(`/contracts/${activeContract.id}`)}
          >
            <Text variant="h3">{activeContract.title}</Text>
            <ProgressBar
              fraction={contractProgress.fraction}
              tone={contractProgress.offPace ? 'warning' : 'default'}
              value={`${contractProgress.current} / ${activeContract.target}`}
              style={styles.progress}
            />
            <Text
              variant="bodySmall"
              tone={contractProgress.offPace ? 'warning' : 'tertiary'}
              style={styles.progressNote}
            >
              {contractProgress.offPace
                ? `Behind pace. ${describeProgress(activeContract, contractProgress)}`
                : describeProgress(activeContract, contractProgress)}
            </Text>
          </Card>
        </>
      ) : null}

      {/* 3. How is it going? */}
      <SectionHeader title="This week" />
      <Card>
        <View style={styles.statRow}>
          <StatBlock
            label="Streak"
            value={String(streak.current)}
            unit={streak.current === 1 ? 'week' : 'weeks'}
            detail={streak.weekSecured ? 'This week secured' : `${streak.sessionsThisWeek} of ${streak.target} logged`}
            size="large"
          />
          <StatBlock
            label="Volume"
            value={formatVolume(thisWeekVolume).split(' ')[0] ?? '0'}
            unit="kg"
            detail={`${streak.sessionsThisWeek} session${streak.sessionsThisWeek === 1 ? '' : 's'}`}
            size="large"
          />
        </View>
      </Card>

      <View style={styles.dualRow}>
        <Card style={styles.dualCard} onPress={() => router.push('/profile')}>
          <Text variant="overline" tone="tertiary">
            Rabid Score
          </Text>
          <View style={styles.scoreRow}>
            <Text variant="metricL">{score.total}</Text>
            <Pill label={levelLabel(score.level)} tone="accent" />
          </View>
          <Text variant="caption" tone="tertiary">
            {nextRung ? `${nextRung.pointsAway} to ${levelLabel(nextRung.level)}` : 'Top of the ladder'}
          </Text>
        </Card>

        <Card style={styles.dualCard} onPress={() => router.push('/pack')}>
          <Text variant="overline" tone="tertiary">
            Pack position
          </Text>
          <Text variant="metricL">{packPosition ? formatRank(packPosition.rank) : '—'}</Text>
          <Text variant="caption" tone="tertiary">
            {packPosition
              ? packPosition.change > 0
                ? `Up ${packPosition.change} this week`
                : packPosition.change < 0
                  ? `Down ${Math.abs(packPosition.change)} this week`
                  : 'Holding position'
              : 'Not in a Pack'}
          </Text>
        </Card>
      </View>

      {latestPR ? (
        <>
          <SectionHeader title="Latest PR" />
          <Card onPress={() => router.push('/record')}>
            <Text variant="h3">{latestPR.exerciseName}</Text>
            <Text variant="metricM" style={styles.prValue}>
              {describePR(latestPR)}
            </Text>
            <Text variant="caption" tone="tertiary">
              {latestPR.previousValue != null
                ? `Beat ${latestPR.previousValue}`
                : 'First on the board'}
            </Text>
          </Card>
        </>
      ) : null}

      <SectionHeader
        title="The Feed"
        action={{ label: energy ? 'Open' : 'Set up', onPress: () => router.push('/feed') }}
      />
      {energy ? (
        <Card onPress={() => router.push('/feed')}>
          <Text variant="overline" tone="tertiary">
            {todayPlan ? "Today's targets" : 'Daily targets'}
          </Text>
          <View style={styles.macros}>
            <MacroRow
              nutrients={todayPlan?.totals ?? {
                calories: energy.macros.calories,
                proteinG: energy.macros.proteinG,
                carbsG: energy.macros.carbsG,
                fatG: energy.macros.fatG,
                fibreG: energy.macros.fibreG,
              }}
              target={todayPlan ? {
                calories: todayPlan.targets.calories,
                proteinG: todayPlan.targets.proteinG,
                carbsG: todayPlan.targets.carbsG,
                fatG: todayPlan.targets.fatG,
                fibreG: todayPlan.targets.fibreG,
              } : undefined}
            />
          </View>
          <Text variant="caption" tone="tertiary" style={styles.estimate}>
            Estimates based on the information you provided.
          </Text>
        </Card>
      ) : (
        <Card>
          <Text variant="h3">Nutrition not set up</Text>
          <Text variant="bodySmall" tone="tertiary" style={styles.cardTitle}>
            Set your targets and build a 7-day plan around the food you actually eat.
          </Text>
          <Button
            label="Set up The Feed"
            variant="secondary"
            onPress={() => router.push('/feed')}
            style={styles.cta}
          />
        </Card>
      )}

      {history.length === 0 ? (
        <EmptyState
          title="Nothing logged yet"
          message="The Kennel is where you prove the work. Start with one session."
          action={{ label: 'Start training', onPress: () => router.push('/train') }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.lg, marginBottom: sp.xl },
  cardTitle: { marginTop: sp.xs, marginBottom: sp.xs },
  cta: { marginTop: sp.lg },
  progress: { marginTop: sp.lg },
  progressNote: { marginTop: sp.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dualRow: { flexDirection: 'row', gap: sp.md, marginTop: sp.md },
  dualCard: { flex: 1, gap: sp.xs },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  prValue: { marginTop: sp.sm, marginBottom: sp.xs },
  macros: { marginTop: sp.sm },
  estimate: { marginTop: sp.md, color: colors.text.tertiary },
});
