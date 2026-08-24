import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Button, Card, EmptyState, Pill, ProgressBar, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { space as sp } from '@/design';
import { useContractStore } from '@/store/contractStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { calculateProgress, contributionFrom } from '@/engines/training/contracts';
import { SEED_TODAY } from '@/data/seed';
import { formatDate } from '@/utils/format';

/**
 * A single Contract (spec §86).
 *
 * Shows the contributing sessions so progress is auditable — the user can see
 * exactly which work counted, rather than trusting a bare number.
 *
 * There is no delete action anywhere on this screen. That is the feature.
 */
export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contracts = useContractStore((s) => s.contracts);
  const activateContract = useContractStore((s) => s.activateContract);
  const history = useWorkoutStore((s) => s.history);

  const contract = contracts.find((c) => c.id === id);

  if (!contract) {
    return (
      <Screen>
        <EmptyState
          title="Contract not found"
          message="This Contract is not in your record."
          action={{ label: 'All Contracts', onPress: () => router.replace('/contracts') }}
        />
      </Screen>
    );
  }

  const progress = calculateProgress(contract, history, SEED_TODAY);

  const contributing = history
    .filter((w) => contributionFrom(w, contract) > 0)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  return (
    <Screen
      footer={
        contract.status === 'draft' ? (
          <Button
            label="Sign this Contract"
            onPress={() => {
              activateContract(contract.id);
              router.back();
            }}
          />
        ) : undefined
      }
    >
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <View style={styles.titleRow}>
          <Text variant="h1" style={styles.title}>
            {contract.title}
          </Text>
          <Pill
            label={progress.status}
            tone={
              progress.status === 'completed'
                ? 'success'
                : progress.status === 'failed'
                  ? 'danger'
                  : 'neutral'
            }
          />
        </View>
      </View>

      <Card
        marker={
          progress.status === 'failed'
            ? 'danger'
            : progress.status === 'completed'
              ? 'success'
              : progress.offPace
                ? 'warning'
                : 'none'
        }
      >
        <ProgressBar
          fraction={progress.fraction}
          tone={
            progress.status === 'completed'
              ? 'success'
              : progress.status === 'failed'
                ? 'danger'
                : progress.offPace
                  ? 'warning'
                  : 'default'
          }
          value={`${progress.current} / ${contract.target} ${contract.unit}`}
          height={10}
        />

        <View style={styles.statRow}>
          <StatBlock
            label="Logged"
            value={String(progress.current)}
            unit={contract.unit}
            size="medium"
          />
          <StatBlock
            label="Remaining"
            value={String(progress.remaining)}
            unit={contract.unit}
            size="medium"
          />
          <StatBlock
            label="Days left"
            value={String(progress.daysRemaining)}
            size="medium"
            tone={progress.daysRemaining <= 3 && progress.status === 'active' ? 'warning' : 'primary'}
          />
        </View>

        {progress.requiredDailyRate != null ? (
          <Text
            variant="bodySmall"
            tone={progress.offPace ? 'warning' : 'tertiary'}
            style={styles.rate}
          >
            {progress.offPace ? 'Behind pace. ' : ''}
            Needs {progress.requiredDailyRate.toFixed(2)} {contract.unit} per day from here.
          </Text>
        ) : null}
      </Card>

      <SectionHeader title="Terms" />
      <Card>
        <View style={styles.termRow}>
          <Text variant="bodySmall" tone="tertiary">Metric</Text>
          <Text variant="bodyStrong">{contract.metric.replace(/_/g, ' ')}</Text>
        </View>
        <View style={styles.termRow}>
          <Text variant="bodySmall" tone="tertiary">Target</Text>
          <Text variant="bodyStrong">{contract.target} {contract.unit}</Text>
        </View>
        <View style={styles.termRow}>
          <Text variant="bodySmall" tone="tertiary">Window</Text>
          <Text variant="bodyStrong">
            {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
          </Text>
        </View>
        <View style={styles.termRow}>
          <Text variant="bodySmall" tone="tertiary">Visibility</Text>
          <Text variant="bodyStrong">{contract.visibility}</Text>
        </View>
        <View style={styles.termRow}>
          <Text variant="bodySmall" tone="tertiary">Verification</Text>
          <Text variant="bodyStrong">{contract.verification}</Text>
        </View>
        {contract.failedAt ? (
          <View style={styles.termRow}>
            <Text variant="bodySmall" tone="tertiary">Failed</Text>
            <Text variant="bodyStrong" tone="danger">{formatDate(contract.failedAt)}</Text>
          </View>
        ) : null}
        {contract.completedAt ? (
          <View style={styles.termRow}>
            <Text variant="bodySmall" tone="tertiary">Completed</Text>
            <Text variant="bodyStrong" tone="success">{formatDate(contract.completedAt)}</Text>
          </View>
        ) : null}
      </Card>

      <SectionHeader
        title="Contributing sessions"
        subtitle="Progress is derived from logged work. Nothing here is entered by hand."
      />
      {contributing.length > 0 ? (
        <Card padded={false} style={styles.list}>
          {contributing.slice(0, 20).map((workout, i, arr) => (
            <View key={workout.id} style={styles.contributionRow}>
              <View style={styles.contributionBody}>
                <Text variant="bodyStrong">{workout.title}</Text>
                <Text variant="caption" tone="tertiary">
                  {formatDate(workout.completedAt ?? workout.startedAt)}
                </Text>
              </View>
              <Text variant="metricS">
                +{Math.round(contributionFrom(workout, contract) * 10) / 10}
              </Text>
            </View>
          ))}
        </Card>
      ) : (
        <EmptyState
          title="Nothing counted yet"
          message="Sessions inside the Contract window will appear here as you log them."
        />
      )}

      {contract.status === 'failed' ? (
        <Text variant="legal" tone="tertiary" style={styles.permanent}>
          This Contract was not met before its deadline. It stays in your record.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.md, alignItems: 'flex-start' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: sp.md, flexWrap: 'wrap' },
  title: { flexShrink: 1 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: sp.xxl },
  rate: { marginTop: sp.lg },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sp.sm,
    gap: sp.lg,
  },
  list: { paddingHorizontal: sp.lg, paddingVertical: sp.sm },
  contributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sp.md,
  },
  contributionBody: { flex: 1, gap: sp.xxs },
  permanent: { marginTop: sp.xxl },
});
