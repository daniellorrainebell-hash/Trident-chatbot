import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, ChoiceGroup, Field, Screen, SectionHeader, Text,
  type Choice,
} from '@/components';
import { space as sp } from '@/design';
import { useContractStore } from '@/store/contractStore';
import { SEED_TODAY } from '@/data/seed';
import { track } from '@/services/analytics';
import type { ContractMetric, ContractVisibility } from '@/types';

type Preset = {
  id: string;
  title: string;
  metric: ContractMetric;
  target: number;
  unit: string;
  days: number;
};

/** Starting points drawn from the spec's own examples (§17). */
const PRESETS: Preset[] = [
  { id: 'sessions-16', title: '16 sessions in 30 days', metric: 'sessions', target: 16, unit: 'sessions', days: 30 },
  { id: 'sessions-20', title: '20 sessions this month', metric: 'sessions', target: 20, unit: 'sessions', days: 30 },
  { id: 'run-100', title: 'Run 100 km', metric: 'distance_km', target: 100, unit: 'km', days: 30 },
  { id: 'volume-250', title: 'Move 250,000 kg', metric: 'volume_kg', target: 250000, unit: 'kg', days: 30 },
  { id: 'conditioning-24', title: '24 conditioning sessions', metric: 'conditioning_sessions', target: 24, unit: 'sessions', days: 60 },
];

const DURATIONS = [
  { value: '14', label: '2 weeks' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
];

const VISIBILITIES: Array<Choice<ContractVisibility>> = [
  { value: 'private', label: 'Private', detail: 'Only you see this Contract.' },
  { value: 'pack', label: 'Pack', detail: 'Your Pack can see it and hold you to it.' },
  { value: 'public', label: 'Public', detail: 'Visible on your profile and in The Yard.' },
];

/**
 * Create a Contract (spec §86).
 *
 * The signing step is separate from creation on purpose. A Contract starts as a
 * draft and has to be signed, because a promise you can make by accident is not
 * a promise. Once signed, it can only be met or missed.
 */
export default function NewContractScreen() {
  const createContract = useContractStore((s) => s.createContract);

  const [preset, setPreset] = useState<string>(PRESETS[0]!.id);
  const [customTarget, setCustomTarget] = useState('');
  const [duration, setDuration] = useState('30');
  const [visibility, setVisibility] = useState<ContractVisibility>('pack');

  const selected = PRESETS.find((p) => p.id === preset)!;
  const target = customTarget ? Number.parseFloat(customTarget) : selected.target;
  const days = Number.parseInt(duration, 10);

  const endDate = (() => {
    const d = new Date(`${SEED_TODAY}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days - 1);
    return d.toISOString().slice(0, 10);
  })();

  const valid = Number.isFinite(target) && target > 0 && days > 0;

  const handleCreate = () => {
    if (!valid) return;

    const contract = createContract({
      title: customTarget
        ? `${target} ${selected.unit} in ${days} days`
        : selected.title,
      metric: selected.metric,
      target,
      unit: selected.unit,
      startDate: SEED_TODAY,
      endDate,
      visibility,
    });

    track({
      name: 'contract_created',
      properties: { metric: selected.metric, durationDays: days },
    });

    router.replace(`/contracts/${contract.id}`);
  };

  return (
    <Screen
      footer={
        <Button
          label="Create Contract"
          onPress={handleCreate}
          disabled={!valid}
        />
      }
    >
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">New Contract</Text>
        <Text variant="body" tone="tertiary">
          Something measurable, with a deadline. Once signed it cannot be deleted.
        </Text>
      </View>

      <SectionHeader title="What are you committing to?" />
      <ChoiceGroup
        choices={PRESETS.map((p) => ({ value: p.id, label: p.title }))}
        selected={preset}
        onSelect={(value) => {
          setPreset(value);
          setCustomTarget('');
        }}
      />

      <SectionHeader title="Adjust the target" />
      <Field
        label={`Target (${selected.unit})`}
        value={customTarget}
        onChangeText={setCustomTarget}
        placeholder={String(selected.target)}
        keyboardType="decimal-pad"
        hint="Leave blank to use the preset."
      />

      <SectionHeader title="Deadline" />
      <ChoiceGroup
        choices={DURATIONS}
        selected={duration}
        onSelect={setDuration}
        layout="inline"
      />

      <SectionHeader title="Who can see it?" />
      <ChoiceGroup<ContractVisibility>
        choices={VISIBILITIES}
        selected={visibility}
        onSelect={setVisibility}
      />

      <Card style={styles.summary}>
        <Text variant="overline" tone="tertiary">
          The Contract
        </Text>
        <Text variant="h3" style={styles.summaryTitle}>
          {target} {selected.unit} by {new Date(`${endDate}T00:00:00Z`).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            timeZone: 'UTC',
          })}
        </Text>
        <Text variant="bodySmall" tone="tertiary">
          Progress is counted automatically from what you log. If the deadline passes
          short of target, the Contract is recorded as failed and stays in your record.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  summary: { marginTop: sp.xxl },
  summaryTitle: { marginTop: sp.xs, marginBottom: sp.md },
});
