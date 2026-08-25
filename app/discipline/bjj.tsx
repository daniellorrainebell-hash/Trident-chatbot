import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, ListRow, Pill, ProgressBar, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { colors, space as sp } from '@/design';
import { SEED_TODAY } from '@/data/seed';
import { SEED_BELT, SEED_BELT_PROMOTED_ON, SEED_STRIPES, seedMatSessions } from '@/data/seedDisciplines';
import { bjjLogs, beltStanding, matHours, submissionBreakdown, summariseSession } from '@/engines/training/bjj';
import { BJJ_SESSION_TYPE_LABELS, BJJ_RULESET } from '@/data/disciplines';
import { formatRelative } from '@/utils/format';

/**
 * THE MAT — jiu-jitsu.
 *
 * Nothing on this screen is borrowed from the gym side, because none of it
 * would survive the trip. Mat time is the headline because mat time is what
 * actually makes people better; taps are counted in both directions because a
 * session where you got caught five times by a brown belt is not a bad session,
 * and a tracker that treats it as one teaches you to avoid hard rolls.
 */
export default function BjjScreen() {
  const logs = useMemo(() => bjjLogs(seedMatSessions), []);
  const hours = matHours(logs);
  const standing = beltStanding(SEED_BELT, SEED_STRIPES, SEED_BELT_PROMOTED_ON, SEED_TODAY);
  const breakdown = submissionBreakdown(logs).slice(0, 6);
  const now = new Date(`${SEED_TODAY}T21:00:00Z`);

  const totals = logs.reduce(
    (acc, log) => {
      const s = summariseSession(log);
      return {
        rolling: acc.rolling + s.rollingMinutes,
        rounds: acc.rounds + s.rounds,
        landed: acc.landed + s.submissionsLanded,
        conceded: acc.conceded + s.submissionsConceded,
        sweeps: acc.sweeps + s.sweeps,
        passes: acc.passes + s.passes,
      };
    },
    { rolling: 0, rounds: 0, landed: 0, conceded: 0, sweeps: 0, passes: 0 },
  );

  const beltLabel = `${standing.belt} belt`;

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">The Mat</Text>
        <Text variant="body" tone="tertiary">
          Brazilian jiu-jitsu. Time on the mat, and what happened in it.
        </Text>
      </View>

      <Card>
        <View style={styles.rowTop}>
          <View>
            <Text variant="overline" tone="tertiary">
              Mat time
            </Text>
            <Text variant="metricXL">{hours.toFixed(1)}</Text>
            <Text variant="caption" tone="tertiary">
              hours logged
            </Text>
          </View>
          <View style={styles.beltStack}>
            <Pill label={beltLabel} tone="accent" />
            <Text variant="caption" tone="tertiary" style={styles.stripes}>
              {standing.stripes} stripe{standing.stripes === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <StatBlock label="Rolling" value={`${Math.round(totals.rolling)}m`} size="small" />
          <StatBlock label="Rounds" value={String(totals.rounds)} size="small" />
          <StatBlock label="Sessions" value={String(logs.length)} size="small" />
        </View>
      </Card>

      <SectionHeader title="Time in grade" />
      <Card>
        <Text variant="h3">
          {standing.monthsAtBelt} months at {beltLabel}
        </Text>
        {standing.minimumMonths ? (
          <>
            <ProgressBar
              fraction={Math.min(1, standing.monthsAtBelt / standing.minimumMonths)}
              value={`${standing.monthsAtBelt} / ${standing.minimumMonths} months`}
              style={styles.progress}
            />
            <Text variant="bodySmall" tone="tertiary" style={styles.note}>
              {standing.minimumMonths} months is the IBJJF minimum before{' '}
              {standing.nextBelt ?? 'the next belt'} — a floor, not a schedule. Belts
              are given, not earned by the calendar.
            </Text>
          </>
        ) : (
          <Text variant="bodySmall" tone="tertiary" style={styles.note}>
            No minimum time in grade applies here.
          </Text>
        )}
      </Card>

      <SectionHeader title="Submissions" />
      <Card>
        <View style={styles.statRow}>
          <StatBlock label="Landed" value={String(totals.landed)} size="small" />
          <StatBlock label="Conceded" value={String(totals.conceded)} size="small" />
          <StatBlock label="Sweeps" value={String(totals.sweeps)} size="small" />
          <StatBlock label="Passes" value={String(totals.passes)} size="small" />
        </View>
      </Card>

      {breakdown.map((row) => (
        <ListRow
          key={row.submissionId}
          title={row.submissionName}
          subtitle={`${row.landed} landed · ${row.conceded} conceded`}
          value={`${row.landed - row.conceded > 0 ? '+' : ''}${row.landed - row.conceded}`}
        />
      ))}

      <SectionHeader
        title="Technique library"
        action={{ label: 'Browse', onPress: () => router.push('/discipline/bjj-techniques') }}
      />
      <Text variant="bodySmall" tone="tertiary" style={styles.libraryNote}>
        Submissions, positions and takedowns, with the belt each finish becomes
        legal at. {BJJ_RULESET}.
      </Text>

      <SectionHeader title="Recent sessions" />
      {seedMatSessions.map((session) => {
        const log = session.log?.kind === 'bjj' ? session.log : null;
        if (!log) return null;
        const summary = summariseSession(log);
        return (
          <ListRow
            key={session.id}
            title={BJJ_SESSION_TYPE_LABELS[log.sessionType]}
            subtitle={`${log.matMinutes}m on the mat · ${summary.rounds} round${summary.rounds === 1 ? '' : 's'} · ${summary.submissionsLanded}-${summary.submissionsConceded}`}
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
  beltStack: { alignItems: 'flex-end', gap: sp.xs },
  stripes: { marginTop: sp.xxs },
  statRow: { flexDirection: 'row', gap: sp.lg, marginTop: sp.lg, flexWrap: 'wrap' },
  progress: { marginTop: sp.md },
  note: { marginTop: sp.md },
  libraryNote: { marginBottom: sp.sm, color: colors.text.tertiary },
});
