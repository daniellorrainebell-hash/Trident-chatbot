import { Image, StyleSheet, type StyleProp, type ImageStyle } from 'react-native';

export type RabidDogProps = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

/**
 * The Rabid dog.
 *
 * Snarling head, white on transparent with red eyes, so it drops onto any of
 * the app's dark surfaces with nothing behind it. Angular stencil work rather
 * than illustration — it holds up at 76px on a profile screen as readily as it
 * does full-bleed on the splash.
 *
 * Used sparingly and only where it earns the moment: launch, a broken record,
 * a level gained. It is the brand's teeth, not a decoration.
 */
export function RabidDog({ size = 120, style }: RabidDogProps) {
  return (
    <Image
      source={require('../../assets/brand/rabid-dog.png')}
      style={[{ width: size, height: size * (1072 / 900) }, styles.base, style]}
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
