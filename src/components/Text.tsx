import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, type as typeTokens, type TypeToken } from '@/design';

type Tone = 'primary' | 'secondary' | 'tertiary' | 'disabled' | 'inverse' | 'accent' | 'danger' | 'success' | 'warning';

export type TextProps = RNTextProps & {
  variant?: TypeToken;
  tone?: Tone;
  /** Centre is common enough in this UI to earn a prop. */
  center?: boolean;
};

/**
 * The only text primitive in the app.
 *
 * Nothing else sets fontFamily, fontSize or color directly — that is what keeps
 * the type system a system rather than a suggestion, and it is also what makes
 * a later font swap a one-file change.
 *
 * `allowFontScaling` stays on so the OS text-size setting is respected (spec §73).
 */
export function Text({
  variant = 'body',
  tone = 'primary',
  center,
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      {...props}
      allowFontScaling
      style={[
        typeTokens[variant],
        { color: colors.text[tone] },
        center && styles.center,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
