import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  Button, Card, ListRow, Pill, Screen, SectionHeader, StatBlock, Text,
} from '@/components';
import { space as sp } from '@/design';
import { generateDisciplineWeek, generateProgramme } from '@/engines/training/programme';
import {
  DISCIPLINE_LABELS, EXPERIENCE_LABELS, GOAL_LABELS, type Experience, type Goal,
} from '@/data/programmes/coaching';
import { formatDuration } from '@/utils/format';
import type { Discipline } from '@/types';

const DISCIPLINES: Discipline[] = ['gym', 'bjj', 'mma', 'boxing', 'strongman'];
const DAYS = [3, 4, 5, 6];

/**
 * BUILD A WEEK.
 *
 * Two ways in, and they are genuinely different jobs. "Build it for me" writes
 * a week to the same rules a coach would use and shows its working, so you can
 * disagree with it. "Build my own" hands you the exercise list and gets out of
 * the way.
 *
 * The generated week is shown *before* it is saved. A plan you have not read is
 * a plan you will not follow, and the volume line at the bottom is there so the
 * number can be argued with rather than taken on faith.
 */
export default function ProgrammeScreen() {
  const [discipline, setDiscipline] = useState<Discipline>('gym');
  const [days, setDays] = useState(5);
  const [experience, setExperience] = useState<Experience>('intermediate');
  const [goal, setGoal] = useState<Goal>('hypertrophy');

  const programme = useMemo(
    () => (discipline === 'gym' ? generateProgramme({ daysPerWeek: days, experience, goal }) : null),
    [discipline, days, experience, goal],
  );

  const week = useMemo(
    () =>
      discipline === 'gym'
        ? null
        : generateDisciplineWeek(discipline as Exclude<Discipline, 'gym'>, Math.min(5, days)),
    [discipline, days],
  );

  const totalSets = programme
    ? Object.values(programme.weeklySets).reduce<number>((sum, n) => sum + (n ?? 0), 0)
    : 0;

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Build a week</Text>
        <Text variant="body" tone="tertiary">
          Answer four things and read what comes back. Change any of them and it
          rebuilds.
        </Text>
      </View>

      <SectionHeader title="Discipline" />
      <View style={styles.chips}>
        {DISCIPLINES.map((d) => (
          <Pill
            key={d}
            label={DISCIPLINE_LABELS[d]}
            tone="accent"
            selected={discipline === d}
            onPress={() => setDiscipline(d)}
          />
        ))}
      </View>

      <SectionHeader title="Days a week" />
      <View style={styles.chips}>
        {DAYS.map((d) => (
          <Pill key={d} label={`${d} days`} tone="accent" selected={days === d} onPress={() => setDays(d)} />
        ))}
      </View>

      {discipline === 'gym' ? (
        <>
          <SectionHeader title="Experience" />
          <View style={styles.chips}>
            {(Object.keys(EXPERIENCE_LABELS) as Experience[]).map((e) => (
              <Pill
                key={e}
                label={EXPERIENCE_LABELS[e]}
                tone="accent"
                selected={experience === e}
                onPress={() => setExperience(e)}
              />
            ))}
          </View>

          <SectionHeader title="Goal" />
          <View style={styles.chips}>
            {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
              <Pill key={g} label={GOAL_LABELS[g]} tone="accent" selected={goal === g} onPress={() => setGoal(g)} />
            ))}
          </View>
        </>
      ) : null}

      {programme ? (
        <>
          <SectionHeader title={programme.splitName} />
          <Card>
            <View style={styles.statRow}>
              <StatBlock label="Days" value={String(programme.daysPerWeek)} size="small" />
              <StatBlock label="Rest" value={String(7 - programme.daysPerWeek)} size="small" />
              <StatBlock label="Sets/week" value={String(totalSets)} size="small" />
            </View>
            <Text variant="bodySmall" tone="tertiary" style={styles.note}>
              {programme.note}
            </Text>
          </Card>

          {programme.days.map((day) => (
            <ListRow
              key={day.dayIndex}
              title={`${day.weekday} · ${day.name}`}
              subtitle={
                day.slotId === null
                  ? 'Rest'
                  : day.exercises.map((e) => e.exerciseName).slice(0, 3).join(' · ')
              }
              value={day.slotId === null ? '—' : `${day.exercises.length}`}
              valueDetail={day.slotId === null ? undefined : 'moves'}
              onPress={
                day.slotId === null
                  ? undefined
                  : () => router.push(`/programme/day?slot=${day.slotId}&goal=${goal}&experience=${experience}&days=${days}`)
              }
            />
          ))}

          <SectionHeader title="Weekly volume" />
          <Card>
            {Object.entries(programme.weeklySets)
              .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
              .map(([muscle, sets]) => (
                <ListRow key={muscle} title={muscle.replace(/_/g, ' ')} value={`${sets} sets`} />
              ))}
            <Text variant="caption" tone="tertiary" style={styles.note}>
              Hard sets per muscle. Ten to twenty a week is the range the
              evidence supports — beginners nearer the bottom, because they grow
              on less and recover from less.
            </Text>
          </Card>

          <Button
            label="Build my own instead"
            variant="secondary"
            onPress={() => router.push('/programme/pick')}
            style={styles.cta}
          />
        </>
      ) : null}

      {week ? (
        <>
          <SectionHeader title={`${DISCIPLINE_LABELS[discipline]} week`} />
          <Card>
            <View style={styles.statRow}>
              <StatBlock label="Sessions" value={String(week.daysPerWeek)} size="small" />
              <StatBlock label="Hard days" value={String(week.hardDays)} size="small" />
              <StatBlock label="Time" value={formatDuration(week.totalMinutes * 60)} size="small" />
            </View>
            <Text variant="bodySmall" tone="tertiary" style={styles.note}>
              Hard days are placed first and spread as far apart as the week
              allows. Everything else fills in around them.
            </Text>
          </Card>

          {week.days.map((day) => (
            <ListRow
              key={day.dayIndex}
              title={`${day.weekday} · ${day.name ?? 'Rest'}`}
              subtitle={day.focus ?? undefined}
              value={day.minutes ? `${day.minutes}m` : '—'}
              trailing={day.hard ? <Pill label="Hard" tone="danger" /> : undefined}
            />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  chips: { flexDirection: 'row', gap: sp.sm, flexWrap: 'wrap', marginBottom: sp.sm },
  statRow: { flexDirection: 'row', gap: sp.xl },
  note: { marginTop: sp.lg },
  cta: { marginTop: sp.lg },
});
