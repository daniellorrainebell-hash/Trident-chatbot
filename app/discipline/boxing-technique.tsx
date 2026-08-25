import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ListRow, Pill, Screen, SectionHeader, Text } from '@/components';
import { space as sp } from '@/design';
import {
  BOXING_COMBINATIONS, BOXING_ROUND_FORMATS, BOXING_SKILLS, BOXING_SKILL_CATEGORY_LABELS,
  BOXING_WEIGHT_CLASSES, PUNCHES,
} from '@/data/disciplines';
import type { BoxingDefenceCategory } from '@/types';

type Tab = 'punches' | 'combinations' | 'defence' | 'classes';

const SKILL_CATEGORIES: BoxingDefenceCategory[] = ['head_movement', 'guard', 'hands', 'footwork'];

/**
 * The boxing library, built around the numbering.
 *
 * A coach shouts "one-two-three-b" across a gym. Nobody says "jab, cross, lead
 * hook to the body" between rounds, so the number leads and the name follows —
 * that is the order they are useful in.
 *
 * Defence and footwork get the same billing as the punches on purpose. Every
 * gym has a queue for the heavy bag and almost nobody logs the half of the
 * sport that keeps them able to train next week.
 */
export default function BoxingTechniqueScreen() {
  const [tab, setTab] = useState<Tab>('punches');

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">The Numbers</Text>
        <Text variant="body" tone="tertiary">
          {PUNCHES.length} punches, {BOXING_COMBINATIONS.length} combinations,{' '}
          {BOXING_SKILLS.length} defensive and footwork skills.
        </Text>
      </View>

      <View style={styles.tabs}>
        <Pill label="Punches" tone="accent" selected={tab === 'punches'} onPress={() => setTab('punches')} />
        <Pill label="Combinations" tone="accent" selected={tab === 'combinations'} onPress={() => setTab('combinations')} />
        <Pill label="Defence" tone="accent" selected={tab === 'defence'} onPress={() => setTab('defence')} />
        <Pill label="Classes" tone="accent" selected={tab === 'classes'} onPress={() => setTab('classes')} />
      </View>

      {tab === 'punches' ? (
        <>
          <SectionHeader title="Head" />
          {PUNCHES.filter((p) => p.target === 'head').map((punch) => (
            <ListRow
              key={punch.id}
              title={punch.name}
              subtitle={punch.aliases[0] ?? `${punch.hand} hand`}
              value={punch.number}
            />
          ))}
          <SectionHeader title="Body" />
          {PUNCHES.filter((p) => p.target === 'body').map((punch) => (
            <ListRow
              key={punch.id}
              title={punch.name}
              subtitle={punch.aliases[0] ?? `${punch.hand} hand`}
              value={punch.number}
            />
          ))}
          <Text variant="caption" tone="tertiary" style={styles.note}>
            Numbers given orthodox, which is the convention. A southpaw throws
            the same numbers off the other side.
          </Text>
        </>
      ) : null}

      {tab === 'combinations' ? (
        <>
          <SectionHeader title="Combinations" />
          {BOXING_COMBINATIONS.map((combo) => (
            <Card key={combo.id} style={styles.comboCard}>
              <View style={styles.comboHead}>
                <Text variant="h3">{combo.numbers}</Text>
                <Pill label={combo.name} />
              </View>
              <Text variant="bodySmall" tone="tertiary" style={styles.note}>
                {combo.note}
              </Text>
            </Card>
          ))}
        </>
      ) : null}

      {tab === 'defence' ? (
        <>
          {SKILL_CATEGORIES.map((category) => (
            <View key={category}>
              <SectionHeader title={BOXING_SKILL_CATEGORY_LABELS[category]} />
              {BOXING_SKILLS.filter((s) => s.category === category).map((skill) => (
                <Card key={skill.id} style={styles.comboCard}>
                  <Text variant="h3">{skill.name}</Text>
                  <Text variant="bodySmall" tone="tertiary" style={styles.note}>
                    {skill.note}
                  </Text>
                </Card>
              ))}
            </View>
          ))}
        </>
      ) : null}

      {tab === 'classes' ? (
        <>
          <SectionHeader title="Weight classes" />
          {BOXING_WEIGHT_CLASSES.map((weightClass) => (
            <ListRow
              key={weightClass.id}
              title={weightClass.name}
              subtitle={
                Number.isFinite(weightClass.limitKg) ? `${weightClass.limitKg} kg` : 'No upper limit'
              }
              value={
                Number.isFinite(weightClass.limitPounds) ? `${weightClass.limitPounds} lb` : '—'
              }
            />
          ))}
          <SectionHeader title="Round formats" />
          {BOXING_ROUND_FORMATS.map((format) => (
            <ListRow
              key={format.id}
              title={format.label}
              subtitle={`${format.restSeconds}s between rounds`}
              value={`${format.rounds} × ${format.minutes}m`}
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
  comboCard: { marginBottom: sp.sm },
  comboHead: { flexDirection: 'row', alignItems: 'center', gap: sp.md, justifyContent: 'space-between' },
  note: { marginTop: sp.md },
});
