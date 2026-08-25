import { Image, StyleSheet, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components';
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

      <View style={styles.stage}>
        <Image
          source={require('../assets/brand/advisory.png')}
          style={styles.advisory}
          resizeMode="contain"
          accessible={false}
        />
        <Image
          source={require('../assets/brand/figure.png')}
          style={styles.figure}
          resizeMode="contain"
          accessible={false}
        />
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

  mark: { alignItems: 'center', paddingTop: sp.lg },
  wordmark: { width: 104, height: 105 },

  // The figure sits over the advisory rather than beside it.
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  advisory: { position: 'absolute', width: '104%', height: undefined, aspectRatio: 1200 / 919 },
  figure: { width: '62%', height: '100%' },

  type: { alignItems: 'center', paddingBottom: sp.xl },
  brandLine: { letterSpacing: 3.4 },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 46,
    lineHeight: 52,
    letterSpacing: 1,
    color: colors.text.primary,
    textTransform: 'uppercase',
    marginTop: sp.sm,
  },
  creed: { letterSpacing: 3.4, marginTop: sp.md },

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
