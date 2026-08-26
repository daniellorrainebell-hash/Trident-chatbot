import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, radius, space, minTouchTarget } from '@/design';

export type PillTone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'live';

export type PillProps = {
  label: string;
  tone?: PillTone;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const toneStyles: Record<PillTone, { bg: string; text: string; border: string }> = {
  neutral: { bg: colors.bg.elevated, text: colors.text.secondary, border: colors.border.default },
  accent: { bg: colors.bg.elevated, text: colors.text.accent, border: colors.accent.steelDim },
  // Filled, alone among the tones. Done is the loudest thing in its row;
  // everything else states its case with an outline.
  success: { bg: colors.status.success, text: colors.text.inverse, border: colors.status.success },
  danger: { bg: 'transparent', text: colors.text.danger, border: colors.status.danger },
  warning: { bg: 'transparent', text: colors.text.warning, border: colors.status.warning },
  live: { bg: colors.signal.dim, text: colors.text.primary, border: colors.signal.default },
};

/** A small status or filter chip. Tappable pills meet the 44pt target. */
export function Pill({ label, tone = 'neutral', selected = false, onPress, style }: PillProps) {
  const palette = toneStyles[tone];

  const body = (
    <View
      style={[
        styles.pill,
        { backgroundColor: palette.bg, borderColor: palette.border },
        selected && styles.selected,
        onPress && styles.tappable,
        style,
      ]}
    >
      <Text
        variant="overline"
        style={{ color: selected ? colors.text.inverse : palette.text }}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  tappable: { minHeight: minTouchTarget, justifyContent: 'center' },
  selected: { backgroundColor: colors.text.primary, borderColor: colors.text.primary },
  pressed: { opacity: 0.7 },
});
