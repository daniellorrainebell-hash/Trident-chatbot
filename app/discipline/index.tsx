import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Pill, Screen, SectionHeader, Text } from '@/components';
import { space as sp } from '@/design';

/**
 * DISCIPLINE — the switcher.
 *
 * Its own page rather than a strip of cards wedged above the gym session, so
 * that Train can be about training and this can be about choosing. The unit
 * line under each is the point of the screen: they are different sports and
 * they are counted differently, and saying so here saves explaining it on
 * every screen that follows.
 */
const DISCIPLINES = [
  {
    name: 'Gym',
    title: 'The Iron',
    unit: 'Sets, reps and load',
    blurb: 'Push, pull, legs. Build a regime or have one built for you.',
    href: '/train' as const,
  },
  {
    name: 'BJJ',
    title: 'The Mat',
    unit: 'Mat hours, rounds, submissions',
    blurb: 'Gi and no-gi. Rolls, taps both ways, and time in grade.',
    href: '/discipline/bjj' as const,
  },
  {
    name: 'MMA',
    title: 'The Cage',
    unit: 'Rounds by range and intensity',
    blurb: 'Striking, clinch, wrestling, ground and cage.',
    href: '/discipline/mma' as const,
  },
  {
    name: 'Boxing',
    title: 'The Ring',
    unit: 'Rounds, output and accuracy',
    blurb: 'Pads, bag, sparring. Punches by the number.',
    href: '/discipline/boxing' as const,
  },
  {
    name: 'Strongman',
    title: 'The Yard',
    unit: 'Events, by how each is scored',
    blurb: 'Yoke, farmers, stones, log. Odd objects and a clock.',
    href: '/discipline/strongman' as const,
  },
];

export default function DisciplineIndexScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Discipline</Text>
        <Text variant="body" tone="tertiary">
          Five sports, five ways of counting. Pick what you are doing today.
        </Text>
      </View>

      {DISCIPLINES.map((discipline) => (
        <Card key={discipline.href} style={styles.card} onPress={() => router.push(discipline.href)}>
          <View style={styles.cardHead}>
            <Text variant="overline" tone="tertiary">
              {discipline.name}
            </Text>
            <Pill label={discipline.unit} />
          </View>
          <Text variant="h2" style={styles.cardTitle}>
            {discipline.title}
          </Text>
          <Text variant="bodySmall" tone="tertiary">
            {discipline.blurb}
          </Text>
        </Card>
      ))}

      <SectionHeader title="Programmes" />
      <Card onPress={() => router.push('/programme')}>
        <Text variant="h3">Build a week</Text>
        <Text variant="bodySmall" tone="tertiary" style={styles.note}>
          A full week built to what a coach would actually write, or tick your
          own exercises and set the sets and reps yourself. Works for every
          discipline.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  card: { marginBottom: sp.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: sp.md },
  cardTitle: { marginTop: sp.xs, marginBottom: sp.xs },
  note: { marginTop: sp.sm },
});
