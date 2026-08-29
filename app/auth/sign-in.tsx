import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Screen, Text } from '@/components';
import { space as sp } from '@/design';
import { useAuthStore } from '@/store/authStore';
import { describeAuthFailure } from '@/services/auth/types';
import { checkEmail, describeProblem } from '@/engines/auth/credentials';

/**
 * Sign in (spec §8).
 *
 * The password is only typed here — on a first sign-in, or after the unlock has
 * been abandoned or invalidated. Everyday launches go through the unlock screen
 * instead.
 *
 * Nothing on this screen says whether an address is registered. The failure for
 * a wrong password and for an unknown account is deliberately identical, so the
 * form cannot be used to find out who trains here.
 */
export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const signIn = useAuthStore((s) => s.signIn);
  const busy = useAuthStore((s) => s.busy);
  const failure = useAuthStore((s) => s.failure);
  const clearFailure = useAuthStore((s) => s.clearFailure);

  const emailProblem = touched ? checkEmail(email) : null;

  const submit = async () => {
    setTouched(true);
    if (checkEmail(email)) return;

    const ok = await signIn(email, password);
    if (ok) router.replace('/auth/quick-unlock');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <Button label="Sign in" loading={busy} onPress={() => void submit()} />
          <Button
            label="Create an account"
            variant="ghost"
            onPress={() => { clearFailure(); router.replace('/auth/create-account'); }}
            style={styles.gap}
          />
        </View>
      }
    >
      <Text variant="h1" style={styles.title}>Sign in</Text>
      <Text variant="body" tone="tertiary" style={styles.blurb}>
        Once you are in, you can unlock with your fingerprint or a PIN instead.
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
        onChangeText={(value) => { setEmail(value); clearFailure(); }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={emailProblem ? describeProblem(emailProblem) : undefined}
      />

      <View style={styles.field}>
        <Field
          label="Password"
          value={password}
          onChangeText={(value) => { setPassword(value); clearFailure(); }}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <Button
        label="Forgot your password?"
        variant="ghost"
        size="small"
        onPress={() => router.push('/auth/reset-password')}
        style={styles.forgot}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: sp.xl },
  blurb: { marginTop: sp.sm, marginBottom: sp.xl },
  problem: { marginBottom: sp.lg },
  problemBody: { marginTop: sp.sm },
  field: { marginTop: sp.lg },
  forgot: { marginTop: sp.md, alignSelf: 'flex-start' },
  footer: { paddingHorizontal: sp.lg, paddingBottom: sp.lg },
  gap: { marginTop: sp.md },
});
