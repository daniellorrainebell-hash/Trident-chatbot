import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { RabidLevel } from '@/types';

/**
 * The rank artwork — one dog per rung of the ladder.
 *
 * The five pieces are the same animal at five stages of the same story: STRAY
 * cowers, MUTT lifts its head, HOUND squares up, FERAL braces, RABID bares its
 * teeth. Each has its rank cut out of its body, so the badge names itself and
 * needs no caption to be read across a room.
 *
 * They are drawn at genuinely different proportions — STRAY is low and wide,
 * FERAL is tall — so sizing by width alone would make the ladder lurch as a
 * user climbs it. Every dog is fitted inside the same square instead: the frame
 * is constant, the animal fills as much of it as its own shape allows, and the
 * lettering inside the body never stretches.
 */
const ARTWORK: Record<RabidLevel, { source: number; width: number; height: number }> = {
  stray: { source: require('../../assets/brand/ranks/stray.png'), width: 1065, height: 848 },
  mutt: { source: require('../../assets/brand/ranks/mutt.png'), width: 866, height: 946 },
  hound: { source: require('../../assets/brand/ranks/hound.png'), width: 860, height: 1115 },
  feral: { source: require('../../assets/brand/ranks/feral.png'), width: 1100, height: 1503 },
  // The only rank with colour in it. RABID bleeds; the other four are grey
  // plus alpha, so this one ships RGBA or the blood is silently thrown away.
  rabid: { source: require('../../assets/brand/ranks/rabid.png'), width: 1043, height: 1198 },
};

export type RankDogProps = {
  level: RabidLevel;
  /** Side of the square the dog is fitted into. */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function RankDog({ level, size = 120, style }: RankDogProps) {
  const art = ARTWORK[level];
  const scale = Math.min(size / art.width, size / art.height);

  return (
    <View style={[{ width: size, height: size }, styles.frame, style]}>
      <Image
        source={art.source}
        style={{ width: art.width * scale, height: art.height * scale }}
        resizeMode="contain"
        accessible
        accessibilityRole="image"
        accessibilityLabel={level.toUpperCase()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
});
