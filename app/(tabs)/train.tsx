import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, EmptyState, ListRow, Pill, ProgressBar, Screen, SectionHeader, Text,
} from '@/components';
import { space as sp } from '@/design';
import { useWorkoutStore } from '@/store/workoutStore';
import { seedTemplates, SEED_TODAY } from '@/data/seed';
import { workoutVolumeKg, countWorkingSets } from '@/engines/training/volume';
import { formatVolume, formatDuration, formatRelative } from '@/utils/format';
import { track } from '@/services/analytics';
import { useProgrammeStore } from '@/store/programmeStore';
import { sessionToday, weekProgress } from '@/engines/training/programme';

/**
 * TRAIN — the entry point to a session (spec §12).
 *
 * Three routes in, ordered by how often they get used: repeat what you did last
 * time, run a saved template, or start blank. Most sessions are a repeat, so
 * that path is the shortest.
 */
export default function TrainScreen() {
  const active = useWorkoutStore((s) => s.active);
  const history = useWorkoutStore((s) => s.history);
  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const startFromTemplate = useWorkoutStore((s) => s.startFromTemplate);
  const repeatWorkout = useWorkoutStore((s) => s.repeatWorkout);
  const programme = useProgrammeStore((s) => s.active);
  const toggleDay = useProgrammeStore((s) => s.toggleDay);

  const today = programme ? sessionToday(programme, SEED_TODAY) : null;
  const progress = programme ? weekProgress(programme, SEED_TODAY) : null;

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

      {/* Training is the gym. Everything else lives one tap away rather than
          crowding the screen you are on when you want to start lifting. */}
      <View style={styles.switchRow}>
        <Card style={styles.switchCard} onPress={() => router.push('/discipline')}>
          <Text variant="overline" tone="tertiary">
            Discipline
          </Text>
          <Text variant="h3" style={styles.switchTitle}>
            Gym
          </Text>
          <Text variant="caption" tone="tertiary">
            Tap to switch
          </Text>
        </Card>
        <Card style={styles.switchCard} onPress={() => router.push('/programme')}>
          <Text variant="overline" tone="tertiary">
            Programme
          </Text>
          <Text variant="h3" style={styles.switchTitle}>
            {programme ? 'My week' : 'Build a week'}
          </Text>
          <Text variant="caption" tone="tertiary">
            {programme ? programme.name : 'Auto or your own'}
          </Text>
        </Card>
      </View>

      {/* The programme on the fridge. Today first, then how the week is going —
          because a plan you cannot see yourself falling behind on is a plan you
          fall behind on quietly. */}
      {programme && today && progress ? (
        <>
          <SectionHeader
            title="On the programme"
            action={{ label: 'Week', onPress: () => router.push('/programme/mine') }}
          />
          <Card marker={progress.missed > 0 ? 'warning' : 'none'}>
            <View style={styles.programmeHead}>
              <View style={styles.flex}>
                <Text variant="overline" tone="tertiary">
                  Today · {today.weekday}
                </Text>
                <Text variant="h2" style={styles.spaced}>
                  {today.name}
                </Text>
              </View>
              {today.isComplete ? <Pill label="Done" tone="success" /> : null}
            </View>

            {today.exercises && today.exercises.length > 0 ? (
              <Text variant="bodySmall" tone="tertiary" style={styles.spaced}>
                {today.exercises.map((e) => e.exerciseName).slice(0, 4).join(' · ')}
              </Text>
            ) : null}
            {today.focus ? (
              <Text variant="bodySmall" tone="tertiary" style={styles.spaced}>
                {today.focus}
              </Text>
            ) : null}

            <ProgressBar
              fraction={progress.fraction ?? 0}
              value={`${progress.done} / ${progress.planned} this week`}
              tone={progress.missed > 0 ? 'warning' : 'default'}
              style={styles.programmeBar}
            />
            {progress.missed > 0 ? (
              <Text variant="caption" tone="tertiary" style={styles.spaced}>
                {progress.missed} session{progress.missed === 1 ? '' : 's'} missed so far.
              </Text>
            ) : null}

            {today.isRest ? (
              <Text variant="bodySmall" tone="tertiary" style={styles.spaced}>
                Rest is on the plan, not a gap in it.
              </Text>
            ) : (
              <Button
                label={today.isComplete ? 'Mark as not done' : 'Start today'}
                variant={today.isComplete ? 'secondary' : 'primary'}
                onPress={() => {
                  if (today.isComplete) {
                    toggleDay(today.dayIndex);
                    return;
                  }
                  if (today.exercises && today.exercises.length > 0) {
                    startFromTemplate(
                      today.name,
                      today.exercises.map((e) => ({
                        exerciseId: e.exerciseId,
                        exerciseName: e.exerciseName,
                        metric: 'weight_reps' as const,
                        targetSets: e.sets,
                        targetReps: e.repsLow,
                      })),
                    );
                    router.push('/workout/active');
                  } else {
                    toggleDay(today.dayIndex);
                  }
                }}
                style={styles.programmeCta}
              />
            )}
          </Card>
        </>
      ) : null}

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
  switchRow: { flexDirection: 'row', gap: sp.sm, marginBottom: sp.lg },
  programmeHead: { flexDirection: 'row', alignItems: 'flex-start', gap: sp.md },
  programmeBar: { marginTop: sp.lg },
  programmeCta: { marginTop: sp.lg },
  flex: { flex: 1 },
  switchCard: { flex: 1, gap: sp.xxs },
  switchTitle: { marginTop: sp.xxs },
  header: { marginTop: sp.lg, marginBottom: sp.xl, gap: sp.xs },
  spaced: { marginTop: sp.xs, marginBottom: sp.lg },
  list: { paddingHorizontal: sp.lg },
});
