import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ListRow, Pill, Screen, SectionHeader, Text } from '@/components';
import { space as sp } from '@/design';
import {
  BJJ_POSITIONS, BJJ_RULESET, BJJ_TAKEDOWNS, SUBMISSIONS, SUBMISSION_FAMILY_LABELS,
  submissionLegality,
} from '@/data/disciplines';
import type { BjjBelt, SubmissionFamily } from '@/types';
import { SEED_BELT } from '@/data/seedDisciplines';

type Tab = 'submissions' | 'positions' | 'takedowns';

/**
 * The jiu-jitsu library.
 *
 * Every submission carries the belt it becomes legal at, in the gi and no-gi
 * separately, checked against the belt the reader actually holds. This is the
 * one reference table in the app where silence is not neutral: an app that
 * lists an inside heel hook next to an armbar with no comment is telling a
 * white belt they are the same kind of thing.
 */
export default function BjjTechniquesScreen() {
  const [tab, setTab] = useState<Tab>('submissions');
  const [gi, setGi] = useState(true);
  const belt: BjjBelt = SEED_BELT;

  const families = useMemo(() => {
    const grouped = new Map<SubmissionFamily, typeof SUBMISSIONS>();
    for (const submission of SUBMISSIONS) {
      grouped.set(submission.family, [...(grouped.get(submission.family) ?? []), submission]);
    }
    return [...grouped.entries()];
  }, []);

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Technique</Text>
        <Text variant="body" tone="tertiary">
          {SUBMISSIONS.length} submissions, {BJJ_POSITIONS.length} positions,{' '}
          {BJJ_TAKEDOWNS.length} takedowns.
        </Text>
      </View>

      <View style={styles.tabs}>
        <Pill label="Submissions" tone="accent" selected={tab === 'submissions'} onPress={() => setTab('submissions')} />
        <Pill label="Positions" tone="accent" selected={tab === 'positions'} onPress={() => setTab('positions')} />
        <Pill label="Takedowns" tone="accent" selected={tab === 'takedowns'} onPress={() => setTab('takedowns')} />
      </View>

      {tab === 'submissions' ? (
        <>
          <Card>
            <View style={styles.rulesetRow}>
              <View style={styles.flex}>
                <Text variant="overline" tone="tertiary">
                  Checked against
                </Text>
                <Text variant="bodyStrong">
                  {belt} belt · {gi ? 'gi' : 'no-gi'}
                </Text>
              </View>
              <Pill label={gi ? 'Switch to no-gi' : 'Switch to gi'} onPress={() => setGi(!gi)} />
            </View>
            <Text variant="caption" tone="tertiary" style={styles.note}>
              {BJJ_RULESET}. Federations and local comps differ — check the rules
              you are actually competing under.
            </Text>
          </Card>

          {families.map(([family, submissions]) => (
            <View key={family}>
              <SectionHeader title={SUBMISSION_FAMILY_LABELS[family]} />
              {submissions.map((submission) => {
                const legality = submissionLegality(submission, belt, gi);
                return (
                  <ListRow
                    key={submission.id}
                    title={submission.name}
                    subtitle={legality.allowed ? submission.aliases[0] : legality.reason ?? undefined}
                    // A red chip rather than a red row: the point is that this
                    // one is gated, not that the technique is bad.
                    trailing={legality.allowed ? undefined : <Pill label="Gated" tone="danger" />}
                  />
                );
              })}
            </View>
          ))}
        </>
      ) : null}

      {tab === 'positions' ? (
        <>
          <SectionHeader title="Positions" />
          {BJJ_POSITIONS.map((position) => (
            <ListRow
              key={position.id}
              title={position.name}
              subtitle={position.category.replace(/_/g, ' ')}
              value={position.points === null ? undefined : `${position.points} pts`}
            />
          ))}
        </>
      ) : null}

      {tab === 'takedowns' ? (
        <>
          <SectionHeader title="Takedowns" />
          {BJJ_TAKEDOWNS.map((takedown) => (
            <ListRow
              key={takedown.id}
              title={takedown.name}
              subtitle={takedown.aliases[0] ?? takedown.origin.replace(/_/g, '-')}
              value={takedown.origin === 'jiu_jitsu' ? 'BJJ' : takedown.origin}
            />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  tabs: { flexDirection: 'row', gap: sp.sm, marginBottom: sp.lg, flexWrap: 'wrap' },
  rulesetRow: { flexDirection: 'row', alignItems: 'center', gap: sp.md },
  flex: { flex: 1 },
  note: { marginTop: sp.md },
});
