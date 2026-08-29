import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Screen, Text } from '@/components';
import { space as sp } from '@/design';
import { useAuthStore } from '@/store/authStore';
import { nameFor } from '@/services/auth/quickUnlock';
import { PIN_LENGTH } from '@/engines/auth/credentials';
import { FRESH_LOCKOUT, describeAttempt, type LockoutState } from '@/engines/auth/lockout';

/**
 * The everyday way in (spec §8).
 *
 * On the biometric path this screen barely exists: the prompt fires on mount
 * and a successful thumb print goes straight through. It only becomes a screen
 * when something needs saying — a cancelled prompt, a wrong PIN, a lockout.
 *
 * There is always a way out to the password. An unlock that can fail without an
 * escape is an uninstall.
 */
export default function UnlockScreen() {
  const mode = useAuthStore((s) => s.unlockMode);
  const capability = useAuthStore((s) => s.capability);
  const unlockBiometric = useAuthStore((s) => s.unlockBiometric);
  const unlockPin = useAuthStore((s) => s.unlockPin);
  const abandon = useAuthStore((s) => s.abandonUnlock);
  const busy = useAuthStore((s) => s.busy);

  const [pin, setPin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [lockout, setLockout] = useState<LockoutState>(FRESH_LOCKOUT);
  const [prompting, setPrompting] = useState(false);
  // The OS prompt is fired once per visit. Without this, any re-render that
  // re-ran the effect would put a second system dialog on top of the first.
  const prompted = useRef(false);

  const toPassword = useCallback(async () => {
    await abandon();
    router.replace('/auth/sign-in');
  }, [abandon]);

  const tryBiometrics = useCallback(async () => {
    setPrompting(true);
    const result = await unlockBiometric();
    setPrompting(false);

    if (result.ok) { router.replace('/kennel'); return; }

    if (result.failure === 'KEY_INVALIDATED') {
      // The fingerprints on this phone changed, so the OS threw the key away.
      // That is not a lockout and must not read like one.
      setMessage('Your phone’s biometrics changed, so the saved key was cleared. Sign in once more to set it up again.');
      return;
    }
    if (result.failure === 'NOTHING_STORED') { void toPassword(); return; }
    setMessage(null);
  }, [unlockBiometric, toPassword]);

  // Fire the prompt on arrival: the common case is one thumb press and in.
  // Deferred out of the effect body so the first render is not a cascade.
  useEffect(() => {
    if (mode !== 'biometric' || prompted.current) return;
    prompted.current = true;
    const id = setTimeout(() => void tryBiometrics(), 0);
    return () => clearTimeout(id);
  }, [mode, tryBiometrics]);

  const submitPin = async () => {
    const result = await unlockPin(pin);
    setPin('');

    if (result.ok) { router.replace('/kennel'); return; }

    if (result.failure === 'LOCKED_OUT') {
      setMessage('Too many attempts. Sign in with your password to continue.');
      return;
    }
    if (result.failure === 'WRONG_PIN') {
      const next: LockoutState = { failedAttempts: lockout.failedAttempts + 1 };
      setLockout(next);
      setMessage(describeAttempt(next));
      return;
    }
    void toPassword();
  };

  const biometricName = nameFor(capability?.kinds ?? []);

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <Button label="Use my password instead" variant="ghost" onPress={() => void toPassword()} />
        </View>
      }
    >
      <Text variant="h1" style={styles.title}>Welcome back</Text>

      {message ? (
        <Card marker="warning" style={styles.problem}>
          <Text variant="body" tone="secondary">{message}</Text>
        </Card>
      ) : null}

      {mode === 'biometric' ? (
        <Card>
          <Text variant="h3">Unlock with {biometricName}</Text>
          <Text variant="body" tone="secondary" style={styles.body}>
            {prompting ? 'Waiting for you…' : 'Tap below to try again.'}
          </Text>
          <Button
            label={`Unlock with ${biometricName}`}
            loading={busy || prompting}
            onPress={() => void tryBiometrics()}
            style={styles.cta}
          />
        </Card>
      ) : (
        <Card>
          <Text variant="h3">Enter your PIN</Text>
          <View style={styles.field}>
            <Field
              label="PIN"
              value={pin}
              onChangeText={(value) => setPin(value.replace(/\D/g, '').slice(0, PIN_LENGTH))}
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>
          <Button
            label="Unlock"
            loading={busy}
            onPress={() => void submitPin()}
            style={styles.cta}
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: sp.xl, marginBottom: sp.xl },
  problem: { marginBottom: sp.lg },
  body: { marginTop: sp.sm },
  field: { marginTop: sp.lg },
  cta: { marginTop: sp.lg },
  footer: { paddingHorizontal: sp.lg, paddingBottom: sp.lg },
});
