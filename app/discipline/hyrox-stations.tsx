import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Pill, Screen, SectionHeader, StatBlock, Text } from '@/components';
import { space as sp } from '@/design';
import {
  HYROX_CATEGORY_LABELS, HYROX_DIVISION_LABELS, HYROX_RUN_COUNT, HYROX_RUN_METRES,
  HYROX_STANDARDS_VERSION, HYROX_STATIONS, loadFor,
} from '@/data/disciplines';
import type { HyroxCategory, HyroxDivision } from '@/types';

/**
 * The eight stations.
 *
 * Loads change between seasons, so the season is stated rather than implied.
 * The load note matters as much as the number: a sled figure is the total
 * weight being moved, a farmers carry figure is per hand, and a wall ball
 * figure is the ball with the target height carried separately. One column of
 * kilograms would be quietly wrong four times out of eight.
 */
export default function HyroxStationsScreen() {
  const [division, setDivision] = useState<HyroxDivision>('open');
  const [category, setCategory] = useState<HyroxCategory>('mens');

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">The Eight</Text>
        <Text variant="body" tone="tertiary">
          {HYROX_RUN_COUNT} × {HYROX_RUN_METRES} m, each followed by a station.
          Always the same order, everywhere.
        </Text>
      </View>

      <View style={styles.tabs}>
        {(['open', 'pro'] as HyroxDivision[]).map((d) => (
          <Pill
            key={d}
            label={HYROX_DIVISION_LABELS[d]}
            tone="accent"
            selected={division === d}
            onPress={() => setDivision(d)}
          />
        ))}
        {(['mens', 'womens'] as HyroxCategory[]).map((c) => (
          <Pill
            key={c}
            label={HYROX_CATEGORY_LABELS[c]}
            tone="accent"
            selected={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </View>

      {HYROX_STATIONS.map((station) => {
        const load = loadFor(station, division, category);
        return (
          <View key={station.id}>
            <SectionHeader title={`${station.order}. ${station.name}`} />
            <Card>
              <View style={styles.statRow}>
                <StatBlock
                  label={station.measure === 'reps' ? 'Reps' : 'Distance'}
                  value={station.measure === 'reps' ? String(station.amount) : `${station.amount} m`}
                  size="small"
                />
                <StatBlock
                  label="Load"
                  value={load === null ? '—' : `${load} kg`}
                  size="small"
                />
              </View>
              <Text variant="bodySmall" tone="secondary" style={styles.note}>
                {station.loadNote}
              </Text>
              <Text variant="bodySmall" tone="tertiary" style={styles.note}>
                {station.coachingNote}
              </Text>
            </Card>
          </View>
        );
      })}

      <Text variant="legal" tone="tertiary" style={styles.footer}>
        Loads quoted for the {HYROX_STANDARDS_VERSION}. They have changed between
        seasons before — check the official rulebook before you race.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  tabs: { flexDirection: 'row', gap: sp.sm, marginBottom: sp.lg, flexWrap: 'wrap' },
  statRow: { flexDirection: 'row', gap: sp.xl },
  note: { marginTop: sp.md },
  footer: { marginTop: sp.xl },
});
