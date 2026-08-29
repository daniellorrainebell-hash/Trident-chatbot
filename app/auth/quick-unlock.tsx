import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Screen, Text } from '@/components';
import { space as sp } from '@/design';
import { useAuthStore } from '@/store/authStore';
import { useUserStore } from '@/store/userStore';
import { nameFor } from '@/services/auth/quickUnlock';
import { PIN_LENGTH, checkPin, describeProblem } from '@/engines/auth/credentials';

/**
 * Set up the way back in (spec §8).
 *
 * Offered immediately after registration, while the reason is obvious. Asking
 * later, out of context, is how a security prompt gets dismissed.
 *
 * The biometric option only appears when the device actually has something
 * enrolled — a fingerprint button on a phone with no fingerprint registered can
 * only fail, and a failure here reads as the app being broken.
 */
export default function QuickUnlockScreen() {
  const capability = useAuthStore((s) => s.capability);
  const enableBiometric = useAuthStore((s) => s.enableBiometric);
  const enablePin = useAuthStore((s) => s.enablePin);
  const skip = useAuthStore((s) => s.skipQuickUnlock);
  const onboardingComplete = useUserStore((s) => s.onboardingComplete);

  const [pinChosen, setPinChosen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  // Not state: with nothing enrolled on the device there is only one honest
  // option, and that is a fact about the phone rather than a choice made here.
  const showPin = pinChosen || (capability !== null && !capability.biometricAvailable);

  const onward = () => router.replace(onboardingComplete ? '/kennel' : '/(onboarding)/consent');

  const enrolBiometrics = async () => {
    const enabled = await enableBiometric();
    if (enabled) onward();
    else setPinChosen(true);
  };

  const savePin = async () => {
    const rule = checkPin(pin);
    if (rule) { setProblem(describeProblem(rule)); return; }
    if (pin !== confirmation) { setProblem('Those two PINs are different.'); return; }

    const enabled = await enablePin(pin);
    if (enabled) onward();
    else setProblem('This device would not store the PIN. You can still sign in with your password.');
  };

  const biometricName = nameFor(capability?.kinds ?? []);

  return (
    <Screen edges={['top', 'bottom']}>
      <Text variant="h1" style={styles.title}>Quick unlock</Text>
      <Text variant="body" tone="tertiary" style={styles.blurb}>
        So you are not typing a password in a cold car park at six in the morning.
      </Text>

      {!showPin && capability?.biometricAvailable ? (
        <>
          <Card>
            <Text variant="h3">Use {biometricName}</Text>
            <Text variant="body" tone="secondary" style={styles.body}>
              Your phone holds the key, not us. Nothing opens without you.
            </Text>
            <Button label={`Use ${biometricName}`} onPress={() => void enrolBiometrics()} style={styles.cta} />
          </Card>

          <Button
            label="Use a PIN instead"
            variant="ghost"
            onPress={() => setPinChosen(true)}
            style={styles.gap}
          />
        </>
      ) : (
        <Card>
          <Text variant="h3">Choose a {PIN_LENGTH}-digit PIN</Text>
          <Text variant="body" tone="secondary" style={styles.body}>
            Five wrong tries and the PIN is wiped — you sign in with your password instead.
          </Text>

          <View style={styles.field}>
            <Field
              label="PIN"
              value={pin}
              onChangeText={(value) => { setPin(value.replace(/\D/g, '').slice(0, PIN_LENGTH)); setProblem(null); }}
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>
          <View style={styles.field}>
            <Field
              label="Confirm PIN"
              value={confirmation}
              onChangeText={(value) => { setConfirmation(value.replace(/\D/g, '').slice(0, PIN_LENGTH)); setProblem(null); }}
              keyboardType="number-pad"
              secureTextEntry
              error={problem ?? undefined}
            />
          </View>

          <Button label="Set PIN" onPress={() => void savePin()} style={styles.cta} />
        </Card>
      )}

      <Button
        label="Not now"
        variant="ghost"
        onPress={() => { void skip(); onward(); }}
        style={styles.gap}
      />
      <Text variant="legal" tone="tertiary" style={styles.legal}>
        Skipping means typing your password every time you open the app. You can turn quick
        unlock on later from your profile.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: sp.xl },
  blurb: { marginTop: sp.sm, marginBottom: sp.xl },
  body: { marginTop: sp.sm },
  field: { marginTop: sp.lg },
  cta: { marginTop: sp.lg },
  gap: { marginTop: sp.lg },
  legal: { marginTop: sp.md },
});
