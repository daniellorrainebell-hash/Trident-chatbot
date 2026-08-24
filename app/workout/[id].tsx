import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, EmptyState, Pill, Screen, SectionHeader, StatBlock, Text } from '@/components';
import { colors, space as sp } from '@/design';
import { useWorkoutStore } from '@/store/workoutStore';
import { workoutVolumeKg, countWorkingSets, setVolumeKg } from '@/engines/training/volume';
import { formatVolume, formatDuration, formatDate } from '@/utils/format';
import { findExercise } from '@/data/exercises';

/**
 * A single past session (spec §16: every training day should be tappable).
 *
 * Warm-ups are shown but visually demoted, because they were part of the session
 * even though they contribute nothing to the totals — hiding them would make the
 * history disagree with what the user actually did.
 */
export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const history = useWorkoutStore((s) => s.history);
  const personalRecords = useWorkoutStore((s) => s.personalRecords);
  const repeatWorkout = useWorkoutStore((s) => s.repeatWorkout);

  const workout = history.find((w) => w.id === id);

  if (!workout) {
    return (
      <Screen>
        <EmptyState
          title="Session not found"
          message="This session is not in your record."
          action={{ label: 'Back to The Record', onPress: () => router.replace('/record') }}
        />
      </Screen>
    );
  }

  const prsFromSession = personalRecords.filter((pr) => pr.workoutId === workout.id);

  return (
    <Screen
      footer={
        <Button
          label="Repeat this session"
          onPress={() => {
            repeatWorkout(workout);
            router.replace('/workout/active');
          }}
        />
      }
    >
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="overline" tone="tertiary">
          {formatDate(workout.completedAt ?? workout.startedAt)}
        </Text>
        <Text variant="h1">{workout.title}</Text>
      </View>

      <Card>
        <View style={styles.statRow}>
          <StatBlock
            label="Volume"
            value={formatVolume(workoutVolumeKg(workout)).split(' ')[0] ?? '0'}
            unit="kg"
            size="medium"
          />
          <StatBlock label="Sets" value={String(countWorkingSets(workout))} size="medium" />
          <StatBlock
            label="Duration"
            value={formatDuration(workout.durationSeconds)}
            size="medium"
          />
        </View>
      </Card>

      {prsFromSession.length > 0 ? (
        <>
          <SectionHeader title="Records set" />
          <View style={styles.prRow}>
            {prsFromSession.map((pr) => (
              <Pill key={pr.id} label={`${pr.exerciseName} · ${pr.value}`} tone="success" />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="Exercises" />
      {workout.exercises.map((exercise) => {
        const definition = findExercise(exercise.exerciseId);
        const volume = exercise.sets.reduce((sum, s) => sum + setVolumeKg(s, exercise.metric), 0);

        return (
          <Card key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseTitle}>
                <Text variant="h3">{exercise.exerciseName}</Text>
                {definition ? (
                  <Text variant="caption" tone="tertiary">
                    {definition.equipment.replace('_', ' ')}
                  </Text>
                ) : null}
              </View>
              {volume > 0 ? (
                <Text variant="bodySmall" tone="tertiary">
                  {formatVolume(volume)}
                </Text>
              ) : null}
            </View>

            <View style={styles.sets}>
              {exercise.sets.map((set) => (
                <View
                  key={set.id}
                  style={[styles.setRow, set.isWarmup && styles.warmupRow]}
                >
                  <Text variant="bodySmall" tone="tertiary" style={styles.setIndex}>
                    {set.isWarmup ? 'W' : set.index}
                  </Text>
                  <Text variant="metricS" tone={set.isWarmup ? 'tertiary' : 'primary'}>
                    {describeSet(set.weightKg, set.reps, set.durationSeconds, set.distanceMeters, set.rounds)}
                  </Text>
                  {set.rpe != null ? (
                    <Text variant="caption" tone="tertiary">
                      RPE {set.rpe}
                    </Text>
                  ) : null}
                  {!set.completed ? (
                    <Text variant="caption" tone="tertiary">
                      not logged
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>

            {exercise.notes ? (
              <Text variant="bodySmall" tone="secondary" style={styles.notes}>
                {exercise.notes}
              </Text>
            ) : null}
          </Card>
        );
      })}

      {workout.notes ? (
        <>
          <SectionHeader title="Notes" />
          <Card>
            <Text variant="body" tone="secondary">
              {workout.notes}
            </Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function describeSet(
  weightKg: number | null,
  reps: number | null,
  durationSeconds: number | null,
  distanceMeters: number | null,
  rounds: number | null,
): string {
  if (weightKg != null && reps != null) return `${weightKg} kg × ${reps}`;
  if (reps != null) return `${reps} reps`;
  if (distanceMeters != null && durationSeconds != null) {
    return `${(distanceMeters / 1000).toFixed(2)} km · ${Math.round(durationSeconds / 60)} min`;
  }
  if (distanceMeters != null) return `${(distanceMeters / 1000).toFixed(2)} km`;
  if (durationSeconds != null) return `${Math.round(durationSeconds / 60)} min`;
  if (rounds != null) return `${rounds} rounds`;
  return '—';
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.xl, gap: sp.xs, alignItems: 'flex-start' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  prRow: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.sm },
  exerciseCard: { marginBottom: sp.md },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  exerciseTitle: { flex: 1, gap: sp.xxs },
  sets: { marginTop: sp.lg, gap: sp.sm },
  setRow: { flexDirection: 'row', alignItems: 'baseline', gap: sp.md },
  warmupRow: { opacity: 0.55 },
  setIndex: { width: 20 },
  notes: { marginTop: sp.lg },
});
