import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentUser, onAuthStateChange } from '@/src/services/supabase';
import { initializeRevenueCat } from '@/src/services/revenuecat';
import type { User } from '@supabase/supabase-js';

// TESTING MODE: Set to true to always show onboarding flow (for testing)
// Set to false for production to use normal onboarding check
const FORCE_ONBOARDING_FOR_TESTING = false;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Check onboarding status and authentication on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user has seen onboarding
        const onboardingStatus = await AsyncStorage.getItem('onboardingComplete_v2');
        const hasOnboarded = onboardingStatus === 'true';
        setHasSeenOnboarding(hasOnboarded);

        // Get initial user
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        setIsLoading(false);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeApp();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed in root layout:', event);
      setUser(session?.user ?? null);

      // Initialize RevenueCat when user signs in
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          await initializeRevenueCat(session.user.id);
          console.log('RevenueCat initialized for user:', session.user.id);
        } catch (error) {
          console.error('Failed to initialize RevenueCat:', error);
        }
      }

      // Update onboarding status when checking again (with small delay to ensure AsyncStorage write completes)
      setTimeout(() => {
        AsyncStorage.getItem('onboardingComplete_v2').then((status) => {
          setHasSeenOnboarding(status === 'true');
        });
      }, 100);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Handle navigation based on onboarding and auth state
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const checkAndNavigate = async () => {
      // Re-check AsyncStorage to ensure we have the latest value
      const onboardingStatus = await AsyncStorage.getItem('onboardingComplete_v2');
      const hasOnboarded = FORCE_ONBOARDING_FOR_TESTING ? false : onboardingStatus === 'true';

      // Update state if it changed
      if (hasOnboarded !== hasSeenOnboarding) {
        setHasSeenOnboarding(hasOnboarded);
      }

      const inWelcomeScreen = segments[0] === 'welcome';
      const inOnboardingGroup = segments[0] === 'onboarding';
      const inAuthGroup = segments[0] === 'auth';
      const inTabsGroup = segments[0] === '(tabs)';
      const inUploadScreen = segments[0] === 'upload';
      const inRecipeScreen = segments[0] === 'recipe';
      const inPaywallScreen = segments[0] === 'paywall';

      console.log('Navigation check:', {
        hasOnboarded,
        hasOnboardedFromState: hasSeenOnboarding,
        user: !!user,
        segments,
        testMode: FORCE_ONBOARDING_FOR_TESTING,
        onboardingStatusRaw: onboardingStatus
      });

      // Priority 1: If user hasn't seen onboarding, redirect to welcome screen
      if (!hasOnboarded && !inWelcomeScreen && !inOnboardingGroup && !inAuthGroup) {
        console.log('Redirecting to welcome screen - no onboarding completed');
        router.replace('/welcome');
        return;
      }

      // Priority 2: If logged in but in auth/onboarding/welcome screens, redirect to main app
      // BUT: Skip this redirect if we're in testing mode (to allow viewing welcome screen)
      if (user && (inWelcomeScreen || inOnboardingGroup || inAuthGroup) && !FORCE_ONBOARDING_FOR_TESTING) {
        console.log('User logged in, redirecting to main app from auth flow');
        router.replace('/(tabs)');
        return;
      }

      // Priority 3: If not logged in but trying to access protected screens, redirect to welcome
      if (!user && (inTabsGroup || inUploadScreen || inRecipeScreen || inPaywallScreen)) {
        console.log('Not logged in, redirecting to welcome');
        router.replace('/welcome');
        return;
      }
    };

    checkAndNavigate();
  }, [user, segments, isLoading, hasSeenOnboarding, isInitialized]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E07A5F" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/how-it-works" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/personal-info" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/preferences" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
          <Stack.Screen name="upload" options={{ headerShown: false }} />
          <Stack.Screen name="recipe" options={{ headerShown: false }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
