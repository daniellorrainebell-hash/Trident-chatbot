import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button, Card, EmptyState, Pill, SetRow, Text, Timer,
} from '@/components';
import { colors, space as sp } from '@/design';
import { useWorkoutStore } from '@/store/workoutStore';
import { workoutVolumeKg, countWorkingSets } from '@/engines/training/volume';
import { findExercise } from '@/data/exercises';
import { formatClock, formatVolume } from '@/utils/format';
import { track } from '@/services/analytics';
import type { WorkoutSet } from '@/types';

const REST_PRESETS = [60, 90, 120, 180];

/**
 * The active workout (spec §12, §85).
 *
 * The screen this product lives or dies on. Design constraints that shaped it:
 *
 *   - Running totals sit pinned at the top, so progress is visible without
 *     scrolling back through a long session.
 *   - Finish is always reachable in the footer. Hunting for it at the bottom of
 *     twelve exercises is the kind of friction that makes people stop logging.
 *   - Every mutation writes through to SQLite immediately (spec §13).
 *   - The header clock counts from the start timestamp, so backgrounding the app
 *     mid-session does not lose time.
 */
export default function ActiveWorkoutScreen() {
  const active = useWorkoutStore((s) => s.active);
  const restTimerSeconds = useWorkoutStore((s) => s.restTimerSeconds);
  const startRestTimer = useWorkoutStore((s) => s.startRestTimer);
  const clearRestTimer = useWorkoutStore((s) => s.clearRestTimer);
  const updateSet = useWorkoutStore((s) => s.updateSet);
  const toggleSetComplete = useWorkoutStore((s) => s.toggleSetComplete);
  const addSet = useWorkoutStore((s) => s.addSet);
  const removeSet = useWorkoutStore((s) => s.removeSet);
  const removeExercise = useWorkoutStore((s) => s.removeExercise);
  const reorderExercise = useWorkoutStore((s) => s.reorderExercise);
  const finishWorkout = useWorkoutStore((s) => s.finishWorkout);
  const abandonWorkout = useWorkoutStore((s) => s.abandonWorkout);
  const history = useWorkoutStore((s) => s.history);

  const [elapsed, setElapsed] = useState(0);

  // Derived from the start timestamp rather than incremented, so time spent
  // backgrounded is still counted.
  useEffect(() => {
    if (!active) return;
    const started = new Date(active.startedAt).getTime();
    const tick = () => setElapsed((Date.now() - started) / 1000);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [active]);

  const handleFinish = useCallback(() => {
    if (!active) return;

    const sets = countWorkingSets(active);
    if (sets === 0) {
      Alert.alert(
        'Nothing logged',
        'No sets have been completed. Finishing now records an empty session.',
        [
          { text: 'Keep training', style: 'cancel' },
          {
            text: 'Discard session',
            style: 'destructive',
            onPress: () => {
              abandonWorkout();
              router.back();
            },
          },
        ],
      );
      return;
    }

    const summary = finishWorkout();
    if (summary) {
      track({
        name: 'workout_completed',
        properties: {
          exerciseCount: summary.exerciseCount,
          workingSets: summary.workingSets,
          durationMinutes: Math.round(summary.durationSeconds / 60),
          prCount: summary.personalRecords.length,
        },
      });
      router.replace('/workout/complete');
    }
  }, [active, finishWorkout, abandonWorkout]);

  const handleDiscard = useCallback(() => {
    Alert.alert('Discard session?', 'Everything logged in this session will be lost.', [
      { text: 'Keep training', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          abandonWorkout();
          router.back();
        },
      },
    ]);
  }, [abandonWorkout]);

  /** The same exercise from the most recent session that trained it. */
  const previousFor = useCallback(
    (exerciseId: string, index: number): { weightKg: number | null; reps: number | null } | null => {
      for (let i = history.length - 1; i >= 0; i -= 1) {
        const match = history[i]!.exercises.find((e) => e.exerciseId === exerciseId);
        if (!match) continue;
        const working = match.sets.filter((s) => !s.isWarmup && s.completed);
        const set = working[index];
        if (set) return { weightKg: set.weightKg, reps: set.reps };
      }
      return null;
    },
    [history],
  );

  if (!active) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          title="No active session"
          message="Start a session from the Train tab."
          action={{ label: 'Go to Train', onPress: () => router.replace('/train') }}
        />
      </SafeAreaView>
    );
  }

  const volume = workoutVolumeKg(active);
  const sets = countWorkingSets(active);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Running totals, pinned. */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text variant="overline" tone="danger">
              Logging
            </Text>
            <Text variant="h2">{active.title}</Text>
          </View>
          <Text variant="metricM" tone="secondary">
            {formatClock(elapsed)}
          </Text>
        </View>
        <View style={styles.totals}>
          <Text variant="bodySmall" tone="tertiary">
            {sets} set{sets === 1 ? '' : 's'}
          </Text>
          <Text variant="bodySmall" tone="tertiary">
            {formatVolume(volume)}
          </Text>
          <Text variant="bodySmall" tone="tertiary">
            {active.exercises.length} exercise{active.exercises.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {restTimerSeconds != null ? (
          <View style={styles.timerWrap}>
            <Timer
              durationSeconds={restTimerSeconds}
              label="Rest"
              onComplete={() => {}}
              onCancel={clearRestTimer}
            />
          </View>
        ) : null}

        {active.exercises.length === 0 ? (
          <EmptyState
            title="No exercises yet"
            message="Add your first movement to start logging."
            action={{
              label: 'Add exercise',
              onPress: () => router.push('/workout/exercise-picker'),
            }}
          />
        ) : (
          active.exercises.map((exercise, exerciseIndex) => {
            const definition = findExercise(exercise.exerciseId);
            const workingCount = exercise.sets.filter((s) => !s.isWarmup).length;

            return (
              <Card key={exercise.id} style={styles.exerciseCard} padded={false}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseTitle}>
                    <Text variant="h3">{exercise.exerciseName}</Text>
                    {definition ? (
                      <Text variant="caption" tone="tertiary">
                        {definition.equipment.replace('_', ' ')} · {definition.primaryMuscle.replace('_', ' ')}
                        {definition.unilateral ? ' · per side' : ''}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.exerciseActions}>
                    {exerciseIndex > 0 ? (
                      <Button
                        label="↑"
                        size="small"
                        variant="ghost"
                        haptic={false}
                        onPress={() => reorderExercise(exercise.id, 'up')}
                        accessibilityHint={`Move ${exercise.exerciseName} up`}
                      />
                    ) : null}
                    {exerciseIndex < active.exercises.length - 1 ? (
                      <Button
                        label="↓"
                        size="small"
                        variant="ghost"
                        haptic={false}
                        onPress={() => reorderExercise(exercise.id, 'down')}
                        accessibilityHint={`Move ${exercise.exerciseName} down`}
                      />
                    ) : null}
                  </View>
                </View>

                <View style={styles.sets}>
                  {exercise.sets.map((set) => {
                    const workingIndex = exercise.sets
                      .filter((s) => !s.isWarmup)
                      .findIndex((s) => s.id === set.id);

                    return (
                      <SetRow
                        key={set.id}
                        set={set}
                        metric={exercise.metric}
                        previous={
                          set.isWarmup ? null : previousFor(exercise.exerciseId, workingIndex)
                        }
                        onChange={(patch: Partial<WorkoutSet>) =>
                          updateSet(exercise.id, set.id, patch)
                        }
                        onToggleComplete={() => {
                          toggleSetComplete(exercise.id, set.id);
                          // Starting the rest timer on completion is the whole
                          // point of a rest timer — asking for a second tap is
                          // friction between sets.
                          if (!set.completed && !set.isWarmup) startRestTimer(90);
                        }}
                        onToggleWarmup={() =>
                          updateSet(exercise.id, set.id, { isWarmup: !set.isWarmup })
                        }
                      />
                    );
                  })}
                </View>

                <View style={styles.exerciseFooter}>
                  <Button
                    label="Add set"
                    size="small"
                    variant="secondary"
                    onPress={() => addSet(exercise.id)}
                  />
                  {workingCount > 1 ? (
                    <Button
                      label="Remove last"
                      size="small"
                      variant="ghost"
                      onPress={() => {
                        const last = exercise.sets[exercise.sets.length - 1];
                        if (last) removeSet(exercise.id, last.id);
                      }}
                    />
                  ) : null}
                  <Button
                    label="Remove"
                    size="small"
                    variant="ghost"
                    onPress={() => removeExercise(exercise.id)}
                    accessibilityHint={`Remove ${exercise.exerciseName} from this session`}
                  />
                </View>
              </Card>
            );
          })
        )}

        {/* The empty state carries its own call to action, so the standing
            button below the list would be the same offer twice on the one
            screen where there is nothing else to look at. */}
        {active.exercises.length > 0 ? (
          <Button
            label="Add exercise"
            variant="secondary"
            onPress={() => router.push('/workout/exercise-picker')}
            style={styles.addExercise}
          />
        ) : null}

        <View style={styles.restRow}>
          <Text variant="overline" tone="tertiary">
            Rest timer
          </Text>
          <View style={styles.restPresets}>
            {REST_PRESETS.map((seconds) => (
              <Pill
                key={seconds}
                label={`${seconds}s`}
                onPress={() => startRestTimer(seconds)}
                selected={restTimerSeconds === seconds}
              />
            ))}
          </View>
        </View>

        <Button
          label="Discard session"
          variant="ghost"
          onPress={handleDiscard}
          style={styles.discard}
        />
      </ScrollView>

      {/* Finish is always one tap away. */}
      <View style={styles.footer}>
        <Button label="Finish session" onPress={handleFinish} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.base },
  header: {
    paddingHorizontal: sp.lg,
    paddingBottom: sp.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.bg.void,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: sp.sm,
  },
  totals: { flexDirection: 'row', gap: sp.lg, marginTop: sp.sm },
  scroll: { flex: 1 },
  scrollContent: { padding: sp.lg, paddingBottom: sp.huge },
  timerWrap: { marginBottom: sp.lg },
  exerciseCard: { marginBottom: sp.md },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: sp.lg,
    paddingBottom: sp.sm,
  },
  exerciseTitle: { flex: 1, gap: sp.xxs },
  exerciseActions: { flexDirection: 'row' },
  sets: { paddingHorizontal: sp.sm, gap: sp.xxs },
  exerciseFooter: {
    flexDirection: 'row',
    gap: sp.sm,
    padding: sp.md,
    paddingTop: sp.sm,
    flexWrap: 'wrap',
  },
  addExercise: { marginTop: sp.sm },
  restRow: { marginTop: sp.xxl, gap: sp.md },
  restPresets: { flexDirection: 'row', gap: sp.sm, flexWrap: 'wrap' },
  discard: { marginTop: sp.xxl },
  footer: {
    paddingHorizontal: sp.lg,
    paddingTop: sp.md,
    paddingBottom: sp.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.bg.void,
  },
});
