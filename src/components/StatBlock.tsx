import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, space } from '@/design';
import type { TypeToken } from '@/design';

export type StatBlockProps = {
  label: string;
  value: string;
  unit?: string;
  /** Small print under the value: a delta, a target, a date. */
  detail?: string;
  size?: 'xl' | 'large' | 'medium' | 'small';
  tone?: 'primary' | 'accent' | 'success' | 'danger' | 'warning';
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
};

const valueVariant: Record<NonNullable<StatBlockProps['size']>, TypeToken> = {
  xl: 'metricXL',
  large: 'metricL',
  medium: 'metricM',
  small: 'metricS',
};

/**
 * A labelled number.
 *
 * The label sits above the value and the value is the loud part — the spec asks
 * for strong large numerals, and a stat someone reads mid-set with a phone on a
 * bench has to survive being glanced at, not studied.
 */
export function StatBlock({
  label,
  value,
  unit,
  detail,
  size = 'medium',
  tone = 'primary',
  align = 'left',
  style,
}: StatBlockProps) {
  return (
    <View
      style={[align === 'center' && styles.center, style]}
      accessible
      accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}${detail ? `. ${detail}` : ''}`}
    >
      <Text variant="overline" tone="tertiary" center={align === 'center'}>
        {label}
      </Text>
      <View style={[styles.valueRow, align === 'center' && styles.centerRow]}>
        <Text variant={valueVariant[size]} tone={tone}>
          {value}
        </Text>
        {unit ? (
          <Text variant="bodySmall" tone="tertiary" style={styles.unit}>
            {unit}
          </Text>
        ) : null}
      </View>
      {detail ? (
        <Text variant="caption" tone="tertiary" center={align === 'center'}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  centerRow: { justifyContent: 'center' },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.xs,
    marginTop: space.xxs,
  },
  unit: { color: colors.text.tertiary },
});
