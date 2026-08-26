import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { CHROME_EDGE, chromeText, colors, radius, space, minTouchTarget } from '@/design';
import { Chrome } from './Chrome';

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
  // Chrome, alone among the tones — see design/chrome.ts. The other five are
  // flat because they are states; this one is an achievement.
  success: { bg: 'transparent', text: colors.text.inverse, border: CHROME_EDGE },
  danger: { bg: 'transparent', text: colors.text.danger, border: colors.status.danger },
  warning: { bg: 'transparent', text: colors.text.warning, border: colors.status.warning },
  live: { bg: colors.signal.dim, text: colors.text.primary, border: colors.signal.default },
};

/** A small status or filter chip. Tappable pills meet the 44pt target. */
export function Pill({ label, tone = 'neutral', selected = false, onPress, style }: PillProps) {
  const palette = toneStyles[tone];

  const chrome = tone === 'success' && !selected;

  const content = (
    <Text
      variant="overline"
      style={
        chrome
          ? chromeText
          : { color: selected ? colors.text.inverse : palette.text }
      }
    >
      {label}
    </Text>
  );

  const body = chrome ? (
    <Chrome radius={radius.pill} style={[styles.pill, styles.chromePill, onPress && styles.tappable, style]}>
      {content}
    </Chrome>
  ) : (
    <View
      style={[
        styles.pill,
        { backgroundColor: palette.bg, borderColor: palette.border },
        selected && styles.selected,
        onPress && styles.tappable,
        style,
      ]}
    >
      {content}
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
  // The gradient paints the fill, so the plate carries only its edge.
  chromePill: { borderWidth: 1, borderColor: CHROME_EDGE, justifyContent: 'center' },
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
