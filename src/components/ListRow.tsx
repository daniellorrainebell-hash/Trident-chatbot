import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { colors, space, minTouchTarget } from '@/design';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Right-aligned value: a weight, a rank, a date. */
  value?: string;
  valueDetail?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Removes the divider on the final row of a group. */
  last?: boolean;
};

export function ListRow({
  title,
  subtitle,
  value,
  valueDetail,
  leading,
  trailing,
  onPress,
  last = false,
}: ListRowProps) {
  const content = (
    <View style={[styles.row, !last && styles.divider]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}

      <View style={styles.body}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {value ? (
        <View style={styles.value}>
          <Text variant="metricS">{value}</Text>
          {valueDetail ? (
            <Text variant="caption" tone="tertiary">
              {valueDetail}
            </Text>
          ) : null}
        </View>
      ) : null}

      {trailing}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}${value ? `, ${value}` : ''}`}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    minHeight: minTouchTarget,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  leading: { width: 36, alignItems: 'center' },
  body: { flex: 1 },
  value: { alignItems: 'flex-end' },
  pressed: { opacity: 0.7 },
});
