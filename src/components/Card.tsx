import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, space, border } from '@/design';

export type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  /** A left rule in a signal colour, for live or failed state. */
  marker?: 'none' | 'live' | 'success' | 'danger' | 'warning';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Depth on near-black comes from surface lightness and a hairline border, not
 * shadow — a drop shadow over #0C0C0E just reads as mud.
 */
export function Card({
  children,
  onPress,
  marker = 'none',
  padded = true,
  style,
  accessibilityLabel,
}: CardProps) {
  const content = (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        marker !== 'none' && styles.markerBase,
        marker !== 'none' && { borderLeftColor: markerColors[marker] },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const markerColors: Record<string, string> = {
  live: colors.signal.bright,
  success: colors.status.success,
  danger: colors.status.danger,
  warning: colors.status.warning,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.raised,
    borderRadius: radius.lg,
    borderWidth: border.hairline,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
  },
  padded: { padding: space.lg },
  markerBase: { borderLeftWidth: border.marker },
  pressed: { opacity: 0.85 },
});
