import type { StyleProp, ViewStyle } from 'react-native';
import { RankDog } from './RankDog';

export type RabidDogProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The brand dog, as used for decoration rather than as a rank badge.
 *
 * It is FERAL's artwork — the middle of the ladder, and the piece the brand
 * itself is built on. Kept as its own component so brand furniture does not
 * read as a claim about the user's rank; for that, use RankDog directly.
 */
export function RabidDog({ size = 120, style }: RabidDogProps) {
  return <RankDog level="feral" size={size} style={style} />;
}
