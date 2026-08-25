import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, EmptyState, ListRow, Screen, SectionHeader, Text,
} from '@/components';
import { space as sp } from '@/design';
import { useWorkoutStore } from '@/store/workoutStore';
import { seedTemplates, SEED_TODAY } from '@/data/seed';
import { workoutVolumeKg, countWorkingSets } from '@/engines/training/volume';
import { formatVolume, formatDuration, formatRelative } from '@/utils/format';
import { track } from '@/services/analytics';

/**
 * TRAIN — the entry point to a session (spec §12).
 *
 * Three routes in, ordered by how often they get used: repeat what you did last
 * time, run a saved template, or start blank. Most sessions are a repeat, so
 * that path is the shortest.
 */
const DISCIPLINE_CARDS = [
  { name: 'BJJ', title: 'The Mat', href: '/discipline/bjj' as const },
  { name: 'MMA', title: 'The Cage', href: '/discipline/mma' as const },
  { name: 'HYROX', title: 'The Floor', href: '/discipline/hyrox' as const },
];

export default function TrainScreen() {
  const active = useWorkoutStore((s) => s.active);
  const history = useWorkoutStore((s) => s.history);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const startFromTemplate = useWorkoutStore((s) => s.startFromTemplate);
  const repeatWorkout = useWorkoutStore((s) => s.repeatWorkout);

  const recent = [...history]
    .filter((w) => w.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 6);

  const lastSession = recent[0];
  const now = new Date(`${SEED_TODAY}T20:00:00Z`);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1">Train</Text>
        <Text variant="body" tone="tertiary">
          Talk is cheap. Log the work.
        </Text>
      </View>

      {/* The four disciplines. Each keeps its own units, because a round is not
          a set and a sled push is not a rep — the moment they share a scale,
          none of the numbers mean anything. Gym is the screen you are on. */}
      <SectionHeader title="Discipline" />
      <View style={styles.disciplines}>
        {DISCIPLINE_CARDS.map((card) => (
          <Card key={card.href} style={styles.disciplineCard} onPress={() => router.push(card.href)}>
            <Text variant="overline" tone="tertiary">
              {card.name}
            </Text>
            <Text variant="h3" style={styles.disciplineTitle}>
              {card.title}
            </Text>
          </Card>
        ))}
      </View>

      {active ? (
        <Card marker="live">
          <Text variant="overline" tone="danger">
            Session in progress
          </Text>
          <Text variant="h2" style={styles.spaced}>
            {active.title}
          </Text>
          <Button label="Resume" onPress={() => router.push('/workout/active')} />
        </Card>
      ) : (
        <Card>
          <Text variant="h3">Start a session</Text>
          <Text variant="bodySmall" tone="tertiary" style={styles.spaced}>
            Add exercises as you go, or pick a template below.
          </Text>
          <Button
            label="Start empty session"
            onPress={() => {
              startWorkout('Session');
              track({ name: 'workout_started', properties: { source: 'blank' } });
              router.push('/workout/active');
            }}
          />
        </Card>
      )}

      {lastSession && !active ? (
        <>
          <SectionHeader title="Repeat last session" />
          <Card>
            <Text variant="h3">{lastSession.title}</Text>
            <Text variant="bodySmall" tone="tertiary" style={styles.spaced}>
              {lastSession.exercises.length} exercises · {countWorkingSets(lastSession)} sets ·{' '}
              {formatVolume(workoutVolumeKg(lastSession))}
            </Text>
            <Button
              label="Repeat it"
              variant="secondary"
              onPress={() => {
                repeatWorkout(lastSession);
                track({ name: 'workout_started', properties: { source: 'repeat' } });
                router.push('/workout/active');
              }}
            />
          </Card>
        </>
      ) : null}

      <SectionHeader title="Tools" />
      <Card padded={false} style={styles.list}>
        <ListRow
          title="Timers"
          subtitle="Rest, rounds, HIIT, EMOM and AMRAP"
          onPress={() => router.push('/timers')}
        />
        <ListRow
          title="Fight Camp"
          subtitle="Rounds, roadwork and camp progress"
          onPress={() => router.push('/fight-camp')}
        />
        <ListRow
          title="Contracts"
          subtitle="Promises with a deadline"
          onPress={() => router.push('/contracts')}
          last
        />
      </Card>

      <SectionHeader title="Templates" />
      {seedTemplates.length > 0 ? (
        <Card padded={false} style={styles.list}>
          {seedTemplates.map((template, i) => (
            <ListRow
              key={template.id}
              title={template.name}
              subtitle={`${template.exercises.length} exercises${
                template.lastUsedAt ? ` · ${formatRelative(template.lastUsedAt, now)}` : ''
              }`}
              last={i === seedTemplates.length - 1}
              onPress={() => {
                if (active) {
                  router.push('/workout/active');
                  return;
                }
                startFromTemplate(template.name, template.exercises);
                track({ name: 'workout_started', properties: { source: 'template' } });
                router.push('/workout/active');
              }}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title="No templates yet"
          message="Finish a session and save it as a template to start faster next time."
        />
      )}

      <SectionHeader
        title="Recent sessions"
        action={{ label: 'The Record', onPress: () => router.push('/record') }}
      />
      {recent.length > 0 ? (
        <Card padded={false} style={styles.list}>
          {recent.map((workout, i) => (
            <ListRow
              key={workout.id}
              title={workout.title}
              subtitle={`${countWorkingSets(workout)} sets · ${formatDuration(workout.durationSeconds)}`}
              value={formatVolume(workoutVolumeKg(workout)).split(' ')[0]}
              valueDetail={formatRelative(workout.completedAt ?? '', now)}
              last={i === recent.length - 1}
              onPress={() => router.push(`/workout/${workout.id}`)}
            />
          ))}
        </Card>
      ) : (
        <EmptyState
          title="No sessions logged"
          message="You do not get credit for intentions. Only the work counts."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  disciplines: { flexDirection: 'row', gap: sp.sm, flexWrap: 'wrap', marginBottom: sp.lg },
  disciplineCard: { flex: 1, gap: sp.xxs },
  disciplineTitle: { marginTop: sp.xxs },
  header: { marginTop: sp.lg, marginBottom: sp.xl, gap: sp.xs },
  spaced: { marginTop: sp.xs, marginBottom: sp.lg },
  list: { paddingHorizontal: sp.lg },
});
