import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, ListRow, Pill, ProgressBar, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { space as sp } from '@/design';
import { SEED_TODAY } from '@/data/seed';
import { seedRaceSessions } from '@/data/seedDisciplines';
import { hyroxLogs, stationBests, stationSplits, summariseRace } from '@/engines/training/hyrox';
import { HYROX_FORMAT_LABELS, HYROX_STANDARDS_VERSION, bandForFinish, findStation } from '@/data/disciplines';
import { formatClock, formatRelative } from '@/utils/format';

/**
 * THE FLOOR — HYROX.
 *
 * The race is identical everywhere, so a split from one arena means the same as
 * a split from another. That is what makes station bests the useful record here
 * rather than the finish time: a race is one day and eight chances, and knowing
 * the sled push has come down forty seconds is what tells you the training took.
 *
 * The roxzone is given its own line because it is where everybody loses time
 * and nobody trains. It is never entered by hand — it is whatever the clock has
 * left once the runs and stations are paid for, so it cannot be flattered.
 */
export default function HyroxScreen() {
  const logs = useMemo(() => hyroxLogs(seedRaceSessions), []);
  const bests = useMemo(() => stationBests(logs), [logs]);
  const now = new Date(`${SEED_TODAY}T21:00:00Z`);

  const lastRace = seedRaceSessions.find((s) => s.log?.kind === 'hyrox' && s.log.format === 'race');
  const raceLog = lastRace?.log?.kind === 'hyrox' ? lastRace.log : null;
  const summary = raceLog ? summariseRace(raceLog) : null;
  const splits = raceLog ? stationSplits(raceLog) : [];
  const band = raceLog && summary ? bandForFinish(summary.totalSeconds, raceLog.category) : null;

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">The Floor</Text>
        <Text variant="body" tone="tertiary">
          HYROX. Eight runs, eight stations, one clock.
        </Text>
      </View>

      {raceLog && summary ? (
        <Card>
          <View style={styles.rowTop}>
            <View>
              <Text variant="overline" tone="tertiary">
                {raceLog.eventName ?? 'Last race'}
              </Text>
              <Text variant="metricXL">{formatClock(summary.totalSeconds)}</Text>
            </View>
            {band ? <Pill label={band} tone="accent" /> : null}
          </View>

          <View style={styles.statRow}>
            <StatBlock label="Running" value={formatClock(summary.runSeconds)} size="small" />
            <StatBlock label="Stations" value={formatClock(summary.stationSeconds)} size="small" />
            <StatBlock label="Roxzone" value={formatClock(summary.roxzoneSeconds)} size="small" />
          </View>

          <Text variant="bodySmall" tone="tertiary" style={styles.note}>
            {Math.round(summary.roxzoneShare * 100)}% of the race was transitions.
            Average run {formatClock(Math.round(summary.averageRunSeconds ?? 0))} per
            km, fading {summary.runFade ?? 0}s from first to last.
          </Text>
        </Card>
      ) : null}

      <SectionHeader title="Station splits" />
      <Card>
        {splits.map((split) => (
          <ProgressBar
            key={split.stationId}
            label={`${split.order}. ${split.name}`}
            value={split.seconds === null ? '—' : formatClock(split.seconds)}
            fraction={split.share ?? 0}
            style={styles.bar}
          />
        ))}
      </Card>

      <SectionHeader title="Station bests" />
      {[...bests.entries()]
        .sort((a, b) => (findStation(a[0])?.order ?? 0) - (findStation(b[0])?.order ?? 0))
        .map(([stationId, seconds]) => {
          const station = findStation(stationId);
          return (
            <ListRow
              key={stationId}
              title={station?.name ?? stationId}
              subtitle={station ? `${station.amount}${station.measure === 'reps' ? ' reps' : ' m'}` : undefined}
              value={formatClock(seconds)}
            />
          );
        })}

      <SectionHeader
        title="The eight stations"
        action={{ label: 'Browse', onPress: () => router.push('/discipline/hyrox-stations') }}
      />
      <Text variant="bodySmall" tone="tertiary" style={styles.libraryNote}>
        Distances, loads by division, and what each one actually asks of you.
        Loads quoted for the {HYROX_STANDARDS_VERSION}.
      </Text>

      <SectionHeader title="Recent sessions" />
      {seedRaceSessions.map((session) => {
        const log = session.log?.kind === 'hyrox' ? session.log : null;
        if (!log) return null;
        const s = summariseRace(log);
        return (
          <ListRow
            key={session.id}
            title={HYROX_FORMAT_LABELS[log.format]}
            subtitle={`${s.runsLogged} run${s.runsLogged === 1 ? '' : 's'} · ${s.stationsLogged} station${s.stationsLogged === 1 ? '' : 's'}`}
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
