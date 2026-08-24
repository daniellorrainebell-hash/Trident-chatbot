import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { colors, radius, space, border, minTouchTarget, fontFamily } from '@/design';
import type { SetMetric, WorkoutSet } from '@/types';

export type SetRowProps = {
  set: WorkoutSet;
  metric: SetMetric;
  /** The same set from the last time this exercise was trained, if any. */
  previous?: { weightKg: number | null; reps: number | null } | null;
  onChange(patch: Partial<WorkoutSet>): void;
  onToggleComplete(): void;
  onToggleWarmup(): void;
};

/**
 * One logged set.
 *
 * This row is tapped more than anything else in the app, so it is built around
 * two ideas the spec makes central (§12, §85):
 *
 *   - The tick is the biggest target in the row. Completing a set is the single
 *     most frequent action, done mid-effort, often with one hand.
 *   - The previous session's numbers sit behind the inputs as placeholders.
 *     Most sets repeat, so showing last time turns typing into confirming.
 *
 * Inputs are uncontrolled-by-value only on blur-safe fields; numeric text is
 * parsed permissively because a half-typed "12." must not clear the field.
 */
function SetRowComponent({
  set,
  metric,
  previous,
  onChange,
  onToggleComplete,
  onToggleWarmup,
}: SetRowProps) {
  const handleToggle = useCallback(() => {
    void Haptics.impactAsync(
      set.completed ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    );
    onToggleComplete();
  }, [onToggleComplete, set.completed]);

  const showWeight = metric === 'weight_reps' || metric === 'weighted_reps';
  const showReps = metric === 'weight_reps' || metric === 'weighted_reps' || metric === 'reps';
  const showDuration = metric === 'duration' || metric === 'distance_time';
  const showDistance = metric === 'distance' || metric === 'distance_time';
  const showRounds = metric === 'rounds';

  return (
    <View
      style={[
        styles.row,
        set.completed && styles.completed,
        set.isWarmup && styles.warmup,
      ]}
    >
      <Pressable
        onPress={onToggleWarmup}
        style={styles.index}
        accessibilityRole="button"
        accessibilityLabel={
          set.isWarmup ? `Warm-up set ${set.index}` : `Working set ${set.index}`
        }
        accessibilityHint="Toggles warm-up"
      >
        <Text variant="metricS" tone={set.isWarmup ? 'tertiary' : 'secondary'}>
          {set.isWarmup ? 'W' : set.index}
        </Text>
      </Pressable>

      {showWeight ? (
        <NumberField
          value={set.weightKg}
          placeholder={previous?.weightKg != null ? String(previous.weightKg) : '—'}
          suffix="kg"
          label={`Set ${set.index} weight in kilograms`}
          onChangeNumber={(weightKg) => onChange({ weightKg })}
        />
      ) : null}

      {showReps ? (
        <NumberField
          value={set.reps}
          placeholder={previous?.reps != null ? String(previous.reps) : '—'}
          suffix="reps"
          label={`Set ${set.index} repetitions`}
          onChangeNumber={(reps) => onChange({ reps })}
        />
      ) : null}

      {showDistance ? (
        <NumberField
          value={set.distanceMeters != null ? set.distanceMeters / 1000 : null}
          placeholder="—"
          suffix="km"
          label={`Set ${set.index} distance in kilometres`}
          onChangeNumber={(km) => onChange({ distanceMeters: km == null ? null : km * 1000 })}
        />
      ) : null}

      {showDuration ? (
        <NumberField
          value={set.durationSeconds != null ? Math.round(set.durationSeconds / 60) : null}
          placeholder="—"
          suffix="min"
          label={`Set ${set.index} duration in minutes`}
          onChangeNumber={(mins) => onChange({ durationSeconds: mins == null ? null : mins * 60 })}
        />
      ) : null}

      {showRounds ? (
        <NumberField
          value={set.rounds}
          placeholder="—"
          suffix="rounds"
          label={`Set ${set.index} rounds`}
          onChangeNumber={(rounds) => onChange({ rounds })}
        />
      ) : null}

      <Pressable
        onPress={handleToggle}
        style={[styles.tick, set.completed && styles.tickDone]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: set.completed }}
        accessibilityLabel={`Mark set ${set.index} ${set.completed ? 'incomplete' : 'complete'}`}
      >
        <Text
          variant="metricS"
          tone={set.completed ? 'inverse' : 'tertiary'}
        >
          {set.completed ? '✓' : '○'}
        </Text>
      </Pressable>
    </View>
  );
}

type NumberFieldProps = {
  value: number | null;
  placeholder: string;
  suffix: string;
  label: string;
  onChangeNumber(value: number | null): void;
};

function NumberField({ value, placeholder, suffix, label, onChangeNumber }: NumberFieldProps) {
  const handleChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^0-9.]/g, '');
      if (cleaned === '') {
        onChangeNumber(null);
        return;
      }
      const parsed = Number.parseFloat(cleaned);
      // A trailing "." parses fine; NaN only appears for genuinely empty input.
      if (!Number.isNaN(parsed)) onChangeNumber(parsed);
    },
    [onChangeNumber],
  );

  return (
    <View style={styles.field}>
      <TextInput
        value={value != null ? String(value) : ''}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.text.disabled}
        keyboardType="decimal-pad"
        returnKeyType="done"
        selectTextOnFocus
        style={styles.input}
        accessibilityLabel={label}
      />
      <Text variant="caption" tone="tertiary">
        {suffix}
      </Text>
    </View>
  );
}

/**
 * Memoised: an active workout can hold 30+ set rows, and re-rendering all of
 * them on every keystroke is what makes a logger feel sluggish.
 */
export const SetRow = memo(SetRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    borderLeftWidth: border.marker,
    borderLeftColor: 'transparent',
  },
  completed: {
    backgroundColor: colors.bg.panel,
    borderLeftColor: colors.status.success,
  },
  warmup: { opacity: 0.72 },
  index: {
    width: 32,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.xs,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.sm,
    paddingHorizontal: space.sm,
    minHeight: minTouchTarget,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontFamily: fontFamily.display,
    fontSize: 19,
    paddingVertical: space.sm,
  },
  tick: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.bg.elevated,
  },
  tickDone: { backgroundColor: colors.status.success },
});
