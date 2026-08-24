import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, EmptyState, Pill, ProgressBar, Screen, SectionHeader, Text,
} from '@/components';
import { space as sp } from '@/design';
import { useContractStore } from '@/store/contractStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { calculateProgress, describeProgress } from '@/engines/training/contracts';
import { SEED_TODAY } from '@/data/seed';
import { formatShortDate } from '@/utils/format';
import type { Contract } from '@/types';

/**
 * Contracts list (spec §17, §86).
 *
 * Active first, then history — completed and failed together, in one list.
 * Failed Contracts are not tucked away in a separate tab, because separating
 * them would be a soft version of the deletion the spec forbids. The record is
 * the record.
 */
export default function ContractsScreen() {
  const contracts = useContractStore((s) => s.contracts);
  const history = useWorkoutStore((s) => s.history);

  const active = contracts.filter((c) => c.status === 'active');
  const drafts = contracts.filter((c) => c.status === 'draft');
  const past = contracts
    .filter((c) => c.status === 'completed' || c.status === 'failed')
    .sort((a, b) => b.endDate.localeCompare(a.endDate));

  const renderContract = (contract: Contract) => {
    const progress = calculateProgress(contract, history, SEED_TODAY);

    return (
      <Card
        key={contract.id}
        style={styles.card}
        marker={
          progress.status === 'failed'
            ? 'danger'
            : progress.status === 'completed'
              ? 'success'
              : progress.offPace
                ? 'warning'
                : 'none'
        }
        onPress={() => router.push(`/contracts/${contract.id}`)}
      >
        <View style={styles.cardHeader}>
          <Text variant="h3" style={styles.title}>
            {contract.title}
          </Text>
          <Pill
            label={progress.status}
            tone={
              progress.status === 'completed'
                ? 'success'
                : progress.status === 'failed'
                  ? 'danger'
                  : progress.offPace
                    ? 'warning'
                    : 'neutral'
            }
          />
        </View>

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
          style={styles.progress}
        />

        <Text variant="bodySmall" tone="tertiary" style={styles.detail}>
          {describeProgress(contract, progress)}
        </Text>
        <Text variant="caption" tone="tertiary">
          {formatShortDate(contract.startDate)} – {formatShortDate(contract.endDate)}
        </Text>
      </Card>
    );
  };

  return (
    <Screen footer={<Button label="New Contract" onPress={() => router.push('/contracts/new')} />}>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Contracts</Text>
        <Text variant="body" tone="tertiary">
          A Contract is a promise with a deadline. Broken ones stay in your record.
        </Text>
      </View>

      {drafts.length > 0 ? (
        <>
          <SectionHeader title="Not yet signed" />
          {drafts.map(renderContract)}
        </>
      ) : null}

      <SectionHeader title="Active" />
      {active.length > 0 ? (
        active.map(renderContract)
      ) : (
        <EmptyState
          title="No active Contract"
          message="Commit to something measurable with a deadline."
          action={{ label: 'Create one', onPress: () => router.push('/contracts/new') }}
        />
      )}

      {past.length > 0 ? (
        <>
          <SectionHeader
            title="History"
            subtitle="Kept and broken, together. Failed Contracts cannot be removed."
          />
          {past.map(renderContract)}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  card: { marginBottom: sp.md },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: sp.md,
  },
  title: { flex: 1 },
  progress: { marginTop: sp.lg },
  detail: { marginTop: sp.sm },
});
