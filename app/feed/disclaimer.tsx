import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Screen, Text } from '@/components';
import { space as sp } from '@/design';
import { useUserStore, NUTRITION_DISCLAIMER_VERSION } from '@/store/userStore';

/**
 * Nutrition disclaimer (spec §34).
 *
 * Explicit acceptance is required before the first automated plan, and the
 * accepted *version* is recorded so a revision can re-prompt precisely.
 *
 * The wording below is the spec's draft product copy. Spec §34 is explicit that
 * it is not final legal advice and must be reviewed by a UK solicitor and a
 * qualified nutrition professional before public release.
 */
const PARAGRAPHS = [
  "The Kennel nutrition and meal-planning features are provided for general fitness, educational and informational purposes only. They are not medical advice, diagnosis, treatment or a substitute for advice from a doctor, registered dietitian or other appropriately qualified healthcare professional.",
  "Calorie, macronutrient, weight-change and timeframe calculations are estimates based on the information you provide. Individual energy requirements, body composition changes and results vary and cannot be guaranteed.",
  "The Kennel applies limits to automated calorie and weight-change recommendations and will not intentionally generate plans outside its supported ranges. These safeguards do not mean that a particular plan is suitable or safe for every individual.",
  "Do not use the automated nutrition planner if you are under 18, pregnant or breastfeeding, have an eating disorder or history of disordered eating, or have a medical condition, medication or dietary requirement that may affect your nutritional needs without first obtaining advice from an appropriately qualified healthcare professional.",
  "Stop using the plan and seek appropriate professional advice if you experience concerning symptoms or believe the recommendations are unsuitable for you.",
  "By using the nutrition-planning features, you acknowledge that the results are estimates and that you remain responsible for deciding whether the recommendations are appropriate for your individual circumstances.",
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
