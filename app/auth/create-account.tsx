import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Screen, Text } from '@/components';
import { space as sp } from '@/design';
import { useAuthStore } from '@/store/authStore';
import { describeAuthFailure } from '@/services/auth/types';
import {
  MIN_PASSWORD_LENGTH,
  checkEmail,
  checkPassword,
  describeProblem,
} from '@/engines/auth/credentials';

/**
 * Create an account (spec §8).
 *
 * The only screen that asks for a password twice — here, and then never again
 * unless the unlock is lost. That is the trade this flow makes: one careful
 * moment now, a thumb print every day after.
 *
 * Password rules are checked as you type but only complained about once you
 * have moved on. Being told a password is too short after two characters is
 * noise, not help.
 */
export default function CreateAccountScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  const signUp = useAuthStore((s) => s.signUp);
  const busy = useAuthStore((s) => s.busy);
  const failure = useAuthStore((s) => s.failure);
  const clearFailure = useAuthStore((s) => s.clearFailure);

  const emailProblem = touchedEmail ? checkEmail(email) : null;
  const passwordProblem = touchedPassword ? checkPassword(password, email) : null;

  const submit = async () => {
    setTouchedEmail(true);
    setTouchedPassword(true);
    if (checkEmail(email) || checkPassword(password, email)) return;

    const ok = await signUp(email, password);
    if (ok) router.replace('/auth/quick-unlock');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <Button label="Create account" loading={busy} onPress={() => void submit()} />
          <Button
            label="I already have an account"
            variant="ghost"
            onPress={() => { clearFailure(); router.replace('/auth/sign-in'); }}
            style={styles.gap}
          />
        </View>
      }
    >
      <Text variant="h1" style={styles.title}>Create account</Text>
      <Text variant="body" tone="tertiary" style={styles.blurb}>
        You will type this password once. After that it is your fingerprint or a PIN.
      </Text>

      {failure ? (
        <Card marker="warning" style={styles.problem}>
          <Text variant="h3">{describeAuthFailure(failure).title}</Text>
          <Text variant="body" tone="secondary" style={styles.problemBody}>
            {describeAuthFailure(failure).detail}
          </Text>
        </Card>
      ) : null}

      <Field
        label="Email"
        value={email}
        onChangeText={(value) => { setEmail(value); setTouchedEmail(value.length > 0); clearFailure(); }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={emailProblem ? describeProblem(emailProblem) : undefined}
      />

      <View style={styles.field}>
        <Field
          label="Password"
          value={password}
          onChangeText={(value) => { setPassword(value); setTouchedPassword(value.length > 0); clearFailure(); }}
          secureTextEntry
          autoCapitalize="none"
          error={passwordProblem ? describeProblem(passwordProblem) : undefined}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters. Three random words beats one clever one.`}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: sp.xl },
  blurb: { marginTop: sp.sm, marginBottom: sp.xl },
  problem: { marginBottom: sp.lg },
  problemBody: { marginTop: sp.sm },
  field: { marginTop: sp.lg },
  footer: { paddingHorizontal: sp.lg, paddingBottom: sp.lg },
  gap: { marginTop: sp.md },
});
