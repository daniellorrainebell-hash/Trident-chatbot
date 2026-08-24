import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Screen, SectionHeader, Text } from '@/components';
import { colors, radius, space as sp, minTouchTarget } from '@/design';
import { useUserStore, TERMS_VERSION, PRIVACY_VERSION } from '@/store/userStore';

/**
 * Age gate and consent (spec §8).
 *
 * Each acceptance is separate and each records the document version it applied
 * to, so a later revision can re-prompt precisely rather than asking everyone
 * again. The nutrition disclaimer is deliberately *not* here — it is taken at the
 * point of first use, where it is actually relevant (spec §34).
 */
export default function ConsentScreen() {
  const acceptConsent = useUserStore((s) => s.acceptConsent);

  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const canContinue = ageConfirmed && termsAccepted && privacyAccepted;

  return (
    <Screen
      footer={
        <Button
          label="Continue"
          onPress={() => {
            acceptConsent(false);
            router.push('/(onboarding)/profile');
          }}
          disabled={!canContinue}
        />
      }
    >
      <View style={styles.header}>
        <Text variant="h1">Before we start</Text>
        <Text variant="body" tone="tertiary">
          Three things, then you are in.
        </Text>
      </View>

      <SectionHeader title="Your age" />
      <Checkbox
        checked={ageConfirmed}
        onToggle={() => setAgeConfirmed((v) => !v)}
        title="I am 18 or over"
        detail="Some features, including the automated nutrition planner, are adults only."
      />

      <SectionHeader title="Terms and privacy" />
      <Checkbox
        checked={termsAccepted}
        onToggle={() => setTermsAccepted((v) => !v)}
        title="I accept the Terms of Service"
        detail={`Version ${TERMS_VERSION}`}
      />
      <View style={styles.gap} />
      <Checkbox
        checked={privacyAccepted}
        onToggle={() => setPrivacyAccepted((v) => !v)}
        title="I accept the Privacy Policy"
        detail={`Version ${PRIVACY_VERSION}. Covers what we store, why, and how to delete it.`}
      />

      <Card style={styles.dataCard}>
        <Text variant="overline" tone="tertiary">
          What we collect
        </Text>
        <Text variant="bodySmall" tone="secondary" style={styles.dataBody}>
          Your training log, the profile details you give us, and — only if you use The
          Feed — the nutrition information you enter. You can export all of it or delete
          your account at any time from your profile.
        </Text>
        <Text variant="legal" tone="tertiary">
          We do not collect health-related data speculatively. If a field is not needed
          for something you have asked for, it is not asked for.
        </Text>
      </Card>
    </Screen>
  );
}

function Checkbox({
  checked,
  onToggle,
  title,
  detail,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  detail: string;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={title}
      accessibilityHint={detail}
      style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        <Text variant="bodySmall" tone={checked ? 'inverse' : 'tertiary'}>
          {checked ? '✓' : ''}
        </Text>
      </View>
      <View style={styles.checkboxBody}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" tone="tertiary">
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: sp.xxl, marginBottom: sp.lg, gap: sp.xs },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp.md,
    backgroundColor: colors.bg.raised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: sp.lg,
    minHeight: minTouchTarget,
  },
  gap: { height: sp.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.text.primary, borderColor: colors.text.primary },
  checkboxBody: { flex: 1, gap: sp.xxs },
  pressed: { opacity: 0.8 },
  dataCard: { marginTop: sp.xxl, gap: sp.md },
  dataBody: { marginTop: sp.xs },
});
