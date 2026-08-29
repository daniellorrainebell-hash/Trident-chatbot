import { Stack } from 'expo-router';
import { colors } from '@/design';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.base },
        // Nothing here should be swipe-dismissible: a half-dismissed unlock
        // leaves the app in a state with no way forward.
        gestureEnabled: false,
      }}
    />
  );
}
