import { Image, StyleSheet, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClawMark, Text } from '@/components';
import { colors, space as sp, radius } from '@/design';

/**
 * ENTER THE KENNEL — the landing screen.
 *
 * Built to the supplied art direction: the advisory plate sits behind, the
 * figure stands in front of it, and the type stack runs beneath. Everything is
 * white on black — the artwork is all white-on-transparent, so nothing needs a
 * plate or a tint behind it.
 *
 * The figure overlaps the advisory deliberately. Two flat graphics stacked with
 * a gap read as a slide; overlapping them makes one image with depth, which is
 * the difference between a poster and a layout.
 */
export default function EnterScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.gapAbove} />

      <View style={styles.mark}>
        <Image
          source={require('../assets/brand/rabid-wordmark.png')}
          style={styles.wordmark}
          resizeMode="contain"
          accessible
          accessibilityRole="image"
          accessibilityLabel="Rabid Gymwear"
        />
      </View>

      <View style={styles.gapBelow} />

      <View style={styles.stage}>
        <View style={styles.advisory}>
          <Image
            source={require('../assets/brand/advisory.png')}
            style={styles.fill}
            resizeMode="contain"
            accessible={false}
          />
        </View>
        <Image
          source={require('../assets/brand/figure.png')}
          style={styles.fill}
          resizeMode="contain"
          accessible={false}
        />

        {/* Raked over the plate and the figure both, so it reads as damage to
            the poster rather than as a graphic sitting beside it. */}
        <ClawMark variant="rake" size={300} rotate={14} style={styles.claw} />
      </View>

      <View style={styles.type}>
        <Text variant="overline" tone="tertiary" style={styles.brandLine}>
          Rabid Gymwear
        </Text>
        <Text style={styles.title} accessibilityRole="header">
          The Kennel
        </Text>
        <Text variant="overline" tone="tertiary" style={styles.creed}>
          We are the feral.
        </Text>
      </View>

      <Pressable
        onPress={() => router.replace('/kennel')}
        accessibilityRole="button"
        accessibilityLabel="Enter The Kennel"
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
      >
        <Text style={styles.ctaLabel}>Enter The Kennel</Text>
        <Text style={styles.ctaChevron}>›</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000', paddingHorizontal: sp.xl },

  // Two identical flexible gaps, one above the mark and one below it.
  //
  // The stage underneath is sized to the artwork rather than filling the screen,
  // so all the leftover height pools in these two spacers and nowhere else. That
  // keeps the space above the wordmark equal to the space between it and the top
  // of his head at any screen height, with no number to keep re-measuring.
  //
  // The mark is the loud thing on this screen, so the height it takes is bought
  // from the figure rather than from that air: making it bigger without giving
  // the stage back some room would just squeeze the gaps and push it up again.
  gapAbove: { flex: 1 },
  gapBelow: { flex: 1 },

  mark: { alignItems: 'center' },
  wordmark: { width: 176, height: 175 },

  // The figure sits over the advisory rather than beside it.
  //
  // The aspect ratios live on plain Views, not on the Images. An Image carries
  // the intrinsic pixel height of its source, and an explicit height beats an
  // aspect ratio every time - so a ratio set directly on the artwork silently
  // did nothing and the figure laid out 1847px tall. A View has no size of its
  // own, so the ratio is the only thing deciding its height.
  //
  // The point of doing it this way: the stage is exactly as tall as the figure,
  // with no letterboxing inside it. That keeps the empty space on this screen in
  // the two spacers above, where it can be shared evenly, instead of hiding a
  // band above his head that nothing else can see.
  stage: {
    width: '52%',
    aspectRatio: 1000 / 1847,
    // The stage used to stretch the full width and centre its contents. Now it
    // is only as wide as the figure, so it has to centre itself - a column's
    // default stretch leaves an explicitly sized child pinned to the left edge.
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  // 104% of the full content width, expressed against the narrower stage.
  advisory: { position: 'absolute', width: '199%', aspectRatio: 1200 / 919 },
  fill: { width: '100%', height: '100%' },
  claw: { top: '-6%', right: '-58%' },

  // alignItems centres each line of type as a block, but a block is only as
  // wide as its longest line - so the moment THE KENNEL wraps, THE sits at the
  // left edge of a box the width of KENNEL and the whole stack reads
  // left-heavy. textAlign centres the lines within the block as well, which is
  // what actually keeps a stacked title on the centre line.
  type: { alignItems: 'center', paddingBottom: sp.xl },
  brandLine: { letterSpacing: 3.4, textAlign: 'center' },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 46,
    lineHeight: 52,
    letterSpacing: 1,
    color: colors.text.primary,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: sp.sm,
  },
  creed: { letterSpacing: 3.4, textAlign: 'center', marginTop: sp.md },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.md,
    backgroundColor: '#C9C9C9',
    borderRadius: radius.lg,
    paddingVertical: sp.xl,
    marginBottom: sp.xl,
  },
  ctaPressed: { backgroundColor: '#AFAFAF' },
  ctaLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    color: '#000000',
  },
  ctaChevron: { fontSize: 19, color: '#000000', marginTop: -2 },
});
