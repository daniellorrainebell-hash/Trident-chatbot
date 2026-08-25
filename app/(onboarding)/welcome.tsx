import { Image, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen, Text } from '@/components';
import { space as sp } from '@/design';

/**
 * Welcome (spec §79).
 *
 * The wordmark gets one screen — the launch splash stays fast and does not force
 * a brand animation on every cold start.
 */
export default function WelcomeScreen() {
  return (
    <Screen
      scroll={false}
      edges={['top', 'bottom']}
      footer={
        <View style={styles.actions}>
          <Button label="Create account" onPress={() => router.push('/(onboarding)/consent')} />
          <Button
            label="I already have an account"
            variant="ghost"
            onPress={() => router.replace('/kennel')}
          />
        </View>
      }
    >
      <View style={styles.container}>
        <Image
          source={require('../../assets/brand/rabid-mark.png')}
          style={styles.mark}
          resizeMode="contain"
          accessibilityLabel="Rabid Gymwear"
        />

        <View style={styles.copy}>
          <Text variant="brand" center>
            Rabid: The Kennel
          </Text>
          <Text variant="body" tone="secondary" center style={styles.tagline}>
            You do not get credit for intentions. Only the work counts.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: sp.massive },
  mark: { width: 200, height: 200 },
  copy: { gap: sp.lg, alignItems: 'center' },
  tagline: { maxWidth: 300 },
  actions: { gap: sp.sm },
});
