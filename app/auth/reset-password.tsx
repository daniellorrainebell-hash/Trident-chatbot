import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Screen, Text } from '@/components';
import { space as sp } from '@/design';
import { useAuthStore } from '@/store/authStore';
import { checkEmail, describeProblem } from '@/engines/auth/credentials';

/**
 * Password reset (spec §8).
 *
 * The confirmation is identical whether or not the address has an account.
 * "No account with that email" is a free lookup service for anyone who wants
 * to know who trains here.
 */
export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);

  const request = useAuthStore((s) => s.requestPasswordReset);
  const busy = useAuthStore((s) => s.busy);

  const problem = touched ? checkEmail(email) : null;

  const submit = async () => {
    setTouched(true);
    if (checkEmail(email)) return;
    if (await request(email)) setSent(true);
  };

  if (sent) {
    return (
      <Screen edges={['top', 'bottom']}>
        <Text variant="h1" style={styles.title}>Check your email</Text>
        <Card style={styles.card}>
          <Text variant="body" tone="secondary">
            If there is an account for {email.trim()}, a reset link is on its way. It expires in
            an hour.
          </Text>
        </Card>
        <Button
          label="Back to sign in"
          onPress={() => router.replace('/auth/sign-in')}
          style={styles.gap}
        />
      </Screen>
    );
  }

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <Button label="Send reset link" loading={busy} onPress={() => void submit()} />
          <Button
            label="Back"
            variant="ghost"
            onPress={() => router.back()}
            style={styles.gap}
          />
        </View>
      }
    >
      <Text variant="h1" style={styles.title}>Reset password</Text>
      <Text variant="body" tone="tertiary" style={styles.blurb}>
        We will email you a link to set a new one.
      </Text>

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={problem ? describeProblem(problem) : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: sp.xl },
  blurb: { marginTop: sp.sm, marginBottom: sp.xl },
  card: { marginTop: sp.lg },
  gap: { marginTop: sp.lg },
  footer: { paddingHorizontal: sp.lg, paddingBottom: sp.lg },
});
