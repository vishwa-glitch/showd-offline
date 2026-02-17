import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import {
  initializeNotifications,
  registerForegroundHandler,
  registerBackgroundHandler,
} from './src/services/notifications';
import { supabase } from './src/services/supabase';
import { getUser } from './src/services/database';
import { dbToUser } from './src/utils/mappers';
import { useSignIn, useSignOut, useUser } from './src/store/authStore';
import { useTriggerReminder } from './src/store/reminderStore';
import { useMissedTaskChecker } from './src/hooks/useMissedTaskChecker';
import { useTimerTick } from './src/hooks/useTimerTick';
import { useAbandonedTimerDetector } from './src/hooks/useAbandonedTimerDetector';
import { useWitnessNotifier } from './src/hooks/useWitnessNotifier';
import { useSyncOnForeground } from './src/hooks/useSyncOnForeground';
import { useRefreshAllPermissions, usePermissionStoreBase } from './src/store/permissionStore';
import { initializeTimerChannel } from './src/services/timerNotification';
// RevenueCat disabled until Play Console credentials are configured
// import { initPurchases } from './src/services/purchases';
import { useInitSubscription } from './src/store/subscriptionStore';

// Register background notification handler at module level (required by Notifee)
registerBackgroundHandler(() => {
  // Background events are handled when the app comes to foreground.
  // The foreground handler (inside the component) will pick up the trigger.
});

// Prevent splash screen from hiding automatically
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - splash screen might already be hidden
});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const triggerReminder = useTriggerReminder();
  const refreshPermissions = useRefreshAllPermissions();
  const initSubscription = useInitSubscription();
  const signIn = useSignIn();
  const signOut = useSignOut();
  const user = useUser();
  const appStateRef = useRef(AppState.currentState);

  // Supabase auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          if (user) signOut();
        } else if (event === 'SIGNED_IN' && session?.user && !user) {
          const { data: existing } = await getUser(session.user.id);
          // Only auto-sign-in if user completed BOTH profile setup (has a name)
          // AND permission onboarding. Otherwise, OTPVerifyScreen handles routing
          // through the remaining auth flow screens.
          const { onboardingPermissionsCompleted } =
            usePermissionStoreBase.getState();
          if (existing && existing.name && onboardingPermissionsCompleted) {
            signIn(dbToUser(existing));
          }
        }
      },
    );
    return () => subscription.unsubscribe();
  }, [signIn, signOut, user]);

  // Initialize subscription state (RevenueCat disabled — stubs return Pro)
  useEffect(() => {
    initSubscription().catch(() => {});
  }, [initSubscription]);

  // Sync data on app foreground
  useSyncOnForeground();

  // Check for missed tasks periodically
  useMissedTaskChecker();

  // Drive focus timer countdown globally
  useTimerTick();

  // Detect abandoned timers (paused >30 min)
  useAbandonedTimerDetector();

  // Stub SMS to active witnesses on missed/struggled events
  useWitnessNotifier();

  // Refresh permission states on mount and when app returns to foreground
  useEffect(() => {
    refreshPermissions();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        refreshPermissions();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [refreshPermissions]);

  // Initialize notifications and set up foreground handler
  useEffect(() => {
    initializeNotifications().catch(() => {});
    initializeTimerChannel().catch(() => {});

    const unsubscribe = registerForegroundHandler((taskId: string) => {
      triggerReminder(taskId);
    });

    return unsubscribe;
  }, [triggerReminder]);

  // Hide splash screen once fonts are loaded (or if there's an error)
  useEffect(() => {
    async function hideSplash() {
      if (fontsLoaded || fontError) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // Ignore errors - splash screen might already be hidden
        }
      }
    }
    hideSplash();
  }, [fontsLoaded, fontError]);

  // Show a loading state while fonts are loading
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If fonts failed to load, still render the app with system fonts
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FBF8F6', // Match splash background color
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
  },
});
