import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, ListRow, Pill, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { space as sp } from '@/design';
import { SEED_TODAY } from '@/data/seed';
import { seedEventSessions } from '@/data/seedDisciplines';
import { attemptHistory, eventBests, strongmanLogs, summariseSession } from '@/engines/training/strongman';
import {
  STRONGMAN_SESSION_TYPE_LABELS, STRONGMAN_STYLE_LABELS, higherIsBetter,
} from '@/data/disciplines';
import { formatRelative } from '@/utils/format';
import type { StrongmanEventStyle } from '@/types';

/**
 * THE YARD — strongman.
 *
 * The one discipline the gym section genuinely cannot express. A yoke walk is
 * not sets and reps: it is distance under load against a clock, and the same
 * implement scored three ways gives three numbers with nothing to say to each
 * other. So every best here is a best at a *style*, never at an event.
 *
 * Misses are shown, not hidden. Opener, second, third is the shape of the
 * sport, and the useful thing on this screen is often the lift that has refused
 * to move for a month.
 */
/**
 * The heaviest lift that has been missed, and how many times.
 *
 * Derived from fixed data, so it is computed once at module load. As a
 * `useMemo` with no dependencies it forced the React Compiler to skip
 * optimising this whole screen for a value that could never change.
 */
const LOGS = strongmanLogs(seedEventSessions);
const BESTS = [...eventBests(seedEventSessions).values()];

const STUBBORN = (() => {
  const failed = seedEventSessions
    .flatMap((s) => (s.log?.kind === 'strongman' ? s.log.attempts : []))
    .filter((a) => !a.successful && a.loadKg !== null)
    .sort((a, b) => (b.loadKg ?? 0) - (a.loadKg ?? 0))[0];
  if (!failed) return null;
  const history = attemptHistory(seedEventSessions, failed.eventId, failed.style);
  return { attempt: failed, tries: history.filter((a) => !a.successful).length };
})();

function formatValue(style: StrongmanEventStyle, value: number): string {
  switch (style) {
    case 'max_load':
      return `${value} kg`;
    case 'reps_in_time':
      return `${value} reps`;
    case 'distance_in_time':
      return `${value} m`;
    default:
      return `${value.toFixed(1)}s`;
  }
}

export default function StrongmanScreen() {
  const logs = LOGS;
  const bests = BESTS;
  const now = new Date(`${SEED_TODAY}T21:00:00Z`);

  const totals = logs.reduce(
    (acc, log) => {
      const s = summariseSession(log);
      return {
        attempts: acc.attempts + s.attempts,
        successful: acc.successful + s.successful,
        loadedMetres: acc.loadedMetres + s.loadedMetres,
        heaviest: Math.max(acc.heaviest, s.heaviestKg ?? 0),
      };
    },
    { attempts: 0, successful: 0, loadedMetres: 0, heaviest: 0 },
  );

  const misses = totals.attempts - totals.successful;

  // The lift that keeps refusing. Worth more screen space than another PB.

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">The Yard</Text>
        <Text variant="body" tone="tertiary">
          Strongman. Odd objects, long distances, a clock running.
        </Text>
      </View>

      <Card>
        <Text variant="overline" tone="tertiary">
          Heaviest moved
        </Text>
        <Text variant="metricXL">{totals.heaviest}</Text>
        <Text variant="caption" tone="tertiary">
          kg — by any means, carried or lifted
        </Text>
        <View style={styles.statRow}>
          <StatBlock label="Attempts" value={String(totals.attempts)} size="small" />
          <StatBlock label="Made" value={String(totals.successful)} size="small" />
          <StatBlock label="Missed" value={String(misses)} size="small" />
          <StatBlock label="Loaded" value={`${totals.loadedMetres}m`} size="small" />
        </View>
      </Card>

      {STUBBORN ? (
        <>
          <SectionHeader title="Still standing" />
          <Card marker="warning">
            <Text variant="h3">
              {STUBBORN.attempt.eventName} · {STUBBORN.attempt.loadKg} kg
            </Text>
            <Text variant="bodySmall" tone="tertiary" style={styles.note}>
              Missed {STUBBORN.tries} time{STUBBORN.tries === 1 ? '' : 's'}.
              {STUBBORN.attempt.notes ? ` ${STUBBORN.attempt.notes}` : ''}
            </Text>
          </Card>
        </>
      ) : null}

      <SectionHeader title="Bests" />
      <Text variant="caption" tone="tertiary" style={styles.bestsNote}>
        One per event and scoring style. A fastest 20 m and a heaviest carry are
        different records on the same implement.
      </Text>
      {bests
        .sort((a, b) => a.eventName.localeCompare(b.eventName))
        .map((best) => (
          <ListRow
            key={`${best.eventId}:${best.style}`}
            title={best.eventName}
            subtitle={`${STRONGMAN_STYLE_LABELS[best.style]}${best.atLoadKg ? ` · ${best.atLoadKg} kg` : ''}`}
            value={formatValue(best.style, best.value)}
            valueDetail={higherIsBetter(best.style) ? 'more is better' : 'less is better'}
          />
        ))}

      <SectionHeader
        title="Event library"
        action={{ label: 'Browse', onPress: () => router.push('/discipline/strongman-events') }}
      />
      <Text variant="bodySmall" tone="tertiary" style={styles.bestsNote}>
        Every event, how it is scored, and what the load figure actually refers
        to — which is rarely just the weight.
      </Text>

      <SectionHeader title="Recent sessions" />
      {seedEventSessions.map((session) => {
        const log = session.log?.kind === 'strongman' ? session.log : null;
        if (!log) return null;
        const summary = summariseSession(log);
        return (
          <ListRow
            key={session.id}
            title={log.competitionName ?? STRONGMAN_SESSION_TYPE_LABELS[log.sessionType]}
            subtitle={`${summary.events} event${summary.events === 1 ? '' : 's'} · ${summary.successful}/${summary.attempts} made`}
            value={formatRelative(session.completedAt ?? session.startedAt, now)}
            trailing={log.sessionType === 'competition' ? <Pill label="Comp" tone="accent" /> : undefined}
          />
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  statRow: { flexDirection: 'row', gap: sp.lg, marginTop: sp.lg, flexWrap: 'wrap' },
  note: { marginTop: sp.md },
  bestsNote: { marginBottom: sp.sm },
});
