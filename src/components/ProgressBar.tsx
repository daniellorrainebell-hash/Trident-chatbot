import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, radius, space } from '@/design';

export type ProgressBarProps = {
  /** 0–1. Clamped, so an over-delivered Contract shows a full bar, not an overflow. */
  fraction: number;
  tone?: 'default' | 'success' | 'danger' | 'warning';
  label?: string;
  /** Right-aligned value beside the label, e.g. "11 / 16". */
  value?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

const toneColors = {
  default: colors.text.primary,
  success: colors.status.successBright,
  danger: colors.status.dangerBright,
  warning: colors.status.warningBright,
};

/**
 * Status is never carried by colour alone (spec §73) — the bar always has a text
 * label or value beside it, so a red bar and a green bar are still distinguishable
 * to someone who cannot tell them apart.
 */
export function ProgressBar({
  fraction,
  tone = 'default',
  label,
  value,
  height = 6,
  style,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, fraction));
  const percent = Math.round(clamped * 100);

  return (
    <View style={style}>
      {label || value ? (
        <View style={styles.header}>
          {label ? (
            <Text variant="overline" tone="tertiary">
              {label}
            </Text>
          ) : null}
          {value ? (
            <Text variant="bodySmall" tone="secondary">
              {value}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View
        style={[styles.track, { height, borderRadius: height / 2 }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        accessibilityLabel={label}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${percent}%`,
              backgroundColor: toneColors[tone],
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: space.sm,
  },
  track: { backgroundColor: colors.bg.elevated, overflow: 'hidden' },
  fill: { height: '100%' },
});
