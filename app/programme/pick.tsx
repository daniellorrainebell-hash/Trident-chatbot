import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ListRow, Pill, Screen, SectionHeader, StatBlock, Text, Chrome } from '@/components';
import { colors, space as sp, chromeText } from '@/design';
import { EXERCISES } from '@/data/exercises';
import { SLOTS, type SlotId } from '@/data/programmes/splits';
import { REP_RANGES, REST_SECONDS, SETS_PER_EXERCISE } from '@/data/programmes/coaching';
import { useWorkoutStore } from '@/store/workoutStore';
import type { MuscleGroup } from '@/types';

const SLOT_ORDER: SlotId[] = ['push', 'pull', 'legs', 'upper', 'lower', 'full'];
const SET_CHOICES = [2, 3, 4, 5];
const REP_CHOICES = [5, 8, 10, 12, 15];

/**
 * BUILD MY OWN.
 *
 * Tick what you are doing, set the sets and reps, start the session. The
 * defaults are the generator's — hypertrophy ranges, compound rest — so an
 * untouched pick is still a sensible session rather than three sets of ten for
 * everything by accident.
 *
 * Exercises are grouped by the muscle the day owns and sorted compounds first,
 * which is the order they should be done in. Ticking preserves that order
 * rather than the order you tapped, so the session comes out coached even when
 * the picking was not.
 */
export default function ProgrammePickScreen() {
  const [slotId, setSlotId] = useState<SlotId>('push');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const startFromTemplate = useWorkoutStore((s) => s.startFromTemplate);

  const slot = SLOTS[slotId];

  const byMuscle = useMemo(() => {
    const groups: Array<{ muscle: MuscleGroup; rows: typeof EXERCISES }> = [];
    for (const muscle of slot.muscles) {
      const rows = EXERCISES.filter(
        (e) => e.active && e.primaryMuscle === muscle && e.metric !== 'duration' && e.metric !== 'rounds',
      ).sort((a, b) => {
        const compound = Number(b.pattern !== 'isolation') - Number(a.pattern !== 'isolation');
        return compound !== 0 ? compound : a.name.localeCompare(b.name);
      });
      if (rows.length > 0) groups.push({ muscle, rows });
    }
    return groups;
  }, [slot]);

  const toggle = (id: string) => {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Keep the coached order rather than the tapped order.
  const chosen = byMuscle.flatMap((group) => group.rows.filter((row) => picked.has(row.id)));

  return (
    <Screen
      footer={
        <Button
          label={chosen.length === 0 ? 'Tick some movements' : `Start ${chosen.length}-movement session`}
          disabled={chosen.length === 0}
          onPress={() => {
            startFromTemplate(
              slot.name,
              chosen.map((exercise) => ({
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                metric: exercise.metric,
                targetSets: sets,
                targetReps: reps,
              })),
            );
            router.push('/workout/active');
          }}
        />
      }
    >
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Build my own</Text>
        <Text variant="body" tone="tertiary">
          Tick what you are doing. Compounds are listed first because that is the
          order to do them in.
        </Text>
      </View>

      <SectionHeader title="Day" />
      <View style={styles.chips}>
        {SLOT_ORDER.map((id) => (
          <Pill
            key={id}
            label={SLOTS[id].name}
            tone="accent"
            selected={slotId === id}
            onPress={() => setSlotId(id)}
          />
        ))}
      </View>

      <Card>
        <Text variant="bodySmall" tone="tertiary">
          {slot.description}
        </Text>
        <View style={styles.statRow}>
          <StatBlock label="Picked" value={String(chosen.length)} size="small" />
          <StatBlock label="Sets each" value={String(sets)} size="small" />
          <StatBlock label="Total sets" value={String(chosen.length * sets)} size="small" />
        </View>
      </Card>

      <SectionHeader title="Sets" />
      <View style={styles.chips}>
        {SET_CHOICES.map((n) => (
          <Pill key={n} label={`${n}`} tone="accent" selected={sets === n} onPress={() => setSets(n)} />
        ))}
      </View>

      <SectionHeader title="Reps" />
      <View style={styles.chips}>
        {REP_CHOICES.map((n) => (
          <Pill key={n} label={`${n}`} tone="accent" selected={reps === n} onPress={() => setReps(n)} />
        ))}
      </View>
      <Text variant="caption" tone="tertiary" style={styles.hint}>
        Defaults are the same ranges the generator uses:{' '}
        {REP_RANGES.hypertrophy.compound[0]}–{REP_RANGES.hypertrophy.compound[1]} on
        compounds, {REST_SECONDS.hypertrophy.compound}s rest,{' '}
        {SETS_PER_EXERCISE.hypertrophy.compound} sets.
      </Text>

      {byMuscle.map((group) => (
        <View key={group.muscle}>
          <SectionHeader title={group.muscle.replace(/_/g, ' ')} />
          {group.rows.map((exercise) => {
            const on = picked.has(exercise.id);
            return (
              <ListRow
                key={exercise.id}
                title={exercise.name}
                subtitle={`${exercise.equipment.replace(/_/g, ' ')} · ${exercise.pattern === 'isolation' ? 'isolation' : 'compound'}`}
                onPress={() => toggle(exercise.id)}
                trailing={
                  <View style={styles.tick}>
                    {on ? <Chrome radius={6} style={StyleSheet.absoluteFill} /> : null}
                    {on ? <Text variant="caption" style={chromeText}>✓</Text> : null}
                  </View>
                }
              />
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  chips: { flexDirection: 'row', gap: sp.sm, flexWrap: 'wrap', marginBottom: sp.sm },
  statRow: { flexDirection: 'row', gap: sp.lg, marginTop: sp.lg, flexWrap: 'wrap' },
  hint: { marginBottom: sp.md },
  tick: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 1, borderColor: colors.border.strong,
    alignItems: 'center', justifyContent: 'center',
  },
});
