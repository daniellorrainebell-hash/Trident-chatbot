import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Screen, Text } from '@/components';
import { space as sp } from '@/design';
import { useUserStore, NUTRITION_DISCLAIMER_VERSION } from '@/store/userStore';

/**
 * Nutrition disclaimer.
 *
 * Explicit acceptance before the first plan, with the accepted *version*
 * recorded so a later revision can re-prompt precisely the people who accepted
 * an older one.
 *
 * Kept short on purpose. A wall of hedging gets scrolled past; six plain
 * paragraphs get read.
 */
const PARAGRAPHS = [
  "The Kennel's nutrition features are for general fitness and educational purposes. They are not medical advice and are not a substitute for advice from a doctor or registered dietitian.",
  "Your calorie and macro targets are estimates worked out from the information you give us. Everyone's energy needs are different, and results vary — nothing here is a guarantee of how much fat you will lose or muscle you will gain.",
  "The Kennel will never cut you more than 500 calories below your estimated maintenance. Ask for a faster result and it moves the date, not the deficit.",
  "Do not use the planner if you are under 18, pregnant or breastfeeding, or if you have an eating disorder or a history of disordered eating. If you have a medical condition, take medication, or have a dietary requirement that affects what you need to eat, speak to a professional first.",
  "Stop and get proper advice if you feel unwell or if the plan does not seem right for you.",
  "Using the planner means you accept these are estimates, and that deciding whether a plan suits you is your call.",
];

export default function DisclaimerScreen() {
  const acceptConsent = useUserStore((s) => s.acceptConsent);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  return (
    <Screen
      footer={
        <>
          <Button
            label="I understand and accept"
            onPress={() => {
              acceptConsent(true);
              router.replace('/feed/profile');
            }}
            disabled={!scrolledToEnd}
          />
          {!scrolledToEnd ? (
            <Text variant="caption" tone="tertiary" center style={styles.scrollHint}>
              Read to the end to continue.
            </Text>
          ) : null}
        </>
      }
    >
      <View style={styles.header}>
        <Button label="← Back" size="small" variant="ghost" onPress={() => router.back()} />
        <Text variant="h1">Before you start</Text>
        <Text variant="body" tone="tertiary">
          Version {NUTRITION_DISCLAIMER_VERSION}
        </Text>
      </View>

      <Card>
        {PARAGRAPHS.map((paragraph, i) => (
          <Text
            key={i}
            variant="legal"
            tone="secondary"
            style={i > 0 ? styles.paragraph : undefined}
            onLayout={i === PARAGRAPHS.length - 1 ? () => setScrolledToEnd(true) : undefined}
          >
            {paragraph}
          </Text>
        ))}
      </Card>

      <Text variant="legal" tone="tertiary" style={styles.note}>
        If any of the exclusions above apply to you, the automated planner will not
        generate a plan. The rest of The Kennel — training, Contracts, Packs and your
        record — remains fully available.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.sm, marginBottom: sp.lg, gap: sp.xs, alignItems: 'flex-start' },
  paragraph: { marginTop: sp.lg },
  note: { marginTop: sp.xl },
  scrollHint: { marginTop: sp.sm },
});
