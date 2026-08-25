import { Image, StyleSheet, type StyleProp, type ImageStyle } from 'react-native';

export type RabidDogProps = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * The Rabid dog — the brand's FERAL artwork.
 *
 * A standing dog with FERAL cut out of its body, white on transparent, so it
 * drops onto any of the app's dark surfaces with nothing behind it.
 *
 * Sized by width with the aspect ratio locked to the source, because the
 * lettering inside the body distorts the moment the proportions slip.
 *
 * Used sparingly and only where it earns the moment: a broken record, a level
 * gained. It is the brand's teeth, not a decoration.
 */
export function RabidDog({ size = 120, style }: RabidDogProps) {
  return (
    <Image
      source={require('../../assets/brand/rabid-dog.png')}
      style={[{ width: size, height: size * (1503 / 1100) }, styles.base, style]}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel="Rabid"
    />
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: 'center' },
});
