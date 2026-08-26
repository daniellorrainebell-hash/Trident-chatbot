import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { colors } from '@/design';

/**
 * A claw rake, drawn over whatever it is placed on.
 *
 * The artwork ships white on transparent and is recoloured with tintColor, so
 * one file serves blood, bone or anything else without a second asset. The
 * marks themselves are generated rather than drawn by hand: tapered, ragged,
 * and broken where the claw skipped, which is the part that separates a scratch
 * from a stripe.
 *
 * Always decorative. It is never the thing a screen is about, so it is hidden
 * from screen readers and never intercepts a tap.
 */
export type ClawMarkVariant = 'rake' | 'rake4' | 'slash' | 'corner';

const ART: Record<ClawMarkVariant, { source: number; width: number; height: number }> = {
  rake: { source: require('../../assets/brand/marks/claw-rake.png'), width: 760, height: 900 },
  rake4: { source: require('../../assets/brand/marks/claw-rake-4.png'), width: 880, height: 900 },
  slash: { source: require('../../assets/brand/marks/claw-slash.png'), width: 920, height: 400 },
  corner: { source: require('../../assets/brand/marks/claw-corner.png'), width: 600, height: 600 },
};

export type ClawMarkProps = {
  variant?: ClawMarkVariant;
  /** Width in points; height follows the artwork. */
  size?: number;
  color?: string;
  opacity?: number;
  /** Degrees. The marks are drawn raking down-left, so positive turns clockwise. */
  rotate?: number;
  flip?: boolean;
  style?: StyleProp<ImageStyle>;
};

export function ClawMark({
  variant = 'rake',
  size = 200,
  color = colors.brand.edge,
  opacity = 1,
  rotate = 0,
  flip = false,
  style,
}: ClawMarkProps) {
  const art = ART[variant];

  return (
    <Image
      source={art.source}
      style={[
        {
          width: size,
          height: size * (art.height / art.width),
          opacity,
          transform: [{ rotate: `${rotate}deg` }, { scaleX: flip ? -1 : 1 }],
        },
        styles.base,
        style,
      ]}
      resizeMode="contain"
      tintColor={color}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  // Decorative and inert: it must never sit between a thumb and a button.
  base: { position: 'absolute', pointerEvents: 'none' },
});
