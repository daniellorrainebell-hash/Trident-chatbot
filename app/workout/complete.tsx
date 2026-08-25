import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useProgrammeStore } from '@/store/programmeStore';
import { sessionToday, weekdayIndex } from '@/engines/training/programme';
import { Button, Card, Pill, ProgressBar, Screen, SectionHeader, StatBlock, Text } from '@/components';
import { space as sp } from '@/design';
import { useWorkoutStore } from '@/store/workoutStore';
import { useContractStore } from '@/store/contractStore';
import { describePR } from '@/engines/training/personalRecords';
import { calculateProgress, describeProgress } from '@/engines/training/contracts';
import { calculateStreak } from '@/engines/training/streaks';
import { SEED_TODAY } from '@/data/seed';
import { formatVolume, formatDuration } from '@/utils/format';
import { useUserStore } from '@/store/userStore';

/**
 * Session complete (spec §12).
 *
 * The payoff screen. It answers, in order: what did I just do, did I beat
 * anything, and did it move my promises forward. PRs come first when there are
 * any — that is the moment worth celebrating, and it is deterministic, so the
 * number shown is one the user can trust.
 */
export default function WorkoutCompleteScreen() {
  const summary = useWorkoutStore((s) => s.lastSummary);
  const programme = useProgrammeStore((s) => s.active);
  const toggleDay = useProgrammeStore((s) => s.toggleDay);
  const history = useWorkoutStore((s) => s.history);
  const contracts = useContractStore((s) => s.contracts);
  const trainingProfile = useUserStore((s) => s.trainingProfile);

  const streak = calculateStreak(history, SEED_TODAY, trainingProfile?.sessionsPerWeek ?? 4);
  const activeContract = contracts.find((c) => c.status === 'active');
  const contractProgress = activeContract
    ? calculateProgress(activeContract, history, SEED_TODAY)
    : null;

  // Finishing a session ticks today off the programme, once. Doing it here
  // rather than at the start means the tick means "trained", not "intended to".
  useEffect(() => {
    if (!summary || !programme) return;
    const today = sessionToday(programme, SEED_TODAY);
    if (!today || today.isRest || today.isComplete) return;
    toggleDay(weekdayIndex(SEED_TODAY));
  }, [programme, summary, toggleDay]);

  if (!summary) {
    router.replace('/kennel');
    return null;
  }

  return (
    <Screen
      footer={<Button label="Done" onPress={() => router.replace('/kennel')} />}
    >
      <View style={styles.header}>
        <Text variant="overline" tone="success">
          Work logged
        </Text>
        <Text variant="h1">Session complete</Text>
      </View>

      <Card>
        <View style={styles.statRow}>
          <StatBlock
            label="Volume"
            value={formatVolume(summary.volumeKg).split(' ')[0] ?? '0'}
            unit="kg"
            size="large"
          />
          <StatBlock
            label="Duration"
            value={formatDuration(summary.durationSeconds)}
            size="large"
          />
        </View>
        <View style={[styles.statRow, styles.secondRow]}>
          <StatBlock label="Exercises" value={String(summary.exerciseCount)} size="medium" />
          <StatBlock label="Working sets" value={String(summary.workingSets)} size="medium" />
          <StatBlock label="Total reps" value={String(summary.totalReps)} size="medium" />
        </View>
      </Card>

      {summary.personalRecords.length > 0 ? (
        <>
          <SectionHeader title={summary.personalRecords.length === 1 ? 'Personal record' : 'Personal records'} />
          {summary.personalRecords.map((pr) => (
            <Card key={pr.id} marker="success" style={styles.prCard}>
              <View style={styles.prHeader}>
                <Text variant="h3">{pr.exerciseName}</Text>
                <Pill label={pr.previousValue == null ? 'First' : 'PR'} tone="success" />
              </View>
              <Text variant="metricM" style={styles.prValue}>
                {describePR(pr)}
              </Text>
              <Text variant="caption" tone="tertiary">
                {pr.previousValue == null
                  ? 'First record on this movement.'
                  : `Previous best: ${pr.previousValue}`}
              </Text>
            </Card>
          ))}
        </>
      ) : null}

      {activeContract && contractProgress ? (
        <>
          <SectionHeader title="Contract progress" />
          <Card>
            <Text variant="h3">{activeContract.title}</Text>
            <ProgressBar
              fraction={contractProgress.fraction}
              tone={contractProgress.status === 'completed' ? 'success' : 'default'}
              value={`${contractProgress.current} / ${activeContract.target}`}
              style={styles.progress}
            />
            <Text variant="bodySmall" tone="tertiary" style={styles.progressNote}>
              {describeProgress(activeContract, contractProgress)}
            </Text>
          </Card>
        </>
      ) : null}

      <SectionHeader title="Streak" />
      <Card>
        <StatBlock
          label={streak.weekSecured ? 'Weeks running' : 'Weeks running'}
          value={String(streak.current)}
          unit={streak.current === 1 ? 'week' : 'weeks'}
          detail={
            streak.weekSecured
              ? 'This week is secured.'
              : `${streak.target - streak.sessionsThisWeek} more session${
                  streak.target - streak.sessionsThisWeek === 1 ? '' : 's'
                } to secure this week.`
          }
          size="large"
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.lg, marginBottom: sp.xl, gap: sp.xs },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  secondRow: { marginTop: sp.xl },
  prCard: { marginBottom: sp.md },
  prHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prValue: { marginTop: sp.sm, marginBottom: sp.xs },
  progress: { marginTop: sp.lg },
  progressNote: { marginTop: sp.sm },
});
