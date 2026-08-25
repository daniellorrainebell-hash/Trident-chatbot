import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, ListRow, Pill, ProgressBar, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { space as sp } from '@/design';
import { SEED_TODAY } from '@/data/seed';
import { seedFightSessions } from '@/data/seedDisciplines';
import { hardSparringLoad, mmaLogs, rangeBalance, summariseSession } from '@/engines/training/mma';
import { MMA_RANGE_LABELS, MMA_SESSION_TYPE_LABELS, SPAR_INTENSITY_LABELS } from '@/data/disciplines';
import { formatRelative } from '@/utils/format';

/**
 * THE CAGE — mixed martial arts.
 *
 * Rounds are the unit, and they are counted with their range and intensity
 * still attached. Averaging those away is how a fighter ends up believing they
 * wrestle twice as much as they do.
 *
 * The hard sparring panel reports and stops. How much contact a head can take
 * is a conversation with a coach who can see you train, not a number an app
 * hands down — but the fighter who cannot say how many hard rounds they took
 * this month is exactly the one for whom the count matters.
 */
export default function MmaScreen() {
  const logs = useMemo(() => mmaLogs(seedFightSessions), []);
  const balance = useMemo(() => rangeBalance(logs), [logs]);
  const load = useMemo(() => hardSparringLoad(seedFightSessions, SEED_TODAY), []);
  const now = new Date(`${SEED_TODAY}T21:00:00Z`);

  const totals = logs.reduce(
    (acc, log) => {
      const s = summariseSession(log);
      return {
        rounds: acc.rounds + s.rounds,
        minutes: acc.minutes + s.roundMinutes,
        takedownsFor: acc.takedownsFor + s.takedownsFor,
        takedownsAgainst: acc.takedownsAgainst + s.takedownsAgainst,
        submissionsFor: acc.submissionsFor + s.submissionsFor,
        submissionsAgainst: acc.submissionsAgainst + s.submissionsAgainst,
      };
    },
    { rounds: 0, minutes: 0, takedownsFor: 0, takedownsAgainst: 0, submissionsFor: 0, submissionsAgainst: 0 },
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">The Cage</Text>
        <Text variant="body" tone="tertiary">
          Mixed martial arts. Rounds, ranges and what they cost.
        </Text>
      </View>

      <Card>
        <Text variant="overline" tone="tertiary">
          Rounds logged
        </Text>
        <Text variant="metricXL">{totals.rounds}</Text>
        <View style={styles.statRow}>
          <StatBlock label="Minutes" value={String(totals.minutes)} size="small" />
          <StatBlock label="Sessions" value={String(logs.length)} size="small" />
          <StatBlock
            label="Takedowns"
            value={`${totals.takedownsFor}-${totals.takedownsAgainst}`}
            size="small"
          />
          <StatBlock
            label="Subs"
            value={`${totals.submissionsFor}-${totals.submissionsAgainst}`}
            size="small"
          />
        </View>
      </Card>

      <SectionHeader title="Where the work went" />
      <Card>
        {balance
          .filter((row) => row.rounds > 0)
          .map((row) => (
            <ProgressBar
              key={row.range}
              label={MMA_RANGE_LABELS[row.range]}
              value={`${row.rounds} rounds`}
              fraction={row.share}
              style={styles.bar}
            />
          ))}
        <Text variant="caption" tone="tertiary" style={styles.note}>
          Shares of every round logged. Most fighters guess this wrong.
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
          {load.hardRoundMinutes} minutes of it. This is a count, not a limit —
          what your head can take is a conversation with your coach, not a number
          from an app.
        </Text>
      </Card>

      <SectionHeader
        title="Technique library"
        action={{ label: 'Browse', onPress: () => router.push('/discipline/mma-techniques') }}
      />
      <Text variant="bodySmall" tone="tertiary" style={styles.libraryNote}>
        Strikes, clinch, wrestling, ground and cage work, filed by the range they
        happen in rather than the style they came from.
      </Text>

      <SectionHeader title="Recent sessions" />
      {seedFightSessions.map((session) => {
        const log = session.log?.kind === 'mma' ? session.log : null;
        if (!log) return null;
        const summary = summariseSession(log);
        const hardest = (['hard', 'medium', 'light', 'technical'] as const).find(
          (i) => summary.byIntensity[i] > 0,
        );
        return (
          <ListRow
            key={session.id}
            title={MMA_SESSION_TYPE_LABELS[log.sessionType]}
            subtitle={`${summary.rounds} × ${summary.roundMinutes / Math.max(1, summary.rounds)}m · ${hardest ? SPAR_INTENSITY_LABELS[hardest] : '—'}`}
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
