import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Card, EmptyState, ListRow, Pill, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { colors, space as sp } from '@/design';
import { useWorkoutStore } from '@/store/workoutStore';
import { useContractStore } from '@/store/contractStore';
import { useUserStore } from '@/store/userStore';
import { workoutVolumeKg, countWorkingSets } from '@/engines/training/volume';
import { calculateStreak } from '@/engines/training/streaks';
import { describePR } from '@/engines/training/personalRecords';
import { SEED_TODAY, seedBodyMetrics, seedCurrentRecords } from '@/data/seed';
import { formatVolume, formatNumber, formatDate, formatShortDate } from '@/utils/format';

type Range = 'week' | 'month' | 'year' | 'all';

const RANGES: Array<{ id: Range; label: string; days: number | null }> = [
  { id: 'week', label: 'Week', days: 7 },
  { id: 'month', label: 'Month', days: 30 },
  { id: 'year', label: 'Year', days: 365 },
  { id: 'all', label: 'All time', days: null },
];

/**
 * THE RECORD — long-term history (spec §16).
 *
 * The product's promise is that training history becomes permanent value, so
 * this screen is where that value is visible. Failed Contracts appear here
 * alongside completed ones: the record is the record, and being able to hide a
 * broken promise would make every kept one worth less.
 */
export default function RecordScreen() {
  const [range, setRange] = useState<Range>('month');

  const history = useWorkoutStore((s) => s.history);
  const contracts = useContractStore((s) => s.contracts);
  const profile = useUserStore((s) => s.profile);
  const trainingProfile = useUserStore((s) => s.trainingProfile);

  const filtered = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)?.days;
    if (days == null) return history;

    const cutoff = new Date(`${SEED_TODAY}T00:00:00.000Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - days);
    const cutoffIso = cutoff.toISOString().slice(0, 10);

    return history.filter((w) => (w.completedAt ?? '').slice(0, 10) >= cutoffIso);
  }, [history, range]);

  const totals = useMemo(
    () => ({
      workouts: filtered.length,
      sets: filtered.reduce((s, w) => s + countWorkingSets(w), 0),
      volume: filtered.reduce((s, w) => s + workoutVolumeKg(w), 0),
      reps: filtered.reduce(
        (s, w) =>
          s +
          w.exercises.reduce(
            (es, e) => es + e.sets.filter((set) => set.completed && !set.isWarmup).reduce((rs, set) => rs + (set.reps ?? 0), 0),
            0,
          ),
        0,
      ),
    }),
    [filtered],
  );

  const streak = calculateStreak(history, SEED_TODAY, trainingProfile?.sessionsPerWeek ?? 4);

  const completedContracts = contracts.filter((c) => c.status === 'completed');
  const failedContracts = contracts.filter((c) => c.status === 'failed');

  const recentSessions = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
        .slice(0, 12),
    [filtered],
  );

  const weightHistory = seedBodyMetrics
    .filter((m) => m.kind === 'weight')
    .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn));

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1">The Record</Text>
        <Text variant="bodySmall" tone="tertiary">
          Member since {profile ? formatDate(profile.memberSince) : '—'}
        </Text>
      </View>

      <View style={styles.ranges}>
        {RANGES.map((r) => (
          <Pill
            key={r.id}
            label={r.label}
            selected={range === r.id}
            onPress={() => setRange(r.id)}
          />
        ))}
      </View>

      <Card style={styles.totalsCard}>
        <View style={styles.statRow}>
          <StatBlock label="Sessions" value={formatNumber(totals.workouts)} size="large" />
          <StatBlock
            label="Volume"
            value={formatVolume(totals.volume).split(' ')[0] ?? '0'}
            unit="kg"
            size="large"
          />
        </View>
        <View style={[styles.statRow, styles.secondRow]}>
          <StatBlock label="Working sets" value={formatNumber(totals.sets)} size="medium" />
          <StatBlock label="Reps" value={formatNumber(totals.reps)} size="medium" />
          <StatBlock
            label="Longest streak"
            value={String(streak.longest)}
            unit="wks"
            size="medium"
          />
        </View>
      </Card>

      <SectionHeader title="PR Board" />
      {seedCurrentRecords.length > 0 ? (
        <Card padded={false} style={styles.list}>
          {seedCurrentRecords.slice(0, 8).map((pr, i) => (
            <ListRow
              key={pr.id}
              title={pr.exerciseName}
              subtitle={pr.type.replace(/_/g, ' ')}
              value={describePR(pr)}
              valueDetail={formatShortDate(pr.achievedAt)}
              last={i === Math.min(seedCurrentRecords.length, 8) - 1}
            />
          ))}
        </Card>
      ) : (
        <EmptyState title="No records yet" message="Your first logged set sets your first record." />
      )}

      <SectionHeader title="Contracts" />
      <Card>
        <View style={styles.statRow}>
          <StatBlock
            label="Completed"
            value={String(completedContracts.length)}
            size="medium"
            tone="success"
          />
          <StatBlock
            label="Broken"
            value={String(failedContracts.length)}
            size="medium"
            tone={failedContracts.length > 0 ? 'danger' : 'primary'}
          />
          <StatBlock
            label="Active"
            value={String(contracts.filter((c) => c.status === 'active').length)}
            size="medium"
          />
        </View>
      </Card>

      {contracts.filter((c) => c.status !== 'draft').length > 0 ? (
        <Card padded={false} style={[styles.list, styles.spacedList]}>
          {contracts
            .filter((c) => c.status !== 'draft')
            .sort((a, b) => b.startDate.localeCompare(a.startDate))
            .map((contract, i, arr) => (
              <ListRow
                key={contract.id}
                title={contract.title}
                subtitle={`${formatShortDate(contract.startDate)} – ${formatShortDate(contract.endDate)}`}
                last={i === arr.length - 1}
                onPress={() => router.push(`/contracts/${contract.id}`)}
                trailing={
                  <Pill
                    label={contract.status}
                    tone={
                      contract.status === 'completed'
                        ? 'success'
                        : contract.status === 'failed'
                          ? 'danger'
                          : 'neutral'
                    }
                  />
                }
              />
            ))}
        </Card>
      ) : null}

      <SectionHeader title="Bodyweight" />
      {weightHistory.length > 0 ? (
        <Card>
          <View style={styles.statRow}>
            <StatBlock
              label="Current"
              value={String(weightHistory[0]!.value)}
              unit="kg"
              detail={formatShortDate(weightHistory[0]!.recordedOn)}
              size="large"
            />
            <StatBlock
              label="Change"
              value={`${(weightHistory[0]!.value - weightHistory[weightHistory.length - 1]!.value).toFixed(1)}`}
              unit="kg"
              detail={`Since ${formatShortDate(weightHistory[weightHistory.length - 1]!.recordedOn)}`}
              size="large"
            />
          </View>
          <View style={styles.sparkline}>
            {[...weightHistory].reverse().map((metric, i, arr) => {
              const values = arr.map((m) => m.value);
              const min = Math.min(...values);
              const max = Math.max(...values);
              const spread = max - min || 1;
              const heightPercent = 20 + ((metric.value - min) / spread) * 80;

              return (
                <View
                  key={metric.id}
                  style={[styles.sparkBar, { height: `${heightPercent}%` }]}
                  accessibilityLabel={`${metric.value} kg on ${formatShortDate(metric.recordedOn)}`}
                />
              );
            })}
          </View>
        </Card>
      ) : (
        <EmptyState title="No weigh-ins" message="Log your bodyweight to see the trend." />
      )}

      <SectionHeader title="Sessions" />
      {recentSessions.length > 0 ? (
        <Card padded={false} style={styles.list}>
          {recentSessions.map((workout, i) => (
            <ListRow
              key={workout.id}
              title={workout.title}
              subtitle={formatDate(workout.completedAt ?? workout.startedAt)}
              value={formatVolume(workoutVolumeKg(workout)).split(' ')[0]}
              valueDetail={`${countWorkingSets(workout)} sets`}
              last={i === recentSessions.length - 1}
              onPress={() => router.push(`/workout/${workout.id}`)}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title="Nothing in this range"
          message="Try a longer range, or log a session."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.lg, marginBottom: sp.lg, gap: sp.xs },
  ranges: { flexDirection: 'row', gap: sp.sm, marginBottom: sp.lg, flexWrap: 'wrap' },
  totalsCard: { gap: sp.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  secondRow: { marginTop: sp.xl },
  list: { paddingHorizontal: sp.lg },
  spacedList: { marginTop: sp.md },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: sp.xs,
    height: 64,
    marginTop: sp.xl,
  },
  sparkBar: {
    flex: 1,
    backgroundColor: colors.accent.steelDim,
    borderRadius: 2,
    minHeight: 4,
  },
});
