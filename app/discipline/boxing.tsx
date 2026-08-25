import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, ListRow, Pill, ProgressBar, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { space as sp } from '@/design';
import { SEED_TODAY } from '@/data/seed';
import { seedBoxingSessions } from '@/data/seedDisciplines';
import {
  boxingLogs, hardSparringLoad, liveRounds, sessionMix, summariseSession,
} from '@/engines/training/boxing';
import { BOXING_SESSION_TYPE_LABELS, BOXING_STANCE_LABELS } from '@/data/disciplines';
import { formatPercent, formatRelative } from '@/utils/format';

/**
 * THE RING — boxing.
 *
 * Rounds again, but they ask different questions than the cage does. There are
 * no ranges to balance here, so what matters instead is output, accuracy and
 * whether any of it went downstairs — the two numbers a coach asks for and
 * almost nobody can answer.
 *
 * Counts are optional and shown as unknown when nobody kept them. A session
 * that reported zero punches because it was a shadow round would poison every
 * average on the screen.
 */
export default function BoxingScreen() {
  const logs = useMemo(() => boxingLogs(seedBoxingSessions), []);
  const mix = useMemo(() => sessionMix(logs), [logs]);
  const load = useMemo(() => hardSparringLoad(seedBoxingSessions, SEED_TODAY), []);
  const now = new Date(`${SEED_TODAY}T21:00:00Z`);

  const totals = logs.reduce(
    (acc, log) => {
      const s = summariseSession(log);
      return {
        rounds: acc.rounds + s.rounds,
        minutes: acc.minutes + s.roundMinutes,
        thrown: acc.thrown + (s.punchesThrown ?? 0),
        counted: acc.counted + s.countedRounds,
        landed: acc.landed + (s.punchesLanded ?? 0),
        landedDenominator:
          acc.landedDenominator + (s.accuracy === null ? 0 : (s.punchesLanded ?? 0) / s.accuracy),
        body: acc.body + (s.bodyShare === null ? 0 : (s.bodyShare * (s.punchesThrown ?? 0))),
      };
    },
    { rounds: 0, minutes: 0, thrown: 0, counted: 0, landed: 0, landedDenominator: 0, body: 0 },
  );

  const workRate = totals.counted === 0 ? null : totals.thrown / totals.counted;
  const accuracy = totals.landedDenominator === 0 ? null : totals.landed / totals.landedDenominator;
  const bodyShare = totals.thrown === 0 ? null : totals.body / totals.thrown;
  const maxRounds = Math.max(1, ...mix.map((m) => m.rounds));

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">The Ring</Text>
        <Text variant="body" tone="tertiary">
          Boxing. Rounds, output, and whether it went downstairs.
        </Text>
      </View>

      <Card>
        <View style={styles.rowTop}>
          <View>
            <Text variant="overline" tone="tertiary">
              Rounds logged
            </Text>
            <Text variant="metricXL">{totals.rounds}</Text>
          </View>
          <Pill label={BOXING_STANCE_LABELS.orthodox} tone="accent" />
        </View>
        <View style={styles.statRow}>
          <StatBlock label="Minutes" value={String(totals.minutes)} size="small" />
          <StatBlock label="Live rounds" value={String(liveRounds(logs))} size="small" />
          <StatBlock label="Sessions" value={String(logs.length)} size="small" />
        </View>
      </Card>

      <SectionHeader title="Output" />
      <Card>
        <View style={styles.statRow}>
          <StatBlock
            label="Work rate"
            value={workRate === null ? '—' : `${Math.round(workRate)}/r`}
            size="small"
          />
          <StatBlock
            label="Accuracy"
            value={accuracy === null ? '—' : formatPercent(accuracy)}
            size="small"
          />
          <StatBlock
            label="To the body"
            value={bodyShare === null ? '—' : formatPercent(bodyShare)}
            size="small"
          />
        </View>
        <Text variant="caption" tone="tertiary" style={styles.note}>
          Across the {totals.counted} round{totals.counted === 1 ? '' : 's'} somebody
          actually counted. The rest are logged but left out of the averages
          rather than counted as zeroes.
        </Text>
      </Card>

      <SectionHeader title="Where the rounds went" />
      <Card>
        {mix.map((row) => (
          <ProgressBar
            key={row.sessionType}
            label={BOXING_SESSION_TYPE_LABELS[row.sessionType]}
            value={`${row.rounds} rounds`}
            fraction={row.rounds / maxRounds}
            style={styles.bar}
          />
        ))}
        <Text variant="caption" tone="tertiary" style={styles.note}>
          The bag never hits back and never needs booking, which is why it wins
          this chart for almost everybody.
        </Text>
      </Card>

      <SectionHeader title="Hard sparring" />
      <Card marker={load.hardRounds > 0 ? 'warning' : 'none'}>
        <View style={styles.rowTop}>
          <View>
            <Text variant="overline" tone="tertiary">
              Last {load.windowDays} days
            </Text>
            <Text variant="metricL">{load.hardRounds}</Text>
            <Text variant="caption" tone="tertiary">
              hard rounds across {load.sessions} session{load.sessions === 1 ? '' : 's'}
            </Text>
          </View>
          {load.lastHardDate ? (
            <Pill label={formatRelative(`${load.lastHardDate}T20:00:00Z`, now)} />
          ) : null}
        </View>
        <Text variant="bodySmall" tone="tertiary" style={styles.note}>
          {load.hardRoundMinutes} minutes of it. A count, not a limit — what your
          head can take is a conversation with your coach.
        </Text>
      </Card>

      <SectionHeader
        title="The numbers"
        action={{ label: 'Browse', onPress: () => router.push('/discipline/boxing-technique') }}
      />
      <Text variant="bodySmall" tone="tertiary" style={styles.libraryNote}>
        Punches by the number a coach shouts, combinations, defence and
        footwork, and the weight classes in pounds and kilos.
      </Text>

      <SectionHeader title="Recent sessions" />
      {seedBoxingSessions.map((session) => {
        const log = session.log?.kind === 'boxing' ? session.log : null;
        if (!log) return null;
        const summary = summariseSession(log);
        return (
          <ListRow
            key={session.id}
            title={BOXING_SESSION_TYPE_LABELS[log.sessionType]}
            subtitle={`${summary.rounds} × ${summary.roundMinutes / Math.max(1, summary.rounds)}m${summary.workRate ? ` · ${Math.round(summary.workRate)} p/r` : ''}`}
            value={formatRelative(session.completedAt ?? session.startedAt, now)}
          />
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statRow: { flexDirection: 'row', gap: sp.lg, marginTop: sp.lg, flexWrap: 'wrap' },
  bar: { marginTop: sp.md },
  note: { marginTop: sp.lg },
  libraryNote: { marginBottom: sp.sm },
});
