import { Stack } from 'expo-router';
import { colors } from '@/design';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.base },
        // Onboarding is a forward-only flow; back is via an explicit control.
        gestureEnabled: false,
      }}
    />
  );
}
