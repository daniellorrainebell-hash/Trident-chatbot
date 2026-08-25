import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';
import { colors, space as sp } from '@/design';

export type BrandMarkProps = {
  /** hero = home screen and splash; compact = navigation headers. */
  size?: 'hero' | 'compact';
  /** The wordmark alone, without "THE KENNEL" beneath it. */
  hideSubmark?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * The Rabid mark.
 *
 * The supplied artwork is white on transparent, so it sits directly on the app's
 * near-black surfaces with nothing behind it — no plate, no container, no tint.
 * That is the whole point of the asset and why it is not recoloured here.
 *
 * "THE KENNEL" is set beneath in the display face rather than being part of the
 * artwork, so it stays crisp at every size and can be dropped where the mark
 * alone is enough (spec §58: the full wordmark never goes into a small icon).
 */
export function BrandMark({ size = 'hero', hideSubmark = false, style }: BrandMarkProps) {
  const hero = size === 'hero';

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Rabid — The Kennel"
    >
      <Image
        source={require('../../assets/brand/rabid-wordmark.png')}
        style={hero ? styles.heroMark : styles.compactMark}
        resizeMode="contain"
        // Decorative: the container above already carries the label.
        accessible={false}
      />

      {hideSubmark ? null : (
        <View style={hero ? styles.heroSub : styles.compactSub}>
          <View style={styles.rule} />
          <Text
            variant={hero ? 'h3' : 'overline'}
            style={hero ? styles.heroSubText : undefined}
          >
            The Kennel
          </Text>
          <View style={styles.rule} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },

  // Sized by height so the mark's own proportions drive the layout.
  heroMark: { width: 208, height: 206 },
  compactMark: { width: 84, height: 83 },

  heroSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.md,
    marginTop: sp.md,
    alignSelf: 'stretch',
  },
  compactSub: { flexDirection: 'row', alignItems: 'center', gap: sp.sm, marginTop: sp.xs },

  // Steel hairlines running out from the wordmark, so it reads as a plate.
  rule: { flex: 1, height: 1, backgroundColor: colors.border.default },
  heroSubText: { letterSpacing: 3 },
});
