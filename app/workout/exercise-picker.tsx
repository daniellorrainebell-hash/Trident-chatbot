import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, ListRow, Pill, Card, EmptyState, Text } from '@/components';
import { colors, space as sp } from '@/design';
import { EXERCISES, MUSCLE_FILTERS, searchExercises } from '@/data/exercises';
import { useWorkoutStore } from '@/store/workoutStore';
import type { MuscleGroup } from '@/types';

/**
 * Exercise picker (spec §12, §14).
 *
 * Search runs over names and aliases, ranked so an exact prefix wins — typing
 * "bench" must land on Bench Press, not Close-Grip Bench Press. Alias matching
 * is what makes "OHP" and "RDL" work, and it is the difference between a picker
 * people use and one they fight.
 *
 * The picker stays open after adding, because sessions are built several
 * movements at a time.
 */
export default function ExercisePickerScreen() {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [added, setAdded] = useState<string[]>([]);

  const addExercise = useWorkoutStore((s) => s.addExercise);
  const active = useWorkoutStore((s) => s.active);

  const results = useMemo(() => {
    const pool = muscle ? EXERCISES.filter((e) => e.primaryMuscle === muscle) : EXERCISES;
    return searchExercises(query, pool);
  }, [query, muscle]);

  const alreadyInSession = useMemo(
    () => new Set(active?.exercises.map((e) => e.exerciseId) ?? []),
    [active],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text variant="h2">Add exercise</Text>
          <Button label="Done" size="small" variant="ghost" onPress={() => router.back()} />
        </View>

        <Field
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Bench, OHP, RDL…"
          autoCapitalize="none"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <Pill
            label="All"
            selected={muscle === null}
            onPress={() => setMuscle(null)}
          />
          {MUSCLE_FILTERS.map((filter) => (
            <Pill
              key={filter.id}
              label={filter.label}
              selected={muscle === filter.id}
              onPress={() => setMuscle(muscle === filter.id ? null : filter.id)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {results.length === 0 ? (
          <EmptyState
            title="No matches"
            message={`Nothing matches "${query}". You can add a custom exercise instead.`}
          />
        ) : (
          <Card padded={false} style={styles.list}>
            {results.map((exercise, i) => {
              const justAdded = added.includes(exercise.id);
              const inSession = alreadyInSession.has(exercise.id);

              return (
                <ListRow
                  key={exercise.id}
                  title={exercise.name}
                  subtitle={[
                    exercise.equipment.replace('_', ' '),
                    exercise.primaryMuscle.replace('_', ' '),
                    exercise.unilateral ? 'per side' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  last={i === results.length - 1}
                  trailing={
                    justAdded || inSession ? (
                      <Pill label={justAdded ? 'Added' : 'In session'} tone="success" />
                    ) : undefined
                  }
                  onPress={() => {
                    addExercise(exercise);
                    setAdded((prev) => [...prev, exercise.id]);
                  }}
                />
              );
            })}
          </Card>
        )}
      </ScrollView>

      {added.length > 0 ? (
        <View style={styles.footer}>
          <Button
            label={`Done — ${added.length} added`}
            onPress={() => router.back()}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg.base },
  header: {
    paddingHorizontal: sp.lg,
    paddingTop: sp.lg,
    paddingBottom: sp.md,
    gap: sp.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filters: { gap: sp.sm, paddingRight: sp.lg },
  scroll: { flex: 1 },
  scrollContent: { padding: sp.lg },
  list: { paddingHorizontal: sp.lg },
  footer: {
    paddingHorizontal: sp.lg,
    paddingTop: sp.md,
    paddingBottom: sp.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});
