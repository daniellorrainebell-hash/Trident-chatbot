import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, ListRow, Pill, Screen, SectionHeader, Text } from '@/components';
import { space as sp } from '@/design';
import { MMA_RANGE_LABELS, MMA_ROUND_FORMATS, MMA_TECHNIQUES, techniquesForRange } from '@/data/disciplines';
import type { MmaRange } from '@/types';

const RANGES: MmaRange[] = ['striking', 'clinch', 'wrestling', 'ground', 'cage'];

/**
 * The MMA library, filed by range rather than by style.
 *
 * Nobody in a fight thinks "this is the boxing part". They think about the
 * distance they are in and what is available from there, and a list organised
 * any other way is a list you have to translate before you can use it.
 */
export default function MmaTechniquesScreen() {
  const [range, setRange] = useState<MmaRange | 'all'>('all');
  const shown = range === 'all' ? MMA_TECHNIQUES : techniquesForRange(range);

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Technique</Text>
        <Text variant="body" tone="tertiary">
          {MMA_TECHNIQUES.length} techniques across five ranges.
        </Text>
      </View>

      <View style={styles.tabs}>
        <Pill label="All" tone="accent" selected={range === 'all'} onPress={() => setRange('all')} />
        {RANGES.map((r) => (
          <Pill
            key={r}
            label={MMA_RANGE_LABELS[r]}
            tone="accent"
            selected={range === r}
            onPress={() => setRange(r)}
          />
        ))}
      </View>

      {RANGES.filter((r) => range === 'all' || range === r).map((r) => {
        const rows = shown.filter((t) => t.range === r);
        if (rows.length === 0) return null;
        return (
          <View key={r}>
            <SectionHeader title={MMA_RANGE_LABELS[r]} />
            {rows.map((technique) => (
              <ListRow
                key={technique.id}
                title={technique.name}
                subtitle={technique.aliases[0]}
                value={technique.category.replace(/_/g, ' ')}
              />
            ))}
          </View>
        );
      })}

      <SectionHeader title="Round formats" />
      {MMA_ROUND_FORMATS.map((format) => (
        <ListRow
          key={format.id}
          title={format.label}
          subtitle={`${format.restSeconds}s between rounds`}
          value={`${format.rounds} × ${format.minutes}m`}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  tabs: { flexDirection: 'row', gap: sp.sm, marginBottom: sp.lg, flexWrap: 'wrap' },
});
