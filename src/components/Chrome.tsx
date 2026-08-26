import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CHROME_END, CHROME_LOCATIONS, CHROME_START, CHROME_STOPS,
} from '@/design';

export type ChromeProps = {
  children?: ReactNode;
  /** Matches the radius of whatever it is filling. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A chrome plate to sit behind content.
 *
 * Only worth using where there is enough surface for the highlight, shadow and
 * highlight to actually land — a chip, a tick, a badge. On a six-pixel progress
 * bar the ramp compresses into a single flat grey, which is worse than plain
 * bone because it looks like an accident rather than a decision.
 */
export function Chrome({ children, radius = 999, style }: ChromeProps) {
  return (
    <View style={[{ borderRadius: radius }, styles.clip, style]}>
      <LinearGradient
        colors={[...CHROME_STOPS]}
        locations={[...CHROME_LOCATIONS]}
        start={CHROME_START}
        end={CHROME_END}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
