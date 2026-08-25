import { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { colors } from '@/design';
import { useWorkoutStore } from '@/store/workoutStore';
import { sqlitePersistence } from '@/services/storage/sqlitePersistence';
import { programmePersistence } from '@/services/storage/programmePersistence';
import { useProgrammeStore } from '@/store/programmeStore';
import { SEED_TODAY } from '@/data/seed';

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
  const setProgrammePersistence = useProgrammeStore((s) => s.setPersistence);
  const hydrateProgramme = useProgrammeStore((s) => s.hydrate);

  // Fonts are vendored into assets/fonts rather than pulled from the
  // @expo-google-fonts packages. Those packages ship every weight of the family,
  // and Metro bundles all of them — 7.9 MB of typefaces for the seven faces this
  // app uses. Referencing the files directly ships 1.7 MB instead. Both families
  // are SIL Open Font Licence; the licences sit alongside the files.
  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold: require('../assets/fonts/BarlowCondensed_600SemiBold.ttf'),
    BarlowCondensed_700Bold: require('../assets/fonts/BarlowCondensed_700Bold.ttf'),
    BarlowCondensed_800ExtraBold: require('../assets/fonts/BarlowCondensed_800ExtraBold.ttf'),
    Inter_400Regular: require('../assets/fonts/Inter_400Regular.ttf'),
    Inter_500Medium: require('../assets/fonts/Inter_500Medium.ttf'),
    Inter_600SemiBold: require('../assets/fonts/Inter_600SemiBold.ttf'),
    Inter_700Bold: require('../assets/fonts/Inter_700Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      // Restore an in-progress session before the first screen renders, so a
      // user who was killed mid-workout lands straight back in it (spec §13).
      setPersistence(sqlitePersistence);
      setProgrammePersistence(programmePersistence);
      try {
        // The programme is restored alongside the session. It rolls itself into
        // the current week on the way in, so nothing downstream ever sees last
        // week's ticks against this week's days.
        await Promise.all([hydrate(), hydrateProgramme(SEED_TODAY)]);
      } catch {
        // A storage failure must not block launch; the session is recoverable
        // on the next write, and starting fresh beats a boot loop.
      }
      setReady(true);
    }
    void prepare();
  }, [hydrate, hydrateProgramme, setPersistence, setProgrammePersistence]);

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
              {/* The landing screen is the entry point, not a tab. */}
              <Stack.Screen name="enter" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
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
              {/* Camera screens take the whole screen and own their own chrome. */}
              <Stack.Screen
                name="feed/scanner/barcode"
                options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="feed/scanner/label"
                options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen
                name="timers"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
            </Stack>
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
