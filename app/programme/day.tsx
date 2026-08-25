import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Pill, Screen, SectionHeader, StatBlock, Text } from '@/components';
import { space as sp } from '@/design';
import { generateProgramme } from '@/engines/training/programme';
import { SLOTS, type SlotId } from '@/data/programmes/splits';
import type { Experience, Goal } from '@/data/programmes/coaching';
import { useWorkoutStore } from '@/store/workoutStore';
import { findExercise } from '@/data/exercises';

/**
 * One session from the generated week.
 *
 * Shows the reasoning, not just the list: reps as a range because the range is
 * the progression, rest in seconds because most people rest by feel and get it
 * wrong, and reps-in-reserve because "3 sets of 8" without a difficulty is a
 * number, not an instruction.
 */
export default function ProgrammeDayScreen() {
  const params = useLocalSearchParams<{ slot?: string; goal?: string; experience?: string; days?: string }>();
  const startFromTemplate = useWorkoutStore((s) => s.startFromTemplate);

  const slotId = (params.slot ?? 'push') as SlotId;
  const goal = (params.goal ?? 'hypertrophy') as Goal;
  const experience = (params.experience ?? 'intermediate') as Experience;
  const days = Number(params.days ?? 5);

  const day = useMemo(() => {
    const programme = generateProgramme({ daysPerWeek: days, experience, goal });
    return programme.days.find((d) => d.slotId === slotId) ?? null;
  }, [days, experience, goal, slotId]);

  const slot = SLOTS[slotId];
  const totalSets = day?.exercises.reduce((sum, e) => sum + e.sets, 0) ?? 0;
  // Working time plus rest, which is the number that decides whether this fits
  // in a lunch break. Roughly 40 seconds a set under the bar.
  const estimatedMinutes = day
    ? Math.round(day.exercises.reduce((sum, e) => sum + e.sets * (40 + e.restSeconds), 0) / 60)
    : 0;

  return (
    <Screen
      footer={
        day && day.exercises.length > 0 ? (
          <Button
            label="Start this session"
            onPress={() => {
              startFromTemplate(
                slot.name,
                day.exercises.map((e) => ({
                  exerciseId: e.exerciseId,
                  exerciseName: e.exerciseName,
                  metric: findExercise(e.exerciseId)?.metric ?? 'weight_reps',
                  targetSets: e.sets,
                  targetReps: e.repsLow,
                })),
              );
              router.push('/workout/active');
            }}
          />
        ) : null
      }
    >
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">{slot.name}</Text>
        <Text variant="body" tone="tertiary">
          {slot.description}
        </Text>
      </View>

      <Card>
        <View style={styles.statRow}>
          <StatBlock label="Movements" value={String(day?.exercises.length ?? 0)} size="small" />
          <StatBlock label="Sets" value={String(totalSets)} size="small" />
          <StatBlock label="About" value={`${estimatedMinutes}m`} size="small" />
        </View>
      </Card>

      <SectionHeader title="The session" />
      {day?.exercises.map((exercise, i) => (
        <Card key={`${exercise.exerciseId}-${i}`} style={styles.exerciseCard}>
          <View style={styles.exerciseHead}>
            <Text variant="h3" style={styles.flex}>
              {exercise.exerciseName}
            </Text>
            <Pill label={exercise.role === 'compound' ? 'Compound' : 'Isolation'} />
          </View>
          <View style={styles.statRow}>
            <StatBlock label="Sets" value={String(exercise.sets)} size="small" />
            <StatBlock label="Reps" value={`${exercise.repsLow}–${exercise.repsHigh}`} size="small" />
            <StatBlock label="Rest" value={`${exercise.restSeconds}s`} size="small" />
            <StatBlock label="Leave" value={`${exercise.targetRir} RIR`} size="small" />
          </View>
        </Card>
      ))}

      <Text variant="bodySmall" tone="tertiary" style={styles.note}>
        The rep range is the progression. Work to the top of it on every set,
        then add load and start again at the bottom. Leave{' '}
        {day?.exercises[0]?.targetRir ?? 2} rep
        {(day?.exercises[0]?.targetRir ?? 2) === 1 ? '' : 's'} in reserve — training
        every set to failure buys fatigue, not growth.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  statRow: { flexDirection: 'row', gap: sp.lg, flexWrap: 'wrap' },
  exerciseCard: { marginBottom: sp.sm, gap: sp.md },
  exerciseHead: { flexDirection: 'row', alignItems: 'center', gap: sp.md },
  flex: { flex: 1 },
  note: { marginTop: sp.lg },
});
