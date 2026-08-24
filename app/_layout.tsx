import { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
} from '@expo-google-fonts/barlow-condensed';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { View } from 'react-native';
import { colors } from '@/design';
import { useWorkoutStore } from '@/store/workoutStore';
import { sqlitePersistence } from '@/services/storage/sqlitePersistence';

// Held until fonts are ready, so the first frame is not unstyled text.
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The gym is a bad network. Serve cached data rather than a spinner.
      staleTime: 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const setPersistence = useWorkoutStore((s) => s.setPersistence);
  const hydrate = useWorkoutStore((s) => s.hydrate);

  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      // Restore an in-progress session before the first screen renders, so a
      // user who was killed mid-workout lands straight back in it (spec §13).
      setPersistence(sqlitePersistence);
      try {
        await hydrate();
      } catch {
        // A storage failure must not block launch; the session is recoverable
        // on the next write, and starting fresh beats a boot loop.
      }
      setReady(true);
    }
    void prepare();
  }, [hydrate, setPersistence]);

  const onLayout = useCallback(() => {
    if (fontsLoaded && ready) {
      // Fast hand-off. No forced brand animation on every launch (spec §79).
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, ready]);

  if (!fontsLoaded || !ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg.base },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="workout/active"
                options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
              />
              <Stack.Screen
                name="workout/complete"
                options={{ animation: 'fade', gestureEnabled: false }}
              />
              <Stack.Screen
                name="workout/exercise-picker"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
            </Stack>
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
