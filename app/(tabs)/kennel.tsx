import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  BrandMark, Button, Card, MacroRow, Pill, ProgressBar, RankDog,
  Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { colors, space as sp, radius } from '@/design';
import { useWorkoutStore } from '@/store/workoutStore';
import { useContractStore } from '@/store/contractStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useUserStore } from '@/store/userStore';
import { calculateStreak, weekStart } from '@/engines/training/streaks';
import { calculateProgress, describeProgress } from '@/engines/training/contracts';
import { workoutVolumeKg, countWorkingSets } from '@/engines/training/volume';
import { calculateRabidScore, levelLabel, nextLevel } from '@/engines/scoring/rabidScore';
import { describePR } from '@/engines/training/personalRecords';
import { SEED_TODAY, seedLeaderboard, seedTemplates } from '@/data/seed';
import { formatVolume, formatRank, formatRelative, formatDuration } from '@/utils/format';

/**
 * THE KENNEL — home (spec §11).
 *
 * The mark opens the screen: white on near-black, nothing behind it, "THE KENNEL"
 * set beneath in the display face. It is the first thing on the app's front door
 * and the only place the full wordmark appears at size.
 *
 * Below it the screen answers three questions in order and stops:
 *   1. What do I do right now?      the CTA, loudest element on the screen
 *   2. Am I keeping my promises?    the active Contract
 *   3. How is it going?             week, score, Pack, latest PR
 *
 * Spec §11 warns against dashboard overload, so everything else is a tap away.
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
  const now = new Date(`${SEED_TODAY}T20:00:00Z`);

  const streak = useMemo(
    () => calculateStreak(history, SEED_TODAY, weeklyTarget),
    [history, weeklyTarget],
  );

  const week = useMemo(() => {
    const monday = weekStart(SEED_TODAY);
    const sessions = history.filter((w) => (w.completedAt ?? '').slice(0, 10) >= monday);
    return {
      sessions,
      volume: sessions.reduce((sum, w) => sum + workoutVolumeKg(w), 0),
      sets: sessions.reduce((sum, w) => sum + countWorkingSets(w), 0),
      minutes: Math.round(sessions.reduce((sum, w) => sum + w.durationSeconds, 0) / 60),
    };
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
  const rung = nextLevel(score.total);
  const nextSession = seedTemplates[0];
  const todayPlan = plan?.days.find((d) => d.date === SEED_TODAY);

  return (
    <Screen>
      {/* The mark, dominant. */}
      <View style={styles.brand}>
        <BrandMark size="hero" />
      </View>

      {/* Identity sits under the mark, quiet by comparison. */}
      <View style={styles.identity}>
        <Text variant="bodyStrong">{profile?.displayName ?? 'Athlete'}</Text>
        <View style={styles.identityMeta}>
          <Text variant="caption" tone="tertiary">
            {profile?.gym ?? 'No gym set'}
          </Text>
          <View style={styles.dot} />
          <Text variant="caption" tone="tertiary">
            {levelLabel(score.level)} · {score.total}
          </Text>
        </View>
      </View>

      {/* 1. What do I do right now? */}
      {active ? (
        <Card marker="live">
          <View style={styles.rowTop}>
            <View style={styles.flex}>
              <Text variant="overline" tone="danger">
                Session in progress
              </Text>
              <Text variant="h2" style={styles.tight}>
                {active.title}
              </Text>
            </View>
            <Pill label="Live" tone="live" />
          </View>
          <Text variant="bodySmall" tone="tertiary" style={styles.tight}>
            {countWorkingSets(active)} sets logged · {formatVolume(workoutVolumeKg(active))}
          </Text>
          <Button
            label="Resume session"
            onPress={() => router.push('/workout/active')}
            style={styles.cta}
          />
        </Card>
      ) : (
        <Card>
          <View style={styles.rowTop}>
            <View style={styles.flex}>
              <Text variant="overline" tone="tertiary">
                Next session
              </Text>
              <Text variant="h2" style={styles.tight}>
                {nextSession?.name ?? 'Free session'}
              </Text>
            </View>
            {nextSession?.lastUsedAt ? (
              <Pill label={formatRelative(nextSession.lastUsedAt, now)} />
            ) : null}
          </View>

          {nextSession ? (
            <View style={styles.movements}>
              {nextSession.exercises.slice(0, 4).map((exercise) => (
                <View key={exercise.exerciseId} style={styles.movementRow}>
                  <Text variant="bodySmall" tone="secondary" numberOfLines={1} style={styles.flex}>
                    {exercise.exerciseName}
                  </Text>
                  <Text variant="caption" tone="tertiary">
                    {exercise.targetSets} × {exercise.targetReps ?? '—'}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

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
            <View style={styles.rowTop}>
              <Text variant="h3" style={styles.flex}>
                {activeContract.title}
              </Text>
              {contractProgress.offPace ? <Pill label="Behind" tone="warning" /> : null}
            </View>

            <ProgressBar
              fraction={contractProgress.fraction}
              tone={contractProgress.offPace ? 'warning' : 'default'}
              value={`${contractProgress.current} / ${activeContract.target}`}
              style={styles.progress}
            />

            <View style={styles.contractStats}>
              <StatBlock label="Logged" value={String(contractProgress.current)} size="small" />
              <StatBlock label="Left" value={String(contractProgress.remaining)} size="small" />
              <StatBlock
                label="Days"
                value={String(contractProgress.daysRemaining)}
                size="small"
              />
            </View>

            <Text
              variant="caption"
              tone={contractProgress.offPace ? 'warning' : 'tertiary'}
              style={styles.divider}
            >
              {describeProgress(activeContract, contractProgress)}
            </Text>
          </Card>
        </>
      ) : null}

      {/* 3. How is it going? */}
      <SectionHeader title="This week" />
      <Card>
        <View style={styles.weekTop}>
          <StatBlock
            label="Streak"
            value={String(streak.current)}
            unit={streak.current === 1 ? 'week' : 'weeks'}
            size="large"
          />
          <View style={styles.weekRight}>
            <Pill
              label={streak.weekSecured ? 'Week secured' : `${streak.sessionsThisWeek}/${streak.target}`}
              tone={streak.weekSecured ? 'success' : 'warning'}
            />
          </View>
        </View>

        <View style={styles.weekGrid}>
          <StatBlock
            label="Sessions"
            value={String(week.sessions.length)}
            detail={`of ${weeklyTarget}`}
            size="small"
          />
          <StatBlock
            label="Volume"
            value={formatVolume(week.volume).split(' ')[0] ?? '0'}
            unit="kg"
            size="small"
          />
          <StatBlock label="Sets" value={String(week.sets)} size="small" />
          <StatBlock label="Time" value={formatDuration(week.minutes * 60)} size="small" />
        </View>
      </Card>

      <View style={styles.dualRow}>
        <Card style={styles.dualCard} onPress={() => router.push('/profile')}>
          <Text variant="overline" tone="tertiary">
            Rabid Score
          </Text>
          <Text variant="metricL" style={styles.tight}>
            {score.total}
          </Text>
          <RankDog level={score.level} size={72} style={styles.rankDog} />
          <Pill label={levelLabel(score.level)} tone="accent" />
          <Text variant="caption" tone="tertiary" style={styles.tight}>
            {rung ? `${rung.pointsAway} to ${levelLabel(rung.level)}` : 'Top of the ladder'}
          </Text>
        </Card>

        <Card style={styles.dualCard} onPress={() => router.push('/pack')}>
          <Text variant="overline" tone="tertiary">
            Pack position
          </Text>
          <Text variant="metricL" style={styles.tight}>
            {packPosition ? formatRank(packPosition.rank) : '—'}
          </Text>
          <Pill
            label={
              !packPosition
                ? 'No Pack'
                : packPosition.change > 0
                  ? `Up ${packPosition.change}`
                  : packPosition.change < 0
                    ? `Down ${Math.abs(packPosition.change)}`
                    : 'Holding'
            }
            tone={
              !packPosition || packPosition.change === 0
                ? 'neutral'
                : packPosition.change > 0
                  ? 'success'
                  : 'danger'
            }
          />
          <Text variant="caption" tone="tertiary" style={styles.tight}>
            of {seedLeaderboard.length} in Ironworks
          </Text>
        </Card>
      </View>

      {latestPR ? (
        <>
          <SectionHeader
            title="Latest PR"
            action={{ label: 'PR Board', onPress: () => router.push('/record') }}
          />
          <Card marker="success" onPress={() => router.push('/record')}>
            <View style={styles.rowTop}>
              <View style={styles.flex}>
                <Text variant="h3">{latestPR.exerciseName}</Text>
                <Text variant="metricM" style={styles.tight}>
                  {describePR(latestPR)}
                </Text>
              </View>
              <Pill label={latestPR.previousValue == null ? 'First' : 'PR'} tone="success" />
            </View>
            <Text variant="caption" tone="tertiary" style={styles.divider}>
              {latestPR.previousValue != null
                ? `Beat ${latestPR.previousValue} · ${formatRelative(latestPR.achievedAt, now)}`
                : `First on this movement · ${formatRelative(latestPR.achievedAt, now)}`}
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
          <View style={styles.rowTop}>
            <Text variant="overline" tone="tertiary">
              {todayPlan ? "Today's plan" : 'Daily targets'}
            </Text>
            {todayPlan?.isTrainingDay ? <Pill label="Training day" tone="accent" /> : null}
          </View>
          <View style={styles.macros}>
            <MacroRow
              nutrients={
                todayPlan?.totals ?? {
                  calories: energy.macros.calories,
                  proteinG: energy.macros.proteinG,
                  carbsG: energy.macros.carbsG,
                  fatG: energy.macros.fatG,
                  fibreG: energy.macros.fibreG,
                }
              }
              target={
                todayPlan
                  ? {
                      calories: todayPlan.targets.calories,
                      proteinG: todayPlan.targets.proteinG,
                      carbsG: todayPlan.targets.carbsG,
                      fatG: todayPlan.targets.fatG,
                      fibreG: todayPlan.targets.fibreG,
                    }
                  : undefined
              }
            />
          </View>
          <Text variant="legal" tone="tertiary" style={styles.divider}>
            Estimates based on the information you provided. Not medical advice.
          </Text>
        </Card>
      ) : (
        <Card>
          <Text variant="h3">Nutrition not set up</Text>
          <Text variant="bodySmall" tone="tertiary" style={styles.tight}>
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

      <Text variant="legal" tone="tertiary" center style={styles.tagline}>
        You do not get credit for intentions. Only the work counts.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Equal padding top and bottom, and enough of it. The mark is the first thing
  // on the front door: it sits dead centre in its own block of air rather than
  // riding high in it. On a device the status bar inset stacks on top of this,
  // which is why the figure is generous rather than merely even.
  brand: { alignItems: 'center', paddingVertical: sp.xxxl },
  identity: { alignItems: 'center', marginBottom: sp.xxl, gap: sp.xs },
  identityMeta: { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.text.disabled },

  flex: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: sp.md },
  tight: { marginTop: sp.xs },
  /** Air above a call to action that follows body copy or a list inside a Card. */
  cta: { marginTop: sp.lg },
  rankDog: { marginTop: sp.xs, marginBottom: sp.xs },

  movements: {
    marginTop: sp.lg,
    paddingTop: sp.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    gap: sp.sm,
  },
  movementRow: { flexDirection: 'row', alignItems: 'center', gap: sp.md },

  progress: { marginTop: sp.lg },
  contractStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: sp.lg },
  divider: {
    marginTop: sp.md,
    paddingTop: sp.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },

  weekTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  weekRight: { alignItems: 'flex-end' },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: sp.xl,
    paddingTop: sp.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },

  dualRow: { flexDirection: 'row', gap: sp.md, marginTop: sp.md },
  dualCard: { flex: 1, gap: sp.sm, alignItems: 'flex-start' },

  macros: { marginTop: sp.md },
  tagline: { marginTop: sp.xxxl, letterSpacing: 0.3 },
});
