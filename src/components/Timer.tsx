import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { Button } from './Button';
import { colors, radius, space } from '@/design';
import { formatClock } from '@/utils/format';

export type TimerProps = {
  /** Countdown target in seconds. Null runs a stopwatch instead. */
  durationSeconds: number | null;
  onComplete?: () => void;
  onCancel?: () => void;
  label?: string;
  autoStart?: boolean;
};

/**
 * Rest and round timer.
 *
 * Time is derived from wall-clock deltas rather than counted with an interval.
 * A JS interval stops firing when the app is backgrounded or the screen locks,
 * so an interval-counted timer silently loses time — and someone resting 90
 * seconds between heavy sets needs 90 seconds, not "however long the app stayed
 * awake for". Recomputing from a start timestamp means the timer is correct the
 * instant the app comes back (spec §25).
 *
 * A native scheduled notification is still needed to alert while backgrounded;
 * this component owns the foreground display.
 */
export function Timer({
  durationSeconds,
  onComplete,
  onCancel,
  label,
  autoStart = true,
}: TimerProps) {
  const [running, setRunning] = useState(autoStart);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!running) return;

    // Stamp the start here rather than in the ref initialiser. Reading the
    // clock during render is a fresh value on every re-render that React is
    // free to discard, and it blocks the component from being compiled.
    if (startedAt.current == null) startedAt.current = Date.now();

    const tick = () => {
      if (startedAt.current == null) return;
      const seconds = (Date.now() - startedAt.current) / 1000;
      setElapsed(seconds);

      if (durationSeconds != null && seconds >= durationSeconds && !fired.current) {
        fired.current = true;
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRunning(false);
        onComplete?.();
      }
    };

    const interval = setInterval(tick, 200);

    // Recompute immediately on resume, so backgrounded time is accounted for.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [running, durationSeconds, onComplete]);

  const remaining =
    durationSeconds != null ? Math.max(0, durationSeconds - elapsed) : elapsed;
  const finished = durationSeconds != null && remaining <= 0;

  return (
    <View style={[styles.container, finished && styles.finished]}>
      {label ? (
        <Text variant="overline" tone="tertiary" center>
          {label}
        </Text>
      ) : null}

      <Text
        variant="metricXL"
        center
        tone={finished ? 'success' : 'primary'}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${formatClock(remaining)} ${durationSeconds != null ? 'remaining' : 'elapsed'}`}
      >
        {formatClock(remaining)}
      </Text>

      <View style={styles.actions}>
        <Button
          label={running ? 'Pause' : finished ? 'Done' : 'Start'}
          size="small"
          variant="secondary"
          onPress={() => {
            if (finished) {
              onCancel?.();
              return;
            }
            if (running) {
              setRunning(false);
            } else {
              // Resume from where it paused rather than restarting.
              startedAt.current = Date.now() - elapsed * 1000;
              setRunning(true);
            }
          }}
        />
        {onCancel ? (
          <Button label="Skip" size="small" variant="ghost" onPress={onCancel} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.panel,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: space.lg,
    gap: space.sm,
  },
  finished: { borderColor: colors.status.success },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: space.md },
});
