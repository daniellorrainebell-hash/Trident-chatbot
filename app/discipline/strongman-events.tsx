import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Pill, Screen, SectionHeader, StatBlock, Text } from '@/components';
import { space as sp } from '@/design';
import {
  STRONGMAN_CATEGORY_LABELS, STRONGMAN_EVENTS, STRONGMAN_LOADING_NOTE,
  STRONGMAN_STYLE_LABELS, eventsInCategory,
} from '@/data/disciplines';
import type { StrongmanEventCategory } from '@/types';

const CATEGORIES: StrongmanEventCategory[] = [
  'overhead', 'deadlift', 'squat', 'carry', 'load', 'drag', 'grip', 'medley',
];

/**
 * The event library.
 *
 * Each event lists the ways it is actually scored, because the implement is not
 * the event: a yoke run as a fastest-20 m and a yoke run as a max-distance-in-60 s
 * are two different contests that happen to use the same frame.
 *
 * The load note sits with every event for the same reason it does on the HYROX
 * stations — a farmers figure is per hand, a yoke figure is the whole frame, and
 * a truck pull figure is a vehicle you are never actually lifting.
 */
export default function StrongmanEventsScreen() {
  const [category, setCategory] = useState<StrongmanEventCategory | 'all'>('all');
  const shown = category === 'all' ? STRONGMAN_EVENTS : eventsInCategory(category);

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Events</Text>
        <Text variant="body" tone="tertiary">
          {STRONGMAN_EVENTS.length} events across {CATEGORIES.length} groups.
        </Text>
      </View>

      <View style={styles.tabs}>
        <Pill label="All" tone="accent" selected={category === 'all'} onPress={() => setCategory('all')} />
        {CATEGORIES.map((c) => (
          <Pill
            key={c}
            label={STRONGMAN_CATEGORY_LABELS[c]}
            tone="accent"
            selected={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </View>

      {CATEGORIES.filter((c) => category === 'all' || category === c).map((c) => {
        const rows = shown.filter((e) => e.category === c);
        if (rows.length === 0) return null;
        return (
          <View key={c}>
            <SectionHeader title={STRONGMAN_CATEGORY_LABELS[c]} />
            {rows.map((event) => (
              <Card key={event.id} style={styles.eventCard}>
                <Text variant="h3">{event.name}</Text>

                <View style={styles.styleRow}>
                  {event.styles.map((style) => (
                    <Pill key={style} label={STRONGMAN_STYLE_LABELS[style]} />
                  ))}
                </View>

                {event.typicalDistanceMetres || event.typicalTimeCapSeconds ? (
                  <View style={styles.statRow}>
                    {event.typicalDistanceMetres ? (
                      <StatBlock label="Distance" value={`${event.typicalDistanceMetres} m`} size="small" />
                    ) : null}
                    {event.typicalTimeCapSeconds ? (
                      <StatBlock label="Time cap" value={`${event.typicalTimeCapSeconds}s`} size="small" />
                    ) : null}
                  </View>
                ) : null}

                <Text variant="bodySmall" tone="secondary" style={styles.note}>
                  {event.loadNote}
                </Text>
                <Text variant="bodySmall" tone="tertiary" style={styles.note}>
                  {event.coachingNote}
                </Text>
              </Card>
            ))}
          </View>
        );
      })}

      <Text variant="legal" tone="tertiary" style={styles.footer}>
        {STRONGMAN_LOADING_NOTE}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  tabs: { flexDirection: 'row', gap: sp.sm, marginBottom: sp.lg, flexWrap: 'wrap' },
  eventCard: { marginBottom: sp.sm },
  styleRow: { flexDirection: 'row', gap: sp.sm, marginTop: sp.md, flexWrap: 'wrap' },
  statRow: { flexDirection: 'row', gap: sp.xl, marginTop: sp.lg },
  note: { marginTop: sp.md },
  footer: { marginTop: sp.xl },
});
