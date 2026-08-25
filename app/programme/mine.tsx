import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, EmptyState, ListRow, Pill, ProgressBar, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { colors, space as sp } from '@/design';
import { useProgrammeStore } from '@/store/programmeStore';
import { sessionOnDay, weekProgress, weekdayIndex } from '@/engines/training/programme';
import { SEED_TODAY } from '@/data/seed';
import { formatDate } from '@/utils/format';

/**
 * MY WEEK — the programme on the fridge.
 *
 * Every day is listed, rest days included, because a rest day is part of the
 * plan rather than a hole in it. Days can be ticked by hand as well as by
 * finishing a session: people train without their phone, and a tracker that
 * only counts what it witnessed slowly stops matching the truth.
 */
export default function MyProgrammeScreen() {
  const programme = useProgrammeStore((s) => s.active);
  const toggleDay = useProgrammeStore((s) => s.toggleDay);
  const clear = useProgrammeStore((s) => s.clear);

  const todayIndex = weekdayIndex(SEED_TODAY);

  if (!programme) {
    return (
      <Screen>
        <View style={styles.header}>
          <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
          <Text variant="h1">My week</Text>
        </View>
        <EmptyState
          title="No programme yet"
          message="Build a week and make it yours. It will show up here with today's session on top."
          action={{ label: 'Build a week', onPress: () => router.replace('/programme') }}
        />
      </Screen>
    );
  }

  const progress = weekProgress(programme, SEED_TODAY);
  const days = Array.from({ length: 7 }, (_, i) => sessionOnDay(programme, i)).filter(
    (d): d is NonNullable<typeof d> => d !== null,
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">{programme.name}</Text>
        <Text variant="body" tone="tertiary">
          Week of {formatDate(programme.weekOf)}
        </Text>
      </View>

      <Card marker={progress.missed > 0 ? 'warning' : 'none'}>
        <View style={styles.statRow}>
          <StatBlock label="Done" value={String(progress.done)} size="small" />
          <StatBlock label="Planned" value={String(progress.planned)} size="small" />
          <StatBlock label="Missed" value={String(progress.missed)} size="small" />
        </View>
        <ProgressBar
          fraction={progress.fraction ?? 0}
          value={`${Math.round((progress.fraction ?? 0) * 100)}%`}
          tone={progress.missed > 0 ? 'warning' : 'default'}
          style={styles.bar}
        />
        <Text variant="caption" tone="tertiary" style={styles.note}>
          The ticks clear on their own when the week turns over. Last Wednesday
          is not this Wednesday.
        </Text>
      </Card>

      <SectionHeader title="The week" />
      {days.map((day) => (
        <ListRow
          key={day.dayIndex}
          title={`${day.weekday} · ${day.name}`}
          subtitle={
            day.exercises
              ? day.exercises.map((e) => e.exerciseName).slice(0, 3).join(' · ')
              : day.focus ?? (day.isRest ? 'Rest is on the plan' : undefined)
          }
          onPress={day.isRest ? undefined : () => toggleDay(day.dayIndex)}
          trailing={
            day.isRest ? (
              <Text variant="caption" tone="tertiary">
                —
              </Text>
            ) : (
              <View style={styles.trailing}>
                {day.dayIndex === todayIndex ? <Pill label="Today" /> : null}
                <View style={[styles.tick, day.isComplete && styles.tickOn]}>
                  {day.isComplete ? (
                    <Text variant="caption" style={styles.tickMark}>
                      ✓
                    </Text>
                  ) : null}
                </View>
              </View>
            )
          }
        />
      ))}

      {programme.programme ? (
        <>
          <SectionHeader title="Weekly volume" />
          <Card>
            {Object.entries(programme.programme.weeklySets)
              .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
              .map(([muscle, sets]) => (
                <ListRow key={muscle} title={muscle.replace(/_/g, ' ')} value={`${sets} sets`} />
              ))}
          </Card>
        </>
      ) : null}

      <Button
        label="Change programme"
        variant="secondary"
        onPress={() => router.push('/programme')}
        style={styles.cta}
      />
      <Button
        label="Come off the programme"
        variant="ghost"
        onPress={() => {
          clear();
          router.replace('/train');
        }}
        style={styles.ghostCta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  statRow: { flexDirection: 'row', gap: sp.xl },
  bar: { marginTop: sp.lg },
  note: { marginTop: sp.lg },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  tick: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 1, borderColor: colors.border.strong,
    alignItems: 'center', justifyContent: 'center',
  },
  tickOn: { backgroundColor: colors.text.primary, borderColor: colors.text.primary },
  tickMark: { color: colors.text.inverse },
  cta: { marginTop: sp.xl },
  ghostCta: { marginTop: sp.sm },
});
