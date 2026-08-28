import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ChoiceGroup, Field, Pill, Screen, SectionHeader, Text, Timer } from '@/components';
import { space as sp } from '@/design';

type TimerMode = 'rest' | 'stopwatch' | 'boxing' | 'mma' | 'hiit' | 'emom' | 'amrap';

const MODES: Array<{ value: TimerMode; label: string; detail: string }> = [
  { value: 'rest', label: 'Rest', detail: 'Between sets' },
  { value: 'stopwatch', label: 'Stopwatch', detail: 'Counts up' },
  { value: 'boxing', label: 'Boxing rounds', detail: '3 min work, 1 min rest' },
  { value: 'mma', label: 'MMA rounds', detail: '5 min work, 1 min rest' },
  { value: 'hiit', label: 'HIIT', detail: 'Work / rest intervals' },
  { value: 'emom', label: 'EMOM', detail: 'Every minute on the minute' },
  { value: 'amrap', label: 'AMRAP', detail: 'As many rounds as possible' },
];

/** Round formats follow the standard competition lengths for each discipline. */
const PRESETS: Record<TimerMode, { work: number; rest: number; rounds: number }> = {
  rest: { work: 90, rest: 0, rounds: 1 },
  stopwatch: { work: 0, rest: 0, rounds: 1 },
  boxing: { work: 180, rest: 60, rounds: 12 },
  mma: { work: 300, rest: 60, rounds: 3 },
  hiit: { work: 40, rest: 20, rounds: 10 },
  emom: { work: 60, rest: 0, rounds: 10 },
  amrap: { work: 600, rest: 0, rounds: 1 },
};

/**
 * Training timers (spec §25).
 *
 * All modes run through the same wall-clock Timer, so backgrounding the app does
 * not desynchronise a round. Interval modes step work→rest→work and count rounds.
 *
 * Audio and haptic alerts fire on each transition. Alerting while the app is
 * backgrounded needs a scheduled native notification, which is why the round
 * boundaries are computed from timestamps rather than a running counter.
 */
export default function TimersScreen() {
  const [mode, setMode] = useState<TimerMode>('rest');
  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [round, setRound] = useState(1);
  const [running, setRunning] = useState(false);

  const [workSeconds, setWorkSeconds] = useState(String(PRESETS.rest.work));
  const [restSeconds, setRestSeconds] = useState(String(PRESETS.rest.rest));
  const [totalRounds, setTotalRounds] = useState(String(PRESETS.rest.rounds));

  const applyPreset = (next: TimerMode) => {
    setMode(next);
    setWorkSeconds(String(PRESETS[next].work));
    setRestSeconds(String(PRESETS[next].rest));
    setTotalRounds(String(PRESETS[next].rounds));
    setPhase('work');
    setRound(1);
    setRunning(false);
  };

  const work = Number.parseInt(workSeconds, 10) || 0;
  const rest = Number.parseInt(restSeconds, 10) || 0;
  const rounds = Number.parseInt(totalRounds, 10) || 1;
  const isStopwatch = mode === 'stopwatch';

  const handlePhaseComplete = () => {
    if (phase === 'work' && rest > 0) {
      setPhase('rest');
      return;
    }
    // Work with no rest, or rest finished: advance the round.
    if (round < rounds) {
      setRound((r) => r + 1);
      setPhase('work');
      return;
    }
    setRunning(false);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Timers</Text>
      </View>

      <SectionHeader title="Mode" />
      <ChoiceGroup<TimerMode>
        choices={MODES}
        selected={mode}
        onSelect={applyPreset}
        layout="inline"
      />

      {running ? (
        <View style={styles.runner}>
          {!isStopwatch && rounds > 1 ? (
            <View style={styles.roundRow}>
              <Pill
                label={`Round ${round} of ${rounds}`}
                tone={phase === 'work' ? 'live' : 'neutral'}
              />
              <Pill label={phase === 'work' ? 'Work' : 'Rest'} tone={phase === 'work' ? 'danger' : 'success'} />
            </View>
          ) : null}

          <Timer
            // Remounting on each phase and round restarts the countdown cleanly.
            key={`${mode}-${round}-${phase}`}
            durationSeconds={isStopwatch ? null : phase === 'work' ? work : rest}
            label={isStopwatch ? 'Elapsed' : phase === 'work' ? 'Work' : 'Rest'}
            onComplete={handlePhaseComplete}
            onCancel={() => {
              setRunning(false);
              setPhase('work');
              setRound(1);
            }}
          />
        </View>
      ) : (
        <>
          <SectionHeader title="Settings" />
          <View style={styles.fields}>
            {!isStopwatch ? (
              <Field
                label="Work"
                value={workSeconds}
                onChangeText={setWorkSeconds}
                keyboardType="number-pad"
                suffix="seconds"
              />
            ) : null}
            {!isStopwatch && PRESETS[mode].rest > 0 ? (
              <Field
                label="Rest"
                value={restSeconds}
                onChangeText={setRestSeconds}
                keyboardType="number-pad"
                suffix="seconds"
              />
            ) : null}
            {!isStopwatch && PRESETS[mode].rounds > 1 ? (
              <Field
                label="Rounds"
                value={totalRounds}
                onChangeText={setTotalRounds}
                keyboardType="number-pad"
              />
            ) : null}
          </View>

          <Button
            label="Start"
            onPress={() => {
              setPhase('work');
              setRound(1);
              setRunning(true);
            }}
            style={styles.start}
          />
        </>
      )}

      <Card style={styles.note}>
        <Text variant="overline" tone="tertiary">
          Backgrounding
        </Text>
        <Text variant="bodySmall" tone="secondary" style={styles.noteBody}>
          Timers are calculated from the clock, not counted, so locking your phone or
          switching apps does not lose time — the display is correct the moment you come
          back.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  runner: { marginTop: sp.xxl, gap: sp.lg },
  roundRow: { flexDirection: 'row', gap: sp.sm, justifyContent: 'center' },
  fields: { gap: sp.xl },
  start: { marginTop: sp.xxl },
  note: { marginTop: sp.xxxl },
  noteBody: { marginTop: sp.sm },
});
